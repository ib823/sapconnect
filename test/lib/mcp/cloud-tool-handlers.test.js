/**
 * Tests for MCP Cloud Tool Handlers
 */
const { CloudToolHandlers } = require('../../../lib/mcp/cloud-tool-handlers');
const { CLOUD_TOOL_DEFINITIONS } = require('../../../lib/mcp/cloud-tools');

describe('CloudToolHandlers', () => {
  let handlers;

  beforeEach(() => {
    handlers = new CloudToolHandlers({ mode: 'mock', sessionContext: {} });
  });

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const h = new CloudToolHandlers();
      expect(h.mode).toBe('mock');
    });

    it('should accept custom mode', () => {
      const h = new CloudToolHandlers({ mode: 'live' });
      expect(h.mode).toBe('live');
    });

    it('should have a logger', () => {
      expect(handlers.logger).toBeDefined();
    });
  });

  describe('handle', () => {
    it('should throw on unknown tool name', async () => {
      await expect(handlers.handle('cloud_unknown', {})).rejects.toThrow('Unknown Cloud tool');
    });

    it('should have a handler for every tool definition', () => {
      for (const tool of CLOUD_TOOL_DEFINITIONS) {
        const handlerName = `_handle_${tool.name}`;
        expect(typeof handlers[handlerName]).toBe('function');
      }
    });

    it('should handle all 7 tools without error', async () => {
      const paramSets = {
        cloud_alm_sync_project: {},
        cloud_alm_sync_task: { taskId: 'TASK-001', status: 'in_progress' },
        cloud_alm_push_status: { phase: 'discover', status: 'completed' },
        cloud_alm_create_issue: { title: 'Test issue', description: 'A test issue' },
        cloud_provision_btp: { services: ['hana-cloud'] },
        cloud_discover_apis: {},
        cloud_get_provisioning_status: {},
      };

      for (const [toolName, params] of Object.entries(paramSets)) {
        const result = await handlers.handle(toolName, params);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    });
  });

  describe('cloud_alm_sync_project', () => {
    it('should return synced project with humanDecisionsRequired', async () => {
      const result = await handlers.handle('cloud_alm_sync_project', { projectName: 'Test Project' });
      expect(result.projectId).toBeDefined();
      expect(result.status).toBe('synced');
      expect(result.phases).toBeInstanceOf(Array);
      expect(result.humanDecisionsRequired).toBeInstanceOf(Array);
    });
  });

  describe('cloud_alm_sync_task', () => {
    it('should sync task status', async () => {
      const result = await handlers.handle('cloud_alm_sync_task', { taskId: 'TASK-042', status: 'completed' });
      expect(result.taskId).toBe('TASK-042');
      expect(result.status).toBe('completed');
    });
  });

  describe('cloud_alm_create_issue', () => {
    it('should create issue and return ID', async () => {
      const result = await handlers.handle('cloud_alm_create_issue', { title: 'Bug', description: 'A bug' });
      expect(result.issueId).toBeDefined();
      expect(result.title).toBe('Bug');
      expect(result.status).toBe('open');
    });
  });

  describe('cloud_provision_btp', () => {
    it('should return cost estimate in dryRun mode', async () => {
      const result = await handlers.handle('cloud_provision_btp', { services: ['hana-cloud', 'launchpad'], dryRun: true });
      expect(result.dryRun).toBe(true);
      expect(result.services).toBeInstanceOf(Array);
      expect(result.totalCostEstimate).toBeDefined();
      expect(result.humanDecisionsRequired).toBeInstanceOf(Array);
    });
  });

  describe('cloud_discover_apis', () => {
    it('should return API catalog', async () => {
      const result = await handlers.handle('cloud_discover_apis', {});
      expect(result.apis).toBeInstanceOf(Array);
      expect(result.totalApis).toBeGreaterThan(0);
      expect(result.categories).toBeDefined();
    });

    it('should filter by category', async () => {
      const result = await handlers.handle('cloud_discover_apis', { category: 'masterData' });
      for (const api of result.apis) {
        expect(api.category).toBe('masterData');
      }
    });
  });

  describe('cloud_get_provisioning_status', () => {
    it('should return not_started when no provisioning', async () => {
      const result = await handlers.handle('cloud_get_provisioning_status', {});
      expect(result.status).toBe('not_started');
    });
  });
});
