/**
 * Lawson Interface Extractor
 *
 * Extracts Infor Lawson interface landscape: ION connections,
 * add-ins (Excel, Word, Crystal), flat file imports/exports,
 * and Landmark REST API endpoints.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class LawsonInterfaceExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LAWSON_INTERFACES'; }
  get name() { return 'Lawson Interface Landscape'; }
  get module() { return 'LAWSON_INT'; }
  get category() { return 'interface'; }

  getExpectedTables() {
    return [
      { table: 'LBICONNECTION', description: 'LBI/ION connection definitions', critical: true },
      { table: 'ADDIN', description: 'Add-in configurations', critical: false },
      { table: 'FILEINTERFACE', description: 'Flat file interface definitions', critical: true },
      { table: 'LANDMARKAPI', description: 'Landmark REST API endpoints', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const connections = await this._readOData('lawson/v1', 'LBICONNECTION');
      result.lbiConnections = connections;
      this._trackCoverage('LBICONNECTION', 'extracted', { rowCount: connections.length });
    } catch (err) {
      this.logger.warn(`LBICONNECTION read failed: ${err.message}`);
      result.lbiConnections = [];
      this._trackCoverage('LBICONNECTION', 'failed', { error: err.message });
    }

    try {
      const addins = await this._readOData('lawson/v1', 'ADDIN');
      result.addIns = addins;
      this._trackCoverage('ADDIN', 'extracted', { rowCount: addins.length });
    } catch (err) {
      this.logger.warn(`ADDIN read failed: ${err.message}`);
      result.addIns = [];
      this._trackCoverage('ADDIN', 'failed', { error: err.message });
    }

    try {
      const fileIntf = await this._readOData('lawson/v1', 'FILEINTERFACE');
      result.fileInterfaces = fileIntf;
      this._trackCoverage('FILEINTERFACE', 'extracted', { rowCount: fileIntf.length });
    } catch (err) {
      this.logger.warn(`FILEINTERFACE read failed: ${err.message}`);
      result.fileInterfaces = [];
      this._trackCoverage('FILEINTERFACE', 'failed', { error: err.message });
    }

    try {
      const apis = await this._readOData('lawson/v1', 'LANDMARKAPI');
      result.landmarkAPIs = apis;
      this._trackCoverage('LANDMARKAPI', 'extracted', { rowCount: apis.length });
    } catch (err) {
      this.logger.warn(`LANDMARKAPI read failed: ${err.message}`);
      result.landmarkAPIs = [];
      this._trackCoverage('LANDMARKAPI', 'failed', { error: err.message });
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/lawson/interfaces.json');
    this._trackCoverage('LBICONNECTION', 'extracted', { rowCount: (mockData.lbiConnections || []).length });
    this._trackCoverage('ADDIN', 'extracted', { rowCount: (mockData.addIns || []).length });
    this._trackCoverage('FILEINTERFACE', 'extracted', { rowCount: (mockData.fileInterfaces || []).length });
    this._trackCoverage('LANDMARKAPI', 'extracted', { rowCount: 0 });
    return mockData;
  }
}

LawsonInterfaceExtractor._extractorId = 'INFOR_LAWSON_INTERFACES';
LawsonInterfaceExtractor._module = 'LAWSON_INT';
LawsonInterfaceExtractor._category = 'interface';
LawsonInterfaceExtractor._sourceSystem = 'INFOR_LAWSON';
ExtractorRegistry.register(LawsonInterfaceExtractor);

module.exports = LawsonInterfaceExtractor;
