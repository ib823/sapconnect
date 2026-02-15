const InforLNBusinessPartner = require('../../../../migration/infor/ln/business-partner');

describe('InforLNBusinessPartnerMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforLNBusinessPartner(gateway);
    expect(obj.objectId).toBe('INFOR_LN_BUSINESS_PARTNER');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('LN Business Partner to SAP BP');
  });

  it('should define field mappings', () => {
    const obj = new InforLNBusinessPartner(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforLNBusinessPartner(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('BUT000-PARTNER');
    expect(targets).toContain('BUT000-NAME_ORG1');
    expect(targets).toContain('ADRC-COUNTRY');
  });

  it('should define quality checks', () => {
    const obj = new InforLNBusinessPartner(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforLNBusinessPartner(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].bptid).toBeDefined();
    expect(records[0].nama).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforLNBusinessPartner(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_LN_BUSINESS_PARTNER');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
