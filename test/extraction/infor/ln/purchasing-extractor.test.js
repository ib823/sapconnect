/**
 * Tests for Infor LN Purchasing Extractor
 */
const InforLNPurchasingExtractor = require('../../../../extraction/infor/ln/purchasing-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNPurchasingExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNPurchasingExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_PURCHASING');
    expect(ext.name).toBe('Infor LN Purchase Orders');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNPurchasingExtractor(ctx);
    const result = await ext.extract();
    expect(result.purchaseOrders).toBeDefined();
    expect(result.purchaseOrders.length).toBeGreaterThan(0);
    expect(result.purchaseOrderLines).toBeDefined();
    expect(result.purchaseOrderLines.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNPurchasingExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'tdpur400')).toBe(true);
  });
});
