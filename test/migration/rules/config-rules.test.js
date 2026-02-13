const configRules = require('../../../migration/rules/config-rules');
const { registry } = require('../../../migration/rules/index');

describe('Config Rules', () => {
  it('exports 20 rules', () => {
    expect(configRules).toHaveLength(20);
  });

  it('all rules have required fields', () => {
    for (const rule of configRules) {
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

  it('all rule IDs start with SIMPL-CFG-', () => {
    for (const rule of configRules) {
      expect(rule.id).toMatch(/^SIMPL-CFG-\d{3}$/);
    }
  });

  it('has unique rule IDs', () => {
    const ids = configRules.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers IMG, BC Sets, Finance, Controlling, MM, SD, Number Ranges, Cross Module', () => {
    const categories = configRules.map(r => r.category);
    expect(categories.some(c => c.includes('IMG'))).toBe(true);
    expect(categories.some(c => c.includes('BC Sets'))).toBe(true);
    expect(categories.some(c => c.includes('Finance'))).toBe(true);
    expect(categories.some(c => c.includes('Controlling'))).toBe(true);
    expect(categories.some(c => c.includes('MM'))).toBe(true);
    expect(categories.some(c => c.includes('SD'))).toBe(true);
    expect(categories.some(c => c.includes('Number Ranges'))).toBe(true);
    expect(categories.some(c => c.includes('Cross Module'))).toBe(true);
  });

  it('rules are registered in the global registry', () => {
    const cfgRegistered = registry.getByModule('cfg');
    expect(cfgRegistered.length).toBe(20);
  });

  it('SPRO pattern matches IMG activity references', () => {
    const rule = configRules.find(r => r.id === 'SIMPL-CFG-001');
    expect(rule.pattern.test('CALL TRANSACTION SPRO')).toBe(true);
  });

  it('controlling area rule matches TKA01', () => {
    const rule = configRules.find(r => r.id === 'SIMPL-CFG-009');
    expect(rule.pattern.test('SELECT * FROM TKA01')).toBe(true);
  });

  it('has high severity for critical config changes', () => {
    const highRules = configRules.filter(r => r.severity === 'high');
    expect(highRules.length).toBeGreaterThanOrEqual(6);
  });
});
