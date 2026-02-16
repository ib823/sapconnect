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
 * Project System (PS) Simplification Rules
 *
 * Covers: WBS elements, network activities, milestones, project builder,
 * PS info system, earned value management, billing, settlement, budgeting.
 */

module.exports = [
  // ── WBS Elements ─────────────────────────────────────────────
  {
    id: 'SIMPL-PS-001',
    category: 'Project System - WBS',
    severity: 'high',
    title: 'WBS element master tables changed',
    description: 'PRPS (WBS element master) has new fields and changed key structure in S/4HANA.',
    pattern: /\b(PRPS|PROJ)\b/i,
    patternType: 'source',
    remediation: 'Use CDS views I_Project / I_WorkBreakdownStructureElement or API_PROJECT_V2.',
    simplificationId: 'S4TWL-PS-WBS-001',
  },
  {
    id: 'SIMPL-PS-002',
    category: 'Project System - WBS',
    severity: 'medium',
    title: 'WBS BAPI changes',
    description: 'BAPI_PS_PRECOMMIT and BAPI_BUS2054_* have changed parameters in S/4HANA.',
    pattern: /\b(BAPI_PS_PRECOMMIT|BAPI_BUS2054_\w+)\b/i,
    patternType: 'source',
    remediation: 'Review BAPI parameters or use API_PROJECT_V2 OData service.',
    simplificationId: 'S4TWL-PS-WBS-002',
  },
  {
    id: 'SIMPL-PS-003',
    category: 'Project System - WBS',
    severity: 'medium',
    title: 'Project definition BAPI changes',
    description: 'BAPI_BUS2001_* for project definitions changed in S/4HANA.',
    pattern: /\bBAPI_BUS2001_\w+/i,
    patternType: 'source',
    remediation: 'Use API_PROJECT_V2 or review BAPI parameter changes.',
    simplificationId: 'S4TWL-PS-WBS-003',
  },
  {
    id: 'SIMPL-PS-004',
    category: 'Project System - WBS',
    severity: 'low',
    title: 'Project Builder (CJ20N) UI changes',
    description: 'Project Builder transaction CJ20N has Fiori equivalent apps.',
    pattern: /\bCJ20N\b/i,
    patternType: 'source',
    remediation: 'Consider Fiori apps Manage Projects (F2678) or Monitor Projects.',
    simplificationId: 'S4TWL-PS-WBS-004',
  },

  // ── Networks ─────────────────────────────────────────────────
  {
    id: 'SIMPL-PS-005',
    category: 'Project System - Networks',
    severity: 'high',
    title: 'Network activity tables changed',
    description: 'AFVC (network activity), AFVV (general operation data) changed for S/4HANA.',
    pattern: /\b(AFVC|AFVV|AFVU|AFFL)\b/i,
    patternType: 'source',
    remediation: 'Use CDS views or API_NETWORK for network activities.',
    simplificationId: 'S4TWL-PS-NET-001',
  },
  {
    id: 'SIMPL-PS-006',
    category: 'Project System - Networks',
    severity: 'medium',
    title: 'Network BAPI changes',
    description: 'BAPI_NETWORK_* and BAPI_ALM_ORDER_* have changed in S/4HANA.',
    pattern: /\b(BAPI_NETWORK_\w+|BAPI_ALM_ORDER_\w+)\b/i,
    patternType: 'source',
    remediation: 'Review BAPI parameters for S/4HANA compatibility.',
    simplificationId: 'S4TWL-PS-NET-002',
  },
  {
    id: 'SIMPL-PS-007',
    category: 'Project System - Networks',
    severity: 'medium',
    title: 'Network scheduling changes',
    description: 'Network scheduling functions affected by MRP Live and embedded PP/DS.',
    pattern: /\b(CN24|CN25|SAPLCNSC)\b/i,
    patternType: 'source',
    remediation: 'Review scheduling parameters for S/4HANA MRP Live integration.',
    simplificationId: 'S4TWL-PS-NET-003',
  },

  // ── Milestones ───────────────────────────────────────────────
  {
    id: 'SIMPL-PS-008',
    category: 'Project System - Milestones',
    severity: 'low',
    title: 'Milestone usage changes',
    description: 'Milestone functions (MSPT table) and billing plan integration changed.',
    pattern: /\bMSPT\b/i,
    patternType: 'source',
    remediation: 'Review milestone billing and progress analysis configuration.',
    simplificationId: 'S4TWL-PS-ML-001',
  },

  // ── PS Info System ───────────────────────────────────────────
  {
    id: 'SIMPL-PS-009',
    category: 'Project System - Info System',
    severity: 'high',
    title: 'PS info system reports removed',
    description: 'Classic PS info system reports (CN41N, CN42N, CN43N) replaced by Fiori apps.',
    pattern: /\b(CN41N|CN42N|CN43N|CNS40|CNS41|CNS42)\b/i,
    patternType: 'source',
    remediation: 'Use Fiori analytical apps for project reporting.',
    simplificationId: 'S4TWL-PS-INF-001',
  },
  {
    id: 'SIMPL-PS-010',
    category: 'Project System - Info System',
    severity: 'medium',
    title: 'PS summarization objects removed',
    description: 'CNS* summarization objects/databases removed in S/4HANA.',
    pattern: /\b(RPSCO|RPSQT)\b/i,
    patternType: 'source',
    remediation: 'Use ACDOCA for project cost data or CDS analytical views.',
    simplificationId: 'S4TWL-PS-INF-002',
  },

  // ── Earned Value Management ──────────────────────────────────
  {
    id: 'SIMPL-PS-011',
    category: 'Project System - Earned Value',
    severity: 'medium',
    title: 'Earned value calculation changes',
    description: 'Earned value management (CJ9E, CJ9K) now reads from ACDOCA.',
    pattern: /\b(CJ9E|CJ9K|CJ9BS)\b/i,
    patternType: 'source',
    remediation: 'Review earned value configuration for ACDOCA-based calculations.',
    simplificationId: 'S4TWL-PS-EVM-001',
  },
  {
    id: 'SIMPL-PS-012',
    category: 'Project System - Earned Value',
    severity: 'low',
    title: 'Progress analysis changes',
    description: 'Progress analysis methods may need reconfiguration for S/4HANA.',
    pattern: /\bCNE1\b/i,
    patternType: 'source',
    remediation: 'Review progress analysis configuration.',
    simplificationId: 'S4TWL-PS-EVM-002',
  },

  // ── Settlement ───────────────────────────────────────────────
  {
    id: 'SIMPL-PS-013',
    category: 'Project System - Settlement',
    severity: 'high',
    title: 'Project settlement to CO-PA changed',
    description: 'Project settlement receivers affected by CO-PA restructuring to ACDOCA.',
    pattern: /\b(CJ88|KO88.*PRJ|BAPI_PS_.*SETTLEMENT)\b/i,
    patternType: 'source',
    remediation: 'Review settlement rules for ACDOCA-based profitability analysis.',
    simplificationId: 'S4TWL-PS-SET-001',
  },
  {
    id: 'SIMPL-PS-014',
    category: 'Project System - Settlement',
    severity: 'medium',
    title: 'Results analysis changes',
    description: 'Results analysis (CJ9C) integration with ACDOCA changed.',
    pattern: /\bCJ9C\b/i,
    patternType: 'source',
    remediation: 'Review results analysis rules for S/4HANA.',
    simplificationId: 'S4TWL-PS-SET-002',
  },

  // ── Budgeting ────────────────────────────────────────────────
  {
    id: 'SIMPL-PS-015',
    category: 'Project System - Budgeting',
    severity: 'medium',
    title: 'Budget management changes',
    description: 'Budget profile and availability control changed for S/4HANA (CJ30, CJ40).',
    pattern: /\b(CJ30|CJ40|BPGE|BPJA)\b/i,
    patternType: 'source',
    remediation: 'Review budget profiles and availability control settings.',
    simplificationId: 'S4TWL-PS-BUD-001',
  },
  {
    id: 'SIMPL-PS-016',
    category: 'Project System - Budgeting',
    severity: 'low',
    title: 'Budget distribution changes',
    description: 'Budget distribution (CJ31, CJ32) and supplements changed.',
    pattern: /\b(CJ31|CJ32|CJ36)\b/i,
    patternType: 'source',
    remediation: 'Review budget distribution configuration.',
    simplificationId: 'S4TWL-PS-BUD-002',
  },

  // ── Billing ──────────────────────────────────────────────────
  {
    id: 'SIMPL-PS-017',
    category: 'Project System - Billing',
    severity: 'medium',
    title: 'PS billing integration changes',
    description: 'Project billing (DP90, DP91) integration with SD billing changed.',
    pattern: /\b(DP90|DP91|BAPI_PS_.*BILLING)\b/i,
    patternType: 'source',
    remediation: 'Review project billing configuration for S/4HANA SD changes.',
    simplificationId: 'S4TWL-PS-BIL-001',
  },

  // ── Claims Management ────────────────────────────────────────
  {
    id: 'SIMPL-PS-018',
    category: 'Project System - Claims',
    severity: 'low',
    title: 'Claims management changes',
    description: 'Claims management in PS (CLM*) has configuration changes.',
    pattern: /\bCLM_\w+/i,
    patternType: 'source',
    remediation: 'Review claims management configuration.',
    simplificationId: 'S4TWL-PS-CLM-001',
  },

  // ── PS Texts ─────────────────────────────────────────────────
  {
    id: 'SIMPL-PS-019',
    category: 'Project System - General',
    severity: 'low',
    title: 'PS text storage changes',
    description: 'Long text storage for PS objects changed from STXH/STXL.',
    pattern: /\bSTXH.*PROJ|STXL.*PROJ\b/i,
    patternType: 'source',
    remediation: 'Use standard text APIs for S/4HANA.',
    simplificationId: 'S4TWL-PS-TXT-001',
  },

  // ── Material Components ──────────────────────────────────────
  {
    id: 'SIMPL-PS-020',
    category: 'Project System - Materials',
    severity: 'medium',
    title: 'Material component assignment changes',
    description: 'RESB (reservation/dependent requirements) integration changed.',
    pattern: /\bRESB\b/i,
    patternType: 'source',
    remediation: 'Review material component handling in network activities.',
    simplificationId: 'S4TWL-PS-MAT-001',
  },

  // ── Capacity Planning ────────────────────────────────────────
  {
    id: 'SIMPL-PS-021',
    category: 'Project System - Capacity',
    severity: 'medium',
    title: 'Capacity planning integration with PP/DS',
    description: 'PS capacity planning now integrates with embedded PP/DS.',
    pattern: /\b(CM01|CM04|CM07|CM25)\b/i,
    patternType: 'source',
    remediation: 'Review capacity planning for embedded PP/DS integration.',
    simplificationId: 'S4TWL-PS-CAP-001',
  },

  // ── Project Versions ─────────────────────────────────────────
  {
    id: 'SIMPL-PS-022',
    category: 'Project System - Versions',
    severity: 'low',
    title: 'Project version management',
    description: 'Project versioning (CJ91) may need adjustment.',
    pattern: /\bCJ91\b/i,
    patternType: 'source',
    remediation: 'Review project version management setup.',
    simplificationId: 'S4TWL-PS-VER-001',
  },

  // ── Status Management ────────────────────────────────────────
  {
    id: 'SIMPL-PS-023',
    category: 'Project System - Status',
    severity: 'medium',
    title: 'System/user status changes',
    description: 'JEST/JSTO (status tables) behavior changed for PS objects.',
    pattern: /\b(JEST|JSTO).*PROJ\b/i,
    patternType: 'source',
    remediation: 'Review status management and status profiles.',
    simplificationId: 'S4TWL-PS-STS-001',
  },

  // ── Confirmation ─────────────────────────────────────────────
  {
    id: 'SIMPL-PS-024',
    category: 'Project System - Confirmation',
    severity: 'medium',
    title: 'Network confirmation changes',
    description: 'AFRU (confirmation table) and CN25 processing changed.',
    pattern: /\b(AFRU|CN25)\b/i,
    patternType: 'source',
    remediation: 'Review confirmation processing for S/4HANA.',
    simplificationId: 'S4TWL-PS-CNF-001',
  },

  // ── Cross-module Integration ─────────────────────────────────
  {
    id: 'SIMPL-PS-025',
    category: 'Project System - Integration',
    severity: 'high',
    title: 'PS-CO integration changes',
    description: 'PS cost reporting reads from ACDOCA. COEP/COBK no longer primary.',
    pattern: /\b(COEP|COBK).*PRJ\b/i,
    patternType: 'source',
    remediation: 'Use ACDOCA CDS views for project cost analysis.',
    simplificationId: 'S4TWL-PS-INT-001',
  },
  {
    id: 'SIMPL-PS-026',
    category: 'Project System - Integration',
    severity: 'medium',
    title: 'PS-MM purchase requisition changes',
    description: 'PR creation from network activities changed with new MM integration.',
    pattern: /\bEBAN.*PROJ|PROJ.*EBAN\b/i,
    patternType: 'source',
    remediation: 'Review PR generation from network activities.',
    simplificationId: 'S4TWL-PS-INT-002',
  },

  // ── cProject ─────────────────────────────────────────────────
  {
    id: 'SIMPL-PS-027',
    category: 'Project System - cProject',
    severity: 'high',
    title: 'cProject/RPM replaced by Enterprise Project Management',
    description: 'cProject and Resource & Portfolio Management replaced by EPM in S/4HANA.',
    pattern: /\b(CPROJECT|RPM_|DPR_)\b/i,
    patternType: 'source',
    remediation: 'Migrate to S/4HANA Enterprise Project Management (EPM).',
    simplificationId: 'S4TWL-PS-CPR-001',
  },

  // ── Investment Management ────────────────────────────────────
  {
    id: 'SIMPL-PS-028',
    category: 'Project System - Investment',
    severity: 'medium',
    title: 'Investment program integration',
    description: 'Investment programs (IM01-IM52) integration with PS changed.',
    pattern: /\b(IM01|IM27|IM52|IMPR)\b/i,
    patternType: 'source',
    remediation: 'Review investment management integration with PS.',
    simplificationId: 'S4TWL-PS-INV-001',
  },

  // ── Multi-level Confirmations ────────────────────────────────
  {
    id: 'SIMPL-PS-029',
    category: 'Project System - Confirmation',
    severity: 'low',
    title: 'Collective confirmation changes',
    description: 'Collective confirmation (CN28, CN29) functionality changed.',
    pattern: /\b(CN28|CN29)\b/i,
    patternType: 'source',
    remediation: 'Review collective confirmation processing.',
    simplificationId: 'S4TWL-PS-CNF-002',
  },

  // ── PS Currency ──────────────────────────────────────────────
  {
    id: 'SIMPL-PS-030',
    category: 'Project System - Currency',
    severity: 'medium',
    title: 'Project currency handling',
    description: 'Multiple currency handling in PS aligned with ACDOCA multi-currency.',
    pattern: /\bTCURR.*PROJ|PROJ.*TCURR\b/i,
    patternType: 'source',
    remediation: 'Review project currency configuration for ACDOCA alignment.',
    simplificationId: 'S4TWL-PS-CUR-001',
  },
];
