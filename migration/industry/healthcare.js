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
 * Healthcare Industry Package
 *
 * Covers physician preference cards, 340B drug pricing, clinical supply chain,
 * HIPAA compliance, UDI tracking, and implant traceability for healthcare
 * provider and medical device migrations.
 */

const BaseIndustryPackage = require('./base-industry-package');

class HealthcarePackage extends BaseIndustryPackage {
  get industryId() { return 'HEALTHCARE'; }
  get name() { return 'Healthcare'; }
  get description() {
    return 'Migration package for healthcare providers and medical device companies covering physician preference cards, 340B drug pricing program, clinical supply chain management, HIPAA compliance, UDI tracking, and implant traceability.';
  }

  getComplianceRequirements() {
    return [
      {
        id: 'HC-COMP-001',
        name: 'HIPAA Privacy & Security',
        description: 'Health Insurance Portability and Accountability Act requirements for protected health information',
        regulation: 'HIPAA (45 CFR 160/164)',
        sapSolution: 'SAP access controls, data encryption, audit logging, and PHI field masking with authorization objects',
        priority: 'critical',
      },
      {
        id: 'HC-COMP-002',
        name: 'FDA UDI Requirements',
        description: 'Unique Device Identification system for medical device tracking through distribution',
        regulation: 'FDA UDI Rule (21 CFR 801.20)',
        sapSolution: 'SAP material master with UDI attributes (DI + PI), GS1 barcode integration, and GUDID submission',
        priority: 'critical',
      },
      {
        id: 'HC-COMP-003',
        name: '340B Drug Pricing Program',
        description: 'HRSA 340B program compliance for eligible covered entities purchasing outpatient drugs at reduced prices',
        regulation: 'PHSA Section 340B / HRSA Guidelines',
        sapSolution: 'SAP pricing conditions with 340B contract pricing and split billing configuration for eligible patients',
        priority: 'high',
      },
      {
        id: 'HC-COMP-004',
        name: 'FDA 21 CFR Part 820',
        description: 'Quality System Regulation for medical device manufacturing quality management',
        regulation: 'FDA 21 CFR Part 820',
        sapSolution: 'SAP QM with design controls, CAPA management, complaint handling, and device history record (DHR)',
        priority: 'high',
      },
      {
        id: 'HC-COMP-005',
        name: 'Joint Commission Standards',
        description: 'Joint Commission accreditation standards for healthcare organizations including supply chain requirements',
        regulation: 'Joint Commission Standards (LD/EC/IC)',
        sapSolution: 'SAP inventory management with expiry tracking, recall management, and environment-of-care documentation',
        priority: 'medium',
      },
    ];
  }

  getGapAnalysis() {
    return [
      {
        id: 'HC-GAP-001',
        name: 'Physician Preference Cards',
        description: 'Physician-specific surgical supply preference lists with procedure-based picking and case cart management',
        inforCapability: 'Infor CloudSuite Healthcare with physician preference card management and case cart integration',
        sapGap: 'SAP lacks native physician preference card functionality for surgical supply management',
        mitigation: 'Implement custom Fiori application for preference card management with integration to SAP MM for case cart picking',
        effort: 'high',
      },
      {
        id: 'HC-GAP-002',
        name: '340B Drug Pricing Management',
        description: 'Complete 340B program management with mixed-use area tracking, contract pharmacy, and split billing',
        inforCapability: 'Infor Healthcare 340B module with patient eligibility determination and split billing',
        sapGap: 'SAP requires custom 340B logic for patient eligibility, accumulation, and contract pharmacy management',
        mitigation: 'Integrate SAP with dedicated 340B solution (e.g., Sentry, Macro Helix) via SAP Integration Suite',
        effort: 'high',
      },
      {
        id: 'HC-GAP-003',
        name: 'Clinical Supply Chain',
        description: 'Par-level inventory management with automated replenishment triggers at point-of-use locations',
        inforCapability: 'Infor Healthcare supply chain with par-level management and two-bin kanban at clinical locations',
        sapGap: 'SAP MRP supports reorder points but clinical par-level with point-of-use scanning needs configuration',
        mitigation: 'Configure SAP Extended Warehouse Management (EWM) with clinical storage bins and RFID/barcode replenishment triggers',
        effort: 'medium',
      },
      {
        id: 'HC-GAP-004',
        name: 'Implant Traceability',
        description: 'Full implant tracking from receipt through surgical implantation to patient record with UDI',
        inforCapability: 'Infor Healthcare with implant log tracking and patient-device association',
        sapGap: 'SAP batch/serial management handles device tracking but patient-device association requires extension',
        mitigation: 'Extend SAP serial number management with patient-device linkage via custom table and integrate with EHR system',
        effort: 'medium',
      },
      {
        id: 'HC-GAP-005',
        name: 'Consignment Inventory Management',
        description: 'Vendor-managed consignment inventory for high-value surgical implants and devices',
        inforCapability: 'Infor consignment management with vendor-owned inventory tracking at clinical sites',
        sapGap: 'SAP consignment process (K-type stock) handles basic consignment but surgical usage triggers need configuration',
        mitigation: 'Configure SAP consignment process with automatic consumption posting upon surgical usage recording',
        effort: 'low',
      },
    ];
  }

  getVerticalTransforms() {
    return [
      {
        id: 'HC-TX-001',
        name: 'UDI Data Mapping',
        description: 'Map Infor device identification to SAP material master UDI attributes',
        sourceField: 'DEVICE_IDENTIFIER',
        targetField: 'MATERIAL_UDI',
        transformLogic: 'Convert Infor device identifier and production identifier to SAP material master UDI fields with GS1/HIBCC/ICCBBA issuing agency',
      },
      {
        id: 'HC-TX-002',
        name: 'Clinical Location Mapping',
        description: 'Map Infor clinical locations to SAP storage location/bin structure',
        sourceField: 'CLINICAL_LOCATION',
        targetField: 'STORAGE_LOCATION_BIN',
        transformLogic: 'Convert Infor clinical department/room/cabinet structure to SAP plant/storage location/bin hierarchy for EWM',
      },
      {
        id: 'HC-TX-003',
        name: 'Preference Card Conversion',
        description: 'Map Infor physician preference cards to SAP custom preference card structure',
        sourceField: 'PREFERENCE_CARD',
        targetField: 'SAP_PREF_CARD',
        transformLogic: 'Convert Infor preference card entries to SAP custom table with physician ID, procedure code, material list, and quantities',
      },
    ];
  }

  getRecommendations() {
    return [
      { title: 'HIPAA Risk Assessment', description: 'Conduct HIPAA security risk assessment for SAP environment before migrating any healthcare data.' },
      { title: '340B Solution Integration', description: 'Select and integrate a dedicated 340B solution early, as this is a critical compliance area with financial impact.' },
      { title: 'EHR Integration Planning', description: 'Plan integration with Electronic Health Record system for implant traceability and patient-device association.' },
      { title: 'UDI Data Enrichment', description: 'Enrich material master with UDI data from AccessGUDID before migration to ensure device identification compliance.' },
    ];
  }
}

module.exports = HealthcarePackage;
