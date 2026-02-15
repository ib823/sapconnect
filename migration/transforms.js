/**
 * Code Transform Functions for S/4HANA Custom Code Remediation
 *
 * Each transform is keyed by rule ID and accepts (source, finding) -> { source, changes[] }.
 * Pattern-based regex transforms that work without AI.
 */

const TRANSFORMS = {
  // ── Finance: BSEG -> ACDOCA ──────────────────────────────────────
  'SIMPL-FIN-001': {
    id: 'SIMPL-FIN-001',
    description: 'Replace BSEG access with ACDOCA / CDS views',
    apply(source, finding) {
      const changes = [];
      let result = source;

      // Replace SELECT * FROM bseg with ACDOCA CDS view
      result = result.replace(
        /SELECT\s+\*\s+FROM\s+bseg\b/gi,
        (match) => {
          changes.push({ type: 'replace', from: match, to: 'SELECT * FROM acdoca' });
          return 'SELECT * FROM acdoca';
        }
      );

      // Replace TYPE TABLE OF bseg
      result = result.replace(
        /TYPE\s+TABLE\s+OF\s+bseg\b/gi,
        (match) => {
          changes.push({ type: 'replace', from: match, to: 'TYPE TABLE OF acdoca' });
          return 'TYPE TABLE OF acdoca';
        }
      );

      // Replace TYPE bseg
      result = result.replace(
        /TYPE\s+bseg\b(?!\s+OCCURS)/gi,
        (match) => {
          changes.push({ type: 'replace', from: match, to: 'TYPE acdoca' });
          return 'TYPE acdoca';
        }
      );

      // Replace TABLES: bseg declarations
      result = result.replace(
        /\bTABLES:\s*(.*?)bseg\b/gi,
        (match, prefix) => {
          const replacement = `TABLES: ${prefix}acdoca`;
          changes.push({ type: 'replace', from: match, to: replacement });
          return replacement;
        }
      );

      return { source: result, changes };
    },
  },

  // ── Finance: BSID/BSIK/BSAD/BSAK -> ACDOCA ────────────────────
  'SIMPL-FIN-002': {
    id: 'SIMPL-FIN-002',
    description: 'Replace customer/vendor line item tables with ACDOCA',
    apply(source, finding) {
      const changes = [];
      let result = source;
      const mapping = {
        bsid: { table: 'acdoca', comment: '\" S/4: was BSID (customer open items)' },
        bsik: { table: 'acdoca', comment: '\" S/4: was BSIK (vendor open items)' },
        bsad: { table: 'acdoca', comment: '\" S/4: was BSAD (customer cleared items)' },
        bsak: { table: 'acdoca', comment: '\" S/4: was BSAK (vendor cleared items)' },
      };

      for (const [old, { table }] of Object.entries(mapping)) {
        const pattern = new RegExp(`\\bSELECT\\s+(.*?)\\s+FROM\\s+${old}\\b`, 'gi');
        result = result.replace(pattern, (match, fields) => {
          const replacement = `SELECT ${fields} FROM ${table}`;
          changes.push({ type: 'replace', from: match, to: replacement });
          return replacement;
        });

        const typePattern = new RegExp(`TYPE\\s+TABLE\\s+OF\\s+${old}\\b`, 'gi');
        result = result.replace(typePattern, (match) => {
          const replacement = `TYPE TABLE OF ${table}`;
          changes.push({ type: 'replace', from: match, to: replacement });
          return replacement;
        });
      }

      return { source: result, changes };
    },
  },

  // ── Finance: BSIS/BSAS -> ACDOCA ────────────────────────────────
  'SIMPL-FIN-003': {
    id: 'SIMPL-FIN-003',
    description: 'Replace GL line item tables with ACDOCA',
    apply(source, finding) {
      const changes = [];
      let result = source;

      for (const old of ['bsis', 'bsas']) {
        const pattern = new RegExp(`\\b${old}\\b`, 'gi');
        result = result.replace(pattern, (match) => {
          changes.push({ type: 'replace', from: match, to: 'acdoca' });
          return 'acdoca';
        });
      }

      return { source: result, changes };
    },
  },

  // ── Finance: CSKA/CSKB -> SKA1 ──────────────────────────────────
  'SIMPL-FIN-004': {
    id: 'SIMPL-FIN-004',
    description: 'Replace cost element tables with GL account master',
    apply(source, finding) {
      const changes = [];
      let result = source;

      result = result.replace(/\bCSKA\b/gi, (match) => {
        changes.push({ type: 'replace', from: match, to: 'SKA1' });
        return 'SKA1';
      });
      result = result.replace(/\bCSKB\b/gi, (match) => {
        changes.push({ type: 'replace', from: match, to: 'SKB1' });
        return 'SKB1';
      });

      return { source: result, changes };
    },
  },

  // ── Business Partner: KNA1 -> BUT000 ─────────────────────────────
  'SIMPL-BP-001': {
    id: 'SIMPL-BP-001',
    description: 'Replace customer master tables with Business Partner',
    apply(source, finding) {
      const changes = [];
      let result = source;
      const mapping = { kna1: 'but000', knb1: 'but020', knvv: 'but050' };

      for (const [old, replacement] of Object.entries(mapping)) {
        const pattern = new RegExp(`\\b${old}\\b`, 'gi');
        result = result.replace(pattern, (match) => {
          changes.push({ type: 'replace', from: match, to: replacement });
          return replacement;
        });
      }

      return { source: result, changes };
    },
  },

  // ── Business Partner: LFA1 -> BUT000 ─────────────────────────────
  'SIMPL-BP-002': {
    id: 'SIMPL-BP-002',
    description: 'Replace vendor master tables with Business Partner',
    apply(source, finding) {
      const changes = [];
      let result = source;
      const mapping = { lfa1: 'but000', lfb1: 'but020', lfbk: 'but100' };

      for (const [old, replacement] of Object.entries(mapping)) {
        const pattern = new RegExp(`\\b${old}\\b`, 'gi');
        result = result.replace(pattern, (match) => {
          changes.push({ type: 'replace', from: match, to: replacement });
          return replacement;
        });
      }

      return { source: result, changes };
    },
  },

  // ── Business Partner BAPIs -> OData ───────────────────────────────
  'SIMPL-BP-003': {
    id: 'SIMPL-BP-003',
    description: 'Flag deprecated customer/vendor BAPIs for manual review',
    apply(source, finding) {
      const changes = [];
      let result = source;

      // Add comment before BAPI calls — these need manual review
      result = result.replace(
        /(\s*)(CALL FUNCTION\s+'(BAPI_CUSTOMER_|BAPI_VENDOR_)\w+')/gi,
        (match, ws, call) => {
          const comment = `${ws}\" TODO(S/4): Replace with API_BUSINESS_PARTNER OData service\n`;
          changes.push({ type: 'comment', before: call, note: 'Needs manual migration to OData' });
          return `${comment}${ws}${call}`;
        }
      );

      return { source: result, changes };
    },
  },

  // ── ABAP: OCCURS -> TABLE OF ──────────────────────────────────────
  'SIMPL-ABAP-001': {
    id: 'SIMPL-ABAP-001',
    description: 'Replace OCCURS with TYPE TABLE OF',
    apply(source, finding) {
      const changes = [];
      let result = source;

      result = result.replace(
        /(\w+)\s+OCCURS\s+\d+/gi,
        (match, typeName) => {
          const replacement = `TABLE OF ${typeName}`;
          changes.push({ type: 'replace', from: match, to: replacement });
          return replacement;
        }
      );

      return { source: result, changes };
    },
  },

  // ── ABAP: BDC / CALL TRANSACTION -> BAPI ──────────────────────────
  'SIMPL-ABAP-002': {
    id: 'SIMPL-ABAP-002',
    description: 'Flag BDC CALL TRANSACTION for manual BAPI replacement',
    apply(source, finding) {
      const changes = [];
      let result = source;

      result = result.replace(
        /(\s*)(CALL TRANSACTION\s+'(\w+)'\s+USING\s+\w+\s+MODE\s+'[A-Z]')/gi,
        (match, ws, call, tcode) => {
          const comment = `${ws}\" TODO(S/4): Replace CALL TRANSACTION '${tcode}' with BAPI/API\n`;
          changes.push({ type: 'comment', tcode, note: 'BDC needs BAPI replacement' });
          return `${comment}${ws}${call}`;
        }
      );

      return { source: result, changes };
    },
  },

  // ── Removed: NAST -> BRF+ ────────────────────────────────────────
  'SIMPL-FUNC-002': {
    id: 'SIMPL-FUNC-002',
    description: 'Flag NAST-based output management for BRF+ migration',
    apply(source, finding) {
      const changes = [];
      let result = source;

      for (const table of ['nast', 'tnapr', 'nach']) {
        const pattern = new RegExp(`\\b${table}\\b`, 'gi');
        result = result.replace(pattern, (match) => {
          changes.push({ type: 'flag', table: match, note: 'Migrate to BRF+ output management' });
          return match; // Don't auto-replace, just flag
        });
      }

      return { source: result, changes };
    },
  },

  // ── Removed: WM -> EWM (LAGP/LQUA) ───────────────────────────────
  'SIMPL-FUNC-003': {
    id: 'SIMPL-FUNC-003',
    description: 'Flag WM tables for EWM migration',
    apply(source, finding) {
      const changes = [];
      let result = source;

      for (const table of ['lagp', 'lqua', 'ltap', 'ltbp']) {
        const pattern = new RegExp(`\\b${table}\\b`, 'gi');
        result = result.replace(pattern, (match) => {
          changes.push({ type: 'flag', table: match, note: 'Migrate to EWM tables/APIs' });
          return match;
        });
      }

      // Flag L_TO_CREATE function modules
      result = result.replace(
        /(\s*)(CALL FUNCTION\s+'L_TO_CREATE\w*')/gi,
        (match, ws, call) => {
          const comment = `${ws}\" TODO(S/4): Replace WM function module with EWM API\n`;
          changes.push({ type: 'comment', note: 'WM FM needs EWM replacement' });
          return `${comment}${ws}${call}`;
        }
      );

      return { source: result, changes };
    },
  },

  // ── Removed: Credit Management (UKMBP_CMS -> FSCM) ───────────────
  'SIMPL-FUNC-001': {
    id: 'SIMPL-FUNC-001',
    description: 'Flag classic credit management for FSCM migration',
    apply(source, finding) {
      const changes = [];
      let result = source;

      result = result.replace(/\bUKMBP_CMS\b/gi, (match) => {
        changes.push({ type: 'flag', table: match, note: 'Migrate to FSCM credit management' });
        return match;
      });

      return { source: result, changes };
    },
  },

  // ── Material: MATNR length ────────────────────────────────────────
  'SIMPL-MM-001': {
    id: 'SIMPL-MM-001',
    description: 'Replace hardcoded MATNR length 18 with TYPE matnr',
    apply(source, finding) {
      const changes = [];
      let result = source;

      result = result.replace(
        /TYPE\s+C\s+LENGTH\s+18/gi,
        (match) => {
          changes.push({ type: 'replace', from: match, to: 'TYPE matnr' });
          return 'TYPE matnr';
        }
      );

      return { source: result, changes };
    },
  },
};

/**
 * Get transform for a given rule ID
 * @param {string} ruleId
 * @returns {object|null} Transform object with .apply(source, finding)
 */
function getTransform(ruleId) {
  return TRANSFORMS[ruleId] || null;
}

/**
 * Get all available transforms
 * @returns {object}
 */
function getAllTransforms() {
  return TRANSFORMS;
}

/**
 * Check if a rule has an auto-transform
 * @param {string} ruleId
 * @returns {boolean}
 */
function hasTransform(ruleId) {
  return ruleId in TRANSFORMS;
}

// ── New transforms for expanded rules ────────────────────────────

// ABAP: HEADER LINE removal
TRANSFORMS['SIMPL-ABAP-005'] = {
  id: 'SIMPL-ABAP-005',
  description: 'Remove WITH HEADER LINE from declarations',
  apply(source, finding) {
    const changes = [];
    let result = source;
    result = result.replace(/\s+WITH\s+HEADER\s+LINE/gi, (match) => {
      changes.push({ type: 'replace', from: match.trim(), to: '(removed HEADER LINE)' });
      return '';
    });
    return { source: result, changes };
  },
};

// ABAP: RANGES → TYPE RANGE OF
TRANSFORMS['SIMPL-ABAP-006'] = {
  id: 'SIMPL-ABAP-006',
  description: 'Replace RANGES with TYPE RANGE OF',
  apply(source, finding) {
    const changes = [];
    let result = source;
    result = result.replace(
      /RANGES\s+(\w+)\s+FOR\s+(\w+)/gi,
      (match, name, field) => {
        const replacement = `DATA ${name} TYPE RANGE OF ${field}`;
        changes.push({ type: 'replace', from: match, to: replacement });
        return replacement;
      }
    );
    return { source: result, changes };
  },
};

// ABAP: SELECT * → explicit columns (flag only — columns are context-dependent)
TRANSFORMS['SIMPL-ABAP-004'] = {
  id: 'SIMPL-ABAP-004',
  description: 'Flag SELECT * for manual column specification',
  apply(source, finding) {
    const changes = [];
    let result = source;
    result = result.replace(
      /(\s*)(SELECT\s+\*\s+FROM\s+(BKPF|EKKO|EKPO|VBAK|VBAP|MARA|MARC|MARD)\b)/gi,
      (match, ws, stmt, table) => {
        const comment = `${ws}" TODO(S/4): Replace SELECT * with explicit columns for ${table}\n`;
        changes.push({ type: 'comment', note: `Specify columns for ${table}` });
        return `${comment}${ws}${stmt}`;
      }
    );
    return { source: result, changes };
  },
};

// ABAP: TABLES declaration → comment
TRANSFORMS['SIMPL-ABAP-015'] = {
  id: 'SIMPL-ABAP-015',
  description: 'Flag TABLES declarations for removal',
  apply(source, finding) {
    const changes = [];
    let result = source;
    result = result.replace(
      /^(\s*)(TABLES:\s+\w+.*)/gim,
      (match, ws, stmt) => {
        changes.push({ type: 'comment', note: 'Remove TABLES declaration' });
        return `${ws}" TODO(S/4): Replace TABLES with typed DATA declarations\n${ws}${stmt}`;
      }
    );
    return { source: result, changes };
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// Phase 6A: High-Volume Mechanical Transforms
// ══════════════════════════════════════════════════════════════════════════════

// ── Table Renames (data-model-rules.js) ─────────────────────────────────────

const TABLE_RENAMES = {
  // SD / Pricing
  KONV: 'PRCD_ELEMENTS',
  KONH: 'PRCD_COND_HEAD',
  KONP: 'PRCD_COND_ITEM',
  KONM: 'PRCD_COND_SCALE',
  KONW: 'PRCD_COND_SUPPL',
  KOTE: 'PRCD_COND_TABLE',
  // SD / Sales Document Flow
  VBFA: 'I_SalesDocumentFlow',
  // MM / Purchasing
  EINA: 'EINA',
  EINE: 'EINE',
  // Asset Accounting
  ANLP: 'ANEK',
  ANLC: 'ANLA',
  ANLA_ADDON: 'ANLA',
  ANEP: 'ANEK',
  // New GL
  FAGLFLEXT: 'ACDOCA',
  FAGLFLEXP: 'ACDOCP',
  FAGLBSIA: 'ACDOCA',
  FAGLFLEXA: 'ACDOCA',
  GLT0: 'ACDOCA',
  GLT3: 'ACDOCA',
  // Profitability Analysis
  CE1XXXX: 'ACDOCA',
  CE2XXXX: 'ACDOCA',
  CE3XXXX: 'ACDOCA',
  CE4XXXX: 'ACDOCA',
  // Material Ledger
  MLCD: 'ACDOCA',
  MLCR: 'ACDOCA',
  MLHD: 'ACDOCA',
  MLIT: 'ACDOCA',
  // CO-PA
  COEP: 'ACDOCA',
  COSP: 'ACDOCA',
  COSS: 'ACDOCA',
  COBK: 'ACDOCA',
  // Banking
  REGUH: 'I_PaymentDocument',
  REGUP: 'I_PaymentDocumentItem',
};

for (const [oldTable, newTable] of Object.entries(TABLE_RENAMES)) {
  const ruleId = `SIMPL-TBL-${oldTable}`;
  if (!TRANSFORMS[ruleId]) {
    TRANSFORMS[ruleId] = {
      id: ruleId,
      description: `Replace ${oldTable} with ${newTable}`,
      apply(source) {
        const changes = [];
        let result = source;
        const pattern = new RegExp(`\\b${oldTable}\\b`, 'gi');
        result = result.replace(pattern, (match) => {
          changes.push({ type: 'replace', from: match, to: newTable });
          return newTable;
        });
        return { source: result, changes };
      },
    };
  }
}

// ── Removed / Deprecated Function Module Replacements ───────────────────────

const FM_REPLACEMENTS = {
  // Customer/Vendor
  CUSTOMER_ADDDATA_READ: 'CVI_EI_INBOUND_MAIN',
  CUSTOMER_GET_DATA: 'API_BUSINESS_PARTNER',
  VENDOR_GET_DATA: 'API_BUSINESS_PARTNER',
  BAPI_CUSTOMER_GETLIST: 'API_BUSINESS_PARTNER',
  BAPI_VENDOR_GETLIST: 'API_BUSINESS_PARTNER',
  SD_CUSTOMER_MAINTAIN_ALL: 'API_BUSINESS_PARTNER',
  // Material
  BAPI_MATERIAL_GET_ALL: 'API_PRODUCT_SRV',
  BAPI_MATERIAL_SAVEDATA: 'API_PRODUCT_SRV',
  MATERIAL_MAINTAIN_DARK: 'API_PRODUCT_SRV',
  // Finance
  BAPI_ACC_GL_POSTING_POST: 'API_JOURNALENTRY_SRV',
  BAPI_ACC_DOCUMENT_POST: 'API_JOURNALENTRY_SRV',
  BAPI_ACC_GL_POSTING_CHECK: 'API_JOURNALENTRY_SRV',
  POSTING_INTERFACE_DOCUMENT: 'API_JOURNALENTRY_SRV',
  PRELIMINARY_POSTING_POST: 'API_JOURNALENTRY_SRV',
  AC_DOCUMENT_CREATE: 'API_JOURNALENTRY_SRV',
  // Sales
  BAPI_SALESORDER_CREATEFROMDAT2: 'API_SALES_ORDER_SRV',
  BAPI_SALESORDER_CHANGE: 'API_SALES_ORDER_SRV',
  BAPI_SALESORDER_GETLIST: 'API_SALES_ORDER_SRV',
  SD_SALESDOCUMENT_CREATE: 'API_SALES_ORDER_SRV',
  // Purchase Order
  BAPI_PO_CREATE1: 'API_PURCHASEORDER_PROCESS_SRV',
  BAPI_PO_CHANGE: 'API_PURCHASEORDER_PROCESS_SRV',
  BAPI_PO_GETDETAIL: 'API_PURCHASEORDER_PROCESS_SRV',
  BAPI_PO_GETITEMS: 'API_PURCHASEORDER_PROCESS_SRV',
  // Production
  BAPI_PRODORD_CREATE: 'API_PRODUCTION_ORDER_2_SRV',
  BAPI_PRODORD_CLOSE: 'API_PRODUCTION_ORDER_2_SRV',
  CO_XT_ORDER_CREATE: 'API_PRODUCTION_ORDER_2_SRV',
  // Goods Movement
  BAPI_GOODSMVT_CREATE: 'API_MATERIAL_DOCUMENT_SRV',
  BAPI_GOODSMVT_CANCEL: 'API_MATERIAL_DOCUMENT_SRV',
  MB_CREATE_GOODS_MOVEMENT: 'API_MATERIAL_DOCUMENT_SRV',
  // Invoice
  BAPI_INCOMINGINVOICE_CREATE: 'API_SUPPLIERINVOICE_PROCESS_SRV',
  MRM_INVOICE_CREATE: 'API_SUPPLIERINVOICE_PROCESS_SRV',
  // Billing
  BAPI_BILLINGDOC_CREATEMULTIPLE: 'API_BILLING_DOCUMENT_SRV',
  // Cost Center
  BAPI_COSTCENTER_CREATEMULTIPLE: 'API_COSTCENTER_SRV',
  BAPI_COSTCENTER_GETLIST: 'API_COSTCENTER_SRV',
  // Profit Center
  BAPI_PROFITCENTER_CREATE: 'API_PROFITCENTER_SRV',
  BAPI_PROFITCENTER_GETLIST: 'API_PROFITCENTER_SRV',
};

for (const [oldFM, newApi] of Object.entries(FM_REPLACEMENTS)) {
  const ruleId = `SIMPL-FM-${oldFM.substring(0, 20)}`;
  if (!TRANSFORMS[ruleId]) {
    TRANSFORMS[ruleId] = {
      id: ruleId,
      description: `Flag ${oldFM} for replacement with ${newApi}`,
      apply(source) {
        const changes = [];
        let result = source;
        const pattern = new RegExp(`(\\s*)(CALL FUNCTION\\s+'${oldFM}')`, 'gi');
        result = result.replace(pattern, (match, ws, call) => {
          const comment = `${ws}" TODO(S/4): Replace ${oldFM} with ${newApi}\n`;
          changes.push({ type: 'comment', from: oldFM, to: newApi });
          return `${comment}${ws}${call}`;
        });
        return { source: result, changes };
      },
    };
  }
}

// ── ABAP Syntax Modernization ───────────────────────────────────────────────

// MOVE-CORRESPONDING → CORRESPONDING operator
TRANSFORMS['SIMPL-ABAP-010'] = {
  id: 'SIMPL-ABAP-010',
  description: 'Replace MOVE-CORRESPONDING with inline CORRESPONDING',
  apply(source) {
    const changes = [];
    let result = source;
    result = result.replace(
      /MOVE-CORRESPONDING\s+(\w+)\s+TO\s+(\w+)/gi,
      (match, from, to) => {
        const replacement = `${to} = CORRESPONDING #( ${from} )`;
        changes.push({ type: 'replace', from: match, to: replacement });
        return replacement;
      }
    );
    return { source: result, changes };
  },
};

// CREATE OBJECT → NEW
TRANSFORMS['SIMPL-ABAP-011'] = {
  id: 'SIMPL-ABAP-011',
  description: 'Replace CREATE OBJECT with NEW operator',
  apply(source) {
    const changes = [];
    let result = source;
    result = result.replace(
      /CREATE\s+OBJECT\s+(\w+)\s+TYPE\s+(\w+)/gi,
      (match, var_, type) => {
        const replacement = `${var_} = NEW ${type}( )`;
        changes.push({ type: 'replace', from: match, to: replacement });
        return replacement;
      }
    );
    return { source: result, changes };
  },
};

// CALL METHOD → functional style
TRANSFORMS['SIMPL-ABAP-012'] = {
  id: 'SIMPL-ABAP-012',
  description: 'Replace CALL METHOD with functional call style',
  apply(source) {
    const changes = [];
    let result = source;
    result = result.replace(
      /CALL\s+METHOD\s+(\w+)->(\w+)/gi,
      (match, obj, method) => {
        const replacement = `${obj}->${method}(`;
        changes.push({ type: 'replace', from: match, to: `${obj}->${method}( )` });
        return replacement;
      }
    );
    return { source: result, changes };
  },
};

// READ TABLE ... WITH KEY → line_exists / table expression
TRANSFORMS['SIMPL-ABAP-013'] = {
  id: 'SIMPL-ABAP-013',
  description: 'Flag READ TABLE for table expression conversion',
  apply(source) {
    const changes = [];
    let result = source;
    result = result.replace(
      /(\s*)(READ\s+TABLE\s+\w+\s+WITH\s+KEY\b)/gi,
      (match, ws, stmt) => {
        changes.push({ type: 'comment', note: 'Consider table expression or VALUE' });
        return `${ws}" TODO(S/4): Consider table expression syntax\n${ws}${stmt}`;
      }
    );
    return { source: result, changes };
  },
};

// TRANSLATE → to_upper/to_lower
TRANSFORMS['SIMPL-ABAP-014'] = {
  id: 'SIMPL-ABAP-014',
  description: 'Replace TRANSLATE with to_upper/to_lower',
  apply(source) {
    const changes = [];
    let result = source;
    result = result.replace(
      /TRANSLATE\s+(\w+)\s+TO\s+UPPER\s+CASE/gi,
      (match, var_) => {
        const replacement = `${var_} = to_upper( ${var_} )`;
        changes.push({ type: 'replace', from: match, to: replacement });
        return replacement;
      }
    );
    result = result.replace(
      /TRANSLATE\s+(\w+)\s+TO\s+LOWER\s+CASE/gi,
      (match, var_) => {
        const replacement = `${var_} = to_lower( ${var_} )`;
        changes.push({ type: 'replace', from: match, to: replacement });
        return replacement;
      }
    );
    return { source: result, changes };
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// Phase 6B: FI-Specific Transforms
// ══════════════════════════════════════════════════════════════════════════════

// BSEG field-level references
TRANSFORMS['SIMPL-FIN-010'] = {
  id: 'SIMPL-FIN-010',
  description: 'Replace BSEG field references with ACDOCA equivalents',
  apply(source) {
    const changes = [];
    let result = source;
    const fieldMap = {
      'BSEG-HKONT': 'ACDOCA-GLACCOUNT',
      'BSEG-WRBTR': 'ACDOCA-AMOUNTINTRANSACTIONCURRENCY',
      'BSEG-DMBTR': 'ACDOCA-AMOUNTINCOMPANYCODECURRENCY',
      'BSEG-SHKZG': 'ACDOCA-DEBITCREDITCODE',
      'BSEG-ZUONR': 'ACDOCA-ASSIGNMENTREFERENCE',
      'BSEG-SGTXT': 'ACDOCA-DOCUMENTITEMTEXT',
      'BSEG-BELNR': 'ACDOCA-ACCOUNTINGDOCUMENT',
      'BSEG-GJAHR': 'ACDOCA-FISCALYEAR',
      'BSEG-BUKRS': 'ACDOCA-COMPANYCODE',
      'BSEG-BUZEI': 'ACDOCA-ACCOUNTINGDOCUMENTITEM',
      'BSEG-LIFNR': 'ACDOCA-SUPPLIER',
      'BSEG-KUNNR': 'ACDOCA-CUSTOMER',
      'BSEG-KOSTL': 'ACDOCA-COSTCENTER',
      'BSEG-PRCTR': 'ACDOCA-PROFITCENTER',
    };
    for (const [oldRef, newRef] of Object.entries(fieldMap)) {
      const pattern = new RegExp(oldRef.replace('-', '\\-'), 'gi');
      result = result.replace(pattern, (match) => {
        changes.push({ type: 'replace', from: match, to: newRef });
        return newRef;
      });
    }
    return { source: result, changes };
  },
};

// CVI Customer-Vendor Integration field mappings
TRANSFORMS['SIMPL-FIN-011'] = {
  id: 'SIMPL-FIN-011',
  description: 'Replace KNA1/LFA1 field references with BUT000 equivalents',
  apply(source) {
    const changes = [];
    let result = source;
    const fieldMap = {
      'KNA1-NAME1': 'BUT000-NAME_ORG1',
      'KNA1-NAME2': 'BUT000-NAME_ORG2',
      'KNA1-ORT01': 'BUT020-CITY',
      'KNA1-PSTLZ': 'BUT020-POSTL_COD1',
      'KNA1-LAND1': 'BUT020-COUNTRY',
      'KNA1-STRAS': 'BUT020-STREET',
      'LFA1-NAME1': 'BUT000-NAME_ORG1',
      'LFA1-NAME2': 'BUT000-NAME_ORG2',
      'LFA1-ORT01': 'BUT020-CITY',
      'LFA1-PSTLZ': 'BUT020-POSTL_COD1',
      'LFA1-LAND1': 'BUT020-COUNTRY',
      'LFA1-STRAS': 'BUT020-STREET',
    };
    for (const [oldRef, newRef] of Object.entries(fieldMap)) {
      const pattern = new RegExp(oldRef.replace('-', '\\-'), 'gi');
      result = result.replace(pattern, (match) => {
        changes.push({ type: 'replace', from: match, to: newRef });
        return newRef;
      });
    }
    return { source: result, changes };
  },
};

// Asset accounting field references
TRANSFORMS['SIMPL-FIN-012'] = {
  id: 'SIMPL-FIN-012',
  description: 'Replace ANLP/ANLC field references with new asset accounting',
  apply(source) {
    const changes = [];
    let result = source;
    const fieldMap = {
      'ANLP-NAFAZ': 'ANEK-NAFAZ',
      'ANLP-ANSWL': 'ANEK-ANSWL',
      'ANLC-KANSW': 'ANLA-KANSW',
      'ANLC-KNAFA': 'ANLA-KNAFA',
    };
    for (const [oldRef, newRef] of Object.entries(fieldMap)) {
      const pattern = new RegExp(oldRef.replace('-', '\\-'), 'gi');
      result = result.replace(pattern, (match) => {
        changes.push({ type: 'replace', from: match, to: newRef });
        return newRef;
      });
    }
    return { source: result, changes };
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// Transform Statistics
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get transform statistics for coverage reporting.
 * @returns {{ total: number, byCategory: object }}
 */
function getTransformStats() {
  const ids = Object.keys(TRANSFORMS);
  const categories = {};
  for (const id of ids) {
    const prefix = id.replace(/-[^-]+$/, '');
    categories[prefix] = (categories[prefix] || 0) + 1;
  }
  return { total: ids.length, byCategory: categories };
}

module.exports = { getTransform, getAllTransforms, hasTransform, getTransformStats };
