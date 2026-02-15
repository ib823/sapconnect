const InforLawsonHRExtractor = require('../../../../extraction/infor/lawson/hr-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLawsonHRExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonHRExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LAWSON_HR');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonHRExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.employees).toBeDefined();
    expect(Array.isArray(result.employees)).toBe(true);
    expect(result.employees.length).toBeGreaterThan(0);

    expect(result.departments).toBeDefined();
    expect(Array.isArray(result.departments)).toBe(true);
    expect(result.departments.length).toBeGreaterThan(0);

    expect(result.positions).toBeDefined();
    expect(Array.isArray(result.positions)).toBe(true);
    expect(result.positions.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonHRExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
