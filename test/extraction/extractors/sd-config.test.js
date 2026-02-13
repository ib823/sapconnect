const SDConfigExtractor = require('../../../extraction/extractors/sd-config');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('SDConfigExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SDConfigExtractor(ctx);
    expect(ext.extractorId).toBe('SD_CONFIG');
    expect(ext.name).toBe('Sales & Distribution Configuration');
    expect(ext.module).toBe('SD');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SDConfigExtractor(ctx);
    const result = await ext.extract();
    expect(result.salesOrgs.length).toBeGreaterThan(0);
    expect(result.distributionChannels.length).toBeGreaterThan(0);
    expect(result.divisions.length).toBeGreaterThan(0);
    expect(result.salesDocTypes.length).toBeGreaterThan(0);
    expect(result.deliveryTypes.length).toBeGreaterThan(0);
    expect(result.billingTypes.length).toBeGreaterThan(0);
    expect(result.itemCategories.length).toBeGreaterThan(0);
    expect(result.scheduleLineCategories.length).toBeGreaterThan(0);
    expect(result.pricingProcedures.length).toBeGreaterThan(0);
    expect(result.conditionTypes.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SDConfigExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(11);
    expect(tables.find(t => t.table === 'TVKO')).toBeDefined();
    expect(tables.find(t => t.table === 'TVTW')).toBeDefined();
    expect(tables.find(t => t.table === 'TVAK')).toBeDefined();
    expect(tables.find(t => t.table === 'T685')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SDConfigExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(SDConfigExtractor._extractorId).toBe('SD_CONFIG');
    expect(SDConfigExtractor._module).toBe('SD');
    expect(SDConfigExtractor._category).toBe('config');
  });
});
