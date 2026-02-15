const InforM3WarehouseExtractor = require('../../../../extraction/infor/m3/warehouse-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3WarehouseExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3WarehouseExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_WAREHOUSE');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3WarehouseExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.warehouses).toBeDefined();
    expect(Array.isArray(result.warehouses)).toBe(true);
    expect(result.warehouses.length).toBeGreaterThan(0);

    expect(result.inventoryRecords).toBeDefined();
    expect(Array.isArray(result.inventoryRecords)).toBe(true);
    expect(result.inventoryRecords.length).toBeGreaterThan(0);

    expect(result.locations).toBeDefined();
    expect(Array.isArray(result.locations)).toBe(true);
    expect(result.locations.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3WarehouseExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
