const psRules = require('../../../migration/rules/ps-rules');
const { registry } = require('../../../migration/rules/index');

describe('PS Rules', () => {
  it('exports 30 rules', () => {
    expect(psRules).toHaveLength(30);
  });

  it('all rules have required fields', () => {
    for (const rule of psRules) {
      expect(rule).toHaveProperty('id');
      expect(rule).toHaveProperty('category');
      expect(rule).toHaveProperty('severity');
      expect(rule).toHaveProperty('title');
      expect(rule).toHaveProperty('description');
      expect(rule).toHaveProperty('pattern');
      expect(rule).toHaveProperty('patternType');
      expect(rule).toHaveProperty('remediation');
      expect(rule).toHaveProperty('simplificationId');
    }
  });

  it('all rule IDs start with SIMPL-PS-', () => {
    for (const rule of psRules) {
      expect(rule.id).toMatch(/^SIMPL-PS-\d{3}$/);
    }
  });

  it('has unique rule IDs', () => {
    const ids = psRules.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has rules for WBS, Networks, Milestones, Earned Value, Settlement, Budgeting', () => {
    const categories = psRules.map(r => r.category);
    expect(categories.some(c => c.includes('WBS'))).toBe(true);
    expect(categories.some(c => c.includes('Networks'))).toBe(true);
    expect(categories.some(c => c.includes('Milestones'))).toBe(true);
    expect(categories.some(c => c.includes('Earned Value'))).toBe(true);
    expect(categories.some(c => c.includes('Settlement'))).toBe(true);
    expect(categories.some(c => c.includes('Budgeting'))).toBe(true);
  });

  it('rules are registered in the global registry', () => {
    const psRegistered = registry.getByModule('ps');
    expect(psRegistered.length).toBe(30);
  });

  it('PRPS pattern matches source code', () => {
    const rule = psRules.find(r => r.id === 'SIMPL-PS-001');
    expect(rule.pattern.test('SELECT * FROM PRPS WHERE PSPNR = X.')).toBe(true);
    expect(rule.pattern.test('SELECT * FROM PROJ WHERE PSPID = Y.')).toBe(true);
  });

  it('cProject rule detects cProject/RPM usage', () => {
    const rule = psRules.find(r => r.id === 'SIMPL-PS-027');
    expect(rule.pattern.test('Using CPROJECT module')).toBe(true);
    expect(rule.pattern.test('IF CPROJECT IS ACTIVE.')).toBe(true);
  });

  it('has high severity for critical changes', () => {
    const highRules = psRules.filter(r => r.severity === 'high');
    expect(highRules.length).toBeGreaterThanOrEqual(4);
  });
});
