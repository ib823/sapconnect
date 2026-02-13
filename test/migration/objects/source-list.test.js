const ObjectClass = require('../../../migration/objects/source-list');

describe('Source List', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => {
    obj = new ObjectClass(gw);
  });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('SOURCE_LIST');
    expect(obj.name).toBe('Source List');
  });

  it('has 25 field mappings', () => {
    expect(obj.getFieldMappings()).toHaveLength(25);
  });

  it('extracts 30 mock records', async () => {
    const result = await obj.run();
    expect(result.phases.extract.recordCount).toBe(30);
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
    expect(checks.required).toEqual(['Material', 'Plant', 'Supplier', 'ValidFrom']);
  });

  it('checks for duplicates on correct keys', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['Material', 'Plant', 'Supplier', 'ValidFrom']);
  });

  it('all mappings have a target', () => {
    for (const m of obj.getFieldMappings()) {
      expect(m.target).toBeDefined();
    }
  });
});
