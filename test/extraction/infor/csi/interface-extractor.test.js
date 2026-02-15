const InforCSIInterfaceExtractor = require('../../../../extraction/infor/csi/interface-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforCSIInterfaceExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIInterfaceExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_CSI_INTERFACES');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIInterfaceExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.idoConnections).toBeDefined();
    expect(Array.isArray(result.idoConnections)).toBe(true);
    expect(result.idoConnections.length).toBeGreaterThan(0);

    expect(result.bodInterfaces).toBeDefined();
    expect(Array.isArray(result.bodInterfaces)).toBe(true);
    expect(result.bodInterfaces.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIInterfaceExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
