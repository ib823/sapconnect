const InforM3ManufacturingExtractor = require('../../../../extraction/infor/m3/manufacturing-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3ManufacturingExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3ManufacturingExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_MANUFACTURING');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3ManufacturingExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.manufacturingOrders).toBeDefined();
    expect(Array.isArray(result.manufacturingOrders)).toBe(true);
    expect(result.manufacturingOrders.length).toBeGreaterThan(0);

    expect(result.operations).toBeDefined();
    expect(Array.isArray(result.operations)).toBe(true);
    expect(result.operations.length).toBeGreaterThan(0);

    expect(result.materials).toBeDefined();
    expect(Array.isArray(result.materials)).toBe(true);
    expect(result.materials.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3ManufacturingExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
