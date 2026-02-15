const InforCSIConfigExtractor = require('../../../../extraction/infor/csi/config-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforCSIConfigExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIConfigExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_CSI_CONFIG');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIConfigExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.sites).toBeDefined();
    expect(Array.isArray(result.sites)).toBe(true);
    expect(result.sites.length).toBeGreaterThan(0);

    expect(result.companyParams).toBeDefined();
    expect(typeof result.companyParams).toBe("object");

    expect(result.currencySettings).toBeDefined();
    expect(Array.isArray(result.currencySettings)).toBe(true);
    expect(result.currencySettings.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIConfigExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
