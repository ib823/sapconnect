const TransportRoute = require('../../../migration/objects/transport-route');

describe('TransportRouteMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new TransportRoute(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('TRANSPORT_ROUTE');
    expect(obj.name).toBe('Transportation Route');
  });

  it('has 32+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(32);
  });

  it('extracts 18 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(17);
  });

  it('has 10 unique routes', () => {
    const records = obj._extractMock();
    const routes = new Set(records.map(r => r.ROUTE));
    expect(routes.size).toBe(10);
  });

  it('has ROAD, SEA, and AIR shipping types', () => {
    const records = obj._extractMock();
    const types = new Set(records.map(r => r.VSART));
    expect(types.has('ROAD')).toBe(true);
    expect(types.has('SEA')).toBe(true);
    expect(types.has('AIR')).toBe(true);
  });

  it('multi-leg routes have leg indicators', () => {
    const records = obj._extractMock();
    const seaLegs = records.filter(r => r.VSART === 'SEA');
    expect(seaLegs.every(r => r.LEG_IND === 'Y')).toBe(true);
    const singleLeg = records.filter(r => r.LEG_IND === 'N');
    expect(singleLeg.every(r => r.LEG_SEQ === '1')).toBe(true);
  });

  it('all routes have TM lane assignments', () => {
    const records = obj._extractMock();
    expect(records.every(r => r.TM_LANE_ID.startsWith('LANE_'))).toBe(true);
    expect(records.every(r => r.MIGRATION_ACTION === 'MIGRATE_TO_TM')).toBe(true);
  });

  it('has 3 different carriers', () => {
    const records = obj._extractMock();
    const carriers = new Set(records.map(r => r.TDLNR));
    expect(carriers.size).toBe(3);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('TRANSPORT_ROUTE');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(17);
    expect(result.phases.validate.status).toBe('completed');
  });
});
