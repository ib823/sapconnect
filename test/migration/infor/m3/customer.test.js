const InforM3Customer = require('../../../../migration/infor/m3/customer');

describe('InforM3CustomerMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforM3Customer(gateway);
    expect(obj.objectId).toBe('INFOR_M3_CUSTOMER');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('Infor M3 Customer');
  });

  it('should define field mappings', () => {
    const obj = new InforM3Customer(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforM3Customer(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('BUT000-PARTNER');
    expect(targets).toContain('BUT000-NAME_ORG1');
    expect(targets).toContain('ADDR-COUNTRY');
  });

  it('should define quality checks', () => {
    const obj = new InforM3Customer(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforM3Customer(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].OKCUNO).toBeDefined();
    expect(records[0].OKCUNM).toBeDefined();
    expect(records[0].OKCSCD).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforM3Customer(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_M3_CUSTOMER');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
