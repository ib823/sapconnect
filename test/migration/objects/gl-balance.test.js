const GLBalance = require('../../../migration/objects/gl-balance');

describe('GLBalanceMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new GLBalance(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('GL_BALANCE');
    expect(obj.name).toBe('GL Account Balance');
  });

  it('has 70+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(70);
  });

  it('extracts 30 mock records (3 companies × 10 accounts)', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(30);
    expect(records[0]).toHaveProperty('BUKRS');
    expect(records[0]).toHaveProperty('RACCT');
    expect(records[0]).toHaveProperty('HSL01');
  });

  it('has period fields HSL01-HSL16, TSL01-TSL16, KSL01-KSL16', () => {
    const mappings = obj.getFieldMappings();
    const targets = mappings.map(m => m.target);
    expect(targets).toContain('AmtInCompCodeCrcy01');
    expect(targets).toContain('AmtInCompCodeCrcy16');
    expect(targets).toContain('AmtInTransCrcy01');
    expect(targets).toContain('AmtInGlobalCrcy16');
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('GL_BALANCE');
    expect(result.status).toBe('completed');
    expect(result.phases.extract.recordCount).toBe(30);
    expect(result.phases.transform.recordCount).toBe(30);
    expect(result.phases.validate.status).toBe('completed');
    expect(result.phases.load).toBeDefined();
    expect(result.stats.extractedRecords).toBe(30);
  });

  it('transforms RACCT with padLeft10', () => {
    const records = [{ RLDNR: '0L', RRCTY: '0', RVERS: '001', BUKRS: '1000', RYEAR: 2024, RACCT: '100000', RBUSA: '', RCNTR: '', PRCTR: '', RFAREA: '', SEGMENT: '', RTCUR: 'USD', RUNIT: '', DRCRK: 'S', RPMAX: 16, HSLVT: '0', TSLVT: '0', KSLVT: '0', LOESSION_FLAG: '', TIMESTAMP: '' }];
    // Add period fields
    for (let p = 1; p <= 16; p++) {
      const pp = String(p).padStart(2, '0');
      records[0][`HSL${pp}`] = '100.00';
      records[0][`TSL${pp}`] = '100.00';
      records[0][`KSL${pp}`] = '100.00';
    }
    const result = obj.transform(records);
    expect(result.records[0].GLAccount).toBe('0000100000');
  });
});
