/**
 * Controlling (CO) Simplification Rules
 *
 * Covers: CO-PA restructuring, cost element → GL account merge,
 * internal orders, overhead calculation, CO-PC product costing,
 * cost center accounting, activity-based costing, profit center
 * accounting, transfer pricing, planning, period close, group costing.
 *
 * 52 rules total (SIMPL-CO-001 .. SIMPL-CO-052).
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

  // ================================================================
  // NEW RULES (SIMPL-CO-019 .. SIMPL-CO-052)
  // ================================================================

  // ── Cost Element Accounting ────────────────────────────────
  {
    id: 'SIMPL-CO-019',
    category: 'Controlling - Cost Elements',
    severity: 'critical',
    title: 'Primary cost elements derived from GL accounts',
    description:
      'Primary cost elements no longer exist as separate master data. They are automatically derived from GL accounts that carry cost element category in table SKA1/SKAT. Transaction KA01 (create cost element) is obsolete.',
    pattern: /\b(KA01|KA06|BAPI_COSTELEM_CREATEMULTIPLE|COST_ELEMENT_CREATE)\b/i,
    patternType: 'source',
    remediation:
      'Create GL accounts with the appropriate cost element category via FS00 or I_ChartOfAccountsTP API. Cost element creation is automatic when GL account has a CO-relevant account type.',
  },
  {
    id: 'SIMPL-CO-020',
    category: 'Controlling - Cost Elements',
    severity: 'critical',
    title: 'Secondary cost elements merged into GL chart of accounts',
    description:
      'Secondary cost elements (categories 21-43) must now exist as GL accounts in the chart of accounts. Separate CSKA/CSKB master data tables are obsolete in S/4HANA.',
    pattern: /\b(CSKA|CSKB)[-.]?\w*/i,
    patternType: 'source',
    remediation:
      'Migrate secondary cost elements to GL accounts using transaction FINSC_MIGRATE or the S/4HANA migration cockpit. Assign cost element categories on the GL master.',
  },
  {
    id: 'SIMPL-CO-021',
    category: 'Controlling - Cost Elements',
    severity: 'high',
    title: 'Automatic cost element creation on GL account save',
    description:
      'When a GL account is saved with a cost-relevant account type (via FS00, OB_GLACC_MAINTAIN, or API), S/4HANA automatically creates the cost element. Custom code that separately creates cost elements will fail or create duplicates.',
    pattern: /\b(KA01|KA02|BAPI_COSTELEM_|FM.*COST_ELEMENT)\b/i,
    patternType: 'source',
    remediation:
      'Remove any custom code that explicitly creates or maintains cost elements. Use GL account maintenance APIs (I_GLAccountTP) which handle cost element creation implicitly.',
  },
  {
    id: 'SIMPL-CO-022',
    category: 'Controlling - Cost Elements',
    severity: 'high',
    title: 'CSKB table replaced by SKA1/SKB1 attributes',
    description:
      'Table CSKB (cost element master - controlling area dependent) is removed. Cost element attributes such as cost element category are now stored in SKA1 (GL account master - chart of accounts level).',
    pattern: /\bCSKB\b/,
    patternType: 'source',
    remediation:
      'Replace CSKB reads with SKA1 or use CDS view I_GLAccountInChartOfAccounts. Map CSKB-KATYP to SKA1-GLACCOUNT_TYPE.',
  },

  // ── Cost Center Accounting ─────────────────────────────────
  {
    id: 'SIMPL-CO-023',
    category: 'Controlling - Cost Centers',
    severity: 'high',
    title: 'Plan/actual integration in universal journal',
    description:
      'Cost center plan data is now stored in ACDOCP (plan table of universal journal) instead of legacy COSP/COSS plan records. Transactions KP06 and KP26 write to ACDOCP.',
    pattern: /\b(COSP|COSS)\b.*\b(PLAN|WRTTP\s*=\s*['"]*0?1)\b/i,
    patternType: 'source',
    remediation:
      'Replace reads from COSP/COSS with plan value type from ACDOCP or use CDS view I_CostCenterPlanData.',
  },
  {
    id: 'SIMPL-CO-024',
    category: 'Controlling - Cost Centers',
    severity: 'medium',
    title: 'Statistical key figure posting changes',
    description:
      'Statistical key figures (transaction KB31N/KB33N) now post to ACDOCA. Legacy tables COSR (statistical key figure totals) are deprecated.',
    pattern: /\b(KB31N|KB33N|COSR|BAPI_STATISTICAL_KF)\b/i,
    patternType: 'source',
    remediation:
      'Read statistical key figures from ACDOCA using the STAGR (statistical key figure) fields, or use CDS view I_StatisticalKeyFigureActData.',
  },
  {
    id: 'SIMPL-CO-025',
    category: 'Controlling - Cost Centers',
    severity: 'high',
    title: 'Activity allocation postings via ACDOCA',
    description:
      'Activity allocation (KB21N/KB23N) and direct activity allocation now post line items directly to ACDOCA instead of COBK/COEP. Sender and receiver are captured in the same journal entry.',
    pattern: /\b(KB21N|KB23N|COBK|COEP)\b/i,
    patternType: 'source',
    remediation:
      'Replace COBK/COEP reads with ACDOCA. Use CDS views I_JournalEntry or I_CostCenterActivityTypeActData for activity allocation analysis.',
  },

  // ── Internal Orders ────────────────────────────────────────
  {
    id: 'SIMPL-CO-026',
    category: 'Controlling - Internal Orders',
    severity: 'high',
    title: 'Order settlement to ACDOCA-based receivers',
    description:
      'Settlement of internal orders (KO88) now creates ACDOCA entries directly. Settlement to costing-based CO-PA objects is no longer available. Settlement rule table COBRB must reference account-based receivers.',
    pattern: /\b(KO88|COBRB|CO88)\b/i,
    patternType: 'source',
    remediation:
      'Review all settlement rules in COBRB for references to costing-based CO-PA segments. Convert settlement rules to account-based PA objects or profitability segments.',
  },
  {
    id: 'SIMPL-CO-027',
    category: 'Controlling - Internal Orders',
    severity: 'medium',
    title: 'Order type configuration for S/4HANA',
    description:
      'Order types (table T003O, transaction KOT2) require review. Budget profile and settlement profile must align with ACDOCA-based controlling. Some order type categories may be deprecated.',
    pattern: /\b(T003O|KOT2|BAPI_INTERNALORDER_GETLIST)\b/i,
    patternType: 'source',
    remediation:
      'Review order type configuration (KOT2). Ensure settlement profiles and budget profiles are compatible with S/4HANA. Use I_InternalOrderTP for order management.',
  },
  {
    id: 'SIMPL-CO-028',
    category: 'Controlling - Internal Orders',
    severity: 'high',
    title: 'Budget management for internal orders restructured',
    description:
      'Budget management for internal orders (KOBS, KOBP tables) is restructured. Availability control checks now integrate with ACDOCA. BAPIs for budget (BAPI_INTERNALORDER_BUDGET*) have changed parameters.',
    pattern: /\b(KOBS|KOBP|KОБР|BAPI_INTERNALORDER_BUDGET)\b/i,
    patternType: 'source',
    remediation:
      'Review budget management setup. Migrate to S/4HANA budget APIs or use I_InternalOrderBudget CDS view for budget queries.',
  },

  // ── Product Costing ────────────────────────────────────────
  {
    id: 'SIMPL-CO-029',
    category: 'Controlling - Product Costing',
    severity: 'critical',
    title: 'Material Ledger activation mandatory for all valuation areas',
    description:
      'In S/4HANA, Material Ledger must be active for every valuation area. Transaction OMX1 settings are enforced. Plants without ML activation cannot be migrated.',
    pattern: /\b(OMX1|CKMLRUNPERIOD|CKM_RCKM_ACTIVATE)\b/i,
    patternType: 'source',
    remediation:
      'Activate Material Ledger in all valuation areas before migration. Run transaction CKMSTART for initial ML activation. Review valuation strategy per OMX1.',
  },
  {
    id: 'SIMPL-CO-030',
    category: 'Controlling - Product Costing',
    severity: 'high',
    title: 'Actual costing single-level and multi-level price determination',
    description:
      'Actual costing runs (CKMLCP, CKM3N) are restructured in S/4HANA. Single-level price determination and multi-level price determination occur in ACDOCA with ML integration.',
    pattern: /\b(CKMLCP|CKM3N|CKML_MGV|MR22)\b/i,
    patternType: 'source',
    remediation:
      'Review actual costing run setup. Use transaction CKMLCP with S/4HANA-specific parameters. Analyze actual cost results via CDS view I_ActualCostRateByKeyDate.',
  },
  {
    id: 'SIMPL-CO-031',
    category: 'Controlling - Product Costing',
    severity: 'high',
    title: 'Cost component split stored in ACDOCA',
    description:
      'The cost component split is now stored directly in ACDOCA journal entries via extension fields. Legacy tables CKMLTRANSACTION and CKMLPRKOPH are superseded.',
    pattern: /\b(CKMLTRANSACTION|CKMLPRKOPH|KALNR)\b/i,
    patternType: 'source',
    remediation:
      'Read cost component split data from ACDOCA extension fields or use CDS view I_CostComponentSplit. Review cost component structure assignments.',
  },

  // ── Profitability Analysis ─────────────────────────────────
  {
    id: 'SIMPL-CO-032',
    category: 'Controlling - CO-PA',
    severity: 'critical',
    title: 'CO-PA segment-level reporting via margin analysis',
    description:
      'Profitability segment reporting is now based on ACDOCA margin analysis. Legacy segment tables (CE4*, COPA_SEGMENT) and customizing (KEQ3, KEDR) are replaced by universal journal dimensions.',
    pattern: /\b(CE4\w+|COPA_SEGMENT|KEQ3|KEDR)\b/i,
    patternType: 'source',
    remediation:
      'Use margin analysis in ACDOCA. Configure profitability dimensions via Manage Profitability Segments Fiori app or CDS view I_ProfitabilitySegment.',
  },
  {
    id: 'SIMPL-CO-033',
    category: 'Controlling - CO-PA',
    severity: 'high',
    title: 'PA transfer structure obsolete in account-based CO-PA',
    description:
      'PA transfer structures (KEI1, transaction KEI1/KEI2) used for value field assignment in costing-based CO-PA are obsolete. Account assignment is automatic in account-based CO-PA.',
    pattern: /\b(KEI1|KEI2|KEI3|PA_TRANSFER_STRUCTURE)\b/i,
    patternType: 'source',
    remediation:
      'Remove PA transfer structure references. Account-based CO-PA automatically derives profitability attributes from the posting. Use derivation rules (KEDR) for attribute enrichment.',
  },
  {
    id: 'SIMPL-CO-034',
    category: 'Controlling - CO-PA',
    severity: 'high',
    title: 'Margin analysis replaces CO-PA value fields',
    description:
      'CO-PA value fields (VV*, WW*) defined in operating concern customizing are replaced by GL account-based amounts in ACDOCA. Margin analysis views provide equivalent reporting.',
    pattern: /\b(KE21N|KE23N|KE4.*|VV\d{3}|WW\d{3})\b/i,
    patternType: 'source',
    remediation:
      'Map CO-PA value fields to GL account ranges. Use Fiori app Margin Analysis (F2672) or CDS view I_MarginAnalysis for profitability reporting.',
  },

  // ── Activity-Based Costing ─────────────────────────────────
  {
    id: 'SIMPL-CO-035',
    category: 'Controlling - Activity-Based Costing',
    severity: 'medium',
    title: 'Cost driver analysis with ACDOCA integration',
    description:
      'Activity-Based Costing cost drivers (transaction CP05, CPCA) must be re-evaluated for ACDOCA. ABC process cost totals previously in COEP-BELNR context are now in universal journal.',
    pattern: /\b(CP05|CPCA|CPD1|CPMB)\b/i,
    patternType: 'source',
    remediation:
      'Review ABC cost driver assignments and process cost rates. Analyze results through ACDOCA or CDS views. Consider SAP Profitability and Performance Management for advanced ABC.',
  },
  {
    id: 'SIMPL-CO-036',
    category: 'Controlling - Activity-Based Costing',
    severity: 'medium',
    title: 'Template allocation in S/4HANA',
    description:
      'Template allocations (transaction CPT1, CPTA) for activity-based costing use ACDOCA as the data source. Templates referencing deprecated CO summary tables (COSS/COSP) need migration.',
    pattern: /\b(CPT1|CPTA|CPT2|TEMPLATE_ALLOC)\b/i,
    patternType: 'source',
    remediation:
      'Review template allocation definitions (CPT1). Update environment references from COSS/COSP to ACDOCA. Test template execution with S/4HANA posting logic.',
  },

  // ── Overhead Cost Controlling ──────────────────────────────
  {
    id: 'SIMPL-CO-037',
    category: 'Controlling - Overhead',
    severity: 'high',
    title: 'Assessment cycle ACDOCA posting',
    description:
      'Assessment cycles (KSU1/KSU5) now create ACDOCA line items directly. The sender-receiver relationship is captured in the universal journal. Legacy COEP-based assessment documents are obsolete.',
    pattern: /\b(KSU1|KSU2|KSU5|KSU7|AUAK|AUAB)\b/i,
    patternType: 'source',
    remediation:
      'Review assessment cycle definitions for ACDOCA compatibility. Verify sender and receiver cost element mappings use GL accounts. Execute assessment via S/4HANA allocation framework.',
  },
  {
    id: 'SIMPL-CO-038',
    category: 'Controlling - Overhead',
    severity: 'high',
    title: 'Distribution cycle changes for ACDOCA',
    description:
      'Distribution cycles (KSV1/KSV5) create original cost element postings in ACDOCA. Distribution preserves the original cost element, unlike assessment which uses an assessment cost element.',
    pattern: /\b(KSV1|KSV2|KSV5|KSV7)\b/i,
    patternType: 'source',
    remediation:
      'Review distribution cycle segment definitions. Ensure tracing factors and distribution keys are compatible with ACDOCA data. Test distribution runs in S/4HANA sandbox.',
  },
  {
    id: 'SIMPL-CO-039',
    category: 'Controlling - Overhead',
    severity: 'medium',
    title: 'Overhead calculation costing sheet references GL accounts',
    description:
      'Overhead calculation via costing sheets (KZS2, transaction KGI2/KISR) must reference GL accounts instead of legacy cost elements. Base, overhead, and credit rows in costing sheets need review.',
    pattern: /\b(KZS2|KGI2|KISR|KZA2|KZO2)\b/i,
    patternType: 'source',
    remediation:
      'Review costing sheet definitions (KZS2). Update base and credit assignments from cost element ranges to GL account ranges. Test overhead calculation with updated costing sheets.',
  },

  // ── Profit Center Accounting ───────────────────────────────
  {
    id: 'SIMPL-CO-040',
    category: 'Controlling - Profit Center',
    severity: 'critical',
    title: 'Profit Center Accounting embedded in universal journal',
    description:
      'Profit Center Accounting (EC-PCA) is fully embedded in ACDOCA. Standalone EC-PCA tables (GLPCA, GLPCO, GLPCP) and transactions (1KE1, 1KE4, 1KE5) are obsolete.',
    pattern: /\b(1KE1|1KE4|1KE5|1KEF|GLPCA|GLPCO|GLPCP|EC_PCA_)\b/i,
    patternType: 'source',
    remediation:
      'Replace all GLPCA/GLPCO/GLPCP reads with ACDOCA filtered by profit center. Use CDS views I_ProfitCenterActualData and I_ProfitCenterPlanData.',
  },
  {
    id: 'SIMPL-CO-041',
    category: 'Controlling - Profit Center',
    severity: 'high',
    title: 'Document type 8A/9A elimination entries replaced',
    description:
      'Profit center elimination entries previously posted via document types 8A/9A (transaction 1KE8) are replaced by ACDOCA elimination postings. Group reporting uses consolidation in ACDOCA.',
    pattern: /\b(1KE8|1KE9|DOC_TYPE.*[89]A|ELIM_PCA)\b/i,
    patternType: 'source',
    remediation:
      'Configure elimination in Group Reporting (transaction GCGR) or use ACDOCA extension ledger for intercompany elimination. Remove legacy 8A/9A posting logic.',
  },
  {
    id: 'SIMPL-CO-042',
    category: 'Controlling - Profit Center',
    severity: 'medium',
    title: 'Profit center balance carryforward in ACDOCA',
    description:
      'Balance carryforward for profit centers no longer uses transaction 2KES. Year-end closing is handled through standard FI carryforward (FAGLGVTR) which includes profit center dimension in ACDOCA.',
    pattern: /\b(2KES|SAPF011|PCA_BALANCE_CARRY)\b/i,
    patternType: 'source',
    remediation:
      'Use FAGLGVTR for balance carryforward which automatically includes profit center dimension. Remove separate PCA carryforward programs.',
  },

  // ── Transfer Pricing ───────────────────────────────────────
  {
    id: 'SIMPL-CO-043',
    category: 'Controlling - Transfer Pricing',
    severity: 'high',
    title: 'Intercompany transfer pricing via extension ledger',
    description:
      'Transfer pricing for intercompany transactions uses ACDOCA extension ledger (ledger group approach). Legacy profit center valuation via 1KEK/1KEL transactions is replaced.',
    pattern: /\b(1KEK|1KEL|1KEF|TPC_VARIANT|OKKP.*TP)\b/i,
    patternType: 'source',
    remediation:
      'Configure transfer pricing in the extension ledger approach (FINSC_LEDGER). Use real-time transfer pricing postings in ACDOCA with parallel valuation.',
  },
  {
    id: 'SIMPL-CO-044',
    category: 'Controlling - Transfer Pricing',
    severity: 'medium',
    title: 'Profit center valuation via parallel currency types',
    description:
      'Profit center valuation (transaction 1KEI) is replaced by parallel valuation using currency types in ACDOCA. Group and profit center valuation are stored as additional currency amounts.',
    pattern: /\b(1KEI|1KEJ|1KEM|PCA_VALUATION)\b/i,
    patternType: 'source',
    remediation:
      'Configure parallel currency types (group currency, profit center valuation currency) in ACDOCA ledger settings. Use CDS views with currency type filters for transfer pricing reports.',
  },

  // ── Planning ───────────────────────────────────────────────
  {
    id: 'SIMPL-CO-045',
    category: 'Controlling - Planning',
    severity: 'high',
    title: 'Cost center planning via ACDOCP',
    description:
      'Cost center planning (KP06, KP07) now writes to ACDOCP (plan table of universal journal). Legacy plan tables COSP/COSS plan records are obsolete. Planning layouts reference GL accounts.',
    pattern: /\b(KP06|KP07|KPF6|KPF7|PLAUT_COSTCENTER)\b/i,
    patternType: 'source',
    remediation:
      'Review planning layouts (KP65) for GL account references instead of cost elements. Use SAP Analytics Cloud or Fiori planning apps for integrated planning on ACDOCP.',
  },
  {
    id: 'SIMPL-CO-046',
    category: 'Controlling - Planning',
    severity: 'medium',
    title: 'Profit center planning in universal journal',
    description:
      'Profit center planning (7KE1, GP12N) is replaced by planning directly in ACDOCP with profit center dimension. Legacy PCA planning transactions are deprecated.',
    pattern: /\b(7KE1|7KE2|GP12N|GP42N|PCA_PLAN)\b/i,
    patternType: 'source',
    remediation:
      'Use ACDOCP-based planning with profit center dimension. Implement planning via SAP Analytics Cloud planning integration or Fiori plan data entry apps.',
  },
  {
    id: 'SIMPL-CO-047',
    category: 'Controlling - Planning',
    severity: 'medium',
    title: 'Integrated planning across CO objects',
    description:
      'Integrated planning across cost centers, internal orders, and profit centers (transaction 7KE1, KEPM) now operates on ACDOCP. Copy and distribution functions must reference the universal journal plan table.',
    pattern: /\b(KEPM|KP97|KP98|KPF5|PLAN_COPY_CO)\b/i,
    patternType: 'source',
    remediation:
      'Use S/4HANA integrated planning framework on ACDOCP. Leverage SAP Analytics Cloud for cross-object planning scenarios with real-time writeback to ACDOCP.',
  },

  // ── Period Close ───────────────────────────────────────────
  {
    id: 'SIMPL-CO-048',
    category: 'Controlling - Period Close',
    severity: 'high',
    title: 'CO period close ACDOCA integration',
    description:
      'CO period-end closing (COGI, CO43, CO88) activities post directly to ACDOCA. The closing cockpit (transaction CLOCO) provides consolidated period close for CO in S/4HANA.',
    pattern: /\b(COGI|CO43|CO44|CLOCO|COFC)\b/i,
    patternType: 'source',
    remediation:
      'Use S/4HANA closing cockpit (CLOCO) for orchestrated CO period close. Review individual closing transactions for ACDOCA posting behavior. Use Fiori app Manage Closing Tasks.',
  },
  {
    id: 'SIMPL-CO-049',
    category: 'Controlling - Period Close',
    severity: 'high',
    title: 'WIP calculation posts to ACDOCA',
    description:
      'Work in process calculation (KKAO, KKAX) now creates ACDOCA postings. WIP results at target cost and at actual cost are stored in universal journal entries instead of legacy AUFW table.',
    pattern: /\b(KKAO|KKAX|KKAG|AUFW|BAPI_ACC_WIP_)\b/i,
    patternType: 'source',
    remediation:
      'Review WIP calculation variants. Execute WIP calculation which posts to ACDOCA. Use CDS view I_WIPActualData for work-in-process analysis.',
  },
  {
    id: 'SIMPL-CO-050',
    category: 'Controlling - Period Close',
    severity: 'high',
    title: 'Variance calculation in product costing via ACDOCA',
    description:
      'Production variance calculation (KKS1, KKS2) stores variance categories directly in ACDOCA. Legacy table COKP for variance results is deprecated. Variance postings use ML integration.',
    pattern: /\b(KKS1|KKS2|KKS6|COKP|VARIANCE_CALC_PP)\b/i,
    patternType: 'source',
    remediation:
      'Execute variance calculation which creates ACDOCA entries by variance category. Use CDS view I_ProductionVarianceActData for variance analysis. Review variance keys and target cost versions.',
  },

  // ── Group Costing ──────────────────────────────────────────
  {
    id: 'SIMPL-CO-051',
    category: 'Controlling - Group Costing',
    severity: 'high',
    title: 'Consolidation postings in ACDOCA',
    description:
      'Group costing and consolidation activities are supported directly in ACDOCA via group reporting. Legacy consolidation tables (ECMCA, ECMCT) and transaction CX* are replaced by ACDOCA group ledger entries.',
    pattern: /\b(ECMCA|ECMCT|CX01|CX1R|CX2R|UC_CONSOLIDATION)\b/i,
    patternType: 'source',
    remediation:
      'Use S/4HANA Group Reporting (GCGR) for consolidation. Data is stored in ACDOCA with consolidation ledger. Use CDS views for group-level cost analysis.',
  },
  {
    id: 'SIMPL-CO-052',
    category: 'Controlling - Group Costing',
    severity: 'high',
    title: 'Intercompany elimination in ACDOCA for group costing',
    description:
      'Intercompany profit elimination for group costing uses ACDOCA entries in the consolidation ledger. Legacy IC elimination via EC-CS (ECMCA) and profit center 8A/9A documents are replaced by real-time elimination in universal journal.',
    pattern: /\b(ECMCA|ECMCC|GCGR|IC_ELIM|RCUFI|RGUFI)\b/i,
    patternType: 'source',
    remediation:
      'Configure intercompany elimination rules in Group Reporting (GCGR). Elimination postings are created in ACDOCA consolidation ledger. Use Fiori apps for group close monitoring.',
  },
];
