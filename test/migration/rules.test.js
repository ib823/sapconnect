const {
  RULES,
  getAllRules,
  getRulesBySeverity,
  getRulesByCategory,
  checkSource,
  severityWeight,
} = require('../../migration/rules');

describe('Simplification Rules', () => {
  describe('RULES array', () => {
    it('should have 170+ rules', () => {
      expect(RULES.length).toBeGreaterThanOrEqual(170);
    });

    it('should have required fields on every rule', () => {
      for (const rule of RULES) {
        expect(rule.id).toBeTruthy();
        expect(rule.category).toBeTruthy();
        expect(['critical', 'high', 'medium', 'low']).toContain(rule.severity);
        expect(rule.title).toBeTruthy();
        expect(rule.description).toBeTruthy();
        expect(rule.pattern).toBeDefined();
        expect(['source', 'objectName']).toContain(rule.patternType);
        expect(rule.remediation).toBeTruthy();
      }
    });

    it('should have unique IDs', () => {
      const ids = RULES.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getAllRules()', () => {
    it('should return all rules', () => {
      expect(getAllRules()).toBe(RULES);
    });
  });

  describe('getRulesBySeverity()', () => {
    it('should filter by critical', () => {
      const critical = getRulesBySeverity('critical');
      expect(critical.length).toBeGreaterThan(0);
      expect(critical.every((r) => r.severity === 'critical')).toBe(true);
    });

    it('should return empty for unknown severity', () => {
      expect(getRulesBySeverity('unknown')).toEqual([]);
    });
  });

  describe('getRulesByCategory()', () => {
    it('should filter by partial category match', () => {
      const finance = getRulesByCategory('Finance');
      expect(finance.length).toBeGreaterThan(0);
      expect(finance.every((r) => r.category.toLowerCase().includes('finance'))).toBe(true);
    });
  });

  describe('severityWeight()', () => {
    it('should return correct weights', () => {
      expect(severityWeight('critical')).toBe(10);
      expect(severityWeight('high')).toBe(5);
      expect(severityWeight('medium')).toBe(2);
      expect(severityWeight('low')).toBe(1);
      expect(severityWeight('unknown')).toBe(0);
    });
  });

  describe('checkSource() - pattern matching', () => {
    it('should detect BSEG usage', () => {
      const source = 'SELECT * FROM BSEG WHERE bukrs = lv_bukrs.';
      const findings = checkSource(source, 'Z_TEST');
      const bseg = findings.find((f) => f.rule.id === 'SIMPL-FI-001');
      expect(bseg).toBeDefined();
      expect(bseg.matches.length).toBeGreaterThan(0);
    });

    it('should detect customer line item tables', () => {
      const source = 'SELECT * FROM BSID.\nSELECT * FROM BSIK.';
      const findings = checkSource(source, 'Z_TEST');
      const fin002 = findings.find((f) => f.rule.id === 'SIMPL-FI-002');
      expect(fin002).toBeDefined();
      expect(fin002.matches.length).toBe(2);
    });

    it('should detect GL line items', () => {
      const findings = checkSource('DATA lt_items TYPE TABLE OF BSIS.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-FI-003')).toBeDefined();
    });

    it('should detect cost element tables', () => {
      const findings = checkSource('SELECT * FROM CSKA WHERE ktopl = lv_ktopl.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-FI-027')).toBeDefined();
    });

    it('should detect asset tables', () => {
      const findings = checkSource('SELECT * FROM ANLP WHERE bukrs = lv_bukrs.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-FI-011')).toBeDefined();
    });

    it('should detect KNA1 usage', () => {
      const findings = checkSource('SELECT * FROM KNA1 WHERE kunnr = lv_kunnr.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-BP-001')).toBeDefined();
    });

    it('should detect LFA1 usage', () => {
      const findings = checkSource('SELECT * FROM LFA1 WHERE lifnr = lv_lifnr.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-BP-002')).toBeDefined();
    });

    it('should detect deprecated BAPIs', () => {
      const findings = checkSource("CALL FUNCTION 'BAPI_CUSTOMER_GETDETAIL2'.", 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-BP-003')).toBeDefined();
    });

    it('should detect MATNR length issue', () => {
      const findings = checkSource('DATA lv_matnr MATNR TYPE C LENGTH 18.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-MM-001')).toBeDefined();
    });

    it('should detect OCCURS', () => {
      const findings = checkSource('DATA lt_data OCCURS 0.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-ABAP-001')).toBeDefined();
    });

    it('should detect CALL TRANSACTION', () => {
      const findings = checkSource("CALL TRANSACTION 'VA01' USING lt_bdc MODE 'N'.", 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-ABAP-002')).toBeDefined();
    });

    it('should detect direct DB modifications', () => {
      const findings = checkSource('INSERT INTO BKPF VALUES ls_bkpf.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-ABAP-003')).toBeDefined();
    });

    it('should detect SELECT * on large tables', () => {
      const findings = checkSource('SELECT * FROM EKKO WHERE ebeln IN s_ebeln.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-ABAP-004')).toBeDefined();
    });

    it('should detect credit management', () => {
      const findings = checkSource('SELECT * FROM UKMBP_CMS.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-SD-004' || f.rule.id === 'SIMPL-REM-002')).toBeDefined();
    });

    it('should detect output management', () => {
      const findings = checkSource('SELECT * FROM NAST WHERE kappl = lv_kappl.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-SD-001' || f.rule.id === 'SIMPL-REM-003')).toBeDefined();
    });

    it('should detect WM tables', () => {
      const findings = checkSource('SELECT * FROM LAGP WHERE lgnum = lv_lgnum.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-REM-001')).toBeDefined();
    });

    it('should detect user exits', () => {
      const findings = checkSource('CALL CUSTOMER-FUNCTION 001.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-ENH-001')).toBeDefined();
    });

    it('should detect CO-PA tables', () => {
      const findings = checkSource('SELECT * FROM CE1OP01.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-CO-001' || f.rule.id === 'SIMPL-DM-008')).toBeDefined();
    });

    it('should detect ML tables', () => {
      const findings = checkSource('SELECT * FROM CKMLHD.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-CO-011' || f.rule.id === 'SIMPL-DM-009')).toBeDefined();
    });

    it('should detect object name pattern', () => {
      const findings = checkSource('', 'Y001_EXIT_HANDLER');
      const enh = findings.find((f) => f.rule.id === 'SIMPL-ENH-002');
      expect(enh).toBeDefined();
      expect(enh.matches[0].content).toContain('Y001_EXIT_HANDLER');
    });

    it('should return no findings for clean source', () => {
      const findings = checkSource('DATA lv_name TYPE string.\nWRITE lv_name.', 'Z_CLEAN');
      expect(findings).toEqual([]);
    });

    // New expanded rule tests
    it('should detect HR infotype tables', () => {
      const findings = checkSource('SELECT * FROM PA0001.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-HR-001')).toBeDefined();
    });

    it('should detect production order tables', () => {
      const findings = checkSource('SELECT * FROM AFKO.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-PP-001')).toBeDefined();
    });

    it('should detect maintenance order tables', () => {
      const findings = checkSource('SELECT * FROM AUFK.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-PM-001')).toBeDefined();
    });

    it('should detect HEADER LINE usage', () => {
      const findings = checkSource('DATA lt TYPE TABLE OF slis_alv WITH HEADER LINE.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-ABAP-005')).toBeDefined();
    });

    it('should detect Web Dynpro usage', () => {
      const findings = checkSource('DATA lo_wd TYPE REF TO CL_WD_COMPONENT.', 'Z_TEST');
      expect(findings.find((f) => f.rule.id === 'SIMPL-REM-009')).toBeDefined();
    });
  });
});
