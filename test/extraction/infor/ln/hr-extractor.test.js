/**
 * Tests for Infor LN HR Extractor
 */
const InforLNHRExtractor = require('../../../../extraction/infor/ln/hr-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNHRExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNHRExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_HR');
    expect(ext.name).toBe('Infor LN Human Resources');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNHRExtractor(ctx);
    const result = await ext.extract();
    expect(result.employees).toBeDefined();
    expect(result.employees.length).toBeGreaterThan(0);
    expect(result.departments).toBeDefined();
    expect(result.departments.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNHRExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'tccom001')).toBe(true);
  });
});
