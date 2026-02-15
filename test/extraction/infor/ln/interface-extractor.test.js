/**
 * Tests for Infor LN Interface Extractor
 */
const InforLNInterfaceExtractor = require('../../../../extraction/infor/ln/interface-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNInterfaceExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNInterfaceExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_INTERFACES');
    expect(ext.name).toBe('Infor LN Interfaces');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNInterfaceExtractor(ctx);
    const result = await ext.extract();
    expect(result.ionConnections).toBeDefined();
    expect(result.ionConnections.length).toBeGreaterThan(0);
    expect(result.bodMappings).toBeDefined();
    expect(result.bodMappings.length).toBeGreaterThan(0);
    expect(result.mecMaps).toBeDefined();
    expect(result.ediPartners).toBeDefined();
    expect(result.fileInterfaces).toBeDefined();
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNInterfaceExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'ttadv6100')).toBe(true);
  });
});
