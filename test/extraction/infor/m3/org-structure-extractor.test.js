const InforM3OrgStructureExtractor = require('../../../../extraction/infor/m3/org-structure-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3OrgStructureExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3OrgStructureExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_ORG_STRUCTURE');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3OrgStructureExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.companies).toBeDefined();
    expect(Array.isArray(result.companies)).toBe(true);
    expect(result.companies.length).toBeGreaterThan(0);

    expect(result.divisions).toBeDefined();
    expect(Array.isArray(result.divisions)).toBe(true);
    expect(result.divisions.length).toBeGreaterThan(0);

    expect(result.facilities).toBeDefined();
    expect(Array.isArray(result.facilities)).toBe(true);
    expect(result.facilities.length).toBeGreaterThan(0);

    expect(result.warehouses).toBeDefined();
    expect(Array.isArray(result.warehouses)).toBe(true);
    expect(result.warehouses.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3OrgStructureExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
