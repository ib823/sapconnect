const RFCDestination = require('../../../migration/objects/rfc-destination');

describe('RFCDestinationMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new RFCDestination(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('RFC_DESTINATION');
    expect(obj.name).toBe('RFC Destination');
  });

  it('has 19+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(19);
  });

  it('extracts 20 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(20);
    expect(records[0]).toHaveProperty('RFCDEST');
    expect(records[0]).toHaveProperty('RFCTYPE');
    expect(records[0]).toHaveProperty('RFCHOST');
  });

  it('requires Destination, RFCType, TargetHost', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toEqual(['Destination', 'RFCType', 'TargetHost']);
  });

  it('deduplicates on Destination', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['Destination']);
  });

  it('classifies APO/CRM/SRM destinations as decommission', () => {
    const records = obj._extractMock();
    const crm = records.find(r => r.RFCDEST === 'ERP_TO_CRM');
    const srm = records.find(r => r.RFCDEST === 'ERP_TO_SRM');
    const apo = records.find(r => r.RFCDEST === 'ERP_TO_APO');
    expect(crm.RFCMIGSTRATEGY).toBe('decommission');
    expect(srm.RFCMIGSTRATEGY).toBe('decommission');
    expect(apo.RFCMIGSTRATEGY).toBe('decommission');
  });

  it('classifies PI destinations as replace-with-cpi', () => {
    const records = obj._extractMock();
    const pi = records.find(r => r.RFCDEST === 'ERP_TO_PI');
    expect(pi.RFCMIGSTRATEGY).toBe('replace-with-cpi');
  });

  it('classifies cloud destinations as route-via-cpi', () => {
    const records = obj._extractMock();
    const sf = records.find(r => r.RFCDEST === 'SF_EC');
    const ariba = records.find(r => r.RFCDEST === 'ARIBA_NETWORK');
    expect(sf.RFCMIGSTRATEGY).toBe('route-via-cpi');
    expect(ariba.RFCMIGSTRATEGY).toBe('route-via-cpi');
  });

  it('has all 3 RFC types (3, H, T)', () => {
    const records = obj._extractMock();
    const types = new Set(records.map(r => r.RFCTYPE));
    expect(types.has('3')).toBe(true);
    expect(types.has('H')).toBe(true);
    expect(types.has('T')).toBe(true);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('RFC_DESTINATION');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(20);
    expect(result.phases.transform.recordCount).toBe(20);
    expect(result.phases.validate.status).toBe('completed');
  });
});
