import { describe, it, expect } from 'vitest';
const FITransactionsExtractor = require('../../../extraction/extractors/fi-transactions');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('FITransactionsExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new FITransactionsExtractor(ctx);
    expect(ext.extractorId).toBe('FI_TRANSACTIONS');
    expect(ext.name).toBe('FI Transaction Evidence');
    expect(ext.module).toBe('FI');
    expect(ext.category).toBe('transaction');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new FITransactionsExtractor(ctx);
    const result = await ext.extract();
    expect(result.documentHeaders.length).toBeGreaterThan(0);
    expect(result.lineItems.length).toBeGreaterThan(0);
    expect(result.customerItems).toBeDefined();
    expect(result.customerItems.open.length).toBeGreaterThan(0);
    expect(result.customerItems.cleared.length).toBeGreaterThan(0);
    expect(result.vendorItems).toBeDefined();
    expect(result.vendorItems.open.length).toBeGreaterThan(0);
    expect(result.vendorItems.cleared.length).toBeGreaterThan(0);
    expect(result.glItems).toBeDefined();
    expect(result.glItems.open.length).toBeGreaterThan(0);
    expect(result.glItems.cleared.length).toBeGreaterThan(0);
    expect(result.journalEntries.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new FITransactionsExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(9);
    expect(tables.find(t => t.table === 'BKPF')).toBeDefined();
    expect(tables.find(t => t.table === 'BSEG')).toBeDefined();
    expect(tables.find(t => t.table === 'ACDOCA')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new FITransactionsExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });
});
