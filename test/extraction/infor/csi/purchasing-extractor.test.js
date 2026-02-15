const InforCSIPurchasingExtractor = require('../../../../extraction/infor/csi/purchasing-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforCSIPurchasingExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIPurchasingExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_CSI_PURCHASING');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIPurchasingExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.poHeaders).toBeDefined();
    expect(Array.isArray(result.poHeaders)).toBe(true);
    expect(result.poHeaders.length).toBeGreaterThan(0);

    expect(result.poLines).toBeDefined();
    expect(Array.isArray(result.poLines)).toBe(true);
    expect(result.poLines.length).toBeGreaterThan(0);

    expect(result.vendors).toBeDefined();
    expect(Array.isArray(result.vendors)).toBe(true);
    expect(result.vendors.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIPurchasingExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
