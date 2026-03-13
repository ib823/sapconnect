const { RULE_TO_TRANSFORM, buildCrossReference, isInitialized, reset } = require('../../../migration/transforms/cross-reference');
const { getTransform, hasTransform } = require('../../../migration/transforms');

describe('Cross-Reference Module', () => {
  describe('buildCrossReference', () => {
    beforeEach(() => {
      reset();
    });

    it('should map rule with table name in pattern to TBL transform', () => {
      const rules = [
        { id: 'TEST-DM-001', pattern: /\bKONV\b/i },
      ];
      const tableRenames = { KONV: 'PRCD_ELEMENTS' };
      buildCrossReference(rules, tableRenames, {});
      expect(RULE_TO_TRANSFORM['TEST-DM-001']).toBe('SIMPL-TBL-KONV');
    });

    it('should map rule with FM name in pattern to FM transform', () => {
      const rules = [
        { id: 'TEST-FM-001', pattern: /\bBAPI_PO_CREATE1\b/i },
      ];
      buildCrossReference(rules, {}, { BAPI_PO_CREATE1: { replacement: 'BAPI_PO_CREATE2' } });
      expect(RULE_TO_TRANSFORM['TEST-FM-001']).toBe('SIMPL-FM-BAPI_PO_CREATE1');
    });

    it('should not overwrite existing mappings', () => {
      RULE_TO_TRANSFORM['TEST-001'] = 'EXISTING';
      const rules = [{ id: 'TEST-001', pattern: /\bKONV\b/i }];
      buildCrossReference(rules, { KONV: 'PRCD_ELEMENTS' }, {});
      expect(RULE_TO_TRANSFORM['TEST-001']).toBe('EXISTING');
    });

    it('should handle rules without regex pattern', () => {
      const rules = [{ id: 'TEST-002', pattern: 'KONV' }];
      buildCrossReference(rules, { KONV: 'PRCD_ELEMENTS' }, {});
      expect(RULE_TO_TRANSFORM['TEST-002']).toBe('SIMPL-TBL-KONV');
    });

    it('should set initialized flag', () => {
      expect(isInitialized()).toBe(false);
      buildCrossReference([], {}, {});
      expect(isInitialized()).toBe(true);
    });

    it('should prefer table match over FM match', () => {
      const rules = [{ id: 'TEST-003', pattern: /\bKONV\b.*BAPI_PO_CREATE1/i }];
      buildCrossReference(rules, { KONV: 'PRCD_ELEMENTS' }, { BAPI_PO_CREATE1: {} });
      expect(RULE_TO_TRANSFORM['TEST-003']).toBe('SIMPL-TBL-KONV');
    });
  });

  describe('reset', () => {
    it('should clear all mappings and reset initialized flag', () => {
      buildCrossReference(
        [{ id: 'TEST-R-001', pattern: /\bKONV\b/i }],
        { KONV: 'PRCD_ELEMENTS' },
        {}
      );
      expect(isInitialized()).toBe(true);
      expect(Object.keys(RULE_TO_TRANSFORM).length).toBeGreaterThan(0);

      reset();
      expect(isInitialized()).toBe(false);
      expect(Object.keys(RULE_TO_TRANSFORM).length).toBe(0);
    });
  });

  describe('integration with getTransform', () => {
    it('direct lookups still work (SIMPL-FIN-001)', () => {
      expect(getTransform('SIMPL-FIN-001')).toBeDefined();
      expect(getTransform('SIMPL-FIN-001').id).toBe('SIMPL-FIN-001');
    });

    it('hasTransform returns true for directly-registered transforms', () => {
      expect(hasTransform('SIMPL-FIN-001')).toBe(true);
    });

    it('hasTransform returns false for unknown rules', () => {
      expect(hasTransform('NONEXISTENT-999')).toBe(false);
    });

    it('ABAP ID remapping works (SIMPL-ABAP-020 returns CREATE OBJECT transform)', () => {
      const t = getTransform('SIMPL-ABAP-020');
      expect(t).toBeDefined();
      expect(t.description).toMatch(/CREATE OBJECT/i);
    });

    it('ABAP ID remapping works (SIMPL-ABAP-021 returns CALL METHOD transform)', () => {
      const t = getTransform('SIMPL-ABAP-021');
      expect(t).toBeDefined();
      expect(t.description).toMatch(/CALL METHOD/i);
    });
  });
});
