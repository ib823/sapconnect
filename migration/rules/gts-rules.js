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
 * Global Trade Services (GTS) Rules
 *
 * Covers transition from standalone SAP GTS to embedded
 * compliance in S/4HANA. Key: customs management, sanctions
 * screening, preference/origin processing, license management.
 * Extended: detailed customs procedures, embargo screening,
 * classification, bonded warehouse/FTZ, e-customs, country-specific.
 */

module.exports = [
  // ── Compliance Screening ─────────────────────────────────────
  {
    id: 'SIMPL-GTS-001',
    title: 'Sanctions Screening Integration',
    description: 'Standalone GTS sanctions screening (SPL) must be reconfigured for embedded or side-car GTS with S/4HANA.',
    severity: 'critical',
    category: 'GTS – Compliance',
    sNote: '2648095',
    pattern: /\b(SPL_CHECK|SANCTIONED_PARTY|GTS_SPL)\b|\/SAPSLL\//i,
    patternType: 'source',
    remediation: 'Configure embedded compliance screening or maintain side-car GTS with updated RFC integration.',
  },
  {
    id: 'SIMPL-GTS-002',
    title: 'Export Control Classification',
    description: 'Export control classification numbers (ECCN) and license determination must be reviewed for S/4HANA BP model.',
    severity: 'high',
    category: 'GTS – Compliance',
    sNote: '2648095',
    pattern: /\b(ECCN|EXPORT_LICENSE|LICENSE_DET)\b|\/SAPSLL\/CL_/i,
    patternType: 'source',
    remediation: 'Review export control master data. Ensure ECCN classification aligns with BP-based partner model.',
  },

  // ── Customs Management ───────────────────────────────────────
  {
    id: 'SIMPL-GTS-003',
    title: 'Customs Declaration Processing',
    description: 'Customs declaration processing via GTS must be tested against new delivery/billing document model.',
    severity: 'high',
    category: 'GTS – Customs',
    sNote: '2648095',
    pattern: /\b(CUSTOMS_DECL|CUSDEC)\b|\/SAPSLL\/CD_/i,
    patternType: 'source',
    remediation: 'Test customs declaration triggers from S/4HANA deliveries and billing documents.',
  },
  {
    id: 'SIMPL-GTS-004',
    title: 'Tariff Code / HS Code Maintenance',
    description: 'Commodity/tariff code master data (HS codes) must be validated in product master after 40-char MATNR.',
    severity: 'medium',
    category: 'GTS – Customs',
    sNote: '2648095',
    pattern: /\b(TARIFF_CODE|HS_CODE|COMMODITY_CODE|STAWN)\b/i,
    patternType: 'source',
    remediation: 'Validate HS code assignments in product master. Check GTS commodity code derivation.',
  },
  {
    id: 'SIMPL-GTS-005',
    title: 'Intrastat / Extrastat Reporting',
    description: 'Intrastat/Extrastat reporting impacted by new material and BP data models.',
    severity: 'medium',
    category: 'GTS – Customs',
    sNote: '2648095',
    pattern: /\b(INTRASTAT|EXTRASTAT|EU_REPORTING|MIRS)\b/i,
    patternType: 'source',
    remediation: 'Test Intrastat/Extrastat report generation with S/4HANA data. Verify country-specific reporting.',
  },

  // ── Preference / Origin ──────────────────────────────────────
  {
    id: 'SIMPL-GTS-006',
    title: 'Preference Determination Changed',
    description: 'Preference/origin determination logic impacted by BOM and product model changes.',
    severity: 'medium',
    category: 'GTS – Preference',
    sNote: '2648095',
    pattern: /\b(PREFERENCE_DET|ORIGIN_DET|VENDOR_DEC)\b|\/SAPSLL\/PD_/i,
    patternType: 'source',
    remediation: 'Review preference determination with new product and vendor (BP) data models.',
  },
  {
    id: 'SIMPL-GTS-007',
    title: 'Free Trade Agreement Management',
    description: 'FTA management and certificate of origin processing needs review for S/4HANA integration.',
    severity: 'low',
    category: 'GTS – Preference',
    sNote: '2648095',
    pattern: /\b(FREE_TRADE|FTA_MGMT|CERT_ORIGIN)\b/i,
    patternType: 'source',
    remediation: 'Verify FTA configurations and certificate of origin generation in GTS side-car.',
  },

  // ── License Management ───────────────────────────────────────
  {
    id: 'SIMPL-GTS-008',
    title: 'License Management Integration',
    description: 'Trade license management integration points with SD/MM change with BP and new document model.',
    severity: 'high',
    category: 'GTS – License Management',
    sNote: '2648095',
    pattern: /\b(TRADE_LICENSE|LICENSE_MGMT)\b|\/SAPSLL\/LM_/i,
    patternType: 'source',
    remediation: 'Reconfigure license determination to work with S/4HANA sales and purchasing documents.',
  },

  // ── Detailed Import Customs Procedures ───────────────────────
  {
    id: 'SIMPL-GTS-009',
    title: 'Import Declaration Procedure Migration',
    description: 'Import customs declaration procedures (normal, simplified, periodic) must be tested with S/4HANA inbound delivery and invoice verification workflows. GTS import declaration triggers change with new document flow.',
    severity: 'high',
    category: 'GTS – Import Customs',
    sNote: '2648095',
    pattern: /\b(IMPORT_DECL|IMPORT_CUSTOMS|INWARD_PROCESS|IMPORT_PROC)\b|\/SAPSLL\/IM_/i,
    patternType: 'source',
    remediation: 'Test import declaration generation from S/4HANA purchase orders and inbound deliveries. Validate customs procedure codes.',
  },
  {
    id: 'SIMPL-GTS-010',
    title: 'Import Duty Calculation and Posting',
    description: 'GTS import duty calculation (tariff rate, anti-dumping, countervailing duties) and automatic FI posting must be validated against new accounting model (ACDOCA). Duty accrual and payment flows may change.',
    severity: 'high',
    category: 'GTS – Import Customs',
    sNote: '2648095',
    pattern: /\b(IMPORT_DUTY|DUTY_CALC|ANTI_DUMP|COUNTERVAIL)\b|\/SAPSLL\/DC_/i,
    patternType: 'source',
    remediation: 'Validate import duty calculation rules. Test FI posting of duties against ACDOCA journal entries.',
  },

  // ── Detailed Export Customs Procedures ───────────────────────
  {
    id: 'SIMPL-GTS-011',
    title: 'Export Declaration and AES Filing',
    description: 'Export customs declarations and Automated Export System (AES) electronic filing must be reconfigured for S/4HANA outbound delivery and billing document changes.',
    severity: 'high',
    category: 'GTS – Export Customs',
    sNote: '2648095',
    pattern: /\b(EXPORT_DECL|AES_FILING|ECS_FILING|ATLAS_EXPORT)\b|\/SAPSLL\/EX_/i,
    patternType: 'source',
    remediation: 'Test export declaration triggers from S/4HANA deliveries. Validate AES/ATLAS message generation and EDI transmission.',
  },
  {
    id: 'SIMPL-GTS-012',
    title: 'Export Control and Denied Party Screening',
    description: 'Export control checks including denied party list screening, end-use verification, and catch-all clause evaluation must integrate with BP-based partner data instead of legacy customer/vendor.',
    severity: 'critical',
    category: 'GTS – Export Customs',
    sNote: '2648095',
    pattern: /\b(DENIED_PARTY|END_USE_CHECK|CATCH_ALL|EXPORT_CTRL)\b/i,
    patternType: 'source',
    remediation: 'Reconfigure export control screening for BP model. Validate denied party list sources and screening logic.',
  },

  // ── Embargo and Sanctions Screening Details ──────────────────
  {
    id: 'SIMPL-GTS-013',
    title: 'Embargo Country Screening Configuration',
    description: 'Embargo screening rules for country-based restrictions must be updated to reference BP address data instead of legacy customer/vendor country fields. Comprehensive vs. targeted sanctions logic needs validation.',
    severity: 'critical',
    category: 'GTS – Sanctions',
    sNote: '2648095',
    pattern: /\b(EMBARGO_CHECK|COUNTRY_SANCTION|SANCTION_SCREEN|EMBARGO_LIST)\b/i,
    patternType: 'source',
    remediation: 'Update embargo screening to use BP address and role data. Validate comprehensive and targeted sanctions processing.',
  },
  {
    id: 'SIMPL-GTS-014',
    title: 'Sanctioned Party List (SPL) Update Automation',
    description: 'Automated SPL list updates from government sources (OFAC SDN, EU consolidated list, UN sanctions) must be tested with S/4HANA GTS side-car. Mass screening re-run procedures need validation.',
    severity: 'high',
    category: 'GTS – Sanctions',
    sNote: '2648095',
    pattern: /\b(SPL_UPDATE|OFAC_SDN|EU_SANCTION|UN_SANCTION|SPL_MASS)\b/i,
    patternType: 'source',
    remediation: 'Validate SPL update automation. Test mass re-screening after list updates for all active business partners.',
  },

  // ── Classification Management ────────────────────────────────
  {
    id: 'SIMPL-GTS-015',
    title: 'Product Classification for Trade Compliance',
    description: 'GTS product classification (HS codes, ECCN, national tariff schedules) must be maintained per legal regulation and country. Classification assignments link to product master with 40-char material number.',
    severity: 'high',
    category: 'GTS – Classification',
    sNote: '2648095',
    pattern: /\b(GTS_CLASSIF|PROD_CLASSIF|LEGAL_REG|NATL_TARIFF)\b|\/SAPSLL\/PR_/i,
    patternType: 'source',
    remediation: 'Review product classification assignments. Validate legal regulation linkage with 40-char material numbers.',
  },
  {
    id: 'SIMPL-GTS-016',
    title: 'Classification Change Management and Audit',
    description: 'Classification changes (HS code updates, ECCN re-classification) require audit trail maintenance and re-determination of applicable licenses. Change history must persist through migration.',
    severity: 'medium',
    category: 'GTS – Classification',
    sNote: '2648095',
    pattern: /\b(CLASSIF_CHANGE|RECLASS|HS_UPDATE|ECCN_CHANGE|CLASSIF_AUDIT)\b/i,
    patternType: 'source',
    remediation: 'Validate classification change history migration. Ensure audit trail completeness for regulatory compliance.',
  },

  // ── Bonded Warehouse and FTZ ─────────────────────────────────
  {
    id: 'SIMPL-GTS-017',
    title: 'Bonded Warehouse Management',
    description: 'GTS bonded warehouse processing tracks duty-suspended inventory with admission, storage, and release workflows. Integration with EWM/IM inventory and customs authorities must be validated after migration.',
    severity: 'high',
    category: 'GTS – Bonded Warehouse',
    sNote: '2648095',
    pattern: /\b(BONDED_WH|DUTY_SUSPEND|CUSTOMS_BOND|BONDED_STOCK)\b|\/SAPSLL\/BW_/i,
    patternType: 'source',
    remediation: 'Test bonded warehouse admission and release workflows. Validate inventory reconciliation with customs authorities.',
  },
  {
    id: 'SIMPL-GTS-018',
    title: 'Foreign Trade Zone (FTZ) Processing',
    description: 'Foreign trade zone and free zone processing in GTS tracks zone admission, manufacturing under zone status, and zone-to-zone transfers. Must be validated with S/4HANA inventory and production integration.',
    severity: 'medium',
    category: 'GTS – FTZ',
    sNote: '2648095',
    pattern: /\b(FREE_ZONE|FTZ_PROC|ZONE_ADMIT|ZONE_TRANSFER)\b/i,
    patternType: 'source',
    remediation: 'Validate FTZ processing scenarios. Test zone admission from inbound delivery and zone release for domestic consumption.',
  },

  // ── Electronic Customs Filing ────────────────────────────────
  {
    id: 'SIMPL-GTS-019',
    title: 'Electronic Customs Message Configuration',
    description: 'GTS electronic customs filing (EDI/XML messages to customs authorities) must be reconfigured for S/4HANA connectivity. Message types include CUSDEC, AES, ICS, NCTS for various customs procedures.',
    severity: 'high',
    category: 'GTS – Electronic Filing',
    sNote: '2648095',
    pattern: /\b(ECUSTOMS|CUSTOMS_EDI|CUSTOMS_XML|ICS_MSG|NCTS_MSG)\b/i,
    patternType: 'source',
    remediation: 'Reconfigure electronic customs messaging. Validate EDI/XML connectivity and message formats for each customs authority.',
  },
  {
    id: 'SIMPL-GTS-020',
    title: 'Customs Authority Response Handling',
    description: 'Inbound response messages from customs authorities (release confirmations, duty assessments, error rejections) must be processed correctly. Response handling and document status updates need re-testing.',
    severity: 'medium',
    category: 'GTS – Electronic Filing',
    sNote: '2648095',
    pattern: /\b(CUSTOMS_RESP|RELEASE_CONFIRM|DUTY_ASSESS|CUSTOMS_ERROR)\b/i,
    patternType: 'source',
    remediation: 'Test customs response processing end-to-end. Validate status update propagation from GTS to S/4HANA documents.',
  },

  // ── Country-Specific Requirements ────────────────────────────
  {
    id: 'SIMPL-GTS-021',
    title: 'US Customs (CBP) Specific Requirements',
    description: 'US CBP-specific requirements including ACE filing, Harmonized Tariff Schedule (HTS) classification, Section 301/232 tariffs, and ISF (10+2) importer security filing must be validated.',
    severity: 'high',
    category: 'GTS – Country-Specific',
    sNote: '2648095',
    pattern: /\b(ACE_FILING|HTS_CLASS|ISF_FILING|CBP_CUSTOMS|SEC_301)\b/i,
    patternType: 'source',
    remediation: 'Validate US customs-specific configurations. Test ACE filing, HTS classification, and ISF generation.',
  },
  {
    id: 'SIMPL-GTS-022',
    title: 'EU Customs (UCC) Specific Requirements',
    description: 'EU Union Customs Code (UCC) requirements including ATLAS (DE), CHIEF/CDS (UK), Delta-G/Delta-D (FR), and common transit (NCTS) must be validated for S/4HANA integration.',
    severity: 'high',
    category: 'GTS – Country-Specific',
    sNote: '2648095',
    pattern: /\b(UCC_CUSTOMS|ATLAS_DE|CHIEF_UK|CDS_UK|DELTA_G|NCTS_EU)\b/i,
    patternType: 'source',
    remediation: 'Test EU country-specific customs messaging. Validate ATLAS, CHIEF/CDS, and NCTS configurations per country.',
  },
  {
    id: 'SIMPL-GTS-023',
    title: 'China Customs and Cross-Border E-Commerce',
    description: 'China customs requirements including CIQ inspection, cross-border e-commerce declarations, and special customs supervision zones must be validated with S/4HANA document flows.',
    severity: 'medium',
    category: 'GTS – Country-Specific',
    sNote: '2648095',
    pattern: /\b(CHINA_CUSTOMS|CIQ_INSPECT|CROSS_BORDER_EC|SPECIAL_ZONE_CN)\b/i,
    patternType: 'source',
    remediation: 'Validate China customs integration. Test CIQ inspection triggers and cross-border e-commerce declaration flows.',
  },
  {
    id: 'SIMPL-GTS-024',
    title: 'Letter of Credit and Trade Finance Integration',
    description: 'GTS letter of credit (LC) management and trade finance document compliance checks must be validated with BP-based banking partner data and new FI document model.',
    severity: 'medium',
    category: 'GTS – Trade Finance',
    sNote: '2648095',
    pattern: /\b(LETTER_CREDIT|LC_MGMT|TRADE_FINANCE|LC_COMPLIANCE)\b/i,
    patternType: 'source',
    remediation: 'Validate letter of credit processing with BP model. Test trade finance document compliance checks.',
  },
];
