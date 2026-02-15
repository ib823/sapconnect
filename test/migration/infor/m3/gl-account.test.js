const InforM3GLAccount = require('../../../../migration/infor/m3/gl-account');

describe('InforM3GLAccountMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforM3GLAccount(gateway);
    expect(obj.objectId).toBe('INFOR_M3_GL_ACCOUNT');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('Infor M3 GL Account');
  });

  it('should define field mappings', () => {
    const obj = new InforM3GLAccount(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforM3GLAccount(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('SKA1-SAKNR');
    expect(targets).toContain('SKAT-TXT50');
    expect(targets).toContain('SKB1-BUKRS');
  });

  it('should define quality checks', () => {
    const obj = new InforM3GLAccount(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforM3GLAccount(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].AIAITM).toBeDefined();
    expect(records[0].AIAT01).toBeDefined();
    expect(records[0].AIDIVI).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforM3GLAccount(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_M3_GL_ACCOUNT');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
