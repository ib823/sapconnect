import { describe, it, expect } from 'vitest';
const FIMasterDataExtractor = require('../../../extraction/extractors/fi-masterdata');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('FIMasterDataExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new FIMasterDataExtractor(ctx);
    expect(ext.extractorId).toBe('FI_MASTERDATA');
    expect(ext.name).toBe('FI Master Data');
    expect(ext.module).toBe('FI');
    expect(ext.category).toBe('masterdata');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new FIMasterDataExtractor(ctx);
    const result = await ext.extract();
    expect(result.glAccounts).toBeDefined();
    expect(result.glAccounts.chartLevel.length).toBeGreaterThan(0);
    expect(result.glAccounts.chartTexts.length).toBeGreaterThan(0);
    expect(result.glAccounts.companyCodeLevel.length).toBeGreaterThan(0);
    expect(result.customers).toBeDefined();
    expect(result.customers.general.length).toBeGreaterThan(0);
    expect(result.customers.companyCode.length).toBeGreaterThan(0);
    expect(result.customers.salesArea.length).toBeGreaterThan(0);
    expect(result.customers.partnerFunctions.length).toBeGreaterThan(0);
    expect(result.vendors).toBeDefined();
    expect(result.vendors.general.length).toBeGreaterThan(0);
    expect(result.vendors.companyCode.length).toBeGreaterThan(0);
    expect(result.vendors.purchasingOrg.length).toBeGreaterThan(0);
    expect(result.assets).toBeDefined();
    expect(result.assets.general.length).toBeGreaterThan(0);
    expect(result.assets.depreciation.length).toBeGreaterThan(0);
    expect(result.assets.values.length).toBeGreaterThan(0);
    expect(result.assets.timeDependent.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new FIMasterDataExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(14);
    expect(tables.find(t => t.table === 'SKA1')).toBeDefined();
    expect(tables.find(t => t.table === 'KNA1')).toBeDefined();
    expect(tables.find(t => t.table === 'LFA1')).toBeDefined();
    expect(tables.find(t => t.table === 'ANLA')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new FIMasterDataExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });
});
