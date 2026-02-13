const Extractor = require('../../migration/extractor');

describe('Extractor', () => {
  function mockGateway() {
    return { mode: 'mock' };
  }

  it('should extract data for default modules', async () => {
    const extractor = new Extractor(mockGateway());
    const result = await extractor.extract();

    expect(result).toHaveProperty('extractions');
    expect(result).toHaveProperty('stats');
    expect(result.extractions.length).toBe(4); // FI, MM, SD, HR
  });

  it('should respect cutoff date', async () => {
    const cutoff = '2022-06-01';
    const extractor = new Extractor(mockGateway(), { cutoffDate: cutoff });
    const result = await extractor.extract();

    for (const extraction of result.extractions) {
      expect(extraction.cutoffDate).toBe(cutoff);
    }
  });

  it('should filter by requested modules', async () => {
    const extractor = new Extractor(mockGateway(), { modules: ['FI', 'MM'] });
    const result = await extractor.extract();

    expect(result.extractions.length).toBe(2);
    const modules = result.extractions.map((e) => e.module);
    expect(modules).toContain('FI');
    expect(modules).toContain('MM');
  });

  it('should have tables with record counts per extraction', async () => {
    const extractor = new Extractor(mockGateway());
    const result = await extractor.extract();

    for (const extraction of result.extractions) {
      expect(extraction.tables.length).toBeGreaterThan(0);
      expect(extraction.totalRecords).toBeGreaterThan(0);
      for (const table of extraction.tables) {
        expect(table).toHaveProperty('table');
        expect(table).toHaveProperty('records');
      }
    }
  });

  it('should report total records in stats', async () => {
    const extractor = new Extractor(mockGateway());
    const result = await extractor.extract();

    expect(result.stats.totalRecords).toBeGreaterThan(0);
    expect(result.stats.modulesExtracted).toBe(4);
    expect(result.stats.status).toBe('completed');
  });
});
