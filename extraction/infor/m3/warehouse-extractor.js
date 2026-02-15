/**
 * Infor M3 Warehouse Extractor
 *
 * Extracts warehouse data: MITWHL (warehouse), MITLOC (location),
 * MILOMA (lot), and stock balances.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3WarehouseExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_WAREHOUSE'; }
  get name() { return 'Infor M3 Warehouse Management'; }
  get module() { return 'M3_WM'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'MITWHL', description: 'Warehouses', critical: true },
      { table: 'MITLOC', description: 'Locations', critical: true },
      { table: 'MITBAL', description: 'Stock balances', critical: true },
      { table: 'MILOMA', description: 'Lot master', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('MITWHL', {
        fields: ['MHWHLO', 'MHWHNM', 'MHWHTY', 'MHFACI', 'MHCONO', 'MHCSCD'],
      });
      result.warehouses = data.rows;
    } catch (err) {
      this.logger.warn(`MITWHL read failed: ${err.message}`);
      result.warehouses = [];
    }

    try {
      const data = await this._readTable('MITLOC', {
        fields: ['MLWHLO', 'MLWHSL', 'MLSLDS', 'MLSLTP', 'MLCONO'],
      });
      result.locations = data.rows;
    } catch (err) {
      this.logger.warn(`MITLOC read failed: ${err.message}`);
      result.locations = [];
    }

    try {
      const data = await this._readTable('MITBAL', {
        fields: ['MBITNO', 'MBWHLO', 'MBWHSL', 'MBSTQT', 'MBALQT', 'MBUNIT', 'MBCONO', 'MBBANO'],
      });
      result.inventoryRecords = data.rows;
    } catch (err) {
      this.logger.warn(`MITBAL read failed: ${err.message}`);
      result.inventoryRecords = [];
    }

    try {
      const data = await this._readTable('MILOMA', {
        fields: ['MLBANO', 'MLITNO', 'MLWHLO', 'MLCONO', 'MLEXPI', 'MLMFDT', 'MLSUNO', 'MLSTAT'],
      });
      result.lotRecords = data.rows;
    } catch (err) {
      this.logger.warn(`MILOMA read failed: ${err.message}`);
      result.lotRecords = [];
    }

    result.summary = {
      totalWarehouses: result.warehouses.length,
      totalLocations: result.locations.length,
      totalInventoryRecords: result.inventoryRecords.length,
      totalLotRecords: (result.lotRecords || []).length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/warehouse.json');
    this._trackCoverage('MITWHL', 'extracted', { rowCount: (mockData.warehouses || []).length });
    this._trackCoverage('MITLOC', 'extracted', { rowCount: (mockData.locations || []).length });
    this._trackCoverage('MITBAL', 'extracted', { rowCount: (mockData.inventoryRecords || []).length });
    this._trackCoverage('MILOMA', 'extracted', { rowCount: (mockData.lotRecords || []).length });
    return mockData;
  }
}

InforM3WarehouseExtractor._extractorId = 'INFOR_M3_WAREHOUSE';
InforM3WarehouseExtractor._module = 'M3_WM';
InforM3WarehouseExtractor._category = 'master-data';
InforM3WarehouseExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3WarehouseExtractor);

module.exports = InforM3WarehouseExtractor;
