const InternalOrder = require('../../../migration/objects/internal-order');

describe('InternalOrderMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new InternalOrder(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('INTERNAL_ORDER');
    expect(obj.name).toBe('Internal Order');
  });

  it('has 35+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(35);
  });

  it('extracts 20 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(20);
    expect(records[0]).toHaveProperty('AUFNR');
    expect(records[0]).toHaveProperty('AUART');
    expect(records[0]).toHaveProperty('KTEXT');
  });

  it('has status phase mappings', () => {
    const mappings = obj.getFieldMappings();
    const targets = mappings.map(m => m.target);
    expect(targets).toContain('IsCreated');
    expect(targets).toContain('IsReleased');
    expect(targets).toContain('IsTechnicallyComplete');
    expect(targets).toContain('IsClosed');
    expect(targets).toContain('IsDeleted');
  });

  it('requires InternalOrder, OrderType, CompanyCode, ControllingArea', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toEqual(['InternalOrder', 'OrderType', 'CompanyCode', 'ControllingArea']);
  });

  it('deduplicates on InternalOrder', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['InternalOrder']);
  });

  it('transforms AUFNR with padLeft10', () => {
    const mappings = obj.getFieldMappings();
    const orderMapping = mappings.find(m => m.source === 'AUFNR');
    expect(orderMapping.convert).toBe('padLeft10');
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('INTERNAL_ORDER');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(20);
    expect(result.phases.transform.recordCount).toBe(20);
    expect(result.phases.validate.status).toBe('completed');
  });

  it('mock data has 5 different order types', () => {
    const records = obj._extractMock();
    const types = new Set(records.map(r => r.AUART));
    expect(types.size).toBe(5);
  });

  it('mock data has 15 released and 5 unreleased orders', () => {
    const records = obj._extractMock();
    const released = records.filter(r => r.PHAS1 === 'X');
    expect(released).toHaveLength(15);
  });
});
