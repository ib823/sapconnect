const InforLNCostCenter = require('../../../../migration/infor/ln/cost-center');

describe('InforLNCostCenterMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforLNCostCenter(gateway);
    expect(obj.objectId).toBe('INFOR_LN_COST_CENTER');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('LN Cost Center to SAP Cost Center');
  });

  it('should define field mappings', () => {
    const obj = new InforLNCostCenter(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforLNCostCenter(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('CSKS-KOSTL');
    expect(targets).toContain('CSKS-KOKRS');
    expect(targets).toContain('CSKT-KTEXT');
    expect(targets).toContain('CSKS-BUKRS');
  });

  it('should define quality checks', () => {
    const obj = new InforLNCostCenter(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforLNCostCenter(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].cctr).toBeDefined();
    expect(records[0].desc).toBeDefined();
    expect(records[0].kokrs).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforLNCostCenter(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_LN_COST_CENTER');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
