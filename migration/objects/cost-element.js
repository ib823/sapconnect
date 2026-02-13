/**
 * Cost Element Master Migration Object
 *
 * Migrates Cost Element master from ECC (CSKA/CSKB)
 * to S/4HANA G/L Account for Cost/Revenue.
 *
 * In S/4HANA, cost elements are replaced by G/L accounts
 * with cost element attributes (primary/secondary).
 *
 * ~30 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class CostElementMigrationObject extends BaseMigrationObject {
  get objectId() { return 'COST_ELEMENT'; }
  get name() { return 'Cost Element Master'; }

  getFieldMappings() {
    return [
      // ── Key fields ───────────────────────────────────────────
      { source: 'KSTAR', target: 'CostElement', convert: 'padLeft10' },
      { source: 'KOKRS', target: 'ControllingArea' },
      { source: 'BUKRS', target: 'CompanyCode' },

      // ── Category & classification ────────────────────────────
      { source: 'KAESSION_TYP', target: 'CostElementCategory' },
      { source: 'BESSION_KLAS', target: 'CostElementClass' },
      { source: 'FUNC_AREA', target: 'FunctionalArea' },

      // ── Validity dates ───────────────────────────────────────
      { source: 'DATAB', target: 'ValidFrom', convert: 'toDate' },
      { source: 'DATBI', target: 'ValidTo', convert: 'toDate' },

      // ── Descriptions ─────────────────────────────────────────
      { source: 'KTEXT', target: 'Description' },
      { source: 'LTEXT', target: 'LongDescription' },
      { source: 'SPRAS', target: 'Language', convert: 'toUpperCase' },

      // ── Variance & statistical ───────────────────────────────
      { source: 'XAESSION_USS', target: 'VarianceCategory' },
      { source: 'XSESSION_TAT', target: 'StatisticalIndicator', convert: 'boolYN' },

      // ── Origin & grouping ────────────────────────────────────
      { source: 'HESSION_RKFT', target: 'OriginGroup' },

      // ── Audit fields ─────────────────────────────────────────
      { source: 'ERDAT', target: 'CreatedDate', convert: 'toDate' },
      { source: 'USNAM', target: 'CreatedBy' },
      { source: 'AEDAT', target: 'ChangedDate', convert: 'toDate' },

      // ── CO mapping & tax relevance ───────────────────────────
      { source: 'MESSION_ATCO', target: 'COSTMapping' },
      { source: 'XSESSION_TEU', target: 'IsTaxRelevant', convert: 'boolYN' },

      // ── GL account attributes ────────────────────────────────
      { source: 'SAESSION_KNR', target: 'GLAccount', convert: 'padLeft10' },
      { source: 'KTOPL', target: 'ChartOfAccounts' },
      { source: 'XBILK', target: 'IsBalanceSheetAccount', convert: 'boolYN' },

      // ── Additional CO attributes ─────────────────────────────
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'KOSTL', target: 'DefaultCostCenter', convert: 'padLeft10' },
      { source: 'SEGMENT', target: 'Segment' },
      { source: 'WAESSION_RS', target: 'Currency' },
      { source: 'LOCK_IND', target: 'IsLocked', convert: 'boolYN' },
      { source: 'GSBER', target: 'BusinessArea' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'COST_ELEMENT' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['CostElement', 'ControllingArea'],
      exactDuplicate: { keys: ['CostElement', 'ControllingArea'] },
    };
  }

  _extractMock() {
    const records = [];

    // Primary cost elements (type 1) — mapped to P&L GL accounts
    const primaryElements = [
      { kstar: '400000', txt: 'Revenue - Domestic Sales', ltext: 'Domestic sales revenue postings' },
      { kstar: '401000', txt: 'Revenue - Export Sales', ltext: 'Export sales revenue postings' },
      { kstar: '410000', txt: 'Sales Deductions', ltext: 'Discounts, rebates, and allowances' },
      { kstar: '500000', txt: 'Raw Material Consumption', ltext: 'Raw material usage and consumption' },
      { kstar: '510000', txt: 'Packaging Materials', ltext: 'Packaging material costs' },
      { kstar: '520000', txt: 'Operating Supplies', ltext: 'Operating supplies consumption' },
      { kstar: '600000', txt: 'Salaries & Wages', ltext: 'Employee salary and wage expense' },
      { kstar: '610000', txt: 'Social Security', ltext: 'Employer social security contributions' },
      { kstar: '620000', txt: 'Benefits & Pension', ltext: 'Employee benefits and pension costs' },
      { kstar: '630000', txt: 'Travel Expenses', ltext: 'Business travel and transportation' },
      { kstar: '640000', txt: 'Depreciation Expense', ltext: 'Planned depreciation of fixed assets' },
      { kstar: '650000', txt: 'Rent & Lease', ltext: 'Facility rent and lease payments' },
      { kstar: '660000', txt: 'Repairs & Maintenance', ltext: 'Repair and maintenance costs' },
      { kstar: '670000', txt: 'Utilities', ltext: 'Electricity, water, gas expenses' },
      { kstar: '680000', txt: 'Insurance', ltext: 'Property and liability insurance' },
      { kstar: '690000', txt: 'Professional Services', ltext: 'Legal, audit, consulting fees' },
      { kstar: '700000', txt: 'Marketing & Advertising', ltext: 'Marketing campaign and ad spend' },
      { kstar: '710000', txt: 'IT & Telecom', ltext: 'IT services and telecom charges' },
      { kstar: '720000', txt: 'Office Supplies', ltext: 'General office supply expenses' },
      { kstar: '800000', txt: 'Interest Expense', ltext: 'Interest on borrowings' },
      { kstar: '810000', txt: 'Bank Charges', ltext: 'Banking fees and commissions' },
      { kstar: '820000', txt: 'Foreign Exchange Loss', ltext: 'Realized FX loss on transactions' },
      { kstar: '900000', txt: 'Tax Expense', ltext: 'Income tax and other taxes' },
    ];

    // Secondary cost elements (types 41/42/43)
    const secondaryElements = [
      { kstar: '900100', txt: 'Assessment - Admin OH', ltext: 'Admin overhead assessment', katyp: '41' },
      { kstar: '900200', txt: 'Assessment - Prod OH', ltext: 'Production overhead assessment', katyp: '41' },
      { kstar: '900300', txt: 'Assessment - IT Costs', ltext: 'IT cost center assessment', katyp: '41' },
      { kstar: '910100', txt: 'Distribution - Mgmt', ltext: 'Management cost distribution', katyp: '42' },
      { kstar: '910200', txt: 'Distribution - Facility', ltext: 'Facility cost distribution', katyp: '42' },
      { kstar: '910300', txt: 'Distribution - Energy', ltext: 'Energy cost distribution', katyp: '42' },
      { kstar: '920100', txt: 'Internal Activity - Labor', ltext: 'Internal labor activity allocation', katyp: '43' },
      { kstar: '920200', txt: 'Internal Activity - Machine', ltext: 'Machine hour activity allocation', katyp: '43' },
      { kstar: '920300', txt: 'Internal Activity - Setup', ltext: 'Setup time activity allocation', katyp: '43' },
      { kstar: '920400', txt: 'Internal Activity - QC', ltext: 'Quality control activity allocation', katyp: '43' },
      { kstar: '930100', txt: 'Overhead Surcharge', ltext: 'Material overhead surcharge', katyp: '41' },
      { kstar: '930200', txt: 'Overhead Surcharge - Prod', ltext: 'Production overhead surcharge', katyp: '41' },
    ];

    const funcAreas = ['0100', '0200', '0300', '0400']; // Admin, Sales, Production, R&D

    // Generate primary cost elements (type 1)
    for (let i = 0; i < primaryElements.length; i++) {
      const el = primaryElements[i];
      records.push({
        KSTAR: el.kstar,
        KOKRS: '1000',
        BUKRS: i < 18 ? '1000' : '2000',
        KAESSION_TYP: '1',
        BESSION_KLAS: el.kstar.startsWith('4') ? 'REV' : 'EXP',
        FUNC_AREA: funcAreas[i % 4],
        DATAB: '20150101',
        DATBI: '99991231',
        KTEXT: el.txt,
        LTEXT: el.ltext,
        SPRAS: 'EN',
        XAESSION_USS: '',
        XSESSION_TAT: '',
        HESSION_RKFT: el.kstar.startsWith('4') ? 'REV' : el.kstar.startsWith('9') ? 'TAX' : 'OPS',
        ERDAT: '20150101',
        USNAM: 'MIGRATION',
        AEDAT: '20230615',
        MESSION_ATCO: '',
        XSESSION_TEU: el.kstar.startsWith('4') || el.kstar === '900000' ? 'X' : '',
        SAESSION_KNR: el.kstar,
        KTOPL: 'CAUS',
        XBILK: '',
        PRCTR: '',
        KOSTL: '',
        SEGMENT: 'SEG1',
        WAESSION_RS: 'USD',
        LOCK_IND: '',
        GSBER: 'BU01',
      });
    }

    // Generate secondary cost elements (types 41/42/43)
    for (let i = 0; i < secondaryElements.length; i++) {
      const el = secondaryElements[i];
      records.push({
        KSTAR: el.kstar,
        KOKRS: '1000',
        BUKRS: '1000',
        KAESSION_TYP: el.katyp,
        BESSION_KLAS: 'SEC',
        FUNC_AREA: funcAreas[i % 4],
        DATAB: '20150101',
        DATBI: '99991231',
        KTEXT: el.txt,
        LTEXT: el.ltext,
        SPRAS: 'EN',
        XAESSION_USS: el.katyp === '41' ? 'ASS' : el.katyp === '42' ? 'DST' : 'ACT',
        XSESSION_TAT: el.katyp === '42' ? 'X' : '',
        HESSION_RKFT: 'SEC',
        ERDAT: '20150101',
        USNAM: 'MIGRATION',
        AEDAT: '20230615',
        MESSION_ATCO: el.katyp,
        XSESSION_TEU: '',
        SAESSION_KNR: '',
        KTOPL: 'CAUS',
        XBILK: '',
        PRCTR: '',
        KOSTL: '',
        SEGMENT: 'SEG1',
        WAESSION_RS: 'USD',
        LOCK_IND: '',
        GSBER: 'BU01',
      });
    }

    return records; // 23 primary + 12 secondary = 35 cost elements
  }
}

module.exports = CostElementMigrationObject;
