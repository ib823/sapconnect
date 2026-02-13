const interfaceRules = require('../../../migration/rules/interface-rules');
const { registry } = require('../../../migration/rules/index');

describe('Interface Rules', () => {
  it('exports 25 rules', () => {
    expect(interfaceRules).toHaveLength(25);
  });

  it('all rules have required fields', () => {
    for (const rule of interfaceRules) {
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

  it('all rule IDs start with SIMPL-INT-', () => {
    for (const rule of interfaceRules) {
      expect(rule.id).toMatch(/^SIMPL-INT-\d{3}$/);
    }
  });

  it('has unique rule IDs', () => {
    const ids = interfaceRules.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers RFC, IDoc, Web Services, CPI, EDI, File, Batch, Cloud categories', () => {
    const categories = interfaceRules.map(r => r.category);
    expect(categories.some(c => c.includes('RFC'))).toBe(true);
    expect(categories.some(c => c.includes('IDoc'))).toBe(true);
    expect(categories.some(c => c.includes('Web Services'))).toBe(true);
    expect(categories.some(c => c.includes('CPI'))).toBe(true);
    expect(categories.some(c => c.includes('EDI'))).toBe(true);
    expect(categories.some(c => c.includes('File'))).toBe(true);
    expect(categories.some(c => c.includes('Batch'))).toBe(true);
    expect(categories.some(c => c.includes('Cloud'))).toBe(true);
  });

  it('rules are registered in the global registry', () => {
    const intRegistered = registry.getByModule('int');
    expect(intRegistered.length).toBe(25);
  });

  it('PI/PO middleware rule matches SXMB_MONI', () => {
    const rule = interfaceRules.find(r => r.id === 'SIMPL-INT-014');
    expect(rule.pattern.test('CALL TRANSACTION SXMB_MONI')).toBe(true);
  });

  it('MATMAS IDoc rule matches MATMAS05', () => {
    const rule = interfaceRules.find(r => r.id === 'SIMPL-INT-007');
    expect(rule.pattern.test("IDOCTP = 'MATMAS05'")).toBe(true);
  });

  it('has high severity for critical integration changes', () => {
    const highRules = interfaceRules.filter(r => r.severity === 'high');
    expect(highRules.length).toBeGreaterThanOrEqual(5);
  });
});
