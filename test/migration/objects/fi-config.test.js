const FIConfig = require('../../../migration/objects/fi-config');

describe('FIConfigMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new FIConfig(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('FI_CONFIG');
    expect(obj.name).toBe('Finance Configuration');
  });

  it('has 33+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(33);
  });

  it('extracts 34 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(34);
  });

  it('has all config categories', () => {
    const records = obj._extractMock();
    const types = new Set(records.map(r => r.CONFIG_TYPE));
    expect(types.has('COMPANY_CODE')).toBe(true);
    expect(types.has('GL_ACCOUNT_RANGE')).toBe(true);
    expect(types.has('FISCAL_YEAR_VARIANT')).toBe(true);
    expect(types.has('DOCUMENT_TYPE')).toBe(true);
    expect(types.has('TAX_CODE')).toBe(true);
    expect(types.has('PAYMENT_TERMS')).toBe(true);
    expect(types.has('NUMBER_RANGE')).toBe(true);
  });

  it('requires ConfigCategory, ConfigKey, ConfigDescription', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toEqual(['ConfigCategory', 'ConfigKey', 'ConfigDescription']);
  });

  it('deduplicates on ConfigCategory + ConfigKey', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['ConfigCategory', 'ConfigKey']);
  });

  it('has 3 company codes', () => {
    const records = obj._extractMock();
    const ccs = records.filter(r => r.CONFIG_TYPE === 'COMPANY_CODE');
    expect(ccs).toHaveLength(3);
    expect(ccs.map(r => r.BUKRS)).toEqual(['1000', '2000', '3000']);
  });

  it('has 8 tax codes', () => {
    const records = obj._extractMock();
    const taxCodes = records.filter(r => r.CONFIG_TYPE === 'TAX_CODE');
    expect(taxCodes).toHaveLength(8);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('FI_CONFIG');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(34);
    expect(result.phases.validate.status).toBe('completed');
  });
});
