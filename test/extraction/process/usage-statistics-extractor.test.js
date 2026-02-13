const UsageStatisticsExtractor = require('../../../extraction/process/usage-statistics-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('UsageStatisticsExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new UsageStatisticsExtractor(ctx);
    expect(ext.extractorId).toBe('USAGE_STATISTICS');
    expect(ext.name).toBe('Usage Statistics');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('process');
  });

  it('should extract mock data with transaction usage, user activity, and time distribution', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new UsageStatisticsExtractor(ctx);
    const result = await ext.extract();
    expect(result.transactionUsage.length).toBeGreaterThan(0);
    expect(result.userActivity.length).toBeGreaterThan(0);
    expect(result.timeDistribution.length).toBeGreaterThan(0);
  });

  it('should include tcode, executions, and timing in transaction usage', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new UsageStatisticsExtractor(ctx);
    const result = await ext.extract();
    const first = result.transactionUsage[0];
    expect(first.tcode).toBeDefined();
    expect(first.executions).toBeGreaterThan(0);
    expect(first.totalTime).toBeGreaterThan(0);
    expect(first.avgTime).toBeGreaterThan(0);
  });

  it('should include user activity with top tcodes', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new UsageStatisticsExtractor(ctx);
    const result = await ext.extract();
    const first = result.userActivity[0];
    expect(first.user).toBeDefined();
    expect(first.totalExecutions).toBeGreaterThan(0);
    expect(first.topTcodes.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new UsageStatisticsExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(1);
    expect(tables.find(t => t.table === 'SWNCMONI')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new UsageStatisticsExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(UsageStatisticsExtractor._extractorId).toBe('USAGE_STATISTICS');
    expect(UsageStatisticsExtractor._module).toBe('BASIS');
    expect(UsageStatisticsExtractor._category).toBe('process');
  });
});
