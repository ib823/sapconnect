const InforLawsonReportExtractor = require('../../../../extraction/infor/lawson/report-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLawsonReportExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonReportExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LAWSON_REPORTS');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonReportExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.reports).toBeDefined();
    expect(Array.isArray(result.reports)).toBe(true);
    expect(result.reports.length).toBeGreaterThan(0);

    expect(result.customReports).toBeDefined();
    expect(Array.isArray(result.customReports)).toBe(true);
    expect(result.customReports.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonReportExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
