const ProfitSegment = require('../../../migration/objects/profit-segment');

describe('Profitability Segment', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => {
    obj = new ProfitSegment(gw);
  });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('PROFIT_SEGMENT');
    expect(obj.name).toBe('Profitability Segment');
  });

  it('has 35 field mappings', () => {
    expect(obj.getFieldMappings()).toHaveLength(35);
  });

  it('extracts 30 mock records', async () => {
    const result = await obj.run();
    expect(result.phases.extract.recordCount).toBe(30);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.status).toBe('completed');
    expect(result.phases.transform.status).toBe('completed');
    expect(result.phases.validate).toBeDefined();
    expect(result.phases.load).toBeDefined();
  });

  it('validates required fields', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toEqual(['ProfitabilitySegmentNumber', 'ControllingArea', 'FiscalYear']);
  });

  it('checks for duplicates on correct keys', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['ProfitabilitySegmentNumber']);
  });

  it('all mappings have a target', () => {
    for (const m of obj.getFieldMappings()) {
      expect(m.target).toBeDefined();
    }
  });
});
