const PPTransactionsExtractor = require('../../../extraction/extractors/pp-transactions');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('PPTransactionsExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PPTransactionsExtractor(ctx);
    expect(ext.extractorId).toBe('PP_TRANSACTIONS');
    expect(ext.name).toBe('PP Transaction Evidence');
    expect(ext.module).toBe('PP');
    expect(ext.category).toBe('transaction');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PPTransactionsExtractor(ctx);
    const result = await ext.extract();
    expect(result.productionOrders.length).toBeGreaterThan(0);
    expect(result.orderItems.length).toBeGreaterThan(0);
    expect(result.operations.length).toBeGreaterThan(0);
    expect(result.quantities.length).toBeGreaterThan(0);
    expect(result.reservations.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PPTransactionsExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(5);
    expect(tables.find(t => t.table === 'AFKO')).toBeDefined();
    expect(tables.find(t => t.table === 'AFPO')).toBeDefined();
    expect(tables.find(t => t.table === 'AFVC')).toBeDefined();
    expect(tables.find(t => t.table === 'RESB')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PPTransactionsExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(PPTransactionsExtractor._extractorId).toBe('PP_TRANSACTIONS');
    expect(PPTransactionsExtractor._module).toBe('PP');
    expect(PPTransactionsExtractor._category).toBe('transaction');
  });
});
