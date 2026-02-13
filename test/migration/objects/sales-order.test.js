const SalesOrder = require('../../../migration/objects/sales-order');

describe('SalesOrderMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new SalesOrder(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('SALES_ORDER');
    expect(obj.name).toBe('Sales Order (Open)');
  });

  it('has 50+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(50);
  });

  it('extracts mock records (15 SOs × 2-5 items)', () => {
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThanOrEqual(30);
    expect(records.length).toBeLessThanOrEqual(75);
  });

  it('transforms customer to padded sold-to party', () => {
    const records = obj._extractMock();
    const result = obj.transform(records);
    const first = result.records[0];
    expect(first.SoldToParty).toBeDefined();
    expect(first.SoldToParty.length).toBe(10);
  });

  it('applies padLeft40 to material number', () => {
    const records = obj._extractMock();
    const result = obj.transform(records);
    const first = result.records[0];
    expect(first.Material.length).toBe(40);
  });

  it('has quality checks for required fields', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toContain('SalesOrder');
    expect(checks.required).toContain('SoldToParty');
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('SALES_ORDER');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
  });
});
