const QMExtractor = require('../../../extraction/extractors/qm-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('QMExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new QMExtractor(ctx);
    expect(ext.extractorId).toBe('QM_EXTRACTOR');
    expect(ext.name).toBe('Quality Management');
    expect(ext.module).toBe('QM');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new QMExtractor(ctx);
    const result = await ext.extract();
    expect(result.inspectionLots.length).toBeGreaterThan(0);
    expect(result.sampleRecords.length).toBeGreaterThan(0);
    expect(result.usageDecisions.length).toBeGreaterThan(0);
    expect(result.characteristics.length).toBeGreaterThan(0);
    expect(result.defectItems.length).toBeGreaterThan(0);
    expect(result.catalogProfiles.length).toBeGreaterThan(0);
    expect(result.defectCodes.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new QMExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(7);
    expect(tables.find(t => t.table === 'QALS')).toBeDefined();
    expect(tables.find(t => t.table === 'QAVE')).toBeDefined();
    expect(tables.find(t => t.table === 'QAMV')).toBeDefined();
    expect(tables.find(t => t.table === 'TQ70')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new QMExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(QMExtractor._extractorId).toBe('QM_EXTRACTOR');
    expect(QMExtractor._module).toBe('QM');
    expect(QMExtractor._category).toBe('config');
  });
});
