const InforLNPurchaseOrder = require('../../../../migration/infor/ln/purchase-order');

describe('InforLNPurchaseOrderMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforLNPurchaseOrder(gateway);
    expect(obj.objectId).toBe('INFOR_LN_PURCHASE_ORDER');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('LN Purchase Order to SAP Purchase Order');
  });

  it('should define field mappings', () => {
    const obj = new InforLNPurchaseOrder(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforLNPurchaseOrder(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('EKKO-EBELN');
    expect(targets).toContain('EKKO-LIFNR');
    expect(targets).toContain('EKPO-MATNR');
    expect(targets).toContain('EKPO-MENGE');
  });

  it('should define quality checks', () => {
    const obj = new InforLNPurchaseOrder(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforLNPurchaseOrder(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].orno).toBeDefined();
    expect(records[0].otbp).toBeDefined();
    expect(records[0].item).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforLNPurchaseOrder(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_LN_PURCHASE_ORDER');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
