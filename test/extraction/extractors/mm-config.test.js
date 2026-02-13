const MMConfigExtractor = require('../../../extraction/extractors/mm-config');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('MMConfigExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new MMConfigExtractor(ctx);
    expect(ext.extractorId).toBe('MM_CONFIG');
    expect(ext.name).toBe('Materials Management Configuration');
    expect(ext.module).toBe('MM');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new MMConfigExtractor(ctx);
    const result = await ext.extract();
    expect(result.purchasingOrgs.length).toBeGreaterThan(0);
    expect(result.purchasingGroups.length).toBeGreaterThan(0);
    expect(result.movementTypes.length).toBeGreaterThan(0);
    expect(result.docTypes.length).toBeGreaterThan(0);
    expect(result.plants.length).toBeGreaterThan(0);
    expect(result.storageLocations.length).toBeGreaterThan(0);
    expect(result.itemCategories.length).toBeGreaterThan(0);
    expect(result.materialGroups.length).toBeGreaterThan(0);
    expect(result.mrpControllers.length).toBeGreaterThan(0);
    expect(result.tolerances.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new MMConfigExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(12);
    expect(tables.find(t => t.table === 'T024E')).toBeDefined();
    expect(tables.find(t => t.table === 'T024')).toBeDefined();
    expect(tables.find(t => t.table === 'T156')).toBeDefined();
    expect(tables.find(t => t.table === 'T001W')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new MMConfigExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(MMConfigExtractor._extractorId).toBe('MM_CONFIG');
    expect(MMConfigExtractor._module).toBe('MM');
    expect(MMConfigExtractor._category).toBe('config');
  });
});
