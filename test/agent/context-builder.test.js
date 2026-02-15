const {
  buildUserMessage,
  compressContext,
  formatToolResult,
  buildToolResultMessage,
  buildAssistantToolUseMessage,
  estimateTokens,
  estimateMessagesTokens,
} = require('../../agent/context-builder');

// ─────────────────────────────────────────────────────────────────────────────
// buildUserMessage
// ─────────────────────────────────────────────────────────────────────────────

describe('buildUserMessage', () => {
  it('should include requirement', () => {
    const msg = buildUserMessage('Create vendor rating report');
    expect(msg).toContain('## Requirement');
    expect(msg).toContain('Create vendor rating report');
  });

  it('should include previous agent context', () => {
    const prevResult = {
      role: 'planner',
      title: 'Scope Analysis',
      sections: [
        { heading: 'Affected Objects', content: 'ZCL_VENDOR_RATING' },
        {
          heading: 'Risk Table',
          table: {
            headers: ['Risk', 'Severity'],
            rows: [['Performance', 'High']],
          },
        },
      ],
    };

    const msg = buildUserMessage('Create vendor rating', prevResult);
    expect(msg).toContain('## Context from Previous Agent');
    expect(msg).toContain('**Agent:** planner');
    expect(msg).toContain('ZCL_VENDOR_RATING');
    expect(msg).toContain('Performance');
  });

  it('should handle missing sections gracefully', () => {
    const msg = buildUserMessage('Test', { role: 'designer', title: 'Design' });
    expect(msg).toContain('## Requirement');
    expect(msg).toContain('**Agent:** designer');
  });

  it('should handle empty sections array', () => {
    const msg = buildUserMessage('Test', { role: 'tester', title: 'Tests', sections: [] });
    expect(msg).toContain('**Agent:** tester');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// estimateTokens
// ─────────────────────────────────────────────────────────────────────────────

describe('estimateTokens', () => {
  it('should estimate ~4 chars per token', () => {
    expect(estimateTokens('hello world')).toBe(3); // 11 chars / 4 = 2.75 -> ceil = 3
  });

  it('should return 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('should return 0 for null', () => {
    expect(estimateTokens(null)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// estimateMessagesTokens
// ─────────────────────────────────────────────────────────────────────────────

describe('estimateMessagesTokens', () => {
  it('should count string content messages', () => {
    const messages = [
      { role: 'system', content: 'You are a test agent.' }, // ~5 tokens + 4 overhead
      { role: 'user', content: 'Hello' },  // ~2 tokens + 4 overhead
    ];
    const tokens = estimateMessagesTokens(messages);
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(100);
  });

  it('should count array content messages (tool results)', () => {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'tool_result', tool_use_id: 'tc1', content: 'Some result text here' },
        ],
      },
    ];
    const tokens = estimateMessagesTokens(messages);
    expect(tokens).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// compressContext
// ─────────────────────────────────────────────────────────────────────────────

describe('compressContext', () => {
  it('should return messages unchanged if within budget', () => {
    const messages = [
      { role: 'system', content: 'Short prompt' },
      { role: 'user', content: 'Hello' },
    ];
    const result = compressContext(messages, 100000);
    expect(result).toEqual(messages);
  });

  it('should drop middle messages when over budget', () => {
    const messages = [
      { role: 'system', content: 'System' },
      { role: 'user', content: 'First user message' },
      { role: 'assistant', content: 'A'.repeat(1000) },
      { role: 'user', content: 'B'.repeat(1000) },
      { role: 'assistant', content: 'C'.repeat(1000) },
      { role: 'user', content: 'Last message' },
    ];
    // Set very tight budget
    const result = compressContext(messages, 100);
    // Should keep system + first user + as many recent as fit
    expect(result[0].role).toBe('system');
    expect(result[1].role).toBe('user');
    expect(result.length).toBeLessThan(messages.length);
  });

  it('should handle empty messages array', () => {
    expect(compressContext([], 1000)).toEqual([]);
  });

  it('should handle null input', () => {
    expect(compressContext(null, 1000)).toEqual([]);
  });

  it('should insert omission marker when dropping messages', () => {
    const messages = [
      { role: 'system', content: 'S' },
      { role: 'user', content: 'U' },
      { role: 'assistant', content: 'X'.repeat(5000) },
      { role: 'user', content: 'Y'.repeat(5000) },
      { role: 'assistant', content: 'Last' },
    ];
    const result = compressContext(messages, 50);
    const marker = result.find((m) => typeof m.content === 'string' && m.content.includes('omitted'));
    // Either all messages fit or a marker is inserted
    if (result.length < messages.length) {
      expect(marker).toBeTruthy();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatToolResult
// ─────────────────────────────────────────────────────────────────────────────

describe('formatToolResult', () => {
  it('should format read_abap_source', () => {
    const result = formatToolResult('read_abap_source', {
      object_name: 'ZCL_TEST',
      object_type: 'CLAS',
      package: 'ZTEST',
      source: 'CLASS zcl_test DEFINITION.\nENDCLASS.',
    });
    expect(result).toContain('ZCL_TEST');
    expect(result).toContain('CLAS');
    expect(result).toContain('CLASS zcl_test');
  });

  it('should format write_abap_source', () => {
    const result = formatToolResult('write_abap_source', {
      object_name: 'ZCL_TEST',
      status: 'created',
    });
    expect(result).toContain('Written');
    expect(result).toContain('ZCL_TEST');
  });

  it('should format list_objects', () => {
    const result = formatToolResult('list_objects', {
      package: 'ZTEST',
      objects: [
        { type: 'CLAS', name: 'ZCL_TEST' },
        { type: 'INTF', name: 'ZIF_TEST' },
      ],
    });
    expect(result).toContain('ZTEST');
    expect(result).toContain('ZCL_TEST');
    expect(result).toContain('2');
  });

  it('should format search_repository', () => {
    const result = formatToolResult('search_repository', {
      results: [
        { type: 'CLAS', name: 'ZCL_MATCH', description: 'A match' },
      ],
    });
    expect(result).toContain('ZCL_MATCH');
    expect(result).toContain('1');
  });

  it('should format get_data_dictionary', () => {
    const result = formatToolResult('get_data_dictionary', {
      name: 'EKKO',
      type: 'TABLE',
      fields: [
        { name: 'EBELN', type: 'CHAR', length: '10', description: 'PO number' },
      ],
    });
    expect(result).toContain('EKKO');
    expect(result).toContain('EBELN');
  });

  it('should format activate_object', () => {
    const result = formatToolResult('activate_object', {
      object_name: 'ZCL_TEST',
      status: 'active',
    });
    expect(result).toContain('Activated');
    expect(result).toContain('ZCL_TEST');
  });

  it('should format run_unit_tests', () => {
    const result = formatToolResult('run_unit_tests', {
      summary: { passed: 5, failed: 1, skipped: 0 },
      coverage: { statement: 87 },
    });
    expect(result).toContain('Passed: 5');
    expect(result).toContain('Failed: 1');
    expect(result).toContain('87');
  });

  it('should format clean syntax check', () => {
    const result = formatToolResult('run_syntax_check', {
      status: 'clean',
      errors: [],
    });
    expect(result).toContain('CLEAN');
  });

  it('should format syntax check with errors', () => {
    const result = formatToolResult('run_syntax_check', {
      errors: [{ line: 10, message: 'Missing period' }],
    });
    expect(result).toContain('Line 10');
    expect(result).toContain('Missing period');
  });

  it('should handle error results', () => {
    const result = formatToolResult('read_abap_source', { error: 'Object not found' });
    expect(result).toContain('Error');
    expect(result).toContain('Object not found');
  });

  it('should handle null result', () => {
    const result = formatToolResult('read_abap_source', null);
    expect(result).toBe('No result returned.');
  });

  it('should truncate very long source', () => {
    const result = formatToolResult('read_abap_source', {
      object_name: 'ZCL_BIG',
      source: 'X'.repeat(20000),
    });
    expect(result).toContain('truncated');
    expect(result.length).toBeLessThan(20000);
  });

  it('should handle unknown tool with JSON fallback', () => {
    const result = formatToolResult('custom_tool', { foo: 'bar' });
    expect(result).toContain('foo');
    expect(result).toContain('bar');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildToolResultMessage
// ─────────────────────────────────────────────────────────────────────────────

describe('buildToolResultMessage', () => {
  it('should create Anthropic-format tool_result', () => {
    const msg = buildToolResultMessage('toolu_123', 'Result text');
    expect(msg.role).toBe('user');
    expect(msg.content).toHaveLength(1);
    expect(msg.content[0].type).toBe('tool_result');
    expect(msg.content[0].tool_use_id).toBe('toolu_123');
    expect(msg.content[0].content).toBe('Result text');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildAssistantToolUseMessage
// ─────────────────────────────────────────────────────────────────────────────

describe('buildAssistantToolUseMessage', () => {
  it('should create assistant message with tool_use blocks', () => {
    const msg = buildAssistantToolUseMessage(
      [{ id: 'tc1', name: 'read_abap_source', input: { object_name: 'ZCL_TEST' } }],
      'Let me check the source.',
    );
    expect(msg.role).toBe('assistant');
    expect(msg.content).toHaveLength(2);
    expect(msg.content[0].type).toBe('text');
    expect(msg.content[1].type).toBe('tool_use');
    expect(msg.content[1].name).toBe('read_abap_source');
  });

  it('should omit text block when no text', () => {
    const msg = buildAssistantToolUseMessage(
      [{ id: 'tc1', name: 'list_objects', input: { package: 'ZTEST' } }],
    );
    expect(msg.content).toHaveLength(1);
    expect(msg.content[0].type).toBe('tool_use');
  });
});
