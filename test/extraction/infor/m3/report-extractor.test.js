const InforM3ReportExtractor = require('../../../../extraction/infor/m3/report-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3ReportExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3ReportExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_REPORTS');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3ReportExtractor(ctx);
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
    const ext = new InforM3ReportExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
