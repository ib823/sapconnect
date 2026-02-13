const VariantExtractor = require('../../../extraction/extractors/variant-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('VariantExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new VariantExtractor(ctx);
    expect(ext.extractorId).toBe('VARIANTS');
    expect(ext.name).toBe('Report Variants');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new VariantExtractor(ctx);
    const result = await ext.extract();
    expect(result.variants.length).toBeGreaterThan(0);
    expect(result.variantTexts.length).toBeGreaterThan(0);
    expect(result.selectionVariables.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new VariantExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(3);
    expect(tables.find(t => t.table === 'VARID')).toBeDefined();
    expect(tables.find(t => t.table === 'VARIT')).toBeDefined();
    expect(tables.find(t => t.table === 'TVARVC')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new VariantExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(VariantExtractor._extractorId).toBe('VARIANTS');
    expect(VariantExtractor._module).toBe('BASIS');
    expect(VariantExtractor._category).toBe('config');
  });
});
