const GTSExtractor = require('../../../extraction/extractors/gts-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('GTSExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new GTSExtractor(ctx);
    expect(ext.extractorId).toBe('GTS_EXTRACTOR');
    expect(ext.name).toBe('Global Trade Services');
    expect(ext.module).toBe('GTS');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new GTSExtractor(ctx);
    const result = await ext.extract();
    expect(result.customsProducts.length).toBeGreaterThan(0);
    expect(result.legalRegulations.length).toBeGreaterThan(0);
    expect(result.sanctionedParties.length).toBeGreaterThan(0);
    expect(result.preferenceProcessing.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new GTSExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(4);
    expect(tables.find(t => t.table === '/SAPSLL/TCDP')).toBeDefined();
    expect(tables.find(t => t.table === '/SAPSLL/LEGL')).toBeDefined();
    expect(tables.find(t => t.table === '/SAPSLL/SANCL')).toBeDefined();
    expect(tables.find(t => t.table === '/SAPSLL/PRFER')).toBeDefined();
  });

  it('should mark all tables as non-critical', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new GTSExtractor(ctx);
    const tables = ext.getExpectedTables();
    const criticalTables = tables.filter(t => t.critical === true);
    expect(criticalTables.length).toBe(0);
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new GTSExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(GTSExtractor._extractorId).toBe('GTS_EXTRACTOR');
    expect(GTSExtractor._module).toBe('GTS');
    expect(GTSExtractor._category).toBe('config');
  });
});
