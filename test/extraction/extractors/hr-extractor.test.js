const HRExtractor = require('../../../extraction/extractors/hr-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('HRExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new HRExtractor(ctx);
    expect(ext.extractorId).toBe('HR_EXTRACTOR');
    expect(ext.name).toBe('Human Resources');
    expect(ext.module).toBe('HR');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new HRExtractor(ctx);
    const result = await ext.extract();
    expect(result.orgAssignment.length).toBeGreaterThan(0);
    expect(result.personalData.length).toBeGreaterThan(0);
    expect(result.addresses.length).toBeGreaterThan(0);
    expect(result.basicPay.length).toBeGreaterThan(0);
    expect(result.recurringPayments.length).toBeGreaterThan(0);
    expect(result.additionalPayments.length).toBeGreaterThan(0);
    expect(result.orgObjects.length).toBeGreaterThan(0);
    expect(result.orgRelationships.length).toBeGreaterThan(0);
    expect(result.personnelAreas.length).toBeGreaterThan(0);
    expect(result.personnelSubareas.length).toBeGreaterThan(0);
    expect(result.employeeGroups.length).toBeGreaterThan(0);
    expect(result.payScaleAreas.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new HRExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(12);
    expect(tables.find(t => t.table === 'PA0001')).toBeDefined();
    expect(tables.find(t => t.table === 'PA0002')).toBeDefined();
    expect(tables.find(t => t.table === 'PA0008')).toBeDefined();
    expect(tables.find(t => t.table === 'HRP1000')).toBeDefined();
    expect(tables.find(t => t.table === 'HRP1001')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new HRExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(HRExtractor._extractorId).toBe('HR_EXTRACTOR');
    expect(HRExtractor._module).toBe('HR');
    expect(HRExtractor._category).toBe('config');
  });
});
