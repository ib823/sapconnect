const InforLawsonARExtractor = require('../../../../extraction/infor/lawson/ar-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLawsonARExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonARExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LAWSON_AR');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonARExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.customers).toBeDefined();
    expect(Array.isArray(result.customers)).toBe(true);
    expect(result.customers.length).toBeGreaterThan(0);

    expect(result.invoices).toBeDefined();
    expect(Array.isArray(result.invoices)).toBe(true);
    expect(result.invoices.length).toBeGreaterThan(0);

    expect(result.receipts).toBeDefined();
    expect(Array.isArray(result.receipts)).toBe(true);
    expect(result.receipts.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonARExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
