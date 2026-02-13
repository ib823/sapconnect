/**
 * SD Transactions Extractor
 *
 * Extracts Sales & Distribution transaction evidence: sales orders,
 * order items, deliveries, delivery items, billing documents,
 * billing items, and shipments.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class SDTransactionsExtractor extends BaseExtractor {
  get extractorId() { return 'SD_TRANSACTIONS'; }
  get name() { return 'SD Transaction Evidence'; }
  get module() { return 'SD'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: 'VBAK', description: 'Sales document header', critical: true },
      { table: 'VBAP', description: 'Sales document item', critical: true },
      { table: 'VBUK', description: 'Sales document header status', critical: false },
      { table: 'VBUP', description: 'Sales document item status', critical: false },
      { table: 'LIKP', description: 'Delivery header', critical: true },
      { table: 'LIPS', description: 'Delivery item', critical: true },
      { table: 'VBRK', description: 'Billing document header', critical: true },
      { table: 'VBRP', description: 'Billing document item', critical: true },
      { table: 'VTTK', description: 'Shipment header', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // Sales order headers
    try {
      const data = await this._readTable('VBAK', {
        fields: ['VBELN', 'AUART', 'VKORG', 'VTWEG', 'SPART', 'KUNNR', 'ERDAT', 'NETWR', 'WAERK'],
        maxRows: 10000,
      });
      result.salesOrders = data.rows;
    } catch (err) {
      this.logger.warn(`VBAK read failed: ${err.message}`);
      result.salesOrders = [];
    }

    // Sales order items
    try {
      const data = await this._readTable('VBAP', {
        fields: ['VBELN', 'POSNR', 'MATNR', 'KWMENG', 'VRKME', 'NETWR', 'WERKS', 'PSTYV'],
        maxRows: 20000,
      });
      result.orderItems = data.rows;
    } catch (err) {
      this.logger.warn(`VBAP read failed: ${err.message}`);
      result.orderItems = [];
    }

    // Delivery headers
    try {
      const data = await this._readTable('LIKP', {
        fields: ['VBELN', 'LFART', 'WADAT', 'KUNNR', 'VSTEL', 'ROUTE', 'ERDAT'],
        maxRows: 10000,
      });
      result.deliveries = data.rows;
    } catch (err) {
      this.logger.warn(`LIKP read failed: ${err.message}`);
      result.deliveries = [];
    }

    // Delivery items
    try {
      const data = await this._readTable('LIPS', {
        fields: ['VBELN', 'POSNR', 'MATNR', 'WERKS', 'LGORT', 'LFIMG', 'VRKME'],
        maxRows: 20000,
      });
      result.deliveryItems = data.rows;
    } catch (err) {
      this.logger.warn(`LIPS read failed: ${err.message}`);
      result.deliveryItems = [];
    }

    // Billing document headers
    try {
      const data = await this._readTable('VBRK', {
        fields: ['VBELN', 'FKART', 'VKORG', 'KUNAG', 'FKDAT', 'NETWR', 'WAERK'],
        maxRows: 10000,
      });
      result.billingDocs = data.rows;
    } catch (err) {
      this.logger.warn(`VBRK read failed: ${err.message}`);
      result.billingDocs = [];
    }

    // Billing document items
    try {
      const data = await this._readTable('VBRP', {
        fields: ['VBELN', 'POSNR', 'MATNR', 'FKIMG', 'VRKME', 'NETWR', 'WERKS'],
        maxRows: 20000,
      });
      result.billingItems = data.rows;
    } catch (err) {
      this.logger.warn(`VBRP read failed: ${err.message}`);
      result.billingItems = [];
    }

    // Shipments
    try {
      const data = await this._readTable('VTTK', {
        fields: ['TKNUM', 'SHTYP', 'SDABW', 'VSART', 'DPTBG', 'DPTEN', 'ROUTE'],
        maxRows: 5000,
      });
      result.shipments = data.rows;
    } catch (err) {
      this._trackCoverage('VTTK', 'skipped', { reason: err.message });
      result.shipments = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/sd-transactions.json');
    this._trackCoverage('VBAK', 'extracted', { rowCount: mockData.salesOrders.length });
    this._trackCoverage('VBAP', 'extracted', { rowCount: mockData.orderItems.length });
    this._trackCoverage('LIKP', 'extracted', { rowCount: mockData.deliveries.length });
    this._trackCoverage('LIPS', 'extracted', { rowCount: mockData.deliveryItems.length });
    this._trackCoverage('VBRK', 'extracted', { rowCount: mockData.billingDocs.length });
    this._trackCoverage('VBRP', 'extracted', { rowCount: mockData.billingItems.length });
    this._trackCoverage('VTTK', 'extracted', { rowCount: mockData.shipments.length });
    return mockData;
  }
}

SDTransactionsExtractor._extractorId = 'SD_TRANSACTIONS';
SDTransactionsExtractor._module = 'SD';
SDTransactionsExtractor._category = 'transaction';
ExtractorRegistry.register(SDTransactionsExtractor);

module.exports = SDTransactionsExtractor;
