const InforLNFixedAsset = require('../../../../migration/infor/ln/fixed-asset');

describe('InforLNFixedAssetMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforLNFixedAsset(gateway);
    expect(obj.objectId).toBe('INFOR_LN_FIXED_ASSET');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('LN Fixed Asset to SAP Asset Accounting');
  });

  it('should define field mappings', () => {
    const obj = new InforLNFixedAsset(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforLNFixedAsset(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('ANLA-ANLN1');
    expect(targets).toContain('ANLA-TXA50');
    expect(targets).toContain('ANLA-BUKRS');
    expect(targets).toContain('ANLB-ANSWL');
  });

  it('should define quality checks', () => {
    const obj = new InforLNFixedAsset(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforLNFixedAsset(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].asst).toBeDefined();
    expect(records[0].desc).toBeDefined();
    expect(records[0].acqv).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforLNFixedAsset(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_LN_FIXED_ASSET');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
