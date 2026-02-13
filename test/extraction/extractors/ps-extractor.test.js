const PSExtractor = require('../../../extraction/extractors/ps-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('PSExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PSExtractor(ctx);
    expect(ext.extractorId).toBe('PS_EXTRACTOR');
    expect(ext.name).toBe('Project System');
    expect(ext.module).toBe('PS');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PSExtractor(ctx);
    const result = await ext.extract();
    expect(result.projects.length).toBeGreaterThan(0);
    expect(result.wbsElements.length).toBeGreaterThan(0);
    expect(result.wbsHierarchy.length).toBeGreaterThan(0);
    expect(result.psOrders.length).toBeGreaterThan(0);
    expect(result.budgets.length).toBeGreaterThan(0);
    expect(result.systemStatus.length).toBeGreaterThan(0);
    expect(result.userStatus.length).toBeGreaterThan(0);
    expect(result.statusProfiles.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PSExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(8);
    expect(tables.find(t => t.table === 'PROJ')).toBeDefined();
    expect(tables.find(t => t.table === 'PRPS')).toBeDefined();
    expect(tables.find(t => t.table === 'PRHI')).toBeDefined();
    expect(tables.find(t => t.table === 'AUFK')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PSExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(PSExtractor._extractorId).toBe('PS_EXTRACTOR');
    expect(PSExtractor._module).toBe('PS');
    expect(PSExtractor._category).toBe('config');
  });
});
