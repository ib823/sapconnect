/**
 * Tests for Infor LN BOL Script Extractor
 */
const InforLNBOLScriptExtractor = require('../../../../extraction/infor/ln/bol-script-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNBOLScriptExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNBOLScriptExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_BOL_SCRIPTS');
    expect(ext.name).toBe('Infor LN BOL Scripts and User Exits');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNBOLScriptExtractor(ctx);
    const result = await ext.extract();
    expect(result.bolScripts).toBeDefined();
    expect(result.bolScripts.length).toBeGreaterThan(0);
    expect(result.userExits).toBeDefined();
    expect(result.userExits.length).toBeGreaterThan(0);
    expect(result.demCustomizations).toBeDefined();
    expect(result.chartFieldExtensions).toBeDefined();
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNBOLScriptExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'ttadv3100')).toBe(true);
  });
});
