const SystemInfoExtractor = require('../../../extraction/extractors/system-info');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('SystemInfoExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SystemInfoExtractor(ctx);
    expect(ext.extractorId).toBe('SYSTEM_INFO');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('metadata');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SystemInfoExtractor(ctx);
    const result = await ext.extract();
    expect(result.sid).toBe('ECD');
    expect(result.clients).toHaveLength(4);
    expect(result.components.length).toBeGreaterThan(0);
    expect(result.supportPackages.length).toBeGreaterThan(0);
    expect(result.parameters).toBeDefined();
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SystemInfoExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(4);
    expect(tables.find(t => t.table === 'T000')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SystemInfoExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });
});
