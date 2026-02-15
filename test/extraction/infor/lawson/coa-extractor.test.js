const InforLawsonCOAExtractor = require('../../../../extraction/infor/lawson/coa-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLawsonCOAExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonCOAExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LAWSON_COA');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonCOAExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.glAccounts).toBeDefined();
    expect(Array.isArray(result.glAccounts)).toBe(true);
    expect(result.glAccounts.length).toBeGreaterThan(0);

    expect(result.accountGroups).toBeDefined();
    expect(Array.isArray(result.accountGroups)).toBe(true);
    expect(result.accountGroups.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonCOAExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
