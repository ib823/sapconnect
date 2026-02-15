const InforLawsonProcessMiningExtractor = require('../../../../extraction/infor/lawson/process-mining-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLawsonProcessMiningExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonProcessMiningExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LAWSON_PROCESS_MINING');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonProcessMiningExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.auditEvents).toBeDefined();
    expect(Array.isArray(result.auditEvents)).toBe(true);
    expect(result.auditEvents.length).toBeGreaterThan(0);

    expect(result.processVariants).toBeDefined();
    expect(Array.isArray(result.processVariants)).toBe(true);
    expect(result.processVariants.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLawsonProcessMiningExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
