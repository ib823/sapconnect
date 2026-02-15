const InforLawsonInventoryExtractor = require('../../../../extraction/infor/lawson/inventory-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLawsonInventoryExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonInventoryExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LAWSON_INVENTORY');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonInventoryExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);

    expect(result.locations).toBeDefined();
    expect(Array.isArray(result.locations)).toBe(true);
    expect(result.locations.length).toBeGreaterThan(0);

    expect(result.stockBalances).toBeDefined();
    expect(Array.isArray(result.stockBalances)).toBe(true);
    expect(result.stockBalances.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonInventoryExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
