/**
 * Lawson Inventory Extractor
 *
 * Extracts Infor Lawson inventory data: ICITEM (item master),
 * ICLOCATION (warehouse/stock locations), and ICSTOCKBAL (stock balances).
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class LawsonInventoryExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LAWSON_INVENTORY'; }
  get name() { return 'Lawson Inventory Management'; }
  get module() { return 'LAWSON_MM'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'ICITEM', description: 'Item master records', critical: true },
      { table: 'ICLOCATION', description: 'Inventory locations', critical: true },
      { table: 'ICSTOCKBAL', description: 'Stock balance records', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const items = await this._readOData('lawson/v1', 'ICITEM');
      result.items = items;
      this._trackCoverage('ICITEM', 'extracted', { rowCount: items.length });
    } catch (err) {
      this.logger.warn(`ICITEM read failed: ${err.message}`);
      result.items = [];
      this._trackCoverage('ICITEM', 'failed', { error: err.message });
    }

    try {
      const locations = await this._readOData('lawson/v1', 'ICLOCATION');
      result.locations = locations;
      this._trackCoverage('ICLOCATION', 'extracted', { rowCount: locations.length });
    } catch (err) {
      this.logger.warn(`ICLOCATION read failed: ${err.message}`);
      result.locations = [];
      this._trackCoverage('ICLOCATION', 'failed', { error: err.message });
    }

    try {
      const balances = await this._readOData('lawson/v1', 'ICSTOCKBAL');
      result.stockBalances = balances;
      this._trackCoverage('ICSTOCKBAL', 'extracted', { rowCount: balances.length });
    } catch (err) {
      this.logger.warn(`ICSTOCKBAL read failed: ${err.message}`);
      result.stockBalances = [];
      this._trackCoverage('ICSTOCKBAL', 'failed', { error: err.message });
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/lawson/inventory.json');
    this._trackCoverage('ICITEM', 'extracted', { rowCount: mockData.items.length });
    this._trackCoverage('ICLOCATION', 'extracted', { rowCount: mockData.locations.length });
    this._trackCoverage('ICSTOCKBAL', 'extracted', { rowCount: mockData.stockBalances.length });
    return mockData;
  }
}

LawsonInventoryExtractor._extractorId = 'INFOR_LAWSON_INVENTORY';
LawsonInventoryExtractor._module = 'LAWSON_MM';
LawsonInventoryExtractor._category = 'master-data';
LawsonInventoryExtractor._sourceSystem = 'INFOR_LAWSON';
ExtractorRegistry.register(LawsonInventoryExtractor);

module.exports = LawsonInventoryExtractor;
