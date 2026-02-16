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
 * Quality Management (QM) Simplification Rules
 *
 * Covers: inspection lots, quality notifications, inspection plans,
 * results recording, quality certificates, stability studies,
 * QM in procurement/production/sales, digital manufacturing integration.
 */

module.exports = [
  // ── Inspection Lots ──────────────────────────────────────────
  {
    id: 'SIMPL-QM-001',
    category: 'Quality Management - Inspection Lots',
    severity: 'medium',
    title: 'Inspection lot table changes',
    description: 'QALS (inspection lot header) has new fields for S/4HANA integration.',
    pattern: /\b(QALS|QASR|QASE)\b/i,
    patternType: 'source',
    remediation: 'Use CDS views I_InspectionLot or API_INSPECTIONLOT_SRV.',
    simplificationId: 'S4TWL-QM-IL-001',
  },
  {
    id: 'SIMPL-QM-002',
    category: 'Quality Management - Inspection Lots',
    severity: 'medium',
    title: 'Inspection lot BAPI changes',
    description: 'BAPI_INSPLOT_* function modules have updated parameters.',
    pattern: /\bBAPI_INSPLOT_\w+/i,
    patternType: 'source',
    remediation: 'Review BAPI parameters or use OData API_INSPECTIONLOT_SRV.',
    simplificationId: 'S4TWL-QM-IL-002',
  },
  {
    id: 'SIMPL-QM-003',
    category: 'Quality Management - Inspection Lots',
    severity: 'low',
    title: 'Usage decision changes',
    description: 'QA11/QA12 usage decision transactions have Fiori equivalents.',
    pattern: /\b(QA11|QA12|QA13)\b/i,
    patternType: 'source',
    remediation: 'Consider Fiori app Record Usage Decisions (F5424).',
    simplificationId: 'S4TWL-QM-IL-003',
  },

  // ── Quality Notifications ────────────────────────────────────
  {
    id: 'SIMPL-QM-004',
    category: 'Quality Management - Notifications',
    severity: 'medium',
    title: 'Quality notification table changes',
    description: 'QMEL (notification header) and QMFE/QMUR (items/causes) changed.',
    pattern: /\b(QMEL|QMFE|QMUR|QMSM)\b/i,
    patternType: 'source',
    remediation: 'Use CDS views or API_QUALITYNOTIFICATION for notifications.',
    simplificationId: 'S4TWL-QM-QN-001',
  },
  {
    id: 'SIMPL-QM-005',
    category: 'Quality Management - Notifications',
    severity: 'medium',
    title: 'Notification BAPI changes',
    description: 'BAPI_QUALNOT_* BAPIs have updated interfaces.',
    pattern: /\bBAPI_QUALNOT_\w+/i,
    patternType: 'source',
    remediation: 'Use API_QUALITYNOTIFICATION OData service.',
    simplificationId: 'S4TWL-QM-QN-002',
  },
  {
    id: 'SIMPL-QM-006',
    category: 'Quality Management - Notifications',
    severity: 'low',
    title: 'QM notification type changes',
    description: 'Notification types Q1/Q2/Q3 configuration may need update.',
    pattern: /\b(QM01|QM02|QM03)\b/i,
    patternType: 'source',
    remediation: 'Review notification type configuration.',
    simplificationId: 'S4TWL-QM-QN-003',
  },

  // ── Inspection Plans ─────────────────────────────────────────
  {
    id: 'SIMPL-QM-007',
    category: 'Quality Management - Inspection Plans',
    severity: 'high',
    title: 'Inspection plan table structure changes',
    description: 'PLKO (task list header) and PLPO (task list operations) have structural changes.',
    pattern: /\b(PLKO|PLPO|PLMK|PLMZ)\b/i,
    patternType: 'source',
    remediation: 'Review inspection plan data model for S/4HANA changes.',
    simplificationId: 'S4TWL-QM-IP-001',
  },
  {
    id: 'SIMPL-QM-008',
    category: 'Quality Management - Inspection Plans',
    severity: 'medium',
    title: 'Master inspection characteristics changes',
    description: 'QPMK/QPMT (master inspection characteristics) may need review.',
    pattern: /\b(QPMK|QPMT|QPMV)\b/i,
    patternType: 'source',
    remediation: 'Review master inspection characteristics configuration.',
    simplificationId: 'S4TWL-QM-IP-002',
  },

  // ── Results Recording ────────────────────────────────────────
  {
    id: 'SIMPL-QM-009',
    category: 'Quality Management - Results',
    severity: 'medium',
    title: 'Results recording table changes',
    description: 'QAVE (characteristic results) has new fields for S/4HANA.',
    pattern: /\b(QAVE|QAKL)\b/i,
    patternType: 'source',
    remediation: 'Review results recording data model.',
    simplificationId: 'S4TWL-QM-RR-001',
  },
  {
    id: 'SIMPL-QM-010',
    category: 'Quality Management - Results',
    severity: 'low',
    title: 'SPC (Statistical Process Control) changes',
    description: 'SPC functions may need configuration review.',
    pattern: /\b(QCC0|QCC1|QCC2|QCC3)\b/i,
    patternType: 'source',
    remediation: 'Review SPC control chart configuration.',
    simplificationId: 'S4TWL-QM-RR-002',
  },

  // ── Quality Certificates ─────────────────────────────────────
  {
    id: 'SIMPL-QM-011',
    category: 'Quality Management - Certificates',
    severity: 'medium',
    title: 'Quality certificate changes',
    description: 'Certificate profiles and output via QC21/QC22 changed for S/4HANA.',
    pattern: /\b(QC21|QC22|QC51|QCPR)\b/i,
    patternType: 'source',
    remediation: 'Review certificate profile configuration and output management.',
    simplificationId: 'S4TWL-QM-QC-001',
  },

  // ── QM in Procurement ────────────────────────────────────────
  {
    id: 'SIMPL-QM-012',
    category: 'Quality Management - Procurement',
    severity: 'medium',
    title: 'QM-MM integration changes',
    description: 'Quality info records (QINF) and source inspection changed.',
    pattern: /\b(QINF|QI01|QI02|QI03)\b/i,
    patternType: 'source',
    remediation: 'Review QM-MM integration settings for S/4HANA.',
    simplificationId: 'S4TWL-QM-PR-001',
  },
  {
    id: 'SIMPL-QM-013',
    category: 'Quality Management - Procurement',
    severity: 'low',
    title: 'Vendor quality scoring changes',
    description: 'QM vendor scoring integration with supplier evaluation changed.',
    pattern: /\bQINF.*LIFNR|LIFNR.*QINF\b/i,
    patternType: 'source',
    remediation: 'Review vendor quality scoring configuration.',
    simplificationId: 'S4TWL-QM-PR-002',
  },

  // ── QM in Production ─────────────────────────────────────────
  {
    id: 'SIMPL-QM-014',
    category: 'Quality Management - Production',
    severity: 'medium',
    title: 'In-process inspection changes',
    description: 'In-process inspection integration with PP changed.',
    pattern: /\bQPR5\b/i,
    patternType: 'source',
    remediation: 'Review in-process inspection trigger points.',
    simplificationId: 'S4TWL-QM-PP-001',
  },
  {
    id: 'SIMPL-QM-015',
    category: 'Quality Management - Production',
    severity: 'low',
    title: 'Quality view in routing',
    description: 'Quality view in routing (CA01/CA02) integration changed.',
    pattern: /\b(CA01|CA02).*QUAL\b/i,
    patternType: 'source',
    remediation: 'Review routing quality view configuration.',
    simplificationId: 'S4TWL-QM-PP-002',
  },

  // ── QM in Sales ──────────────────────────────────────────────
  {
    id: 'SIMPL-QM-016',
    category: 'Quality Management - Sales',
    severity: 'medium',
    title: 'Delivery inspection changes',
    description: 'Quality inspection at goods issue/delivery changed for S/4HANA.',
    pattern: /\bQEVENT.*VL\b/i,
    patternType: 'source',
    remediation: 'Review outbound delivery QM integration.',
    simplificationId: 'S4TWL-QM-SD-001',
  },

  // ── Stability Study ──────────────────────────────────────────
  {
    id: 'SIMPL-QM-017',
    category: 'Quality Management - Stability',
    severity: 'low',
    title: 'Stability study changes',
    description: 'QST01/QST02 stability study functions changed.',
    pattern: /\b(QST01|QST02)\b/i,
    patternType: 'source',
    remediation: 'Review stability study configuration.',
    simplificationId: 'S4TWL-QM-STB-001',
  },

  // ── Digital Manufacturing ────────────────────────────────────
  {
    id: 'SIMPL-QM-018',
    category: 'Quality Management - Digital',
    severity: 'medium',
    title: 'Digital manufacturing integration',
    description: 'S/4HANA QM integrates with SAP Digital Manufacturing Cloud.',
    pattern: /\bDMC_QM|QM_DMC\b/i,
    patternType: 'source',
    remediation: 'Consider SAP Digital Manufacturing Cloud integration for QM.',
    simplificationId: 'S4TWL-QM-DIG-001',
  },

  // ── Batch Management QM ──────────────────────────────────────
  {
    id: 'SIMPL-QM-019',
    category: 'Quality Management - Batch',
    severity: 'medium',
    title: 'Batch determination with quality',
    description: 'Batch classification and QM inspection integration changed.',
    pattern: /\bMCH1.*QALS|QALS.*MCH1\b/i,
    patternType: 'source',
    remediation: 'Review batch-QM integration settings.',
    simplificationId: 'S4TWL-QM-BAT-001',
  },

  // ── Audit Management ─────────────────────────────────────────
  {
    id: 'SIMPL-QM-020',
    category: 'Quality Management - Audit',
    severity: 'low',
    title: 'Quality audit changes',
    description: 'QM audit management (PLMD_AUDIT) has S/4HANA-specific changes.',
    pattern: /\bPLMD_AUDIT\b/i,
    patternType: 'source',
    remediation: 'Review audit management configuration.',
    simplificationId: 'S4TWL-QM-AUD-001',
  },
];
