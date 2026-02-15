/**
 * Infor LN Production Planning Transformation Rules
 *
 * Maps LN production/manufacturing fields to SAP PP equivalents:
 * - BOM usage mapping
 * - Routing operation mapping
 * - Work center type mapping
 * - Production order type/status mapping
 */

module.exports = {
  ruleSetId: 'LN_PP_RULES',
  name: 'Infor LN Production Planning Transformation Rules',
  rules: [
    // ── BOM Usage ────────────────────────────────────────────────
    {
      source: 't$bmus',
      target: 'STLAN',
      valueMap: {
        'PRD': '1',    // Production BOM -> Manufacturing
        'ENG': '2',    // Engineering BOM -> Design
        'SVC': '5',    // Service BOM -> Plant Maintenance
        'SLS': '6',    // Sales BOM -> Sales
        'CST': '3',    // Costing BOM -> Costing
        'UNV': '1',    // Universal -> Manufacturing
      },
      default: '1',
      description: 'LN BOM usage to SAP BOM usage (STLAN)',
    },
    // ── BOM Status ───────────────────────────────────────────────
    {
      source: 't$bsts',
      target: 'STLST',
      valueMap: {
        'ACT': '01',   // Active -> Released
        'NEW': '02',   // New -> In creation
        'INA': '04',   // Inactive -> Locked
        'OBS': '05',   // Obsolete -> Flagged for deletion
        'ENG': '02',   // Engineering -> In creation
      },
      default: '01',
      description: 'LN BOM status to SAP BOM status',
    },
    // ── BOM Item Category ────────────────────────────────────────
    {
      source: 't$bmit',
      target: 'POSTP',
      valueMap: {
        'STD': 'L',    // Standard component -> Stock item
        'PHA': 'R',    // Phantom -> Variable-size item
        'TXT': 'T',    // Text item -> Text item
        'DOC': 'D',    // Document -> Document item
        'COP': 'N',    // Co-product -> Non-stock item
        'RAW': 'L',    // Raw material -> Stock item
        'PKG': 'L',    // Packaging -> Stock item
      },
      default: 'L',
      description: 'LN BOM item type to SAP BOM item category',
    },
    // ── Component Quantity ───────────────────────────────────────
    {
      source: 't$qnty',
      target: 'MENGE',
      convert: 'toDecimal',
      description: 'BOM component quantity',
    },
    {
      source: 't$scrf',
      target: 'AUSCH',
      convert: 'toDecimal',
      description: 'Component scrap percentage',
    },
    // ── Routing Operation Type ───────────────────────────────────
    {
      source: 't$optp',
      target: 'STEUS',
      valueMap: {
        'INT': 'PP01',    // Internal operation -> Internal processing
        'SUB': 'PP02',    // Subcontracting -> External processing
        'INS': 'PP03',    // Inspection -> Inspection operation
        'TST': 'PP04',    // Testing -> Test operation
        'PKG': 'PP05',    // Packaging -> Packaging
        'STP': 'PP01',    // Setup -> Internal processing
        'MOV': 'PP06',    // Movement -> Handling
      },
      default: 'PP01',
      description: 'LN operation type to SAP control key',
    },
    // ── Operation Times ──────────────────────────────────────────
    {
      source: 't$stim',
      target: 'VGW01',
      convert: 'toDecimal',
      description: 'Setup time (minutes)',
    },
    {
      source: 't$rtim',
      target: 'VGW02',
      convert: 'toDecimal',
      description: 'Run time per unit (minutes)',
    },
    {
      source: 't$wtim',
      target: 'VGW03',
      convert: 'toDecimal',
      description: 'Wait/queue time (minutes)',
    },
    // ── Work Center Type ─────────────────────────────────────────
    {
      source: 't$wctp',
      target: 'VERWE',
      valueMap: {
        'MCH': '0001',    // Machine -> Production
        'LAB': '0002',    // Labor -> Direct labor
        'ASM': '0003',    // Assembly -> Assembly
        'TST': '0004',    // Test station -> Testing
        'PKG': '0005',    // Packaging station -> Packaging
        'STR': '0006',    // Storage -> Warehouse
        'EXT': '0007',    // External -> Subcontracting
      },
      default: '0001',
      description: 'LN work center type to SAP work center category',
    },
    // ── Production Order Type ────────────────────────────────────
    {
      source: 't$potp',
      target: 'AUART',
      valueMap: {
        'STD': 'PP01',    // Standard production
        'REP': 'PP02',    // Repetitive
        'RWK': 'PP03',    // Rework
        'PRO': 'PP04',    // Prototype
        'SMP': 'PP05',    // Sample order
        'SBC': 'PP10',    // Subcontracting
      },
      default: 'PP01',
      description: 'LN production order type to SAP order type',
    },
    // ── Production Order Status ──────────────────────────────────
    {
      source: 't$post',
      target: 'STATUS',
      valueMap: {
        'CRE': 'CRTD',    // Created
        'PLN': 'PLAN',     // Planned
        'REL': 'REL',      // Released
        'ACT': 'REL',      // Active -> Released
        'CMP': 'TECO',     // Completed -> Technically Complete
        'CLO': 'DLT',      // Closed -> Delivered
        'CAN': 'DLT',      // Cancelled -> Deleted
      },
      default: 'CRTD',
      description: 'LN production order status to SAP order status',
    },
    // ── Material Number ──────────────────────────────────────────
    {
      source: 'item',
      target: 'MATNR',
      convert: 'toUpperCase',
      description: 'Material number for BOM/routing',
    },
    // ── Plant ────────────────────────────────────────────────────
    {
      source: 't$site',
      target: 'WERKS',
      transform: (v) => {
        if (!v) return '';
        return String(v).substring(0, 4).toUpperCase();
      },
      description: 'LN production site to SAP plant',
    },
    // ── Metadata ─────────────────────────────────────────────────
    {
      target: 'SourceSystem',
      default: 'INFOR_LN',
      description: 'Source system identifier',
    },
  ],
};
