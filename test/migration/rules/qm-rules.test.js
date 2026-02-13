const qmRules = require('../../../migration/rules/qm-rules');
const { registry } = require('../../../migration/rules/index');

describe('QM Rules', () => {
  it('exports 20 rules', () => {
    expect(qmRules).toHaveLength(20);
  });

  it('all rules have required fields', () => {
    for (const rule of qmRules) {
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

  it('all rule IDs start with SIMPL-QM-', () => {
    for (const rule of qmRules) {
      expect(rule.id).toMatch(/^SIMPL-QM-\d{3}$/);
    }
  });

  it('has unique rule IDs', () => {
    const ids = qmRules.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers inspection lots, notifications, plans, results, certificates', () => {
    const categories = qmRules.map(r => r.category);
    expect(categories.some(c => c.includes('Inspection Lots'))).toBe(true);
    expect(categories.some(c => c.includes('Notifications'))).toBe(true);
    expect(categories.some(c => c.includes('Inspection Plans'))).toBe(true);
    expect(categories.some(c => c.includes('Results'))).toBe(true);
    expect(categories.some(c => c.includes('Certificates'))).toBe(true);
  });

  it('rules are registered in the global registry', () => {
    const qmRegistered = registry.getByModule('qm');
    expect(qmRegistered.length).toBe(20);
  });

  it('QALS pattern matches source code', () => {
    const rule = qmRules.find(r => r.id === 'SIMPL-QM-001');
    expect(rule.pattern.test('SELECT * FROM QALS WHERE PRUEFLOS = X.')).toBe(true);
  });

  it('PLKO pattern matches inspection plan references', () => {
    const rule = qmRules.find(r => r.id === 'SIMPL-QM-007');
    expect(rule.pattern.test('READ TABLE PLKO')).toBe(true);
    expect(rule.pattern.test('SELECT * FROM PLMK')).toBe(true);
  });

  it('has high severity for structural changes', () => {
    const highRules = qmRules.filter(r => r.severity === 'high');
    expect(highRules.length).toBeGreaterThanOrEqual(1);
  });
});
