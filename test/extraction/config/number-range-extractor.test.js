const NumberRangeExtractor = require('../../../extraction/config/number-range-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('NumberRangeExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new NumberRangeExtractor(ctx);
    expect(ext.extractorId).toBe('NUMBER_RANGES');
    expect(ext.name).toBe('Number Range Configuration');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data with objects, intervals, and consumption', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new NumberRangeExtractor(ctx);
    const result = await ext.extract();
    expect(result.objects.length).toBeGreaterThan(0);
    expect(result.intervals.length).toBeGreaterThan(0);
    expect(result.consumption.length).toBeGreaterThan(0);
  });

  it('should include key number range objects in mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new NumberRangeExtractor(ctx);
    const result = await ext.extract();
    const objectNames = result.objects.map(o => o.OBJECT);
    expect(objectNames).toContain('BKPF_BUKR');
    expect(objectNames).toContain('EINKBELEG');
    expect(objectNames).toContain('VERKBELEG');
  });

  it('should calculate consumption percentages', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new NumberRangeExtractor(ctx);
    const result = await ext.extract();
    for (const c of result.consumption) {
      expect(c).toHaveProperty('object');
      expect(c).toHaveProperty('consumptionPct');
      expect(c.consumptionPct).toBeGreaterThanOrEqual(0);
      expect(c.consumptionPct).toBeLessThanOrEqual(100);
    }
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new NumberRangeExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(2);
    expect(tables.find(t => t.table === 'NRIV')).toBeDefined();
    expect(tables.find(t => t.table === 'INRI')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new NumberRangeExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(NumberRangeExtractor._extractorId).toBe('NUMBER_RANGES');
    expect(NumberRangeExtractor._module).toBe('BASIS');
    expect(NumberRangeExtractor._category).toBe('config');
  });
});
