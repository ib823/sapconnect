const gtsRules = require('../../../migration/rules/gts-rules');

describe('GTS Rules', () => {
  it('exports 8 rules', () => {
    expect(gtsRules).toHaveLength(8);
  });

  it('all have SIMPL-GTS prefix', () => {
    for (const r of gtsRules) {
      expect(r.id).toMatch(/^SIMPL-GTS-/);
    }
  });

  it('all have required fields', () => {
    for (const r of gtsRules) {
      expect(r.title).toBeDefined();
      expect(r.severity).toBeDefined();
      expect(r.category).toBeDefined();
      expect(r.pattern).toBeInstanceOf(RegExp);
      expect(r.remediation).toBeDefined();
    }
  });

  it('detects sanctions screening', () => {
    const rule = gtsRules.find(r => r.id === 'SIMPL-GTS-001');
    expect(rule.pattern.test('CALL FUNCTION SPL_CHECK')).toBe(true);
    expect(rule.pattern.test('/SAPSLL/ class')).toBe(true);
  });

  it('detects export control', () => {
    const rule = gtsRules.find(r => r.id === 'SIMPL-GTS-002');
    expect(rule.pattern.test('ECCN classification')).toBe(true);
  });

  it('detects customs declarations', () => {
    const rule = gtsRules.find(r => r.id === 'SIMPL-GTS-003');
    expect(rule.pattern.test('CUSTOMS_DECL processing')).toBe(true);
  });

  it('detects HS/tariff codes', () => {
    const rule = gtsRules.find(r => r.id === 'SIMPL-GTS-004');
    expect(rule.pattern.test('HS_CODE maintenance')).toBe(true);
    expect(rule.pattern.test('STAWN table')).toBe(true);
  });

  it('has critical screening rule', () => {
    const critical = gtsRules.filter(r => r.severity === 'critical');
    expect(critical.length).toBe(1);
  });

  it('covers compliance, customs, preference, and license categories', () => {
    const categories = new Set(gtsRules.map(r => r.category));
    expect(categories.size).toBeGreaterThanOrEqual(4);
  });
});
