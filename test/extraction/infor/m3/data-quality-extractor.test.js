const InforM3DataQualityExtractor = require('../../../../extraction/infor/m3/data-quality-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3DataQualityExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3DataQualityExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_DATA_QUALITY');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3DataQualityExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.tables).toBeDefined();
    expect(Array.isArray(result.tables)).toBe(true);
    expect(result.tables.length).toBeGreaterThan(0);

    expect(result.crossTableIntegrity).toBeDefined();
    expect(Array.isArray(result.crossTableIntegrity)).toBe(true);
    expect(result.crossTableIntegrity.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3DataQualityExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
