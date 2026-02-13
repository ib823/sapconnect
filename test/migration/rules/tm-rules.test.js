const tmRules = require('../../../migration/rules/tm-rules');

describe('TM Rules', () => {
  it('exports 24 rules', () => {
    expect(tmRules).toHaveLength(24);
  });

  it('all have SIMPL-TM prefix', () => {
    for (const r of tmRules) {
      expect(r.id).toMatch(/^SIMPL-TM-/);
    }
  });

  it('all have required fields', () => {
    for (const r of tmRules) {
      expect(r.title).toBeDefined();
      expect(r.severity).toBeDefined();
      expect(r.category).toBeDefined();
      expect(r.pattern).toBeInstanceOf(RegExp);
      expect(r.remediation).toBeDefined();
    }
  });

  it('detects legacy shipment transactions', () => {
    const rule = tmRules.find(r => r.id === 'SIMPL-TM-001');
    expect(rule.pattern.test('CALL TRANSACTION VT01N')).toBe(true);
    expect(rule.pattern.test('SELECT * FROM VTTK')).toBe(true);
  });

  it('detects shipment cost transactions', () => {
    const rule = tmRules.find(r => r.id === 'SIMPL-TM-002');
    expect(rule.pattern.test('VI01 create')).toBe(true);
  });

  it('detects route determination config', () => {
    const rule = tmRules.find(r => r.id === 'SIMPL-TM-004');
    expect(rule.pattern.test('OVTC config')).toBe(true);
  });

  it('has critical shipment processing rule', () => {
    const critical = tmRules.filter(r => r.severity === 'critical');
    expect(critical.length).toBe(1);
  });

  it('covers shipment, route, and integration categories', () => {
    const categories = new Set(tmRules.map(r => r.category));
    expect(categories.size).toBeGreaterThanOrEqual(3);
  });
});
