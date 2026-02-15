/**
 * Tests for Infor LN FI Config Extractor
 */
const InforLNFIConfigExtractor = require('../../../../extraction/infor/ln/fi-config-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNFIConfigExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNFIConfigExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_FI_CONFIG');
    expect(ext.name).toBe('Infor LN Financial Configuration');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNFIConfigExtractor(ctx);
    const result = await ext.extract();
    expect(result.chartsOfAccounts).toBeDefined();
    expect(result.chartsOfAccounts.length).toBeGreaterThan(0);
    expect(result.dimensions).toBeDefined();
    expect(result.dimensions.length).toBeGreaterThan(0);
    expect(result.journalGroups).toBeDefined();
    expect(result.taxCodes).toBeDefined();
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNFIConfigExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'tfgld010')).toBe(true);
  });
});
