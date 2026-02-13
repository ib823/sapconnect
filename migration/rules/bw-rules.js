/**
 * BW / Analytics Rules
 *
 * Covers transition from BW extractors and data sources to
 * S/4HANA embedded analytics (CDS views), BW/4HANA migration,
 * and classic BW compatibility concerns.
 */

module.exports = [
  // ── Extractor Changes ────────────────────────────────────────
  {
    id: 'SIMPL-BW-001',
    title: 'FI Extractors Replaced',
    description: 'Classic FI extractors (0FI_GL_*, 0FI_AR_*, 0FI_AP_*) replaced by CDS-based extraction from ACDOCA.',
    severity: 'critical',
    category: 'BW – Extractors',
    sNote: '2381257',
    pattern: /(0FI_GL_|0FI_AR_|0FI_AP_|\bFAGLFLEXT\b|0FI_AA_)/i,
    patternType: 'source',
    remediation: 'Migrate to CDS-based extractors (e.g., I_GLAccountLineItem). Review BW data flow for ACDOCA sourcing.',
  },
  {
    id: 'SIMPL-BW-002',
    title: 'CO Extractors Changed',
    description: 'CO extractors (0CO_OM_*, 0CO_PC_*) impacted by universal journal. Cost element tables removed.',
    severity: 'high',
    category: 'BW – Extractors',
    sNote: '2381257',
    pattern: /(0CO_OM_|0CO_PC_|0CO_PA_|\bCOSS\b|\bCOSP\b)/i,
    patternType: 'source',
    remediation: 'Replace CO extractors with ACDOCA/ACDOCP-based CDS extractors.',
  },
  {
    id: 'SIMPL-BW-003',
    title: 'MM/SD Extractors Updated',
    description: 'Logistics extractors (2LIS_*) restructured. Some setup tables (LBWE) logic changed.',
    severity: 'high',
    category: 'BW – Extractors',
    sNote: '2381257',
    pattern: /(2LIS_0[1-9]|2LIS_1[1-3]|\bLBWE\b|\bMC_SETUP\b)/i,
    patternType: 'source',
    remediation: 'Review logistics extractor activation. Validate setup table fills and delta handling.',
  },
  {
    id: 'SIMPL-BW-004',
    title: 'Asset Extractors Changed',
    description: 'Asset accounting extractors impacted by new asset accounting (ACDOCA-based, no ANLP/ANLC index).',
    severity: 'high',
    category: 'BW – Extractors',
    sNote: '2381257',
    pattern: /(0FIAA_|0AM_|\bANLP\b|\bANLC\b)/i,
    patternType: 'source',
    remediation: 'Migrate to new asset analytics extractors sourcing from ANEK/ANEP via ACDOCA.',
  },

  // ── CDS Views / Embedded Analytics ───────────────────────────
  {
    id: 'SIMPL-BW-005',
    title: 'Embedded Analytics via CDS Views',
    description: 'S/4HANA promotes CDS-based embedded analytics over classic BW reporting for operational analytics.',
    severity: 'medium',
    category: 'BW – Embedded Analytics',
    sNote: '2381257',
    pattern: /\b(CDS_VIEW|I_JOURNAL|C_GLLINE|ANALYTICAL_QUERY)\b/i,
    patternType: 'source',
    remediation: 'Evaluate which BW reports can be replaced by embedded analytics CDS views.',
  },
  {
    id: 'SIMPL-BW-006',
    title: 'Query Migration to BW/4HANA',
    description: 'Classic BW queries on BEx must be evaluated for migration to BW/4HANA composite providers.',
    severity: 'medium',
    category: 'BW – Embedded Analytics',
    sNote: '2381257',
    pattern: /\b(BEX_QUERY|RSZCOMPDIR|RSZELTDIR|MULTIPROVIDER)\b/i,
    patternType: 'source',
    remediation: 'Assess BEx queries for BW/4HANA compatibility. Migrate to composite providers where applicable.',
  },

  // ── Data Source Compatibility ────────────────────────────────
  {
    id: 'SIMPL-BW-007',
    title: 'Custom Extractors Validation',
    description: 'Custom extractors (Z* datasources) must be validated against S/4HANA table model changes.',
    severity: 'high',
    category: 'BW – Custom Extractors',
    sNote: '2381257',
    pattern: /\b(RSA[1-3]|ROOSOURCE|EXTRACTION)\b|Z[A-Z0-9]+_DS/i,
    patternType: 'source',
    remediation: 'Test all custom extractors. Replace references to removed tables (BSEG, BKPF, KONV, etc.).',
  },
  {
    id: 'SIMPL-BW-008',
    title: 'InfoObject Compatibility',
    description: 'InfoObjects referencing removed or changed S/4HANA fields need master data reloads.',
    severity: 'medium',
    category: 'BW – Data Model',
    sNote: '2381257',
    pattern: /\b(INFOOBJECT|RSDODSO|RSDIOBJ|ADSO)\b/i,
    patternType: 'source',
    remediation: 'Review InfoObject definitions against S/4HANA data model. Reload master data where fields changed.',
  },
];
