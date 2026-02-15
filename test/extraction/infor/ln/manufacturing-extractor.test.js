/**
 * Tests for Infor LN Manufacturing Extractor
 */
const InforLNManufacturingExtractor = require('../../../../extraction/infor/ln/manufacturing-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNManufacturingExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNManufacturingExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_MANUFACTURING');
    expect(ext.name).toBe('Infor LN Manufacturing');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNManufacturingExtractor(ctx);
    const result = await ext.extract();
    expect(result.billsOfMaterial).toBeDefined();
    expect(result.billsOfMaterial.length).toBeGreaterThan(0);
    expect(result.bomComponents).toBeDefined();
    expect(result.bomComponents.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNManufacturingExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'tibom001')).toBe(true);
  });
});
