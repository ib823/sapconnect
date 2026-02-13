const PPConfigExtractor = require('../../../extraction/extractors/pp-config');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('PPConfigExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PPConfigExtractor(ctx);
    expect(ext.extractorId).toBe('PP_CONFIG');
    expect(ext.name).toBe('Production Planning Configuration');
    expect(ext.module).toBe('PP');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PPConfigExtractor(ctx);
    const result = await ext.extract();
    expect(result.plantParams.length).toBeGreaterThan(0);
    expect(result.mrpControllers.length).toBeGreaterThan(0);
    expect(result.mrpProfiles.length).toBeGreaterThan(0);
    expect(result.orderTypes.length).toBeGreaterThan(0);
    expect(result.productionSchedulers.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PPConfigExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(6);
    expect(tables.find(t => t.table === 'T399D')).toBeDefined();
    expect(tables.find(t => t.table === 'T024D')).toBeDefined();
    expect(tables.find(t => t.table === 'T430')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PPConfigExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(PPConfigExtractor._extractorId).toBe('PP_CONFIG');
    expect(PPConfigExtractor._module).toBe('PP');
    expect(PPConfigExtractor._category).toBe('config');
  });
});
