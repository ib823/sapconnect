'use strict';

const pm = require('../../../extraction/process-mining/index');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Process Mining — Public API (index.js)', () => {

  // ── 1. Core data model classes exported ────────────────────────────────

  it('exports Event, Trace, EventLog classes', () => {
    expect(pm.Event).toBeDefined();
    expect(pm.Trace).toBeDefined();
    expect(pm.EventLog).toBeDefined();
    expect(typeof pm.Event).toBe('function');
    expect(typeof pm.Trace).toBe('function');
    expect(typeof pm.EventLog).toBe('function');
  });

  // ── 2. Algorithm classes exported ─────────────────────────────────────

  it('exports HeuristicMiner, VariantAnalyzer, PerformanceAnalyzer, ConformanceChecker, SocialNetworkMiner, KPIEngine', () => {
    expect(typeof pm.HeuristicMiner).toBe('function');
    expect(typeof pm.VariantAnalyzer).toBe('function');
    expect(typeof pm.PerformanceAnalyzer).toBe('function');
    expect(typeof pm.ConformanceChecker).toBe('function');
    expect(typeof pm.SocialNetworkMiner).toBe('function');
    expect(typeof pm.KPIEngine).toBe('function');
  });

  // ── 3. Result/report classes exported ─────────────────────────────────

  it('exports ProcessModel, VariantAnalysisResult, PerformanceResult, ConformanceResult, SocialNetworkResult, KPIReport, ProcessIntelligenceReport', () => {
    expect(typeof pm.ProcessModel).toBe('function');
    expect(typeof pm.VariantAnalysisResult).toBe('function');
    expect(typeof pm.PerformanceResult).toBe('function');
    expect(typeof pm.ConformanceResult).toBe('function');
    expect(typeof pm.SocialNetworkResult).toBe('function');
    expect(typeof pm.KPIReport).toBe('function');
    expect(typeof pm.ProcessIntelligenceReport).toBe('function');
  });

  // ── 4. Orchestrator exported ──────────────────────────────────────────

  it('exports ProcessIntelligenceEngine', () => {
    expect(typeof pm.ProcessIntelligenceEngine).toBe('function');
  });

  // ── 5. SAP config exports ─────────────────────────────────────────────

  it('exports TABLE_TYPES, PROCESS_CONFIGS, getProcessConfig, getAllProcessIds, getTablesForProcess, isS4Hana, adaptConfigForS4, getActivityFromTcode', () => {
    expect(pm.TABLE_TYPES).toBeDefined();
    expect(typeof pm.TABLE_TYPES).toBe('object');

    expect(pm.PROCESS_CONFIGS).toBeDefined();
    expect(typeof pm.PROCESS_CONFIGS).toBe('object');

    expect(typeof pm.getProcessConfig).toBe('function');
    expect(typeof pm.getAllProcessIds).toBe('function');
    expect(typeof pm.getTablesForProcess).toBe('function');
    expect(typeof pm.isS4Hana).toBe('function');
    expect(typeof pm.adaptConfigForS4).toBe('function');
    expect(typeof pm.getActivityFromTcode).toBe('function');
  });

  // ── 6. Reference model exports ────────────────────────────────────────

  it('exports ReferenceModel, REFERENCE_MODELS, getReferenceModel, getAllReferenceModelIds', () => {
    expect(typeof pm.ReferenceModel).toBe('function');
    expect(pm.REFERENCE_MODELS).toBeDefined();
    expect(typeof pm.REFERENCE_MODELS).toBe('object');
    expect(typeof pm.getReferenceModel).toBe('function');
    expect(typeof pm.getAllReferenceModelIds).toBe('function');
  });

  // ── 7. Classes are constructible ──────────────────────────────────────

  describe('Classes are constructible', () => {
    it('new EventLog(name)', () => {
      const log = new pm.EventLog('test-log');
      expect(log.name).toBe('test-log');
      expect(log.getCaseCount()).toBe(0);
    });

    it('new Event({...})', () => {
      const event = new pm.Event({
        activity: 'Test',
        timestamp: '2025-01-01T00:00:00Z',
        resource: 'User',
      });
      expect(event.activity).toBe('Test');
      expect(event.resource).toBe('User');
    });

    it('new Trace(caseId)', () => {
      const trace = new pm.Trace('T1');
      expect(trace.caseId).toBe('T1');
      expect(trace.events.length).toBe(0);
    });

    it('new HeuristicMiner()', () => {
      const miner = new pm.HeuristicMiner();
      expect(miner).toBeDefined();
      expect(typeof miner.mine).toBe('function');
    });

    it('new VariantAnalyzer()', () => {
      const va = new pm.VariantAnalyzer();
      expect(typeof va.analyze).toBe('function');
    });

    it('new PerformanceAnalyzer()', () => {
      const pa = new pm.PerformanceAnalyzer();
      expect(typeof pa.analyze).toBe('function');
    });

    it('new ConformanceChecker()', () => {
      const cc = new pm.ConformanceChecker();
      expect(typeof cc.check).toBe('function');
    });

    it('new SocialNetworkMiner()', () => {
      const snm = new pm.SocialNetworkMiner();
      expect(typeof snm.analyze).toBe('function');
    });

    it('new KPIEngine()', () => {
      const kpi = new pm.KPIEngine();
      expect(typeof kpi.calculate).toBe('function');
    });

    it('new ProcessIntelligenceEngine()', () => {
      const eng = new pm.ProcessIntelligenceEngine();
      expect(typeof eng.analyze).toBe('function');
      expect(typeof eng.analyzeProcess).toBe('function');
    });
  });

  // ── 8. Functions are callable ─────────────────────────────────────────

  describe('Functions are callable', () => {
    it('getAllProcessIds() returns an array of strings', () => {
      const ids = pm.getAllProcessIds();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        expect(typeof id).toBe('string');
      }
    });

    it('getAllReferenceModelIds() returns an array of strings', () => {
      const ids = pm.getAllReferenceModelIds();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBeGreaterThan(0);
    });

    it('getProcessConfig(id) returns a config object', () => {
      const config = pm.getProcessConfig('O2C');
      expect(config).toBeDefined();
      expect(config.id).toBe('O2C');
    });

    it('getReferenceModel(id) returns a ReferenceModel instance', () => {
      const model = pm.getReferenceModel('O2C');
      expect(model).toBeDefined();
      expect(model.id).toBe('O2C');
      expect(model.name).toBe('Order to Cash');
      expect(Array.isArray(model.activities)).toBe(true);
    });

    it('getTablesForProcess(id) returns table names', () => {
      const tables = pm.getTablesForProcess('O2C');
      expect(Array.isArray(tables)).toBe(true);
      expect(tables.length).toBeGreaterThan(0);
    });

    it('TABLE_TYPES has standard type keys', () => {
      expect(pm.TABLE_TYPES.RECORD).toBe('record');
      expect(pm.TABLE_TYPES.TRANSACTION).toBe('transaction');
      expect(pm.TABLE_TYPES.FLOW).toBe('flow');
      expect(pm.TABLE_TYPES.CHANGE).toBe('change');
      expect(pm.TABLE_TYPES.DETAIL).toBe('detail');
      expect(pm.TABLE_TYPES.STATUS).toBe('status');
      expect(pm.TABLE_TYPES.MASTER).toBe('master');
    });
  });

  // ── 9. Export count ───────────────────────────────────────────────────

  it('has at least 28 exports', () => {
    const exportKeys = Object.keys(pm);
    expect(exportKeys.length).toBeGreaterThanOrEqual(28);
  });

  // ── 10. O2C process ID is in both configs and reference models ────────

  it('O2C exists in both process configs and reference models', () => {
    const processIds = pm.getAllProcessIds();
    const refModelIds = pm.getAllReferenceModelIds();

    expect(processIds).toContain('O2C');
    expect(refModelIds).toContain('O2C');
  });

  // ── 11. ReferenceModel has expected structure ─────────────────────────

  it('ReferenceModel has activities, edges, startActivities, endActivities', () => {
    const model = pm.getReferenceModel('O2C');
    expect(Array.isArray(model.activities)).toBe(true);
    expect(Array.isArray(model.edges)).toBe(true);
    expect(Array.isArray(model.startActivities)).toBe(true);
    expect(Array.isArray(model.endActivities)).toBe(true);
    expect(model.activities.length).toBeGreaterThan(0);
    expect(model.edges.length).toBeGreaterThan(0);
  });

  // ── 12. PROCESS_CONFIGS has multiple processes ────────────────────────

  it('PROCESS_CONFIGS has multiple process entries', () => {
    const ids = Object.keys(pm.PROCESS_CONFIGS);
    expect(ids.length).toBeGreaterThanOrEqual(3);
  });

  // ── 13. REFERENCE_MODELS has multiple entries ─────────────────────────

  it('REFERENCE_MODELS has multiple entries', () => {
    const ids = Object.keys(pm.REFERENCE_MODELS);
    expect(ids.length).toBeGreaterThanOrEqual(3);
  });

  // ── 14. isS4Hana is callable ──────────────────────────────────────────

  it('isS4Hana() returns a boolean', () => {
    // isS4Hana might need params, but we test it's callable
    const result = pm.isS4Hana({ systemInfo: { version: 'S4' } });
    expect(typeof result).toBe('boolean');
  });

  // ── 15. Integration smoke test ────────────────────────────────────────

  it('create EventLog, add events, run ProcessIntelligenceEngine.analyze()', async () => {
    const log = new pm.EventLog('integration-test');

    // Build a small 3-case log
    for (let i = 0; i < 3; i++) {
      const caseId = `CASE-${i}`;
      const base = new Date('2025-06-01T00:00:00Z').getTime() + i * 3600000;

      log.addEvent(caseId, new pm.Event({
        activity: 'Create Sales Order',
        timestamp: new Date(base).toISOString(),
        resource: 'UserA',
      }));
      log.addEvent(caseId, new pm.Event({
        activity: 'Create Delivery',
        timestamp: new Date(base + 3600000).toISOString(),
        resource: 'UserB',
      }));
      log.addEvent(caseId, new pm.Event({
        activity: 'Create Invoice',
        timestamp: new Date(base + 7200000).toISOString(),
        resource: 'UserC',
      }));
      log.addEvent(caseId, new pm.Event({
        activity: 'Payment Received',
        timestamp: new Date(base + 10800000).toISOString(),
        resource: 'SYSTEM',
      }));
    }

    expect(log.getCaseCount()).toBe(3);
    expect(log.getEventCount()).toBe(12);

    const engine = new pm.ProcessIntelligenceEngine({ logLevel: 'error' });
    const report = await engine.analyze(log);

    expect(report).toBeInstanceOf(pm.ProcessIntelligenceReport);
    expect(report.phases.variantAnalysis).toBeDefined();
    expect(report.phases.processModel).toBeDefined();
    expect(report.phases.performance).toBeDefined();
    expect(report.phases.kpis).toBeDefined();
    expect(report.duration).toBeGreaterThanOrEqual(0);
  });

  // ── 16. getActivityFromTcode ──────────────────────────────────────────

  it('getActivityFromTcode returns a string or null', () => {
    // Test with known tcode
    const result = pm.getActivityFromTcode('VA01');
    // Could return a string or null depending on config
    expect(result === null || typeof result === 'string').toBe(true);
  });

  // ── 17. Exports match between index and individual modules ────────────

  it('ProcessIntelligenceEngine from index matches direct import', () => {
    const direct = require('../../../extraction/process-mining/process-intelligence-engine');
    expect(pm.ProcessIntelligenceEngine).toBe(direct.ProcessIntelligenceEngine);
    expect(pm.ProcessIntelligenceReport).toBe(direct.ProcessIntelligenceReport);
  });

  it('EventLog from index matches direct import', () => {
    const direct = require('../../../extraction/process-mining/event-log');
    expect(pm.EventLog).toBe(direct.EventLog);
    expect(pm.Event).toBe(direct.Event);
    expect(pm.Trace).toBe(direct.Trace);
  });

  it('KPIEngine from index matches direct import', () => {
    const direct = require('../../../extraction/process-mining/kpi-engine');
    expect(pm.KPIEngine).toBe(direct.KPIEngine);
    expect(pm.KPIReport).toBe(direct.KPIReport);
  });
});
