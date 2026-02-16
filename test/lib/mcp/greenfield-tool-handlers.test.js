/**
 * Tests for MCP Greenfield Tool Handlers
 */
const { GreenfieldToolHandlers } = require('../../../lib/mcp/greenfield-tool-handlers');
const { GREENFIELD_TOOL_DEFINITIONS } = require('../../../lib/mcp/greenfield-tools');

describe('GreenfieldToolHandlers', () => {
  let handlers;

  beforeEach(() => {
    handlers = new GreenfieldToolHandlers({ mode: 'mock', sessionContext: {} });
  });

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const h = new GreenfieldToolHandlers();
      expect(h.mode).toBe('mock');
    });

    it('should accept custom mode', () => {
      const h = new GreenfieldToolHandlers({ mode: 'live' });
      expect(h.mode).toBe('live');
    });

    it('should have a logger', () => {
      expect(handlers.logger).toBeDefined();
    });
  });

  describe('handle', () => {
    it('should throw on unknown tool name', async () => {
      await expect(handlers.handle('greenfield_unknown', {})).rejects.toThrow('Unknown greenfield tool');
    });

    it('should have a handler for every tool definition', () => {
      for (const tool of GREENFIELD_TOOL_DEFINITIONS) {
        const handlerName = `_handle_${tool.name}`;
        expect(typeof handlers[handlerName]).toBe('function');
      }
    });

    it('should handle all 10 tools without error', async () => {
      const paramSets = {
        greenfield_generate_bdc: { transaction: 'XK01', data: { LIFNR: '0001000001' } },
        greenfield_execute_bdc: { recording: { screens: [] } },
        greenfield_list_bdc_templates: {},
        greenfield_list_config_templates: {},
        greenfield_get_config_template: { templateId: 'FI_COA_001' },
        greenfield_list_bapis: {},
        greenfield_get_bapi_signature: { bapiName: 'BAPI_MATERIAL_SAVEDATA' },
        greenfield_discover_enhancements: {},
        greenfield_list_sm30_tables: {},
        greenfield_generate_sm30: { tableName: 'T001', entries: [{ BUKRS: '1000' }] },
      };

      for (const [toolName, params] of Object.entries(paramSets)) {
        const result = await handlers.handle(toolName, params);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    });
  });

  describe('greenfield_generate_bdc', () => {
    it('should return recording with screens', async () => {
      const result = await handlers.handle('greenfield_generate_bdc', { transaction: 'XK01', data: { LIFNR: '001' } });
      expect(result.transaction).toBe('XK01');
      expect(result.recording).toBeDefined();
      expect(result.recording.screens).toBeInstanceOf(Array);
      expect(result.status).toBe('generated');
    });
  });

  describe('greenfield_execute_bdc', () => {
    it('should default to dryRun=true', async () => {
      const result = await handlers.handle('greenfield_execute_bdc', { recording: { screens: [] } });
      expect(result.dryRun).toBe(true);
      expect(result.status).toBe('simulated');
    });

    it('should execute in mock mode when dryRun=false', async () => {
      const result = await handlers.handle('greenfield_execute_bdc', { recording: { screens: [] }, dryRun: false });
      expect(result.dryRun).toBe(false);
    });
  });

  describe('greenfield_list_bdc_templates', () => {
    it('should return template list', async () => {
      const result = await handlers.handle('greenfield_list_bdc_templates', {});
      expect(result.templates).toBeInstanceOf(Array);
      expect(result.templates.length).toBeGreaterThan(0);
      expect(result.templates[0]).toHaveProperty('id');
      expect(result.templates[0]).toHaveProperty('transaction');
    });
  });

  describe('greenfield_list_config_templates', () => {
    it('should return templates', async () => {
      const result = await handlers.handle('greenfield_list_config_templates', {});
      expect(result.templates).toBeInstanceOf(Array);
      expect(result.templates.length).toBeGreaterThan(0);
    });

    it('should filter by area', async () => {
      const result = await handlers.handle('greenfield_list_config_templates', { area: 'FI' });
      for (const t of result.templates) {
        expect(t.area).toBe('FI');
      }
    });
  });

  describe('greenfield_get_config_template', () => {
    it('should return template with steps for known template', async () => {
      const result = await handlers.handle('greenfield_get_config_template', { templateId: 'FI_COA_001' });
      expect(result.templateId).toBe('FI_COA_001');
      expect(result.steps).toBeInstanceOf(Array);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.humanDecisionsRequired).toBeInstanceOf(Array);
    });

    it('should return fallback for unknown template', async () => {
      const result = await handlers.handle('greenfield_get_config_template', { templateId: 'UNKNOWN_001' });
      expect(result.templateId).toBe('UNKNOWN_001');
      expect(result.steps).toBeInstanceOf(Array);
    });
  });

  describe('greenfield_list_bapis', () => {
    it('should return BAPI list', async () => {
      const result = await handlers.handle('greenfield_list_bapis', {});
      expect(result.bapis).toBeInstanceOf(Array);
      expect(result.totalBapis).toBeGreaterThan(0);
      expect(result.bapis[0]).toHaveProperty('name');
      expect(result.bapis[0]).toHaveProperty('module');
    });

    it('should filter by module', async () => {
      const result = await handlers.handle('greenfield_list_bapis', { module: 'MM' });
      for (const b of result.bapis) {
        expect(b.module).toBe('MM');
      }
    });
  });

  describe('greenfield_get_bapi_signature', () => {
    it('should return BAPI signature for known BAPI', async () => {
      const result = await handlers.handle('greenfield_get_bapi_signature', { bapiName: 'BAPI_MATERIAL_SAVEDATA' });
      expect(result.bapiName).toBe('BAPI_MATERIAL_SAVEDATA');
      expect(result.parameters).toBeDefined();
      expect(result.parameters.import).toBeInstanceOf(Array);
      expect(result.parameters.export).toBeInstanceOf(Array);
    });

    it('should return fallback for unknown BAPI', async () => {
      const result = await handlers.handle('greenfield_get_bapi_signature', { bapiName: 'Z_CUSTOM_BAPI' });
      expect(result.bapiName).toBe('Z_CUSTOM_BAPI');
      expect(result.parameters).toBeDefined();
    });
  });

  describe('greenfield_discover_enhancements', () => {
    it('should return enhancements with counts', async () => {
      const result = await handlers.handle('greenfield_discover_enhancements', {});
      expect(result.enhancements).toBeInstanceOf(Array);
      expect(result.totalBadis).toBeGreaterThan(0);
    });
  });

  describe('greenfield_list_sm30_tables', () => {
    it('should return table list', async () => {
      const result = await handlers.handle('greenfield_list_sm30_tables', {});
      expect(result.tables).toBeInstanceOf(Array);
      expect(result.tables.length).toBeGreaterThan(0);
      expect(result.tables[0]).toHaveProperty('tableName');
    });

    it('should filter by area', async () => {
      const result = await handlers.handle('greenfield_list_sm30_tables', { area: 'FI' });
      for (const t of result.tables) {
        expect(t.area).toBe('FI');
      }
    });
  });

  describe('greenfield_generate_sm30', () => {
    it('should return SM30 recording', async () => {
      const result = await handlers.handle('greenfield_generate_sm30', { tableName: 'T001', entries: [{ BUKRS: '1000' }] });
      expect(result.tableName).toBe('T001');
      expect(result.recording).toBeDefined();
      expect(result.status).toBe('generated');
      expect(result.entriesCount).toBe(1);
    });
  });
});
