const SDTransactionsExtractor = require('../../../extraction/extractors/sd-transactions');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('SDTransactionsExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SDTransactionsExtractor(ctx);
    expect(ext.extractorId).toBe('SD_TRANSACTIONS');
    expect(ext.name).toBe('SD Transaction Evidence');
    expect(ext.module).toBe('SD');
    expect(ext.category).toBe('transaction');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SDTransactionsExtractor(ctx);
    const result = await ext.extract();
    expect(result.salesOrders.length).toBeGreaterThan(0);
    expect(result.orderItems.length).toBeGreaterThan(0);
    expect(result.deliveries.length).toBeGreaterThan(0);
    expect(result.deliveryItems.length).toBeGreaterThan(0);
    expect(result.billingDocs.length).toBeGreaterThan(0);
    expect(result.billingItems.length).toBeGreaterThan(0);
    expect(result.shipments.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SDTransactionsExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(9);
    expect(tables.find(t => t.table === 'VBAK')).toBeDefined();
    expect(tables.find(t => t.table === 'VBAP')).toBeDefined();
    expect(tables.find(t => t.table === 'LIKP')).toBeDefined();
    expect(tables.find(t => t.table === 'VBRK')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SDTransactionsExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(SDTransactionsExtractor._extractorId).toBe('SD_TRANSACTIONS');
    expect(SDTransactionsExtractor._module).toBe('SD');
    expect(SDTransactionsExtractor._category).toBe('transaction');
  });
});
