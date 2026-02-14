const RepositoryCatalogExtractor = require('../../../extraction/extractors/repository-catalog');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('RepositoryCatalogExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new RepositoryCatalogExtractor(ctx);
    expect(ext.extractorId).toBe('REPOSITORY_CATALOG');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('code');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new RepositoryCatalogExtractor(ctx);
    const result = await ext.extract();
    expect(Object.keys(result.objects).length).toBeGreaterThan(0);
    expect(Object.keys(result.programs).length).toBeGreaterThan(0);
    expect(Object.keys(result.functionModules).length).toBeGreaterThan(0);
    expect(Object.keys(result.packages).length).toBeGreaterThan(0);
    expect(result.stats.totalObjects).toBeGreaterThan(0);
    expect(result.stats.customObjects).toBeGreaterThan(0);
  });

  it('should track coverage', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new RepositoryCatalogExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.total).toBeGreaterThan(0);
  });
});
