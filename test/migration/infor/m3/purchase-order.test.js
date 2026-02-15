const InforM3PurchaseOrder = require('../../../../migration/infor/m3/purchase-order');

describe('InforM3PurchaseOrderMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforM3PurchaseOrder(gateway);
    expect(obj.objectId).toBe('INFOR_M3_PURCHASE_ORDER');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('Infor M3 Purchase Order');
  });

  it('should define field mappings', () => {
    const obj = new InforM3PurchaseOrder(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforM3PurchaseOrder(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('EKKO-EBELN');
    expect(targets).toContain('EKKO-LIFNR');
    expect(targets).toContain('EKPO-MATNR');
    expect(targets).toContain('EKPO-MENGE');
  });

  it('should define quality checks', () => {
    const obj = new InforM3PurchaseOrder(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforM3PurchaseOrder(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].IAPUNO).toBeDefined();
    expect(records[0].IASUNO).toBeDefined();
    expect(records[0].IBITNO).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforM3PurchaseOrder(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_M3_PURCHASE_ORDER');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
