const BusinessPartner = require('../../../migration/objects/business-partner');

describe('BusinessPartnerMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new BusinessPartner(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('BUSINESS_PARTNER');
    expect(obj.name).toBe('Business Partner');
  });

  it('has 80+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(80);
  });

  it('extracts 85 mock records (50 customers + 30 vendors + 5 overlapping)', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(85);
  });

  it('merges overlapping customer/vendor into single BP', () => {
    const records = obj._extractMock();
    const result = obj.transform(records);
    // 5 overlapping entities should merge: 85 → 80
    expect(result.recordCount).toBe(80);
    expect(result.mergedCount).toBe(5);
  });

  it('merged BPs have both customer and vendor roles', () => {
    const records = obj._extractMock();
    const result = obj.transform(records);
    const merged = result.records.filter(r => r._roles && r._roles.includes('FLCU01') && r._roles.includes('FLVN01'));
    expect(merged.length).toBe(5);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('BUSINESS_PARTNER');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(85);
    expect(result.phases.transform.recordCount).toBe(80); // After merge
  });

  it('has quality checks for required, exact dupe, fuzzy dupe', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toContain('BusinessPartner');
    expect(checks.exactDuplicate).toBeDefined();
    expect(checks.fuzzyDuplicate).toBeDefined();
  });
});
