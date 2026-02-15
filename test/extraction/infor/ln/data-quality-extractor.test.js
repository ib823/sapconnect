/**
 * Tests for Infor LN Data Quality Extractor
 */
const InforLNDataQualityExtractor = require('../../../../extraction/infor/ln/data-quality-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNDataQualityExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNDataQualityExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_DATA_QUALITY');
    expect(ext.name).toBe('Infor LN Data Quality Profile');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNDataQualityExtractor(ctx);
    const result = await ext.extract();
    expect(result.tableProfiles).toBeDefined();
    expect(result.tableProfiles.length).toBeGreaterThan(0);
    expect(result.overallSummary).toBeDefined();
    expect(result.overallSummary.tablesProfiled).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNDataQualityExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'tcibd001')).toBe(true);
  });
});
