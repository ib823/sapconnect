const ObjectClass = require('../../../migration/objects/vendor-open-item');

describe('Vendor Open Items', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => {
    obj = new ObjectClass(gw);
  });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('VENDOR_OPEN_ITEM');
    expect(obj.name).toBe('Vendor Open Items');
  });

  it('has 40 field mappings', () => {
    expect(obj.getFieldMappings()).toHaveLength(40);
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
    expect(checks.required).toEqual(['CompanyCode', 'Supplier', 'DocumentNumber', 'FiscalYear', 'AmountInCompanyCodeCurrency']);
  });

  it('checks for duplicates on correct keys', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['CompanyCode', 'DocumentNumber', 'FiscalYear', 'LineItem']);
  });

  it('all mappings have a target', () => {
    for (const m of obj.getFieldMappings()) {
      expect(m.target).toBeDefined();
    }
  });
});
