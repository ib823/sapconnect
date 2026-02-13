const TestGenerator = require('../../migration/test-gen');

describe('TestGenerator', () => {
  // ── Constructor ──────────────────────────────────────────────

  describe('constructor', () => {
    it('creates instance with default modules [FI, MM, SD]', () => {
      const gen = new TestGenerator();
      expect(gen.modules).toEqual(['FI', 'MM', 'SD']);
    });

    it('accepts custom modules via options', () => {
      const gen = new TestGenerator({ modules: ['FI'] });
      expect(gen.modules).toEqual(['FI']);
    });
  });

  // ── generate() ───────────────────────────────────────────────

  describe('generate()', () => {
    let result;

    beforeEach(() => {
      const gen = new TestGenerator();
      result = gen.generate();
    });

    it('returns comparisonTests array', () => {
      expect(Array.isArray(result.comparisonTests)).toBe(true);
      expect(result.comparisonTests.length).toBeGreaterThan(0);
    });

    it('returns processTests array', () => {
      expect(Array.isArray(result.processTests)).toBe(true);
      expect(result.processTests.length).toBeGreaterThan(0);
    });

    it('comparison tests have required fields (id, name, sourceQuery, targetQuery)', () => {
      for (const test of result.comparisonTests) {
        expect(test).toHaveProperty('id');
        expect(test).toHaveProperty('name');
        expect(test).toHaveProperty('sourceQuery');
        expect(test).toHaveProperty('targetQuery');
        expect(typeof test.id).toBe('string');
        expect(typeof test.name).toBe('string');
        expect(typeof test.sourceQuery).toBe('string');
        expect(typeof test.targetQuery).toBe('string');
      }
    });

    it('comparison tests have description, tolerance, and priority', () => {
      for (const test of result.comparisonTests) {
        expect(test).toHaveProperty('description');
        expect(test).toHaveProperty('tolerance');
        expect(test).toHaveProperty('priority');
        expect(typeof test.tolerance).toBe('number');
      }
    });

    it('process tests have required fields (id, name, module, steps)', () => {
      for (const test of result.processTests) {
        expect(test).toHaveProperty('id');
        expect(test).toHaveProperty('name');
        expect(test).toHaveProperty('module');
        expect(test).toHaveProperty('steps');
        expect(typeof test.id).toBe('string');
        expect(typeof test.name).toBe('string');
        expect(typeof test.module).toBe('string');
      }
    });

    it('process tests have steps arrays with at least one step', () => {
      for (const test of result.processTests) {
        expect(Array.isArray(test.steps)).toBe(true);
        expect(test.steps.length).toBeGreaterThan(0);
        for (const step of test.steps) {
          expect(typeof step).toBe('string');
        }
      }
    });

    it('stats totalTests equals sum of comparison + process tests', () => {
      expect(result.stats.totalTests).toBe(
        result.stats.comparisonTests + result.stats.processTests,
      );
      expect(result.stats.comparisonTests).toBe(result.comparisonTests.length);
      expect(result.stats.processTests).toBe(result.processTests.length);
    });

    it('stats modules matches constructor modules', () => {
      expect(result.stats.modules).toEqual(['FI', 'MM', 'SD']);
    });
  });

  // ── Module filtering ─────────────────────────────────────────

  describe('module filtering', () => {
    it('custom modules filter tests to only those modules', () => {
      const gen = new TestGenerator({ modules: ['FI'] });
      const result = gen.generate();

      for (const test of result.comparisonTests) {
        expect(test.module).toBe('FI');
      }
      for (const test of result.processTests) {
        expect(test.module).toBe('FI');
      }
      expect(result.stats.modules).toEqual(['FI']);
    });

    it('FI module generates GL balance comparison test', () => {
      const gen = new TestGenerator({ modules: ['FI'] });
      const result = gen.generate();
      const glTest = result.comparisonTests.find(t => t.id === 'CMP-FI-001');
      expect(glTest).toBeDefined();
      expect(glTest.name).toBe('GL Balance Comparison');
    });

    it('MM module generates material master comparison test', () => {
      const gen = new TestGenerator({ modules: ['MM'] });
      const result = gen.generate();
      const mmTest = result.comparisonTests.find(t => t.id === 'CMP-MM-001');
      expect(mmTest).toBeDefined();
      expect(mmTest.name).toBe('Material Master Count');
    });

    it('SD module generates sales order comparison test', () => {
      const gen = new TestGenerator({ modules: ['SD'] });
      const result = gen.generate();
      const sdTest = result.comparisonTests.find(t => t.id === 'CMP-SD-001');
      expect(sdTest).toBeDefined();
      expect(sdTest.name).toBe('Open Sales Orders');
    });
  });
});
