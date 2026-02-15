/**
 * Lawson Accounts Payable Extractor
 *
 * Extracts Infor Lawson AP data: APMASTER (vendor master),
 * APINVOICE (invoices), and APCHECK (payments).
 * Accounting strings on invoices and payments are flat concatenated
 * strings that encode Company-AcctUnit-Account-SubAccount.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class LawsonAPExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LAWSON_AP'; }
  get name() { return 'Lawson Accounts Payable'; }
  get module() { return 'LAWSON_FI'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'APMASTER', description: 'Vendor master records', critical: true },
      { table: 'APINVOICE', description: 'AP invoice records', critical: true },
      { table: 'APCHECK', description: 'AP payment/check records', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const vendors = await this._readOData('lawson/v1', 'APMASTER');
      result.vendors = vendors;
      this._trackCoverage('APMASTER', 'extracted', { rowCount: vendors.length });
    } catch (err) {
      this.logger.warn(`APMASTER read failed: ${err.message}`);
      result.vendors = [];
      this._trackCoverage('APMASTER', 'failed', { error: err.message });
    }

    try {
      const invoices = await this._readOData('lawson/v1', 'APINVOICE');
      result.invoices = invoices;
      this._trackCoverage('APINVOICE', 'extracted', { rowCount: invoices.length });
    } catch (err) {
      this.logger.warn(`APINVOICE read failed: ${err.message}`);
      result.invoices = [];
      this._trackCoverage('APINVOICE', 'failed', { error: err.message });
    }

    try {
      const payments = await this._readOData('lawson/v1', 'APCHECK');
      result.payments = payments;
      this._trackCoverage('APCHECK', 'extracted', { rowCount: payments.length });
    } catch (err) {
      this.logger.warn(`APCHECK read failed: ${err.message}`);
      result.payments = [];
      this._trackCoverage('APCHECK', 'failed', { error: err.message });
    }

    // Decompose accounting strings on invoices for analysis
    result.accountingStringDecomposition = this._decomposeAcctStrings(result.invoices);

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/lawson/ap.json');
    this._trackCoverage('APMASTER', 'extracted', { rowCount: mockData.vendors.length });
    this._trackCoverage('APINVOICE', 'extracted', { rowCount: mockData.invoices.length });
    this._trackCoverage('APCHECK', 'extracted', { rowCount: mockData.payments.length });
    return mockData;
  }

  /**
   * Decompose flat accounting strings into their component segments.
   */
  _decomposeAcctStrings(records) {
    if (!records || records.length === 0) return [];
    return records
      .filter(r => r.ACCT_STRING)
      .map(r => {
        const parts = r.ACCT_STRING.split('-');
        return {
          rawString: r.ACCT_STRING,
          company: parts[0] || '',
          acctUnit: parts[1] || '',
          account: parts[2] || '',
          subAccount: parts[3] || '',
        };
      });
  }
}

LawsonAPExtractor._extractorId = 'INFOR_LAWSON_AP';
LawsonAPExtractor._module = 'LAWSON_FI';
LawsonAPExtractor._category = 'master-data';
LawsonAPExtractor._sourceSystem = 'INFOR_LAWSON';
ExtractorRegistry.register(LawsonAPExtractor);

module.exports = LawsonAPExtractor;
