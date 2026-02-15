/**
 * Tests for expanded auto-fix transforms (Phase 6A/6B).
 * Covers table renames, FM replacements, ABAP modernization, FI-specific transforms.
 */

const { getTransform, getAllTransforms, hasTransform, getTransformStats } = require('../../migration/transforms.js');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function applyTransform(id, source) {
  const t = getTransform(id);
  expect(t).toBeDefined();
  return t.apply(source, {});
}

// ─────────────────────────────────────────────────────────────────────────────
// getTransformStats
// ─────────────────────────────────────────────────────────────────────────────

describe('getTransformStats', () => {
  it('should return total and category breakdown', () => {
    const stats = getTransformStats();
    expect(stats.total).toBeGreaterThanOrEqual(90);
    expect(stats.byCategory).toBeDefined();
    expect(stats.byCategory['SIMPL-TBL']).toBeGreaterThanOrEqual(30);
    expect(stats.byCategory['SIMPL-FM']).toBeGreaterThanOrEqual(30);
    expect(stats.byCategory['SIMPL-ABAP']).toBeGreaterThanOrEqual(10);
    expect(stats.byCategory['SIMPL-FIN']).toBeGreaterThanOrEqual(7);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Table Rename Transforms (SIMPL-TBL-*)
// ─────────────────────────────────────────────────────────────────────────────

describe('Table Rename Transforms', () => {
  const tableCases = [
    ['SIMPL-TBL-KONV', 'KONV', 'PRCD_ELEMENTS'],
    ['SIMPL-TBL-KONH', 'KONH', 'PRCD_COND_HEAD'],
    ['SIMPL-TBL-KONP', 'KONP', 'PRCD_COND_ITEM'],
    ['SIMPL-TBL-VBFA', 'VBFA', 'I_SalesDocumentFlow'],
    ['SIMPL-TBL-FAGLFLEXT', 'FAGLFLEXT', 'ACDOCA'],
    ['SIMPL-TBL-FAGLFLEXP', 'FAGLFLEXP', 'ACDOCP'],
    ['SIMPL-TBL-GLT0', 'GLT0', 'ACDOCA'],
    ['SIMPL-TBL-COEP', 'COEP', 'ACDOCA'],
    ['SIMPL-TBL-REGUH', 'REGUH', 'I_PaymentDocument'],
    ['SIMPL-TBL-REGUP', 'REGUP', 'I_PaymentDocumentItem'],
    ['SIMPL-TBL-MLCD', 'MLCD', 'ACDOCA'],
    ['SIMPL-TBL-ANLP', 'ANLP', 'ANEK'],
  ];

  it.each(tableCases)('%s: replaces %s → %s in SELECT', (id, old, replacement) => {
    const source = `SELECT * FROM ${old} WHERE bukrs = '1000'.`;
    const result = applyTransform(id, source);
    expect(result.source).toContain(replacement);
    expect(result.source).not.toContain(old);
    expect(result.changes.length).toBeGreaterThan(0);
    expect(result.changes[0].type).toBe('replace');
  });

  it.each(tableCases)('%s: replaces %s in TYPE declarations', (id, old, replacement) => {
    const source = `DATA lt_data TYPE TABLE OF ${old}.`;
    const result = applyTransform(id, source);
    expect(result.source).toContain(replacement);
  });

  it('should handle case-insensitive matching', () => {
    const result = applyTransform('SIMPL-TBL-KONV', 'SELECT * FROM konv.');
    expect(result.source).toBe('SELECT * FROM PRCD_ELEMENTS.');
    expect(result.changes).toHaveLength(1);
  });

  it('should not modify source without matching table', () => {
    const source = 'SELECT * FROM mara WHERE matnr = lv_mat.';
    const result = applyTransform('SIMPL-TBL-KONV', source);
    expect(result.source).toBe(source);
    expect(result.changes).toHaveLength(0);
  });

  it('should replace all occurrences in multi-line source', () => {
    const source = [
      'SELECT * FROM konv INTO TABLE lt_konv.',
      'LOOP AT lt_konv INTO ls_konv.',
      '  " Access KONV data',
      'ENDLOOP.',
    ].join('\n');
    const result = applyTransform('SIMPL-TBL-KONV', source);
    expect(result.source).not.toMatch(/\bkonv\b/i);
    expect(result.changes.length).toBeGreaterThanOrEqual(2);
  });

  it('should have all expected table rename transforms registered', () => {
    const expectedTables = [
      'KONV', 'KONH', 'KONP', 'KONM', 'KONW', 'KOTE', 'VBFA',
      'FAGLFLEXT', 'FAGLFLEXP', 'FAGLBSIA', 'FAGLFLEXA', 'GLT0', 'GLT3',
      'COEP', 'COSP', 'COSS', 'COBK', 'REGUH', 'REGUP',
      'MLCD', 'MLCR', 'MLHD', 'MLIT', 'ANLP', 'ANLC',
      'CE1XXXX', 'CE2XXXX', 'CE3XXXX', 'CE4XXXX',
    ];
    for (const table of expectedTables) {
      expect(hasTransform(`SIMPL-TBL-${table}`)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FM Replacement Transforms (SIMPL-FM-*)
// ─────────────────────────────────────────────────────────────────────────────

describe('FM Replacement Transforms', () => {
  const fmCases = [
    ['BAPI_CUSTOMER_GETLIST', 'API_BUSINESS_PARTNER'],
    ['BAPI_VENDOR_GETLIST', 'API_BUSINESS_PARTNER'],
    ['BAPI_MATERIAL_GET_ALL', 'API_PRODUCT_SRV'],
    ['BAPI_ACC_GL_POSTING_POST', 'API_JOURNALENTRY_SRV'],
    ['BAPI_SALESORDER_CREATEFROMDAT2', 'API_SALES_ORDER_SRV'],
    ['BAPI_PO_CREATE1', 'API_PURCHASEORDER_PROCESS_SRV'],
    ['BAPI_GOODSMVT_CREATE', 'API_MATERIAL_DOCUMENT_SRV'],
    ['BAPI_PRODORD_CREATE', 'API_PRODUCTION_ORDER_2_SRV'],
    ['BAPI_INCOMINGINVOICE_CREATE', 'API_SUPPLIERINVOICE_PROCESS_SRV'],
    ['BAPI_COSTCENTER_GETLIST', 'API_COSTCENTER_SRV'],
    ['BAPI_PROFITCENTER_CREATE', 'API_PROFITCENTER_SRV'],
  ];

  it.each(fmCases)('flags %s for replacement with %s', (fm, api) => {
    const source = `  CALL FUNCTION '${fm}'\n    EXPORTING iv_param = lv_val.`;
    const ruleId = `SIMPL-FM-${fm.substring(0, 20)}`;
    const result = applyTransform(ruleId, source);
    expect(result.source).toContain(`TODO(S/4): Replace ${fm} with ${api}`);
    expect(result.changes.length).toBeGreaterThan(0);
    expect(result.changes[0].type).toBe('comment');
    expect(result.changes[0].to).toBe(api);
  });

  it('should not modify unrelated CALL FUNCTION', () => {
    const source = "  CALL FUNCTION 'Z_CUSTOM_FM'\n    EXPORTING iv_val = lv_val.";
    const ruleId = 'SIMPL-FM-BAPI_CUSTOMER_GETLIS';
    const result = applyTransform(ruleId, source);
    expect(result.source).toBe(source);
    expect(result.changes).toHaveLength(0);
  });

  it('should handle case-insensitive matching', () => {
    const source = "  call function 'BAPI_PO_CREATE1'\n    EXPORTING.";
    const result = applyTransform('SIMPL-FM-BAPI_PO_CREATE1', source);
    expect(result.source).toContain('TODO(S/4)');
  });

  it('should preserve original code after TODO comment', () => {
    const source = "  CALL FUNCTION 'BAPI_PO_CREATE1'\n    EXPORTING iv_doc = ls_doc.";
    const result = applyTransform('SIMPL-FM-BAPI_PO_CREATE1', source);
    expect(result.source).toContain("CALL FUNCTION 'BAPI_PO_CREATE1'");
    expect(result.source).toContain('TODO(S/4)');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ABAP Modernization Transforms
// ─────────────────────────────────────────────────────────────────────────────

describe('ABAP Modernization Transforms', () => {
  describe('SIMPL-ABAP-010: MOVE-CORRESPONDING → CORRESPONDING', () => {
    it('should replace simple MOVE-CORRESPONDING', () => {
      const source = 'MOVE-CORRESPONDING ls_source TO ls_target.';
      const result = applyTransform('SIMPL-ABAP-010', source);
      expect(result.source).toContain('ls_target = CORRESPONDING #( ls_source )');
      expect(result.changes).toHaveLength(1);
    });

    it('should handle multiple occurrences', () => {
      const source = [
        'MOVE-CORRESPONDING ls_a TO ls_b.',
        'MOVE-CORRESPONDING ls_c TO ls_d.',
      ].join('\n');
      const result = applyTransform('SIMPL-ABAP-010', source);
      expect(result.source).toContain('ls_b = CORRESPONDING #( ls_a )');
      expect(result.source).toContain('ls_d = CORRESPONDING #( ls_c )');
      expect(result.changes).toHaveLength(2);
    });

    it('should not modify source without MOVE-CORRESPONDING', () => {
      const source = 'ls_target = ls_source.';
      const result = applyTransform('SIMPL-ABAP-010', source);
      expect(result.source).toBe(source);
      expect(result.changes).toHaveLength(0);
    });
  });

  describe('SIMPL-ABAP-011: CREATE OBJECT → NEW', () => {
    it('should replace CREATE OBJECT TYPE', () => {
      const source = 'CREATE OBJECT lo_instance TYPE zcl_myclass.';
      const result = applyTransform('SIMPL-ABAP-011', source);
      expect(result.source).toContain('lo_instance = NEW zcl_myclass( )');
      expect(result.changes).toHaveLength(1);
    });

    it('should be case-insensitive', () => {
      const source = 'create object lo_obj type zcl_class.';
      const result = applyTransform('SIMPL-ABAP-011', source);
      expect(result.source).toContain('lo_obj = NEW zcl_class( )');
    });
  });

  describe('SIMPL-ABAP-012: CALL METHOD → functional', () => {
    it('should replace CALL METHOD with functional style', () => {
      const source = 'CALL METHOD lo_obj->process_data.';
      const result = applyTransform('SIMPL-ABAP-012', source);
      expect(result.source).toContain('lo_obj->process_data(');
      expect(result.changes).toHaveLength(1);
    });

    it('should handle multiple method calls', () => {
      const source = [
        'CALL METHOD lo_a->method_one.',
        'CALL METHOD lo_b->method_two.',
      ].join('\n');
      const result = applyTransform('SIMPL-ABAP-012', source);
      expect(result.source).toContain('lo_a->method_one(');
      expect(result.source).toContain('lo_b->method_two(');
      expect(result.changes).toHaveLength(2);
    });
  });

  describe('SIMPL-ABAP-013: READ TABLE flagging', () => {
    it('should add TODO comment for READ TABLE WITH KEY', () => {
      const source = '  READ TABLE lt_data WITH KEY matnr = lv_mat.';
      const result = applyTransform('SIMPL-ABAP-013', source);
      expect(result.source).toContain('TODO(S/4): Consider table expression syntax');
      expect(result.source).toContain('READ TABLE lt_data WITH KEY');
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].type).toBe('comment');
    });

    it('should not flag READ TABLE without WITH KEY', () => {
      const source = 'READ TABLE lt_data INDEX 1 INTO ls_data.';
      const result = applyTransform('SIMPL-ABAP-013', source);
      expect(result.source).not.toContain('TODO');
      expect(result.changes).toHaveLength(0);
    });
  });

  describe('SIMPL-ABAP-014: TRANSLATE → to_upper/to_lower', () => {
    it('should replace TRANSLATE TO UPPER CASE', () => {
      const source = 'TRANSLATE lv_text TO UPPER CASE.';
      const result = applyTransform('SIMPL-ABAP-014', source);
      expect(result.source).toContain('lv_text = to_upper( lv_text )');
      expect(result.changes).toHaveLength(1);
    });

    it('should replace TRANSLATE TO LOWER CASE', () => {
      const source = 'TRANSLATE lv_text TO LOWER CASE.';
      const result = applyTransform('SIMPL-ABAP-014', source);
      expect(result.source).toContain('lv_text = to_lower( lv_text )');
      expect(result.changes).toHaveLength(1);
    });

    it('should handle both upper and lower in same source', () => {
      const source = [
        'TRANSLATE lv_name TO UPPER CASE.',
        'TRANSLATE lv_desc TO LOWER CASE.',
      ].join('\n');
      const result = applyTransform('SIMPL-ABAP-014', source);
      expect(result.source).toContain('to_upper( lv_name )');
      expect(result.source).toContain('to_lower( lv_desc )');
      expect(result.changes).toHaveLength(2);
    });
  });

  describe('SIMPL-ABAP-005: WITH HEADER LINE removal', () => {
    it('should remove WITH HEADER LINE', () => {
      const source = 'DATA lt_data TYPE TABLE OF mara WITH HEADER LINE.';
      const result = applyTransform('SIMPL-ABAP-005', source);
      expect(result.source).not.toContain('HEADER LINE');
      expect(result.changes).toHaveLength(1);
    });
  });

  describe('SIMPL-ABAP-006: RANGES → TYPE RANGE OF', () => {
    it('should replace RANGES with TYPE RANGE OF', () => {
      const source = 'RANGES r_matnr FOR mara-matnr.';
      const result = applyTransform('SIMPL-ABAP-006', source);
      expect(result.source).toContain('DATA r_matnr TYPE RANGE OF mara');
      expect(result.changes).toHaveLength(1);
    });
  });

  describe('SIMPL-ABAP-015: TABLES declaration flagging', () => {
    it('should flag TABLES for removal', () => {
      const source = '  TABLES: mara.';
      const result = applyTransform('SIMPL-ABAP-015', source);
      expect(result.source).toContain('TODO(S/4): Replace TABLES');
      expect(result.source).toContain('TABLES: mara.');
      expect(result.changes).toHaveLength(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FI-Specific Transforms
// ─────────────────────────────────────────────────────────────────────────────

describe('FI-Specific Transforms', () => {
  describe('SIMPL-FIN-010: BSEG field references → ACDOCA', () => {
    const fieldCases = [
      ['BSEG-HKONT', 'ACDOCA-GLACCOUNT'],
      ['BSEG-WRBTR', 'ACDOCA-AMOUNTINTRANSACTIONCURRENCY'],
      ['BSEG-DMBTR', 'ACDOCA-AMOUNTINCOMPANYCODECURRENCY'],
      ['BSEG-SHKZG', 'ACDOCA-DEBITCREDITCODE'],
      ['BSEG-BELNR', 'ACDOCA-ACCOUNTINGDOCUMENT'],
      ['BSEG-GJAHR', 'ACDOCA-FISCALYEAR'],
      ['BSEG-BUKRS', 'ACDOCA-COMPANYCODE'],
      ['BSEG-LIFNR', 'ACDOCA-SUPPLIER'],
      ['BSEG-KUNNR', 'ACDOCA-CUSTOMER'],
      ['BSEG-KOSTL', 'ACDOCA-COSTCENTER'],
      ['BSEG-PRCTR', 'ACDOCA-PROFITCENTER'],
    ];

    it.each(fieldCases)('replaces %s → %s', (oldField, newField) => {
      const source = `lv_val = ls_bseg-${oldField.split('-')[1]}.`;
      // The transform replaces the full BSEG-FIELD pattern
      const fullSource = `MOVE ${oldField} TO lv_val.`;
      const result = applyTransform('SIMPL-FIN-010', fullSource);
      expect(result.source).toContain(newField);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should replace multiple BSEG fields in same source', () => {
      const source = [
        'lv_account = BSEG-HKONT.',
        'lv_amount  = BSEG-WRBTR.',
        'lv_company = BSEG-BUKRS.',
      ].join('\n');
      const result = applyTransform('SIMPL-FIN-010', source);
      expect(result.source).toContain('ACDOCA-GLACCOUNT');
      expect(result.source).toContain('ACDOCA-AMOUNTINTRANSACTIONCURRENCY');
      expect(result.source).toContain('ACDOCA-COMPANYCODE');
      expect(result.changes).toHaveLength(3);
    });

    it('should not modify non-BSEG fields', () => {
      const source = 'lv_val = EKKO-EBELN.';
      const result = applyTransform('SIMPL-FIN-010', source);
      expect(result.source).toBe(source);
      expect(result.changes).toHaveLength(0);
    });
  });

  describe('SIMPL-FIN-011: KNA1/LFA1 → BUT000/BUT020', () => {
    const cviCases = [
      ['KNA1-NAME1', 'BUT000-NAME_ORG1'],
      ['KNA1-ORT01', 'BUT020-CITY'],
      ['KNA1-PSTLZ', 'BUT020-POSTL_COD1'],
      ['KNA1-LAND1', 'BUT020-COUNTRY'],
      ['LFA1-NAME1', 'BUT000-NAME_ORG1'],
      ['LFA1-ORT01', 'BUT020-CITY'],
      ['LFA1-STRAS', 'BUT020-STREET'],
    ];

    it.each(cviCases)('replaces %s → %s', (oldField, newField) => {
      const source = `MOVE ${oldField} TO lv_val.`;
      const result = applyTransform('SIMPL-FIN-011', source);
      expect(result.source).toContain(newField);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should replace customer and vendor fields together', () => {
      const source = [
        'lv_cust_name = KNA1-NAME1.',
        'lv_vend_name = LFA1-NAME1.',
      ].join('\n');
      const result = applyTransform('SIMPL-FIN-011', source);
      expect(result.source).toMatch(/BUT000-NAME_ORG1.*BUT000-NAME_ORG1/s);
      expect(result.changes).toHaveLength(2);
    });
  });

  describe('SIMPL-FIN-012: Asset accounting field references', () => {
    const assetCases = [
      ['ANLP-NAFAZ', 'ANEK-NAFAZ'],
      ['ANLP-ANSWL', 'ANEK-ANSWL'],
      ['ANLC-KANSW', 'ANLA-KANSW'],
      ['ANLC-KNAFA', 'ANLA-KNAFA'],
    ];

    it.each(assetCases)('replaces %s → %s', (oldField, newField) => {
      const source = `MOVE ${oldField} TO lv_val.`;
      const result = applyTransform('SIMPL-FIN-012', source);
      expect(result.source).toContain(newField);
      expect(result.changes.length).toBeGreaterThan(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Original Transforms (regression)
// ─────────────────────────────────────────────────────────────────────────────

describe('Original Transforms (regression)', () => {
  it('SIMPL-FIN-001 still works', () => {
    expect(hasTransform('SIMPL-FIN-001')).toBe(true);
    const result = applyTransform('SIMPL-FIN-001', 'SELECT * FROM bseg WHERE bukrs = lv_buk.');
    expect(result.source).toContain('acdoca');
  });

  it('SIMPL-BP-001 still works', () => {
    expect(hasTransform('SIMPL-BP-001')).toBe(true);
  });

  it('SIMPL-ABAP-001 still works', () => {
    expect(hasTransform('SIMPL-ABAP-001')).toBe(true);
  });

  it('SIMPL-FUNC-001 still works', () => {
    expect(hasTransform('SIMPL-FUNC-001')).toBe(true);
  });

  it('getAllTransforms returns object with all transforms', () => {
    const all = getAllTransforms();
    expect(typeof all).toBe('object');
    expect(Object.keys(all).length).toBeGreaterThanOrEqual(90);
  });

  it('each transform has id, description, apply', () => {
    const all = getAllTransforms();
    for (const [key, t] of Object.entries(all)) {
      expect(t.id).toBe(key);
      expect(typeof t.description).toBe('string');
      expect(typeof t.apply).toBe('function');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// End-to-End: Multi-transform pipeline
// ─────────────────────────────────────────────────────────────────────────────

describe('Multi-transform pipeline', () => {
  it('should apply multiple transforms sequentially to remediate ABAP code', () => {
    let source = [
      'REPORT z_legacy_program.',
      '',
      'TABLES: mara.',
      'DATA lt_data TYPE TABLE OF konv WITH HEADER LINE.',
      '',
      'MOVE-CORRESPONDING ls_source TO ls_target.',
      'CREATE OBJECT lo_obj TYPE zcl_processor.',
      'CALL METHOD lo_obj->execute.',
      'TRANSLATE lv_name TO UPPER CASE.',
      '',
      "CALL FUNCTION 'BAPI_PO_CREATE1'",
      '  EXPORTING',
      '    iv_doc = ls_doc.',
      '',
      'lv_account = BSEG-HKONT.',
      'lv_vendor  = LFA1-NAME1.',
    ].join('\n');

    // Apply a chain of transforms
    const transforms = [
      'SIMPL-ABAP-015', // TABLES flagging
      'SIMPL-ABAP-005', // HEADER LINE removal
      'SIMPL-TBL-KONV', // KONV → PRCD_ELEMENTS
      'SIMPL-ABAP-010', // MOVE-CORRESPONDING
      'SIMPL-ABAP-011', // CREATE OBJECT → NEW
      'SIMPL-ABAP-012', // CALL METHOD → functional
      'SIMPL-ABAP-014', // TRANSLATE → to_upper
      'SIMPL-FM-BAPI_PO_CREATE1', // PO FM
      'SIMPL-FIN-010',  // BSEG fields
      'SIMPL-FIN-011',  // KNA1/LFA1 fields
    ];

    let totalChanges = 0;
    for (const id of transforms) {
      const result = applyTransform(id, source);
      source = result.source;
      totalChanges += result.changes.length;
    }

    // Verify all transforms applied
    expect(source).toContain('TODO(S/4): Replace TABLES');
    expect(source).not.toContain('HEADER LINE');
    expect(source).toContain('PRCD_ELEMENTS');
    expect(source).toContain('CORRESPONDING #( ls_source )');
    expect(source).toContain('NEW zcl_processor( )');
    expect(source).toContain('lo_obj->execute(');
    expect(source).toContain('to_upper( lv_name )');
    expect(source).toContain('TODO(S/4): Replace BAPI_PO_CREATE1');
    expect(source).toContain('ACDOCA-GLACCOUNT');
    expect(source).toContain('BUT000-NAME_ORG1');
    expect(totalChanges).toBeGreaterThanOrEqual(10);
  });
});
