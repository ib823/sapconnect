const ObjectClass = require('../../../migration/objects/production-order');

describe('Production Order', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => {
    obj = new ObjectClass(gw);
  });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('PRODUCTION_ORDER');
    expect(obj.name).toBe('Production Order');
  });

  it('has 42 field mappings', () => {
    expect(obj.getFieldMappings()).toHaveLength(42);
  });

  it('extracts 20 mock records', async () => {
    const result = await obj.run();
    expect(result.phases.extract.recordCount).toBe(20);
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
    expect(checks.required).toEqual(['OrderNumber', 'OrderType', 'CompanyCode', 'Material']);
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
