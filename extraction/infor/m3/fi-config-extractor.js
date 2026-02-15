/**
 * Infor M3 Financial Configuration Extractor
 *
 * Extracts financial configuration: FCHACC (chart of accounts),
 * accounting rules, and tax configuration.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3FIConfigExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_FI_CONFIG'; }
  get name() { return 'Infor M3 Financial Configuration'; }
  get module() { return 'M3_FI'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'FCHACC', description: 'Chart of Accounts', critical: true },
      { table: 'CSYTAB', description: 'System tables - tax codes', critical: true },
      { table: 'FBACRR', description: 'Accounting rules', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('FCHACC', {
        fields: ['FCAIT1', 'FCAIDC', 'FCAPTS', 'FCACTY', 'FCSTAT'],
      });
      result.chartOfAccounts = { accounts: data.rows };
    } catch (err) {
      this.logger.warn(`FCHACC read failed: ${err.message}`);
      result.chartOfAccounts = { accounts: [] };
    }

    try {
      const data = await this._readTable('FBACRR', {
        fields: ['ACRULE', 'ACDESC', 'ACTYPE', 'ACMTHD', 'ACSTAT'],
      });
      result.accountingRules = data.rows;
    } catch (err) {
      this.logger.warn(`FBACRR read failed: ${err.message}`);
      result.accountingRules = [];
    }

    try {
      const data = await this._readTable('CSYTAB', {
        fields: ['TATXCD', 'TATXDS', 'TATXRT', 'TACSCD', 'TATYPE', 'TASTAT'],
        filter: "STCO eq 'TAXC'",
      });
      result.taxConfig = data.rows;
    } catch (err) {
      this.logger.warn(`CSYTAB read failed: ${err.message}`);
      result.taxConfig = [];
    }

    result.summary = {
      totalAccounts: result.chartOfAccounts.accounts.length,
      totalAccountingRules: result.accountingRules.length,
      totalTaxCodes: result.taxConfig.length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/fi-config.json');
    const accountCount = mockData.chartOfAccounts && mockData.chartOfAccounts.accounts
      ? mockData.chartOfAccounts.accounts.length : 0;
    this._trackCoverage('FCHACC', 'extracted', { rowCount: accountCount });
    this._trackCoverage('FBACRR', 'extracted', { rowCount: (mockData.accountingRules || []).length });
    this._trackCoverage('CSYTAB', 'extracted', { rowCount: (mockData.taxConfig || []).length });
    return mockData;
  }
}

InforM3FIConfigExtractor._extractorId = 'INFOR_M3_FI_CONFIG';
InforM3FIConfigExtractor._module = 'M3_FI';
InforM3FIConfigExtractor._category = 'config';
InforM3FIConfigExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3FIConfigExtractor);

module.exports = InforM3FIConfigExtractor;
