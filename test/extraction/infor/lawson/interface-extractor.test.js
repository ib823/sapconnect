const InforLawsonInterfaceExtractor = require('../../../../extraction/infor/lawson/interface-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLawsonInterfaceExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonInterfaceExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LAWSON_INTERFACES');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonInterfaceExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.lbiConnections).toBeDefined();
    expect(Array.isArray(result.lbiConnections)).toBe(true);
    expect(result.lbiConnections.length).toBeGreaterThan(0);

    expect(result.addIns).toBeDefined();
    expect(Array.isArray(result.addIns)).toBe(true);
    expect(result.addIns.length).toBeGreaterThan(0);

    expect(result.fileInterfaces).toBeDefined();
    expect(Array.isArray(result.fileInterfaces)).toBe(true);
    expect(result.fileInterfaces.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonInterfaceExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
