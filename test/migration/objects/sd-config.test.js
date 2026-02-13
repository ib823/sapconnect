const SDConfig = require('../../../migration/objects/sd-config');

describe('SDConfigMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new SDConfig(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('SD_CONFIG');
    expect(obj.name).toBe('SD Configuration');
  });

  it('has 23+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(23);
  });

  it('extracts 36 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(36);
  });

  it('has all config categories', () => {
    const records = obj._extractMock();
    const types = new Set(records.map(r => r.CONFIG_TYPE));
    expect(types.has('SALES_ORG')).toBe(true);
    expect(types.has('DIST_CHANNEL')).toBe(true);
    expect(types.has('DIVISION')).toBe(true);
    expect(types.has('SALES_DOC_TYPE')).toBe(true);
    expect(types.has('DELIVERY_TYPE')).toBe(true);
    expect(types.has('BILLING_TYPE')).toBe(true);
    expect(types.has('PRICING_PROCEDURE')).toBe(true);
    expect(types.has('CONDITION_TYPE')).toBe(true);
  });

  it('has 8 sales document types', () => {
    const records = obj._extractMock();
    const docTypes = records.filter(r => r.CONFIG_TYPE === 'SALES_DOC_TYPE');
    expect(docTypes).toHaveLength(8);
    expect(docTypes.map(r => r.AUART)).toContain('OR');
    expect(docTypes.map(r => r.AUART)).toContain('RE');
  });

  it('has 6 condition types including PR00 and MWST', () => {
    const records = obj._extractMock();
    const condTypes = records.filter(r => r.CONFIG_TYPE === 'CONDITION_TYPE');
    expect(condTypes).toHaveLength(6);
    expect(condTypes.map(r => r.KSCHL)).toContain('PR00');
    expect(condTypes.map(r => r.KSCHL)).toContain('MWST');
  });

  it('has 3 sales organizations linked to company codes', () => {
    const records = obj._extractMock();
    const salesOrgs = records.filter(r => r.CONFIG_TYPE === 'SALES_ORG');
    expect(salesOrgs).toHaveLength(3);
    expect(salesOrgs.every(r => r.BUKRS !== '')).toBe(true);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('SD_CONFIG');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(36);
    expect(result.phases.validate.status).toBe('completed');
  });
});
