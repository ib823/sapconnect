/**
 * Tests for Infor LN Process Mining Extractor
 */
const InforLNProcessMiningExtractor = require('../../../../extraction/infor/ln/process-mining-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNProcessMiningExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNProcessMiningExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_PROCESS_MINING');
    expect(ext.name).toBe('Infor LN Process Mining');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNProcessMiningExtractor(ctx);
    const result = await ext.extract();
    expect(result.auditEvents).toBeDefined();
    expect(result.auditEvents.length).toBeGreaterThan(0);
    expect(result.processStats).toBeDefined();
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNProcessMiningExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'ttaud0100')).toBe(true);
  });
});
