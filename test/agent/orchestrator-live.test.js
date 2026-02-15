const { Orchestrator, AgentResult } = require('../../agent/orchestrator');
const { LLMResponse } = require('../../agent/llm-provider');

/**
 * Mock LLM provider that returns pre-configured responses.
 * Simulates text-only, tool-use, and multi-turn conversations.
 */
class MockLLMProvider {
  constructor(responses) {
    this._responses = responses;
    this._callIndex = 0;
    this.calls = [];
  }

  get providerName() { return 'mock'; }

  async complete(messages, tools, options) {
    this.calls.push({ messages, tools, options });
    const response = this._responses[this._callIndex] || this._responses[this._responses.length - 1];
    this._callIndex++;
    return response;
  }
}

/**
 * Mock SAP gateway for tool execution.
 */
class MockGateway {
  constructor() {
    this.calls = [];
  }

  async readAbapSource(objectName, objectType) {
    this.calls.push({ tool: 'readAbapSource', objectName, objectType });
    return {
      object_name: objectName,
      object_type: objectType || 'CLAS',
      package: 'ZTEST',
      source: 'CLASS ' + objectName + ' DEFINITION.\nENDCLASS.',
    };
  }

  async writeAbapSource(objectName, source, objectType, pkg) {
    this.calls.push({ tool: 'writeAbapSource', objectName, source });
    return { object_name: objectName, status: 'created' };
  }

  async listObjects(pkg) {
    this.calls.push({ tool: 'listObjects', pkg });
    return { package: pkg, objects: [{ type: 'CLAS', name: 'ZCL_TEST' }] };
  }

  async searchRepository(query) {
    this.calls.push({ tool: 'searchRepository', query });
    return { results: [{ type: 'CLAS', name: 'ZCL_MATCH', description: 'Match' }] };
  }

  async getDataDictionary(name) {
    this.calls.push({ tool: 'getDataDictionary', name });
    return { name, type: 'TABLE', fields: [{ name: 'FIELD1', type: 'CHAR' }] };
  }

  async activateObject(name) {
    this.calls.push({ tool: 'activateObject', name });
    return { object_name: name, status: 'active' };
  }

  async runUnitTests(name) {
    this.calls.push({ tool: 'runUnitTests', name });
    return { summary: { passed: 3, failed: 0, skipped: 0 } };
  }

  async runSyntaxCheck(name) {
    this.calls.push({ tool: 'runSyntaxCheck', name });
    return { status: 'clean', errors: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Mode: Text-only response
// ─────────────────────────────────────────────────────────────────────────────

describe('Orchestrator live mode', () => {
  it('should handle text-only LLM response', async () => {
    const mockProvider = new MockLLMProvider([
      new LLMResponse({
        stopReason: 'end_turn',
        text: '## Scope Analysis\n\nThis is a vendor rating module.\n\n### Affected Objects\n\nZCL_VENDOR_RATING',
        usage: { inputTokens: 100, outputTokens: 50 },
      }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: mockProvider,
      gateway: new MockGateway(),
      logLevel: 'error',
    });

    const result = await orch.run('analyze', 'Create vendor rating report');

    expect(result).toBeInstanceOf(AgentResult);
    expect(result.role).toBe('planner');
    expect(result.duration).toContain('live');
    expect(result.usage.inputTokens).toBe(100);
    expect(result.usage.outputTokens).toBe(50);
    expect(mockProvider.calls).toHaveLength(1);
  });

  it('should handle tool-use then text response', async () => {
    const gateway = new MockGateway();
    const mockProvider = new MockLLMProvider([
      // First response: tool call
      new LLMResponse({
        stopReason: 'tool_use',
        text: 'Let me read the source.',
        toolCalls: [{ id: 'toolu_1', name: 'read_abap_source', input: { object_name: 'ZCL_TEST' } }],
        usage: { inputTokens: 200, outputTokens: 30 },
      }),
      // Second response: text after tool result
      new LLMResponse({
        stopReason: 'end_turn',
        text: '## Analysis\n\nThe class is well-structured.',
        usage: { inputTokens: 300, outputTokens: 80 },
      }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: mockProvider,
      gateway,
      logLevel: 'error',
    });

    const result = await orch.run('analyze', 'Analyze ZCL_TEST');

    expect(result).toBeInstanceOf(AgentResult);
    expect(result.role).toBe('planner');
    expect(result.usage.inputTokens).toBe(500);
    expect(result.usage.outputTokens).toBe(110);
    expect(gateway.calls).toHaveLength(1);
    expect(gateway.calls[0].tool).toBe('readAbapSource');
    expect(gateway.calls[0].objectName).toBe('ZCL_TEST');
    expect(mockProvider.calls).toHaveLength(2);
  });

  it('should handle multiple tool calls in one response', async () => {
    const gateway = new MockGateway();
    const mockProvider = new MockLLMProvider([
      new LLMResponse({
        stopReason: 'tool_use',
        toolCalls: [
          { id: 'tc1', name: 'read_abap_source', input: { object_name: 'ZCL_A' } },
          { id: 'tc2', name: 'get_data_dictionary', input: { object_name: 'ZTABLE' } },
        ],
        usage: { inputTokens: 150, outputTokens: 40 },
      }),
      new LLMResponse({
        stopReason: 'end_turn',
        text: '## Design\n\nBoth objects reviewed.',
        usage: { inputTokens: 250, outputTokens: 60 },
      }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: mockProvider,
      gateway,
      logLevel: 'error',
    });

    const result = await orch.run('design', 'Design vendor module');

    expect(result).toBeInstanceOf(AgentResult);
    expect(gateway.calls).toHaveLength(2);
    expect(gateway.calls[0].tool).toBe('readAbapSource');
    expect(gateway.calls[1].tool).toBe('getDataDictionary');
  });

  it('should enforce maxIterations limit', async () => {
    // Provider always returns tool calls, never text
    const infiniteToolCalls = new MockLLMProvider([
      new LLMResponse({
        stopReason: 'tool_use',
        toolCalls: [{ id: 'tc1', name: 'search_repository', input: { query: 'vendor' } }],
        usage: { inputTokens: 50, outputTokens: 20 },
      }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: infiniteToolCalls,
      gateway: new MockGateway(),
      maxIterations: 3,
      logLevel: 'error',
    });

    const result = await orch.run('analyze', 'Loop forever');

    expect(result).toBeInstanceOf(AgentResult);
    expect(result.title).toContain('max iterations');
    expect(infiniteToolCalls.calls.length).toBe(3);
  });

  it('should handle tool execution errors gracefully', async () => {
    const failingGateway = {
      readAbapSource: vi.fn().mockRejectedValue(new Error('Connection refused')),
    };

    const mockProvider = new MockLLMProvider([
      new LLMResponse({
        stopReason: 'tool_use',
        toolCalls: [{ id: 'tc1', name: 'read_abap_source', input: { object_name: 'ZCL_BAD' } }],
        usage: { inputTokens: 100, outputTokens: 20 },
      }),
      new LLMResponse({
        stopReason: 'end_turn',
        text: '## Error Report\n\nCould not read source.',
        usage: { inputTokens: 150, outputTokens: 30 },
      }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: mockProvider,
      gateway: failingGateway,
      logLevel: 'error',
    });

    const result = await orch.run('analyze', 'Analyze bad object');
    expect(result).toBeInstanceOf(AgentResult);
    // The tool error should have been passed back to the LLM
    expect(mockProvider.calls).toHaveLength(2);
  });

  it('should return error when no gateway configured', async () => {
    const mockProvider = new MockLLMProvider([
      new LLMResponse({
        stopReason: 'tool_use',
        toolCalls: [{ id: 'tc1', name: 'read_abap_source', input: { object_name: 'ZCL_TEST' } }],
        usage: { inputTokens: 100, outputTokens: 20 },
      }),
      new LLMResponse({
        stopReason: 'end_turn',
        text: 'No gateway available.',
        usage: { inputTokens: 150, outputTokens: 10 },
      }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: mockProvider,
      gateway: null,
      logLevel: 'error',
    });

    const result = await orch.run('analyze', 'Test');
    expect(result).toBeInstanceOf(AgentResult);
  });

  it('should handle null text from LLM', async () => {
    const mockProvider = new MockLLMProvider([
      new LLMResponse({
        stopReason: 'end_turn',
        text: null,
        usage: { inputTokens: 50, outputTokens: 0 },
      }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: mockProvider,
      gateway: new MockGateway(),
      logLevel: 'error',
    });

    const result = await orch.run('analyze', 'Empty response test');
    expect(result).toBeInstanceOf(AgentResult);
    expect(result.sections[0].content).toContain('no output');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Live Mode: Safety gates
// ─────────────────────────────────────────────────────────────────────────────

describe('Orchestrator safety gates', () => {
  it('should block write tools when safety gate fails', async () => {
    const mockGates = {
      evaluate: vi.fn().mockResolvedValue({
        approved: false,
        failures: [{ message: 'Naming convention violation' }],
      }),
    };

    const mockProvider = new MockLLMProvider([
      new LLMResponse({
        stopReason: 'tool_use',
        toolCalls: [{ id: 'tc1', name: 'write_abap_source', input: { object_name: 'BAD_NAME', source: 'DATA x.' } }],
        usage: { inputTokens: 100, outputTokens: 20 },
      }),
      new LLMResponse({
        stopReason: 'end_turn',
        text: '## Result\n\nWrite was blocked by safety gate.',
        usage: { inputTokens: 200, outputTokens: 30 },
      }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: mockProvider,
      gateway: new MockGateway(),
      safetyGates: mockGates,
      logLevel: 'error',
    });

    const result = await orch.run('generate', 'Generate bad code');
    expect(result).toBeInstanceOf(AgentResult);
    expect(mockGates.evaluate).toHaveBeenCalledTimes(1);
  });

  it('should allow write tools when safety gate passes', async () => {
    const gateway = new MockGateway();
    const mockGates = {
      evaluate: vi.fn().mockResolvedValue({ approved: true }),
    };

    const mockProvider = new MockLLMProvider([
      new LLMResponse({
        stopReason: 'tool_use',
        toolCalls: [{ id: 'tc1', name: 'write_abap_source', input: { object_name: 'ZCL_GOOD', source: 'CLASS zcl_good.' } }],
        usage: { inputTokens: 100, outputTokens: 20 },
      }),
      new LLMResponse({
        stopReason: 'end_turn',
        text: '## Done\n\nCode written.',
        usage: { inputTokens: 200, outputTokens: 30 },
      }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: mockProvider,
      gateway,
      safetyGates: mockGates,
      logLevel: 'error',
    });

    await orch.run('generate', 'Generate good code');
    expect(gateway.calls).toHaveLength(1);
    expect(gateway.calls[0].tool).toBe('writeAbapSource');
  });

  it('should not check safety gates for read tools', async () => {
    const mockGates = {
      evaluate: vi.fn(),
    };

    const mockProvider = new MockLLMProvider([
      new LLMResponse({
        stopReason: 'tool_use',
        toolCalls: [{ id: 'tc1', name: 'read_abap_source', input: { object_name: 'ZCL_TEST' } }],
        usage: { inputTokens: 100, outputTokens: 20 },
      }),
      new LLMResponse({
        stopReason: 'end_turn',
        text: 'Done',
        usage: { inputTokens: 150, outputTokens: 10 },
      }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: mockProvider,
      gateway: new MockGateway(),
      safetyGates: mockGates,
      logLevel: 'error',
    });

    await orch.run('analyze', 'Check source');
    expect(mockGates.evaluate).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Live Mode: Workflow
// ─────────────────────────────────────────────────────────────────────────────

describe('Orchestrator live workflow', () => {
  it('should run full 5-stage workflow in live mode', async () => {
    const mockProvider = new MockLLMProvider([
      new LLMResponse({ stopReason: 'end_turn', text: '## Planning\n\nScope defined.', usage: { inputTokens: 100, outputTokens: 50 } }),
      new LLMResponse({ stopReason: 'end_turn', text: '## Design\n\nArchitecture set.', usage: { inputTokens: 150, outputTokens: 60 } }),
      new LLMResponse({ stopReason: 'end_turn', text: '## Implementation\n\nCode written.', usage: { inputTokens: 200, outputTokens: 80 } }),
      new LLMResponse({ stopReason: 'end_turn', text: '## Testing\n\nAll tests pass.', usage: { inputTokens: 180, outputTokens: 70 } }),
      new LLMResponse({ stopReason: 'end_turn', text: '## Review\n\nApproved.', usage: { inputTokens: 160, outputTokens: 40 } }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: mockProvider,
      gateway: new MockGateway(),
      logLevel: 'error',
    });

    const results = await orch.run('workflow', 'Build vendor rating');

    expect(results).toHaveLength(5);
    expect(results[0].role).toBe('planner');
    expect(results[1].role).toBe('designer');
    expect(results[2].role).toBe('implementer');
    expect(results[3].role).toBe('tester');
    expect(results[4].role).toBe('reviewer');

    const usage = orch.getTotalUsage();
    expect(usage.inputTokens).toBe(790);
    expect(usage.outputTokens).toBe(300);
  });

  it('should pass context from one agent to the next', async () => {
    const mockProvider = new MockLLMProvider([
      new LLMResponse({ stopReason: 'end_turn', text: '## Plan\n\nAffected: ZCL_X', usage: { inputTokens: 100, outputTokens: 50 } }),
      new LLMResponse({ stopReason: 'end_turn', text: '## Design\n\nDone.', usage: { inputTokens: 150, outputTokens: 60 } }),
      new LLMResponse({ stopReason: 'end_turn', text: '## Code\n\nDone.', usage: { inputTokens: 200, outputTokens: 80 } }),
      new LLMResponse({ stopReason: 'end_turn', text: '## Tests\n\nDone.', usage: { inputTokens: 180, outputTokens: 70 } }),
      new LLMResponse({ stopReason: 'end_turn', text: '## Review\n\nDone.', usage: { inputTokens: 160, outputTokens: 40 } }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: mockProvider,
      gateway: new MockGateway(),
      logLevel: 'error',
    });

    await orch.run('workflow', 'Test context passing');

    // Second call should have context from first agent
    const secondCall = mockProvider.calls[1];
    const userMessage = secondCall.messages.find((m) => m.role === 'user');
    expect(userMessage.content).toContain('Context from Previous Agent');
    expect(userMessage.content).toContain('planner');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mock mode backward compatibility
// ─────────────────────────────────────────────────────────────────────────────

describe('Orchestrator mock mode backward compatibility', () => {
  it('should default to mock mode without API key', () => {
    const orch = new Orchestrator();
    expect(orch.mode).toBe('mock');
  });

  it('should run single agent in mock mode', async () => {
    const orch = new Orchestrator();
    const result = await orch.run('analyze', 'Create a test report');
    expect(result).toBeInstanceOf(AgentResult);
    expect(result.role).toBe('planner');
  });

  it('should run full workflow in mock mode', async () => {
    const orch = new Orchestrator();
    const results = await orch.run('workflow', 'Build customer report');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(5);
  });

  it('should throw for unknown command', async () => {
    const orch = new Orchestrator();
    await expect(orch.run('unknown', 'test')).rejects.toThrow('Unknown agent command');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AgentResult formatting
// ─────────────────────────────────────────────────────────────────────────────

describe('AgentResult with usage', () => {
  it('should show tokens in terminal output', () => {
    const result = new AgentResult({
      role: 'planner',
      title: 'Test',
      sections: [{ heading: 'Info', content: 'Done' }],
      usage: { inputTokens: 500, outputTokens: 200 },
    });
    const terminal = result.toTerminal();
    expect(terminal).toContain('500');
    expect(terminal).toContain('200');
  });

  it('should show tokens in markdown output', () => {
    const result = new AgentResult({
      role: 'planner',
      title: 'Test',
      sections: [{ heading: 'Info', content: 'Done' }],
      usage: { inputTokens: 500, outputTokens: 200 },
    });
    const md = result.toMarkdown();
    expect(md).toContain('500');
    expect(md).toContain('200');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Output Parsing
// ─────────────────────────────────────────────────────────────────────────────

describe('Orchestrator output parsing', () => {
  it('should extract markdown sections from LLM output', async () => {
    const mockProvider = new MockLLMProvider([
      new LLMResponse({
        stopReason: 'end_turn',
        text: '## Scope Analysis\n\nAnalyzed the requirement.\n\n### Affected Objects\n\nZCL_VENDOR\n\n### Risk Analysis\n\nLow risk overall.',
        usage: { inputTokens: 100, outputTokens: 80 },
      }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: mockProvider,
      gateway: new MockGateway(),
      logLevel: 'error',
    });

    const result = await orch.run('analyze', 'Test parsing');

    expect(result.title).toBe('Scope Analysis');
    expect(result.sections.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle plain text without markdown headings', async () => {
    const mockProvider = new MockLLMProvider([
      new LLMResponse({
        stopReason: 'end_turn',
        text: 'This is just plain text output without any markdown headings.',
        usage: { inputTokens: 50, outputTokens: 20 },
      }),
    ]);

    const orch = new Orchestrator({
      apiKey: 'test-key',
      provider: mockProvider,
      gateway: new MockGateway(),
      logLevel: 'error',
    });

    const result = await orch.run('analyze', 'Plain text test');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].heading).toBe('Output');
    expect(result.sections[0].content).toContain('plain text');
  });
});
