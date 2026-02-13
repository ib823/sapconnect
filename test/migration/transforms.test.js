const { getTransform, getAllTransforms, hasTransform } = require('../../migration/transforms');

describe('Code Transforms', () => {
  describe('registry', () => {
    it('should have transforms for known rules', () => {
      const transforms = getAllTransforms();
      expect(Object.keys(transforms).length).toBeGreaterThanOrEqual(13);
    });

    it('getTransform returns transform for known rule', () => {
      expect(getTransform('SIMPL-FIN-001')).toBeDefined();
    });

    it('getTransform returns null for unknown rule', () => {
      expect(getTransform('UNKNOWN-001')).toBeNull();
    });

    it('hasTransform returns boolean', () => {
      expect(hasTransform('SIMPL-FIN-001')).toBe(true);
      expect(hasTransform('UNKNOWN')).toBe(false);
    });
  });

  describe('SIMPL-FIN-001: BSEG -> ACDOCA', () => {
    it('should replace SELECT * FROM bseg', () => {
      const t = getTransform('SIMPL-FIN-001');
      const { source, changes } = t.apply('SELECT * FROM bseg WHERE bukrs = lv_bukrs.', {});
      expect(source).toContain('acdoca');
      expect(source).not.toMatch(/\bbseg\b/i);
      expect(changes.length).toBeGreaterThan(0);
    });

    it('should replace TYPE TABLE OF bseg', () => {
      const t = getTransform('SIMPL-FIN-001');
      const { source } = t.apply('DATA lt_items TYPE TABLE OF bseg.', {});
      expect(source).toContain('TYPE TABLE OF acdoca');
    });

    it('should replace TYPE bseg', () => {
      const t = getTransform('SIMPL-FIN-001');
      const { source } = t.apply('DATA ls_item TYPE bseg.', {});
      expect(source).toContain('TYPE acdoca');
    });
  });

  describe('SIMPL-FIN-002: BSID/BSIK/BSAD/BSAK -> ACDOCA', () => {
    it('should replace all customer/vendor line item tables', () => {
      const t = getTransform('SIMPL-FIN-002');
      const input = 'SELECT * FROM bsid.\nSELECT * FROM bsik.\nTYPE TABLE OF bsad.';
      const { source, changes } = t.apply(input, {});
      expect(source).not.toMatch(/\b(bsid|bsik|bsad)\b/i);
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  describe('SIMPL-FIN-003: BSIS/BSAS -> ACDOCA', () => {
    it('should replace GL line item tables', () => {
      const t = getTransform('SIMPL-FIN-003');
      const { source } = t.apply('SELECT * FROM bsis WHERE bukrs = lv_bukrs.', {});
      expect(source).toContain('acdoca');
    });
  });

  describe('SIMPL-FIN-004: CSKA/CSKB -> SKA1/SKB1', () => {
    it('should replace cost element tables', () => {
      const t = getTransform('SIMPL-FIN-004');
      const { source } = t.apply('SELECT * FROM CSKA. SELECT * FROM CSKB.', {});
      expect(source).toContain('SKA1');
      expect(source).toContain('SKB1');
    });
  });

  describe('SIMPL-BP-001: KNA1 -> BUT000', () => {
    it('should replace customer master tables', () => {
      const t = getTransform('SIMPL-BP-001');
      const { source } = t.apply('SELECT * FROM kna1. DATA lt TYPE TABLE OF knb1.', {});
      expect(source).toContain('but000');
      expect(source).toContain('but020');
    });
  });

  describe('SIMPL-BP-002: LFA1 -> BUT000', () => {
    it('should replace vendor master tables', () => {
      const t = getTransform('SIMPL-BP-002');
      const { source } = t.apply('SELECT * FROM lfa1. SELECT * FROM lfb1.', {});
      expect(source).toContain('but000');
      expect(source).toContain('but020');
    });
  });

  describe('SIMPL-BP-003: BAPIs -> OData comment', () => {
    it('should add TODO comment before deprecated BAPIs', () => {
      const t = getTransform('SIMPL-BP-003');
      const input = "  CALL FUNCTION 'BAPI_CUSTOMER_GETDETAIL2'";
      const { source, changes } = t.apply(input, {});
      expect(source).toContain('TODO(S/4)');
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  describe('SIMPL-ABAP-001: OCCURS -> TABLE OF', () => {
    it('should replace OCCURS with TABLE OF', () => {
      const t = getTransform('SIMPL-ABAP-001');
      const { source } = t.apply('DATA lt_data slis_alv OCCURS 0.', {});
      expect(source).toContain('TABLE OF');
      expect(source).not.toContain('OCCURS');
    });
  });

  describe('SIMPL-ABAP-002: BDC CALL TRANSACTION', () => {
    it('should add TODO comment for BDC', () => {
      const t = getTransform('SIMPL-ABAP-002');
      const input = "  CALL TRANSACTION 'VA01' USING lt_bdc MODE 'N'";
      const { source } = t.apply(input, {});
      expect(source).toContain('TODO(S/4)');
    });
  });

  describe('SIMPL-FUNC-001: Credit Management', () => {
    it('should flag UKMBP_CMS for FSCM migration', () => {
      const t = getTransform('SIMPL-FUNC-001');
      const { changes } = t.apply('SELECT * FROM UKMBP_CMS.', {});
      expect(changes.length).toBeGreaterThan(0);
      expect(changes[0].type).toBe('flag');
    });
  });

  describe('SIMPL-FUNC-002: NAST -> BRF+', () => {
    it('should flag output management tables', () => {
      const t = getTransform('SIMPL-FUNC-002');
      const { changes } = t.apply('SELECT * FROM NAST.', {});
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  describe('SIMPL-FUNC-003: WM -> EWM', () => {
    it('should flag WM tables', () => {
      const t = getTransform('SIMPL-FUNC-003');
      const { changes } = t.apply('SELECT * FROM LAGP.', {});
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  describe('SIMPL-MM-001: MATNR length', () => {
    it('should replace TYPE C LENGTH 18 with TYPE matnr', () => {
      const t = getTransform('SIMPL-MM-001');
      const { source } = t.apply('DATA lv_matnr TYPE C LENGTH 18.', {});
      expect(source).toContain('TYPE matnr');
    });
  });
});
