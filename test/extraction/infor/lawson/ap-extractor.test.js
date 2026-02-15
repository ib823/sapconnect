const InforLawsonAPExtractor = require('../../../../extraction/infor/lawson/ap-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLawsonAPExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonAPExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LAWSON_AP');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonAPExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.vendors).toBeDefined();
    expect(Array.isArray(result.vendors)).toBe(true);
    expect(result.vendors.length).toBeGreaterThan(0);

    expect(result.invoices).toBeDefined();
    expect(Array.isArray(result.invoices)).toBe(true);
    expect(result.invoices.length).toBeGreaterThan(0);

    expect(result.payments).toBeDefined();
    expect(Array.isArray(result.payments)).toBe(true);
    expect(result.payments.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonAPExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
