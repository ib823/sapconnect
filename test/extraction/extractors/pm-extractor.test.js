const PMExtractor = require('../../../extraction/extractors/pm-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('PMExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PMExtractor(ctx);
    expect(ext.extractorId).toBe('PM_EXTRACTOR');
    expect(ext.name).toBe('Plant Maintenance');
    expect(ext.module).toBe('PM');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PMExtractor(ctx);
    const result = await ext.extract();
    expect(result.equipment.length).toBeGreaterThan(0);
    expect(result.functionalLocations.length).toBeGreaterThan(0);
    expect(result.maintenancePlans.length).toBeGreaterThan(0);
    expect(result.notifications.length).toBeGreaterThan(0);
    expect(result.planningPlants.length).toBeGreaterThan(0);
    expect(result.plannerGroups.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PMExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(10);
    expect(tables.find(t => t.table === 'EQUI')).toBeDefined();
    expect(tables.find(t => t.table === 'IFLOT')).toBeDefined();
    expect(tables.find(t => t.table === 'MPLA')).toBeDefined();
    expect(tables.find(t => t.table === 'QMIH')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PMExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(PMExtractor._extractorId).toBe('PM_EXTRACTOR');
    expect(PMExtractor._module).toBe('PM');
    expect(PMExtractor._category).toBe('config');
  });
});
