/**
 * Product Lifecycle Management (PLM) Rules
 *
 * Covers Engineering Change Management, Document Management,
 * Recipe Management, and integration with S/4HANA product model.
 * Key: 40-char MATNR impact on BOM/routing, ECM process changes.
 */

module.exports = [
  // ── Engineering Change Management ────────────────────────────
  {
    id: 'SIMPL-PLM-001',
    title: 'Engineering Change Management (ECM) Updated',
    description: 'ECM transactions (CC01-CC03) continue but BOM/routing references impacted by extended material number.',
    severity: 'high',
    category: 'PLM – Engineering Change',
    sNote: '2270859',
    pattern: /\b(CC0[1-3]|AENR|CHANGE_NUMBER|ECMPROCESS)\b/i,
    patternType: 'source',
    remediation: 'Review engineering change records referencing material numbers. Validate BOM effectivity after migration.',
  },
  {
    id: 'SIMPL-PLM-002',
    title: 'BOM Extended Material Number',
    description: 'Bill of Materials impacted by 40-character material number. All BOM components need validation.',
    severity: 'critical',
    category: 'PLM – BOM',
    sNote: '2270859',
    pattern: /\b(CS0[1-3]|STKO|STPO|MAST|BOM_ITEM|CSAP_MAT_BOM)\b/i,
    patternType: 'source',
    remediation: 'Validate all BOM structures after material number extension. Check STPO-IDNRK field (40 chars).',
  },
  {
    id: 'SIMPL-PLM-003',
    title: 'Routing Extended Material Number',
    description: 'Routings/work plans impacted by 40-character material number in component assignment.',
    severity: 'high',
    category: 'PLM – Routing',
    sNote: '2270859',
    pattern: /\b(CA0[1-3]|PLKO|PLPO|MAPL|ROUTING|WORK_PLAN)\b/i,
    patternType: 'source',
    remediation: 'Validate routing component assignments. Check production version consistency.',
  },

  // ── Document Management ──────────────────────────────────────
  {
    id: 'SIMPL-PLM-004',
    title: 'Document Management System (DMS)',
    description: 'DMS (CV01-CV04) continues but document-info-record links to materials need validation.',
    severity: 'medium',
    category: 'PLM – Document Management',
    sNote: '2270859',
    pattern: /\b(CV0[1-4]N?|DRAW|DRAS|DRAT|DMS_DOC)\b/i,
    patternType: 'source',
    remediation: 'Validate DMS document links to materials, equipment, and BOM items.',
  },
  {
    id: 'SIMPL-PLM-005',
    title: 'Classification System Impact',
    description: 'Classification (CL01-CL04) characteristics and classes impacted by data model changes.',
    severity: 'medium',
    category: 'PLM – Classification',
    sNote: '2270859',
    pattern: /\b(CL0[1-4]|CT0[1-4]|CABN|CAWN|CLASSIFICATION)\b/i,
    patternType: 'source',
    remediation: 'Review classification hierarchies. Validate class assignments for migrated materials.',
  },

  // ── Recipe Management ────────────────────────────────────────
  {
    id: 'SIMPL-PLM-006',
    title: 'Recipe Management for Process Industries',
    description: 'Recipe management (C201-C203) impacted by routing and BOM changes in S/4HANA.',
    severity: 'high',
    category: 'PLM – Recipe',
    sNote: '2270859',
    pattern: /\b(C20[1-3]|MASTER_RECIPE|PLKO.*RECIPE)\b/i,
    patternType: 'source',
    remediation: 'Validate master recipes after BOM and routing migration. Check phase/operation assignments.',
  },

  // ── Product Structure ────────────────────────────────────────
  {
    id: 'SIMPL-PLM-007',
    title: 'Product Structure Browser Changed',
    description: 'Product structure browser (CS80/CC05) enhanced in S/4HANA. Custom exits need review.',
    severity: 'low',
    category: 'PLM – Product Structure',
    sNote: '2270859',
    pattern: /\b(CS80|CC05|PRODUCT_STRUCTURE|PSB_)\b/i,
    patternType: 'source',
    remediation: 'Review custom enhancements to product structure browser. Test navigation after migration.',
  },
  {
    id: 'SIMPL-PLM-008',
    title: 'Variant Configuration Integration',
    description: 'Variant configuration (CU41-CU44) dependencies and object characteristics need review.',
    severity: 'medium',
    category: 'PLM – Variant Config',
    sNote: '2270859',
    pattern: /\b(CU4[1-4]|VARIANT_CONFIG|VC_|CUOBJ|DEPENDENCY)\b/i,
    patternType: 'source',
    remediation: 'Validate variant configuration models and dependencies. Test configuration profiles end-to-end.',
  },
];
