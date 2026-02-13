const OutputFormsExtractor = require('../../../extraction/extractors/output-forms-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('OutputFormsExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new OutputFormsExtractor(ctx);
    expect(ext.extractorId).toBe('OUTPUT_FORMS');
    expect(ext.name).toBe('Output & Forms');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new OutputFormsExtractor(ctx);
    const result = await ext.extract();
    expect(result.sapscriptForms.length).toBeGreaterThan(0);
    expect(result.smartForms.length).toBeGreaterThan(0);
    expect(result.adobeForms.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new OutputFormsExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(3);
    expect(tables.find(t => t.table === 'STXH')).toBeDefined();
    expect(tables.find(t => t.table === 'STXFADM')).toBeDefined();
    expect(tables.find(t => t.table === 'FPCONNECT')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new OutputFormsExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(OutputFormsExtractor._extractorId).toBe('OUTPUT_FORMS');
    expect(OutputFormsExtractor._module).toBe('BASIS');
    expect(OutputFormsExtractor._category).toBe('config');
  });
});
