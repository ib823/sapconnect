const ewmRules = require('../../../migration/rules/ewm-rules');

describe('EWM Rules', () => {
  it('exports 10 rules', () => {
    expect(ewmRules).toHaveLength(10);
  });

  it('all have SIMPL-EWM prefix', () => {
    for (const r of ewmRules) {
      expect(r.id).toMatch(/^SIMPL-EWM-/);
    }
  });

  it('all have required fields', () => {
    for (const r of ewmRules) {
      expect(r.title).toBeDefined();
      expect(r.severity).toBeDefined();
      expect(r.category).toBeDefined();
      expect(r.pattern).toBeInstanceOf(RegExp);
      expect(r.remediation).toBeDefined();
    }
  });

  it('detects legacy WM transactions', () => {
    const rule = ewmRules.find(r => r.id === 'SIMPL-EWM-001');
    expect(rule.pattern.test('CALL TRANSACTION LT01')).toBe(true);
    expect(rule.pattern.test('LS26 display')).toBe(true);
  });

  it('detects transfer orders', () => {
    const rule = ewmRules.find(r => r.id === 'SIMPL-EWM-004');
    expect(rule.pattern.test('SELECT * FROM LTAP')).toBe(true);
    expect(rule.pattern.test('CALL FUNCTION BAPI_WHSE_TO')).toBe(true);
  });

  it('detects RF framework', () => {
    const rule = ewmRules.find(r => r.id === 'SIMPL-EWM-006');
    expect(rule.pattern.test('LM00')).toBe(true);
  });

  it('has critical rules for WM removal and TO replacement', () => {
    const critical = ewmRules.filter(r => r.severity === 'critical');
    expect(critical.length).toBe(2);
  });

  it('covers warehouse structure, processes, inventory, and features', () => {
    const categories = new Set(ewmRules.map(r => r.category));
    expect(categories.size).toBeGreaterThanOrEqual(4);
  });
});
