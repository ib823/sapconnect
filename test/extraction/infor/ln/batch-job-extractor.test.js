/**
 * Tests for Infor LN Batch Job Extractor
 */
const InforLNBatchJobExtractor = require('../../../../extraction/infor/ln/batch-job-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNBatchJobExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNBatchJobExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_BATCH_JOBS');
    expect(ext.name).toBe('Infor LN Batch Jobs');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNBatchJobExtractor(ctx);
    const result = await ext.extract();
    expect(result.scheduledJobs).toBeDefined();
    expect(result.scheduledJobs.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNBatchJobExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'ttjmg0100')).toBe(true);
  });
});
