const COTransactionsExtractor = require('../../../extraction/extractors/co-transactions');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('COTransactionsExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new COTransactionsExtractor(ctx);
    expect(ext.extractorId).toBe('CO_TRANSACTIONS');
    expect(ext.name).toBe('CO Transaction Evidence');
    expect(ext.module).toBe('CO');
    expect(ext.category).toBe('transaction');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new COTransactionsExtractor(ctx);
    const result = await ext.extract();
    expect(result.documentHeaders.length).toBeGreaterThan(0);
    expect(result.lineItems.length).toBeGreaterThan(0);
    expect(result.externalPostings.length).toBeGreaterThan(0);
    expect(result.internalPostings.length).toBeGreaterThan(0);
    expect(result.allocationCycles).toBeDefined();
    expect(result.allocationCycles.headers.length).toBeGreaterThan(0);
    expect(result.allocationCycles.segments.length).toBeGreaterThan(0);
    expect(result.allocationCycles.details.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new COTransactionsExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(7);
    expect(tables.find(t => t.table === 'COBK')).toBeDefined();
    expect(tables.find(t => t.table === 'COEP')).toBeDefined();
    expect(tables.find(t => t.table === 'COSP')).toBeDefined();
    expect(tables.find(t => t.table === 'COSS')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new COTransactionsExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });
});
