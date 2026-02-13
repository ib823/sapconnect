const TestRunner = require('../../migration/test-runner');
const TestGenerator = require('../../migration/test-gen');

describe('TestRunner', () => {
  let runner;
  let testSuite;

  beforeEach(() => {
    const gen = new TestGenerator({ modules: ['FI', 'MM', 'SD'] });
    testSuite = gen.generate();
    runner = new TestRunner(null, { logLevel: 'error' });
  });

  // ── Constructor ──────────────────────────────────────────────

  it('creates instance with gateway and options', () => {
    const r = new TestRunner('mock-gw', { verbose: true });
    expect(r.gateway).toBe('mock-gw');
    expect(r.verbose).toBe(true);
  });

  // ── run() ────────────────────────────────────────────────────

  describe('run()', () => {
    let results;

    beforeEach(async () => {
      results = await runner.run(testSuite);
    });

    it('returns comparisonResults array', () => {
      expect(Array.isArray(results.comparisonResults)).toBe(true);
      expect(results.comparisonResults.length).toBeGreaterThan(0);
    });

    it('returns processResults array', () => {
      expect(Array.isArray(results.processResults)).toBe(true);
      expect(results.processResults.length).toBeGreaterThan(0);
    });

    it('results have required fields (id, name, result)', () => {
      const all = [...results.comparisonResults, ...results.processResults];
      for (const r of all) {
        expect(r).toHaveProperty('id');
        expect(r).toHaveProperty('name');
        expect(r).toHaveProperty('result');
        expect(typeof r.id).toBe('string');
        expect(typeof r.name).toBe('string');
      }
    });

    it('each result has pass, fail, or skip', () => {
      const all = [...results.comparisonResults, ...results.processResults];
      for (const r of all) {
        expect(['pass', 'fail', 'skip']).toContain(r.result);
      }
    });

    it('results have details field', () => {
      const all = [...results.comparisonResults, ...results.processResults];
      for (const r of all) {
        expect(r).toHaveProperty('details');
        expect(typeof r.details).toBe('string');
      }
    });

    // ── Stats ────────────────────────────────────────────────

    it('stats has correct shape', () => {
      const { stats } = results;
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('passed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('skipped');
      expect(stats).toHaveProperty('passRate');
      expect(stats).toHaveProperty('duration');
      expect(stats).toHaveProperty('status');
    });

    it('stats total equals comparison + process results count', () => {
      expect(results.stats.total).toBe(
        results.comparisonResults.length + results.processResults.length,
      );
    });

    it('passRate is a percentage between 0 and 100', () => {
      expect(results.stats.passRate).toBeGreaterThanOrEqual(0);
      expect(results.stats.passRate).toBeLessThanOrEqual(100);
      expect(Number.isInteger(results.stats.passRate)).toBe(true);
    });

    it('status is ALL_PASSED or HAS_FAILURES', () => {
      expect(['ALL_PASSED', 'HAS_FAILURES']).toContain(results.stats.status);
    });

    it('duration string is present', () => {
      expect(typeof results.stats.duration).toBe('string');
      expect(results.stats.duration.length).toBeGreaterThan(0);
    });
  });
});
