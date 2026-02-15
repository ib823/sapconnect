/**
 * Tests for Infor LN Plant Maintenance Extractor
 */
const InforLNPMExtractor = require('../../../../extraction/infor/ln/pm-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNPMExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNPMExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_PM');
    expect(ext.name).toBe('Infor LN Plant Maintenance');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNPMExtractor(ctx);
    const result = await ext.extract();
    expect(result.equipment).toBeDefined();
    expect(result.equipment.length).toBeGreaterThan(0);
    expect(result.functionalLocations).toBeDefined();
    expect(result.functionalLocations.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNPMExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'tiasc001')).toBe(true);
  });
});
