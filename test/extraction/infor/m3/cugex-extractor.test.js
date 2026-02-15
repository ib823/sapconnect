const InforM3CugexExtractor = require('../../../../extraction/infor/m3/cugex-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3CugexExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3CugexExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_CUGEX');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3CugexExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.cugexRecords).toBeDefined();
    expect(Array.isArray(result.cugexRecords)).toBe(true);
    expect(result.cugexRecords.length).toBeGreaterThan(0);

    expect(result.cugexDefinitions).toBeDefined();
    expect(Array.isArray(result.cugexDefinitions)).toBe(true);
    expect(result.cugexDefinitions.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3CugexExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
