const AssetAcquisition = require('../../../migration/objects/asset-acquisition');

describe('Asset Acquisition', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => {
    obj = new AssetAcquisition(gw);
  });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('ASSET_ACQUISITION');
    expect(obj.name).toBe('Asset Acquisition');
  });

  it('has 36 field mappings', () => {
    expect(obj.getFieldMappings()).toHaveLength(36);
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
    expect(checks.required).toEqual(['CompanyCode', 'AssetMainNumber', 'AssetClass', 'AcquisitionValue']);
  });

  it('checks for duplicates on correct keys', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['CompanyCode', 'AssetMainNumber', 'AssetSubNumber']);
  });

  it('all mappings have a target', () => {
    for (const m of obj.getFieldMappings()) {
      expect(m.target).toBeDefined();
    }
  });
});
