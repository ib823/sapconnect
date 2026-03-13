const { getTransform, getAllTransforms, hasTransform, getAutoFixRate } = require('../../../migration/transforms');
const { getAllRules } = require('../../../migration/rules');

describe('Transform Coverage Integration', () => {
  it('should achieve >= 65% auto-fix rate', () => {
    const result = getAutoFixRate();
    expect(result.rate).toBeGreaterThanOrEqual(65);
  });

  it('every new transform ID should match a rule in registry', () => {
    const transforms = getAllTransforms();
    const ruleIds = new Set(getAllRules().map((r) => r.id));

    // These prefixes are auto-generated or use legacy naming conventions
    const exemptPrefixes = ['SIMPL-TBL-', 'SIMPL-FM-', 'SIMPL-FIN-', 'SIMPL-FUNC-'];

    for (const id of Object.keys(transforms)) {
      if (exemptPrefixes.some((p) => id.startsWith(p))) continue;
      expect(ruleIds.has(id)).toBe(true);
    }
  });

  it('all transforms should have valid apply() functions', () => {
    const transforms = getAllTransforms();
    for (const [id, t] of Object.entries(transforms)) {
      expect(typeof t.apply).toBe('function');
    }
  });

  it('transforms should be idempotent (apply twice gives same result)', () => {
    const testCases = [
      { id: 'SIMPL-FIN-001', source: 'SELECT * FROM bseg WHERE bukrs = lv_bukrs.' },
      { id: 'SIMPL-ABAP-001', source: 'DATA lt_data slis_alv OCCURS 0.' },
      { id: 'SIMPL-FI-001', source: 'SELECT * FROM BSEG WHERE bukrs = lv_bukrs.' },
      { id: 'SIMPL-CO-001', source: 'SELECT * FROM CE1XXXX.' },
      { id: 'SIMPL-SD-001', source: 'SELECT * FROM NAST.' },
    ];

    for (const { id, source } of testCases) {
      const t = getTransform(id);
      if (!t) continue;
      const result1 = t.apply(source, {});
      const result2 = t.apply(result1.source, {});
      expect(result2.source).toBe(result1.source);
    }
  });

  it('getAutoFixRate returns expected structure', () => {
    const result = getAutoFixRate();
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('covered');
    expect(result).toHaveProperty('rate');
    expect(result.total).toBe(874);
    expect(result.covered).toBeGreaterThanOrEqual(570);
  });
});
