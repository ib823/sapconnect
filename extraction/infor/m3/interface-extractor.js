/**
 * Infor M3 Interfaces Extractor
 *
 * Extracts interface definitions: ION connections, M3 API (MI)
 * programs, file transfer interfaces, and EDI configurations.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3InterfaceExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_INTERFACES'; }
  get name() { return 'Infor M3 Interfaces & Integrations'; }
  get module() { return 'M3_INT'; }
  get category() { return 'interface'; }

  getExpectedTables() {
    return [
      { table: 'IONCON', description: 'ION connections', critical: true },
      { table: 'CMIPGM', description: 'MI program catalog', critical: true },
      { table: 'CFILIF', description: 'File interfaces', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      result.ionConnections = await this._readOData('M3/ION', 'Connections');
    } catch (err) {
      this.logger.warn(`ION connections extraction failed: ${err.message}`);
      result.ionConnections = [];
    }

    try {
      const data = await this._readTable('CMIPGM', {
        fields: ['MINAME', 'MIDESC', 'MITRNS', 'MICAT', 'MISTAT'],
      });
      result.miPrograms = data.rows;
    } catch (err) {
      this.logger.warn(`MI programs read failed: ${err.message}`);
      result.miPrograms = [];
    }

    try {
      const data = await this._readTable('CFILIF', {
        fields: ['FIIFID', 'FINAME', 'FIDIR', 'FIFMT', 'FIFREQ', 'FISTAT'],
      });
      result.fileInterfaces = data.rows;
    } catch (err) {
      this.logger.warn(`File interfaces read failed: ${err.message}`);
      result.fileInterfaces = [];
    }

    result.summary = {
      totalIONConnections: result.ionConnections.length,
      totalMIPrograms: result.miPrograms.length,
      totalFileInterfaces: result.fileInterfaces.length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/interfaces.json');
    this._trackCoverage('IONCON', 'extracted', { rowCount: (mockData.ionConnections || []).length });
    this._trackCoverage('CMIPGM', 'extracted', { rowCount: (mockData.miPrograms || []).length });
    this._trackCoverage('CFILIF', 'extracted', { rowCount: (mockData.fileInterfaces || []).length });
    return mockData;
  }
}

InforM3InterfaceExtractor._extractorId = 'INFOR_M3_INTERFACES';
InforM3InterfaceExtractor._module = 'M3_INT';
InforM3InterfaceExtractor._category = 'interface';
InforM3InterfaceExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3InterfaceExtractor);

module.exports = InforM3InterfaceExtractor;
