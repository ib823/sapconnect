const BomRouting = require('../../../migration/objects/bom-routing');

describe('BomRoutingMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new BomRouting(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('BOM_ROUTING');
    expect(obj.name).toBe('BOM and Routing');
  });

  it('has 45+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(45);
  });

  it('extracts mock records', () => {
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThanOrEqual(35);
  });

  it('has BOM_ITEM and ROUTING_OP record types', () => {
    const records = obj._extractMock();
    const types = new Set(records.map(r => r.RECORD_TYPE));
    expect(types.has('BOM_ITEM')).toBe(true);
    expect(types.has('ROUTING_OP')).toBe(true);
  });

  it('has 5 materials', () => {
    const records = obj._extractMock();
    const materials = new Set(records.map(r => r.MATNR));
    expect(materials.size).toBe(5);
  });

  it('BOM items have components', () => {
    const records = obj._extractMock();
    const bomItems = records.filter(r => r.RECORD_TYPE === 'BOM_ITEM');
    expect(bomItems.length).toBeGreaterThanOrEqual(20);
    expect(bomItems.every(r => r.IDNRK !== '')).toBe(true);
  });

  it('routing ops have work centers and times', () => {
    const records = obj._extractMock();
    const ops = records.filter(r => r.RECORD_TYPE === 'ROUTING_OP');
    expect(ops.length).toBeGreaterThanOrEqual(15);
    expect(ops.every(r => r.ARBPL !== '')).toBe(true);
    expect(ops.every(r => r.VGW01 !== '')).toBe(true);
  });

  it('includes engineering change numbers on some BOM items', () => {
    const records = obj._extractMock();
    const bomItems = records.filter(r => r.RECORD_TYPE === 'BOM_ITEM');
    const withECN = bomItems.filter(r => r.AESSION_ENNR !== '');
    expect(withECN.length).toBeGreaterThan(0);
  });

  it('has padLeft40 conversion for materials', () => {
    const mappings = obj.getFieldMappings();
    const matnr = mappings.find(m => m.source === 'MATNR');
    expect(matnr.convert).toBe('padLeft40');
    const comp = mappings.find(m => m.source === 'IDNRK');
    expect(comp.convert).toBe('padLeft40');
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('BOM_ROUTING');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBeGreaterThanOrEqual(35);
    expect(result.phases.validate.status).toBe('completed');
  });
});
