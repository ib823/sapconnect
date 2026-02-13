/**
 * GL Account Master Migration Object
 *
 * Migrates GL Account master data from SKA1/SKB1/SKAT
 * to S/4HANA GL Account (API_JOURNALENTRYITEMBASIC_SRV).
 *
 * Key changes: chart of accounts aligned, account groups,
 * P&L statement type, functional area derivation.
 *
 * ~45 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class GLAccountMasterMigrationObject extends BaseMigrationObject {
  get objectId() { return 'GL_ACCOUNT_MASTER'; }
  get name() { return 'GL Account Master'; }

  getFieldMappings() {
    return [
      // Chart of Accounts level (SKA1)
      { source: 'KTOPL', target: 'ChartOfAccounts' },
      { source: 'SAKNR', target: 'GLAccount', convert: 'padLeft10' },
      { source: 'GVTYP', target: 'PLStatementAccountType' },
      { source: 'KTOKS', target: 'GLAccountGroup' },
      { source: 'XBILK', target: 'IsBalanceSheetAccount', convert: 'boolYN' },
      { source: 'TXT20', target: 'GLAccountShortText' },
      { source: 'TXT50', target: 'GLAccountLongText' },
      { source: 'SPRAS', target: 'Language', convert: 'toUpperCase' },
      { source: 'FUNC_AREA', target: 'FunctionalArea' },
      { source: 'MCLASS', target: 'GLAccountType' },
      { source: 'XLOEV', target: 'IsMarkedForDeletion', convert: 'boolYN' },
      { source: 'XSPEB', target: 'IsBlockedForCreation', convert: 'boolYN' },
      { source: 'XSPAB', target: 'IsBlockedForPosting', convert: 'boolYN' },
      { source: 'XSPEP', target: 'IsBlockedForPlanning', convert: 'boolYN' },
      // Company Code level (SKB1)
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'WAESSION_ERS', target: 'AccountCurrency' },
      { source: 'MWSKZ', target: 'TaxCategory' },
      { source: 'XINTB', target: 'IsAutoPostingOnly', convert: 'boolYN' },
      { source: 'XOPVW', target: 'IsOpenItemManaged', convert: 'boolYN' },
      { source: 'XKRES', target: 'IsLineItemDisplay', convert: 'boolYN' },
      { source: 'MITKZ', target: 'ReconciliationAccountType' },
      { source: 'FDLEV', target: 'PlanningLevel' },
      { source: 'FSTAG', target: 'FSVItem' },
      { source: 'HBKID', target: 'HouseBank' },
      { source: 'HKTID', target: 'HouseBankAccountID' },
      { source: 'ALTKT', target: 'AlternativeGLAccount' },
      { source: 'XGKON', target: 'IsCashFlowRelevant', convert: 'boolYN' },
      { source: 'ZUESSION_AW', target: 'AuthorizationGroup' },
      { source: 'BUSAB', target: 'AccountingClerk' },
      { source: 'SESSION_ORT', target: 'SortKey' },
      { source: 'ERDAT', target: 'CreationDate', convert: 'toDate' },
      { source: 'USNAM', target: 'CreatedByUser' },
      // Additional attributes
      { source: 'XMWNO', target: 'IsTaxNonDeductible', convert: 'boolYN' },
      { source: 'FIPLS', target: 'FinancialPlanningLevel' },
      { source: 'XSALH', target: 'IsSalesRelevant', convert: 'boolYN' },
      { source: 'BEWESSION_GR', target: 'ValuationGroup' },
      { source: 'TOGRU', target: 'ToleranceGroup' },
      { source: 'ZINDT', target: 'InterestCalcDate', convert: 'toDate' },
      { source: 'ZINRT', target: 'InterestCalcRate', convert: 'toDecimal' },
      { source: 'BEGRU', target: 'AuthorizationGroup' },
      { source: 'VZESSION_SKZ', target: 'InterestIndicator' },
      // Metadata
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'GL_ACCOUNT_MASTER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['ChartOfAccounts', 'GLAccount', 'GLAccountGroup', 'CompanyCode'],
      exactDuplicate: { keys: ['ChartOfAccounts', 'GLAccount', 'CompanyCode'] },
    };
  }

  _extractMock() {
    const records = [];
    const companyCodes = ['1000', '2000'];
    const accounts = [
      // Assets
      { saknr: '100000', txt: 'Petty Cash', grp: 'CASH', bs: 'X', pl: '', type: 'X', open: 'X', recon: '', curr: 'USD' },
      { saknr: '110000', txt: 'Bank Account - Main', grp: 'BANK', bs: 'X', pl: '', type: 'X', open: 'X', recon: '', curr: 'USD' },
      { saknr: '113100', txt: 'Accounts Receivable', grp: 'RECV', bs: 'X', pl: '', type: 'X', open: 'X', recon: 'D', curr: 'USD' },
      { saknr: '140000', txt: 'Raw Materials Inventory', grp: 'INVT', bs: 'X', pl: '', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '150000', txt: 'Fixed Assets', grp: 'FAAA', bs: 'X', pl: '', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '154000', txt: 'Accumulated Depreciation', grp: 'FAAA', bs: 'X', pl: '', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '160000', txt: 'Prepaid Expenses', grp: 'PREP', bs: 'X', pl: '', type: 'X', open: '', recon: '', curr: 'USD' },
      // Liabilities
      { saknr: '200000', txt: 'Accounts Payable', grp: 'PAYB', bs: 'X', pl: '', type: 'X', open: 'X', recon: 'K', curr: 'USD' },
      { saknr: '210000', txt: 'Accrued Expenses', grp: 'ACCR', bs: 'X', pl: '', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '220000', txt: 'Tax Payable', grp: 'TAXP', bs: 'X', pl: '', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '250000', txt: 'Long-term Debt', grp: 'DEBT', bs: 'X', pl: '', type: 'X', open: 'X', recon: '', curr: 'USD' },
      { saknr: '290000', txt: 'Retained Earnings', grp: 'EQTY', bs: 'X', pl: '', type: 'X', open: '', recon: '', curr: 'USD' },
      // P&L Revenue
      { saknr: '400000', txt: 'Sales Revenue - Domestic', grp: 'REVN', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '410000', txt: 'Sales Revenue - Export', grp: 'REVN', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '420000', txt: 'Sales Returns', grp: 'REVN', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '430000', txt: 'Other Income', grp: 'OTHI', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      // P&L COGS / Expenses
      { saknr: '500000', txt: 'Cost of Goods Sold', grp: 'COGS', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '510000', txt: 'Material Costs', grp: 'MATC', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '600000', txt: 'Salaries & Wages', grp: 'PERS', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '610000', txt: 'Benefits', grp: 'PERS', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '620000', txt: 'Travel Expenses', grp: 'TRVL', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '630000', txt: 'Office Supplies', grp: 'OFFC', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '640000', txt: 'Depreciation Expense', grp: 'DEPR', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '650000', txt: 'Rent Expense', grp: 'RENT', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '700000', txt: 'Interest Expense', grp: 'FEXP', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '800000', txt: 'Tax Expense', grp: 'TAXE', bs: '', pl: 'X', type: 'X', open: '', recon: '', curr: 'USD' },
      { saknr: '890000', txt: 'Clearing Account', grp: 'CLER', bs: 'X', pl: '', type: 'X', open: 'X', recon: '', curr: 'USD' },
      { saknr: '891000', txt: 'GR/IR Clearing', grp: 'GRIR', bs: 'X', pl: '', type: 'X', open: 'X', recon: '', curr: 'USD' },
    ];

    for (const cc of companyCodes) {
      for (const a of accounts) {
        records.push({
          KTOPL: 'CAUS',
          SAKNR: a.saknr,
          GVTYP: a.pl ? 'P' : '',
          KTOKS: a.grp,
          XBILK: a.bs,
          TXT20: a.txt.substring(0, 20),
          TXT50: a.txt,
          SPRAS: 'EN',
          FUNC_AREA: '',
          MCLASS: '',
          XLOEV: '',
          XSPEB: '',
          XSPAB: '',
          XSPEP: '',
          BUKRS: cc,
          WAESSION_ERS: a.curr,
          MWSKZ: a.saknr.startsWith('4') || a.saknr.startsWith('5') ? 'V' : '',
          XINTB: '',
          XOPVW: a.open,
          XKRES: 'X',
          MITKZ: a.recon,
          FDLEV: '',
          FSTAG: '',
          HBKID: a.grp === 'BANK' ? 'MAIN' : '',
          HKTID: a.grp === 'BANK' ? '001' : '',
          ALTKT: '',
          XGKON: a.grp === 'BANK' || a.grp === 'CASH' ? 'X' : '',
          ZUESSION_AW: '',
          BUSAB: '',
          SESSION_ORT: '',
          ERDAT: '20150101',
          USNAM: 'MIGRATION',
          XMWNO: '',
          FIPLS: '',
          XSALH: a.saknr.startsWith('4') ? 'X' : '',
          BEWESSION_GR: '',
          TOGRU: '',
          ZINDT: '',
          ZINRT: '',
          BEGRU: '',
          VZESSION_SKZ: '',
        });
      }
    }

    return records; // 28 accounts × 2 company codes = 56
  }
}

module.exports = GLAccountMasterMigrationObject;
