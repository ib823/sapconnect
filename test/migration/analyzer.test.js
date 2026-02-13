const Analyzer = require('../../migration/analyzer');

function makeScanResult(sources = {}, objects = []) {
  return {
    objects: objects.length > 0 ? objects : Object.keys(sources).map((name) => ({ name, type: 'CLAS' })),
    sources,
    stats: { packages: 1, objects: Object.keys(sources).length, sourcesRead: Object.keys(sources).length, errors: 0 },
  };
}

describe('Analyzer', () => {
  const analyzer = new Analyzer();

  describe('scoring', () => {
    it('should return 100% for clean code', () => {
      const result = analyzer.analyze(makeScanResult({
        Z_CLEAN: { type: 'CLAS', source: 'DATA lv_name TYPE string.', lines: 1 },
      }));
      expect(result.summary.readinessScore).toBe(100);
      expect(result.summary.readinessGrade).toBe('A');
    });

    it('should penalize findings', () => {
      const result = analyzer.analyze(makeScanResult({
        Z_BAD: { type: 'CLAS', source: 'SELECT * FROM BSEG WHERE bukrs = lv_bukrs.', lines: 1 },
      }));
      expect(result.summary.readinessScore).toBeLessThan(100);
    });

    it('should return 100% for empty scan', () => {
      const result = analyzer.analyze(makeScanResult({}, []));
      expect(result.summary.readinessScore).toBe(100);
    });
  });

  describe('severity counting', () => {
    it('should count findings by severity', () => {
      const result = analyzer.analyze(makeScanResult({
        Z_TEST: {
          type: 'CLAS',
          source: [
            'SELECT * FROM BSEG.',     // critical
            'SELECT * FROM KNA1.',      // high
            'DATA lt OCCURS 0.',        // low
          ].join('\n'),
          lines: 3,
        },
      }));
      expect(result.severityCounts.critical).toBeGreaterThan(0);
      expect(result.severityCounts.high).toBeGreaterThan(0);
      expect(result.severityCounts.low).toBeGreaterThan(0);
    });
  });

  describe('effort estimation', () => {
    it('should estimate Low effort for few findings', () => {
      const result = analyzer.analyze(makeScanResult({
        Z_TEST: { type: 'CLAS', source: 'DATA lt OCCURS 0.', lines: 1 },
      }));
      expect(result.summary.effortEstimate.level).toBe('Low');
    });
  });

  describe('risk matrix', () => {
    it('should categorize objects in risk matrix', () => {
      const result = analyzer.analyze(makeScanResult({
        Z_CRIT: { type: 'CLAS', source: 'SELECT * FROM BSEG.', lines: 1 },
        Z_CLEAN: { type: 'CLAS', source: 'DATA lv_x TYPE i.', lines: 1 },
      }));
      expect(result.riskMatrix.critical.length).toBeGreaterThan(0);
      expect(result.riskMatrix.clean.length).toBeGreaterThan(0);
    });
  });

  describe('findings structure', () => {
    it('should include required fields on each finding', () => {
      const result = analyzer.analyze(makeScanResult({
        Z_TEST: { type: 'CLAS', source: 'SELECT * FROM BSEG.', lines: 1 },
      }));
      for (const f of result.findings) {
        expect(f.object).toBeDefined();
        expect(f.ruleId).toBeDefined();
        expect(f.severity).toBeDefined();
        expect(f.title).toBeDefined();
        expect(f.matches).toBeDefined();
      }
    });

    it('should contain findings from multiple objects', () => {
      const result = analyzer.analyze(makeScanResult({
        Z_FIN: {
          type: 'CLAS',
          source: 'SELECT * FROM BSEG.',
          lines: 1,
        },
        Z_ABAP: {
          type: 'CLAS',
          source: 'DATA lt OCCURS 0.',
          lines: 1,
        },
      }));
      expect(result.findings.length).toBeGreaterThanOrEqual(2);
      const severities = new Set(result.findings.map((f) => f.severity));
      expect(severities.has('critical')).toBe(true);
      expect(severities.has('low')).toBe(true);
    });
  });

  describe('rulesChecked', () => {
    it('should report how many rules were checked', () => {
      const result = analyzer.analyze(makeScanResult({
        Z_CLEAN: { type: 'CLAS', source: 'DATA lv_x TYPE i.', lines: 1 },
      }));
      expect(result.rulesChecked).toBeGreaterThan(0);
    });
  });
});
