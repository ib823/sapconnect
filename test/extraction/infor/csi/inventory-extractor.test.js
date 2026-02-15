const InforCSIInventoryExtractor = require('../../../../extraction/infor/csi/inventory-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforCSIInventoryExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIInventoryExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_CSI_INVENTORY');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIInventoryExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.stockBalances).toBeDefined();
    expect(Array.isArray(result.stockBalances)).toBe(true);
    expect(result.stockBalances.length).toBeGreaterThan(0);

    expect(result.lotRecords).toBeDefined();
    expect(Array.isArray(result.lotRecords)).toBe(true);
    expect(result.lotRecords.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIInventoryExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
