/**
 * Infor M3 Sales & Distribution Transformation Rules
 *
 * Maps M3 customer order fields to SAP SD equivalents:
 * - Order type mapping (ORTP)
 * - Customer number formatting
 * - Pricing / discount handling
 * - Delivery terms mapping
 */

module.exports = {
  ruleSetId: 'M3_SD_RULES',
  name: 'Infor M3 Sales & Distribution Transformation Rules',
  rules: [
    // ── Order Type ───────────────────────────────────────────────
    {
      source: 'ORTP',
      target: 'AUART',
      valueMap: {
        'CO1': 'TA',    // Customer order -> Standard Order
        'CO2': 'TA',    // Customer order (alternative) -> Standard Order
        'RET': 'RE',    // Return order -> Returns
        'CRM': 'CR',    // Credit memo -> Credit Memo Request
        'DBM': 'DR',    // Debit memo -> Debit Memo Request
        'QUO': 'QT',    // Quotation -> Quotation
        'BLO': 'DS',    // Blanket order -> Scheduling Agreement
        'ICO': 'TA',    // Intercompany order -> Standard Order
        'RSH': 'SO',    // Rush order -> Rush Order
        'FOC': 'FD',    // Free of charge -> Free-of-Charge Delivery
      },
      default: 'TA',
      description: 'M3 order type to SAP sales document type',
    },
    // ── Customer Number ──────────────────────────────────────────
    {
      source: 'CUNO',
      target: 'KUNNR',
      transform: (v) => {
        if (!v) return '';
        return String(v).padStart(10, '0');
      },
      description: 'M3 customer number to SAP customer number (10-digit)',
    },
    // ── Sales Organization ───────────────────────────────────────
    {
      source: 'DIVI',
      target: 'VKORG',
      transform: (v) => {
        if (!v) return '';
        return String(v).padStart(4, '0');
      },
      description: 'M3 division to SAP sales organization',
    },
    // ── Facility → Distribution Channel ──────────────────────────
    {
      source: 'FACI',
      target: 'VTWEG',
      valueMap: {
        'D10': '10',   // Domestic
        'D20': '20',   // Export
        'D30': '30',   // Intercompany
        'W10': '10',   // Warehouse direct
        'W20': '20',   // Warehouse wholesale
      },
      default: '10',
      description: 'M3 facility to SAP distribution channel',
    },
    // ── Pricing ──────────────────────────────────────────────────
    {
      source: 'PLCD',
      target: 'KSCHL',
      valueMap: {
        'PL01': 'PR00',  // Base price list
        'PL02': 'PR01',  // Customer price list
        'PL03': 'PR02',  // Contract price
        'DI01': 'K004',  // Discount 1
        'DI02': 'K005',  // Discount 2
        'DI03': 'K007',  // Volume discount
        'SU01': 'KF00',  // Surcharge
        'FR01': 'KF00',  // Freight charge
      },
      default: 'PR00',
      description: 'M3 price list code to SAP condition type',
    },
    // ── Payment Terms ────────────────────────────────────────────
    {
      source: 'TEPY',
      target: 'ZTERM',
      valueMap: {
        'N30': 'ZN30',
        'N45': 'ZN45',
        'N60': 'ZN60',
        'N90': 'ZN90',
        'COD': 'ZC00',
        'CIA': 'ZC00',
        '210': 'ZD10',  // 2% 10, net 30
        'N10': 'ZN10',
        'N15': 'ZN15',
      },
      default: 'ZN30',
      description: 'M3 payment terms to SAP payment terms',
    },
    // ── Delivery Terms ───────────────────────────────────────────
    {
      source: 'TEDL',
      target: 'INCO1',
      valueMap: {
        'FOB': 'FOB',
        'CIF': 'CIF',
        'EXW': 'EXW',
        'FCA': 'FCA',
        'DAP': 'DAP',
        'DDP': 'DDP',
        'CFR': 'CFR',
        'CPT': 'CPT',
      },
      default: 'FOB',
      description: 'M3 delivery terms to SAP Incoterms',
    },
    // ── Order/Delivery Dates ─────────────────────────────────────
    {
      source: 'ORDT',
      target: 'AUDAT',
      convert: 'toDate',
      description: 'Order date',
    },
    {
      source: 'RLDT',
      target: 'VDATU',
      convert: 'toDate',
      description: 'Requested delivery date',
    },
    // ── Currency ─────────────────────────────────────────────────
    {
      source: 'CUCD',
      target: 'WAERK',
      convert: 'toUpperCase',
      description: 'Order currency',
    },
    // ── Reference Numbers ────────────────────────────────────────
    {
      source: 'ORNO',
      target: 'BSTNK',
      convert: 'trim',
      description: 'M3 order number to SAP customer PO number',
    },
    {
      source: 'CUOR',
      target: 'IHREZ',
      convert: 'trim',
      description: 'Customer order reference',
    },
    // ── Delivery Method ──────────────────────────────────────────
    {
      source: 'MODL',
      target: 'VSBED',
      valueMap: {
        'TRK': '01',   // Truck
        'AIR': '02',   // Air freight
        'SEA': '03',   // Sea freight
        'RAL': '04',   // Rail
        'COU': '05',   // Courier
        'PKP': '06',   // Customer pickup
      },
      default: '01',
      description: 'M3 delivery method to SAP shipping condition',
    },
    // ── Metadata ─────────────────────────────────────────────────
    {
      target: 'SourceSystem',
      default: 'INFOR_M3',
      description: 'Source system identifier',
    },
  ],
};
