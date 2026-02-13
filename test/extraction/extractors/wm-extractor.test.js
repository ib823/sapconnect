const WMExtractor = require('../../../extraction/extractors/wm-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('WMExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new WMExtractor(ctx);
    expect(ext.extractorId).toBe('WM_EXTRACTOR');
    expect(ext.name).toBe('Warehouse Management');
    expect(ext.module).toBe('WM');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new WMExtractor(ctx);
    const result = await ext.extract();
    expect(result.warehouseNumbers.length).toBeGreaterThan(0);
    expect(result.storageTypes.length).toBeGreaterThan(0);
    expect(result.storageSections.length).toBeGreaterThan(0);
    expect(result.storageBins.length).toBeGreaterThan(0);
    expect(result.quants.length).toBeGreaterThan(0);
    expect(result.transferOrders.length).toBeGreaterThan(0);
    expect(result.putAwayStrategies.length).toBeGreaterThan(0);
    expect(result.stockRemovalStrategies.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new WMExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(11);
    expect(tables.find(t => t.table === 'T300')).toBeDefined();
    expect(tables.find(t => t.table === 'T301')).toBeDefined();
    expect(tables.find(t => t.table === 'LQUA')).toBeDefined();
    expect(tables.find(t => t.table === 'LTBK')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new WMExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(WMExtractor._extractorId).toBe('WM_EXTRACTOR');
    expect(WMExtractor._module).toBe('WM');
    expect(WMExtractor._category).toBe('config');
  });
});
