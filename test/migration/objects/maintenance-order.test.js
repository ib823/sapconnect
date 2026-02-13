const ObjectClass = require('../../../migration/objects/maintenance-order');

describe('Maintenance Order', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => {
    obj = new ObjectClass(gw);
  });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('MAINTENANCE_ORDER');
    expect(obj.name).toBe('Maintenance Order');
  });

  it('has 41 field mappings', () => {
    expect(obj.getFieldMappings()).toHaveLength(41);
  });

  it('extracts 25 mock records', async () => {
    const result = await obj.run();
    expect(result.phases.extract.recordCount).toBe(25);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.status).toBe('completed');
    expect(result.phases.transform.status).toBe('completed');
    expect(result.phases.validate).toBeDefined();
    expect(result.phases.load).toBeDefined();
  });

  it('validates required fields', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toEqual(['OrderNumber', 'OrderType', 'CompanyCode', 'Plant']);
  });

  it('checks for duplicates on correct keys', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['OrderNumber']);
  });

  it('all mappings have a target', () => {
    for (const m of obj.getFieldMappings()) {
      expect(m.target).toBeDefined();
    }
  });
});
