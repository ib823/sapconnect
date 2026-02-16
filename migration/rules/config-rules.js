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
 * Configuration & Customizing Simplification Rules
 *
 * Covers: IMG activities, SPRO transactions, BC Sets, customizing tables,
 * org structure changes, number ranges, posting keys, document types,
 * and cross-module configuration impacts in S/4HANA.
 */

module.exports = [
  // ── IMG / SPRO General ─────────────────────────────────────────
  {
    id: 'SIMPL-CFG-001',
    category: 'Configuration - IMG',
    severity: 'high',
    title: 'IMG activity path changes in S/4HANA',
    description: 'Many IMG (Implementation Guide) paths restructured in S/4HANA. SPRO activities may have moved or been removed.',
    pattern: /\b(SPRO|SCC4|SALE|OB52|OBYA)\b/i,
    patternType: 'source',
    remediation: 'Use S/4HANA SPRO or Fiori Manage Your Solution app to locate equivalent activities.',
    simplificationId: 'S4TWL-CFG-IMG-001',
  },
  {
    id: 'SIMPL-CFG-002',
    category: 'Configuration - BC Sets',
    severity: 'medium',
    title: 'BC Set transport for configuration',
    description: 'BC Sets (Business Configuration Sets) can automate config transport between systems.',
    pattern: /\b(SCPR3|SCPR20|BC_SET)\b/i,
    patternType: 'source',
    remediation: 'Use BC Sets (SCPR3/SCPR20) to package and transport customizing settings.',
    simplificationId: 'S4TWL-CFG-BCS-001',
  },

  // ── Finance Configuration ──────────────────────────────────────
  {
    id: 'SIMPL-CFG-003',
    category: 'Configuration - Finance',
    severity: 'high',
    title: 'Chart of Accounts restructuring',
    description: 'S/4HANA requires review of chart of accounts for BP integration and new GL account types.',
    pattern: /\b(OB13|OB53|SKA1|SKB1|T004)\b/i,
    patternType: 'source',
    remediation: 'Review chart of accounts for S/4HANA account type mapping (customer/vendor reconciliation accounts).',
    simplificationId: 'S4TWL-CFG-FI-001',
  },
  {
    id: 'SIMPL-CFG-004',
    category: 'Configuration - Finance',
    severity: 'high',
    title: 'Fiscal year variant configuration',
    description: 'Fiscal year variant (T009/T009B) must support non-leading ledgers in S/4HANA.',
    pattern: /\b(OB29|T009B?)\b/i,
    patternType: 'source',
    remediation: 'Review fiscal year variants for multi-ledger support. Ensure posting periods align.',
    simplificationId: 'S4TWL-CFG-FI-002',
  },
  {
    id: 'SIMPL-CFG-005',
    category: 'Configuration - Finance',
    severity: 'medium',
    title: 'Document type changes for universal journal',
    description: 'FI document types (T003) may need new number ranges for ACDOCA entries.',
    pattern: /\b(OBA7|T003)\b/i,
    patternType: 'source',
    remediation: 'Review document types and number ranges for ACDOCA universal journal posting.',
    simplificationId: 'S4TWL-CFG-FI-003',
  },
  {
    id: 'SIMPL-CFG-006',
    category: 'Configuration - Finance',
    severity: 'medium',
    title: 'Posting key simplification',
    description: 'Posting keys (T004) unchanged but usage context changes with BP and ACDOCA.',
    pattern: /\b(OB41|T004)\b/i,
    patternType: 'source',
    remediation: 'Verify posting key assignments for business partner reconciliation accounts.',
    simplificationId: 'S4TWL-CFG-FI-004',
  },
  {
    id: 'SIMPL-CFG-007',
    category: 'Configuration - Finance',
    severity: 'medium',
    title: 'Tax code configuration for S/4HANA',
    description: 'Tax codes (T007A) need review for new tax calculation procedures.',
    pattern: /\b(FTXP|OB40|T007A)\b/i,
    patternType: 'source',
    remediation: 'Review tax codes and tax calculation procedures for S/4HANA.',
    simplificationId: 'S4TWL-CFG-FI-005',
  },
  {
    id: 'SIMPL-CFG-008',
    category: 'Configuration - Finance',
    severity: 'low',
    title: 'Payment terms migration',
    description: 'Payment terms (T052) carry over but baseline date rules may need review.',
    pattern: /\b(OBB8|T052)\b/i,
    patternType: 'source',
    remediation: 'Verify payment terms and baseline date calculation for S/4HANA.',
    simplificationId: 'S4TWL-CFG-FI-006',
  },

  // ── Controlling Configuration ──────────────────────────────────
  {
    id: 'SIMPL-CFG-009',
    category: 'Configuration - Controlling',
    severity: 'high',
    title: 'Controlling area to company code assignment',
    description: 'S/4HANA requires 1:1 mapping between controlling area and company code for leading ledger.',
    pattern: /\b(OKKP|OX06|TKA01|TKA02)\b/i,
    patternType: 'source',
    remediation: 'Ensure controlling area is assigned 1:1 to company codes. Cross-company code cost allocation may need redesign.',
    simplificationId: 'S4TWL-CFG-CO-001',
  },
  {
    id: 'SIMPL-CFG-010',
    category: 'Configuration - Controlling',
    severity: 'high',
    title: 'Cost element category changes',
    description: 'Primary/secondary cost elements now derived from GL accounts in S/4HANA (no separate CSKA/CSKB).',
    pattern: /\b(KA01|KA06|CSKA|CSKB)\b/i,
    patternType: 'source',
    remediation: 'Cost elements are auto-created from GL accounts. Review GL account master for CO relevance flag.',
    simplificationId: 'S4TWL-CFG-CO-002',
  },
  {
    id: 'SIMPL-CFG-011',
    category: 'Configuration - Controlling',
    severity: 'medium',
    title: 'Activity type and price configuration',
    description: 'Activity types (CSLA) and plan prices need review for ACDOCA integration.',
    pattern: /\b(KP26|KP27|CSLA)\b/i,
    patternType: 'source',
    remediation: 'Review activity type configuration and plan price calculation for ACDOCA.',
    simplificationId: 'S4TWL-CFG-CO-003',
  },

  // ── Materials Management Configuration ─────────────────────────
  {
    id: 'SIMPL-CFG-012',
    category: 'Configuration - MM',
    severity: 'high',
    title: 'Material type configuration for 40-char MATNR',
    description: 'Material types (T134) must accommodate 40-character material numbers in S/4HANA.',
    pattern: /\b(OMS2|T134)\b/i,
    patternType: 'source',
    remediation: 'Review material type configuration and number range assignments for 40-char material numbers.',
    simplificationId: 'S4TWL-CFG-MM-001',
  },
  {
    id: 'SIMPL-CFG-013',
    category: 'Configuration - MM',
    severity: 'medium',
    title: 'Plant and storage location configuration',
    description: 'Plant (T001W) and storage location (T001L) config carries over but WM-relevant settings change.',
    pattern: /\b(OX10|OX09|T001W|T001L)\b/i,
    patternType: 'source',
    remediation: 'Review plant/storage location settings for embedded EWM migration.',
    simplificationId: 'S4TWL-CFG-MM-002',
  },
  {
    id: 'SIMPL-CFG-014',
    category: 'Configuration - MM',
    severity: 'medium',
    title: 'Purchasing organization configuration',
    description: 'Purchasing org (T024E) and group (T024) settings need review for central procurement.',
    pattern: /\b(OX08|T024E?)\b/i,
    patternType: 'source',
    remediation: 'Review purchasing organization for central procurement and Ariba integration.',
    simplificationId: 'S4TWL-CFG-MM-003',
  },

  // ── Sales & Distribution Configuration ─────────────────────────
  {
    id: 'SIMPL-CFG-015',
    category: 'Configuration - SD',
    severity: 'high',
    title: 'Sales organization and distribution channel',
    description: 'Sales org (TVKO) and distribution channel (TVTW) config impacts credit management and ATP.',
    pattern: /\b(OVX5|TVKO|TVTW|TSPA)\b/i,
    patternType: 'source',
    remediation: 'Review sales org structure for S/4HANA credit management and advanced ATP.',
    simplificationId: 'S4TWL-CFG-SD-001',
  },
  {
    id: 'SIMPL-CFG-016',
    category: 'Configuration - SD',
    severity: 'medium',
    title: 'Sales document type configuration',
    description: 'Sales document types (TVAK) and item categories may need new incompletion procedures.',
    pattern: /\b(VOV8|TVAK|TVLK|TVFK)\b/i,
    patternType: 'source',
    remediation: 'Review sales doc types, delivery types, and billing types for S/4HANA changes.',
    simplificationId: 'S4TWL-CFG-SD-002',
  },
  {
    id: 'SIMPL-CFG-017',
    category: 'Configuration - SD',
    severity: 'medium',
    title: 'Pricing procedure configuration',
    description: 'Pricing procedures (T683S/T685) carry over but condition technique may need review.',
    pattern: /\b(V\/08|T683S|T685)\b/i,
    patternType: 'source',
    remediation: 'Review pricing procedures and condition types for S/4HANA compatibility.',
    simplificationId: 'S4TWL-CFG-SD-003',
  },

  // ── Number Ranges ──────────────────────────────────────────────
  {
    id: 'SIMPL-CFG-018',
    category: 'Configuration - Number Ranges',
    severity: 'high',
    title: 'Number range configuration for S/4HANA',
    description: 'Number ranges (NRIV) may need extension for new document types and 40-char material numbers.',
    pattern: /\b(SNRO|FBN1|NRIV)\b/i,
    patternType: 'source',
    remediation: 'Review and extend number ranges for ACDOCA documents, BP numbers, and material numbers.',
    simplificationId: 'S4TWL-CFG-NR-001',
  },

  // ── Cross-Module Configuration ─────────────────────────────────
  {
    id: 'SIMPL-CFG-019',
    category: 'Configuration - Cross Module',
    severity: 'high',
    title: 'Output management configuration',
    description: 'Classic output determination (NACE) being replaced by Output Management framework.',
    pattern: /\b(NACE|NACH|NACD)\b/i,
    patternType: 'source',
    remediation: 'Migrate output types to S/4HANA Output Management with BRF+ rules.',
    simplificationId: 'S4TWL-CFG-XM-001',
  },
  {
    id: 'SIMPL-CFG-020',
    category: 'Configuration - Cross Module',
    severity: 'medium',
    title: 'Credit management configuration migration',
    description: 'Classic FI credit management (FD32) replaced by SAP Credit Management (UKM).',
    pattern: /\b(FD32|OVA8|T014|UKM_)\b/i,
    patternType: 'source',
    remediation: 'Migrate to SAP Credit Management (UKM). Configure credit segments and rules.',
    simplificationId: 'S4TWL-CFG-XM-002',
  },
];
