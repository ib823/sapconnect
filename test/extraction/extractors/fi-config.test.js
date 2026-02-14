const FIConfigExtractor = require('../../../extraction/extractors/fi-config');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('FIConfigExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new FIConfigExtractor(ctx);
    expect(ext.extractorId).toBe('FI_CONFIG');
    expect(ext.name).toBe('Financial Accounting Configuration');
    expect(ext.module).toBe('FI');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new FIConfigExtractor(ctx);
    const result = await ext.extract();
    expect(result.companyCodes).toHaveLength(3);
    expect(result.documentTypes.length).toBeGreaterThan(0);
    expect(result.chartsOfAccounts.length).toBeGreaterThan(0);
    expect(result.postingKeys.length).toBeGreaterThan(0);
    expect(result.accountDetermination.length).toBeGreaterThan(0);
    expect(result.paymentConfig.length).toBeGreaterThan(0);
    expect(result.taxCodes.length).toBeGreaterThan(0);
    expect(result.countries.length).toBeGreaterThan(0);
    expect(result.creditControlAreas.length).toBeGreaterThan(0);
    expect(result.banks.length).toBeGreaterThan(0);
    expect(result.assetClasses.length).toBeGreaterThan(0);
    expect(result.depreciationAreas.length).toBeGreaterThan(0);
    expect(result.businessAreas.length).toBeGreaterThan(0);
    expect(result.ledgerConfig.length).toBeGreaterThan(0);
    expect(result.documentSplitting.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new FIConfigExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(24);
    expect(tables.find(t => t.table === 'T001')).toBeDefined();
    expect(tables.find(t => t.table === 'T003')).toBeDefined();
    expect(tables.find(t => t.table === 'TBSL')).toBeDefined();
    expect(tables.find(t => t.table === 'FINSC_LEDGER')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new FIConfigExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });
});
