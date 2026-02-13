const bwRules = require('../../../migration/rules/bw-rules');

describe('BW Rules', () => {
  it('exports 8 rules', () => {
    expect(bwRules).toHaveLength(28);
  });

  it('all have SIMPL-BW prefix', () => {
    for (const r of bwRules) {
      expect(r.id).toMatch(/^SIMPL-BW-/);
    }
  });

  it('all have required fields', () => {
    for (const r of bwRules) {
      expect(r.title).toBeDefined();
      expect(r.severity).toBeDefined();
      expect(r.category).toBeDefined();
      expect(r.pattern).toBeInstanceOf(RegExp);
      expect(r.remediation).toBeDefined();
    }
  });

  it('detects FI extractors', () => {
    const rule = bwRules.find(r => r.id === 'SIMPL-BW-001');
    expect(rule.pattern.test('0FI_GL_14 datasource')).toBe(true);
    expect(rule.pattern.test('0FI_AR_4 delta')).toBe(true);
    expect(rule.pattern.test('FAGLFLEXT table')).toBe(true);
  });

  it('detects CO extractors', () => {
    const rule = bwRules.find(r => r.id === 'SIMPL-BW-002');
    expect(rule.pattern.test('0CO_OM_CCA_9')).toBe(true);
    expect(rule.pattern.test('COSS table')).toBe(true);
  });

  it('detects logistics extractors', () => {
    const rule = bwRules.find(r => r.id === 'SIMPL-BW-003');
    expect(rule.pattern.test('2LIS_02_ITM')).toBe(true);
    expect(rule.pattern.test('LBWE config')).toBe(true);
  });

  it('detects custom extractors', () => {
    const rule = bwRules.find(r => r.id === 'SIMPL-BW-007');
    expect(rule.pattern.test('RSA1 admin')).toBe(true);
  });

  it('has critical rules', () => {
    const critical = bwRules.filter(r => r.severity === 'critical');
    expect(critical.length).toBe(3);
    expect(critical.some(r => r.id === 'SIMPL-BW-001')).toBe(true);
  });

  it('covers extractors, embedded analytics, custom, and data model categories', () => {
    const categories = new Set(bwRules.map(r => r.category));
    expect(categories.size).toBeGreaterThanOrEqual(4);
  });
});
