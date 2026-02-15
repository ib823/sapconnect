const InforM3ItemMaster = require('../../../../migration/infor/m3/item-master');

describe('InforM3ItemMasterMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforM3ItemMaster(gateway);
    expect(obj.objectId).toBe('INFOR_M3_ITEM_MASTER');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('Infor M3 Item Master');
  });

  it('should define field mappings', () => {
    const obj = new InforM3ItemMaster(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforM3ItemMaster(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('MARA-MATNR');
    expect(targets).toContain('MAKT-MAKTX');
    expect(targets).toContain('MARA-MEINS');
    expect(targets).toContain('MARA-MTART');
  });

  it('should define quality checks', () => {
    const obj = new InforM3ItemMaster(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforM3ItemMaster(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].MMITNO).toBeDefined();
    expect(records[0].MMITDS).toBeDefined();
    expect(records[0].MMITTY).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforM3ItemMaster(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_M3_ITEM_MASTER');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
