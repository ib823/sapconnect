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
 * Finance Configuration Migration Object
 *
 * Migrates FI customizing from ECC to S/4HANA:
 * company codes (T001), chart of accounts (T004/SKA1),
 * fiscal year variants (T009), document types (T003),
 * posting keys (T004), tax codes (T007A), payment terms (T052),
 * tolerance groups, and number ranges (NRIV).
 *
 * ~35 field mappings across multiple config categories.
 */

const BaseMigrationObject = require('./base-migration-object');

class FIConfigMigrationObject extends BaseMigrationObject {
  get objectId() { return 'FI_CONFIG'; }
  get name() { return 'Finance Configuration'; }

  getFieldMappings() {
    return [
      // ── Config item identification ─────────────────────────────
      { source: 'CONFIG_TYPE', target: 'ConfigCategory' },
      { source: 'CONFIG_KEY', target: 'ConfigKey' },
      { source: 'CONFIG_DESC', target: 'ConfigDescription' },

      // ── Company code fields (T001) ─────────────────────────────
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'BUTXT', target: 'CompanyName' },
      { source: 'LAND1', target: 'Country', convert: 'toUpperCase' },
      { source: 'WAERS', target: 'Currency' },
      { source: 'KTOPL', target: 'ChartOfAccounts' },
      { source: 'PERIV', target: 'FiscalYearVariant' },
      { source: 'XFDIS', target: 'FieldStatusVariant' },

      // ── GL Account fields (SKA1/SKB1) ──────────────────────────
      { source: 'SAKNR', target: 'GLAccount', convert: 'padLeft10' },
      { source: 'KTOKS', target: 'AccountGroup' },
      { source: 'BILKT', target: 'AlternativeGLAccount' },
      { source: 'GVTYP', target: 'PLStatementAccountType' },
      { source: 'XBILK', target: 'IsBalanceSheetAccount', convert: 'boolYN' },

      // ── Fiscal year (T009/T009B) ───────────────────────────────
      { source: 'FYVAR', target: 'FiscalYearVariantKey' },
      { source: 'ANESSION_Z', target: 'NumberOfPostingPeriods', convert: 'toInteger' },
      { source: 'SPEESSION_RS', target: 'NumberOfSpecialPeriods', convert: 'toInteger' },

      // ── Document type (T003) ───────────────────────────────────
      { source: 'BLART', target: 'DocumentType' },
      { source: 'BLART_DESC', target: 'DocumentTypeDescription' },
      { source: 'NUMKR', target: 'NumberRangeKey' },

      // ── Tax code (T007A) ───────────────────────────────────────
      { source: 'MWSKZ', target: 'TaxCode' },
      { source: 'TAX_DESC', target: 'TaxDescription' },
      { source: 'TAX_RATE', target: 'TaxRate', convert: 'toDecimal' },
      { source: 'TAX_TYPE', target: 'TaxType' },

      // ── Payment terms (T052) ───────────────────────────────────
      { source: 'ZTERM', target: 'PaymentTerms' },
      { source: 'ZTERM_DESC', target: 'PaymentTermsDescription' },
      { source: 'ZFAEL', target: 'NetDueDays', convert: 'toInteger' },
      { source: 'ZPRZ1', target: 'Discount1Percent', convert: 'toDecimal' },
      { source: 'ZTAG1', target: 'Discount1Days', convert: 'toInteger' },

      // ── Number range (NRIV) ────────────────────────────────────
      { source: 'NROBJ', target: 'NumberRangeObject' },
      { source: 'FROMNR', target: 'NumberRangeFrom' },
      { source: 'TONR', target: 'NumberRangeTo' },
      { source: 'NRLEVEL', target: 'CurrentNumber' },

      // ── Metadata ───────────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'FI_CONFIG' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['ConfigCategory', 'ConfigKey', 'ConfigDescription'],
      exactDuplicate: { keys: ['ConfigCategory', 'ConfigKey'] },
    };
  }

  _extractMock() {
    const records = [];

    // Company codes (T001)
    const companyCodes = [
      { code: '1000', name: 'Global HQ', country: 'US', currency: 'USD', coa: 'YCOA', fyvar: 'K4', fsvar: '1000' },
      { code: '2000', name: 'Europe Operations', country: 'DE', currency: 'EUR', coa: 'YCOA', fyvar: 'K4', fsvar: '2000' },
      { code: '3000', name: 'Asia Pacific', country: 'SG', currency: 'SGD', coa: 'YCOA', fyvar: 'K4', fsvar: '3000' },
    ];
    for (const cc of companyCodes) {
      records.push(this._configRecord('COMPANY_CODE', cc.code, `Company Code ${cc.code} - ${cc.name}`, {
        BUKRS: cc.code, BUTXT: cc.name, LAND1: cc.country, WAERS: cc.currency,
        KTOPL: cc.coa, PERIV: cc.fyvar, XFDIS: cc.fsvar,
      }));
    }

    // GL Account groups
    const glGroups = [
      { from: '0010000000', to: '0019999999', desc: 'Balance Sheet - Assets', bs: 'X' },
      { from: '0020000000', to: '0029999999', desc: 'Balance Sheet - Liabilities', bs: 'X' },
      { from: '0030000000', to: '0039999999', desc: 'Balance Sheet - Equity', bs: 'X' },
      { from: '0040000000', to: '0049999999', desc: 'P&L - Revenue', bs: '' },
      { from: '0050000000', to: '0059999999', desc: 'P&L - COGS', bs: '' },
      { from: '0060000000', to: '0069999999', desc: 'P&L - Expenses', bs: '' },
    ];
    for (const gl of glGroups) {
      records.push(this._configRecord('GL_ACCOUNT_RANGE', `${gl.from}-${gl.to}`, gl.desc, {
        SAKNR: gl.from, KTOKS: gl.bs ? 'BS' : 'PL', BILKT: '', GVTYP: gl.bs ? '' : 'X', XBILK: gl.bs,
      }));
    }

    // Fiscal year variant
    records.push(this._configRecord('FISCAL_YEAR_VARIANT', 'K4', 'Calendar Year, 4 Special Periods', {
      FYVAR: 'K4', ANESSION_Z: '12', SPEESSION_RS: '4',
    }));

    // Document types (T003)
    const docTypes = [
      { code: 'SA', desc: 'GL Account Document', nrk: '01' },
      { code: 'KR', desc: 'Vendor Invoice', nrk: '19' },
      { code: 'DR', desc: 'Customer Invoice', nrk: '01' },
      { code: 'DZ', desc: 'Customer Payment', nrk: '15' },
      { code: 'KZ', desc: 'Vendor Payment', nrk: '15' },
      { code: 'AB', desc: 'Accounting Document', nrk: '01' },
      { code: 'AA', desc: 'Asset Posting', nrk: '01' },
    ];
    for (const dt of docTypes) {
      records.push(this._configRecord('DOCUMENT_TYPE', dt.code, dt.desc, {
        BLART: dt.code, BLART_DESC: dt.desc, NUMKR: dt.nrk,
      }));
    }

    // Tax codes (T007A)
    const taxCodes = [
      { code: 'I0', desc: 'Tax Exempt Input', rate: 0, type: 'input' },
      { code: 'I1', desc: 'Standard Input Tax', rate: 19, type: 'input' },
      { code: 'I2', desc: 'Reduced Input Tax', rate: 7, type: 'input' },
      { code: 'O0', desc: 'Tax Exempt Output', rate: 0, type: 'output' },
      { code: 'O1', desc: 'Standard Output Tax', rate: 19, type: 'output' },
      { code: 'O2', desc: 'Reduced Output Tax', rate: 7, type: 'output' },
      { code: 'V0', desc: 'US Sales Tax Exempt', rate: 0, type: 'output' },
      { code: 'V1', desc: 'US Sales Tax', rate: 8.25, type: 'output' },
    ];
    for (const tc of taxCodes) {
      records.push(this._configRecord('TAX_CODE', tc.code, tc.desc, {
        MWSKZ: tc.code, TAX_DESC: tc.desc, TAX_RATE: String(tc.rate), TAX_TYPE: tc.type,
      }));
    }

    // Payment terms (T052)
    const payTerms = [
      { code: '0001', desc: 'Due immediately', days: 0, d1d: 0, d1p: 0 },
      { code: 'NT30', desc: 'Net 30 days', days: 30, d1d: 0, d1p: 0 },
      { code: 'NT60', desc: 'Net 60 days', days: 60, d1d: 0, d1p: 0 },
      { code: '2N10', desc: '2% 10, Net 30', days: 30, d1d: 10, d1p: 2 },
      { code: '3N15', desc: '3% 15, Net 45', days: 45, d1d: 15, d1p: 3 },
    ];
    for (const pt of payTerms) {
      records.push(this._configRecord('PAYMENT_TERMS', pt.code, pt.desc, {
        ZTERM: pt.code, ZTERM_DESC: pt.desc, ZFAEL: String(pt.days), ZPRZ1: String(pt.d1p), ZTAG1: String(pt.d1d),
      }));
    }

    // Number ranges (NRIV)
    const numberRanges = [
      { obj: 'FI_DOC', from: '0100000000', to: '0199999999', cur: '0142387651' },
      { obj: 'PO_NUM', from: '4500000000', to: '4599999999', cur: '4502340125' },
      { obj: 'SO_NUM', from: '0000000001', to: '0099999999', cur: '0003100245' },
      { obj: 'MAT_NUM', from: '000000000000000001', to: '000000000099999999', cur: '000000000000185042' },
    ];
    for (const nr of numberRanges) {
      records.push(this._configRecord('NUMBER_RANGE', nr.obj, `Number Range: ${nr.obj}`, {
        NROBJ: nr.obj, FROMNR: nr.from, TONR: nr.to, NRLEVEL: nr.cur,
      }));
    }

    return records; // 3 + 6 + 1 + 7 + 8 + 5 + 4 = 34 records
  }

  /** Helper to create a config record with standard fields */
  _configRecord(type, key, desc, extra) {
    return {
      CONFIG_TYPE: type,
      CONFIG_KEY: key,
      CONFIG_DESC: desc,
      BUKRS: '', BUTXT: '', LAND1: '', WAERS: '', KTOPL: '', PERIV: '', XFDIS: '',
      SAKNR: '', KTOKS: '', BILKT: '', GVTYP: '', XBILK: '',
      FYVAR: '', ANESSION_Z: '', SPEESSION_RS: '',
      BLART: '', BLART_DESC: '', NUMKR: '',
      MWSKZ: '', TAX_DESC: '', TAX_RATE: '', TAX_TYPE: '',
      ZTERM: '', ZTERM_DESC: '', ZFAEL: '', ZPRZ1: '', ZTAG1: '',
      NROBJ: '', FROMNR: '', TONR: '', NRLEVEL: '',
      ...extra,
    };
  }
}

module.exports = FIConfigMigrationObject;
