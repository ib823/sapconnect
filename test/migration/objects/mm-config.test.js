const MMConfig = require('../../../migration/objects/mm-config');

describe('MMConfigMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new MMConfig(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('MM_CONFIG');
    expect(obj.name).toBe('MM Configuration');
  });

  it('has 23+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(23);
  });

  it('extracts 34 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(34);
  });

  it('has all config categories', () => {
    const records = obj._extractMock();
    const types = new Set(records.map(r => r.CONFIG_TYPE));
    expect(types.has('PLANT')).toBe(true);
    expect(types.has('STORAGE_LOCATION')).toBe(true);
    expect(types.has('PURCHASING_ORG')).toBe(true);
    expect(types.has('PURCHASING_GROUP')).toBe(true);
    expect(types.has('MATERIAL_TYPE')).toBe(true);
    expect(types.has('MATERIAL_GROUP')).toBe(true);
    expect(types.has('VENDOR_ACCOUNT_GROUP')).toBe(true);
  });

  it('has 5 plants across 3 company codes', () => {
    const records = obj._extractMock();
    const plants = records.filter(r => r.CONFIG_TYPE === 'PLANT');
    expect(plants).toHaveLength(5);
    const ccs = new Set(plants.map(r => r.BUKRS));
    expect(ccs.size).toBe(3);
  });

  it('has 7 material types', () => {
    const records = obj._extractMock();
    const matTypes = records.filter(r => r.CONFIG_TYPE === 'MATERIAL_TYPE');
    expect(matTypes).toHaveLength(7);
    expect(matTypes.map(r => r.MTART)).toContain('ROH');
    expect(matTypes.map(r => r.MTART)).toContain('FERT');
  });

  it('has storage locations linked to plants', () => {
    const records = obj._extractMock();
    const storLocs = records.filter(r => r.CONFIG_TYPE === 'STORAGE_LOCATION');
    expect(storLocs.length).toBeGreaterThanOrEqual(5);
    expect(storLocs.every(r => r.WERKS !== '')).toBe(true);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('MM_CONFIG');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(34);
    expect(result.phases.validate.status).toBe('completed');
  });
});
