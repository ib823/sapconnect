const IDocConfig = require('../../../migration/objects/idoc-config');

describe('IDocConfigMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new IDocConfig(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('IDOC_CONFIG');
    expect(obj.name).toBe('IDoc Configuration');
  });

  it('has 23+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(23);
  });

  it('extracts 25 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(25);
    expect(records[0]).toHaveProperty('MESTYP');
    expect(records[0]).toHaveProperty('IDOCTP');
    expect(records[0]).toHaveProperty('DIRECT');
  });

  it('requires MessageType, IDocType, Direction, PartnerNumber', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toEqual(['MessageType', 'IDocType', 'Direction', 'PartnerNumber']);
  });

  it('deduplicates on composite key', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['MessageType', 'IDocType', 'Direction', 'PartnerNumber']);
  });

  it('validates DailyVolume range', () => {
    const checks = obj.getQualityChecks();
    const rangeCheck = checks.range.find(r => r.field === 'DailyVolume');
    expect(rangeCheck).toBeDefined();
    expect(rangeCheck.min).toBe(0);
    expect(rangeCheck.max).toBe(1000000);
  });

  it('classifies DEBMAS/CREMAS as replace strategy', () => {
    const records = obj._extractMock();
    const debmas = records.find(r => r.MESTYP === 'DEBMAS');
    const cremas = records.find(r => r.MESTYP === 'CREMAS');
    expect(debmas.MIGSTRATEGY).toBe('replace');
    expect(cremas.MIGSTRATEGY).toBe('replace');
  });

  it('classifies WMMBID/WMTOCO as replace strategy', () => {
    const records = obj._extractMock();
    const wmmbid = records.find(r => r.MESTYP === 'WMMBID');
    const wmtoco = records.find(r => r.MESTYP === 'WMTOCO');
    expect(wmmbid.MIGSTRATEGY).toBe('replace');
    expect(wmtoco.MIGSTRATEGY).toBe('replace');
  });

  it('classifies SF/Ariba/Concur as route-via-cpi', () => {
    const records = obj._extractMock();
    const hrmd = records.find(r => r.MESTYP === 'HRMD_A');
    const pordcr = records.find(r => r.MESTYP === 'PORDCR');
    const trvreq = records.find(r => r.MESTYP === 'TRVREQ');
    expect(hrmd.MIGSTRATEGY).toBe('route-via-cpi');
    expect(pordcr.MIGSTRATEGY).toBe('route-via-cpi');
    expect(trvreq.MIGSTRATEGY).toBe('route-via-cpi');
  });

  it('has both inbound and outbound flows', () => {
    const records = obj._extractMock();
    const dirs = new Set(records.map(r => r.DIRECT));
    expect(dirs.has('1')).toBe(true);
    expect(dirs.has('2')).toBe(true);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('IDOC_CONFIG');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(25);
    expect(result.phases.transform.recordCount).toBe(25);
    expect(result.phases.validate.status).toBe('completed');
  });
});
