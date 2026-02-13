const EWMExtractor = require('../../../extraction/extractors/ewm-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('EWMExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new EWMExtractor(ctx);
    expect(ext.extractorId).toBe('EWM_EXTRACTOR');
    expect(ext.name).toBe('Extended Warehouse Management');
    expect(ext.module).toBe('EWM');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new EWMExtractor(ctx);
    const result = await ext.extract();
    expect(result.quants.length).toBeGreaterThan(0);
    expect(result.huItems.length).toBeGreaterThan(0);
    expect(result.warehouseConfig.length).toBeGreaterThan(0);
    expect(result.warehouseTasks.length).toBeGreaterThan(0);
    expect(result.waveHeaders.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new EWMExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(5);
    expect(tables.find(t => t.table === '/SCWM/AQUA')).toBeDefined();
    expect(tables.find(t => t.table === '/SCWM/HUITM')).toBeDefined();
    expect(tables.find(t => t.table === '/SCWM/T300')).toBeDefined();
    expect(tables.find(t => t.table === '/SCWM/TRSEG')).toBeDefined();
    expect(tables.find(t => t.table === '/SCWM/WAVEHDR')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new EWMExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(EWMExtractor._extractorId).toBe('EWM_EXTRACTOR');
    expect(EWMExtractor._module).toBe('EWM');
    expect(EWMExtractor._category).toBe('config');
  });
});
