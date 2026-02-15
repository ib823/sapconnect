/**
 * Tests for Infor LN Customization Extractor
 */
const InforLNCustomizationExtractor = require('../../../../extraction/infor/ln/customization-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNCustomizationExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNCustomizationExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_CUSTOMIZATION');
    expect(ext.name).toBe('Infor LN Customizations');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNCustomizationExtractor(ctx);
    const result = await ext.extract();
    expect(result.standardSessions).toBeDefined();
    expect(result.standardSessions.length).toBeGreaterThan(0);
    expect(result.customerSessions).toBeDefined();
    expect(result.customerSessions.length).toBeGreaterThan(0);
    expect(result.vrcPackages).toBeDefined();
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNCustomizationExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'ttadv0100')).toBe(true);
  });
});
