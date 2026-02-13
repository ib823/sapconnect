/**
 * Sales & Distribution (SD) Simplification Rules
 *
 * Covers: Output management, credit management, pricing,
 * ATP, billing, delivery changes.
 */

module.exports = [
  // ── Output Management ──────────────────────────────────────
  {
    id: 'SIMPL-SD-001',
    category: 'SD - Output Management',
    severity: 'high',
    title: 'NAST-based output management deprecated',
    description: 'Classic output determination (NAST/condition technique) replaced by BRF+ output management.',
    pattern: /\b(NAST|TNAPR|NACH)\b/i,
    patternType: 'source',
    remediation: 'Migrate to BRF+ based output management or Adobe Forms.',
    simplificationId: 'S4TWL-SD-OUT-001',
  },
  {
    id: 'SIMPL-SD-002',
    category: 'SD - Output Management',
    severity: 'high',
    title: 'SAPscript forms deprecated',
    description: 'SAPscript forms are deprecated. Adobe Forms or output management framework required.',
    pattern: /\b(OPEN_FORM|CLOSE_FORM|WRITE_FORM|START_FORM)\b/i,
    patternType: 'source',
    remediation: 'Migrate forms to Adobe Forms or SAP Forms Service by Adobe.',
    simplificationId: 'S4TWL-SD-OUT-002',
  },
  {
    id: 'SIMPL-SD-003',
    category: 'SD - Output Management',
    severity: 'medium',
    title: 'SmartForms migration needed',
    description: 'SmartForms still work but migration to Adobe Forms is recommended.',
    pattern: /\bSSF_FUNCTION_MODULE_NAME\b/i,
    patternType: 'source',
    remediation: 'Plan migration from SmartForms to Adobe Forms.',
    simplificationId: 'S4TWL-SD-OUT-003',
  },

  // ── Credit Management ──────────────────────────────────────
  {
    id: 'SIMPL-SD-004',
    category: 'SD - Credit Management',
    severity: 'critical',
    title: 'Classic credit management (FD32) removed',
    description: 'FD32, UKM tables, classic credit management is replaced by FSCM credit management.',
    pattern: /\b(UKM_|FD32|UKMBP_CMS|UKM_DATA_READ)\b/i,
    patternType: 'source',
    remediation: 'Migrate to SAP Credit Management (FSCM) or S/4HANA Credit Management.',
    simplificationId: 'S4TWL-SD-CR-001',
  },
  {
    id: 'SIMPL-SD-005',
    category: 'SD - Credit Management',
    severity: 'high',
    title: 'Credit exposure calculation changed',
    description: 'Credit exposure tables (S066, S067) removed. Real-time credit via FSCM.',
    pattern: /\b(S066|S067|KNKK)\b/i,
    patternType: 'source',
    remediation: 'Use FSCM credit management APIs for exposure checks.',
    simplificationId: 'S4TWL-SD-CR-002',
  },

  // ── Pricing ────────────────────────────────────────────────
  {
    id: 'SIMPL-SD-006',
    category: 'SD - Pricing',
    severity: 'medium',
    title: 'Pricing procedure changes',
    description: 'Condition tables (A*, KONH, KONP) have structural changes. KNUMH handling differs.',
    pattern: /\b(KONH|KONP|KONV|KNUMH)\b/i,
    patternType: 'source',
    remediation: 'Review pricing condition access patterns. Use CDS views where available.',
    simplificationId: 'S4TWL-SD-PR-001',
  },
  {
    id: 'SIMPL-SD-007',
    category: 'SD - Pricing',
    severity: 'medium',
    title: 'Condition record BAPI changes',
    description: 'BAPI_PRICES_CONDITIONS has changed parameters in S/4HANA.',
    pattern: /\bBAPI_PRICES_CONDITIONS\b/i,
    patternType: 'source',
    remediation: 'Review BAPI parameters or use Pricing Conditions OData API.',
    simplificationId: 'S4TWL-SD-PR-002',
  },

  // ── ATP ────────────────────────────────────────────────────
  {
    id: 'SIMPL-SD-008',
    category: 'SD - ATP',
    severity: 'high',
    title: 'Classic ATP replaced by aATP',
    description: 'Classic ATP (CO06/CO09) replaced by Advanced ATP (aATP) in S/4HANA.',
    pattern: /\b(CO06|CO09|BAPI_MATERIAL_AVAILABILITY|ATPCS)\b/i,
    patternType: 'source',
    remediation: 'Evaluate advanced ATP (aATP). Review ATP checks in sales order processing.',
    simplificationId: 'S4TWL-SD-ATP-001',
  },
  {
    id: 'SIMPL-SD-009',
    category: 'SD - ATP',
    severity: 'medium',
    title: 'Backorder processing changes',
    description: 'Backorder processing (V_RA) changed with aATP.',
    pattern: /\bV_RA\b/i,
    patternType: 'source',
    remediation: 'Review backorder processing for aATP compatibility.',
    simplificationId: 'S4TWL-SD-ATP-002',
  },

  // ── Billing ────────────────────────────────────────────────
  {
    id: 'SIMPL-SD-010',
    category: 'SD - Billing',
    severity: 'medium',
    title: 'Billing document structure changes',
    description: 'VBRK/VBRP (billing documents) have structural changes in S/4HANA.',
    pattern: /\b(VBRK|VBRP)\b/i,
    patternType: 'source',
    remediation: 'Review billing document field usage. Use CDS views or OData APIs.',
    simplificationId: 'S4TWL-SD-BIL-001',
  },
  {
    id: 'SIMPL-SD-011',
    category: 'SD - Billing',
    severity: 'medium',
    title: 'Invoice list changes',
    description: 'Invoice list processing (VF21) changed in S/4HANA.',
    pattern: /\bVF21\b/i,
    patternType: 'source',
    remediation: 'Review invoice list processing for S/4HANA compatibility.',
    simplificationId: 'S4TWL-SD-BIL-002',
  },

  // ── Delivery ───────────────────────────────────────────────
  {
    id: 'SIMPL-SD-012',
    category: 'SD - Delivery',
    severity: 'medium',
    title: 'LIKP/LIPS delivery table changes',
    description: 'Delivery tables LIKP (header) and LIPS (items) have structural changes.',
    pattern: /\b(LIKP|LIPS)\b/i,
    patternType: 'source',
    remediation: 'Review delivery document field usage. Use API_OUTBOUND_DELIVERY_SRV.',
    simplificationId: 'S4TWL-SD-DEL-001',
  },
  {
    id: 'SIMPL-SD-013',
    category: 'SD - Delivery',
    severity: 'medium',
    title: 'Delivery BAPI changes',
    description: 'BAPI_OUTB_DELIVERY_CREATE_SLS changed parameters in S/4HANA.',
    pattern: /\bBAPI_OUTB_DELIVERY_\w+/i,
    patternType: 'source',
    remediation: 'Review delivery BAPIs. Consider API_OUTBOUND_DELIVERY_SRV OData service.',
    simplificationId: 'S4TWL-SD-DEL-002',
  },

  // ── Sales Documents ────────────────────────────────────────
  {
    id: 'SIMPL-SD-014',
    category: 'SD - Sales Documents',
    severity: 'medium',
    title: 'VBAK/VBAP sales document changes',
    description: 'Sales document tables VBAK/VBAP have structural changes.',
    pattern: /\b(VBAK|VBAP|VBEP)\b/i,
    patternType: 'source',
    remediation: 'Review sales document field usage. Use API_SALES_ORDER_SRV.',
    simplificationId: 'S4TWL-SD-SO-001',
  },
  {
    id: 'SIMPL-SD-015',
    category: 'SD - Sales Documents',
    severity: 'medium',
    title: 'Sales order BAPI changes',
    description: 'BAPI_SALESORDER_CREATEFROMDAT2 has new parameters in S/4HANA.',
    pattern: /\bBAPI_SALESORDER_\w+/i,
    patternType: 'source',
    remediation: 'Review SO BAPIs. Consider API_SALES_ORDER_SRV OData service.',
    simplificationId: 'S4TWL-SD-SO-002',
  },

  // ── Shipping ───────────────────────────────────────────────
  {
    id: 'SIMPL-SD-016',
    category: 'SD - Shipping',
    severity: 'medium',
    title: 'Transportation integration changes',
    description: 'Classic transportation (VT01N) replaced by S/4HANA Transportation Management.',
    pattern: /\bVT01N|VTTK|VTTP\b/i,
    patternType: 'source',
    remediation: 'Evaluate S/4HANA Transportation Management or embedded TM.',
    simplificationId: 'S4TWL-SD-SHP-001',
  },

  // ── Partner Determination ──────────────────────────────────
  {
    id: 'SIMPL-SD-017',
    category: 'SD - Partner',
    severity: 'medium',
    title: 'Partner determination with BP',
    description: 'Partner determination now uses Business Partner. KUAGV/KUWEV deprecated.',
    pattern: /\b(KUAGV|KUWEV|PARVW)\b/i,
    patternType: 'source',
    remediation: 'Review partner determination for BP-based partner functions.',
    simplificationId: 'S4TWL-SD-PTR-001',
  },

  // ── Rebate Processing ─────────────────────────────────────
  {
    id: 'SIMPL-SD-018',
    category: 'SD - Rebate',
    severity: 'medium',
    title: 'Rebate processing changes',
    description: 'Classic rebate processing (VBO1) replaced by Settlement Management.',
    pattern: /\b(VBO1|VBO2|VBO3|KONA)\b/i,
    patternType: 'source',
    remediation: 'Migrate to Settlement Management (condition contract).',
    simplificationId: 'S4TWL-SD-REB-001',
  },

  // ── Revenue Recognition ────────────────────────────────────
  {
    id: 'SIMPL-SD-019',
    category: 'SD - Revenue Recognition',
    severity: 'high',
    title: 'Revenue recognition changes',
    description: 'Classic revenue recognition replaced by Revenue Accounting and Reporting (RAR).',
    pattern: /\b(VF44|VBREVE)\b/i,
    patternType: 'source',
    remediation: 'Migrate to Revenue Accounting and Reporting (RAR) for IFRS 15.',
    simplificationId: 'S4TWL-SD-REV-001',
  },

  // ── Returns Management ─────────────────────────────────────
  {
    id: 'SIMPL-SD-020',
    category: 'SD - Returns',
    severity: 'medium',
    title: 'Advanced Returns Management available',
    description: 'S/4HANA offers Advanced Returns Management beyond classic returns.',
    pattern: /\bVRMA\b/i,
    patternType: 'source',
    remediation: 'Evaluate Advanced Returns Management for improved returns processing.',
    simplificationId: 'S4TWL-SD-RET-001',
  },
];
