const InforM3CustomerExtractor = require('../../../../extraction/infor/m3/customer-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3CustomerExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3CustomerExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_CUSTOMER');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3CustomerExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.customers).toBeDefined();
    expect(Array.isArray(result.customers)).toBe(true);
    expect(result.customers.length).toBeGreaterThan(0);

    expect(result.customerAddresses).toBeDefined();
    expect(Array.isArray(result.customerAddresses)).toBe(true);
    expect(result.customerAddresses.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3CustomerExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
