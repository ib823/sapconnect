/**
 * Tests for MCP Infor Tool Definitions
 */
const { INFOR_TOOL_DEFINITIONS } = require('../../../lib/mcp/infor-tools');

describe('INFOR_TOOL_DEFINITIONS', () => {
  it('should export exactly 15 tool definitions', () => {
    expect(INFOR_TOOL_DEFINITIONS).toHaveLength(15);
  });

  it('should have unique tool names', () => {
    const names = INFOR_TOOL_DEFINITIONS.map(t => t.name);
    expect(new Set(names).size).toBe(15);
  });

  it('should prefix all tools with infor_', () => {
    for (const tool of INFOR_TOOL_DEFINITIONS) {
      expect(tool.name).toMatch(/^infor_/);
    }
  });

  it('should have description and inputSchema for every tool', () => {
    for (const tool of INFOR_TOOL_DEFINITIONS) {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(10);
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
    }
  });

  it('should have required array only when properties are mandatory', () => {
    for (const tool of INFOR_TOOL_DEFINITIONS) {
      if (tool.inputSchema.required) {
        expect(Array.isArray(tool.inputSchema.required)).toBe(true);
        for (const req of tool.inputSchema.required) {
          expect(tool.inputSchema.properties).toHaveProperty(req);
        }
      }
    }
  });

  it('should include all expected tool names', () => {
    const names = INFOR_TOOL_DEFINITIONS.map(t => t.name);
    const expected = [
      'infor_query_bod',
      'infor_execute_m3api',
      'infor_query_datalake',
      'infor_get_workflow',
      'infor_profile_db',
      'infor_list_connections',
      'infor_get_bod_schema',
      'infor_list_mi_programs',
      'infor_query_ido',
      'infor_get_customizations',
      'infor_run_assessment',
      'infor_get_complexity_score',
      'infor_map_field',
      'infor_get_industry_gaps',
      'infor_migrate_object',
    ];
    for (const name of expected) {
      expect(names).toContain(name);
    }
  });

  describe('individual tool schemas', () => {
    it('infor_query_bod requires noun', () => {
      const tool = INFOR_TOOL_DEFINITIONS.find(t => t.name === 'infor_query_bod');
      expect(tool.inputSchema.required).toContain('noun');
      expect(tool.inputSchema.properties.noun.type).toBe('string');
      expect(tool.inputSchema.properties.verb.type).toBe('string');
      expect(tool.inputSchema.properties.filters.type).toBe('object');
    });

    it('infor_execute_m3api requires program and transaction', () => {
      const tool = INFOR_TOOL_DEFINITIONS.find(t => t.name === 'infor_execute_m3api');
      expect(tool.inputSchema.required).toContain('program');
      expect(tool.inputSchema.required).toContain('transaction');
    });

    it('infor_query_datalake requires query', () => {
      const tool = INFOR_TOOL_DEFINITIONS.find(t => t.name === 'infor_query_datalake');
      expect(tool.inputSchema.required).toContain('query');
    });

    it('infor_map_field requires sourceSystem, sourceTable, sourceField', () => {
      const tool = INFOR_TOOL_DEFINITIONS.find(t => t.name === 'infor_map_field');
      expect(tool.inputSchema.required).toEqual(
        expect.arrayContaining(['sourceSystem', 'sourceTable', 'sourceField'])
      );
    });

    it('infor_migrate_object requires objectType and sourceSystem', () => {
      const tool = INFOR_TOOL_DEFINITIONS.find(t => t.name === 'infor_migrate_object');
      expect(tool.inputSchema.required).toContain('objectType');
      expect(tool.inputSchema.required).toContain('sourceSystem');
    });

    it('infor_list_connections has no required params', () => {
      const tool = INFOR_TOOL_DEFINITIONS.find(t => t.name === 'infor_list_connections');
      expect(tool.inputSchema.required).toBeUndefined();
    });

    it('infor_get_customizations has no required params', () => {
      const tool = INFOR_TOOL_DEFINITIONS.find(t => t.name === 'infor_get_customizations');
      expect(tool.inputSchema.required).toBeUndefined();
    });
  });
});
