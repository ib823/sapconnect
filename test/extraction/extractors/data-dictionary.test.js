import { describe, it, expect } from 'vitest';
const DataDictionaryExtractor = require('../../../extraction/extractors/data-dictionary');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('DataDictionaryExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new DataDictionaryExtractor(ctx);
    expect(ext.extractorId).toBe('DATA_DICTIONARY');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('metadata');
  });

  it('should extract mock data and set context.dataDictionary', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new DataDictionaryExtractor(ctx);
    const result = await ext.extract();
    expect(result.tables).toBeDefined();
    expect(Object.keys(result.tables).length).toBeGreaterThan(0);
    expect(result.dataElements).toBeDefined();
    expect(result.domains).toBeDefined();
    expect(result.relationships).toBeDefined();
    expect(ctx.dataDictionary).toBe(result);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new DataDictionaryExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.find(t => t.table === 'DD02L')).toBeDefined();
    expect(tables.find(t => t.table === 'DD03L')).toBeDefined();
  });

  it('should track coverage', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new DataDictionaryExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
    expect(report.coverage).toBe(100);
  });
});
