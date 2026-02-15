/**
 * Tests for Infor LN Sales Extractor
 */
const InforLNSalesExtractor = require('../../../../extraction/infor/ln/sales-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNSalesExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNSalesExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_SALES');
    expect(ext.name).toBe('Infor LN Sales Orders');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNSalesExtractor(ctx);
    const result = await ext.extract();
    expect(result.salesOrders).toBeDefined();
    expect(result.salesOrders.length).toBeGreaterThan(0);
    expect(result.salesOrderLines).toBeDefined();
    expect(result.salesOrderLines.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNSalesExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'tdsls400')).toBe(true);
  });
});
