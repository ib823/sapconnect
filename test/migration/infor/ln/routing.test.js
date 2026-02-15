const InforLNRouting = require('../../../../migration/infor/ln/routing');

describe('InforLNRoutingMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforLNRouting(gateway);
    expect(obj.objectId).toBe('INFOR_LN_ROUTING');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('LN Routing to SAP Routing');
  });

  it('should define field mappings', () => {
    const obj = new InforLNRouting(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforLNRouting(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('PLKO-MATNR');
    expect(targets).toContain('PLKO-WERKS');
    expect(targets).toContain('PLPO-VORNR');
    expect(targets).toContain('PLPO-ARBPL');
  });

  it('should define quality checks', () => {
    const obj = new InforLNRouting(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforLNRouting(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].mitm).toBeDefined();
    expect(records[0].oper).toBeDefined();
    expect(records[0].wctr).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforLNRouting(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_LN_ROUTING');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
