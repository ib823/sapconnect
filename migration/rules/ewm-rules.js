/**
 * Extended Warehouse Management (EWM) Rules
 *
 * Covers transition from legacy WM (LE-WM) to embedded EWM in S/4HANA.
 * Key: WM movement types replaced, LQUA/LAGP restructured,
 * RF framework changes, warehouse task model replaces transfer orders.
 */

module.exports = [
  // ── Warehouse Structure ──────────────────────────────────────
  {
    id: 'SIMPL-EWM-001',
    title: 'Legacy WM (LE-WM) Removed',
    description: 'Classic Warehouse Management (LE-WM) with transaction codes LT01-LT0x is removed. Must migrate to embedded EWM or decentralized EWM.',
    severity: 'critical',
    category: 'EWM – Warehouse Structure',
    sNote: '2269324',
    pattern: /\b(LT0[1-9]|LT1[0-9]|LT2[1-5]|LS0[1-9]|LS2[0-6])\b/i,
    patternType: 'source',
    remediation: 'Replace LE-WM transaction codes with EWM equivalents (e.g., /SCWM/ADGI, /SCWM/MON).',
  },
  {
    id: 'SIMPL-EWM-002',
    title: 'Warehouse Number Configuration Change',
    description: 'Warehouse numbers must be reassigned. In embedded EWM, warehouse number = plant + storage location combination.',
    severity: 'high',
    category: 'EWM – Warehouse Structure',
    sNote: '2269324',
    pattern: /\b(LAGP|T300|T301|T30[2-9])\b/i,
    patternType: 'source',
    remediation: 'Map legacy warehouse numbers to EWM warehouse numbers via /SCWM/T300.',
  },
  {
    id: 'SIMPL-EWM-003',
    title: 'Storage Bin Structure Changed',
    description: 'Storage bin model changes from LAGP/LQUA to /SCWM/LAGP and /SCWM/AQUA. Bin structure must be re-mapped.',
    severity: 'high',
    category: 'EWM – Warehouse Structure',
    sNote: '2269324',
    pattern: /\b(LQUA|LAGP-LGPLA|NQUA|MDVM)\b/i,
    patternType: 'source',
    remediation: 'Migrate storage bin data using /SCWM/LAGP. Review quant model in /SCWM/AQUA.',
  },

  // ── Warehouse Processes ──────────────────────────────────────
  {
    id: 'SIMPL-EWM-004',
    title: 'Transfer Orders Replaced by Warehouse Tasks',
    description: 'Transfer Orders (LTAP/LTAK) replaced by Warehouse Tasks and Warehouse Orders in EWM.',
    severity: 'critical',
    category: 'EWM – Warehouse Processes',
    sNote: '2269324',
    pattern: /\b(LTAP|LTAK|LTBK|L_TO_|BAPI_WHSE_TO)\b/i,
    patternType: 'source',
    remediation: 'Replace transfer order logic with warehouse task APIs (/SCWM/API_WT_CREATE).',
  },
  {
    id: 'SIMPL-EWM-005',
    title: 'Goods Movement Integration Changed',
    description: 'WM goods movements (BAPI_GOODSMVT_CREATE with WM step) now trigger EWM warehouse tasks automatically.',
    severity: 'high',
    category: 'EWM – Warehouse Processes',
    sNote: '2269324',
    pattern: /\b(BAPI_GOODSMVT_CREATE.*WM|MB_CREATE_GOODS_MOVEMENT.*WM|L_WM_)\b/i,
    patternType: 'source',
    remediation: 'Review WM-triggered goods movements. EWM uses delivery-based or posting change-based processing.',
  },
  {
    id: 'SIMPL-EWM-006',
    title: 'RF Framework Replaced',
    description: 'Legacy WM RF transactions (LM00-LM99) are replaced by EWM RF framework (/SCWM/RFUI).',
    severity: 'high',
    category: 'EWM – Warehouse Processes',
    sNote: '2269324',
    pattern: /\b(LM[0-9]{2}|SAPLLMOB)\b/i,
    patternType: 'source',
    remediation: 'Migrate RF customizations to EWM RF framework. Review /SCWM/RFUI configuration.',
  },

  // ── Inventory Management ─────────────────────────────────────
  {
    id: 'SIMPL-EWM-007',
    title: 'Physical Inventory in EWM',
    description: 'Physical inventory processes change from WM PI (LI01-LI21) to EWM PI (/SCWM/PI).',
    severity: 'medium',
    category: 'EWM – Inventory',
    sNote: '2269324',
    pattern: /\b(LI0[1-9]|LI1[0-9]|LI2[01]|LX[0-9]{2})\b/i,
    patternType: 'source',
    remediation: 'Migrate physical inventory procedures to EWM. Use /SCWM/PI* transactions.',
  },
  {
    id: 'SIMPL-EWM-008',
    title: 'Handling Unit Management in EWM',
    description: 'HU management changes from LE-WM HU (HUMO) to EWM HU with extended attributes.',
    severity: 'medium',
    category: 'EWM – Inventory',
    sNote: '2269324',
    pattern: /\b(HUMO|HU_CREATE|BAPI_HU_CREATE|L_HU_)\b/i,
    patternType: 'source',
    remediation: 'Review HU processes for EWM compatibility. Use /SCWM/PACK for HU operations.',
  },

  // ── EWM-specific Features ────────────────────────────────────
  {
    id: 'SIMPL-EWM-009',
    title: 'Yard Management Activation',
    description: 'EWM includes yard management capabilities not available in LE-WM.',
    severity: 'low',
    category: 'EWM – Extended Features',
    sNote: '2269324',
    pattern: /\b(YARD_MANAGEMENT|DOCK_APPOINTMENT)\b/i,
    patternType: 'source',
    remediation: 'Evaluate yard management features in embedded EWM for optimization.',
  },
  {
    id: 'SIMPL-EWM-010',
    title: 'Wave Management Activation',
    description: 'EWM wave management replaces legacy WM group processing.',
    severity: 'medium',
    category: 'EWM – Extended Features',
    sNote: '2269324',
    pattern: /\b(WAVE_MANAGEMENT|GROUP_PROCESSING|LT41)\b/i,
    patternType: 'source',
    remediation: 'Configure wave management in EWM to replace group-based processing.',
  },
];
