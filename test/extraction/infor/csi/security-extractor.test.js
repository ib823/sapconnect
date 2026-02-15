const InforCSISecurityExtractor = require('../../../../extraction/infor/csi/security-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforCSISecurityExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSISecurityExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_CSI_SECURITY');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSISecurityExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.users).toBeDefined();
    expect(Array.isArray(result.users)).toBe(true);
    expect(result.users.length).toBeGreaterThan(0);

    expect(result.groups).toBeDefined();
    expect(Array.isArray(result.groups)).toBe(true);
    expect(result.groups.length).toBeGreaterThan(0);

    expect(result.permissions).toBeDefined();
    expect(Array.isArray(result.permissions)).toBe(true);
    expect(result.permissions.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSISecurityExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
