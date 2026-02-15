const InforM3ProductionOrder = require('../../../../migration/infor/m3/production-order');

describe('InforM3ProductionOrderMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforM3ProductionOrder(gateway);
    expect(obj.objectId).toBe('INFOR_M3_PRODUCTION_ORDER');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('Infor M3 Production Order');
  });

  it('should define field mappings', () => {
    const obj = new InforM3ProductionOrder(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforM3ProductionOrder(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('AUFK-AUFNR');
    expect(targets).toContain('AFKO-MATNR');
    expect(targets).toContain('AFKO-WERKS');
    expect(targets).toContain('AFKO-GAMNG');
  });

  it('should define quality checks', () => {
    const obj = new InforM3ProductionOrder(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforM3ProductionOrder(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].VHMFNO).toBeDefined();
    expect(records[0].VHPRNO).toBeDefined();
    expect(records[0].VHORQT).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforM3ProductionOrder(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_M3_PRODUCTION_ORDER');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
