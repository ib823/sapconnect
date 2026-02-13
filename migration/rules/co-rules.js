/**
 * Controlling (CO) Simplification Rules
 *
 * Covers: CO-PA restructuring, cost element → GL account merge,
 * internal orders, overhead calculation, CO-PC product costing.
 */

module.exports = [
  // ── CO-PA ──────────────────────────────────────────────────
  {
    id: 'SIMPL-CO-001',
    category: 'Controlling - CO-PA',
    severity: 'critical',
    title: 'CO-PA operating concern tables restructured',
    description: 'CE1*, CE2*, CE3*, CE4* tables are replaced by margin analysis in ACDOCA.',
    pattern: /\b(CE1\w+|CE2\w+|CE3\w+|CE4\w+)\b/,
    patternType: 'source',
    remediation: 'Use ACDOCA-based margin analysis or CDS views for profitability reporting.',
    simplificationId: 'S4TWL-COPA-001',
  },
  {
    id: 'SIMPL-CO-002',
    category: 'Controlling - CO-PA',
    severity: 'high',
    title: 'Costing-based CO-PA removed',
    description: 'Costing-based CO-PA is removed. Only account-based CO-PA (via ACDOCA) is supported.',
    pattern: /\b(COPA_|KE24|KE27|KE28|KE29|KE30)\b/i,
    patternType: 'source',
    remediation: 'Migrate to account-based profitability analysis in ACDOCA.',
    simplificationId: 'S4TWL-COPA-002',
  },
  {
    id: 'SIMPL-CO-003',
    category: 'Controlling - CO-PA',
    severity: 'high',
    title: 'CO-PA planning functions changed',
    description: 'CO-PA planning (KEPM) replaced by predictive accounting and margin analysis.',
    pattern: /\bKEPM\b/i,
    patternType: 'source',
    remediation: 'Use S/4HANA predictive accounting or SAP Analytics Cloud planning.',
    simplificationId: 'S4TWL-COPA-003',
  },

  // ── Cost Elements ──────────────────────────────────────────
  {
    id: 'SIMPL-CO-004',
    category: 'Controlling - Cost Elements',
    severity: 'critical',
    title: 'Cost element category concept removed',
    description: 'Separate cost element master is eliminated. Cost elements merged into GL account master.',
    pattern: /\b(CSKB|CSKA|CSKE|KA01|KA02|KA03)\b/i,
    patternType: 'source',
    remediation: 'Use GL account master with cost element attributes. Use I_GLAccountInChartOfAccounts CDS view.',
    simplificationId: 'S4TWL-CO-CE-001',
  },
  {
    id: 'SIMPL-CO-005',
    category: 'Controlling - Cost Elements',
    severity: 'high',
    title: 'Cost element group changes',
    description: 'Cost element groups (KAH*) replaced by GL account groups with CO attributes.',
    pattern: /\b(KAH1|KAH2|KAH3|SETNODE.*KSTAR)\b/i,
    patternType: 'source',
    remediation: 'Use GL account groups with CO-relevant indicators.',
    simplificationId: 'S4TWL-CO-CE-002',
  },

  // ── Cost Centers ───────────────────────────────────────────
  {
    id: 'SIMPL-CO-006',
    category: 'Controlling - Cost Centers',
    severity: 'medium',
    title: 'Cost center assessment/distribution changes',
    description: 'Assessment cycles (KSV5, KSUB) may need review for ACDOCA integration.',
    pattern: /\b(KSV5|KSUB|COSS|COSP)\b/i,
    patternType: 'source',
    remediation: 'Review cost allocation cycles for ACDOCA compatibility.',
    simplificationId: 'S4TWL-CO-CC-001',
  },
  {
    id: 'SIMPL-CO-007',
    category: 'Controlling - Cost Centers',
    severity: 'medium',
    title: 'Cost center totals tables removed',
    description: 'COSP (totals for external postings) and COSS (totals for internal postings) are deprecated.',
    pattern: /\b(COSP|COSS)\b/i,
    patternType: 'source',
    remediation: 'Use ACDOCA for CO totals or CDS views I_CostCenterActualData.',
    simplificationId: 'S4TWL-CO-CC-002',
  },

  // ── Internal Orders ────────────────────────────────────────
  {
    id: 'SIMPL-CO-008',
    category: 'Controlling - Internal Orders',
    severity: 'medium',
    title: 'Internal order settlement changes',
    description: 'Order settlement to CO-PA changed due to CO-PA restructuring.',
    pattern: /\b(KO88|BAPI_INTERNALORDER_|AUFK)\b/i,
    patternType: 'source',
    remediation: 'Review settlement rules for ACDOCA-based CO-PA.',
    simplificationId: 'S4TWL-CO-IO-001',
  },
  {
    id: 'SIMPL-CO-009',
    category: 'Controlling - Internal Orders',
    severity: 'low',
    title: 'Statistical order posting changes',
    description: 'Statistical postings to internal orders reflected differently in ACDOCA.',
    pattern: /\bSTAT.*ORDER|ORDER.*STAT\b/i,
    patternType: 'source',
    remediation: 'Review statistical order assignment logic.',
    simplificationId: 'S4TWL-CO-IO-002',
  },

  // ── Overhead ───────────────────────────────────────────────
  {
    id: 'SIMPL-CO-010',
    category: 'Controlling - Overhead',
    severity: 'medium',
    title: 'Overhead calculation changes',
    description: 'Overhead rate calculation (COKP, CON2) affected by cost element merge.',
    pattern: /\b(COKP|CON2|CK40N)\b/i,
    patternType: 'source',
    remediation: 'Review overhead calculation for GL account-based cost elements.',
    simplificationId: 'S4TWL-CO-OH-001',
  },

  // ── Product Costing ────────────────────────────────────────
  {
    id: 'SIMPL-CO-011',
    category: 'Controlling - Product Costing',
    severity: 'high',
    title: 'Material Ledger tables restructured',
    description: 'CKMLHD, CKMLCT, CKMLPP tables restructured for actual costing in S/4HANA.',
    pattern: /\b(CKMLHD|CKMLCT|CKMLPP)\b/i,
    patternType: 'source',
    remediation: 'Review actual costing data model changes. Use CDS views I_ActualCostRate*.',
    simplificationId: 'S4TWL-ML-001',
  },
  {
    id: 'SIMPL-CO-012',
    category: 'Controlling - Product Costing',
    severity: 'medium',
    title: 'Material Ledger mandatory',
    description: 'Material Ledger is mandatory in S/4HANA. CKMLCR, CKML* tables are key.',
    pattern: /\b(CKMLCR|MLHD|MLCD)\b/i,
    patternType: 'source',
    remediation: 'Ensure Material Ledger activation and review actual costing setup.',
    simplificationId: 'S4TWL-ML-002',
  },
  {
    id: 'SIMPL-CO-013',
    category: 'Controlling - Product Costing',
    severity: 'medium',
    title: 'Cost component structure changes',
    description: 'Cost component structures (TCKH*) affected by cost element to GL merge.',
    pattern: /\b(TCKH1|TCKH2|TCKH3|TCKH4)\b/i,
    patternType: 'source',
    remediation: 'Review cost component structures for GL account-based elements.',
    simplificationId: 'S4TWL-CO-PC-001',
  },

  // ── Activity Types ─────────────────────────────────────────
  {
    id: 'SIMPL-CO-014',
    category: 'Controlling - Activity Types',
    severity: 'low',
    title: 'Activity type planning changes',
    description: 'Activity type planning (KP06, KP26) may need review for ACDOCA.',
    pattern: /\b(KP06|KP26|CSLA)\b/i,
    patternType: 'source',
    remediation: 'Review activity type and price planning for S/4HANA.',
    simplificationId: 'S4TWL-CO-AT-001',
  },

  // ── CO Reporting ───────────────────────────────────────────
  {
    id: 'SIMPL-CO-015',
    category: 'Controlling - Reporting',
    severity: 'medium',
    title: 'CO line item reports changed',
    description: 'KSB1 (cost center line items) reads from ACDOCA. Performance characteristics differ.',
    pattern: /\b(KSB1|KOB1|S_ALR_87013611)\b/i,
    patternType: 'source',
    remediation: 'Use Fiori analytical apps or CDS-based reports.',
    simplificationId: 'S4TWL-CO-RPT-001',
  },

  // ── Profit Center ──────────────────────────────────────────
  {
    id: 'SIMPL-CO-016',
    category: 'Controlling - Profit Center',
    severity: 'high',
    title: 'Profit center totals tables removed',
    description: 'GLPCA, GLPCO tables removed. Profit center data in ACDOCA.',
    pattern: /\b(GLPCA|GLPCO|GLPCP)\b/i,
    patternType: 'source',
    remediation: 'Use ACDOCA with profit center dimension or CDS views.',
    simplificationId: 'S4TWL-CO-PC-002',
  },

  // ── Transfer Pricing ───────────────────────────────────────
  {
    id: 'SIMPL-CO-017',
    category: 'Controlling - Transfer Pricing',
    severity: 'medium',
    title: 'Transfer pricing in ACDOCA',
    description: 'Transfer pricing now handled via ACDOCA extension ledger approach.',
    pattern: /\bACDOCP\b/i,
    patternType: 'source',
    remediation: 'Review transfer pricing setup for ACDOCA extension ledger.',
    simplificationId: 'S4TWL-CO-TP-001',
  },

  // ── CO-OM ──────────────────────────────────────────────────
  {
    id: 'SIMPL-CO-018',
    category: 'Controlling - Overhead Management',
    severity: 'medium',
    title: 'Overhead order BAPI changes',
    description: 'BAPI_INTERNALORDER_CREATE has new mandatory fields in S/4HANA.',
    pattern: /\bBAPI_INTERNALORDER_CREATE\b/i,
    patternType: 'source',
    remediation: 'Review BAPI parameters or use I_InternalOrder API.',
    simplificationId: 'S4TWL-CO-OM-001',
  },
];
