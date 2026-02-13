const MMMasterdataExtractor = require('../../../extraction/extractors/mm-masterdata');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('MMMasterdataExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new MMMasterdataExtractor(ctx);
    expect(ext.extractorId).toBe('MM_MASTERDATA');
    expect(ext.name).toBe('MM Master Data');
    expect(ext.module).toBe('MM');
    expect(ext.category).toBe('masterdata');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new MMMasterdataExtractor(ctx);
    const result = await ext.extract();
    expect(result.materials.length).toBeGreaterThan(0);
    expect(result.plantData.length).toBeGreaterThan(0);
    expect(result.storageData.length).toBeGreaterThan(0);
    expect(result.salesData.length).toBeGreaterThan(0);
    expect(result.valuationData.length).toBeGreaterThan(0);
    expect(result.purchasingInfoRecords.length).toBeGreaterThan(0);
    expect(result.conditions.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new MMMasterdataExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(11);
    expect(tables.find(t => t.table === 'MARA')).toBeDefined();
    expect(tables.find(t => t.table === 'MARC')).toBeDefined();
    expect(tables.find(t => t.table === 'MARD')).toBeDefined();
    expect(tables.find(t => t.table === 'MBEW')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new MMMasterdataExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(MMMasterdataExtractor._extractorId).toBe('MM_MASTERDATA');
    expect(MMMasterdataExtractor._module).toBe('MM');
    expect(MMMasterdataExtractor._category).toBe('masterdata');
  });
});
