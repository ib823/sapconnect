const InforM3BOM = require('../../../../migration/infor/m3/bom');

describe('InforM3BOMMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforM3BOM(gateway);
    expect(obj.objectId).toBe('INFOR_M3_BOM');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('Infor M3 BOM');
  });

  it('should define field mappings', () => {
    const obj = new InforM3BOM(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforM3BOM(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('STKO-MATNR');
    expect(targets).toContain('STKO-WERKS');
    expect(targets).toContain('STPO-IDNRK');
    expect(targets).toContain('STPO-MENGE');
  });

  it('should define quality checks', () => {
    const obj = new InforM3BOM(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforM3BOM(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].SCPRNO).toBeDefined();
    expect(records[0].SCMTNO).toBeDefined();
    expect(records[0].SCCNQT).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforM3BOM(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_M3_BOM');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
