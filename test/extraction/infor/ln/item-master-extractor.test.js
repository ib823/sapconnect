/**
 * Tests for Infor LN Item Master Extractor
 */
const InforLNItemMasterExtractor = require('../../../../extraction/infor/ln/item-master-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNItemMasterExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNItemMasterExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_ITEM_MASTER');
    expect(ext.name).toBe('Infor LN Item Master');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNItemMasterExtractor(ctx);
    const result = await ext.extract();
    expect(result.items).toBeDefined();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.itemCosts).toBeDefined();
    expect(result.itemGroups).toBeDefined();
    expect(result.itemGroups.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNItemMasterExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'tcibd001')).toBe(true);
  });
});
