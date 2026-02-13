const PurchaseOrder = require('../../../migration/objects/purchase-order');

describe('PurchaseOrderMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new PurchaseOrder(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('PURCHASE_ORDER');
    expect(obj.name).toBe('Purchase Order (Open)');
  });

  it('has 50+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(50);
  });

  it('extracts mock records (20 POs × 2-4 items)', () => {
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThanOrEqual(40);
    expect(records.length).toBeLessThanOrEqual(80);
  });

  it('transforms vendor to padded supplier', () => {
    const records = obj._extractMock();
    const result = obj.transform(records);
    const first = result.records[0];
    expect(first.Supplier).toBeDefined();
    expect(first.Supplier.length).toBe(10);
  });

  it('has quality checks for required fields and duplicates', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toContain('PurchaseOrder');
    expect(checks.required).toContain('Supplier');
    expect(checks.exactDuplicate.keys).toContain('PurchaseOrderItem');
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('PURCHASE_ORDER');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
  });
});
