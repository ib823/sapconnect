const CostCenter = require('../../../migration/objects/cost-center');

describe('CostCenterMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new CostCenter(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('COST_CENTER');
    expect(obj.name).toBe('Cost Center');
  });

  it('has 30+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(30);
  });

  it('extracts 20 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(20);
    expect(records[0]).toHaveProperty('KOKRS');
    expect(records[0]).toHaveProperty('KOSTL');
    expect(records[0]).toHaveProperty('KTEXT');
  });

  it('has cost center category mapping', () => {
    const mappings = obj.getFieldMappings();
    const targets = mappings.map(m => m.target);
    expect(targets).toContain('CostCenterCategory');
    expect(targets).toContain('CostCenterHierarchyArea');
    expect(targets).toContain('ProfitCenter');
  });

  it('requires ControllingArea, CostCenter, CostCenterName, ValidityStartDate', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toEqual(['ControllingArea', 'CostCenter', 'CostCenterName', 'ValidityStartDate']);
  });

  it('deduplicates on ControllingArea + CostCenter + ValidityStartDate', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['ControllingArea', 'CostCenter', 'ValidityStartDate']);
  });

  it('transforms KOSTL with padLeft10', () => {
    const mappings = obj.getFieldMappings();
    const ccMapping = mappings.find(m => m.source === 'KOSTL');
    expect(ccMapping.convert).toBe('padLeft10');
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('COST_CENTER');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(20);
    expect(result.phases.transform.recordCount).toBe(20);
    expect(result.phases.validate.status).toBe('completed');
    expect(result.phases.load).toBeDefined();
  });

  it('mock data has diverse categories', () => {
    const records = obj._extractMock();
    const categories = new Set(records.map(r => r.KOSAR));
    expect(categories.size).toBeGreaterThanOrEqual(4);
  });
});
