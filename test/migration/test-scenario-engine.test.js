const TestScenarioEngine = require('../../migration/test-scenario-engine');

describe('TestScenarioEngine', () => {
  let engine;

  beforeEach(() => { engine = new TestScenarioEngine(); });

  // ── Constructor ────────────────────────────────────────────

  it('creates with defaults', () => {
    expect(engine.modules).toBeNull();
  });

  it('accepts module filter', () => {
    const e = new TestScenarioEngine({ modules: ['FI', 'MM'] });
    expect(e.modules).toEqual(['FI', 'MM']);
  });

  // ── generateFromMigrationResults ───────────────────────────

  describe('generateFromMigrationResults', () => {
    const mockResults = [
      {
        objectId: 'GL_BALANCE',
        name: 'GL Balance',
        status: 'completed',
        phases: {
          extract: { recordCount: 30, records: [] },
          transform: { recordCount: 30, records: [], mappingSummary: { totalMappings: 70 } },
          validate: { status: 'passed', errorCount: 0 },
          load: { recordCount: 30, successCount: 30 },
        },
      },
      {
        objectId: 'BUSINESS_PARTNER',
        name: 'Business Partner',
        status: 'completed',
        phases: {
          extract: { recordCount: 80, records: [] },
          transform: { recordCount: 75, records: [], mappingSummary: { totalMappings: 80 } },
          validate: { status: 'passed', errorCount: 0 },
          load: { recordCount: 75, successCount: 74 },
        },
      },
    ];

    it('returns scenarios and stats', () => {
      const result = engine.generateFromMigrationResults(mockResults);
      expect(result).toHaveProperty('scenarios');
      expect(result).toHaveProperty('stats');
      expect(result.scenarios).toHaveProperty('comparison');
      expect(result.scenarios).toHaveProperty('process');
      expect(result.scenarios).toHaveProperty('regression');
      expect(result.scenarios).toHaveProperty('performance');
    });

    it('generates comparison scenarios for each result', () => {
      const result = engine.generateFromMigrationResults(mockResults);
      const cmp = result.scenarios.comparison;
      expect(cmp.length).toBeGreaterThanOrEqual(6); // 3 per result × 2
      expect(cmp.some(s => s.id === 'CMP-GL_BALANCE-COUNT')).toBe(true);
      expect(cmp.some(s => s.id === 'CMP-BUSINESS_PARTNER-LOAD')).toBe(true);
      expect(cmp.some(s => s.id === 'CMP-GL_BALANCE-QUALITY')).toBe(true);
    });

    it('generates regression scenarios for each result', () => {
      const result = engine.generateFromMigrationResults(mockResults);
      const reg = result.scenarios.regression;
      expect(reg.length).toBeGreaterThanOrEqual(4); // 2 per result × 2
      expect(reg.some(s => s.id === 'REG-GL_BALANCE-FIELDS')).toBe(true);
      expect(reg.some(s => s.id === 'REG-BUSINESS_PARTNER-NOLOSS')).toBe(true);
    });

    it('generates process scenarios from catalog', () => {
      const result = engine.generateFromMigrationResults(mockResults);
      expect(result.scenarios.process.length).toBeGreaterThanOrEqual(18);
    });

    it('stats total equals sum of all categories', () => {
      const result = engine.generateFromMigrationResults(mockResults);
      const { stats, scenarios } = result;
      expect(stats.total).toBe(
        scenarios.comparison.length + scenarios.process.length +
        scenarios.regression.length + scenarios.performance.length
      );
    });

    it('generates no performance scenarios without usage data', () => {
      const result = engine.generateFromMigrationResults(mockResults);
      expect(result.scenarios.performance).toHaveLength(0);
    });

    it('generates performance scenarios with usage data', () => {
      const usageData = {
        topTransactions: [
          { tcode: 'VA01', dailyVolume: 5000 },
          { tcode: 'ME21N', dailyVolume: 3000 },
          { tcode: 'FB50', dailyVolume: 500 },
        ],
      };
      const result = engine.generateFromMigrationResults(mockResults, usageData);
      expect(result.scenarios.performance).toHaveLength(3);
      expect(result.scenarios.performance[0].id).toBe('PERF-TX-VA01');
      expect(result.scenarios.performance[0].priority).toBe('critical');
      expect(result.scenarios.performance[2].priority).toBe('high');
    });

    it('handles empty migration results', () => {
      const result = engine.generateFromMigrationResults([]);
      expect(result.scenarios.comparison).toHaveLength(0);
      expect(result.scenarios.regression).toHaveLength(0);
      expect(result.scenarios.process.length).toBeGreaterThan(0); // catalog always generates
    });

    it('handles results without phases', () => {
      const result = engine.generateFromMigrationResults([{ objectId: 'X', name: 'X' }]);
      expect(result.scenarios.comparison).toHaveLength(0);
      expect(result.scenarios.regression).toHaveLength(0);
    });
  });

  // ── Comparison scenarios ───────────────────────────────────

  describe('_generateComparisonScenarios', () => {
    it('generates count scenario with correct expected value', () => {
      const result = {
        objectId: 'MAT', name: 'Material',
        phases: { extract: { recordCount: 150 } },
      };
      const scenarios = engine._generateComparisonScenarios(result);
      const count = scenarios.find(s => s.id === 'CMP-MAT-COUNT');
      expect(count).toBeDefined();
      expect(count.sourceAssertion.expected).toBe(150);
      expect(count.priority).toBe('critical');
      expect(count.autoGenerated).toBe(true);
    });

    it('generates load scenario when load phase present', () => {
      const result = {
        objectId: 'MAT', name: 'Material',
        phases: {
          extract: { recordCount: 100 },
          load: { recordCount: 100, successCount: 98 },
        },
      };
      const scenarios = engine._generateComparisonScenarios(result);
      const load = scenarios.find(s => s.id === 'CMP-MAT-LOAD');
      expect(load).toBeDefined();
      expect(load.targetAssertion.minPercent).toBe(98);
    });

    it('skips if no phases', () => {
      const scenarios = engine._generateComparisonScenarios({ objectId: 'X', name: 'X' });
      expect(scenarios).toHaveLength(0);
    });
  });

  // ── Regression scenarios ───────────────────────────────────

  describe('_generateRegressionScenarios', () => {
    it('generates field completeness and no-data-loss', () => {
      const result = {
        objectId: 'BP', name: 'BP',
        phases: {
          extract: { recordCount: 80 },
          transform: { recordCount: 75, mappingSummary: { totalMappings: 80 } },
        },
      };
      const scenarios = engine._generateRegressionScenarios(result);
      expect(scenarios).toHaveLength(2);
      expect(scenarios[0].check).toBe('field_completeness');
      expect(scenarios[0].mappingCount).toBe(80);
      expect(scenarios[1].check).toBe('no_data_loss');
      expect(scenarios[1].extractCount).toBe(80);
      expect(scenarios[1].transformCount).toBe(75);
    });
  });

  // ── Process scenarios ──────────────────────────────────────

  describe('_generateProcessScenarios', () => {
    it('generates all 18 catalog processes', () => {
      const scenarios = engine._generateProcessScenarios();
      expect(scenarios.length).toBe(18);
    });

    it('all scenarios have required fields', () => {
      const scenarios = engine._generateProcessScenarios();
      for (const s of scenarios) {
        expect(s.id).toBeDefined();
        expect(s.type).toBe('process');
        expect(s.module).toBeDefined();
        expect(s.name).toBeDefined();
        expect(s.steps.length).toBeGreaterThan(0);
        expect(s.expectedOutcome).toBeDefined();
      }
    });

    it('covers all core modules', () => {
      const scenarios = engine._generateProcessScenarios();
      const modules = new Set(scenarios.map(s => s.module));
      expect(modules.has('FI')).toBe(true);
      expect(modules.has('MM')).toBe(true);
      expect(modules.has('SD')).toBe(true);
      expect(modules.has('CO')).toBe(true);
      expect(modules.has('PP')).toBe(true);
      expect(modules.has('QM')).toBe(true);
      expect(modules.has('PS')).toBe(true);
    });

    it('has 7 FI processes', () => {
      const scenarios = engine._generateProcessScenarios();
      const fi = scenarios.filter(s => s.module === 'FI');
      expect(fi).toHaveLength(7);
    });

    it('filters by module when configured', () => {
      const filtered = new TestScenarioEngine({ modules: ['SD'] });
      const scenarios = filtered._generateProcessScenarios();
      expect(scenarios.every(s => s.module === 'SD')).toBe(true);
      expect(scenarios).toHaveLength(3);
    });
  });

  // ── Performance scenarios ──────────────────────────────────

  describe('_generatePerformanceScenarios', () => {
    it('generates from top transactions', () => {
      const usageData = {
        topTransactions: [
          { tcode: 'VA01', dailyVolume: 10000 },
          { tcode: 'ME21N', dailyVolume: 2000 },
        ],
      };
      const scenarios = engine._generatePerformanceScenarios(usageData);
      expect(scenarios).toHaveLength(2);
      expect(scenarios[0].targetResponseSec).toBe(2); // high volume
      expect(scenarios[1].targetResponseSec).toBe(5); // lower volume
    });

    it('limits to 10 transactions', () => {
      const usageData = {
        topTransactions: Array.from({ length: 15 }, (_, i) => ({
          tcode: `TX${i}`, dailyVolume: 100,
        })),
      };
      const scenarios = engine._generatePerformanceScenarios(usageData);
      expect(scenarios).toHaveLength(10);
    });

    it('handles alternative field names', () => {
      const usageData = {
        topTransactions: [
          { transaction: 'FB50', executions: 500, dailyVolume: 500 },
        ],
      };
      const scenarios = engine._generatePerformanceScenarios(usageData);
      expect(scenarios[0].id).toBe('PERF-TX-FB50');
    });

    it('handles empty top transactions', () => {
      const scenarios = engine._generatePerformanceScenarios({ topTransactions: [] });
      expect(scenarios).toHaveLength(0);
    });
  });
});
