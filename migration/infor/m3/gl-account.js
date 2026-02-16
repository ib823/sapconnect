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
 * Infor M3 GL Account Migration Object
 *
 * Migrates M3 General Ledger accounts (CMNACR)
 * to SAP Chart of Accounts (SKA1/SKAT/SKB1).
 *
 * M3 CMNACR uses AI prefix for GL account fields:
 *   AIAITM — account number
 *   AIAT01 — account description
 *   AIAPTS — account type
 *
 * ~15 field mappings. Mock: 18 GL accounts.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforM3GLAccountMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_M3_GL_ACCOUNT'; }
  get name() { return 'Infor M3 GL Account'; }

  getFieldMappings() {
    return [
      // ── Chart of Accounts level (SKA1) ───────────────────────
      { source: 'AIAITM', target: 'SKA1-SAKNR', convert: 'padLeft10' },
      { source: 'AIAPTS', target: 'SKA1-XBILK', valueMap: {
        'BS': 'X', 'PL': '', '1': 'X', '2': '',
      }, default: '' },
      { source: 'AIACGR', target: 'SKA1-KTOKS' },
      { source: 'AICOA', target: 'SKA1-KTOPL', default: 'INM3' },

      // ── Text data (SKAT) ─────────────────────────────────────
      { source: 'AIAT01', target: 'SKAT-TXT50' },
      { source: 'AIAT02', target: 'SKAT-TXT20' },
      { source: 'AILNCD', target: 'SKAT-SPRAS', convert: 'toUpperCase', default: 'EN' },

      // ── Company code level (SKB1) ────────────────────────────
      { source: 'AIDIVI', target: 'SKB1-BUKRS' },
      { source: 'AICUCD', target: 'SKB1-WAERS' },
      { source: 'AITXCD', target: 'SKB1-MWSKZ' },
      { source: 'AIOITM', target: 'SKB1-XOPVW', valueMap: {
        'Y': 'X', 'N': '', '1': 'X', '0': '',
      }, default: '' },
      { source: 'AIRECON', target: 'SKB1-MITKZ', valueMap: {
        'D': 'D', 'K': 'K', 'A': 'A', '': '',
      }, default: '' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_M3' },
      { target: 'MigrationObjectId', default: 'INFOR_M3_GL_ACCOUNT' },
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
      { AIAITM: '100000', AIAT01: 'Cash and Bank', AIAPTS: 'BS', AIACGR: 'CASH', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '110000', AIAT01: 'Accounts Receivable', AIAPTS: 'BS', AIACGR: 'RECV', AITXCD: '', AIOITM: 'Y', AIRECON: 'D' },
      { AIAITM: '120000', AIAT01: 'Inventory Raw Materials', AIAPTS: 'BS', AIACGR: 'INVT', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '130000', AIAT01: 'Inventory Finished Goods', AIAPTS: 'BS', AIACGR: 'INVT', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '150000', AIAT01: 'Fixed Assets', AIAPTS: 'BS', AIACGR: 'FAAA', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '155000', AIAT01: 'Accumulated Depreciation', AIAPTS: 'BS', AIACGR: 'FAAA', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '200000', AIAT01: 'Accounts Payable', AIAPTS: 'BS', AIACGR: 'PAYB', AITXCD: '', AIOITM: 'Y', AIRECON: 'K' },
      { AIAITM: '210000', AIAT01: 'Accrued Expenses', AIAPTS: 'BS', AIACGR: 'ACCR', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '290000', AIAT01: 'Retained Earnings', AIAPTS: 'BS', AIACGR: 'EQTY', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '400000', AIAT01: 'Sales Revenue', AIAPTS: 'PL', AIACGR: 'REVN', AITXCD: 'V1', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '410000', AIAT01: 'Sales Returns', AIAPTS: 'PL', AIACGR: 'REVN', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '500000', AIAT01: 'Cost of Goods Sold', AIAPTS: 'PL', AIACGR: 'COGS', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '510000', AIAT01: 'Material Costs', AIAPTS: 'PL', AIACGR: 'MATC', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '600000', AIAT01: 'Salaries and Wages', AIAPTS: 'PL', AIACGR: 'PERS', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '610000', AIAT01: 'Employee Benefits', AIAPTS: 'PL', AIACGR: 'PERS', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '700000', AIAT01: 'Depreciation Expense', AIAPTS: 'PL', AIACGR: 'DEPR', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '800000', AIAT01: 'Interest Income', AIAPTS: 'PL', AIACGR: 'FINI', AITXCD: '', AIOITM: 'N', AIRECON: '' },
      { AIAITM: '890000', AIAT01: 'GR/IR Clearing', AIAPTS: 'BS', AIACGR: 'GRIR', AITXCD: '', AIOITM: 'Y', AIRECON: '' },
    ];

    const divisions = ['D1', 'D2'];
    const records = [];

    for (const div of divisions) {
      for (const a of accounts) {
        records.push({
          AIAITM: a.AIAITM,
          AIAT01: a.AIAT01,
          AIAT02: a.AIAT01.substring(0, 20),
          AIAPTS: a.AIAPTS,
          AIACGR: a.AIACGR,
          AICOA: 'INM3',
          AILNCD: 'EN',
          AIDIVI: div,
          AICUCD: 'USD',
          AITXCD: a.AITXCD,
          AIOITM: a.AIOITM,
          AIRECON: a.AIRECON,
        });
      }
    }

    return records; // 18 accounts x 2 divisions = 36 records
  }
}

module.exports = InforM3GLAccountMigrationObject;
