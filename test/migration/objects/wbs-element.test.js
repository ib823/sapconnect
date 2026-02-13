const WBSElement = require('../../../migration/objects/wbs-element');

describe('WBSElementMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new WBSElement(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('WBS_ELEMENT');
    expect(obj.name).toBe('WBS Element');
  });

  it('has 40+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(40);
  });

  it('extracts 18 mock records (3 projects + 15 WBS elements)', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(18);
  });

  it('has project definition and WBS element fields', () => {
    const mappings = obj.getFieldMappings();
    const targets = mappings.map(m => m.target);
    expect(targets).toContain('ProjectDefinition');
    expect(targets).toContain('ProjectDescription');
    expect(targets).toContain('WBSElement');
    expect(targets).toContain('WBSDescription');
    expect(targets).toContain('WBSLevel');
    expect(targets).toContain('WBSElementParent');
  });

  it('has date and status fields', () => {
    const mappings = obj.getFieldMappings();
    const targets = mappings.map(m => m.target);
    expect(targets).toContain('PlannedStartDate');
    expect(targets).toContain('PlannedEndDate');
    expect(targets).toContain('SystemStatus');
    expect(targets).toContain('IsDeleted');
  });

  it('requires WBSElement, WBSDescription, CompanyCode, ControllingArea', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toEqual(['WBSElement', 'WBSDescription', 'CompanyCode', 'ControllingArea']);
  });

  it('deduplicates on WBSElement', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['WBSElement']);
  });

  it('validates WBSLevel range (1-10)', () => {
    const checks = obj.getQualityChecks();
    const rangeCheck = checks.range.find(r => r.field === 'WBSLevel');
    expect(rangeCheck).toBeDefined();
    expect(rangeCheck.min).toBe(1);
    expect(rangeCheck.max).toBe(10);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('WBS_ELEMENT');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(18);
    expect(result.phases.transform.recordCount).toBe(18);
    expect(result.phases.validate.status).toBe('completed');
  });

  it('mock data has hierarchical structure', () => {
    const records = obj._extractMock();
    const levels = new Set(records.map(r => r.STUFE));
    expect(levels.has(1)).toBe(true);
    expect(levels.has(2)).toBe(true);
    expect(levels.has(3)).toBe(true);
  });

  it('mock data has 3 different project definitions', () => {
    const records = obj._extractMock();
    const projects = new Set(records.map(r => r.PSPID));
    expect(projects.size).toBe(3);
  });
});
