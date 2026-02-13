const ObjectClass = require('../../../migration/objects/gl-account-master');

describe('GL Account Master', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => {
    obj = new ObjectClass(gw);
  });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('GL_ACCOUNT_MASTER');
    expect(obj.name).toBe('GL Account Master');
  });

  it('has 43 field mappings', () => {
    expect(obj.getFieldMappings()).toHaveLength(43);
  });

  it('extracts 56 mock records', async () => {
    const result = await obj.run();
    expect(result.phases.extract.recordCount).toBe(56);
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
    expect(checks.required).toEqual(['ChartOfAccounts', 'GLAccount', 'GLAccountGroup', 'CompanyCode']);
  });

  it('checks for duplicates on correct keys', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['ChartOfAccounts', 'GLAccount', 'CompanyCode']);
  });

  it('all mappings have a target', () => {
    for (const m of obj.getFieldMappings()) {
      expect(m.target).toBeDefined();
    }
  });
});
