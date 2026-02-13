const PLMExtractor = require('../../../extraction/extractors/plm-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('PLMExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PLMExtractor(ctx);
    expect(ext.extractorId).toBe('PLM_EXTRACTOR');
    expect(ext.name).toBe('Product Lifecycle Management');
    expect(ext.module).toBe('PLM');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PLMExtractor(ctx);
    const result = await ext.extract();
    expect(result.documentInfoRecords.length).toBeGreaterThan(0);
    expect(result.documentContent.length).toBeGreaterThan(0);
    expect(result.classification.length).toBeGreaterThan(0);
    expect(result.characteristics.length).toBeGreaterThan(0);
    expect(result.characteristicValues.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PLMExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(6);
    expect(tables.find(t => t.table === 'DRAW')).toBeDefined();
    expect(tables.find(t => t.table === 'STXH')).toBeDefined();
    expect(tables.find(t => t.table === 'AUSP')).toBeDefined();
    expect(tables.find(t => t.table === 'CABN')).toBeDefined();
    expect(tables.find(t => t.table === 'CAWN')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new PLMExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(PLMExtractor._extractorId).toBe('PLM_EXTRACTOR');
    expect(PLMExtractor._module).toBe('PLM');
    expect(PLMExtractor._category).toBe('config');
  });
});
