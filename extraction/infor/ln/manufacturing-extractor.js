/**
 * Infor LN Manufacturing Extractor
 *
 * Extracts manufacturing data from Infor LN including BOM headers (tibom001),
 * BOM components (tibom110), routings (tirou001/002), and production orders.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNManufacturingExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_MANUFACTURING'; }
  get name() { return 'Infor LN Manufacturing'; }
  get module() { return 'LN_PP'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'tibom001', description: 'BOM headers', critical: true },
      { table: 'tibom110', description: 'BOM components', critical: true },
      { table: 'tirou001', description: 'Routing headers', critical: false },
      { table: 'tirou002', description: 'Routing operations', critical: false },
      { table: 'tisfc001', description: 'Production orders', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    // tibom001 - BOM headers
    try {
      const data = await this._readTable('tibom001', {
        fields: ['t$mitm', 't$rvsn', 't$desc', 't$stat', 't$efdt', 't$cpnb', 't$qnty', 't$cuni'],
        maxRows: 50000,
      });
      result.billsOfMaterial = data.rows;
    } catch (err) {
      this.logger.warn(`tibom001 read failed: ${err.message}`);
      result.billsOfMaterial = [];
    }

    // tibom110 - BOM components
    try {
      const data = await this._readTable('tibom110', {
        fields: ['t$mitm', 't$rvsn', 't$ponb', 't$citm', 't$qnty', 't$cuni', 't$scrt', 't$posn'],
        maxRows: 200000,
      });
      result.bomComponents = data.rows;
    } catch (err) {
      this.logger.warn(`tibom110 read failed: ${err.message}`);
      result.bomComponents = [];
    }

    // tirou001 - Routing headers
    try {
      const data = await this._readTable('tirou001', {
        fields: ['t$mitm', 't$rvsn', 't$rtid', 't$desc', 't$stat', 't$cpnb'],
        maxRows: 50000,
      });
      result.routings = data.rows;
    } catch (err) {
      this._trackCoverage('tirou001', 'skipped', { reason: err.message });
      result.routings = [];
    }

    // tirou002 - Routing operations
    try {
      const data = await this._readTable('tirou002', {
        fields: ['t$rtid', 't$opnb', 't$desc', 't$wcnt', 't$sttm', 't$rntm', 't$cuni', 't$mach'],
        maxRows: 200000,
      });
      result.routingOperations = data.rows;
    } catch (err) {
      this._trackCoverage('tirou002', 'skipped', { reason: err.message });
      result.routingOperations = [];
    }

    // tisfc001 - Production orders
    try {
      const data = await this._readTable('tisfc001', {
        fields: ['t$pono', 't$mitm', 't$qnty', 't$cpnb', 't$whno', 't$stdt', 't$endt', 't$stat', 't$qtyc'],
        maxRows: 100000,
      });
      result.productionOrders = data.rows;
    } catch (err) {
      this.logger.warn(`tisfc001 read failed: ${err.message}`);
      result.productionOrders = [];
    }

    // Compute summary
    result.summary = this._computeSummary(result);

    return result;
  }

  _computeSummary(result) {
    const boms = result.billsOfMaterial || [];
    const active = boms.filter(b => b.t$stat === 'ACT').length;
    const obsolete = boms.filter(b => b.t$stat === 'OBS').length;
    const orders = result.productionOrders || [];
    const completed = orders.filter(o => o.t$stat === 'CMP').length;
    const activeOrders = orders.filter(o => o.t$stat === 'ACT').length;
    const planned = orders.filter(o => o.t$stat === 'PLN').length;

    return {
      totalBOMs: boms.length,
      activeBOMs: active,
      obsoleteBOMs: obsolete,
      totalComponents: (result.bomComponents || []).length,
      totalRoutings: (result.routings || []).length,
      totalOperations: (result.routingOperations || []).length,
      totalProductionOrders: orders.length,
      completedOrders: completed,
      activeOrders: activeOrders,
      plannedOrders: planned,
      extractedAt: new Date().toISOString(),
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/manufacturing.json');
    this._trackCoverage('tibom001', 'extracted', { rowCount: mockData.billsOfMaterial.length });
    this._trackCoverage('tibom110', 'extracted', { rowCount: mockData.bomComponents.length });
    this._trackCoverage('tirou001', 'extracted', { rowCount: mockData.routings.length });
    this._trackCoverage('tirou002', 'extracted', { rowCount: mockData.routingOperations.length });
    this._trackCoverage('tisfc001', 'extracted', { rowCount: mockData.productionOrders.length });
    return mockData;
  }
}

InforLNManufacturingExtractor._extractorId = 'INFOR_LN_MANUFACTURING';
InforLNManufacturingExtractor._module = 'LN_PP';
InforLNManufacturingExtractor._category = 'master-data';
InforLNManufacturingExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNManufacturingExtractor);

module.exports = InforLNManufacturingExtractor;
