/**
 * Infor M3 Financial Transactions Extractor
 *
 * Extracts FI transactions: FGLEDG (general ledger), FSLEDG
 * (subledger), FPLEDG (AP/AR).
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3FITransactionsExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_FI_TRANSACTIONS'; }
  get name() { return 'Infor M3 Financial Transactions'; }
  get module() { return 'M3_FI'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: 'FGLEDG', description: 'General ledger entries', critical: true },
      { table: 'FSLEDG', description: 'Subledger entries', critical: true },
      { table: 'FPLEDG', description: 'AP/AR ledger entries', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('FGLEDG', {
        fields: ['EBYEA4', 'EBJRNO', 'EBJRSE', 'EBVONO', 'EBAIT1', 'EBACAM', 'EBCUAM', 'EBCUCD', 'EBACDT', 'EBDESC', 'EBCONO'],
      });
      result.generalLedger = data.rows;
    } catch (err) {
      this.logger.warn(`FGLEDG read failed: ${err.message}`);
      result.generalLedger = [];
    }

    try {
      const data = await this._readTable('FSLEDG', {
        fields: ['ESYEA4', 'ESJRNO', 'ESVONO', 'ESAIT1', 'ESACAM', 'ESCUAM', 'ESCUCD', 'ESACDT', 'ESSBIT', 'ESSBTY', 'ESCONO'],
      });
      result.subledger = data.rows;
    } catch (err) {
      this.logger.warn(`FSLEDG read failed: ${err.message}`);
      result.subledger = [];
    }

    try {
      const data = await this._readTable('FPLEDG', {
        fields: ['EPAINO', 'EPCUNO', 'EPSUNO', 'EPACAM', 'EPDUDT', 'EPSTAT', 'EPCONO'],
      });
      result.apArLedger = data.rows;
    } catch (err) {
      this.logger.warn(`FPLEDG read failed: ${err.message}`);
      result.apArLedger = [];
    }

    result.summary = {
      totalGLEntries: result.generalLedger.length,
      totalSubledgerEntries: result.subledger.length,
      totalAPAREntries: (result.apArLedger || []).length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/fi-transactions.json');
    this._trackCoverage('FGLEDG', 'extracted', { rowCount: (mockData.generalLedger || mockData.journalEntries || []).length });
    this._trackCoverage('FSLEDG', 'extracted', { rowCount: (mockData.subledger || []).length });
    this._trackCoverage('FPLEDG', 'extracted', { rowCount: (mockData.apArLedger || mockData.arTransactions || []).length });
    return mockData;
  }
}

InforM3FITransactionsExtractor._extractorId = 'INFOR_M3_FI_TRANSACTIONS';
InforM3FITransactionsExtractor._module = 'M3_FI';
InforM3FITransactionsExtractor._category = 'transaction';
InforM3FITransactionsExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3FITransactionsExtractor);

module.exports = InforM3FITransactionsExtractor;
