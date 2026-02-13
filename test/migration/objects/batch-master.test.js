const BatchMaster = require('../../../migration/objects/batch-master');

describe('Batch Master', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => {
    obj = new BatchMaster(gw);
  });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('BATCH_MASTER');
    expect(obj.name).toBe('Batch Master');
  });

  it('has 29 field mappings', () => {
    expect(obj.getFieldMappings()).toHaveLength(29);
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
    expect(checks.required).toEqual(['Material', 'BatchNumber', 'Plant']);
  });

  it('checks for duplicates on correct keys', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['Material', 'BatchNumber', 'Plant']);
  });

  it('all mappings have a target', () => {
    for (const m of obj.getFieldMappings()) {
      expect(m.target).toBeDefined();
    }
  });
});
