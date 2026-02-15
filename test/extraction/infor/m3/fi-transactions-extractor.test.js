const InforM3FITransactionsExtractor = require('../../../../extraction/infor/m3/fi-transactions-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3FITransactionsExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3FITransactionsExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_FI_TRANSACTIONS');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3FITransactionsExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.journalEntries).toBeDefined();
    expect(Array.isArray(result.journalEntries)).toBe(true);
    expect(result.journalEntries.length).toBeGreaterThan(0);

    expect(result.arTransactions).toBeDefined();
    expect(Array.isArray(result.arTransactions)).toBe(true);
    expect(result.arTransactions.length).toBeGreaterThan(0);

    expect(result.apTransactions).toBeDefined();
    expect(Array.isArray(result.apTransactions)).toBe(true);
    expect(result.apTransactions.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3FITransactionsExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
