/**
 * Lawson Accounts Receivable Extractor
 *
 * Extracts Infor Lawson AR data: ARMASTER (customer master),
 * ARINVOICE (invoices), and ARRECEIPT (receipts/payments).
 * Accounting strings encode Company-AcctUnit-Account-SubAccount.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class LawsonARExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LAWSON_AR'; }
  get name() { return 'Lawson Accounts Receivable'; }
  get module() { return 'LAWSON_FI'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'ARMASTER', description: 'Customer master records', critical: true },
      { table: 'ARINVOICE', description: 'AR invoice records', critical: true },
      { table: 'ARRECEIPT', description: 'AR receipt/payment records', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const customers = await this._readOData('lawson/v1', 'ARMASTER');
      result.customers = customers;
      this._trackCoverage('ARMASTER', 'extracted', { rowCount: customers.length });
    } catch (err) {
      this.logger.warn(`ARMASTER read failed: ${err.message}`);
      result.customers = [];
      this._trackCoverage('ARMASTER', 'failed', { error: err.message });
    }

    try {
      const invoices = await this._readOData('lawson/v1', 'ARINVOICE');
      result.invoices = invoices;
      this._trackCoverage('ARINVOICE', 'extracted', { rowCount: invoices.length });
    } catch (err) {
      this.logger.warn(`ARINVOICE read failed: ${err.message}`);
      result.invoices = [];
      this._trackCoverage('ARINVOICE', 'failed', { error: err.message });
    }

    try {
      const receipts = await this._readOData('lawson/v1', 'ARRECEIPT');
      result.receipts = receipts;
      this._trackCoverage('ARRECEIPT', 'extracted', { rowCount: receipts.length });
    } catch (err) {
      this.logger.warn(`ARRECEIPT read failed: ${err.message}`);
      result.receipts = [];
      this._trackCoverage('ARRECEIPT', 'failed', { error: err.message });
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/lawson/ar.json');
    this._trackCoverage('ARMASTER', 'extracted', { rowCount: mockData.customers.length });
    this._trackCoverage('ARINVOICE', 'extracted', { rowCount: mockData.invoices.length });
    this._trackCoverage('ARRECEIPT', 'extracted', { rowCount: mockData.receipts.length });
    return mockData;
  }
}

LawsonARExtractor._extractorId = 'INFOR_LAWSON_AR';
LawsonARExtractor._module = 'LAWSON_FI';
LawsonARExtractor._category = 'master-data';
LawsonARExtractor._sourceSystem = 'INFOR_LAWSON';
ExtractorRegistry.register(LawsonARExtractor);

module.exports = LawsonARExtractor;
