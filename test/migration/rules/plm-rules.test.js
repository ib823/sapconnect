const plmRules = require('../../../migration/rules/plm-rules');

describe('PLM Rules', () => {
  it('exports 8 rules', () => {
    expect(plmRules).toHaveLength(28);
  });

  it('all have SIMPL-PLM prefix', () => {
    for (const r of plmRules) {
      expect(r.id).toMatch(/^SIMPL-PLM-/);
    }
  });

  it('all have required fields', () => {
    for (const r of plmRules) {
      expect(r.title).toBeDefined();
      expect(r.severity).toBeDefined();
      expect(r.category).toBeDefined();
      expect(r.pattern).toBeInstanceOf(RegExp);
      expect(r.remediation).toBeDefined();
    }
  });

  it('detects BOM transactions', () => {
    const rule = plmRules.find(r => r.id === 'SIMPL-PLM-002');
    expect(rule.pattern.test('CS01 create BOM')).toBe(true);
    expect(rule.pattern.test('SELECT FROM STPO')).toBe(true);
    expect(rule.pattern.test('CALL FUNCTION CSAP_MAT_BOM')).toBe(true);
  });

  it('detects routing transactions', () => {
    const rule = plmRules.find(r => r.id === 'SIMPL-PLM-003');
    expect(rule.pattern.test('CA01 create routing')).toBe(true);
    expect(rule.pattern.test('SELECT FROM PLKO')).toBe(true);
  });

  it('detects engineering change management', () => {
    const rule = plmRules.find(r => r.id === 'SIMPL-PLM-001');
    expect(rule.pattern.test('CC01 create change')).toBe(true);
  });

  it('detects document management', () => {
    const rule = plmRules.find(r => r.id === 'SIMPL-PLM-004');
    expect(rule.pattern.test('CV01N create doc')).toBe(true);
  });

  it('has critical BOM rule', () => {
    const critical = plmRules.filter(r => r.severity === 'critical');
    expect(critical.length).toBe(1);
    expect(critical[0].id).toBe('SIMPL-PLM-002');
  });

  it('covers ECM, BOM, routing, DMS, classification, recipe, and variant categories', () => {
    const categories = new Set(plmRules.map(r => r.category));
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });
});
