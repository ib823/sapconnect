const InforM3CustomizationExtractor = require('../../../../extraction/infor/m3/customization-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3CustomizationExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3CustomizationExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_CUSTOMIZATION');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3CustomizationExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.customViews).toBeDefined();
    expect(Array.isArray(result.customViews)).toBe(true);
    expect(result.customViews.length).toBeGreaterThan(0);

    expect(result.customFields).toBeDefined();
    expect(Array.isArray(result.customFields)).toBe(true);
    expect(result.customFields.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3CustomizationExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
