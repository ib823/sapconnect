/**
 * Lawson Chart of Accounts Extractor
 *
 * Extracts Infor Lawson chart of accounts from GLMASTER, including the
 * accounting string structure (Company-AcctUnit-Account-SubAccount).
 * Key challenge: Lawson stores GL accounts as flat concatenated strings
 * that must be decomposed into individual segments for SAP mapping.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class LawsonCOAExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LAWSON_COA'; }
  get name() { return 'Lawson Chart of Accounts'; }
  get module() { return 'LAWSON_FI'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'GLMASTER', description: 'GL account master (chart of accounts)', critical: true },
      { table: 'ACCTTYPE', description: 'Account type definitions', critical: false },
      { table: 'ACCTGROUP', description: 'Account group definitions', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // GL Account Master
    try {
      const accounts = await this._readOData('lawson/v1', 'GLMASTER');
      result.glAccounts = accounts;
      this._trackCoverage('GLMASTER', 'extracted', { rowCount: accounts.length });
    } catch (err) {
      this.logger.warn(`GLMASTER read failed: ${err.message}`);
      result.glAccounts = [];
      this._trackCoverage('GLMASTER', 'failed', { error: err.message });
    }

    // Account types
    try {
      const types = await this._readOData('lawson/v1', 'ACCTTYPE');
      result.accountTypes = types;
      this._trackCoverage('ACCTTYPE', 'extracted', { rowCount: types.length });
    } catch (err) {
      this.logger.warn(`ACCTTYPE read failed: ${err.message}`);
      result.accountTypes = [];
      this._trackCoverage('ACCTTYPE', 'failed', { error: err.message });
    }

    // Account groups
    try {
      const groups = await this._readOData('lawson/v1', 'ACCTGROUP');
      result.accountGroups = groups;
      this._trackCoverage('ACCTGROUP', 'extracted', { rowCount: groups.length });
    } catch (err) {
      this.logger.warn(`ACCTGROUP read failed: ${err.message}`);
      result.accountGroups = [];
      this._trackCoverage('ACCTGROUP', 'failed', { error: err.message });
    }

    // Build accounting string structure analysis
    result.accountingStringStructure = this._analyzeAccountingStrings(result.glAccounts);

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/lawson/coa.json');
    this._trackCoverage('GLMASTER', 'extracted', { rowCount: mockData.glAccounts.length });
    this._trackCoverage('ACCTTYPE', 'extracted', { rowCount: (mockData.accountTypes || []).length });
    this._trackCoverage('ACCTGROUP', 'extracted', { rowCount: (mockData.accountGroups || []).length });
    return mockData;
  }

  /**
   * Analyze accounting strings to document the flat-string decomposition structure.
   * Lawson concatenates Company-AcctUnit-Account-SubAccount into a single string.
   */
  _analyzeAccountingStrings(accounts) {
    if (!accounts || accounts.length === 0) return null;

    const companies = new Set();
    const acctUnits = new Set();
    const accountRanges = {};

    for (const acct of accounts) {
      if (acct.COMPANY) companies.add(acct.COMPANY);
      if (acct.ACCT_UNIT) acctUnits.add(acct.ACCT_UNIT);
      const type = acct.ACCT_TYPE || 'UNKNOWN';
      if (!accountRanges[type]) accountRanges[type] = { min: acct.ACCOUNT, max: acct.ACCOUNT, count: 0 };
      accountRanges[type].count++;
      if (acct.ACCOUNT < accountRanges[type].min) accountRanges[type].min = acct.ACCOUNT;
      if (acct.ACCOUNT > accountRanges[type].max) accountRanges[type].max = acct.ACCOUNT;
    }

    return {
      format: 'COMPANY-ACCT_UNIT-ACCOUNT-SUB_ACCOUNT',
      separator: '-',
      uniqueCompanies: Array.from(companies),
      uniqueAcctUnits: Array.from(acctUnits),
      accountRangesByType: accountRanges,
      totalAccounts: accounts.length,
    };
  }
}

LawsonCOAExtractor._extractorId = 'INFOR_LAWSON_COA';
LawsonCOAExtractor._module = 'LAWSON_FI';
LawsonCOAExtractor._category = 'config';
LawsonCOAExtractor._sourceSystem = 'INFOR_LAWSON';
ExtractorRegistry.register(LawsonCOAExtractor);

module.exports = LawsonCOAExtractor;
