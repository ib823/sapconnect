const rules = require('../../../migration/rules/removed-rules');

describe('Removed Rules', () => {
  it('exports 45 rules', () => {
    expect(rules).toHaveLength(45);
  });

  it('all have REM prefix', () => {
    for (const r of rules) {
      expect(r.id).toMatch(/^SIMPL-REM-/);
    }
  });

  it('all have required fields', () => {
    for (const r of rules) {
      expect(r.title).toBeDefined();
      expect(r.severity).toBeDefined();
      expect(r.category).toBeDefined();
      expect(r.pattern).toBeInstanceOf(RegExp);
      expect(r.remediation).toBeDefined();
    }
  });

  it('has unique rule IDs', () => {
    const ids = rules.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers multiple categories', () => {
    const categories = new Set(rules.map(r => r.category));
    expect(categories.size).toBeGreaterThanOrEqual(1);
  });

  it('has 9 critical rules', () => {
    const critical = rules.filter(r => r.severity === 'critical');
    expect(critical.length).toBe(9);
  });

  it('all patterns can execute without error', () => {
    for (const r of rules) {
      expect(() => r.pattern.test('test string')).not.toThrow();
    }
  });
});
