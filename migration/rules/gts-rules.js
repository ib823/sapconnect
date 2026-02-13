/**
 * Global Trade Services (GTS) Rules
 *
 * Covers transition from standalone SAP GTS to embedded
 * compliance in S/4HANA. Key: customs management, sanctions
 * screening, preference/origin processing, license management.
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
];
