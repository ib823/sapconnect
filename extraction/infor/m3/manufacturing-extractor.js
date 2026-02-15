/**
 * Infor M3 Manufacturing Extractor
 *
 * Extracts manufacturing: MPDHED/MPDMAT (product structure/components),
 * MWOHED (manufacturing orders).
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3ManufacturingExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_MANUFACTURING'; }
  get name() { return 'Infor M3 Manufacturing'; }
  get module() { return 'M3_PP'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'MPDHED', description: 'Product structure headers', critical: true },
      { table: 'MPDMAT', description: 'Product structure components', critical: true },
      { table: 'MWOHED', description: 'Manufacturing orders', critical: true },
      { table: 'MWOOPE', description: 'MO operations', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('MPDHED', {
        fields: ['HDPRNO', 'HDPRDS', 'HDSTRT', 'HDCONO', 'HDFACI'],
      });
      result.productStructures = data.rows;
    } catch (err) {
      this.logger.warn(`MPDHED read failed: ${err.message}`);
      result.productStructures = [];
    }

    try {
      const data = await this._readTable('MPDMAT', {
        fields: ['MTMTNO', 'MTMTDS', 'MTCNQT', 'MTUNIT', 'MTWAPC', 'MTSCPC'],
      });
      // Group components by parent product
      for (const ps of result.productStructures) {
        ps.components = data.rows.filter(c => c.MTPRNO === ps.HDPRNO);
      }
    } catch (err) {
      this.logger.warn(`MPDMAT read failed: ${err.message}`);
    }

    try {
      const data = await this._readTable('MWOHED', {
        fields: ['VHMFNO', 'VHITNO', 'VHITDS', 'VHORQA', 'VHMAQA', 'VHWHST', 'VHSTDT', 'VHFIDT', 'VHFACI', 'VHWHLO', 'VHCONO'],
      });
      result.manufacturingOrders = data.rows;
    } catch (err) {
      this.logger.warn(`MWOHED read failed: ${err.message}`);
      result.manufacturingOrders = [];
    }

    try {
      const data = await this._readTable('MWOOPE', {
        fields: ['VOMFNO', 'VOOPNO', 'VOPLGR', 'VOOPDS', 'VOSTAT'],
      });
      result.operations = data.rows;
    } catch (err) {
      this.logger.warn(`MWOOPE read failed: ${err.message}`);
      result.operations = [];
    }

    result.summary = {
      totalProductStructures: result.productStructures.length,
      totalManufacturingOrders: result.manufacturingOrders.length,
      totalOperations: (result.operations || []).length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/manufacturing.json');
    this._trackCoverage('MPDHED', 'extracted', { rowCount: (mockData.productStructures || []).length });
    this._trackCoverage('MPDMAT', 'extracted', { rowCount: (mockData.materials || []).length });
    this._trackCoverage('MWOHED', 'extracted', { rowCount: (mockData.manufacturingOrders || []).length });
    this._trackCoverage('MWOOPE', 'extracted', { rowCount: (mockData.operations || []).length });
    return mockData;
  }
}

InforM3ManufacturingExtractor._extractorId = 'INFOR_M3_MANUFACTURING';
InforM3ManufacturingExtractor._module = 'M3_PP';
InforM3ManufacturingExtractor._category = 'master-data';
InforM3ManufacturingExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3ManufacturingExtractor);

module.exports = InforM3ManufacturingExtractor;
