const InforM3Vendor = require('../../../../migration/infor/m3/vendor');

describe('InforM3VendorMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforM3Vendor(gateway);
    expect(obj.objectId).toBe('INFOR_M3_VENDOR');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('Infor M3 Vendor');
  });

  it('should define field mappings', () => {
    const obj = new InforM3Vendor(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforM3Vendor(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('BUT000-PARTNER');
    expect(targets).toContain('BUT000-NAME_ORG1');
    expect(targets).toContain('ADDR-COUNTRY');
  });

  it('should define quality checks', () => {
    const obj = new InforM3Vendor(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforM3Vendor(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].IISUNO).toBeDefined();
    expect(records[0].IISUNM).toBeDefined();
    expect(records[0].IICSCD).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforM3Vendor(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_M3_VENDOR');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
