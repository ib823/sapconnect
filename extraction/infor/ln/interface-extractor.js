/**
 * Infor LN Interface Extractor
 *
 * Extracts interfaces: ION connections, BOD mappings, MEC maps,
 * EDI configuration, and file interfaces.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNInterfaceExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_INTERFACES'; }
  get name() { return 'Infor LN Interfaces'; }
  get module() { return 'LN_INT'; }
  get category() { return 'interface'; }

  getExpectedTables() {
    return [
      { table: 'ttadv6100', description: 'ION connections', critical: true },
      { table: 'ttadv6200', description: 'BOD mappings', critical: true },
      { table: 'ttadv6300', description: 'MEC maps', critical: false },
      { table: 'ttadv6400', description: 'EDI partners', critical: false },
      { table: 'ttadv6500', description: 'File interfaces', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // ttadv6100 - ION Connections
    try {
      const data = await this._readTable('ttadv6100', { fields: ['t$cnid', 't$name', 't$type', 't$prot', 't$host', 't$port', 't$auth', 't$stat', 't$lact'] });
      result.ionConnections = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv6100 read failed: ${err.message}`);
      result.ionConnections = [];
    }

    // ttadv6200 - BOD Mappings
    try {
      const data = await this._readTable('ttadv6200', { fields: ['t$bdid', 't$noun', 't$verb', 't$src', 't$tgt', 't$frmt', 't$freq', 't$actv'] });
      result.bodMappings = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv6200 read failed: ${err.message}`);
      result.bodMappings = [];
    }

    // ttadv6300 - MEC Maps
    try {
      const data = await this._readTable('ttadv6300', { fields: ['t$mcid', 't$name', 't$desc', 't$src', 't$tgt', 't$nfld', 't$actv'] });
      result.mecMaps = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv6300 read failed: ${err.message}`);
      result.mecMaps = [];
    }

    // ttadv6400 - EDI Partners
    try {
      const data = await this._readTable('ttadv6400', { fields: ['t$edid', 't$bpid', 't$name', 't$msgs', 't$prot', 't$stat'] });
      result.ediPartners = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv6400 read failed: ${err.message}`);
      result.ediPartners = [];
    }

    // ttadv6500 - File Interfaces
    try {
      const data = await this._readTable('ttadv6500', { fields: ['t$flid', 't$name', 't$type', 't$frmt', 't$path', 't$freq', 't$actv'] });
      result.fileInterfaces = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv6500 read failed: ${err.message}`);
      result.fileInterfaces = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/interfaces.json');
    this._trackCoverage('ttadv6100', 'extracted', { rowCount: mockData.ionConnections.length });
    this._trackCoverage('ttadv6200', 'extracted', { rowCount: mockData.bodMappings.length });
    this._trackCoverage('ttadv6300', 'extracted', { rowCount: mockData.mecMaps.length });
    this._trackCoverage('ttadv6400', 'extracted', { rowCount: mockData.ediPartners.length });
    this._trackCoverage('ttadv6500', 'extracted', { rowCount: mockData.fileInterfaces.length });
    return mockData;
  }
}

InforLNInterfaceExtractor._extractorId = 'INFOR_LN_INTERFACES';
InforLNInterfaceExtractor._module = 'LN_INT';
InforLNInterfaceExtractor._category = 'interface';
InforLNInterfaceExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNInterfaceExtractor);

module.exports = InforLNInterfaceExtractor;
