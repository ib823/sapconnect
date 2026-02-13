const Transformer = require('../../migration/transformer');
const Extractor = require('../../migration/extractor');

describe('Transformer', () => {
  function mockGateway() {
    return { mode: 'mock' };
  }

  async function getExtraction() {
    const extractor = new Extractor(mockGateway());
    return extractor.extract();
  }

  it('should transform extracted data', async () => {
    const transformer = new Transformer();
    const extraction = await getExtraction();
    const result = transformer.transform(extraction);

    expect(result).toHaveProperty('transformations');
    expect(result).toHaveProperty('stats');
    expect(result.transformations.length).toBeGreaterThan(0);
  });

  it('should produce field mappings for each table', async () => {
    const transformer = new Transformer();
    const extraction = await getExtraction();
    const result = transformer.transform(extraction);

    for (const t of result.transformations) {
      expect(t.module).toBeDefined();
      expect(t.status).toBe('completed');
      for (const mapping of t.tableMappings) {
        expect(mapping).toHaveProperty('sourceTable');
        expect(mapping).toHaveProperty('targetTable');
        expect(mapping).toHaveProperty('fieldMappings');
        expect(mapping.fieldMappings).toBeGreaterThan(0);
      }
    }
  });

  it('should map FI tables to ACDOCA/BUT000', async () => {
    const transformer = new Transformer();
    const extraction = await getExtraction();
    const result = transformer.transform(extraction);

    const fi = result.transformations.find((t) => t.module === 'FI');
    expect(fi).toBeDefined();
    const targets = fi.tableMappings.map((m) => m.targetTable);
    expect(targets).toContain('ACDOCA');
    expect(targets).toContain('BUT000');
  });

  it('should calculate transformation rate stats', async () => {
    const transformer = new Transformer();
    const extraction = await getExtraction();
    const result = transformer.transform(extraction);

    expect(result.stats.totalInputRecords).toBeGreaterThan(0);
    expect(result.stats.totalOutputRecords).toBeGreaterThan(0);
    expect(result.stats.transformationRate).toBeGreaterThan(0);
  });
});
