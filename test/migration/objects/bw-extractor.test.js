const BWExtractor = require('../../../migration/objects/bw-extractor');

describe('BWExtractorMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new BWExtractor(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('BW_EXTRACTOR');
    expect(obj.name).toBe('BW Extractor');
  });

  it('has 27+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(27);
  });

  it('extracts 16 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(16);
  });

  it('classifies FI extractors as replace-with-cds', () => {
    const records = obj._extractMock();
    const fi = records.filter(r => r.DATASOURCE.startsWith('0FI_'));
    expect(fi.length).toBeGreaterThanOrEqual(3);
    expect(fi.every(r => r.MIGRATION_ACTION === 'replace-with-cds')).toBe(true);
    expect(fi.every(r => r.IMPACT === 'HIGH')).toBe(true);
  });

  it('classifies CO extractors as replace-with-cds', () => {
    const records = obj._extractMock();
    const co = records.filter(r => r.DATASOURCE.startsWith('0CO_'));
    expect(co.length).toBeGreaterThanOrEqual(2);
    expect(co.every(r => r.MIGRATION_ACTION === 'replace-with-cds')).toBe(true);
  });

  it('classifies logistics extractors as update', () => {
    const records = obj._extractMock();
    const lis = records.filter(r => r.DATASOURCE.startsWith('2LIS_'));
    expect(lis.length).toBeGreaterThanOrEqual(3);
    expect(lis.every(r => r.MIGRATION_ACTION === 'update')).toBe(true);
  });

  it('classifies custom extractors as update with HIGH impact', () => {
    const records = obj._extractMock();
    const custom = records.filter(r => r.IS_CUSTOM === 'X');
    expect(custom).toHaveLength(3);
    expect(custom.every(r => r.MIGRATION_ACTION === 'update')).toBe(true);
    expect(custom.every(r => r.IMPACT === 'HIGH')).toBe(true);
    expect(custom.every(r => r.CUSTOM_FM !== '')).toBe(true);
  });

  it('classifies standard unaffected extractors as keep', () => {
    const records = obj._extractMock();
    const keep = records.filter(r => r.MIGRATION_ACTION === 'keep');
    expect(keep.length).toBeGreaterThanOrEqual(2);
    expect(keep.every(r => r.IMPACT === 'LOW')).toBe(true);
  });

  it('all records have assessment status', () => {
    const records = obj._extractMock();
    expect(records.every(r => r.STATUS === 'ASSESSED')).toBe(true);
  });

  it('has priority assignments based on impact', () => {
    const records = obj._extractMock();
    const highImpact = records.filter(r => r.IMPACT === 'HIGH');
    expect(highImpact.every(r => r.PRIORITY === 'P1')).toBe(true);
    const lowImpact = records.filter(r => r.IMPACT === 'LOW');
    expect(lowImpact.every(r => r.PRIORITY === 'P3')).toBe(true);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('BW_EXTRACTOR');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(16);
    expect(result.phases.validate.status).toBe('completed');
  });
});
