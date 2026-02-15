const InforM3PurchasingExtractor = require('../../../../extraction/infor/m3/purchasing-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3PurchasingExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3PurchasingExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_PURCHASING');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3PurchasingExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.poHeaders).toBeDefined();
    expect(Array.isArray(result.poHeaders)).toBe(true);
    expect(result.poHeaders.length).toBeGreaterThan(0);

    expect(result.poLines).toBeDefined();
    expect(Array.isArray(result.poLines)).toBe(true);
    expect(result.poLines.length).toBeGreaterThan(0);

    expect(result.suppliers).toBeDefined();
    expect(Array.isArray(result.suppliers)).toBe(true);
    expect(result.suppliers.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3PurchasingExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
