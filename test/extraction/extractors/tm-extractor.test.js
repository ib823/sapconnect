const TMExtractor = require('../../../extraction/extractors/tm-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('TMExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new TMExtractor(ctx);
    expect(ext.extractorId).toBe('TM_EXTRACTOR');
    expect(ext.name).toBe('Transportation Management');
    expect(ext.module).toBe('TM');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new TMExtractor(ctx);
    const result = await ext.extract();
    expect(result.transportOrders.length).toBeGreaterThan(0);
    expect(result.freightUnits.length).toBeGreaterThan(0);
    expect(result.carriers.length).toBeGreaterThan(0);
    expect(result.freightRates.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new TMExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(4);
    expect(tables.find(t => t.table === '/SCMTMS/TOR')).toBeDefined();
    expect(tables.find(t => t.table === '/SCMTMS/FU')).toBeDefined();
    expect(tables.find(t => t.table === '/SCMTMS/CARRIER')).toBeDefined();
    expect(tables.find(t => t.table === '/SCMTMS/RATE')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new TMExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(TMExtractor._extractorId).toBe('TM_EXTRACTOR');
    expect(TMExtractor._module).toBe('TM');
    expect(TMExtractor._category).toBe('config');
  });
});
