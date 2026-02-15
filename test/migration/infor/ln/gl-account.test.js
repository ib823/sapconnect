const InforLNGLAccount = require('../../../../migration/infor/ln/gl-account');

describe('InforLNGLAccountMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforLNGLAccount(gateway);
    expect(obj.objectId).toBe('INFOR_LN_GL_ACCOUNT');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('LN GL Account to SAP GL Master');
  });

  it('should define field mappings', () => {
    const obj = new InforLNGLAccount(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforLNGLAccount(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('SKA1-SAKNR');
    expect(targets).toContain('SKAT-TXT50');
    expect(targets).toContain('SKB1-BUKRS');
  });

  it('should define quality checks', () => {
    const obj = new InforLNGLAccount(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforLNGLAccount(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].fled).toBeDefined();
    expect(records[0].desc).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforLNGLAccount(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_LN_GL_ACCOUNT');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
