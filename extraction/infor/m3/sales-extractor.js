/**
 * Infor M3 Sales Orders Extractor
 *
 * Extracts sales: OOHEAD/OOLINE (customer orders),
 * ODHEAD/ODLINE (deliveries).
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3SalesExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_SALES'; }
  get name() { return 'Infor M3 Sales Orders'; }
  get module() { return 'M3_SD'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: 'OOHEAD', description: 'Customer order headers', critical: true },
      { table: 'OOLINE', description: 'Customer order lines', critical: true },
      { table: 'ODHEAD', description: 'Delivery headers', critical: false },
      { table: 'ODLINE', description: 'Delivery lines', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('OOHEAD', {
        fields: ['OAORNO', 'OACUNO', 'OACUNM', 'OAORDT', 'OAORTP', 'OAORST', 'OARLDT', 'OADIVI', 'OAFACI', 'OAWHLO', 'OALOCD', 'OACONO'],
      });
      result.orderHeaders = data.rows;
    } catch (err) {
      this.logger.warn(`OOHEAD read failed: ${err.message}`);
      result.orderHeaders = [];
    }

    try {
      const data = await this._readTable('OOLINE', {
        fields: ['OBORNO', 'OBPONR', 'OBITNO', 'OBITDS', 'OBORQA', 'OBORQT', 'OBLNAM', 'OBNEPR', 'OBWHLO', 'OBSTAT'],
      });
      result.orderLines = data.rows;
    } catch (err) {
      this.logger.warn(`OOLINE read failed: ${err.message}`);
      result.orderLines = [];
    }

    result.summary = {
      totalOrders: result.orderHeaders.length,
      totalLines: result.orderLines.length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/sales.json');
    this._trackCoverage('OOHEAD', 'extracted', { rowCount: (mockData.orderHeaders || []).length });
    this._trackCoverage('OOLINE', 'extracted', { rowCount: (mockData.orderLines || []).length });
    return mockData;
  }
}

InforM3SalesExtractor._extractorId = 'INFOR_M3_SALES';
InforM3SalesExtractor._module = 'M3_SD';
InforM3SalesExtractor._category = 'transaction';
InforM3SalesExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3SalesExtractor);

module.exports = InforM3SalesExtractor;
