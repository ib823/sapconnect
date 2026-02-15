const InforCSIFIExtractor = require('../../../../extraction/infor/csi/fi-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforCSIFIExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIFIExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_CSI_FI');
    expect(ext.name).toBeDefined();
    expect(typeof ext.name).toBe('string');
    expect(ext.name.length).toBeGreaterThan(0);
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIFIExtractor(ctx);
    const result = await ext.extract();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    expect(result.glAccounts).toBeDefined();
    expect(Array.isArray(result.glAccounts)).toBe(true);
    expect(result.glAccounts.length).toBeGreaterThan(0);

    expect(result.journalEntries).toBeDefined();
    expect(Array.isArray(result.journalEntries)).toBe(true);
    expect(result.journalEntries.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforCSIFIExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => {
      expect(t.table).toBeDefined();
      expect(t.description).toBeDefined();
      expect(typeof t.critical).toBe('boolean');
    });
  });
});
