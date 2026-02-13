const MaterialMaster = require('../../../migration/objects/material-master');

describe('MaterialMasterMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new MaterialMaster(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('MATERIAL_MASTER');
    expect(obj.name).toBe('Material Master');
  });

  it('has 100+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(100);
  });

  it('extracts 150 mock records (25 materials × 3 plants × 2 slocs)', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(150);
  });

  it('applies padLeft40 to MATNR', () => {
    const records = [{ MATNR: 'MAT00001', MTART: 'FERT', MEINS: 'EA' }];
    // Fill remaining fields to avoid undefined
    const allMappings = obj.getFieldMappings();
    for (const m of allMappings) {
      if (m.source && records[0][m.source] === undefined) {
        records[0][m.source] = '';
      }
    }
    const result = obj.transform(records);
    expect(result.records[0].Product).toHaveLength(40);
    expect(result.records[0].Product.endsWith('MAT00001')).toBe(true);
  });

  it('has multi-view records (MARA + MARC + MARD fields)', () => {
    const mappings = obj.getFieldMappings();
    const targets = mappings.map(m => m.target);
    // MARA
    expect(targets).toContain('Product');
    expect(targets).toContain('ProductType');
    // MARC
    expect(targets).toContain('Plant');
    expect(targets).toContain('MRPType');
    // MARD
    expect(targets).toContain('StorageLocation');
    expect(targets).toContain('UnrestrictedStock');
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('MATERIAL_MASTER');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(150);
  });
});
