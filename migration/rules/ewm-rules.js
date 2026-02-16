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
 * Extended Warehouse Management (EWM) Rules
 *
 * Covers transition from legacy WM (LE-WM) to embedded EWM in S/4HANA.
 * Key: WM movement types replaced, LQUA/LAGP restructured,
 * RF framework changes, warehouse task model replaces transfer orders.
 * Extended: putaway, picking, packing, staging, master data, labor mgmt,
 * slotting, rearrangement, quality inspection, cross-docking, VAS, TM/PP integration.
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

  // ── Putaway Processes ────────────────────────────────────────
  {
    id: 'SIMPL-EWM-011',
    title: 'Putaway Strategy Migration',
    description: 'Legacy WM putaway strategies (fixed bin, open storage, addition to stock) replaced by EWM putaway rules with extended determination logic including activity area, hazardous substance checks, and capacity checks.',
    severity: 'high',
    category: 'EWM – Putaway',
    sNote: '2269324',
    pattern: /\b(PUTAWAY_STRAT|LP21|LS21|L_PUTAWAY|WM_PUTAWAY)\b/i,
    patternType: 'source',
    remediation: 'Configure EWM putaway rules via /SCWM/PRULE. Map legacy putaway strategies to EWM determination logic.',
  },
  {
    id: 'SIMPL-EWM-012',
    title: 'Storage Type Determination in EWM',
    description: 'Legacy storage type search logic (T334T/T334P) replaced by EWM storage process determination with extended attributes including activity area assignment and process-oriented storage control.',
    severity: 'high',
    category: 'EWM – Putaway',
    sNote: '2269324',
    pattern: /\b(T334T|T334P|STORAGE_TYPE_DET|LS01|LS02)\b/i,
    patternType: 'source',
    remediation: 'Configure storage process types in EWM. Use /SCWM/SPT for storage process assignment.',
  },

  // ── Picking Processes ────────────────────────────────────────
  {
    id: 'SIMPL-EWM-013',
    title: 'Picking Strategy Replacement',
    description: 'Legacy WM picking strategies (FIFO, LIFO, partial pallet, fixed bin) replaced by EWM stock removal rules with sort criteria, pick HU determination, and consolidation group logic.',
    severity: 'high',
    category: 'EWM – Picking',
    sNote: '2269324',
    pattern: /\b(PICK_STRATEGY|LP10|LP11|L_PICK|WM_PICKING)\b/i,
    patternType: 'source',
    remediation: 'Configure EWM stock removal strategies via /SCWM/SRULE. Define pick point determination and consolidation groups.',
  },
  {
    id: 'SIMPL-EWM-014',
    title: 'Pick-by-Voice and Pick-by-Light Integration',
    description: 'EWM provides native pick-by-voice and pick-by-light integration replacing custom LE-WM RF enhancements for hands-free picking.',
    severity: 'medium',
    category: 'EWM – Picking',
    sNote: '2269324',
    pattern: /\b(PICK_BY_VOICE|PICK_BY_LIGHT|RF_PICK_CUSTOM|PTL_PICK)\b/i,
    patternType: 'source',
    remediation: 'Migrate custom picking device integrations to EWM native pick-by-voice or pick-by-light framework.',
  },

  // ── Packing and Staging ──────────────────────────────────────
  {
    id: 'SIMPL-EWM-015',
    title: 'Packing Station Process Migration',
    description: 'Legacy WM packing (COWB, VL02N packing) replaced by EWM packing workstation (/SCWM/PACK) with ship-HU creation, weight/volume capture, and label printing integration.',
    severity: 'high',
    category: 'EWM – Packing',
    sNote: '2269324',
    pattern: /\b(COWB|VL02N.*PACK|WM_PACKING|PACK_STATION)\b/i,
    patternType: 'source',
    remediation: 'Configure EWM packing workstation (/SCWM/PACK). Define packing profiles, ship-HU determination, and printing.',
  },
  {
    id: 'SIMPL-EWM-016',
    title: 'Staging Area Management',
    description: 'Staging area concepts change from LE-WM staging areas in storage type to EWM staging areas with door and work center assignments. Goods issue staging and loading controlled by warehouse order steps.',
    severity: 'medium',
    category: 'EWM – Staging',
    sNote: '2269324',
    pattern: /\b(STAGING_AREA|GI_STAGING|LOADING_POINT|WM_STAGING)\b/i,
    patternType: 'source',
    remediation: 'Define EWM staging areas and assign to doors. Configure warehouse order steps for staging and loading.',
  },

  // ── EWM Master Data ──────────────────────────────────────────
  {
    id: 'SIMPL-EWM-017',
    title: 'EWM Product Master Data Alignment',
    description: 'EWM requires product master data with warehouse-specific views including storage type indicators, putaway/removal control, and packaging specifications. Legacy WM material-storage-location views must be extended.',
    severity: 'high',
    category: 'EWM – Master Data',
    sNote: '2269324',
    pattern: /\b(EWM_PRODUCT|MARD.*EWM|SCWM_PRODUCT|PRODUCT_WHSE)\b|\/SCWM\/MARA/i,
    patternType: 'source',
    remediation: 'Maintain EWM product master data. Configure /SCWM/MAT1 for warehouse product assignment and storage parameters.',
  },
  {
    id: 'SIMPL-EWM-018',
    title: 'Packaging Specification Management',
    description: 'EWM packaging specifications define allowed packaging hierarchies, dimensions, and weights for products. No direct equivalent in LE-WM; replaces custom packing instruction tables.',
    severity: 'medium',
    category: 'EWM – Master Data',
    sNote: '2269324',
    pattern: /\b(PACK_SPEC|PACKAGING_SPEC|PACK_INSTRUCTION|HU_TEMPLATE)\b|\/SCWM\/PACKSPEC/i,
    patternType: 'source',
    remediation: 'Define packaging specifications in /SCWM/PACKSPEC. Map legacy packing instructions to EWM packaging hierarchies.',
  },
  {
    id: 'SIMPL-EWM-019',
    title: 'Activity Area Configuration',
    description: 'EWM activity areas define physical warehouse zones for process control, labor management, and capacity planning. Legacy WM storage sections and picking areas must be mapped to activity areas.',
    severity: 'medium',
    category: 'EWM – Master Data',
    sNote: '2269324',
    pattern: /\b(ACTIVITY_AREA|STORAGE_SECTION|PICKING_AREA|T301.*SECTION)\b/i,
    patternType: 'source',
    remediation: 'Configure EWM activity areas. Map legacy storage sections to activity areas for process control and reporting.',
  },

  // ── Labor and Resource Management ────────────────────────────
  {
    id: 'SIMPL-EWM-020',
    title: 'Labor Management Activation',
    description: 'EWM provides integrated labor management (LM) for measuring worker productivity through engineered labor standards, planned vs. actual time tracking, and incentive calculations. No equivalent in LE-WM.',
    severity: 'medium',
    category: 'EWM – Labor Management',
    sNote: '2269324',
    pattern: /\b(LABOR_MGMT|EWM_LM|WORKER_PROD|ENGINEERED_STANDARD)\b|\/SCWM\/LM/i,
    patternType: 'source',
    remediation: 'Evaluate EWM labor management module. Configure engineered standards and indirect labor tracking if applicable.',
  },
  {
    id: 'SIMPL-EWM-021',
    title: 'Resource Management for MHE',
    description: 'EWM resource management tracks material handling equipment (MHE) such as forklifts, conveyors, and sorters. Resources are assigned to warehouse orders for optimized task execution. Replaces custom LE-WM resource tracking.',
    severity: 'medium',
    category: 'EWM – Resource Management',
    sNote: '2269324',
    pattern: /\b(MHE_RESOURCE|RESOURCE_MGMT|FORKLIFT_ASSIGN|CONVEYOR_CTRL)\b|\/SCWM\/RSRC/i,
    patternType: 'source',
    remediation: 'Configure EWM resources via /SCWM/RSRC. Define resource types and assign to queues for warehouse order processing.',
  },

  // ── Slotting and Rearrangement ───────────────────────────────
  {
    id: 'SIMPL-EWM-022',
    title: 'Slotting and Rearrangement',
    description: 'EWM slotting optimizes product placement based on demand frequency, ergonomics, and product affinity. Rearrangement warehouse tasks relocate stock to optimal bins. No direct LE-WM equivalent.',
    severity: 'low',
    category: 'EWM – Optimization',
    sNote: '2269324',
    pattern: /\b(SLOTTING|REARRANGEMENT|BIN_OPTIMIZATION|SLOT_PLAN)\b|\/SCWM\/SLOT/i,
    patternType: 'source',
    remediation: 'Evaluate EWM slotting functionality. Configure slotting parameters and rearrangement runs for bin optimization.',
  },

  // ── Quality Inspection ───────────────────────────────────────
  {
    id: 'SIMPL-EWM-023',
    title: 'Quality Inspection in Warehouse',
    description: 'EWM supports quality inspection processing with inspection rules triggered during goods receipt, putaway, or production supply. Integrates with QM inspection lots and usage decisions. Replaces custom LE-WM quality checks.',
    severity: 'medium',
    category: 'EWM – Quality',
    sNote: '2269324',
    pattern: /\b(EWM_QI|QA_INSPECTION.*WH|WH_QUALITY|INSPECT_RULE)\b|\/SCWM\/QI/i,
    patternType: 'source',
    remediation: 'Configure EWM quality inspection rules. Integrate with S/4HANA QM for inspection lot creation and usage decisions.',
  },

  // ── Cross-Docking and VAS ────────────────────────────────────
  {
    id: 'SIMPL-EWM-024',
    title: 'Cross-Docking Processing',
    description: 'EWM cross-docking enables direct transfer from inbound to outbound without intermediate storage. Supports planned, opportunistic, and push-based cross-docking types. Custom LE-WM cross-dock solutions must be migrated.',
    severity: 'medium',
    category: 'EWM – Cross-Docking',
    sNote: '2269324',
    pattern: /\b(CROSS_DOCK|X_DOCK|CD_PLANNING|PUSH_DEPLOYMENT)\b|\/SCWM\/CD/i,
    patternType: 'source',
    remediation: 'Configure EWM cross-docking rules. Define cross-docking criteria and relevance determination.',
  },
  {
    id: 'SIMPL-EWM-025',
    title: 'Value-Added Services (VAS)',
    description: 'EWM value-added services manage kitting, labeling, assembly, and other services within the warehouse. VAS orders are integrated into the warehouse task flow. No direct LE-WM equivalent exists.',
    severity: 'low',
    category: 'EWM – VAS',
    sNote: '2269324',
    pattern: /\b(VAS_ORDER|VALUE_ADDED|KITTING|VAS_ACTIVITY)\b|\/SCWM\/VAS/i,
    patternType: 'source',
    remediation: 'Evaluate EWM VAS capabilities. Configure VAS order types and integrate with production or outbound processing.',
  },

  // ── Integration with TM and PP ───────────────────────────────
  {
    id: 'SIMPL-EWM-026',
    title: 'EWM-TM Integration for Freight Processing',
    description: 'Embedded EWM integrates with TM for freight order-driven warehouse processing. Outbound delivery creation triggers freight unit building and dock scheduling. Legacy shipment-to-WM links must be replaced.',
    severity: 'high',
    category: 'EWM – TM Integration',
    sNote: '2269324',
    pattern: /\b(EWM_TM_INT|FREIGHT_WH|DOCK_SCHEDULE|TM_LOADING)\b|\/SCWM\/TM/i,
    patternType: 'source',
    remediation: 'Configure EWM-TM integration scenarios. Set up dock appointment scheduling and freight order-based warehouse processing.',
  },
  {
    id: 'SIMPL-EWM-027',
    title: 'Production Supply via EWM (PP-EWM Integration)',
    description: 'EWM production supply replaces LE-WM production storage bin replenishment. Supports staging methods (pick parts, release order parts, manual) and production material request (PMR) processing for shop floor supply.',
    severity: 'high',
    category: 'EWM – PP Integration',
    sNote: '2269324',
    pattern: /\b(PROD_SUPPLY|PMR_REQUEST|STAGING_METHOD|PP_EWM_INT)\b|\/SCWM\/PMR/i,
    patternType: 'source',
    remediation: 'Configure production supply scenarios in EWM. Define staging methods and production material request processing.',
  },
  {
    id: 'SIMPL-EWM-028',
    title: 'Replenishment Control in EWM',
    description: 'EWM replenishment replaces legacy WM fixed-bin replenishment with advanced rules including planned, automatic, and direct replenishment types. Minimum/maximum stock levels are defined per storage bin or activity area.',
    severity: 'medium',
    category: 'EWM – Replenishment',
    sNote: '2269324',
    pattern: /\b(REPLENISHMENT|REPL_CONTROL|MIN_MAX_STOCK|LP22)\b|\/SCWM\/REPL/i,
    patternType: 'source',
    remediation: 'Configure EWM replenishment rules. Define replenishment triggers, minimum/maximum stock levels, and priority logic.',
  },
];
