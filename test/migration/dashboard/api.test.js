const DashboardAPI = require('../../../migration/dashboard/api');
const MigrationObjectRegistry = require('../../../migration/objects/registry');
const { registry: ruleRegistry } = require('../../../migration/rules');
const ReconciliationEngine = require('../../../migration/reconciliation-engine');
const TestScenarioEngine = require('../../../migration/test-scenario-engine');

describe('DashboardAPI', () => {
  const gw = { mode: 'mock' };
  let api;
  let registry;

  beforeEach(() => {
    registry = new MigrationObjectRegistry();
    api = new DashboardAPI({
      registry,
      ruleRegistry,
      reconciliationEngine: new ReconciliationEngine(),
      testEngine: new TestScenarioEngine(),
      gateway: gw,
    });
  });

  // ── getSummary ─────────────────────────────────────────────

  describe('getSummary', () => {
    it('returns summary with object and rule counts', () => {
      const summary = api.getSummary();
      expect(summary.totalObjects).toBe(42);
      expect(summary.totalRules).toBeGreaterThan(200);
      expect(summary.timestamp).toBeDefined();
    });

    it('has null lastRun before any runs', () => {
      const summary = api.getSummary();
      expect(summary.lastRun).toBeNull();
    });

    it('has rules breakdown by severity', () => {
      const summary = api.getSummary();
      expect(summary.rulesBreakdown).toHaveProperty('critical');
      expect(summary.rulesBreakdown).toHaveProperty('high');
      expect(summary.rulesBreakdown).toHaveProperty('medium');
    });

    it('updates after a run', async () => {
      await api.runAll();
      const summary = api.getSummary();
      expect(summary.lastRun).not.toBeNull();
      expect(summary.lastRun.objectsRun).toBe(42);
      expect(summary.runHistory.length).toBe(1);
    });
  });

  // ── getObjects ─────────────────────────────────────────────

  describe('getObjects', () => {
    it('returns all 42 objects', () => {
      const objects = api.getObjects();
      expect(objects).toHaveLength(42);
    });

    it('each object has expected fields', () => {
      const objects = api.getObjects();
      for (const obj of objects) {
        expect(obj.objectId).toBeDefined();
        expect(obj.name).toBeDefined();
        expect(obj.fieldMappings).toBeGreaterThan(0);
        expect(obj.status).toBe('not_run');
      }
    });

    it('shows status after a run', async () => {
      await api.runAll();
      const objects = api.getObjects();
      const statuses = new Set(objects.map(o => o.status));
      expect(statuses.has('completed') || statuses.has('completed_with_errors')).toBe(true);
    });
  });

  // ── getObjectDetail ────────────────────────────────────────

  describe('getObjectDetail', () => {
    it('returns detail for valid object', () => {
      const detail = api.getObjectDetail('GL_BALANCE');
      expect(detail.objectId).toBe('GL_BALANCE');
      expect(detail.name).toBe('GL Account Balance');
      expect(detail.fieldMappings.length).toBeGreaterThan(0);
    });

    it('returns null for unknown object', () => {
      expect(api.getObjectDetail('NONEXISTENT')).toBeNull();
    });
  });

  // ── getRulesAnalysis ───────────────────────────────────────

  describe('getRulesAnalysis', () => {
    it('returns rules with counts', () => {
      const analysis = api.getRulesAnalysis();
      expect(analysis.total).toBeGreaterThan(200);
      expect(analysis.bySeverity).toHaveProperty('critical');
      expect(analysis.byCategory).toBeDefined();
      expect(analysis.rules.length).toBe(analysis.total);
    });

    it('rules have id, title, severity, category', () => {
      const analysis = api.getRulesAnalysis();
      for (const rule of analysis.rules.slice(0, 5)) {
        expect(rule.id).toBeDefined();
        expect(rule.title).toBeDefined();
        expect(rule.severity).toBeDefined();
        expect(rule.category).toBeDefined();
      }
    });
  });

  // ── getReconciliation ──────────────────────────────────────

  describe('getReconciliation', () => {
    it('returns no_data before any run', () => {
      const recon = api.getReconciliation();
      expect(recon.status).toBe('no_data');
    });

    it('returns reconciliation after run', async () => {
      await api.runAll();
      const recon = api.getReconciliation();
      expect(recon.reports).toBeDefined();
      expect(recon.summary).toBeDefined();
    });
  });

  // ── getTestScenarios ───────────────────────────────────────

  describe('getTestScenarios', () => {
    it('returns no_data before any run', () => {
      const tests = api.getTestScenarios();
      expect(tests.status).toBe('no_data');
    });

    it('returns scenarios after run', async () => {
      await api.runAll();
      const tests = api.getTestScenarios();
      expect(tests.scenarios).toBeDefined();
      expect(tests.stats.total).toBeGreaterThan(0);
    });
  });

  // ── runAll ─────────────────────────────────────────────────

  describe('runAll', () => {
    it('runs all objects and returns status', async () => {
      const result = await api.runAll();
      expect(result.status).toBeDefined();
      expect(result.stats.total).toBe(42);
      expect(result.timestamp).toBeDefined();
    });

    it('records in run history', async () => {
      await api.runAll();
      await api.runAll();
      const summary = api.getSummary();
      expect(summary.runHistory.length).toBe(2);
    });
  });

  // ── runObject ──────────────────────────────────────────────

  describe('runObject', () => {
    it('runs a single object', async () => {
      const result = await api.runObject('GL_BALANCE');
      expect(result.objectId).toBe('GL_BALANCE');
      expect(result.status).toBeDefined();
      expect(result.phases).toBeDefined();
    });

    it('returns error for unknown object', async () => {
      const result = await api.runObject('NONEXISTENT');
      expect(result.error).toBeDefined();
    });
  });

  // ── registerRoutes ─────────────────────────────────────────

  describe('registerRoutes', () => {
    it('registers 8 routes on a router', () => {
      const routes = [];
      const mockRouter = {
        get: (path, handler) => routes.push({ method: 'GET', path, handler }),
        post: (path, handler) => routes.push({ method: 'POST', path, handler }),
      };

      api.registerRoutes(mockRouter);
      expect(routes).toHaveLength(8);
      expect(routes.filter(r => r.method === 'GET')).toHaveLength(6);
      expect(routes.filter(r => r.method === 'POST')).toHaveLength(2);
    });
  });

  // ── Edge cases ─────────────────────────────────────────────

  describe('edge cases', () => {
    it('works with no registry', () => {
      const bare = new DashboardAPI({});
      expect(bare.getSummary().totalObjects).toBe(0);
      expect(bare.getObjects()).toEqual([]);
    });

    it('works with no rule registry', () => {
      const bare = new DashboardAPI({ registry });
      expect(bare.getRulesAnalysis().total).toBe(0);
    });
  });
});
