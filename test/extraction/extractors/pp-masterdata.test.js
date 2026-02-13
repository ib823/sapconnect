const PPMasterdataExtractor = require('../../../extraction/extractors/pp-masterdata');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('PPMasterdataExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PPMasterdataExtractor(ctx);
    expect(ext.extractorId).toBe('PP_MASTERDATA');
    expect(ext.name).toBe('PP Master Data');
    expect(ext.module).toBe('PP');
    expect(ext.category).toBe('masterdata');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PPMasterdataExtractor(ctx);
    const result = await ext.extract();
    expect(result.bomLinks.length).toBeGreaterThan(0);
    expect(result.bomHeaders.length).toBeGreaterThan(0);
    expect(result.bomItems.length).toBeGreaterThan(0);
    expect(result.routingHeaders.length).toBeGreaterThan(0);
    expect(result.routingOperations.length).toBeGreaterThan(0);
    expect(result.workCenters.length).toBeGreaterThan(0);
    expect(result.taskListAssignments.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PPMasterdataExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(8);
    expect(tables.find(t => t.table === 'MAST')).toBeDefined();
    expect(tables.find(t => t.table === 'STKO')).toBeDefined();
    expect(tables.find(t => t.table === 'PLKO')).toBeDefined();
    expect(tables.find(t => t.table === 'CRHD')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PPMasterdataExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(PPMasterdataExtractor._extractorId).toBe('PP_MASTERDATA');
    expect(PPMasterdataExtractor._module).toBe('PP');
    expect(PPMasterdataExtractor._category).toBe('masterdata');
  });
});
