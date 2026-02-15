/**
 * Tests for Infor LN Financial Transactions Extractor
 */
const InforLNFITransactionsExtractor = require('../../../../extraction/infor/ln/fi-transactions-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNFITransactionsExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNFITransactionsExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_FI_TRANSACTIONS');
    expect(ext.name).toBe('Infor LN Financial Transactions');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNFITransactionsExtractor(ctx);
    const result = await ext.extract();
    expect(result.glDocuments).toBeDefined();
    expect(result.glDocuments.length).toBeGreaterThan(0);
    expect(result.glLineItems).toBeDefined();
    expect(result.glLineItems.length).toBeGreaterThan(0);
    expect(result.apInvoices).toBeDefined();
    expect(result.arInvoices).toBeDefined();
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNFITransactionsExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'tfgld100')).toBe(true);
  });
});
