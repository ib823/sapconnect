const ObjectClass = require('../../../migration/objects/work-center');

describe('Work Center', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => {
    obj = new ObjectClass(gw);
  });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('WORK_CENTER');
    expect(obj.name).toBe('Work Center');
  });

  it('has 33 field mappings', () => {
    expect(obj.getFieldMappings()).toHaveLength(33);
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
    expect(checks.required).toEqual(['WorkCenterNumber', 'Plant', 'WorkCenterCategoryCode']);
  });

  it('checks for duplicates on correct keys', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['WorkCenterNumber', 'Plant']);
  });

  it('all mappings have a target', () => {
    for (const m of obj.getFieldMappings()) {
      expect(m.target).toBeDefined();
    }
  });
});
