const InforM3InterfaceExtractor = require('../../../../extraction/infor/m3/interface-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3InterfaceExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3InterfaceExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_INTERFACES');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3InterfaceExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.ionConnections).toBeDefined();
    expect(Array.isArray(result.ionConnections)).toBe(true);
    expect(result.ionConnections.length).toBeGreaterThan(0);

    expect(result.miPrograms).toBeDefined();
    expect(Array.isArray(result.miPrograms)).toBe(true);
    expect(result.miPrograms.length).toBeGreaterThan(0);

    expect(result.fileInterfaces).toBeDefined();
    expect(Array.isArray(result.fileInterfaces)).toBe(true);
    expect(result.fileInterfaces.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3InterfaceExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
