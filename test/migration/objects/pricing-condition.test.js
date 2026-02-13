const PricingCondition = require('../../../migration/objects/pricing-condition');

describe('Pricing Conditions', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => {
    obj = new PricingCondition(gw);
  });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('PRICING_CONDITION');
    expect(obj.name).toBe('Pricing Conditions');
  });

  it('has 37 field mappings', () => {
    expect(obj.getFieldMappings()).toHaveLength(37);
  });

  it('extracts 45 mock records', async () => {
    const result = await obj.run();
    expect(result.phases.extract.recordCount).toBe(45);
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
    expect(checks.required).toEqual(['ConditionRecordNumber', 'ConditionType', 'ValidFrom']);
  });

  it('checks for duplicates on correct keys', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['ConditionRecordNumber', 'ConditionSequentialNumber']);
  });

  it('all mappings have a target', () => {
    for (const m of obj.getFieldMappings()) {
      expect(m.target).toBeDefined();
    }
  });
});
