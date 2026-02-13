const CustomCodeExtractor = require('../../../extraction/extractors/custom-code-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('CustomCodeExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new CustomCodeExtractor(ctx);
    expect(ext.extractorId).toBe('CUSTOM_CODE');
    expect(ext.name).toBe('Custom Code Inventory');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('code');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new CustomCodeExtractor(ctx);
    const result = await ext.extract();
    expect(result.customObjects.length).toBeGreaterThan(0);
    expect(result.customPrograms.length).toBeGreaterThan(0);
    expect(result.tableUsage.length).toBeGreaterThan(0);
    expect(result.includeUsage.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new CustomCodeExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(4);
    expect(tables.find(t => t.table === 'TADIR')).toBeDefined();
    expect(tables.find(t => t.table === 'TRDIR')).toBeDefined();
    expect(tables.find(t => t.table === 'D010TAB')).toBeDefined();
    expect(tables.find(t => t.table === 'D010INC')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new CustomCodeExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(CustomCodeExtractor._extractorId).toBe('CUSTOM_CODE');
    expect(CustomCodeExtractor._module).toBe('BASIS');
    expect(CustomCodeExtractor._category).toBe('code');
  });
});
