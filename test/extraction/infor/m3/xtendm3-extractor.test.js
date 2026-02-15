const InforM3XtendM3Extractor = require('../../../../extraction/infor/m3/xtendm3-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3XtendM3Extractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3XtendM3Extractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_XTENDM3');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3XtendM3Extractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.triggers).toBeDefined();
    expect(Array.isArray(result.triggers)).toBe(true);
    expect(result.triggers.length).toBeGreaterThan(0);

    expect(result.utilities).toBeDefined();
    expect(Array.isArray(result.utilities)).toBe(true);
    expect(result.utilities.length).toBeGreaterThan(0);

    expect(result.apiExtensions).toBeDefined();
    expect(Array.isArray(result.apiExtensions)).toBe(true);
    expect(result.apiExtensions.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3XtendM3Extractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
