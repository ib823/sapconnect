/**
 * MM Transactions Extractor
 *
 * Extracts Materials Management transaction evidence: purchase orders,
 * PO items, PO history, purchase requisitions, material documents,
 * and vendor confirmations.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class MMTransactionsExtractor extends BaseExtractor {
  get extractorId() { return 'MM_TRANSACTIONS'; }
  get name() { return 'MM Transaction Evidence'; }
  get module() { return 'MM'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: 'EKKO', description: 'Purchasing document header', critical: true },
      { table: 'EKPO', description: 'Purchasing document item', critical: true },
      { table: 'EKBE', description: 'Purchasing document history', critical: true },
      { table: 'EBAN', description: 'Purchase requisition', critical: true },
      { table: 'MKPF', description: 'Material document header', critical: true },
      { table: 'MSEG', description: 'Material document segment', critical: true },
      { table: 'EKES', description: 'Vendor confirmations', critical: false },
      { table: 'EKAB', description: 'Release documentation', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // Purchase order headers
    try {
      const data = await this._readTable('EKKO', {
        fields: ['EBELN', 'BUKRS', 'BSTYP', 'BSART', 'LOEKZ', 'AEDAT', 'ERNAM', 'EKORG', 'EKGRP', 'LIFNR'],
        maxRows: 10000,
      });
      result.purchaseOrders = data.rows;
    } catch (err) {
      this.logger.warn(`EKKO read failed: ${err.message}`);
      result.purchaseOrders = [];
    }

    // Purchase order items
    try {
      const data = await this._readTable('EKPO', {
        fields: ['EBELN', 'EBELP', 'MATNR', 'WERKS', 'LGORT', 'MENGE', 'MEINS', 'NETPR', 'PEINH'],
        maxRows: 20000,
      });
      result.poItems = data.rows;
    } catch (err) {
      this.logger.warn(`EKPO read failed: ${err.message}`);
      result.poItems = [];
    }

    // Purchase order history
    try {
      const data = await this._readTable('EKBE', {
        fields: ['EBELN', 'EBELP', 'ZEKKN', 'VGABE', 'BEWTP', 'MENGE', 'DMBTR', 'BUDAT'],
        maxRows: 20000,
      });
      result.poHistory = data.rows;
    } catch (err) {
      this.logger.warn(`EKBE read failed: ${err.message}`);
      result.poHistory = [];
    }

    // Purchase requisitions
    try {
      const data = await this._readTable('EBAN', {
        fields: ['BANFN', 'BNFPO', 'MATNR', 'WERKS', 'MENGE', 'MEINS', 'BSART', 'EKGRP', 'AFNAM'],
        maxRows: 10000,
      });
      result.requisitions = data.rows;
    } catch (err) {
      this.logger.warn(`EBAN read failed: ${err.message}`);
      result.requisitions = [];
    }

    // Material documents
    try {
      const mkpf = await this._readTable('MKPF', {
        fields: ['MBLNR', 'MJAHR', 'BUDAT', 'USNAM', 'TCODE', 'XBLNR'],
        maxRows: 10000,
      });
      result.materialDocuments = mkpf.rows;
    } catch (err) {
      this.logger.warn(`MKPF read failed: ${err.message}`);
      result.materialDocuments = [];
    }

    // Vendor confirmations
    try {
      const data = await this._readTable('EKES', {
        fields: ['EBELN', 'EBELP', 'ETENS', 'EBTYP', 'EINDT', 'MENGE'],
        maxRows: 5000,
      });
      result.confirmations = data.rows;
    } catch (err) {
      this._trackCoverage('EKES', 'skipped', { reason: err.message });
      result.confirmations = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/mm-transactions.json');
    this._trackCoverage('EKKO', 'extracted', { rowCount: mockData.purchaseOrders.length });
    this._trackCoverage('EKPO', 'extracted', { rowCount: mockData.poItems.length });
    this._trackCoverage('EKBE', 'extracted', { rowCount: mockData.poHistory.length });
    this._trackCoverage('EBAN', 'extracted', { rowCount: mockData.requisitions.length });
    this._trackCoverage('MKPF', 'extracted', { rowCount: mockData.materialDocuments.length });
    this._trackCoverage('EKES', 'extracted', { rowCount: mockData.confirmations.length });
    return mockData;
  }
}

MMTransactionsExtractor._extractorId = 'MM_TRANSACTIONS';
MMTransactionsExtractor._module = 'MM';
MMTransactionsExtractor._category = 'transaction';
ExtractorRegistry.register(MMTransactionsExtractor);

module.exports = MMTransactionsExtractor;
