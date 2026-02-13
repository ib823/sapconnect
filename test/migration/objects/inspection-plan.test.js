const InspectionPlan = require('../../../migration/objects/inspection-plan');

describe('InspectionPlanMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new InspectionPlan(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('INSPECTION_PLAN');
    expect(obj.name).toBe('Inspection Plan');
  });

  it('has 40+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(40);
  });

  it('extracts 45 mock records (5 plans × 3 ops × 3 chars)', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(45);
    expect(records[0]).toHaveProperty('PLNTY');
    expect(records[0]).toHaveProperty('PLNNR');
    expect(records[0]).toHaveProperty('MKMNR');
  });

  it('has header, operation, and characteristic mappings', () => {
    const mappings = obj.getFieldMappings();
    const targets = mappings.map(m => m.target);
    // Header
    expect(targets).toContain('TaskListGroup');
    expect(targets).toContain('TaskListDescription');
    expect(targets).toContain('Plant');
    // Operations
    expect(targets).toContain('OperationNumber');
    expect(targets).toContain('OperationDescription');
    expect(targets).toContain('WorkCenter');
    // Characteristics
    expect(targets).toContain('CharacteristicNumber');
    expect(targets).toContain('CharacteristicText');
    expect(targets).toContain('TargetValue');
    expect(targets).toContain('UpperLimit');
    expect(targets).toContain('LowerLimit');
  });

  it('requires TaskListGroup, TaskListDescription, Plant', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toEqual(['TaskListGroup', 'TaskListDescription', 'Plant']);
  });

  it('deduplicates on composite key', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual([
      'TaskListGroup', 'TaskListGroupCounter', 'OperationNumber', 'CharacteristicNumber',
    ]);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('INSPECTION_PLAN');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(45);
    expect(result.phases.transform.recordCount).toBe(45);
    expect(result.phases.validate.status).toBe('completed');
  });

  it('mock data has quantitative and qualitative characteristics', () => {
    const records = obj._extractMock();
    const types = new Set(records.map(r => r.QMTB_ART));
    expect(types.has('M')).toBe(true); // Measured
    expect(types.has('Q')).toBe(true); // Qualitative
  });

  it('mock data has sample procedure defined', () => {
    const records = obj._extractMock();
    expect(records.every(r => r.SLWBEZ === 'SP01')).toBe(true);
  });
});
