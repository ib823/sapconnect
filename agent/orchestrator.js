const fs = require('fs');
const path = require('path');
const { WORKFLOW_ORDER, getAgent } = require('./agents');

/**
 * AgentResult - Formats agent output for terminal or markdown display
 */
class AgentResult {
  constructor(data) {
    this.role = data.role;
    this.title = data.title;
    this.sections = data.sections || [];
    this.duration = data.duration || null;
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
 * In live mode (future), will call the Claude API with agent system prompts.
 */
class Orchestrator {
  constructor(options = {}) {
    this.mode = options.apiKey ? 'live' : 'mock';
    this.apiKey = options.apiKey || null;
    this.verbose = options.verbose || false;
    this.gateway = options.gateway || null;
    this.mockData = null;
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
    if (this.verbose) {
      console.log(`  [orchestrator] ${msg}`);
    }
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

    this._log('Workflow complete.');
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
   * Live agent execution - calls Claude API (not yet implemented)
   */
  async _runLiveAgent(agent, requirement, context) {
    console.log(`  [orchestrator] Live mode requires ANTHROPIC_API_KEY.`);
    console.log('  [orchestrator] To implement, add Claude API calls:');
    console.log('    - npm install @anthropic-ai/sdk');
    console.log('    - Use agent.systemPrompt as the system message');
    console.log('    - Pass requirement + context as user message');
    console.log('    - Register agent.tools for function calling');
    console.log('    - Route tool calls through SapGateway');
    console.log('  [orchestrator] Falling back to mock output.\n');
    return this._runMockAgent(agent, requirement);
  }
}

module.exports = { Orchestrator, AgentResult };
