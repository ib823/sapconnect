const InforLawsonSecurityExtractor = require('../../../../extraction/infor/lawson/security-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLawsonSecurityExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonSecurityExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LAWSON_SECURITY');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonSecurityExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.users).toBeDefined();
    expect(Array.isArray(result.users)).toBe(true);
    expect(result.users.length).toBeGreaterThan(0);

    expect(result.securityClasses).toBeDefined();
    expect(Array.isArray(result.securityClasses)).toBe(true);
    expect(result.securityClasses.length).toBeGreaterThan(0);

    expect(result.tokenAccess).toBeDefined();
    expect(Array.isArray(result.tokenAccess)).toBe(true);
    expect(result.tokenAccess.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonSecurityExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
