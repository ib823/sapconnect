/**
 * Tests for Infor LN Report Extractor
 */
const InforLNReportExtractor = require('../../../../extraction/infor/ln/report-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNReportExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNReportExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_REPORTS');
    expect(ext.name).toBe('Infor LN Reports and Batch Jobs');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNReportExtractor(ctx);
    const result = await ext.extract();
    expect(result.reports).toBeDefined();
    expect(result.reports.length).toBeGreaterThan(0);
    expect(result.batchJobs).toBeDefined();
    expect(result.batchJobs.length).toBeGreaterThan(0);
    expect(result.businessRules).toBeDefined();
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNReportExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'ttadv7500')).toBe(true);
  });
});
