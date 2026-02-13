const ConfidenceScorer = require('../../../extraction/gap/confidence-scorer');

describe('ConfidenceScorer', () => {
  it('should calculate a confidence score from coverage and gap reports', () => {
    const scorer = new ConfidenceScorer();
    const coverageReport = { coverage: 85, extracted: 50, total: 60 };
    const gapReport = {
      extraction: { missingCriticalTables: [] },
      authorization: { count: 0 },
      dataVolume: { count: 0 },
    };
    const result = scorer.calculate(coverageReport, gapReport);
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(result.grade).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.breakdown).toBeDefined();
  });

  it('should return grade A for high coverage with no gaps', () => {
    const scorer = new ConfidenceScorer();
    const coverageReport = { coverage: 95 };
    const gapReport = {
      extraction: { missingCriticalTables: [] },
      authorization: { count: 0 },
      dataVolume: { count: 0 },
    };
    const result = scorer.calculate(coverageReport, gapReport);
    expect(result.grade).toBe('A');
    expect(result.overall).toBeGreaterThanOrEqual(90);
  });

  it('should reduce score for missing critical tables', () => {
    const scorer = new ConfidenceScorer();
    const coverageReport = { coverage: 80 };
    const gapReport = {
      extraction: { missingCriticalTables: ['T001', 'BKPF', 'EKKO'] },
      authorization: { count: 0 },
      dataVolume: { count: 0 },
    };
    const result = scorer.calculate(coverageReport, gapReport);
    expect(result.overall).toBeLessThan(80);
  });

  it('should reduce score for authorization gaps', () => {
    const scorer = new ConfidenceScorer();
    const coverageReport = { coverage: 80 };
    const gapReport = {
      extraction: { missingCriticalTables: [] },
      authorization: { count: 5 },
      dataVolume: { count: 0 },
    };
    const result = scorer.calculate(coverageReport, gapReport);
    expect(result.overall).toBeLessThan(80);
  });

  it('should reduce score for data volume gaps', () => {
    const scorer = new ConfidenceScorer();
    const coverageReport = { coverage: 80 };
    const gapReport = {
      extraction: { missingCriticalTables: [] },
      authorization: { count: 0 },
      dataVolume: { count: 10 },
    };
    const result = scorer.calculate(coverageReport, gapReport);
    expect(result.overall).toBeLessThan(80);
  });

  it('should return grade F for very low coverage', () => {
    const scorer = new ConfidenceScorer();
    const coverageReport = { coverage: 20 };
    const gapReport = {
      extraction: { missingCriticalTables: ['T001', 'BKPF', 'EKKO', 'VBAK', 'MARA', 'USR02'] },
      authorization: { count: 10 },
      dataVolume: { count: 5 },
    };
    const result = scorer.calculate(coverageReport, gapReport);
    expect(result.grade).toBe('F');
    expect(result.summary).toContain('Insufficient');
  });

  it('should include per-category breakdown', () => {
    const scorer = new ConfidenceScorer();
    const coverageReport = { coverage: 75 };
    const gapReport = {
      extraction: { missingCriticalTables: [] },
      authorization: { count: 0 },
      dataVolume: { count: 0 },
    };
    const result = scorer.calculate(coverageReport, gapReport);
    expect(result.breakdown.config).toBeDefined();
    expect(result.breakdown.config.score).toBeDefined();
    expect(result.breakdown.config.weight).toBeDefined();
    expect(result.breakdown.masterdata).toBeDefined();
    expect(result.breakdown.transaction).toBeDefined();
    expect(result.breakdown.code).toBeDefined();
    expect(result.breakdown.security).toBeDefined();
    expect(result.breakdown.interface).toBeDefined();
    expect(result.breakdown.process).toBeDefined();
  });

  it('should handle zero coverage', () => {
    const scorer = new ConfidenceScorer();
    const coverageReport = { coverage: 0 };
    const gapReport = {};
    const result = scorer.calculate(coverageReport, gapReport);
    expect(result.overall).toBe(0);
    expect(result.grade).toBe('F');
  });
});
