const InforLawsonDataQualityExtractor = require('../../../../extraction/infor/lawson/data-quality-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLawsonDataQualityExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonDataQualityExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LAWSON_DATA_QUALITY');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonDataQualityExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.tableProfiles).toBeDefined();
    expect(Array.isArray(result.tableProfiles)).toBe(true);
    expect(result.tableProfiles.length).toBeGreaterThan(0);

    expect(result.crossTableIntegrity).toBeDefined();
    expect(Array.isArray(result.crossTableIntegrity)).toBe(true);
    expect(result.crossTableIntegrity.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonDataQualityExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
