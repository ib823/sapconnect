const ObjectClass = require('../../../migration/objects/scheduling-agreement');

describe('Scheduling Agreement', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => {
    obj = new ObjectClass(gw);
  });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('SCHEDULING_AGREEMENT');
    expect(obj.name).toBe('Scheduling Agreement');
  });

  it('has 40 field mappings', () => {
    expect(obj.getFieldMappings()).toHaveLength(40);
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
    expect(checks.required).toEqual(['AgreementNumber', 'AgreementItem', 'Supplier', 'Material']);
  });

  it('checks for duplicates on correct keys', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['AgreementNumber', 'AgreementItem']);
  });

  it('all mappings have a target', () => {
    for (const m of obj.getFieldMappings()) {
      expect(m.target).toBeDefined();
    }
  });
});
