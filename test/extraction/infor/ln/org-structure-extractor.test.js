/**
 * Tests for Infor LN Organization Structure Extractor
 */
const InforLNOrgStructureExtractor = require('../../../../extraction/infor/ln/org-structure-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNOrgStructureExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNOrgStructureExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_ORG_STRUCTURE');
    expect(ext.name).toBe('Infor LN Organization Structure');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNOrgStructureExtractor(ctx);
    const result = await ext.extract();
    expect(result.financialCompanies).toBeDefined();
    expect(result.financialCompanies.length).toBeGreaterThan(0);
    expect(result.logisticCompanies).toBeDefined();
    expect(result.logisticCompanies.length).toBeGreaterThan(0);
    expect(result.salesOffices).toBeDefined();
    expect(result.warehouses).toBeDefined();
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNOrgStructureExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'tcemm030')).toBe(true);
  });
});
