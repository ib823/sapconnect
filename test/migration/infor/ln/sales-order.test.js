const InforLNSalesOrder = require('../../../../migration/infor/ln/sales-order');

describe('InforLNSalesOrderMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforLNSalesOrder(gateway);
    expect(obj.objectId).toBe('INFOR_LN_SALES_ORDER');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('LN Sales Order to SAP Sales Order');
  });

  it('should define field mappings', () => {
    const obj = new InforLNSalesOrder(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforLNSalesOrder(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('VBAK-VBELN');
    expect(targets).toContain('VBAK-KUNNR');
    expect(targets).toContain('VBAP-MATNR');
    expect(targets).toContain('VBAP-KWMENG');
  });

  it('should define quality checks', () => {
    const obj = new InforLNSalesOrder(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforLNSalesOrder(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].orno).toBeDefined();
    expect(records[0].ofbp).toBeDefined();
    expect(records[0].item).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforLNSalesOrder(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_LN_SALES_ORDER');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
