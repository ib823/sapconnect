const BWExtractor = require('../../../extraction/extractors/bw-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('BWExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new BWExtractor(ctx);
    expect(ext.extractorId).toBe('BW_EXTRACTOR');
    expect(ext.name).toBe('Business Warehouse');
    expect(ext.module).toBe('BW');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new BWExtractor(ctx);
    const result = await ext.extract();
    expect(result.dataSources.length).toBeGreaterThan(0);
    expect(result.transformations.length).toBeGreaterThan(0);
    expect(result.infoProviders.length).toBeGreaterThan(0);
    expect(result.infoObjects.length).toBeGreaterThan(0);
    expect(result.processChains.length).toBeGreaterThan(0);
    expect(result.processChainSteps.length).toBeGreaterThan(0);
    expect(result.extractionHistory.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new BWExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(7);
    expect(tables.find(t => t.table === 'RSOLTPSOURCE')).toBeDefined();
    expect(tables.find(t => t.table === 'RSTRANRULE')).toBeDefined();
    expect(tables.find(t => t.table === 'RSDCUBEMULTI')).toBeDefined();
    expect(tables.find(t => t.table === 'RSDIOBJ')).toBeDefined();
    expect(tables.find(t => t.table === 'RSPC')).toBeDefined();
    expect(tables.find(t => t.table === 'RSPCTOOL')).toBeDefined();
    expect(tables.find(t => t.table === 'RSSELDONE')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new BWExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(BWExtractor._extractorId).toBe('BW_EXTRACTOR');
    expect(BWExtractor._module).toBe('BW');
    expect(BWExtractor._category).toBe('config');
  });
});
