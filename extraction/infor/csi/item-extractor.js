/**
 * Infor CSI Items Extractor
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforCSIItemExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_CSI_ITEMS'; }
  get name() { return 'Infor CSI Items'; }
  get module() { return 'CSI_MM'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: "item", description: "Item Master", critical: true },
      { table: "itemwhse", description: "Item Warehouse", critical: true },
    ];
  }

  async _extractLive() {
    throw new Error('Live extraction not implemented for INFOR_CSI_ITEMS');
  }

  async _extractMock() {
    const mockData = require('../mock-data/csi/items.json');
    this._trackCoverage("item", "extracted", { rowCount: mockData.items.length });
    this._trackCoverage("itemwhse", "extracted", { rowCount: mockData.itemWarehouse.length });
    return mockData;
  }
}

InforCSIItemExtractor._extractorId = 'INFOR_CSI_ITEMS';
InforCSIItemExtractor._module = 'CSI_MM';
InforCSIItemExtractor._category = 'master-data';
InforCSIItemExtractor._sourceSystem = 'INFOR_CSI';
ExtractorRegistry.register(InforCSIItemExtractor);

module.exports = InforCSIItemExtractor;
