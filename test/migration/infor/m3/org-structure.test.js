const InforM3OrgStructure = require('../../../../migration/infor/m3/org-structure');

describe('InforM3OrgStructureMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforM3OrgStructure(gateway);
    expect(obj.objectId).toBe('INFOR_M3_ORG_STRUCTURE');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('Infor M3 Org Structure');
  });

  it('should define field mappings', () => {
    const obj = new InforM3OrgStructure(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforM3OrgStructure(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('T001-BUKRS');
    expect(targets).toContain('T001W-WERKS');
    expect(targets).toContain('T001L-LGORT');
  });

  it('should define quality checks', () => {
    const obj = new InforM3OrgStructure(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforM3OrgStructure(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].DIVI).toBeDefined();
    expect(records[0].FACI).toBeDefined();
    expect(records[0].WHLO).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforM3OrgStructure(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_M3_ORG_STRUCTURE');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
