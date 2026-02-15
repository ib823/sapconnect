const InforM3FIConfigExtractor = require('../../../../extraction/infor/m3/fi-config-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3FIConfigExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3FIConfigExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_FI_CONFIG');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3FIConfigExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.chartOfAccounts).toBeDefined();
    expect(typeof result.chartOfAccounts).toBe("object");

    expect(result.accountingRules).toBeDefined();
    expect(Array.isArray(result.accountingRules)).toBe(true);
    expect(result.accountingRules.length).toBeGreaterThan(0);

    expect(result.taxConfig).toBeDefined();
    expect(Array.isArray(result.taxConfig)).toBe(true);
    expect(result.taxConfig.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3FIConfigExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
