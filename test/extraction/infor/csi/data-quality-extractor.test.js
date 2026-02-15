const InforCSIDataQualityExtractor = require('../../../../extraction/infor/csi/data-quality-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforCSIDataQualityExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIDataQualityExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_CSI_DATA_QUALITY');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIDataQualityExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.tables).toBeDefined();
    expect(Array.isArray(result.tables)).toBe(true);
    expect(result.tables.length).toBeGreaterThan(0);

    expect(result.duplicates).toBeDefined();
    expect(Array.isArray(result.duplicates)).toBe(true);
    expect(result.duplicates.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIDataQualityExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
