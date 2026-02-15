/**
 * Infor LN Financial Transactions Extractor
 *
 * Extracts FI transaction data from Infor LN including GL document headers
 * (tfgld100), GL line items (tfgld101), AP invoices, and AR invoices.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNFITransactionsExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_FI_TRANSACTIONS'; }
  get name() { return 'Infor LN Financial Transactions'; }
  get module() { return 'LN_FI'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: 'tfgld100', description: 'GL document headers', critical: true },
      { table: 'tfgld101', description: 'GL document line items', critical: true },
      { table: 'tfacp100', description: 'AP invoice headers', critical: true },
      { table: 'tfacr100', description: 'AR invoice headers', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    // tfgld100 - GL document headers
    try {
      const data = await this._readTable('tfgld100', {
        fields: ['t$dcnm', 't$cpnb', 't$year', 't$perd', 't$dctp', 't$dcdt', 't$desc', 't$stat', 't$user'],
        maxRows: 100000,
      });
      result.glDocuments = data.rows;
    } catch (err) {
      this.logger.warn(`tfgld100 read failed: ${err.message}`);
      result.glDocuments = [];
    }

    // tfgld101 - GL document line items
    try {
      const data = await this._readTable('tfgld101', {
        fields: ['t$dcnm', 't$sqnb', 't$led', 't$acnb', 't$dbcr', 't$amnt', 't$ccur', 't$dim1', 't$desc'],
        maxRows: 500000,
      });
      result.glLineItems = data.rows;
    } catch (err) {
      this.logger.warn(`tfgld101 read failed: ${err.message}`);
      result.glLineItems = [];
    }

    // tfacp100 - AP invoices
    try {
      const data = await this._readTable('tfacp100', {
        fields: ['t$ttyp', 't$ninv', 't$bpid', 't$cpnb', 't$amnt', 't$ccur', 't$idat', 't$ddat', 't$stat', 't$desc'],
        maxRows: 100000,
      });
      result.apInvoices = data.rows;
    } catch (err) {
      this.logger.warn(`tfacp100 read failed: ${err.message}`);
      result.apInvoices = [];
    }

    // tfacr100 - AR invoices
    try {
      const data = await this._readTable('tfacr100', {
        fields: ['t$ttyp', 't$ninv', 't$bpid', 't$cpnb', 't$amnt', 't$ccur', 't$idat', 't$ddat', 't$stat', 't$desc'],
        maxRows: 100000,
      });
      result.arInvoices = data.rows;
    } catch (err) {
      this.logger.warn(`tfacr100 read failed: ${err.message}`);
      result.arInvoices = [];
    }

    // Compute summary
    result.summary = this._computeSummary(result);

    return result;
  }

  _computeSummary(result) {
    const glDocs = result.glDocuments || [];
    const glLines = result.glLineItems || [];
    const companies = [...new Set(glDocs.map(d => d.t$cpnb))];
    const periods = [...new Set(glDocs.map(d => `${d.t$year}-${String(d.t$perd).padStart(2, '0')}`))];

    return {
      totalGLDocuments: glDocs.length,
      totalGLLineItems: glLines.length,
      totalAPInvoices: (result.apInvoices || []).length,
      totalARInvoices: (result.arInvoices || []).length,
      companiesCovered: companies,
      periodsCovered: periods,
      extractedAt: new Date().toISOString(),
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/fi-transactions.json');
    this._trackCoverage('tfgld100', 'extracted', { rowCount: mockData.glDocuments.length });
    this._trackCoverage('tfgld101', 'extracted', { rowCount: mockData.glLineItems.length });
    this._trackCoverage('tfacp100', 'extracted', { rowCount: mockData.apInvoices.length });
    this._trackCoverage('tfacr100', 'extracted', { rowCount: mockData.arInvoices.length });
    return mockData;
  }
}

InforLNFITransactionsExtractor._extractorId = 'INFOR_LN_FI_TRANSACTIONS';
InforLNFITransactionsExtractor._module = 'LN_FI';
InforLNFITransactionsExtractor._category = 'transaction';
InforLNFITransactionsExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNFITransactionsExtractor);

module.exports = InforLNFITransactionsExtractor;
