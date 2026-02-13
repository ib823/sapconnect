const COConfig = require('../../../migration/objects/co-config');

describe('COConfigMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new COConfig(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('CO_CONFIG');
    expect(obj.name).toBe('Controlling Configuration');
  });

  it('has 24+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(24);
  });

  it('extracts 28 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(28);
  });

  it('has all config categories', () => {
    const records = obj._extractMock();
    const types = new Set(records.map(r => r.CONFIG_TYPE));
    expect(types.has('CONTROLLING_AREA')).toBe(true);
    expect(types.has('CC_CATEGORY')).toBe(true);
    expect(types.has('COST_ELEMENT')).toBe(true);
    expect(types.has('ACTIVITY_TYPE')).toBe(true);
    expect(types.has('STAT_KEY_FIGURE')).toBe(true);
    expect(types.has('ALLOCATION_CYCLE')).toBe(true);
  });

  it('has primary and secondary cost elements', () => {
    const records = obj._extractMock();
    const costElements = records.filter(r => r.CONFIG_TYPE === 'COST_ELEMENT');
    const primary = costElements.filter(r => r.KAESSION_TYP === '1');
    const secondary = costElements.filter(r => r.KAESSION_TYP !== '1');
    expect(primary.length).toBeGreaterThan(0);
    expect(secondary.length).toBeGreaterThan(0);
  });

  it('has activity types with prices', () => {
    const records = obj._extractMock();
    const activities = records.filter(r => r.CONFIG_TYPE === 'ACTIVITY_TYPE');
    expect(activities.length).toBe(5);
    const labor = activities.find(r => r.LSTAR === 'LABOR');
    expect(labor.PRICE).toBe('75.00');
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('CO_CONFIG');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(28);
    expect(result.phases.validate.status).toBe('completed');
  });
});
