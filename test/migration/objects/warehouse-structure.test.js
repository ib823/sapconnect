const WarehouseStructure = require('../../../migration/objects/warehouse-structure');

describe('WarehouseStructureMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new WarehouseStructure(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('WAREHOUSE_STRUCTURE');
    expect(obj.name).toBe('Warehouse Structure');
  });

  it('has 37+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(37);
  });

  it('extracts 42 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(42);
  });

  it('has 2 warehouses', () => {
    const records = obj._extractMock();
    const warehouses = new Set(records.map(r => r.LGNUM));
    expect(warehouses.size).toBe(2);
    expect(warehouses.has('WH01')).toBe(true);
    expect(warehouses.has('WH02')).toBe(true);
  });

  it('has 6 storage types per warehouse', () => {
    const records = obj._extractMock();
    const wh01Types = new Set(records.filter(r => r.LGNUM === 'WH01').map(r => r.LGTYP));
    expect(wh01Types.size).toBe(6);
  });

  it('includes quant data with material references', () => {
    const records = obj._extractMock();
    expect(records.every(r => r.LQNUM !== '')).toBe(true);
    expect(records.every(r => r.MATNR !== '')).toBe(true);
  });

  it('includes EWM mapping targets', () => {
    const records = obj._extractMock();
    expect(records.every(r => r.EWM_WH.startsWith('/SCWM/'))).toBe(true);
  });

  it('has padLeft40 conversion for material', () => {
    const mappings = obj.getFieldMappings();
    const matnr = mappings.find(m => m.source === 'MATNR');
    expect(matnr.convert).toBe('padLeft40');
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('WAREHOUSE_STRUCTURE');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(42);
    expect(result.phases.validate.status).toBe('completed');
  });
});
