const ChangeDocumentExtractor = require('../../../extraction/process/change-document-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('ChangeDocumentExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new ChangeDocumentExtractor(ctx);
    expect(ext.extractorId).toBe('CHANGE_DOCUMENTS');
    expect(ext.name).toBe('Change Documents');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('process');
  });

  it('should extract mock data with headers, items, and object classes', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new ChangeDocumentExtractor(ctx);
    const result = await ext.extract();
    expect(result.headers.length).toBeGreaterThan(0);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.objectClasses.length).toBeGreaterThan(0);
  });

  it('should include diverse object classes in mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new ChangeDocumentExtractor(ctx);
    const result = await ext.extract();
    const objectTypes = result.objectClasses.map(o => o.OBJECT);
    expect(objectTypes).toContain('VERKBELEG');
    expect(objectTypes).toContain('EINKBELEG');
    expect(objectTypes).toContain('MATERIAL');
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new ChangeDocumentExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(3);
    expect(tables.find(t => t.table === 'CDHDR')).toBeDefined();
    expect(tables.find(t => t.table === 'CDPOS')).toBeDefined();
    expect(tables.find(t => t.table === 'TCDOB')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new ChangeDocumentExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(ChangeDocumentExtractor._extractorId).toBe('CHANGE_DOCUMENTS');
    expect(ChangeDocumentExtractor._module).toBe('BASIS');
    expect(ChangeDocumentExtractor._category).toBe('process');
  });
});
