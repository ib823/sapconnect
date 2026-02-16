/**
 * Tests for MCP Connection Tool Handlers
 */
const { ConnectionToolHandlers } = require('../../../lib/mcp/connection-tool-handlers');
const { CONNECTION_TOOL_DEFINITIONS } = require('../../../lib/mcp/connection-tools');

describe('ConnectionToolHandlers', () => {
  let handlers;

  beforeEach(() => {
    handlers = new ConnectionToolHandlers({ mode: 'mock', sessionContext: { isConnected: () => false, mode: 'mock' } });
  });

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const h = new ConnectionToolHandlers();
      expect(h.mode).toBe('mock');
    });

    it('should accept custom mode', () => {
      const h = new ConnectionToolHandlers({ mode: 'live' });
      expect(h.mode).toBe('live');
    });

    it('should have a logger', () => {
      expect(handlers.logger).toBeDefined();
    });
  });

  describe('handle', () => {
    it('should throw on unknown tool name', async () => {
      await expect(handlers.handle('connection_unknown', {})).rejects.toThrow('Unknown connection tool');
    });

    it('should have a handler for every tool definition', () => {
      for (const tool of CONNECTION_TOOL_DEFINITIONS) {
        const handlerName = `_handle_${tool.name}`;
        expect(typeof handlers[handlerName]).toBe('function');
      }
    });

    it('should handle all 6 tools without error', async () => {
      const paramSets = {
        connection_test: {},
        connection_status: {},
        connection_setup_validate: { config: { host: 'sap.example.com', client: '100', user: 'ADMIN' } },
        connection_check_rfc: {},
        connection_check_odata: {},
        connection_check_authorizations: {},
      };

      for (const [toolName, params] of Object.entries(paramSets)) {
        const result = await handlers.handle(toolName, params);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    });
  });

  describe('connection_test', () => {
    it('should return connection status', async () => {
      const result = await handlers.handle('connection_test', { host: 'sap-s4d.example.com' });
      expect(result.status).toBe('connected');
      expect(result.host).toBe('sap-s4d.example.com');
      expect(result.pingTimeMs).toBeGreaterThan(0);
    });
  });

  describe('connection_setup_validate', () => {
    it('should validate correct config', async () => {
      const result = await handlers.handle('connection_setup_validate', {
        config: { host: 'sap.example.com', systemNumber: '00', client: '100', user: 'ADMIN' },
      });
      expect(result.valid).toBe(true);
      expect(result.checks).toBeInstanceOf(Array);
    });

    it('should reject missing host', async () => {
      const result = await handlers.handle('connection_setup_validate', {
        config: { systemNumber: '00', client: '100' },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('connection_check_rfc', () => {
    it('should return RFC availability', async () => {
      const result = await handlers.handle('connection_check_rfc', {});
      expect(result.available).toBe(true);
      expect(result.nodeRfcAvailable).toBe(true);
      expect(result.functionModulesAccessible).toBeInstanceOf(Array);
    });
  });

  describe('connection_check_odata', () => {
    it('should return OData availability', async () => {
      const result = await handlers.handle('connection_check_odata', {});
      expect(result.available).toBe(true);
      expect(result.csrfTokenObtained).toBe(true);
    });
  });

  describe('connection_check_authorizations', () => {
    it('should return authorization checks', async () => {
      const result = await handlers.handle('connection_check_authorizations', {});
      expect(result.authorizations).toBeInstanceOf(Array);
      expect(result.overallStatus).toBeDefined();
      expect(result.authorizations[0]).toHaveProperty('object');
      expect(result.authorizations[0]).toHaveProperty('status');
    });
  });
});
