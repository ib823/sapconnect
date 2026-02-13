const InterfaceExtractor = require('../../../extraction/extractors/interface-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('InterfaceExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InterfaceExtractor(ctx);
    expect(ext.extractorId).toBe('INTERFACES');
    expect(ext.name).toBe('Interface Landscape');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('interface');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InterfaceExtractor(ctx);
    const result = await ext.extract();
    expect(result.rfcDestinations.length).toBeGreaterThan(0);
    expect(result.trustedSystems.length).toBeGreaterThan(0);
    expect(result.idocOutbound.length).toBeGreaterThan(0);
    expect(result.idocInbound.length).toBeGreaterThan(0);
    expect(result.partnerProfiles.length).toBeGreaterThan(0);
    expect(result.idocStatistics.length).toBeGreaterThan(0);
    expect(result.messageTypes.length).toBeGreaterThan(0);
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.logicalSystems.length).toBeGreaterThan(0);
    expect(result.httpServices.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InterfaceExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(11);
    expect(tables.find(t => t.table === 'RFCDES')).toBeDefined();
    expect(tables.find(t => t.table === 'EDP13')).toBeDefined();
    expect(tables.find(t => t.table === 'TBDLS')).toBeDefined();
    expect(tables.find(t => t.table === 'HTTPURLLOC')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InterfaceExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(InterfaceExtractor._extractorId).toBe('INTERFACES');
    expect(InterfaceExtractor._module).toBe('BASIS');
    expect(InterfaceExtractor._category).toBe('interface');
  });
});
