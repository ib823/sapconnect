const ProfitCenter = require('../../../migration/objects/profit-center');

describe('ProfitCenterMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new ProfitCenter(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('PROFIT_CENTER');
    expect(obj.name).toBe('Profit Center');
  });

  it('has 28+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(28);
  });

  it('extracts 10 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(10);
    expect(records[0]).toHaveProperty('KOKRS');
    expect(records[0]).toHaveProperty('PRCTR');
    expect(records[0]).toHaveProperty('KTEXT');
  });

  it('has address and hierarchy mappings', () => {
    const mappings = obj.getFieldMappings();
    const targets = mappings.map(m => m.target);
    expect(targets).toContain('Country');
    expect(targets).toContain('City');
    expect(targets).toContain('ProfitCenterHierarchyArea');
    expect(targets).toContain('Segment');
  });

  it('requires ControllingArea, ProfitCenter, ProfitCenterName, ValidityStartDate', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toEqual(['ControllingArea', 'ProfitCenter', 'ProfitCenterName', 'ValidityStartDate']);
  });

  it('transforms PRCTR with padLeft10', () => {
    const mappings = obj.getFieldMappings();
    const pcMapping = mappings.find(m => m.source === 'PRCTR');
    expect(pcMapping.convert).toBe('padLeft10');
  });

  it('transforms LAND1 with toUpperCase', () => {
    const mappings = obj.getFieldMappings();
    const countryMapping = mappings.find(m => m.source === 'LAND1');
    expect(countryMapping.convert).toBe('toUpperCase');
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('PROFIT_CENTER');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(10);
    expect(result.phases.transform.recordCount).toBe(10);
    expect(result.phases.validate.status).toBe('completed');
  });

  it('mock data spans multiple countries', () => {
    const records = obj._extractMock();
    const countries = new Set(records.map(r => r.LAND1));
    expect(countries.size).toBeGreaterThanOrEqual(3);
  });
});
