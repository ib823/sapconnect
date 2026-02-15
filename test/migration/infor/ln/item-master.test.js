const InforLNItemMaster = require('../../../../migration/infor/ln/item-master');

describe('InforLNItemMasterMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforLNItemMaster(gateway);
    expect(obj.objectId).toBe('INFOR_LN_ITEM_MASTER');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('LN Item Master to SAP Material Master');
  });

  it('should define field mappings', () => {
    const obj = new InforLNItemMaster(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforLNItemMaster(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('MARA-MATNR');
    expect(targets).toContain('MAKT-MAKTX');
    expect(targets).toContain('MARA-MEINS');
    expect(targets).toContain('MARA-MTART');
  });

  it('should define quality checks', () => {
    const obj = new InforLNItemMaster(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforLNItemMaster(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].item).toBeDefined();
    expect(records[0].dsca).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforLNItemMaster(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_LN_ITEM_MASTER');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
