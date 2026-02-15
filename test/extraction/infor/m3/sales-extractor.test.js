const InforM3SalesExtractor = require('../../../../extraction/infor/m3/sales-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3SalesExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3SalesExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_SALES');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3SalesExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.orderHeaders).toBeDefined();
    expect(Array.isArray(result.orderHeaders)).toBe(true);
    expect(result.orderHeaders.length).toBeGreaterThan(0);

    expect(result.orderLines).toBeDefined();
    expect(Array.isArray(result.orderLines)).toBe(true);
    expect(result.orderLines.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3SalesExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
