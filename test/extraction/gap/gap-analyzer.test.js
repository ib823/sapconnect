const GapAnalyzer = require('../../../extraction/gap/gap-analyzer');
const CoverageTracker = require('../../../extraction/coverage-tracker');

describe('GapAnalyzer', () => {
  function buildTestFixtures() {
    const coverage = new CoverageTracker();
    coverage.track('FI_CONFIG', 'T001', 'extracted', { rowCount: 3 });
    coverage.track('FI_CONFIG', 'T003', 'extracted', { rowCount: 10 });
    coverage.track('SECURITY', 'USR02', 'extracted', { rowCount: 50 });
    coverage.track('SECURITY', 'AGR_DEFINE', 'extracted', { rowCount: 20 });
    coverage.track('DATA_DICTIONARY', 'DD02L', 'extracted', { rowCount: 100 });
    coverage.track('INTERFACES', 'RFCDES', 'extracted', { rowCount: 5 });
    coverage.track('TRANSPORTS', 'E070', 'extracted', { rowCount: 80 });
    coverage.track('CUSTOM_CODE', 'TADIR', 'extracted', { rowCount: 200 });
    coverage.track('CHANGE_DOCUMENTS', 'CDHDR', 'extracted', { rowCount: 500 });
    coverage.track('BATCH_JOBS', 'TBTCO', 'extracted', { rowCount: 30 });
    coverage.track('MM_CONFIG', 'MARA', 'extracted', { rowCount: 100 });

    const extractionResults = {
      FI_CONFIG: { companyCodes: [{ BUKRS: '1000' }] },
      SECURITY: { users: [{ BNAME: 'ADMIN' }], roleDefinitions: [] },
      CHANGE_DOCUMENTS: {
        headers: [{ OBJECTCLAS: 'VERKBELEG', CHANGENR: '001' }],
        items: [],
      },
      USAGE_STATISTICS: {
        transactionUsage: [{ tcode: 'VA01', executions: 100 }],
      },
      WORKFLOWS: {
        templates: [{ WI_ID: '001' }],
      },
      INTERFACES: {
        rfcDestinations: [{ RFCDEST: 'DEST1', RFCTYPE: '3' }],
      },
    };

    const dataDictionary = {
      tables: { T001: {}, T003: {}, BKPF: {}, SKA1: {} },
    };

    return { coverage, extractionResults, dataDictionary };
  }

  it('should analyze gaps and return a structured result', async () => {
    const { coverage, extractionResults, dataDictionary } = buildTestFixtures();
    const analyzer = new GapAnalyzer(extractionResults, dataDictionary, coverage);
    const gaps = await analyzer.analyze();
    expect(gaps).toBeDefined();
    expect(gaps.extraction).toBeDefined();
    expect(gaps.authorization).toBeDefined();
    expect(gaps.systemType).toBeDefined();
    expect(gaps.dataVolume).toBeDefined();
    expect(gaps.process).toBeDefined();
    expect(gaps.interface).toBeDefined();
    expect(gaps.temporal).toBeDefined();
    expect(gaps.interpretation).toBeDefined();
  });

  it('should produce an extraction gap report with coverage stats', async () => {
    const { coverage, extractionResults, dataDictionary } = buildTestFixtures();
    const analyzer = new GapAnalyzer(extractionResults, dataDictionary, coverage);
    await analyzer.analyze();
    const gaps = analyzer.getGapReport();
    expect(gaps.generatedAt).toBeDefined();
    expect(gaps.extraction.totalTablesExtracted).toBeGreaterThan(0);
    expect(typeof gaps.totalGapCount).toBe('number');
  });

  it('should identify missing critical tables', async () => {
    const { coverage, extractionResults, dataDictionary } = buildTestFixtures();
    const analyzer = new GapAnalyzer(extractionResults, dataDictionary, coverage);
    await analyzer.analyze();
    const report = analyzer.getGapReport();
    // Some critical tables like BKPF, SKA1, KNA1, LFA1, MARA, EKKO, VBAK are not tracked
    expect(report.extraction.missingCriticalTables.length).toBeGreaterThan(0);
  });

  it('should return a confidence score with grade and breakdown', async () => {
    const { coverage, extractionResults, dataDictionary } = buildTestFixtures();
    const analyzer = new GapAnalyzer(extractionResults, dataDictionary, coverage);
    await analyzer.analyze();
    const score = analyzer.getConfidenceScore();
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(score.grade).toBeDefined();
    expect(score.breakdown).toBeDefined();
    expect(score.summary).toBeDefined();
  });

  it('should return a human validation checklist', async () => {
    const { coverage, extractionResults, dataDictionary } = buildTestFixtures();
    const analyzer = new GapAnalyzer(extractionResults, dataDictionary, coverage);
    await analyzer.analyze();
    const checklist = analyzer.getHumanValidationChecklist();
    expect(checklist.length).toBeGreaterThan(0);
    expect(checklist[0]).toContain('Verify');
  });

  it('should detect temporal gaps with archiving recommendation', async () => {
    const { coverage, extractionResults, dataDictionary } = buildTestFixtures();
    const analyzer = new GapAnalyzer(extractionResults, dataDictionary, coverage);
    await analyzer.analyze();
    const report = analyzer.getGapReport();
    expect(report.temporal.description).toContain('Historical');
    expect(report.temporal.recommendation).toContain('data retention');
  });

  it('should throw if getGapReport is called before analyze', () => {
    const coverage = new CoverageTracker();
    const analyzer = new GapAnalyzer({}, {}, coverage);
    expect(() => analyzer.getGapReport()).toThrow('Call analyze()');
  });
});
