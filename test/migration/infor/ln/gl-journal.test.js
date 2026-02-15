const InforLNGLJournal = require('../../../../migration/infor/ln/gl-journal');

describe('InforLNGLJournalMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforLNGLJournal(gateway);
    expect(obj.objectId).toBe('INFOR_LN_GL_JOURNAL');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('LN GL Journal to SAP Accounting Document');
  });

  it('should define field mappings', () => {
    const obj = new InforLNGLJournal(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforLNGLJournal(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('BKPF-BELNR');
    expect(targets).toContain('BKPF-GJAHR');
    expect(targets).toContain('ACDOCA-HKONT');
    expect(targets).toContain('ACDOCA-HSL');
  });

  it('should define quality checks', () => {
    const obj = new InforLNGLJournal(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforLNGLJournal(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].docn).toBeDefined();
    expect(records[0].fled).toBeDefined();
    expect(records[0].amount).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforLNGLJournal(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_LN_GL_JOURNAL');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
