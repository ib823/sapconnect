/**
 * Tests for MCP Config Tool Handlers
 */
const { ConfigToolHandlers } = require('../../../lib/mcp/config-tool-handlers');
const { CONFIG_TOOL_DEFINITIONS } = require('../../../lib/mcp/config-tools');

describe('ConfigToolHandlers', () => {
  let handlers;

  beforeEach(() => {
    handlers = new ConfigToolHandlers({ mode: 'mock', sessionContext: {} });
  });

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const h = new ConfigToolHandlers();
      expect(h.mode).toBe('mock');
    });

    it('should accept custom mode', () => {
      const h = new ConfigToolHandlers({ mode: 'live' });
      expect(h.mode).toBe('live');
    });

    it('should have a logger', () => {
      expect(handlers.logger).toBeDefined();
    });
  });

  describe('handle', () => {
    it('should throw on unknown tool name', async () => {
      await expect(handlers.handle('config_unknown', {})).rejects.toThrow('Unknown config tool');
    });

    it('should have a handler for every tool definition', () => {
      for (const tool of CONFIG_TOOL_DEFINITIONS) {
        const handlerName = `_handle_${tool.name}`;
        expect(typeof handlers[handlerName]).toBe('function');
      }
    });

    it('should handle all 5 tools without error', async () => {
      const paramSets = {
        config_read_source: { configType: 'company-codes' },
        config_write_target: { configType: 'company-codes', data: { entries: [] } },
        config_safety_check: { operation: 'Test operation' },
        config_request_approval: { operation: 'Test approval' },
        config_get_audit_trail: {},
      };

      for (const [toolName, params] of Object.entries(paramSets)) {
        const result = await handlers.handle(toolName, params);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    });
  });

  describe('config_read_source', () => {
    it('should return company codes', async () => {
      const result = await handlers.handle('config_read_source', { configType: 'company-codes' });
      expect(result.configType).toBe('company-codes');
      expect(result.entries).toBeInstanceOf(Array);
      expect(result.entries.length).toBeGreaterThan(0);
    });

    it('should return plants', async () => {
      const result = await handlers.handle('config_read_source', { configType: 'plants' });
      expect(result.configType).toBe('plants');
      expect(result.entries).toBeInstanceOf(Array);
    });

    it('should return sales-orgs', async () => {
      const result = await handlers.handle('config_read_source', { configType: 'sales-orgs' });
      expect(result.configType).toBe('sales-orgs');
      expect(result.entries).toBeInstanceOf(Array);
    });

    it('should handle unknown config types', async () => {
      const result = await handlers.handle('config_read_source', { configType: 'custom-type' });
      expect(result.configType).toBe('custom-type');
      expect(result.entries).toBeInstanceOf(Array);
    });
  });

  describe('config_write_target', () => {
    it('should default to dryRun=true', async () => {
      const result = await handlers.handle('config_write_target', { configType: 'company-codes', data: {} });
      expect(result.dryRun).toBe(true);
      expect(result.status).toBe('validated');
    });

    it('should include humanDecisionsRequired', async () => {
      const result = await handlers.handle('config_write_target', { configType: 'plants', data: {} });
      expect(result.humanDecisionsRequired).toBeInstanceOf(Array);
      expect(result.humanDecisionsRequired.length).toBeGreaterThan(0);
    });
  });

  describe('config_safety_check', () => {
    it('should return safety check result', async () => {
      const result = await handlers.handle('config_safety_check', { operation: 'Write config' });
      expect(result.operation).toBe('Write config');
      expect(result.allowed).toBeDefined();
      expect(result.gates).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('config_request_approval', () => {
    it('should return approval request', async () => {
      const result = await handlers.handle('config_request_approval', { operation: 'Config write' });
      expect(result.approvalId).toBeDefined();
      expect(result.operation).toBe('Config write');
      expect(result.status).toBe('pending');
    });
  });

  describe('config_get_audit_trail', () => {
    it('should return audit entries', async () => {
      const result = await handlers.handle('config_get_audit_trail', {});
      expect(result.entries).toBeInstanceOf(Array);
      expect(result.totalEntries).toBeGreaterThan(0);
    });
  });
});
