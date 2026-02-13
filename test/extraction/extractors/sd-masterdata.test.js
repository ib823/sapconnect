const SDMasterdataExtractor = require('../../../extraction/extractors/sd-masterdata');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('SDMasterdataExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SDMasterdataExtractor(ctx);
    expect(ext.extractorId).toBe('SD_MASTERDATA');
    expect(ext.name).toBe('SD Master Data');
    expect(ext.module).toBe('SD');
    expect(ext.category).toBe('masterdata');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SDMasterdataExtractor(ctx);
    const result = await ext.extract();
    expect(result.customers.length).toBeGreaterThan(0);
    expect(result.salesAreas.length).toBeGreaterThan(0);
    expect(result.partnerFunctions.length).toBeGreaterThan(0);
    expect(result.customerHierarchy.length).toBeGreaterThan(0);
    expect(result.conditionRecords.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SDMasterdataExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(6);
    expect(tables.find(t => t.table === 'KNA1')).toBeDefined();
    expect(tables.find(t => t.table === 'KNVV')).toBeDefined();
    expect(tables.find(t => t.table === 'KNVP')).toBeDefined();
    expect(tables.find(t => t.table === 'KONH')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SDMasterdataExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(SDMasterdataExtractor._extractorId).toBe('SD_MASTERDATA');
    expect(SDMasterdataExtractor._module).toBe('SD');
    expect(SDMasterdataExtractor._category).toBe('masterdata');
  });
});
