/**
 * PP Transactions Extractor
 *
 * Extracts Production Planning transaction evidence: production orders,
 * order items, operations, quantities, and reservations.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class PPTransactionsExtractor extends BaseExtractor {
  get extractorId() { return 'PP_TRANSACTIONS'; }
  get name() { return 'PP Transaction Evidence'; }
  get module() { return 'PP'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: 'AFKO', description: 'Production order header', critical: true },
      { table: 'AFPO', description: 'Production order item', critical: true },
      { table: 'AFVC', description: 'Order operation', critical: true },
      { table: 'AFVV', description: 'Order operation quantities/dates', critical: true },
      { table: 'RESB', description: 'Reservation/dependent requirements', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    // Production order headers
    try {
      const data = await this._readTable('AFKO', {
        fields: ['AUFNR', 'RSNUM', 'PLNBEZ', 'GAMNG', 'GMEIN', 'GSTRP', 'GLTRP', 'DTEFIXED'],
        maxRows: 10000,
      });
      result.productionOrders = data.rows;
    } catch (err) {
      this.logger.warn(`AFKO read failed: ${err.message}`);
      result.productionOrders = [];
    }

    // Production order items
    try {
      const data = await this._readTable('AFPO', {
        fields: ['AUFNR', 'POSNR', 'MATNR', 'WERKS', 'LGORT', 'PSMNG', 'AMEIN', 'DTEFIXED'],
        maxRows: 20000,
      });
      result.orderItems = data.rows;
    } catch (err) {
      this.logger.warn(`AFPO read failed: ${err.message}`);
      result.orderItems = [];
    }

    // Operations
    try {
      const data = await this._readTable('AFVC', {
        fields: ['AUFPL', 'APLZL', 'VORNR', 'STEUS', 'ARBID', 'WERKS', 'KTSCH'],
        maxRows: 20000,
      });
      result.operations = data.rows;
    } catch (err) {
      this.logger.warn(`AFVC read failed: ${err.message}`);
      result.operations = [];
    }

    // Operation quantities
    try {
      const data = await this._readTable('AFVV', {
        fields: ['AUFPL', 'APLZL', 'MGVRG', 'MEINH', 'VGW01', 'VGE01', 'VGW02', 'VGE02'],
        maxRows: 20000,
      });
      result.quantities = data.rows;
    } catch (err) {
      this.logger.warn(`AFVV read failed: ${err.message}`);
      result.quantities = [];
    }

    // Reservations
    try {
      const data = await this._readTable('RESB', {
        fields: ['RSNUM', 'RSPOS', 'MATNR', 'WERKS', 'LGORT', 'BDMNG', 'MEINS', 'AUFNR'],
        maxRows: 20000,
      });
      result.reservations = data.rows;
    } catch (err) {
      this.logger.warn(`RESB read failed: ${err.message}`);
      result.reservations = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/pp-transactions.json');
    this._trackCoverage('AFKO', 'extracted', { rowCount: mockData.productionOrders.length });
    this._trackCoverage('AFPO', 'extracted', { rowCount: mockData.orderItems.length });
    this._trackCoverage('AFVC', 'extracted', { rowCount: mockData.operations.length });
    this._trackCoverage('AFVV', 'extracted', { rowCount: mockData.quantities.length });
    this._trackCoverage('RESB', 'extracted', { rowCount: mockData.reservations.length });
    return mockData;
  }
}

PPTransactionsExtractor._extractorId = 'PP_TRANSACTIONS';
PPTransactionsExtractor._module = 'PP';
PPTransactionsExtractor._category = 'transaction';
ExtractorRegistry.register(PPTransactionsExtractor);

module.exports = PPTransactionsExtractor;
