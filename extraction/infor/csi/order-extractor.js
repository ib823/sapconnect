/**
 * Infor CSI Orders Extractor
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforCSIOrderExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_CSI_ORDERS'; }
  get name() { return 'Infor CSI Orders'; }
  get module() { return 'CSI_SD'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: "co", description: "Order Headers", critical: true },
      { table: "coline", description: "Order Lines", critical: true },
    ];
  }

  async _extractLive() {
    throw new Error('Live extraction not implemented for INFOR_CSI_ORDERS');
  }

  async _extractMock() {
    const mockData = require('../mock-data/csi/orders.json');
    this._trackCoverage("co", "extracted", { rowCount: mockData.orderHeaders.length });
    this._trackCoverage("coline", "extracted", { rowCount: mockData.orderLines.length });
    return mockData;
  }
}

InforCSIOrderExtractor._extractorId = 'INFOR_CSI_ORDERS';
InforCSIOrderExtractor._module = 'CSI_SD';
InforCSIOrderExtractor._category = 'transaction';
InforCSIOrderExtractor._sourceSystem = 'INFOR_CSI';
ExtractorRegistry.register(InforCSIOrderExtractor);

module.exports = InforCSIOrderExtractor;
