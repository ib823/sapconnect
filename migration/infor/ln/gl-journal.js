/**
 * Infor LN GL Journal Migration Object
 *
 * Migrates LN General Ledger journal entries (tfgld100/tfgld101)
 * to SAP Accounting Documents (BKPF/ACDOCA).
 *
 * Key transforms:
 * - Document number (docn) maps to BKPF-BELNR
 * - Fiscal year (year) maps to BKPF-GJAHR
 * - Document date (docd) maps to BKPF-BLDAT
 * - Line item amounts map to ACDOCA-HSL
 * - Debit/credit indicator from LN sign convention
 *
 * ~20 field mappings. Mock: 15 journal entries with 40 line items.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforLNGLJournalMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_LN_GL_JOURNAL'; }
  get name() { return 'LN GL Journal to SAP Accounting Document'; }

  getFieldMappings() {
    return [
      // ── Header fields (BKPF) ────────────────────────────────
      { source: 'docn', target: 'BKPF-BELNR', convert: 'padLeft10' },
      { source: 'year', target: 'BKPF-GJAHR', convert: 'toInteger' },
      { source: 'docd', target: 'BKPF-BLDAT', convert: 'toDate' },
      { source: 'pstd', target: 'BKPF-BUDAT', convert: 'toDate' },
      { source: 'fcmp', target: 'BKPF-BUKRS' },
      { source: 'curr', target: 'BKPF-WAERS' },
      { source: 'dcty', target: 'BKPF-BLART', valueMap: {
        'NOR': 'SA', 'REV': 'AB', 'ADJ': 'SB', 'CLO': 'CL', 'MEM': 'SA',
      }, default: 'SA' },
      { source: 'desc', target: 'BKPF-BKTXT' },
      { source: 'refn', target: 'BKPF-XBLNR' },

      // ── Line item fields (ACDOCA) ───────────────────────────
      { source: 'lnum', target: 'ACDOCA-BUZEI' },
      { source: 'fled', target: 'ACDOCA-HKONT', convert: 'padLeft10' },
      { source: 'amount', target: 'ACDOCA-HSL', convert: 'toDecimal' },
      { source: 'tcam', target: 'ACDOCA-TSL', convert: 'toDecimal' },
      { source: 'dbcr', target: 'ACDOCA-SHKZG', valueMap: {
        'D': 'S', 'C': 'H', '1': 'S', '2': 'H',
      }, default: 'S' },
      { source: 'cctr', target: 'ACDOCA-KOSTL', convert: 'padLeft10' },
      { source: 'pctr', target: 'ACDOCA-PRCTR', convert: 'padLeft10' },
      { source: 'ltxt', target: 'ACDOCA-SGTXT' },
      { source: 'ttyp', target: 'ACDOCA-KOART', valueMap: {
        'GL': 'S', 'AR': 'D', 'AP': 'K', 'AA': 'A', 'MM': 'M',
      }, default: 'S' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_LN' },
      { target: 'MigrationObjectId', default: 'INFOR_LN_GL_JOURNAL' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['BKPF-BELNR', 'BKPF-GJAHR', 'BKPF-BUKRS', 'ACDOCA-HKONT', 'ACDOCA-HSL'],
      exactDuplicate: { keys: ['BKPF-BELNR', 'BKPF-GJAHR', 'BKPF-BUKRS', 'ACDOCA-BUZEI'] },
    };
  }

  _extractMock() {
    const records = [];
    const journalHeaders = [
      { docn: '5000001', year: '2024', docd: '20240115', pstd: '20240115', fcmp: '100', curr: 'USD', dcty: 'NOR', desc: 'Material purchase', refn: 'PO-LN-1001' },
      { docn: '5000002', year: '2024', docd: '20240120', pstd: '20240120', fcmp: '100', curr: 'USD', dcty: 'NOR', desc: 'Customer invoice', refn: 'INV-LN-2001' },
      { docn: '5000003', year: '2024', docd: '20240201', pstd: '20240201', fcmp: '100', curr: 'USD', dcty: 'NOR', desc: 'Payroll posting', refn: 'PAY-202401' },
      { docn: '5000004', year: '2024', docd: '20240215', pstd: '20240215', fcmp: '100', curr: 'USD', dcty: 'ADJ', desc: 'Depreciation run Jan', refn: 'DEP-202401' },
      { docn: '5000005', year: '2024', docd: '20240228', pstd: '20240228', fcmp: '100', curr: 'USD', dcty: 'NOR', desc: 'Vendor payment', refn: 'PMT-LN-3001' },
      { docn: '5000006', year: '2024', docd: '20240301', pstd: '20240301', fcmp: '200', curr: 'USD', dcty: 'NOR', desc: 'Intercompany transfer', refn: 'ICO-202403' },
      { docn: '5000007', year: '2024', docd: '20240315', pstd: '20240315', fcmp: '100', curr: 'EUR', dcty: 'NOR', desc: 'Foreign vendor invoice', refn: 'INV-EU-4001' },
      { docn: '5000008', year: '2024', docd: '20240401', pstd: '20240401', fcmp: '100', curr: 'USD', dcty: 'NOR', desc: 'Customer payment receipt', refn: 'RCV-LN-5001' },
      { docn: '5000009', year: '2024', docd: '20240415', pstd: '20240415', fcmp: '200', curr: 'USD', dcty: 'ADJ', desc: 'Provision for bad debts', refn: 'ADJ-202404' },
      { docn: '5000010', year: '2024', docd: '20240501', pstd: '20240501', fcmp: '100', curr: 'USD', dcty: 'NOR', desc: 'Production order settlement', refn: 'PRD-LN-6001' },
      { docn: '5000011', year: '2024', docd: '20240515', pstd: '20240515', fcmp: '100', curr: 'USD', dcty: 'NOR', desc: 'Material consumption', refn: 'GI-LN-7001' },
      { docn: '5000012', year: '2024', docd: '20240601', pstd: '20240601', fcmp: '100', curr: 'USD', dcty: 'REV', desc: 'Reversal of accrual', refn: 'REV-LN-8001' },
      { docn: '5000013', year: '2024', docd: '20240615', pstd: '20240615', fcmp: '200', curr: 'USD', dcty: 'NOR', desc: 'Asset acquisition', refn: 'AST-LN-9001' },
      { docn: '5000014', year: '2024', docd: '20240701', pstd: '20240701', fcmp: '100', curr: 'USD', dcty: 'CLO', desc: 'Half-year closing entry', refn: 'CLO-2024H1' },
      { docn: '5000015', year: '2024', docd: '20240715', pstd: '20240715', fcmp: '100', curr: 'USD', dcty: 'MEM', desc: 'Tax provision Q2', refn: 'TAX-2024Q2' },
    ];

    const lineTemplates = [
      // Doc 1: Material purchase (3 lines)
      [{ fled: '140000', amount: '5000.00', dbcr: 'D', ttyp: 'GL', cctr: '', ltxt: 'Raw materials receipt' },
       { fled: '220000', amount: '450.00', dbcr: 'D', ttyp: 'GL', cctr: '', ltxt: 'Input tax' },
       { fled: '200000', amount: '5450.00', dbcr: 'C', ttyp: 'AP', cctr: '', ltxt: 'Vendor payable' }],
      // Doc 2: Customer invoice (3 lines)
      [{ fled: '113100', amount: '12000.00', dbcr: 'D', ttyp: 'AR', cctr: '', ltxt: 'Customer receivable' },
       { fled: '400000', amount: '10909.09', dbcr: 'C', ttyp: 'GL', cctr: 'CC01', ltxt: 'Sales revenue' },
       { fled: '220000', amount: '1090.91', dbcr: 'C', ttyp: 'GL', cctr: '', ltxt: 'Output tax' }],
      // Doc 3: Payroll (3 lines)
      [{ fled: '600000', amount: '45000.00', dbcr: 'D', ttyp: 'GL', cctr: 'CC03', ltxt: 'Gross salaries' },
       { fled: '210000', amount: '15000.00', dbcr: 'C', ttyp: 'GL', cctr: '', ltxt: 'Payroll withholdings' },
       { fled: '110000', amount: '30000.00', dbcr: 'C', ttyp: 'GL', cctr: '', ltxt: 'Net salary payment' }],
      // Doc 4: Depreciation (2 lines)
      [{ fled: '700000', amount: '8500.00', dbcr: 'D', ttyp: 'GL', cctr: 'CC05', ltxt: 'Depreciation expense' },
       { fled: '154000', amount: '8500.00', dbcr: 'C', ttyp: 'AA', cctr: '', ltxt: 'Accumulated depreciation' }],
      // Doc 5: Vendor payment (2 lines)
      [{ fled: '200000', amount: '5450.00', dbcr: 'D', ttyp: 'AP', cctr: '', ltxt: 'Clear vendor payable' },
       { fled: '110000', amount: '5450.00', dbcr: 'C', ttyp: 'GL', cctr: '', ltxt: 'Bank payment' }],
      // Doc 6: Intercompany (2 lines)
      [{ fled: '890000', amount: '25000.00', dbcr: 'D', ttyp: 'GL', cctr: '', ltxt: 'ICO clearing debit' },
       { fled: '110000', amount: '25000.00', dbcr: 'C', ttyp: 'GL', cctr: '', ltxt: 'ICO bank transfer' }],
      // Doc 7: Foreign vendor (3 lines)
      [{ fled: '510000', amount: '3200.00', dbcr: 'D', ttyp: 'GL', cctr: 'CC02', ltxt: 'Material costs EUR' },
       { fled: '220000', amount: '288.00', dbcr: 'D', ttyp: 'GL', cctr: '', ltxt: 'Input tax EUR' },
       { fled: '200000', amount: '3488.00', dbcr: 'C', ttyp: 'AP', cctr: '', ltxt: 'Vendor payable EUR' }],
      // Doc 8: Customer payment (2 lines)
      [{ fled: '110000', amount: '12000.00', dbcr: 'D', ttyp: 'GL', cctr: '', ltxt: 'Bank receipt' },
       { fled: '113100', amount: '12000.00', dbcr: 'C', ttyp: 'AR', cctr: '', ltxt: 'Clear receivable' }],
      // Doc 9: Bad debt provision (2 lines)
      [{ fled: '430000', amount: '2500.00', dbcr: 'D', ttyp: 'GL', cctr: 'CC04', ltxt: 'Bad debt expense' },
       { fled: '113100', amount: '2500.00', dbcr: 'C', ttyp: 'GL', cctr: '', ltxt: 'Allowance for doubtful' }],
      // Doc 10: Production settlement (3 lines)
      [{ fled: '142000', amount: '18000.00', dbcr: 'D', ttyp: 'GL', cctr: '', ltxt: 'Finished goods receipt' },
       { fled: '141000', amount: '15000.00', dbcr: 'C', ttyp: 'GL', cctr: 'CC01', ltxt: 'WIP settlement' },
       { fled: '500000', amount: '3000.00', dbcr: 'C', ttyp: 'GL', cctr: 'CC01', ltxt: 'Production variance' }],
      // Doc 11: Material consumption (2 lines)
      [{ fled: '500000', amount: '7500.00', dbcr: 'D', ttyp: 'MM', cctr: 'CC01', ltxt: 'Material issued to prod' },
       { fled: '140000', amount: '7500.00', dbcr: 'C', ttyp: 'GL', cctr: '', ltxt: 'Inventory reduction' }],
      // Doc 12: Reversal (3 lines)
      [{ fled: '210000', amount: '4200.00', dbcr: 'D', ttyp: 'GL', cctr: '', ltxt: 'Reverse accrual' },
       { fled: '510000', amount: '3818.18', dbcr: 'C', ttyp: 'GL', cctr: 'CC02', ltxt: 'Reverse material cost' },
       { fled: '220000', amount: '381.82', dbcr: 'C', ttyp: 'GL', cctr: '', ltxt: 'Reverse tax' }],
      // Doc 13: Asset acquisition (2 lines)
      [{ fled: '150000', amount: '35000.00', dbcr: 'D', ttyp: 'AA', cctr: '', ltxt: 'Asset capitalization' },
       { fled: '110000', amount: '35000.00', dbcr: 'C', ttyp: 'GL', cctr: '', ltxt: 'Bank payment for asset' }],
      // Doc 14: Closing entry (3 lines)
      [{ fled: '400000', amount: '85000.00', dbcr: 'D', ttyp: 'GL', cctr: '', ltxt: 'Close revenue to P&L' },
       { fled: '500000', amount: '60000.00', dbcr: 'C', ttyp: 'GL', cctr: '', ltxt: 'Close COGS to P&L' },
       { fled: '290000', amount: '25000.00', dbcr: 'C', ttyp: 'GL', cctr: '', ltxt: 'Transfer to retained' }],
      // Doc 15: Tax provision (2 lines)
      [{ fled: '430000', amount: '12500.00', dbcr: 'D', ttyp: 'GL', cctr: 'CC04', ltxt: 'Tax provision Q2' },
       { fled: '220000', amount: '12500.00', dbcr: 'C', ttyp: 'GL', cctr: '', ltxt: 'Tax payable provision' }],
    ];

    for (let h = 0; h < journalHeaders.length; h++) {
      const hdr = journalHeaders[h];
      const lines = lineTemplates[h];
      for (let l = 0; l < lines.length; l++) {
        const line = lines[l];
        records.push({
          docn: hdr.docn,
          year: hdr.year,
          docd: hdr.docd,
          pstd: hdr.pstd,
          fcmp: hdr.fcmp,
          curr: hdr.curr,
          dcty: hdr.dcty,
          desc: hdr.desc,
          refn: hdr.refn,
          lnum: String((l + 1) * 10).padStart(3, '0'),
          fled: line.fled,
          amount: line.amount,
          tcam: line.amount,
          dbcr: line.dbcr,
          cctr: line.cctr,
          pctr: line.cctr ? `P${line.cctr.slice(1)}` : '',
          ltxt: line.ltxt,
          ttyp: line.ttyp,
        });
      }
    }

    return records; // 15 headers, 40 line items total
  }
}

module.exports = InforLNGLJournalMigrationObject;
