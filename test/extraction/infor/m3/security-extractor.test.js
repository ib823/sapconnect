const InforM3SecurityExtractor = require('../../../../extraction/infor/m3/security-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3SecurityExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3SecurityExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_SECURITY');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3SecurityExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.users).toBeDefined();
    expect(Array.isArray(result.users)).toBe(true);
    expect(result.users.length).toBeGreaterThan(0);

    expect(result.roles).toBeDefined();
    expect(Array.isArray(result.roles)).toBe(true);
    expect(result.roles.length).toBeGreaterThan(0);

    expect(result.functionAccess).toBeDefined();
    expect(Array.isArray(result.functionAccess)).toBe(true);
    expect(result.functionAccess.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3SecurityExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
