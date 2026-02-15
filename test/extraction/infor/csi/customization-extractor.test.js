const InforCSICustomizationExtractor = require('../../../../extraction/infor/csi/customization-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforCSICustomizationExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSICustomizationExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_CSI_CUSTOMIZATIONS');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSICustomizationExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.userDefinedFields).toBeDefined();
    expect(Array.isArray(result.userDefinedFields)).toBe(true);
    expect(result.userDefinedFields.length).toBeGreaterThan(0);

    expect(result.customForms).toBeDefined();
    expect(Array.isArray(result.customForms)).toBe(true);
    expect(result.customForms.length).toBeGreaterThan(0);

    expect(result.idoExtensions).toBeDefined();
    expect(Array.isArray(result.idoExtensions)).toBe(true);
    expect(result.idoExtensions.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSICustomizationExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
