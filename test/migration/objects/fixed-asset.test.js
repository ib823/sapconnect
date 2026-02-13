const FixedAsset = require('../../../migration/objects/fixed-asset');

describe('FixedAssetMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new FixedAsset(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('FIXED_ASSET');
    expect(obj.name).toBe('Fixed Asset');
  });

  it('has 60+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(60);
  });

  it('extracts 60 mock records (30 assets × 2 depreciation areas)', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(60);
  });

  it('has depreciation area mappings', () => {
    const mappings = obj.getFieldMappings();
    const targets = mappings.map(m => m.target);
    expect(targets).toContain('DepreciationArea');
    expect(targets).toContain('DepreciationKey');
    expect(targets).toContain('UsefulLife');
    expect(targets).toContain('AccumulatedDepreciation');
  });

  it('validates NDJAR range (1-99)', () => {
    const checks = obj.getQualityChecks();
    const rangeCheck = checks.range.find(r => r.field === 'UsefulLife');
    expect(rangeCheck).toBeDefined();
    expect(rangeCheck.min).toBe(1);
    expect(rangeCheck.max).toBe(99);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('FIXED_ASSET');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(60);
  });

  it('correctly computes net book value in mock data', () => {
    const records = obj._extractMock();
    const first = records[0];
    const acq = parseFloat(first.KANSW);
    const dep = parseFloat(first.KNAFA);
    const nbv = parseFloat(first.ANSWL);
    expect(Math.abs(nbv - (acq - dep))).toBeLessThan(1); // Rounding tolerance
  });
});
