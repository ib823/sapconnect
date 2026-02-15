/**
 * Infor M3 GL Journal Migration Object
 *
 * Migrates M3 GL Journal Entries (FSLEDG)
 * to SAP Accounting Documents (BKPF/ACDOCA).
 *
 * M3 FSLEDG uses ES prefix for journal fields:
 *   ESVONO — voucher number
 *   ESYEA4 — fiscal year
 *   ESACDT — accounting date
 *
 * ~18 field mappings. Mock: 12 journal entries with 30 line items.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforM3GLJournalMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_M3_GL_JOURNAL'; }
  get name() { return 'Infor M3 GL Journal'; }

  getFieldMappings() {
    return [
      // ── Header fields (BKPF) ────────────────────────────────
      { source: 'ESVONO', target: 'BKPF-BELNR', convert: 'padLeft10' },
      { source: 'ESYEA4', target: 'BKPF-GJAHR', convert: 'toInteger' },
      { source: 'ESACDT', target: 'BKPF-BLDAT', convert: 'toDate' },
      { source: 'ESVTDT', target: 'BKPF-BUDAT', convert: 'toDate' },
      { source: 'ESDIVI', target: 'BKPF-BUKRS' },
      { source: 'ESCUCD', target: 'BKPF-WAERS' },
      { source: 'ESVSER', target: 'BKPF-BLART', valueMap: {
        'GEN': 'SA', 'REV': 'AB', 'ADJ': 'SB', 'MAN': 'SA',
      }, default: 'SA' },
      { source: 'ESVTXT', target: 'BKPF-BKTXT' },

      // ── Line item fields (ACDOCA) ───────────────────────────
      { source: 'ESJBNO', target: 'ACDOCA-BUZEI' },
      { source: 'ESAIT1', target: 'ACDOCA-HKONT', convert: 'padLeft10' },
      { source: 'ESACAM', target: 'ACDOCA-HSL', convert: 'toDecimal' },
      { source: 'ESCUAM', target: 'ACDOCA-TSL', convert: 'toDecimal' },
      { source: 'ESDBCR', target: 'ACDOCA-SHKZG', valueMap: {
        '1': 'S', '2': 'H', 'D': 'S', 'C': 'H',
      }, default: 'S' },
      { source: 'ESCOCE', target: 'ACDOCA-KOSTL', convert: 'padLeft10' },
      { source: 'ESPROJ', target: 'ACDOCA-PRCTR', convert: 'padLeft10' },
      { source: 'ESVTX2', target: 'ACDOCA-SGTXT' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_M3' },
      { target: 'MigrationObjectId', default: 'INFOR_M3_GL_JOURNAL' },
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
    const headers = [
      { ESVONO: '7000001', ESYEA4: '2024', ESACDT: '20240115', ESVTDT: '20240115', ESDIVI: 'D1', ESCUCD: 'USD', ESVSER: 'GEN', ESVTXT: 'Vendor invoice' },
      { ESVONO: '7000002', ESYEA4: '2024', ESACDT: '20240201', ESVTDT: '20240201', ESDIVI: 'D1', ESCUCD: 'USD', ESVSER: 'GEN', ESVTXT: 'Customer payment' },
      { ESVONO: '7000003', ESYEA4: '2024', ESACDT: '20240215', ESVTDT: '20240215', ESDIVI: 'D1', ESCUCD: 'USD', ESVSER: 'GEN', ESVTXT: 'Payroll entry' },
      { ESVONO: '7000004', ESYEA4: '2024', ESACDT: '20240301', ESVTDT: '20240301', ESDIVI: 'D1', ESCUCD: 'USD', ESVSER: 'ADJ', ESVTXT: 'Depreciation' },
      { ESVONO: '7000005', ESYEA4: '2024', ESACDT: '20240315', ESVTDT: '20240315', ESDIVI: 'D2', ESCUCD: 'USD', ESVSER: 'GEN', ESVTXT: 'Intercompany' },
      { ESVONO: '7000006', ESYEA4: '2024', ESACDT: '20240401', ESVTDT: '20240401', ESDIVI: 'D1', ESCUCD: 'EUR', ESVSER: 'GEN', ESVTXT: 'Foreign purchase' },
      { ESVONO: '7000007', ESYEA4: '2024', ESACDT: '20240415', ESVTDT: '20240415', ESDIVI: 'D1', ESCUCD: 'USD', ESVSER: 'GEN', ESVTXT: 'Material receipt' },
      { ESVONO: '7000008', ESYEA4: '2024', ESACDT: '20240501', ESVTDT: '20240501', ESDIVI: 'D1', ESCUCD: 'USD', ESVSER: 'REV', ESVTXT: 'Reversal' },
      { ESVONO: '7000009', ESYEA4: '2024', ESACDT: '20240515', ESVTDT: '20240515', ESDIVI: 'D2', ESCUCD: 'USD', ESVSER: 'GEN', ESVTXT: 'Asset purchase' },
      { ESVONO: '7000010', ESYEA4: '2024', ESACDT: '20240601', ESVTDT: '20240601', ESDIVI: 'D1', ESCUCD: 'USD', ESVSER: 'GEN', ESVTXT: 'Sales invoice' },
      { ESVONO: '7000011', ESYEA4: '2024', ESACDT: '20240615', ESVTDT: '20240615', ESDIVI: 'D1', ESCUCD: 'USD', ESVSER: 'MAN', ESVTXT: 'Manual adjustment' },
      { ESVONO: '7000012', ESYEA4: '2024', ESACDT: '20240701', ESVTDT: '20240701', ESDIVI: 'D1', ESCUCD: 'USD', ESVSER: 'GEN', ESVTXT: 'Inventory revaluation' },
    ];

    const lineTemplates = [
      [{ ESAIT1: '120000', ESACAM: '8000.00', ESDBCR: 'D', ESCOCE: '', ESVTX2: 'Inventory debit' },
       { ESAIT1: '200000', ESACAM: '8000.00', ESDBCR: 'C', ESCOCE: '', ESVTX2: 'AP credit' }],
      [{ ESAIT1: '100000', ESACAM: '15000.00', ESDBCR: 'D', ESCOCE: '', ESVTX2: 'Bank receipt' },
       { ESAIT1: '110000', ESACAM: '15000.00', ESDBCR: 'C', ESCOCE: '', ESVTX2: 'Clear AR' }],
      [{ ESAIT1: '600000', ESACAM: '50000.00', ESDBCR: 'D', ESCOCE: 'CC01', ESVTX2: 'Salaries' },
       { ESAIT1: '210000', ESACAM: '18000.00', ESDBCR: 'C', ESCOCE: '', ESVTX2: 'Withholding' },
       { ESAIT1: '100000', ESACAM: '32000.00', ESDBCR: 'C', ESCOCE: '', ESVTX2: 'Net salary' }],
      [{ ESAIT1: '700000', ESACAM: '5000.00', ESDBCR: 'D', ESCOCE: 'CC02', ESVTX2: 'Depreciation' },
       { ESAIT1: '155000', ESACAM: '5000.00', ESDBCR: 'C', ESCOCE: '', ESVTX2: 'Accum depr' }],
      [{ ESAIT1: '890000', ESACAM: '20000.00', ESDBCR: 'D', ESCOCE: '', ESVTX2: 'ICO debit' },
       { ESAIT1: '100000', ESACAM: '20000.00', ESDBCR: 'C', ESCOCE: '', ESVTX2: 'ICO credit' }],
      [{ ESAIT1: '510000', ESACAM: '6500.00', ESDBCR: 'D', ESCOCE: 'CC03', ESVTX2: 'Material cost EUR' },
       { ESAIT1: '200000', ESACAM: '6500.00', ESDBCR: 'C', ESCOCE: '', ESVTX2: 'AP EUR' }],
      [{ ESAIT1: '120000', ESACAM: '12000.00', ESDBCR: 'D', ESCOCE: '', ESVTX2: 'Inventory receipt' },
       { ESAIT1: '890000', ESACAM: '12000.00', ESDBCR: 'C', ESCOCE: '', ESVTX2: 'GR/IR clearing' }],
      [{ ESAIT1: '210000', ESACAM: '3000.00', ESDBCR: 'D', ESCOCE: '', ESVTX2: 'Reverse accrual' },
       { ESAIT1: '510000', ESACAM: '3000.00', ESDBCR: 'C', ESCOCE: 'CC03', ESVTX2: 'Reverse cost' }],
      [{ ESAIT1: '150000', ESACAM: '45000.00', ESDBCR: 'D', ESCOCE: '', ESVTX2: 'Asset purchase' },
       { ESAIT1: '100000', ESACAM: '45000.00', ESDBCR: 'C', ESCOCE: '', ESVTX2: 'Bank payment' }],
      [{ ESAIT1: '110000', ESACAM: '25000.00', ESDBCR: 'D', ESCOCE: '', ESVTX2: 'Customer AR' },
       { ESAIT1: '400000', ESACAM: '25000.00', ESDBCR: 'C', ESCOCE: 'CC04', ESVTX2: 'Sales revenue' }],
      [{ ESAIT1: '610000', ESACAM: '4000.00', ESDBCR: 'D', ESCOCE: 'CC01', ESVTX2: 'Benefits adj' },
       { ESAIT1: '210000', ESACAM: '4000.00', ESDBCR: 'C', ESCOCE: '', ESVTX2: 'Accrued benefits' }],
      [{ ESAIT1: '500000', ESACAM: '7500.00', ESDBCR: 'D', ESCOCE: 'CC02', ESVTX2: 'COGS revalue' },
       { ESAIT1: '130000', ESACAM: '7500.00', ESDBCR: 'C', ESCOCE: '', ESVTX2: 'FG inv adjust' }],
    ];

    for (let h = 0; h < headers.length; h++) {
      const hdr = headers[h];
      const lines = lineTemplates[h];
      for (let l = 0; l < lines.length; l++) {
        const line = lines[l];
        records.push({
          ESVONO: hdr.ESVONO,
          ESYEA4: hdr.ESYEA4,
          ESACDT: hdr.ESACDT,
          ESVTDT: hdr.ESVTDT,
          ESDIVI: hdr.ESDIVI,
          ESCUCD: hdr.ESCUCD,
          ESVSER: hdr.ESVSER,
          ESVTXT: hdr.ESVTXT,
          ESJBNO: String((l + 1) * 10).padStart(3, '0'),
          ESAIT1: line.ESAIT1,
          ESACAM: line.ESACAM,
          ESCUAM: line.ESACAM,
          ESDBCR: line.ESDBCR,
          ESCOCE: line.ESCOCE,
          ESPROJ: line.ESCOCE ? `P${line.ESCOCE.slice(1)}` : '',
          ESVTX2: line.ESVTX2,
        });
      }
    }

    return records; // 12 headers, ~27 line items
  }
}

module.exports = InforM3GLJournalMigrationObject;
