const InforCSIManufacturingExtractor = require('../../../../extraction/infor/csi/manufacturing-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforCSIManufacturingExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIManufacturingExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_CSI_MANUFACTURING');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIManufacturingExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.jobHeaders).toBeDefined();
    expect(Array.isArray(result.jobHeaders)).toBe(true);
    expect(result.jobHeaders.length).toBeGreaterThan(0);

    expect(result.jobRoutes).toBeDefined();
    expect(Array.isArray(result.jobRoutes)).toBe(true);
    expect(result.jobRoutes.length).toBeGreaterThan(0);

    expect(result.jobMaterials).toBeDefined();
    expect(Array.isArray(result.jobMaterials)).toBe(true);
    expect(result.jobMaterials.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIManufacturingExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
