/**
 * Infor CSI Inventory Extractor
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforCSIInventoryExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_CSI_INVENTORY'; }
  get name() { return 'Infor CSI Inventory'; }
  get module() { return 'CSI_WM'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: "itemwhse", description: "Stock Balances", critical: true },
      { table: "lot", description: "Lot Records", critical: false },
    ];
  }

  async _extractLive() {
    throw new Error('Live extraction not implemented for INFOR_CSI_INVENTORY');
  }

  async _extractMock() {
    const mockData = require('../mock-data/csi/inventory.json');
    this._trackCoverage("itemwhse", "extracted", { rowCount: mockData.stockBalances.length });
    this._trackCoverage("lot", "extracted", { rowCount: mockData.lotRecords.length });
    return mockData;
  }
}

InforCSIInventoryExtractor._extractorId = 'INFOR_CSI_INVENTORY';
InforCSIInventoryExtractor._module = 'CSI_WM';
InforCSIInventoryExtractor._category = 'master-data';
InforCSIInventoryExtractor._sourceSystem = 'INFOR_CSI';
ExtractorRegistry.register(InforCSIInventoryExtractor);

module.exports = InforCSIInventoryExtractor;
