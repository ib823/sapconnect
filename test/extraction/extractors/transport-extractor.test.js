const TransportExtractor = require('../../../extraction/extractors/transport-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('TransportExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new TransportExtractor(ctx);
    expect(ext.extractorId).toBe('TRANSPORTS');
    expect(ext.name).toBe('Transport History');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new TransportExtractor(ctx);
    const result = await ext.extract();
    expect(result.requests.length).toBeGreaterThan(0);
    expect(result.objectEntries.length).toBeGreaterThan(0);
    expect(result.requestTexts.length).toBeGreaterThan(0);
    expect(result.clientAttributes.length).toBeGreaterThan(0);
    expect(result.importQueue.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new TransportExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(5);
    expect(tables.find(t => t.table === 'E070')).toBeDefined();
    expect(tables.find(t => t.table === 'E071')).toBeDefined();
    expect(tables.find(t => t.table === 'E07T')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new TransportExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(TransportExtractor._extractorId).toBe('TRANSPORTS');
    expect(TransportExtractor._module).toBe('BASIS');
    expect(TransportExtractor._category).toBe('config');
  });
});
