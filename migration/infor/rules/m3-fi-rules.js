/**
 * Infor M3 Financial Transformation Rules
 *
 * Maps M3 financial fields to SAP FI equivalents:
 * - GL account formatting (M3 uses 8-digit accounts)
 * - Currency and amount handling
 * - Fiscal period/year mapping
 * - Voucher type to document type
 * - M3 division to SAP company code
 */

module.exports = {
  ruleSetId: 'M3_FI_RULES',
  name: 'Infor M3 Financial Transformation Rules',
  rules: [
    // ── GL Account Number ────────────────────────────────────────
    {
      source: 'AITM',
      target: 'SAKNR',
      transform: (v) => {
        if (!v) return '';
        // M3 uses up to 8-digit accounts; SAP expects 10-digit
        const stripped = String(v).replace(/^0+/, '') || '0';
        return stripped.padStart(10, '0');
      },
      description: 'M3 accounting identity (AITM) to SAP GL account (10-digit)',
    },
    {
      source: 'AIT1',
      target: 'TXT20',
      convert: 'trim',
      description: 'GL account short text',
    },
    {
      source: 'AIT2',
      target: 'TXT50',
      convert: 'trim',
      description: 'GL account long text',
    },
    // ── Currency ─────────────────────────────────────────────────
    {
      source: 'CUCD',
      target: 'WAERS',
      convert: 'toUpperCase',
      description: 'M3 currency code to SAP currency',
    },
    {
      source: 'LOCD',
      target: 'HWAER',
      convert: 'toUpperCase',
      description: 'M3 local currency to SAP local currency',
    },
    // ── Fiscal Period/Year ───────────────────────────────────────
    {
      source: 'ACYP',
      target: 'MONAT',
      transform: (v) => {
        if (!v) return '00';
        // M3 uses YYYYMM format; extract MM portion
        const s = String(v);
        if (s.length >= 6) return s.slice(4, 6);
        const p = parseInt(s, 10);
        if (isNaN(p)) return '00';
        return String(p).padStart(2, '0');
      },
      description: 'M3 accounting period (YYYYMM) to SAP posting period',
    },
    {
      source: 'ACYP',
      target: 'GJAHR',
      transform: (v) => {
        if (!v) return 0;
        const s = String(v);
        if (s.length >= 4) return parseInt(s.slice(0, 4), 10);
        return 0;
      },
      description: 'M3 accounting period to SAP fiscal year',
    },
    // ── Voucher Type → Document Type ─────────────────────────────
    {
      source: 'VSER',
      target: 'BLART',
      valueMap: {
        'AA': 'SA',    // General journal -> G/L Account Document
        'AB': 'AB',    // Clearing -> Clearing
        'AP': 'KR',    // Accounts payable -> Vendor Invoice
        'AR': 'DR',    // Accounts receivable -> Customer Invoice
        'CA': 'SA',    // Cash accounting -> G/L Account Document
        'FA': 'AA',    // Fixed asset -> Asset Posting
        'PR': 'WE',    // Purchase receipt -> Goods Receipt
        'RV': 'SA',    // Revaluation -> G/L Account Document
        'TX': 'SA',    // Tax -> G/L Account Document
      },
      default: 'SA',
      description: 'M3 voucher series to SAP document type',
    },
    // ── Debit/Credit ─────────────────────────────────────────────
    {
      source: 'DBCR',
      target: 'SHKZG',
      valueMap: {
        '1': 'S',   // Debit
        '2': 'H',   // Credit
        'D': 'S',
        'C': 'H',
      },
      default: 'S',
      description: 'M3 debit/credit indicator to SAP',
    },
    // ── Amount Fields ────────────────────────────────────────────
    {
      source: 'ACAM',
      target: 'WRBTR',
      convert: 'toDecimal',
      description: 'Accounting amount (foreign currency)',
    },
    {
      source: 'ACAL',
      target: 'DMBTR',
      convert: 'toDecimal',
      description: 'Accounting amount (local currency)',
    },
    // ── Division → Company Code ──────────────────────────────────
    {
      source: 'DIVI',
      target: 'BUKRS',
      transform: (v) => {
        if (!v) return '';
        return String(v).padStart(4, '0');
      },
      description: 'M3 division to SAP company code (4-digit)',
    },
    // ── Accounting Dimensions ────────────────────────────────────
    {
      source: 'AIT7',
      target: 'KOSTL',
      transform: (v) => {
        if (!v) return '';
        return String(v).padStart(10, '0');
      },
      description: 'M3 accounting dimension 7 to SAP cost center',
    },
    {
      source: 'AIT6',
      target: 'PRCTR',
      convert: 'trim',
      description: 'M3 accounting dimension 6 to SAP profit center',
    },
    // ── Voucher/Document Date ────────────────────────────────────
    {
      source: 'VONO',
      target: 'BELNR',
      transform: (v) => {
        if (!v) return '';
        return String(v).padStart(10, '0');
      },
      description: 'M3 voucher number to SAP document number',
    },
    {
      source: 'ACDT',
      target: 'BUDAT',
      convert: 'toDate',
      description: 'M3 accounting date to SAP posting date',
    },
    {
      source: 'IVDT',
      target: 'BLDAT',
      convert: 'toDate',
      description: 'M3 invoice date to SAP document date',
    },
    // ── Tax Code ─────────────────────────────────────────────────
    {
      source: 'VTCD',
      target: 'MWSKZ',
      valueMap: {
        'TX00': 'V0',   // Exempt
        'TX10': 'A1',   // Standard rate
        'TX05': 'A2',   // Reduced rate
        'TX20': 'V1',   // Input tax standard
        'TX25': 'V2',   // Input tax reduced
        'TXEU': 'A1',   // EU VAT
        'TXFR': 'V0',   // Tax free
      },
      default: 'V0',
      description: 'M3 tax code to SAP tax code',
    },
    // ── Reference ────────────────────────────────────────────────
    {
      source: 'VTXT',
      target: 'SGTXT',
      convert: 'trim',
      description: 'M3 voucher text to SAP line item text',
    },
    // ── Metadata ─────────────────────────────────────────────────
    {
      target: 'SourceSystem',
      default: 'INFOR_M3',
      description: 'Source system identifier',
    },
  ],
};
