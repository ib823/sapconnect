/**
 * Tests for Infor LN Config Extractor
 */
const InforLNConfigExtractor = require('../../../../extraction/infor/ln/config-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNConfigExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNConfigExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_CONFIG');
    expect(ext.name).toBe('Infor LN System Configuration');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNConfigExtractor(ctx);
    const result = await ext.extract();
    expect(result.companies).toBeDefined();
    expect(result.companies.length).toBeGreaterThan(0);
    expect(result.logisticCompanies).toBeDefined();
    expect(result.logisticCompanies.length).toBeGreaterThan(0);
    expect(result.generalParameters).toBeDefined();
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNConfigExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'tcemm030')).toBe(true);
  });
});
