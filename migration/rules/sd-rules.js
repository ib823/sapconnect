/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Sales & Distribution (SD) Simplification Rules
 *
 * Covers: Output management, credit management, pricing,
 * ATP, billing, delivery, shipping, sales order processing,
 * partner determination, rebate processing, revenue recognition,
 * returns & complaints, foreign trade, sales contracts,
 * variant configuration, cross-module integration, text determination.
 *
 * 65 rules total (SIMPL-SD-001 through SIMPL-SD-065).
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

  // ════════════════════════════════════════════════════════════
  //  NEW RULES (SIMPL-SD-021 onward)
  // ════════════════════════════════════════════════════════════

  // ── Sales Order Processing ─────────────────────────────────
  {
    id: 'SIMPL-SD-021',
    category: 'SD - Sales Order Processing',
    severity: 'medium',
    title: 'Sales document type configuration changes',
    description:
      'Sales document types (VOV8/TVAK) have new fields and changed control parameters in S/4HANA. ' +
      'Number range assignments and document type behaviour may differ.',
    pattern: /\b(VOV8|TVAK|TVAP|AUART)\b/i,
    patternType: 'source',
    remediation:
      'Review document type customizing in VOV8. Validate number range assignments and new control flags.',
  },
  {
    id: 'SIMPL-SD-022',
    category: 'SD - Sales Order Processing',
    severity: 'medium',
    title: 'Incompletion procedure changes',
    description:
      'Incompletion procedures (OVA2/V45A) are adjusted for S/4HANA mandatory fields. ' +
      'New incompletion checks are added for Business Partner and output management.',
    pattern: /\b(OVA2|V45A|INCOMP_LOG|V45S_COMPLETE)\b/i,
    patternType: 'source',
    remediation:
      'Review incompletion procedures. Add BP-specific and output management incompleteness checks.',
  },
  {
    id: 'SIMPL-SD-023',
    category: 'SD - Sales Order Processing',
    severity: 'medium',
    title: 'Sales document copy control changes',
    description:
      'Copy control routines (VTAA/VTLA/VTFA) have new requirements and data transfer fields in S/4HANA. ' +
      'Custom copy routines may need adjustment.',
    pattern: /\b(VTAA|VTLA|VTFA|VTFL)\b/i,
    patternType: 'source',
    remediation:
      'Review copy control settings and custom copy routines. Verify all data transfer requirements are met.',
  },
  {
    id: 'SIMPL-SD-024',
    category: 'SD - Sales Order Processing',
    severity: 'low',
    title: 'Sales order status management simplified',
    description:
      'Status management for sales documents uses the simplified VBUK/VBUP logic. ' +
      'Overall status fields are now calculated in real time and not stored redundantly.',
    pattern: /\b(VBUK|VBUP)\b/i,
    patternType: 'source',
    remediation:
      'Replace direct VBUK/VBUP access with CDS views (I_SalesDocument, I_SalesDocumentItem) or APIs.',
  },
  {
    id: 'SIMPL-SD-025',
    category: 'SD - Sales Order Processing',
    severity: 'high',
    title: 'Sales document flow table restructured',
    description:
      'VBFA (document flow) has structural changes. Some index tables are removed and ' +
      'CDS views are the preferred access path.',
    pattern: /\bVBFA\b/i,
    patternType: 'source',
    remediation:
      'Use CDS view I_SalesDocumentFlow or API_SALES_ORDER_SRV instead of direct VBFA table reads.',
  },

  // ── Pricing (extended) ────────────────────────────────────
  {
    id: 'SIMPL-SD-026',
    category: 'SD - Pricing',
    severity: 'high',
    title: 'Condition technique access sequence changes',
    description:
      'Custom condition tables (Annn) and access sequences have structural restrictions in S/4HANA. ' +
      'Maximum key length and allowed field catalogs differ.',
    pattern: /\b(V\/0[0-9]|T685[A-Z]?|T681[A-Z]?)\b/i,
    patternType: 'source',
    remediation:
      'Review custom condition tables and access sequences. Validate field catalogs against S/4HANA restrictions.',
  },
  {
    id: 'SIMPL-SD-027',
    category: 'SD - Pricing',
    severity: 'medium',
    title: 'Pricing scale basis and calculation type changes',
    description:
      'Certain scale basis types and calculation types in pricing procedures are deprecated or changed. ' +
      'Group conditions and cumulation logic are affected.',
    pattern: /\b(KSCHL|KOAID|KRECH|KSTBS)\b/i,
    patternType: 'source',
    remediation:
      'Review pricing procedure calculation types and scale configurations. Validate group conditions.',
  },
  {
    id: 'SIMPL-SD-028',
    category: 'SD - Pricing',
    severity: 'medium',
    title: 'Pricing condition maintenance via Fiori',
    description:
      'Condition record maintenance (VK11/VK12/VK13) is supplemented by Fiori apps. ' +
      'Custom transaction variants may need Fiori equivalents.',
    pattern: /\b(VK11|VK12|VK13|VK31|VK32|VK33)\b/i,
    patternType: 'source',
    remediation:
      'Evaluate Fiori apps for condition maintenance (e.g., F1604). Retire custom transaction variants where possible.',
  },

  // ── Billing (extended) ────────────────────────────────────
  {
    id: 'SIMPL-SD-029',
    category: 'SD - Billing',
    severity: 'high',
    title: 'Inter-company billing process changes',
    description:
      'Inter-company billing (IV transactions) and inter-company pricing have changed. ' +
      'Condition type IV01 handling and PI document creation differ in S/4HANA.',
    pattern: /\b(IV01|IV02|VBRK_IC|INTERCOMPANY)\b/i,
    patternType: 'source',
    remediation:
      'Review inter-company billing configuration and pricing. Test PI document creation end-to-end.',
  },
  {
    id: 'SIMPL-SD-030',
    category: 'SD - Billing',
    severity: 'medium',
    title: 'Milestone billing configuration changes',
    description:
      'Milestone billing plans and date-based billing plans have UI and processing changes. ' +
      'Custom billing plan types and milestone functions need review.',
    pattern: /\b(FPLA|FPLNR|MILESTONE_BILLING|BAPI_BILLINGPLAN)\b/i,
    patternType: 'source',
    remediation:
      'Review billing plan types and milestone definitions. Validate custom billing plan logic.',
  },
  {
    id: 'SIMPL-SD-031',
    category: 'SD - Billing',
    severity: 'medium',
    title: 'Resource-related billing integration changed',
    description:
      'Resource-related billing (DP91/DP90) for PS and service orders has changed integration points ' +
      'with SD billing in S/4HANA.',
    pattern: /\b(DP91|DP90|DPR_|DPRB)\b/i,
    patternType: 'source',
    remediation:
      'Review resource-related billing configuration and dynamic item processor profiles.',
  },
  {
    id: 'SIMPL-SD-032',
    category: 'SD - Billing',
    severity: 'medium',
    title: 'Billing due list processing changed',
    description:
      'VF04 (billing due list) has Fiori app equivalents and changed selection parameters. ' +
      'Batch jobs using VF04 variants need review.',
    pattern: /\b(VF04|BILLING_DUE_LIST|SD_BILLING_DUE)\b/i,
    patternType: 'source',
    remediation:
      'Migrate VF04 batch jobs to Fiori-based billing due list or background scheduling via API.',
  },

  // ── Shipping (extended) ───────────────────────────────────
  {
    id: 'SIMPL-SD-033',
    category: 'SD - Shipping',
    severity: 'medium',
    title: 'Delivery split and grouping changes',
    description:
      'Delivery split criteria and delivery grouping (VEKP/VEPO) have changed. ' +
      'Handling unit management is integrated differently in S/4HANA.',
    pattern: /\b(VEKP|VEPO|HU_PACKING|HANDLING_UNIT)\b/i,
    patternType: 'source',
    remediation:
      'Review delivery split rules and handling unit integration. Use Fiori apps for packing.',
  },
  {
    id: 'SIMPL-SD-034',
    category: 'SD - Shipping',
    severity: 'medium',
    title: 'Picking and warehouse integration changes',
    description:
      'Picking via VL06P and WM/EWM integration has changed. Classic WM (LE-WM) is replaced by ' +
      'Stock Room Management or Embedded EWM.',
    pattern: /\b(VL06P|VL06O|LTAK|LTAP|WM_TO_CREATE)\b/i,
    patternType: 'source',
    remediation:
      'Evaluate EWM or Stock Room Management for warehouse integration. Review picking processes.',
  },
  {
    id: 'SIMPL-SD-035',
    category: 'SD - Shipping',
    severity: 'high',
    title: 'Goods issue posting changes',
    description:
      'Goods issue for deliveries (VL02N, PGI) has changed posting logic. ' +
      'Material document creation uses new BAPI/API interfaces.',
    pattern: /\b(VL02N.*PGI|WS_DELIVERY_UPDATE_2|BAPI_INB_DELIVERY_SAVERPL)\b/i,
    patternType: 'source',
    remediation:
      'Use API_OUTBOUND_DELIVERY_SRV for goods issue. Review custom PGI user exits.',
  },
  {
    id: 'SIMPL-SD-036',
    category: 'SD - Shipping',
    severity: 'medium',
    title: 'Shipping point determination logic changed',
    description:
      'Shipping point determination (OVL2) considers new fields from BP address and plant data. ' +
      'Custom shipping point determination logic may need adjustment.',
    pattern: /\b(OVL2|TVST|T001W_VSTEL|SHIPPING_POINT_DET)\b/i,
    patternType: 'source',
    remediation:
      'Review shipping point determination rules. Validate BP address integration in determination logic.',
  },
  {
    id: 'SIMPL-SD-037',
    category: 'SD - Shipping',
    severity: 'low',
    title: 'Route determination and scheduling changes',
    description:
      'Route determination (T-codes VA00 route maint.) and delivery scheduling consider ' +
      'Transportation Management integration in S/4HANA.',
    pattern: /\b(TVRO|TROUTE|VA00|T_ROUTE_DET)\b/i,
    patternType: 'source',
    remediation:
      'Review route determination. Evaluate embedded TM integration for advanced scheduling.',
  },

  // ── Credit Management (extended) ──────────────────────────
  {
    id: 'SIMPL-SD-038',
    category: 'SD - Credit Management',
    severity: 'critical',
    title: 'Credit limit check integration with SAP Credit Management',
    description:
      'Credit limit checks during sales order processing use SAP Credit Management (FIN-FSCM-CR) ' +
      'instead of classic SD credit checks (OVA8). Credit groups and risk categories are remapped.',
    pattern: /\b(OVA8|CRED_CHECK|SD_CREDIT_CHECK|T691F)\b/i,
    patternType: 'source',
    remediation:
      'Reconfigure credit checks using SAP Credit Management. Map credit control areas, risk categories, and credit groups.',
  },
  {
    id: 'SIMPL-SD-039',
    category: 'SD - Credit Management',
    severity: 'high',
    title: 'Credit master data migration to BP',
    description:
      'Credit master data is now maintained via Business Partner (BP) credit segment, not KNB1/KNKK. ' +
      'Transaction FD32 is unavailable; UKM_BP_MAINTAIN replaces it.',
    pattern: /\b(FD33|KNB1.*CRDT|KNKK_READ|FD32_CALL)\b/i,
    patternType: 'source',
    remediation:
      'Migrate credit master maintenance to UKM_BP_MAINTAIN or Fiori app Manage Business Partner.',
  },

  // ── Output Management (extended) ──────────────────────────
  {
    id: 'SIMPL-SD-040',
    category: 'SD - Output Management',
    severity: 'high',
    title: 'NACE output configuration deprecated',
    description:
      'Transaction NACE for output type configuration is replaced by BRF+ output parameter ' +
      'determination. Output types, partner functions for output, and medium assignments move to BRF+.',
    pattern: /\b(NACE|V_TNAPR|OUTPUT_TYPE_DET)\b/i,
    patternType: 'source',
    remediation:
      'Configure output determination via BRF+ workbench. Migrate NACE output types to BRF+ rules.',
  },
  {
    id: 'SIMPL-SD-041',
    category: 'SD - Output Management',
    severity: 'medium',
    title: 'Adobe Forms integration for SD output',
    description:
      'Adobe Forms replace SAPscript and SmartForms as the primary form technology. ' +
      'Form templates use Adobe LiveCycle Designer and are managed via SFP/SE78.',
    pattern: /\b(SFP|FP_JOB_OPEN|FP_FUNCTION_MODULE_NAME|ADS_SR)\b/i,
    patternType: 'source',
    remediation:
      'Ensure Adobe Document Services (ADS) is configured. Create form templates in Adobe LiveCycle Designer.',
  },
  {
    id: 'SIMPL-SD-042',
    category: 'SD - Output Management',
    severity: 'medium',
    title: 'BRF+ rules for output channel determination',
    description:
      'BRF+ decision tables replace condition-technique-based output determination for channel ' +
      '(print, email, EDI, XML) and template selection.',
    pattern: /\b(BRF_|FDT_|BRF_PLUS|CL_FDT_FUNCTION)\b/i,
    patternType: 'source',
    remediation:
      'Create BRF+ applications and decision tables for output channel and template determination.',
  },

  // ── Availability Check (extended) ─────────────────────────
  {
    id: 'SIMPL-SD-043',
    category: 'SD - ATP',
    severity: 'high',
    title: 'ATP rescheduling and delivery proposal changes',
    description:
      'Rescheduling (V_V2) and delivery proposals in sales order scheduling use aATP-based logic. ' +
      'Classic MRP-based ATP rescheduling may produce different results.',
    pattern: /\b(V_V2|RESCHEDULING|SD_SCHEDULE_LINE|VBEP_CONFIRM)\b/i,
    patternType: 'source',
    remediation:
      'Test rescheduling runs with aATP. Validate delivery dates and confirmed quantities.',
  },
  {
    id: 'SIMPL-SD-044',
    category: 'SD - ATP',
    severity: 'medium',
    title: 'Product allocation removed from classic ATP',
    description:
      'Classic product allocation (ATPCS/CO06 based) is removed. Product allocation is handled ' +
      'via aATP product allocation or S/4HANA Demand-Driven Replenishment.',
    pattern: /\b(PRODUCT_ALLOC|MT61|CM01|ATPCHECK_ALLOC)\b/i,
    patternType: 'source',
    remediation:
      'Implement product allocation via aATP. Configure allocation objects and consumption logic.',
  },

  // ── Foreign Trade ─────────────────────────────────────────
  {
    id: 'SIMPL-SD-045',
    category: 'SD - Foreign Trade',
    severity: 'medium',
    title: 'Foreign trade data in sales documents changed',
    description:
      'Foreign trade/customs data fields in VBAK/VBAP (STAWN, HESSION, LANDEX) have new derivation ' +
      'logic. Legal control and embargo checks are integrated differently.',
    pattern: /\b(STAWN|HESSION|LANDEX|GTS_|SGTMP)\b/i,
    patternType: 'source',
    remediation:
      'Review foreign trade field derivations. Evaluate SAP GTS integration for compliance checks.',
  },
  {
    id: 'SIMPL-SD-046',
    category: 'SD - Foreign Trade',
    severity: 'medium',
    title: 'Intrastat reporting changes',
    description:
      'Intrastat declarations (VGM1/VGM2) have changed data sources and reporting logic. ' +
      'EU sales list and Intrastat use CDS-based extraction.',
    pattern: /\b(VGM1|VGM2|INTRASTAT|EU_SALES_LIST)\b/i,
    patternType: 'source',
    remediation:
      'Review Intrastat configuration. Use CDS-based Intrastat extraction reports.',
  },
  {
    id: 'SIMPL-SD-047',
    category: 'SD - Foreign Trade',
    severity: 'low',
    title: 'Preference processing and origin determination changed',
    description:
      'Preference processing for free trade agreements and origin determination use SAP GTS ' +
      'or integrated preference logic in S/4HANA.',
    pattern: /\b(PREFERENCE_DET|GTS_PREF|ORIGIN_DET|EINA_PREF)\b/i,
    patternType: 'source',
    remediation:
      'Evaluate embedded preference processing or SAP GTS for origin and preference determination.',
  },

  // ── Sales Contracts ───────────────────────────────────────
  {
    id: 'SIMPL-SD-048',
    category: 'SD - Sales Contracts',
    severity: 'medium',
    title: 'Value contract processing changes',
    description:
      'Value contracts (WK1/WK2) have changed release order handling and target value tracking. ' +
      'Custom release order checks may need adjustment.',
    pattern: /\b(WK1|WK2|CONTRACT_VALUE|VBKD_CNTRL)\b/i,
    patternType: 'source',
    remediation:
      'Review value contract configuration and release order procedures. Validate target value tracking.',
  },
  {
    id: 'SIMPL-SD-049',
    category: 'SD - Sales Contracts',
    severity: 'medium',
    title: 'Quantity contract release order changes',
    description:
      'Quantity contracts (MK type) and their release orders have enhanced quantity tracking in S/4HANA. ' +
      'Contract determination during order entry uses new logic.',
    pattern: /\b(MK_CONTRACT|QTY_CONTRACT|CONTRACT_DET|VEDA)\b/i,
    patternType: 'source',
    remediation:
      'Review quantity contract configuration and contract determination procedure. Test release order creation.',
  },
  {
    id: 'SIMPL-SD-050',
    category: 'SD - Sales Contracts',
    severity: 'low',
    title: 'Scheduling agreement processing changes',
    description:
      'Scheduling agreements (VA31/VA32) with delivery schedules have changed JIT/forecast schedule ' +
      'processing and integration with MRP.',
    pattern: /\b(VA31|VA32|VBEP_SCHED|SCHEDULE_AGREEMENT)\b/i,
    patternType: 'source',
    remediation:
      'Review scheduling agreement configuration. Validate JIT/forecast schedule generation and MRP integration.',
  },

  // ── Returns & Complaints (extended) ───────────────────────
  {
    id: 'SIMPL-SD-051',
    category: 'SD - Returns',
    severity: 'high',
    title: 'Returns order refund processing changed',
    description:
      'Returns order types (RE) and subsequent credit memo processing have new document flow rules. ' +
      'Automatic refund determination and approval workflows are available.',
    pattern: /\b(RE_RETURN|RETURN_ORDER|VA01.*RE|SD_RETURN)\b/i,
    patternType: 'source',
    remediation:
      'Review returns order configuration and credit memo automation. Evaluate Advanced Returns Management.',
  },
  {
    id: 'SIMPL-SD-052',
    category: 'SD - Returns',
    severity: 'medium',
    title: 'Credit and debit memo request changes',
    description:
      'Credit memo requests (CR) and debit memo requests (DR) have changed approval and release ' +
      'procedures. Reason codes and blocking logic differ in S/4HANA.',
    pattern: /\b(CREDIT_MEMO_REQ|DEBIT_MEMO_REQ|VA01.*(CR|DR)|VBTYP.*[GH])\b/i,
    patternType: 'source',
    remediation:
      'Review credit/debit memo request configuration. Configure reason codes and approval workflows.',
  },
  {
    id: 'SIMPL-SD-053',
    category: 'SD - Returns',
    severity: 'medium',
    title: 'Complaint processing with quality notifications',
    description:
      'SD complaint handling integrates with QM quality notifications in S/4HANA. ' +
      'Custom complaint processing logic (VIQMEL) needs integration review.',
    pattern: /\b(VIQMEL|QM_NOTIFICATION|COMPLAINT_|Q[NM]01)\b/i,
    patternType: 'source',
    remediation:
      'Review complaint-to-quality notification integration. Validate custom complaint processing logic.',
  },

  // ── Revenue Recognition (extended) ────────────────────────
  {
    id: 'SIMPL-SD-054',
    category: 'SD - Revenue Recognition',
    severity: 'critical',
    title: 'RAR integration mandatory for event-based revenue recognition',
    description:
      'Event-based revenue recognition (VBREVE/VF44) is replaced by Revenue Accounting and Reporting ' +
      '(RAR). IFRS 15 / ASC 606 compliance requires RAR configuration. Classic SD revenue recognition ' +
      'tables are deprecated.',
    pattern: /\b(VBREVE|VBREVK|EVENT_BASED_REV|FARR_|RAR_LEGACY)\b/i,
    patternType: 'source',
    remediation:
      'Implement RAR for revenue recognition. Configure performance obligations and SSP determination.',
  },
  {
    id: 'SIMPL-SD-055',
    category: 'SD - Revenue Recognition',
    severity: 'high',
    title: 'Revenue recognition account determination changed',
    description:
      'Revenue recognition account determination uses RAR-specific account keys instead of classic ' +
      'SD account determination (VKOA). Deferred revenue and contract asset accounts are RAR-managed.',
    pattern: /\b(VKOA|REV_REC_ACCT|ACCT_DET_REV)\b/i,
    patternType: 'source',
    remediation:
      'Configure RAR account determination. Map revenue accounts, contract assets, and deferred revenue.',
  },

  // ── Variant Configuration ─────────────────────────────────
  {
    id: 'SIMPL-SD-056',
    category: 'SD - Variant Configuration',
    severity: 'medium',
    title: 'Variant configuration in sales orders changed',
    description:
      'Variant configuration (CU41/CU42) in sales orders uses Advanced Variant Configuration (AVC) ' +
      'in S/4HANA. Classic VC engine is still supported but AVC is recommended.',
    pattern: /\b(CU41|CU42|LOVC_|CUOBJ|BAPI_CONFIG)\b/i,
    patternType: 'source',
    remediation:
      'Evaluate AVC migration. Review VC dependencies, constraints, and pricing integration.',
  },
  {
    id: 'SIMPL-SD-057',
    category: 'SD - Variant Configuration',
    severity: 'medium',
    title: 'Make-to-order (MTO) integration changed',
    description:
      'Make-to-order scenarios with individual customer stock and individual purchase orders ' +
      'have changed account assignment and settlement logic in S/4HANA.',
    pattern: /\b(MTO_|MAKE_TO_ORDER|E_SOBKZ|ABLAD_MTO)\b/i,
    patternType: 'source',
    remediation:
      'Review MTO configuration including account assignment categories and settlement profiles.',
  },
  {
    id: 'SIMPL-SD-058',
    category: 'SD - Variant Configuration',
    severity: 'low',
    title: 'Engineer-to-order (ETO) process changes',
    description:
      'Engineer-to-order with project-based sales (PS-SD integration) has new planning and costing ' +
      'integration. WBS element assignment in sales orders uses updated APIs.',
    pattern: /\b(ETO_|ENGINEER_TO_ORDER|PS_SD_|WBS_ELEMENT_SD)\b/i,
    patternType: 'source',
    remediation:
      'Review ETO configuration and PS integration. Validate WBS element assignment and project costing.',
  },

  // ── Cross-Module Integration ──────────────────────────────
  {
    id: 'SIMPL-SD-059',
    category: 'SD - Cross-Module Integration',
    severity: 'high',
    title: 'SD-FI integration changes (account determination)',
    description:
      'SD-FI account determination (VKOA/OV/OVK) has new account keys and material account assignment ' +
      'groups. Revenue account determination considers the universal journal (ACDOCA).',
    pattern: /\b(VKOA|OV[0-9]{2}|OVK[0-9]|SD_FI_ACCT|ACDOCA_SD)\b/i,
    patternType: 'source',
    remediation:
      'Review SD-FI account determination. Validate account keys against universal journal requirements.',
  },
  {
    id: 'SIMPL-SD-060',
    category: 'SD - Cross-Module Integration',
    severity: 'medium',
    title: 'SD-MM integration for procurement-triggered scenarios',
    description:
      'Third-party order processing and individual purchase orders triggered from SD have changed ' +
      'integration points. Schedule line categories and item categories controlling procurement differ.',
    pattern: /\b(THIRD_PARTY|SD_MM_PROC|BANF_SD|ME21N_SD|PSTYV.*TAB)\b/i,
    patternType: 'source',
    remediation:
      'Review item category/schedule line category configuration for procurement triggers. Test third-party flow end-to-end.',
  },
  {
    id: 'SIMPL-SD-061',
    category: 'SD - Cross-Module Integration',
    severity: 'medium',
    title: 'SD-PP integration for production order triggers',
    description:
      'Make-to-order and make-to-stock production triggers from SD (MRP type, strategy group) ' +
      'have updated planning integration and requirement transfer logic.',
    pattern: /\b(SD_PP_|MRP_SD|STRATEGY_GROUP|REQUIREMENT_TRANSFER)\b/i,
    patternType: 'source',
    remediation:
      'Review strategy groups and planning strategies. Validate requirements transfer from sales orders to production.',
  },

  // ── Text Determination ────────────────────────────────────
  {
    id: 'SIMPL-SD-062',
    category: 'SD - Text Determination',
    severity: 'medium',
    title: 'Sales document text determination procedure changes',
    description:
      'Text determination procedures (VOTXN) for sales documents use updated text objects (VBBK/VBBP). ' +
      'SAPscript text storage (STXH/STXL) may be replaced by note-based text storage.',
    pattern: /\b(VOTXN|STXH|STXL|READ_TEXT.*VBBK|READ_TEXT.*VBBP)\b/i,
    patternType: 'source',
    remediation:
      'Review text determination procedures and text IDs. Evaluate migration from SAPscript text to notes.',
  },
  {
    id: 'SIMPL-SD-063',
    category: 'SD - Text Determination',
    severity: 'low',
    title: 'Output text and form text references changed',
    description:
      'Text references used in output forms (order confirmations, invoices, delivery notes) follow ' +
      'new naming conventions. Text modules for Adobe Forms differ from SAPscript includes.',
    pattern: /\b(TEXT_MODULE|INCLUDE_TEXT|SO10.*SD|FORM_TEXT_REF)\b/i,
    patternType: 'source',
    remediation:
      'Migrate text modules to Adobe Forms text module format. Update text references in form templates.',
  },

  // ── Partner Determination (extended) ──────────────────────
  {
    id: 'SIMPL-SD-064',
    category: 'SD - Partner',
    severity: 'high',
    title: 'BP-based partner functions replace customer-based partners',
    description:
      'Partner functions (TPAR/TPART) are now based on Business Partner roles instead of customer ' +
      'master (KNA1). Sold-to, ship-to, bill-to, payer all reference BP numbers.',
    pattern: /\b(TPAR[T]?|KNA1.*PARTNER|PARTNER_ROLE_MAP|PAI_PARTNER)\b/i,
    patternType: 'source',
    remediation:
      'Ensure BP-customer mapping is complete. Review partner determination procedures for BP role assignments.',
  },
  {
    id: 'SIMPL-SD-065',
    category: 'SD - Partner',
    severity: 'medium',
    title: 'Contact person management via BP relationships',
    description:
      'Contact persons in sales documents are maintained via BP relationship categories instead of ' +
      'KNVK (customer contact person). Custom contact person logic needs BP adaptation.',
    pattern: /\b(KNVK|CONTACT_PERSON|CP_SD|ADDR_CONTACT)\b/i,
    patternType: 'source',
    remediation:
      'Migrate contact person data to BP relationships. Update partner determination to use BP contact roles.',
  },
];
