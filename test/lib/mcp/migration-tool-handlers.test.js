/**
 * Tests for MCP Migration Tool Handlers
 */
const { MigrationToolHandlers } = require('../../../lib/mcp/migration-tool-handlers');
const { MIGRATION_TOOL_DEFINITIONS } = require('../../../lib/mcp/migration-tools');

describe('MigrationToolHandlers', () => {
  let handlers;

  beforeEach(() => {
    handlers = new MigrationToolHandlers({ mode: 'mock', sessionContext: {} });
  });

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const h = new MigrationToolHandlers();
      expect(h.mode).toBe('mock');
    });

    it('should accept custom mode', () => {
      const h = new MigrationToolHandlers({ mode: 'live' });
      expect(h.mode).toBe('live');
    });

    it('should have a logger', () => {
      expect(handlers.logger).toBeDefined();
    });
  });

  describe('handle', () => {
    it('should throw on unknown tool name', async () => {
      await expect(handlers.handle('migration_unknown', {})).rejects.toThrow('Unknown migration tool');
    });

    it('should have a handler for every tool definition', () => {
      for (const tool of MIGRATION_TOOL_DEFINITIONS) {
        const handlerName = `_handle_${tool.name}`;
        expect(typeof handlers[handlerName]).toBe('function');
      }
    });

    it('should handle all 8 tools without error', async () => {
      const paramSets = {
        migration_list_objects: {},
        migration_get_object: { objectId: 'CUSTOMER_MASTER' },
        migration_run_object: { objectId: 'CUSTOMER_MASTER' },
        migration_run_all: {},
        migration_get_dependency_graph: {},
        migration_get_execution_order: {},
        migration_reconcile: {},
        migration_get_stats: {},
      };

      for (const [toolName, params] of Object.entries(paramSets)) {
        const result = await handlers.handle(toolName, params);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    });
  });

  describe('migration_list_objects', () => {
    it('should return object list', async () => {
      const result = await handlers.handle('migration_list_objects', {});
      expect(result.objects).toBeInstanceOf(Array);
      expect(result.objects.length).toBeGreaterThan(0);
      expect(result.objects[0]).toHaveProperty('id');
      expect(result.objects[0]).toHaveProperty('name');
      expect(result.objects[0]).toHaveProperty('category');
    });

    it('should filter by category', async () => {
      const result = await handlers.handle('migration_list_objects', { category: 'config' });
      for (const obj of result.objects) {
        expect(obj.category).toBe('config');
      }
    });
  });

  describe('migration_get_object', () => {
    it('should return object details with field mappings', async () => {
      const result = await handlers.handle('migration_get_object', { objectId: 'CUSTOMER_MASTER' });
      expect(result.objectId).toBe('CUSTOMER_MASTER');
      expect(result.sampleMapping).toBeInstanceOf(Array);
      expect(result.fieldMappings).toBeGreaterThan(0);
      expect(result.dependencies).toBeInstanceOf(Array);
    });

    it('should return error for unknown object', async () => {
      const result = await handlers.handle('migration_get_object', { objectId: 'NONEXISTENT' });
      expect(result.error).toBe('not_found');
    });
  });

  describe('migration_run_object', () => {
    it('should default to dryRun=true', async () => {
      const result = await handlers.handle('migration_run_object', { objectId: 'CUSTOMER_MASTER' });
      expect(result.dryRun).toBe(true);
      expect(result.loaded).toBe(0);
    });

    it('should include humanDecisionsRequired', async () => {
      const result = await handlers.handle('migration_run_object', { objectId: 'CUSTOMER_MASTER' });
      expect(result.humanDecisionsRequired).toBeInstanceOf(Array);
    });

    it('should return error for unknown object', async () => {
      const result = await handlers.handle('migration_run_object', { objectId: 'NONEXISTENT' });
      expect(result.error).toBe('not_found');
    });
  });

  describe('migration_get_dependency_graph', () => {
    it('should return execution waves', async () => {
      const result = await handlers.handle('migration_get_dependency_graph', {});
      expect(result.waves).toBeInstanceOf(Array);
      expect(result.totalWaves).toBeGreaterThan(0);
      expect(result.totalObjects).toBeGreaterThan(0);
    });
  });

  describe('migration_reconcile', () => {
    it('should return reconciliation results for all objects', async () => {
      const result = await handlers.handle('migration_reconcile', {});
      expect(result.reconciliation).toBeInstanceOf(Array);
      expect(result.overallMatchRate).toBeGreaterThan(0);
    });

    it('should filter by objectId', async () => {
      const result = await handlers.handle('migration_reconcile', { objectId: 'GL_ACCOUNT' });
      expect(result.objectId).toBe('GL_ACCOUNT');
      expect(result.reconciliation).toHaveLength(1);
    });
  });

  describe('migration_get_stats', () => {
    it('should return aggregate statistics', async () => {
      const result = await handlers.handle('migration_get_stats', {});
      expect(result.totalObjects).toBe(42);
      expect(result.totalFieldMappings).toBeGreaterThan(0);
      expect(result.objectsByCategory).toBeDefined();
    });
  });
});
