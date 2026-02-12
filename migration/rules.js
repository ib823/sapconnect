/**
 * S/4HANA Simplification Rules Database
 *
 * Known compatibility issues when migrating from ECC to S/4HANA.
 * Each rule has: id, category, severity, pattern matching, and remediation guidance.
 *
 * Severity levels:
 *   critical  - Will not compile/run in S/4HANA. Must fix before migration.
 *   high      - Major functional change. Likely breaks at runtime.
 *   medium    - Deprecated but still works. Should remediate.
 *   low       - Style/best practice. Remediate opportunistically.
 */

const RULES = [
  // ── Removed/Restructured Tables ──────────────────────────────
  {
    id: 'SIMPL-FIN-001',
    category: 'Finance - New GL',
    severity: 'critical',
    title: 'BSEG direct access removed',
    description: 'Table BSEG is replaced by ACDOCA (Universal Journal) in S/4HANA. Direct SELECT on BSEG will fail or return incomplete data.',
    pattern: /\bBSEG\b/i,
    patternType: 'source',
    remediation: 'Replace BSEG access with ACDOCA or CDS views I_JournalEntry / I_JournalEntryItem.',
    simplificationId: 'S4TWL-FI-001',
  },
  {
    id: 'SIMPL-FIN-002',
    category: 'Finance - New GL',
    severity: 'critical',
    title: 'Customer/Vendor line item tables removed',
    description: 'Tables BSID, BSIK, BSAD, BSAK (open/cleared items) are removed. Data consolidated in ACDOCA.',
    pattern: /\b(BSID|BSIK|BSAD|BSAK)\b/i,
    patternType: 'source',
    remediation: 'Use ACDOCA with appropriate filters or CDS views I_OperationalAcctgDocItem.',
    simplificationId: 'S4TWL-FI-002',
  },
  {
    id: 'SIMPL-FIN-003',
    category: 'Finance - New GL',
    severity: 'high',
    title: 'GL line item tables removed',
    description: 'Tables BSIS, BSAS (GL open/cleared items) are removed in S/4HANA.',
    pattern: /\b(BSIS|BSAS)\b/i,
    patternType: 'source',
    remediation: 'Use ACDOCA with GL account filters or CDS views.',
    simplificationId: 'S4TWL-FI-003',
  },
  {
    id: 'SIMPL-FIN-004',
    category: 'Finance - New GL',
    severity: 'high',
    title: 'Cost element tables removed',
    description: 'Tables CSKA, CSKB (cost element master) are removed. Cost elements are now GL accounts.',
    pattern: /\b(CSKA|CSKB)\b/i,
    patternType: 'source',
    remediation: 'Use GL account master (SKA1/SKB1) or CDS view I_GLAccountInChartOfAccounts.',
    simplificationId: 'S4TWL-CO-001',
  },
  {
    id: 'SIMPL-FIN-005',
    category: 'Finance - Asset Accounting',
    severity: 'high',
    title: 'Classic asset tables removed',
    description: 'Tables ANLP, ANLC (asset periodic/cumulated values) are removed. New Asset Accounting uses ACDOCA.',
    pattern: /\b(ANLP|ANLC)\b/i,
    patternType: 'source',
    remediation: 'Use ACDOCA for asset values or CDS views I_FixedAssetBalance*.',
    simplificationId: 'S4TWL-FI-AA-001',
  },

  // ── Business Partner ─────────────────────────────────────────
  {
    id: 'SIMPL-BP-001',
    category: 'Business Partner',
    severity: 'high',
    title: 'Customer master tables deprecated',
    description: 'KNA1, KNB1, KNVV (customer master) are deprecated. Business Partner (BUT000) is the master.',
    pattern: /\b(KNA1|KNB1|KNVV|KNB5|KNVK)\b/i,
    patternType: 'source',
    remediation: 'Use Business Partner tables (BUT000, BUT020, BUT050, BUT100) or API_BUSINESS_PARTNER OData service.',
    simplificationId: 'S4TWL-MD-BP-001',
  },
  {
    id: 'SIMPL-BP-002',
    category: 'Business Partner',
    severity: 'high',
    title: 'Vendor master tables deprecated',
    description: 'LFA1, LFB1 (vendor master) are deprecated. Business Partner (BUT000) is the master.',
    pattern: /\b(LFA1|LFB1|LFB5|LFBK)\b/i,
    patternType: 'source',
    remediation: 'Use Business Partner tables or API_BUSINESS_PARTNER OData service.',
    simplificationId: 'S4TWL-MD-BP-002',
  },
  {
    id: 'SIMPL-BP-003',
    category: 'Business Partner',
    severity: 'medium',
    title: 'Customer/Vendor BAPIs deprecated',
    description: 'BAPI_CUSTOMER_* and BAPI_VENDOR_* function modules are deprecated.',
    pattern: /\b(BAPI_CUSTOMER_|BAPI_VENDOR_)\w+/i,
    patternType: 'source',
    remediation: 'Use API_BUSINESS_PARTNER OData service or CDS-based APIs.',
    simplificationId: 'S4TWL-MD-BP-003',
  },

  // ── Material Master ──────────────────────────────────────────
  {
    id: 'SIMPL-MM-001',
    category: 'Material Management',
    severity: 'medium',
    title: 'Material number length changed',
    description: 'Material number (MATNR) extended from 18 to 40 characters. Hardcoded length assumptions will break.',
    pattern: /MATNR.*(?:TYPE C LENGTH 18|CHAR18|\(18\))/i,
    patternType: 'source',
    remediation: 'Use TYPE matnr (dictionary type) instead of hardcoded lengths. Check all interfaces and file formats.',
    simplificationId: 'S4TWL-MM-001',
  },

  // ── Deprecated ABAP Patterns ─────────────────────────────────
  {
    id: 'SIMPL-ABAP-001',
    category: 'ABAP Language',
    severity: 'low',
    title: 'OCCURS keyword deprecated',
    description: 'OCCURS is obsolete in ABAP. While still functional, it indicates legacy code.',
    pattern: /\bOCCURS\s+\d+/i,
    patternType: 'source',
    remediation: 'Replace with standard internal table declarations (TYPE TABLE OF / TYPE STANDARD TABLE OF).',
    simplificationId: 'S4TWL-ABAP-001',
  },
  {
    id: 'SIMPL-ABAP-002',
    category: 'ABAP Language',
    severity: 'medium',
    title: 'BDC (Batch Data Communication) usage',
    description: 'BDC/CALL TRANSACTION relies on screen sequences that may change in S/4HANA Fiori-based transactions.',
    pattern: /\bCALL\s+TRANSACTION\s+/i,
    patternType: 'source',
    remediation: 'Replace with BAPI calls, OData services, or direct API access. Screen-dependent BDCs are fragile after migration.',
    simplificationId: 'S4TWL-ABAP-002',
  },
  {
    id: 'SIMPL-ABAP-003',
    category: 'ABAP Language',
    severity: 'medium',
    title: 'Direct database modification statements',
    description: 'Direct INSERT/UPDATE/DELETE on standard SAP tables bypasses application logic.',
    pattern: /\b(INSERT INTO|UPDATE\s+|DELETE FROM)\s+(BKPF|BSEG|EKKO|EKPO|VBAK|VBAP|LIKP|LIPS|MKPF|MSEG)\b/i,
    patternType: 'source',
    remediation: 'Use BAPIs or APIs instead of direct DB modifications on standard tables.',
    simplificationId: 'S4TWL-ABAP-003',
  },
  {
    id: 'SIMPL-ABAP-004',
    category: 'ABAP Language',
    severity: 'low',
    title: 'SELECT * usage on large tables',
    description: 'SELECT * reads all columns including deprecated ones. May cause issues with restructured tables.',
    pattern: /\bSELECT\s+\*\s+FROM\s+(BKPF|EKKO|EKPO|VBAK|VBAP|MARA|MARC|MARD)\b/i,
    patternType: 'source',
    remediation: 'Specify explicit column list instead of SELECT *.',
    simplificationId: 'S4TWL-ABAP-004',
  },

  // ── Removed Functionality ────────────────────────────────────
  {
    id: 'SIMPL-FUNC-001',
    category: 'Removed Functionality',
    severity: 'critical',
    title: 'Credit Management (FD32/classic) removed',
    description: 'Classic credit management (FD32, UKM tables) is replaced by SAP Credit Management (FSCM).',
    pattern: /\b(UKM_|FD32|UKMBP_CMS)\b/i,
    patternType: 'source',
    remediation: 'Migrate to SAP Credit Management (FSCM) or S/4HANA Credit Management.',
    simplificationId: 'S4TWL-FSCM-001',
  },
  {
    id: 'SIMPL-FUNC-002',
    category: 'Removed Functionality',
    severity: 'high',
    title: 'Output Management (NAST-based) deprecated',
    description: 'Classic output determination via NAST/condition technique is replaced by BRF+ output management.',
    pattern: /\b(NAST|TNAPR|NACH)\b/i,
    patternType: 'source',
    remediation: 'Migrate to BRF+ based output management or Adobe Forms.',
    simplificationId: 'S4TWL-OUTPUT-001',
  },
  {
    id: 'SIMPL-FUNC-003',
    category: 'Removed Functionality',
    severity: 'critical',
    title: 'Warehouse Management (WM) replaced by EWM',
    description: 'Classic WM (LE-WM, LAGP/LQUA tables) is removed. Extended Warehouse Management (EWM) is the replacement.',
    pattern: /\b(LAGP|LQUA|LTAP|LTBP|L_TO_CREATE)\b/i,
    patternType: 'source',
    remediation: 'Migrate to Embedded EWM or Decentralized EWM.',
    simplificationId: 'S4TWL-WM-001',
  },

  // ── Enhancement Patterns ─────────────────────────────────────
  {
    id: 'SIMPL-ENH-001',
    category: 'Enhancements',
    severity: 'medium',
    title: 'User Exit usage (SMOD/CMOD)',
    description: 'User Exits via SMOD/CMOD are deprecated. BAdIs are the standard enhancement mechanism.',
    pattern: /\bUSEREXIT_|CUSTOMER-FUNCTION\b/i,
    patternType: 'source',
    remediation: 'Migrate to equivalent BAdI implementations.',
    simplificationId: 'S4TWL-ENH-001',
  },
  {
    id: 'SIMPL-ENH-002',
    category: 'Enhancements',
    severity: 'medium',
    title: 'Modification of standard SAP objects',
    description: 'Direct modifications to standard objects require manual adjustment after each upgrade.',
    pattern: /^Y\d{3}|^ZXXX/i,
    patternType: 'objectName',
    remediation: 'Replace modifications with BAdI or Enhancement Spot implementations following Clean Core principles.',
    simplificationId: 'S4TWL-ENH-002',
  },

  // ── Data Model Changes ───────────────────────────────────────
  {
    id: 'SIMPL-DATA-001',
    category: 'Data Model',
    severity: 'high',
    title: 'Profitability Analysis (CO-PA) restructured',
    description: 'Classic CO-PA tables (CE1*, CE2*, CE3*, CE4*) are replaced by margin analysis in ACDOCA.',
    pattern: /\b(CE1\w+|CE2\w+|CE3\w+|CE4\w+)\b/,
    patternType: 'source',
    remediation: 'Use ACDOCA-based margin analysis or CDS views for profitability reporting.',
    simplificationId: 'S4TWL-COPA-001',
  },
  {
    id: 'SIMPL-DATA-002',
    category: 'Data Model',
    severity: 'medium',
    title: 'Material Ledger tables restructured',
    description: 'CKMLHD, CKMLCT, CKMLPP tables restructured in S/4HANA for actual costing.',
    pattern: /\b(CKMLHD|CKMLCT|CKMLPP)\b/i,
    patternType: 'source',
    remediation: 'Review actual costing data model changes. Use CDS views I_ActualCostRate*.',
    simplificationId: 'S4TWL-ML-001',
  },
];

/**
 * Get all rules
 * @returns {object[]}
 */
function getAllRules() {
  return RULES;
}

/**
 * Get rules filtered by severity
 * @param {string} severity - critical, high, medium, low
 * @returns {object[]}
 */
function getRulesBySeverity(severity) {
  return RULES.filter((r) => r.severity === severity);
}

/**
 * Get rules filtered by category
 * @param {string} category - partial match on category name
 * @returns {object[]}
 */
function getRulesByCategory(category) {
  const lower = category.toLowerCase();
  return RULES.filter((r) => r.category.toLowerCase().includes(lower));
}

/**
 * Check source code against all rules
 * @param {string} source - ABAP source code
 * @param {string} objectName - Name of the object (for objectName pattern matching)
 * @returns {object[]} Array of { rule, matches } for each triggered rule
 */
function checkSource(source, objectName) {
  const findings = [];

  for (const rule of RULES) {
    if (rule.patternType === 'source') {
      const matches = [];
      const lines = source.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (rule.pattern.test(lines[i])) {
          matches.push({
            line: i + 1,
            content: lines[i].trim(),
          });
        }
      }
      if (matches.length > 0) {
        findings.push({ rule, matches });
      }
    } else if (rule.patternType === 'objectName') {
      if (rule.pattern.test(objectName)) {
        findings.push({
          rule,
          matches: [{ line: 0, content: `Object name: ${objectName}` }],
        });
      }
    }
  }

  return findings;
}

/**
 * Get severity weight for scoring
 * @param {string} severity
 * @returns {number}
 */
function severityWeight(severity) {
  switch (severity) {
    case 'critical': return 10;
    case 'high': return 5;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

module.exports = {
  RULES,
  getAllRules,
  getRulesBySeverity,
  getRulesByCategory,
  checkSource,
  severityWeight,
};
