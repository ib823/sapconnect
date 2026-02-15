const InforLNBOM = require('../../../../migration/infor/ln/bom');

describe('InforLNBOMMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforLNBOM(gateway);
    expect(obj.objectId).toBe('INFOR_LN_BOM');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('LN BOM to SAP Bill of Materials');
  });

  it('should define field mappings', () => {
    const obj = new InforLNBOM(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforLNBOM(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('STKO-MATNR');
    expect(targets).toContain('STKO-WERKS');
    expect(targets).toContain('STPO-IDNRK');
    expect(targets).toContain('STPO-MENGE');
  });

  it('should define quality checks', () => {
    const obj = new InforLNBOM(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforLNBOM(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].mitm).toBeDefined();
    expect(records[0].citm).toBeDefined();
    expect(records[0].cqty).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforLNBOM(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_LN_BOM');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
