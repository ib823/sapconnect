/**
 * Infor LN GL Account Migration Object
 *
 * Migrates LN General Ledger accounts (tfgld010) to SAP Chart of Accounts
 * (SKA1/SKAT/SKB1).
 *
 * Key transforms:
 * - LN ledger account (fled) padded to 10 chars for SAP SAKNR
 * - Account type (BS/PL) determines balance sheet indicator (XBILK)
 * - Description maps to both short (TXT20) and long (TXT50) text
 *
 * ~15 field mappings. Mock: 20 GL accounts.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforLNGLAccountMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_LN_GL_ACCOUNT'; }
  get name() { return 'LN GL Account to SAP GL Master'; }

  getFieldMappings() {
    return [
      // ── Chart of Accounts level (SKA1) ───────────────────────
      { source: 'fled', target: 'SKA1-SAKNR', convert: 'padLeft10' },
      { source: 'type', target: 'SKA1-XBILK', valueMap: {
        'BS': 'X', 'PL': '', 'B': 'X', 'P': '',
      }, default: '' },
      { source: 'type', target: 'SKA1-GVTYP', valueMap: {
        'BS': '', 'PL': 'P', 'B': '', 'P': 'P',
      }, default: '' },
      { source: 'acgr', target: 'SKA1-KTOKS' },
      { source: 'coa', target: 'SKA1-KTOPL', default: 'INLN' },

      // ── Text data (SKAT) ─────────────────────────────────────
      { source: 'desc', target: 'SKAT-TXT50' },
      { source: 'desc_short', target: 'SKAT-TXT20' },
      { source: 'lnge', target: 'SKAT-SPRAS', convert: 'toUpperCase', default: 'EN' },

      // ── Company code level (SKB1) ────────────────────────────
      { source: 'fcmp', target: 'SKB1-BUKRS' },
      { source: 'curr', target: 'SKB1-WAERS' },
      { source: 'taxc', target: 'SKB1-MWSKZ' },
      { source: 'oitm', target: 'SKB1-XOPVW', valueMap: {
        'Y': 'X', 'N': '', '1': 'X', '0': '',
      }, default: '' },
      { source: 'lidi', target: 'SKB1-XKRES', valueMap: {
        'Y': 'X', 'N': '', '1': 'X', '0': '',
      }, default: 'X' },
      { source: 'recon', target: 'SKB1-MITKZ', valueMap: {
        'D': 'D', 'K': 'K', 'A': 'A', '': '',
      }, default: '' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_LN' },
      { target: 'MigrationObjectId', default: 'INFOR_LN_GL_ACCOUNT' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['SKA1-SAKNR', 'SKAT-TXT50', 'SKA1-KTOPL', 'SKB1-BUKRS'],
      exactDuplicate: { keys: ['SKA1-SAKNR', 'SKB1-BUKRS'] },
    };
  }

  _extractMock() {
    const accounts = [
      // Balance Sheet — Assets
      { fled: '100000', desc: 'Petty Cash', type: 'BS', acgr: 'CASH', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      { fled: '110000', desc: 'Bank Account Main', type: 'BS', acgr: 'BANK', taxc: '', oitm: 'Y', recon: '', curr: 'USD' },
      { fled: '113100', desc: 'Accounts Receivable', type: 'BS', acgr: 'RECV', taxc: '', oitm: 'Y', recon: 'D', curr: 'USD' },
      { fled: '140000', desc: 'Raw Materials Inventory', type: 'BS', acgr: 'INVT', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      { fled: '141000', desc: 'Work in Process', type: 'BS', acgr: 'INVT', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      { fled: '142000', desc: 'Finished Goods Inventory', type: 'BS', acgr: 'INVT', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      { fled: '150000', desc: 'Fixed Assets', type: 'BS', acgr: 'FAAA', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      { fled: '154000', desc: 'Accumulated Depreciation', type: 'BS', acgr: 'FAAA', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      // Balance Sheet — Liabilities
      { fled: '200000', desc: 'Accounts Payable', type: 'BS', acgr: 'PAYB', taxc: '', oitm: 'Y', recon: 'K', curr: 'USD' },
      { fled: '210000', desc: 'Accrued Liabilities', type: 'BS', acgr: 'ACCR', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      { fled: '220000', desc: 'Tax Payable', type: 'BS', acgr: 'TAXP', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      { fled: '290000', desc: 'Retained Earnings', type: 'BS', acgr: 'EQTY', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      // P&L — Revenue
      { fled: '400000', desc: 'Sales Revenue Domestic', type: 'PL', acgr: 'REVN', taxc: 'V1', oitm: 'N', recon: '', curr: 'USD' },
      { fled: '410000', desc: 'Sales Revenue Export', type: 'PL', acgr: 'REVN', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      { fled: '430000', desc: 'Other Operating Income', type: 'PL', acgr: 'OTHI', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      // P&L — Expenses
      { fled: '500000', desc: 'Cost of Goods Sold', type: 'PL', acgr: 'COGS', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      { fled: '510000', desc: 'Raw Material Consumption', type: 'PL', acgr: 'MATC', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      { fled: '600000', desc: 'Salaries and Wages', type: 'PL', acgr: 'PERS', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      { fled: '700000', desc: 'Depreciation Expense', type: 'PL', acgr: 'DEPR', taxc: '', oitm: 'N', recon: '', curr: 'USD' },
      { fled: '890000', desc: 'GR/IR Clearing', type: 'BS', acgr: 'GRIR', taxc: '', oitm: 'Y', recon: '', curr: 'USD' },
    ];

    const companyCodes = ['100', '200'];
    const records = [];

    for (const fcmp of companyCodes) {
      for (const a of accounts) {
        records.push({
          fled: a.fled,
          desc: a.desc,
          desc_short: a.desc.substring(0, 20),
          type: a.type,
          acgr: a.acgr,
          coa: 'INLN',
          lnge: 'EN',
          fcmp,
          curr: a.curr,
          taxc: a.taxc,
          oitm: a.oitm,
          lidi: 'Y',
          recon: a.recon,
        });
      }
    }

    return records; // 20 accounts x 2 companies = 40 records
  }
}

module.exports = InforLNGLAccountMigrationObject;
