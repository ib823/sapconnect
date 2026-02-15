const InforM3SalesOrder = require('../../../../migration/infor/m3/sales-order');

describe('InforM3SalesOrderMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforM3SalesOrder(gateway);
    expect(obj.objectId).toBe('INFOR_M3_SALES_ORDER');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('Infor M3 Sales Order');
  });

  it('should define field mappings', () => {
    const obj = new InforM3SalesOrder(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforM3SalesOrder(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('VBAK-VBELN');
    expect(targets).toContain('VBAK-KUNNR');
    expect(targets).toContain('VBAP-MATNR');
    expect(targets).toContain('VBAP-KWMENG');
  });

  it('should define quality checks', () => {
    const obj = new InforM3SalesOrder(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforM3SalesOrder(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].OAORNO).toBeDefined();
    expect(records[0].OACUNO).toBeDefined();
    expect(records[0].OBITNO).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforM3SalesOrder(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_M3_SALES_ORDER');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
