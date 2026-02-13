const BatchJobExtractor = require('../../../extraction/extractors/batch-job-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('BatchJobExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new BatchJobExtractor(ctx);
    expect(ext.extractorId).toBe('BATCH_JOBS');
    expect(ext.name).toBe('Batch Job Catalog');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('process');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new BatchJobExtractor(ctx);
    const result = await ext.extract();
    expect(result.jobOverview.length).toBeGreaterThan(0);
    expect(result.jobSteps.length).toBeGreaterThan(0);
    expect(result.jobSchedules.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new BatchJobExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(3);
    expect(tables.find(t => t.table === 'TBTCO')).toBeDefined();
    expect(tables.find(t => t.table === 'TBTCP')).toBeDefined();
    expect(tables.find(t => t.table === 'TBTCS')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new BatchJobExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(BatchJobExtractor._extractorId).toBe('BATCH_JOBS');
    expect(BatchJobExtractor._module).toBe('BASIS');
    expect(BatchJobExtractor._category).toBe('process');
  });
});
