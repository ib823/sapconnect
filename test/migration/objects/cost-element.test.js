const CostElement = require('../../../migration/objects/cost-element');

describe('Cost Element Master', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => {
    obj = new CostElement(gw);
  });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('COST_ELEMENT');
    expect(obj.name).toBe('Cost Element Master');
  });

  it('has 30 field mappings', () => {
    expect(obj.getFieldMappings()).toHaveLength(30);
  });

  it('extracts 35 mock records', async () => {
    const result = await obj.run();
    expect(result.phases.extract.recordCount).toBe(35);
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
    expect(checks.required).toEqual(['CostElement', 'ControllingArea']);
  });

  it('checks for duplicates on correct keys', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['CostElement', 'ControllingArea']);
  });

  it('all mappings have a target', () => {
    for (const m of obj.getFieldMappings()) {
      expect(m.target).toBeDefined();
    }
  });
});
