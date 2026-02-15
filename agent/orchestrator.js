const fs = require('fs');
const path = require('path');
const { WORKFLOW_ORDER, getAgent } = require('./agents');
const { getToolsForRole, executeTool } = require('./tools');
const { createProvider } = require('./llm-provider');
const {
  buildUserMessage,
  compressContext,
  formatToolResult,
  buildToolResultMessage,
  buildAssistantToolUseMessage,
} = require('./context-builder');
const Logger = require('../lib/logger');

/** Write tools that require safety gate checks before execution */
const WRITE_TOOLS = new Set(['write_abap_source', 'activate_object']);

/**
 * AgentResult - Formats agent output for terminal or markdown display
 */
class AgentResult {
  constructor(data) {
    this.role = data.role;
    this.title = data.title;
    this.sections = data.sections || [];
    this.duration = data.duration || null;
    this.usage = data.usage || null;
  }

  toTerminal() {
    const lines = [];
    const width = 60;

    lines.push('');
    lines.push('='.repeat(width));
    lines.push(`  ${this.title}`);
    lines.push(`  Agent: ${this.role.toUpperCase()}`);
    if (this.duration) {
      lines.push(`  Duration: ${this.duration}`);
    }
    if (this.usage) {
      lines.push(`  Tokens: ${this.usage.inputTokens} in / ${this.usage.outputTokens} out`);
    }
    lines.push('='.repeat(width));
    lines.push('');

    for (const section of this.sections) {
      lines.push('-'.repeat(width));
      lines.push(`  ${section.heading}`);
      lines.push('-'.repeat(width));

      if (section.table) {
        lines.push(this._formatTerminalTable(section.table));
      }
      if (section.content) {
        const contentLines = section.content.split('\n');
        for (const line of contentLines) {
          lines.push(`  ${line}`);
        }
      }
      lines.push('');
    }

    lines.push('='.repeat(width));
    return lines.join('\n');
  }

  toMarkdown() {
    const lines = [];

    lines.push(`## ${this.title}`);
    lines.push('');
    lines.push(`**Agent:** ${this.role}`);
    if (this.duration) {
      lines.push(`**Duration:** ${this.duration}`);
    }
    if (this.usage) {
      lines.push(`**Tokens:** ${this.usage.inputTokens} in / ${this.usage.outputTokens} out`);
    }
    lines.push('');

    for (const section of this.sections) {
      lines.push(`### ${section.heading}`);
      lines.push('');

      if (section.table) {
        lines.push(this._formatMarkdownTable(section.table));
        lines.push('');
      }
      if (section.content) {
        lines.push(section.content);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  _formatTerminalTable(table) {
    const { headers, rows } = table;
    const colWidths = headers.map((h, i) => {
      const maxData = rows.reduce((max, row) => Math.max(max, (row[i] || '').length), 0);
      return Math.max(h.length, maxData) + 2;
    });

    const lines = [];
    const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join('| ');
    lines.push(`  ${headerLine}`);
    lines.push(`  ${colWidths.map((w) => '-'.repeat(w)).join('+-')}`);

    for (const row of rows) {
      const rowLine = row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join('| ');
      lines.push(`  ${rowLine}`);
    }

    return lines.join('\n');
  }

  _formatMarkdownTable(table) {
    const { headers, rows } = table;
    const lines = [];

    lines.push('| ' + headers.join(' | ') + ' |');
    lines.push('| ' + headers.map(() => '---').join(' | ') + ' |');
    for (const row of rows) {
      lines.push('| ' + row.join(' | ') + ' |');
    }

    return lines.join('\n');
  }
}


/**
 * Orchestrator - Multi-agent workflow engine
 *
 * Sequences agents through the ABAP development workflow.
 * In mock mode, returns pre-built outputs from mock-responses.json.
 * In live mode, calls the configured LLM provider with agent system prompts
 * and tool-use loop for interactive SAP development.
 */
class Orchestrator {
  constructor(options = {}) {
    this.mode = options.apiKey ? 'live' : 'mock';
    this.apiKey = options.apiKey || null;
    this.verbose = options.verbose || false;
    this.gateway = options.gateway || null;
    this.safetyGates = options.safetyGates || null;
    this.provider = options.provider || null;
    this.maxIterations = options.maxIterations || 25;
    this.contextBudget = options.contextBudget || 100000;
    this.mockData = null;
    this.logger = new Logger('orchestrator', { level: options.logLevel || 'info' });

    // Token usage tracking across all agents in a session
    this._totalUsage = { inputTokens: 0, outputTokens: 0 };
  }

  /**
   * Get or create the LLM provider for live mode.
   * Lazy-initialized to avoid requiring API key in mock mode.
   */
  _getProvider() {
    if (!this.provider) {
      this.provider = createProvider({ apiKey: this.apiKey });
    }
    return this.provider;
  }

  /** Load mock agent outputs */
  _loadMockOutputs() {
    if (!this.mockData) {
      const mockPath = path.join(__dirname, 'mock-responses.json');
      const raw = fs.readFileSync(mockPath, 'utf8');
      this.mockData = JSON.parse(raw);
    }
    return this.mockData.agentOutputs;
  }

  _log(msg) {
    this.logger.info(msg);
  }

  /** Get cumulative token usage for the session */
  getTotalUsage() {
    return { ...this._totalUsage };
  }

  /**
   * Run a command (single agent or workflow)
   * @param {string} command - CLI command (analyze, design, generate, test, review, workflow)
   * @param {string} requirement - The user's requirement text
   * @returns {AgentResult|AgentResult[]}
   */
  async run(command, requirement) {
    if (command === 'workflow') {
      return this.runWorkflow(requirement);
    }
    return this.runSingleAgent(command, requirement);
  }

  /**
   * Run a single agent stage
   * @param {string} command - CLI command or role name
   * @param {string} requirement - The user's requirement text
   * @param {object} [context] - Previous agent output (for chaining)
   * @returns {AgentResult}
   */
  async runSingleAgent(command, requirement, context) {
    const agent = getAgent(command);
    if (!agent) {
      throw new Error(`Unknown agent command: ${command}`);
    }

    this._log(`Running ${agent.name} agent...`);

    if (this.mode === 'live') {
      return this._runLiveAgent(agent, requirement, context);
    }
    return this._runMockAgent(agent, requirement);
  }

  /**
   * Run the full 5-stage workflow
   * @param {string} requirement - The user's requirement text
   * @returns {AgentResult[]}
   */
  async runWorkflow(requirement) {
    this._log('Starting full workflow pipeline...');
    const results = [];
    let context = null;

    for (const role of WORKFLOW_ORDER) {
      const result = await this.runSingleAgent(role, requirement, context);
      results.push(result);
      context = result;
    }

    this._log(`Workflow complete. Total tokens: ${this._totalUsage.inputTokens} in / ${this._totalUsage.outputTokens} out`);
    return results;
  }

  /**
   * Mock agent execution - returns pre-built outputs
   */
  _runMockAgent(agent, requirement) {
    const outputs = this._loadMockOutputs();
    const output = outputs[agent.role];

    if (!output) {
      throw new Error(`No mock output for agent role: ${agent.role}`);
    }

    return new AgentResult({
      role: agent.role,
      title: output.title,
      sections: output.sections,
      duration: '0.1s (mock)',
    });
  }

  /**
   * Live agent execution — calls LLM provider with tool-use loop.
   *
   * Flow:
   *   1. Build system + user messages from agent definition and requirement
   *   2. Call LLM with agent's allowed tools
   *   3. If LLM returns tool_use: execute tools via gateway, append results, loop
   *   4. If LLM returns text: parse into AgentResult, return
   *   5. Safety gates checked before write tool execution
   */
  async _runLiveAgent(agent, requirement, context) {
    const startTime = Date.now();
    const provider = this._getProvider();
    const tools = getToolsForRole(agent.tools);
    const agentUsage = { inputTokens: 0, outputTokens: 0 };

    // Build initial conversation
    const messages = [
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: buildUserMessage(requirement, context) },
    ];

    this.logger.debug(`${agent.name}: starting live execution with ${tools.length} tools`);

    let iteration = 0;

    while (iteration < this.maxIterations) {
      iteration++;

      // Compress context if approaching budget
      const compressed = compressContext(messages, this.contextBudget);

      // Call LLM
      const response = await provider.complete(compressed, tools);

      // Track token usage
      agentUsage.inputTokens += response.usage.inputTokens;
      agentUsage.outputTokens += response.usage.outputTokens;

      this.logger.debug(`${agent.name}: iteration ${iteration}, stop=${response.stopReason}, tools=${response.hasToolCalls}`);

      // If text-only response, we're done
      if (!response.hasToolCalls) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        this._totalUsage.inputTokens += agentUsage.inputTokens;
        this._totalUsage.outputTokens += agentUsage.outputTokens;

        return this._parseAgentOutput(agent, response.text, elapsed, agentUsage);
      }

      // Process tool calls
      // Add assistant message with tool calls to conversation
      messages.push(buildAssistantToolUseMessage(response.toolCalls, response.text));

      for (const toolCall of response.toolCalls) {
        const result = await this._executeToolWithSafety(agent, toolCall);
        const formatted = formatToolResult(toolCall.name, result);
        messages.push(buildToolResultMessage(toolCall.id, formatted));
      }
    }

    // Max iterations reached — return what we have
    this.logger.warn(`${agent.name}: max iterations (${this.maxIterations}) reached`);
    this._totalUsage.inputTokens += agentUsage.inputTokens;
    this._totalUsage.outputTokens += agentUsage.outputTokens;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    return new AgentResult({
      role: agent.role,
      title: `${agent.name} Output (max iterations reached)`,
      sections: [{ heading: 'Note', content: `Agent reached ${this.maxIterations} iteration limit. Partial results may be available.` }],
      duration: `${elapsed}s (live)`,
      usage: agentUsage,
    });
  }

  /**
   * Execute a tool call, applying safety gates for write operations.
   */
  async _executeToolWithSafety(agent, toolCall) {
    const { name, input } = toolCall;

    // Safety gate check for write operations
    if (WRITE_TOOLS.has(name) && this.safetyGates) {
      this.logger.debug(`Safety gate check for ${name}`);
      try {
        const artifact = {
          name: input.object_name || 'unknown',
          type: this._mapToolToArtifactType(input.object_type),
          source: input.source || '',
          transport: input.transport || null,
        };
        const gateResult = await this.safetyGates.evaluate(artifact);

        if (gateResult.approved === false) {
          this.logger.warn(`Safety gate BLOCKED ${name}: ${gateResult.summary || 'gate failed'}`);
          return {
            error: `Safety gate blocked: ${gateResult.failures?.map((f) => f.message).join('; ') || 'validation failed'}`,
          };
        }
      } catch (err) {
        this.logger.warn(`Safety gate error for ${name}: ${err.message}`);
        // Don't block on gate errors in non-strict mode — log and continue
      }
    }

    // Execute via gateway
    if (!this.gateway) {
      return { error: 'No SAP gateway configured. Tool execution unavailable.' };
    }

    try {
      return await executeTool(name, input, this.gateway);
    } catch (err) {
      this.logger.error(`Tool execution failed: ${name}`, { error: err.message });
      return { error: `Tool ${name} failed: ${err.message}` };
    }
  }

  /**
   * Map ABAP object type code to safety gate artifact type.
   */
  _mapToolToArtifactType(objectType) {
    const map = {
      CLAS: 'class',
      INTF: 'interface',
      FUGR: 'function_module',
      PROG: 'program',
      TABL: 'configuration',
      DTEL: 'configuration',
    };
    return map[objectType] || 'program';
  }

  /**
   * Parse LLM text output into a structured AgentResult.
   * Attempts to extract sections from markdown-formatted output.
   */
  _parseAgentOutput(agent, text, elapsed, usage) {
    if (!text) {
      return new AgentResult({
        role: agent.role,
        title: `${agent.name} Output`,
        sections: [{ heading: 'Result', content: '(no output)' }],
        duration: `${elapsed}s (live)`,
        usage,
      });
    }

    const sections = this._extractSections(text);

    // Use first heading as title, or generate one
    let title = `${agent.name} Output`;
    if (sections.length > 0 && sections[0].heading) {
      title = sections[0].heading;
      // Remove the title section if it has no content
      if (!sections[0].content && !sections[0].table) {
        sections.shift();
      }
    }

    return new AgentResult({
      role: agent.role,
      title,
      sections: sections.length > 0 ? sections : [{ heading: 'Output', content: text }],
      duration: `${elapsed}s (live)`,
      usage,
    });
  }

  /**
   * Extract markdown sections from LLM output text.
   */
  _extractSections(text) {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = null;
    let contentLines = [];

    for (const line of lines) {
      const headingMatch = line.match(/^#{1,3}\s+(.+)/);
      if (headingMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.content = contentLines.join('\n').trim();
          if (currentSection.content || currentSection.table) {
            sections.push(currentSection);
          }
        }
        currentSection = { heading: headingMatch[1].trim() };
        contentLines = [];
      } else if (currentSection) {
        // Check for table rows
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
          if (!currentSection.table) {
            currentSection.table = this._parseMarkdownTable(lines, lines.indexOf(line));
          }
        } else {
          contentLines.push(line);
        }
      } else {
        // Content before first heading
        contentLines.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = contentLines.join('\n').trim();
      if (currentSection.content || currentSection.table) {
        sections.push(currentSection);
      }
    }

    // If no sections found, wrap all content as one section
    if (sections.length === 0 && text.trim()) {
      sections.push({ heading: 'Output', content: text.trim() });
    }

    return sections;
  }

  /**
   * Parse a markdown table starting at the given line index.
   */
  _parseMarkdownTable(lines, startIdx) {
    const tableLines = [];
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        tableLines.push(line);
      } else if (tableLines.length > 0) {
        break;
      }
    }

    if (tableLines.length < 2) return null;

    const parseLine = (line) =>
      line.split('|').slice(1, -1).map((cell) => cell.trim());

    const headers = parseLine(tableLines[0]);
    // Skip separator line (index 1)
    const rows = tableLines.slice(2).map(parseLine);

    return { headers, rows };
  }
}

module.exports = { Orchestrator, AgentResult };
