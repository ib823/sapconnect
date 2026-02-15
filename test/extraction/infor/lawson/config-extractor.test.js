const InforLawsonConfigExtractor = require('../../../../extraction/infor/lawson/config-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLawsonConfigExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonConfigExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LAWSON_CONFIG');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonConfigExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.companies).toBeDefined();
    expect(Array.isArray(result.companies)).toBe(true);
    expect(result.companies.length).toBeGreaterThan(0);

    expect(result.processLevels).toBeDefined();
    expect(Array.isArray(result.processLevels)).toBe(true);
    expect(result.processLevels.length).toBeGreaterThan(0);

    expect(result.accountingUnits).toBeDefined();
    expect(Array.isArray(result.accountingUnits)).toBe(true);
    expect(result.accountingUnits.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonConfigExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
