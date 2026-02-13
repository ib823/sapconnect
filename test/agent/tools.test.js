const { TOOLS, TOOL_MAP, getToolsForRole, executeTool } = require('../../agent/tools');

const ALL_TOOL_NAMES = [
  'read_abap_source',
  'write_abap_source',
  'list_objects',
  'search_repository',
  'get_data_dictionary',
  'activate_object',
  'run_unit_tests',
  'run_syntax_check',
];

/**
 * Helper: creates a mock SAP gateway where every method is a vi.fn()
 * that resolves with { ok: true, tool: <methodName> }.
 */
function createMockGateway() {
  return {
    readAbapSource: vi.fn().mockResolvedValue({ ok: true, tool: 'readAbapSource' }),
    writeAbapSource: vi.fn().mockResolvedValue({ ok: true, tool: 'writeAbapSource' }),
    listObjects: vi.fn().mockResolvedValue({ ok: true, tool: 'listObjects' }),
    searchRepository: vi.fn().mockResolvedValue({ ok: true, tool: 'searchRepository' }),
    getDataDictionary: vi.fn().mockResolvedValue({ ok: true, tool: 'getDataDictionary' }),
    activateObject: vi.fn().mockResolvedValue({ ok: true, tool: 'activateObject' }),
    runUnitTests: vi.fn().mockResolvedValue({ ok: true, tool: 'runUnitTests' }),
    runSyntaxCheck: vi.fn().mockResolvedValue({ ok: true, tool: 'runSyntaxCheck' }),
  };
}

describe('tools', () => {
  // ---------------------------------------------------------------
  // TOOLS array
  // ---------------------------------------------------------------
  describe('TOOLS', () => {
    it('should be an array of 8 tool definitions', () => {
      expect(Array.isArray(TOOLS)).toBe(true);
      expect(TOOLS).toHaveLength(8);
    });

    it('should contain all expected tool names', () => {
      const names = TOOLS.map((t) => t.name);
      expect(names).toEqual(ALL_TOOL_NAMES);
    });

    describe.each(ALL_TOOL_NAMES)('tool "%s"', (toolName) => {
      const tool = TOOLS.find((t) => t.name === toolName);

      it('should have a non-empty string name', () => {
        expect(typeof tool.name).toBe('string');
        expect(tool.name.length).toBeGreaterThan(0);
      });

      it('should have a non-empty string description', () => {
        expect(typeof tool.description).toBe('string');
        expect(tool.description.length).toBeGreaterThan(0);
      });

      it('should have an input_schema with type "object"', () => {
        expect(tool.input_schema).toBeDefined();
        expect(tool.input_schema.type).toBe('object');
      });

      it('should have properties defined in input_schema', () => {
        expect(tool.input_schema.properties).toBeDefined();
        expect(typeof tool.input_schema.properties).toBe('object');
      });

      it('should have a required array in input_schema', () => {
        expect(Array.isArray(tool.input_schema.required)).toBe(true);
        expect(tool.input_schema.required.length).toBeGreaterThan(0);
      });

      it('should only list required fields that exist in properties', () => {
        const propKeys = Object.keys(tool.input_schema.properties);
        for (const req of tool.input_schema.required) {
          expect(propKeys).toContain(req);
        }
      });
    });
  });

  // ---------------------------------------------------------------
  // TOOL_MAP
  // ---------------------------------------------------------------
  describe('TOOL_MAP', () => {
    it('should have an entry for every tool', () => {
      expect(Object.keys(TOOL_MAP)).toHaveLength(8);
    });

    it.each(ALL_TOOL_NAMES)('should map "%s" to its tool definition', (name) => {
      expect(TOOL_MAP[name]).toBeDefined();
      expect(TOOL_MAP[name].name).toBe(name);
      expect(TOOL_MAP[name]).toBe(TOOLS.find((t) => t.name === name));
    });

    it('should return undefined for unknown tool names', () => {
      expect(TOOL_MAP['nonexistent_tool']).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------
  // getToolsForRole()
  // ---------------------------------------------------------------
  describe('getToolsForRole', () => {
    it('should return an array', () => {
      expect(Array.isArray(getToolsForRole([]))).toBe(true);
    });

    it('should return empty array for empty input', () => {
      expect(getToolsForRole([])).toEqual([]);
    });

    it('should return only the requested tools', () => {
      const subset = ['read_abap_source', 'list_objects'];
      const result = getToolsForRole(subset);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('read_abap_source');
      expect(result[1].name).toBe('list_objects');
    });

    it('should return all 8 tools when given all names', () => {
      const result = getToolsForRole(ALL_TOOL_NAMES);
      expect(result).toHaveLength(8);
    });

    it('should filter out unknown tool names', () => {
      const result = getToolsForRole(['read_abap_source', 'nonexistent_tool', 'list_objects']);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name)).toEqual(['read_abap_source', 'list_objects']);
    });

    it('should return empty array when all names are unknown', () => {
      const result = getToolsForRole(['foo', 'bar', 'baz']);
      expect(result).toEqual([]);
    });

    it('should preserve the order of the input list', () => {
      const reversed = ['run_syntax_check', 'run_unit_tests', 'activate_object'];
      const result = getToolsForRole(reversed);
      expect(result.map((t) => t.name)).toEqual(reversed);
    });

    it('should return tool objects in Claude API format', () => {
      const result = getToolsForRole(['read_abap_source']);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('input_schema');
    });
  });

  // ---------------------------------------------------------------
  // executeTool()
  // ---------------------------------------------------------------
  describe('executeTool', () => {
    let gateway;

    beforeEach(() => {
      gateway = createMockGateway();
    });

    it('should dispatch read_abap_source to gateway.readAbapSource', async () => {
      const input = { object_name: 'ZCL_TEST', object_type: 'CLAS' };
      const result = await executeTool('read_abap_source', input, gateway);
      expect(gateway.readAbapSource).toHaveBeenCalledWith('ZCL_TEST', 'CLAS');
      expect(result).toEqual({ ok: true, tool: 'readAbapSource' });
    });

    it('should dispatch write_abap_source to gateway.writeAbapSource', async () => {
      const input = {
        object_name: 'ZCL_TEST',
        source: 'CLASS zcl_test DEFINITION.',
        object_type: 'CLAS',
        package: 'ZTEST',
      };
      const result = await executeTool('write_abap_source', input, gateway);
      expect(gateway.writeAbapSource).toHaveBeenCalledWith(
        'ZCL_TEST',
        'CLASS zcl_test DEFINITION.',
        'CLAS',
        'ZTEST',
      );
      expect(result).toEqual({ ok: true, tool: 'writeAbapSource' });
    });

    it('should dispatch list_objects to gateway.listObjects', async () => {
      const input = { package: 'ZVENDOR' };
      const result = await executeTool('list_objects', input, gateway);
      expect(gateway.listObjects).toHaveBeenCalledWith('ZVENDOR');
      expect(result).toEqual({ ok: true, tool: 'listObjects' });
    });

    it('should dispatch search_repository to gateway.searchRepository', async () => {
      const input = { query: 'ZCL_*', object_type: 'CLAS' };
      const result = await executeTool('search_repository', input, gateway);
      expect(gateway.searchRepository).toHaveBeenCalledWith('ZCL_*', 'CLAS');
      expect(result).toEqual({ ok: true, tool: 'searchRepository' });
    });

    it('should dispatch get_data_dictionary to gateway.getDataDictionary', async () => {
      const input = { object_name: 'EKKO' };
      const result = await executeTool('get_data_dictionary', input, gateway);
      expect(gateway.getDataDictionary).toHaveBeenCalledWith('EKKO');
      expect(result).toEqual({ ok: true, tool: 'getDataDictionary' });
    });

    it('should dispatch activate_object to gateway.activateObject', async () => {
      const input = { object_name: 'ZCL_TEST', object_type: 'CLAS' };
      const result = await executeTool('activate_object', input, gateway);
      expect(gateway.activateObject).toHaveBeenCalledWith('ZCL_TEST', 'CLAS');
      expect(result).toEqual({ ok: true, tool: 'activateObject' });
    });

    it('should dispatch run_unit_tests to gateway.runUnitTests', async () => {
      const input = { object_name: 'ZCL_TEST', with_coverage: true };
      const result = await executeTool('run_unit_tests', input, gateway);
      expect(gateway.runUnitTests).toHaveBeenCalledWith('ZCL_TEST', true);
      expect(result).toEqual({ ok: true, tool: 'runUnitTests' });
    });

    it('should dispatch run_syntax_check to gateway.runSyntaxCheck', async () => {
      const input = { object_name: 'ZCL_TEST', object_type: 'CLAS' };
      const result = await executeTool('run_syntax_check', input, gateway);
      expect(gateway.runSyntaxCheck).toHaveBeenCalledWith('ZCL_TEST', 'CLAS');
      expect(result).toEqual({ ok: true, tool: 'runSyntaxCheck' });
    });

    it('should return error object for unknown tool', async () => {
      const result = await executeTool('nonexistent_tool', {}, gateway);
      expect(result).toEqual({ error: 'Unknown tool: nonexistent_tool' });
    });

    it('should not call any gateway method for unknown tool', async () => {
      await executeTool('nonexistent_tool', {}, gateway);
      for (const method of Object.values(gateway)) {
        expect(method).not.toHaveBeenCalled();
      }
    });

    it('should pass undefined for optional parameters when not provided', async () => {
      const input = { object_name: 'ZCL_TEST' };
      await executeTool('read_abap_source', input, gateway);
      expect(gateway.readAbapSource).toHaveBeenCalledWith('ZCL_TEST', undefined);
    });

    it('should pass with_coverage as false when explicitly set', async () => {
      const input = { object_name: 'ZCL_TEST', with_coverage: false };
      await executeTool('run_unit_tests', input, gateway);
      expect(gateway.runUnitTests).toHaveBeenCalledWith('ZCL_TEST', false);
    });

    it('should propagate gateway rejections', async () => {
      gateway.readAbapSource.mockRejectedValue(new Error('Connection failed'));
      await expect(
        executeTool('read_abap_source', { object_name: 'ZCL_TEST' }, gateway),
      ).rejects.toThrow('Connection failed');
    });
  });
});
