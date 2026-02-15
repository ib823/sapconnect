const InforM3ProcessMiningExtractor = require('../../../../extraction/infor/m3/process-mining-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforM3ProcessMiningExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3ProcessMiningExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_M3_PROCESS_MINING');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3ProcessMiningExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.events).toBeDefined();
    expect(Array.isArray(result.events)).toBe(true);
    expect(result.events.length).toBeGreaterThan(0);

    expect(result.processVariants).toBeDefined();
    expect(Array.isArray(result.processVariants)).toBe(true);
    expect(result.processVariants.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforM3ProcessMiningExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
