const MMTransactionsExtractor = require('../../../extraction/extractors/mm-transactions');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('MMTransactionsExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new MMTransactionsExtractor(ctx);
    expect(ext.extractorId).toBe('MM_TRANSACTIONS');
    expect(ext.name).toBe('MM Transaction Evidence');
    expect(ext.module).toBe('MM');
    expect(ext.category).toBe('transaction');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new MMTransactionsExtractor(ctx);
    const result = await ext.extract();
    expect(result.purchaseOrders.length).toBeGreaterThan(0);
    expect(result.poItems.length).toBeGreaterThan(0);
    expect(result.poHistory.length).toBeGreaterThan(0);
    expect(result.requisitions.length).toBeGreaterThan(0);
    expect(result.materialDocuments.length).toBeGreaterThan(0);
    expect(result.confirmations.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new MMTransactionsExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(8);
    expect(tables.find(t => t.table === 'EKKO')).toBeDefined();
    expect(tables.find(t => t.table === 'EKPO')).toBeDefined();
    expect(tables.find(t => t.table === 'EKBE')).toBeDefined();
    expect(tables.find(t => t.table === 'EBAN')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new MMTransactionsExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(MMTransactionsExtractor._extractorId).toBe('MM_TRANSACTIONS');
    expect(MMTransactionsExtractor._module).toBe('MM');
    expect(MMTransactionsExtractor._category).toBe('transaction');
  });
});
