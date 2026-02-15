/**
 * Tests for Infor LN Warehouse Extractor
 */
const InforLNWarehouseExtractor = require('../../../../extraction/infor/ln/warehouse-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNWarehouseExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNWarehouseExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_WAREHOUSE');
    expect(ext.name).toBe('Infor LN Warehouse');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNWarehouseExtractor(ctx);
    const result = await ext.extract();
    expect(result.warehouses).toBeDefined();
    expect(result.warehouses.length).toBeGreaterThan(0);
    expect(result.locations).toBeDefined();
    expect(result.locations.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNWarehouseExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'whwmd200')).toBe(true);
  });
});
