/**
 * Tests for Infor LN Business Partner Extractor
 */
const InforLNBPExtractor = require('../../../../extraction/infor/ln/bp-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNBPExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNBPExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_BP');
    expect(ext.name).toBe('Infor LN Business Partners');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNBPExtractor(ctx);
    const result = await ext.extract();
    expect(result.businessPartners).toBeDefined();
    expect(result.businessPartners.length).toBeGreaterThan(0);
    expect(result.addresses).toBeDefined();
    expect(result.addresses.length).toBeGreaterThan(0);
    expect(result.contacts).toBeDefined();
    expect(result.bankDetails).toBeDefined();
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNBPExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'tccom100')).toBe(true);
  });
});
