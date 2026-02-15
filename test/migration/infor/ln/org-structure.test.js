const InforLNOrgStructure = require('../../../../migration/infor/ln/org-structure');

describe('InforLNOrgStructureMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforLNOrgStructure(gateway);
    expect(obj.objectId).toBe('INFOR_LN_ORG_STRUCTURE');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('LN Org Structure to SAP Enterprise Structure');
  });

  it('should define field mappings', () => {
    const obj = new InforLNOrgStructure(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforLNOrgStructure(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('T001-BUKRS');
    expect(targets).toContain('T001W-WERKS');
    expect(targets).toContain('T001L-LGORT');
  });

  it('should define quality checks', () => {
    const obj = new InforLNOrgStructure(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforLNOrgStructure(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].fcmp).toBeDefined();
    expect(records[0].cwar).toBeDefined();
    expect(records[0].lwar).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforLNOrgStructure(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_LN_ORG_STRUCTURE');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
