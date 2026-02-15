const InforM3GLJournal = require('../../../../migration/infor/m3/gl-journal');

describe('InforM3GLJournalMigrationObject', () => {
  const gateway = { mode: 'mock' };

  it('should have correct identity', () => {
    const obj = new InforM3GLJournal(gateway);
    expect(obj.objectId).toBe('INFOR_M3_GL_JOURNAL');
    expect(obj.name).toBeDefined();
    expect(obj.name).toBe('Infor M3 GL Journal');
  });

  it('should define field mappings', () => {
    const obj = new InforM3GLJournal(gateway);
    const mappings = obj.getFieldMappings();
    expect(mappings.length).toBeGreaterThan(0);
    mappings.forEach(m => expect(m.target).toBeDefined());
  });

  it('should include key SAP target fields', () => {
    const obj = new InforM3GLJournal(gateway);
    const targets = obj.getFieldMappings().map(m => m.target);
    expect(targets).toContain('BKPF-BELNR');
    expect(targets).toContain('BKPF-GJAHR');
    expect(targets).toContain('ACDOCA-HKONT');
    expect(targets).toContain('ACDOCA-HSL');
  });

  it('should define quality checks', () => {
    const obj = new InforM3GLJournal(gateway);
    const checks = obj.getQualityChecks();
    expect(checks.required).toBeDefined();
    expect(checks.required.length).toBeGreaterThan(0);
  });

  it('should extract mock data', () => {
    const obj = new InforM3GLJournal(gateway);
    const records = obj._extractMock();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].ESVONO).toBeDefined();
    expect(records[0].ESAIT1).toBeDefined();
    expect(records[0].ESACAM).toBeDefined();
  });

  it('should run full ETLV pipeline in mock mode', async () => {
    const obj = new InforM3GLJournal(gateway);
    const result = await obj.run();
    expect(result.objectId).toBe('INFOR_M3_GL_JOURNAL');
    expect(result.status).toBeDefined();
    expect(result.phases.extract).toBeDefined();
    expect(result.phases.extract.recordCount).toBeGreaterThan(0);
    expect(result.phases.transform).toBeDefined();
    expect(result.phases.validate).toBeDefined();
  });
});
