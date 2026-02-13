/**
 * BW Extractor
 *
 * Extracts Business Warehouse configuration including data sources,
 * transformations, InfoProviders, InfoObjects, process chains, and
 * extraction history.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class BWExtractor extends BaseExtractor {
  get extractorId() { return 'BW_EXTRACTOR'; }
  get name() { return 'Business Warehouse'; }
  get module() { return 'BW'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'RSOLTPSOURCE', description: 'ODP/OLTP data sources', critical: true },
      { table: 'RSTRANRULE', description: 'Transformation rules', critical: true },
      { table: 'RSDCUBEMULTI', description: 'InfoProviders (MultiProviders/CompositeProviders)', critical: true },
      { table: 'RSDIOBJ', description: 'InfoObjects', critical: true },
      { table: 'RSPC', description: 'Process chains', critical: false },
      { table: 'RSPCTOOL', description: 'Process chain steps', critical: false },
      { table: 'RSSELDONE', description: 'Extraction history / selection log', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // RSOLTPSOURCE - Data sources
    try {
      const data = await this._readTable('RSOLTPSOURCE', {
        fields: ['OLTPSOURCE', 'OBJVERS', 'TXTLG', 'EXMETHOD', 'DELTA', 'LOGSYS'],
      });
      result.dataSources = data.rows;
    } catch (err) {
      this.logger.warn(`RSOLTPSOURCE read failed: ${err.message}`);
      result.dataSources = [];
    }

    // RSTRANRULE - Transformation rules
    try {
      const data = await this._readTable('RSTRANRULE', {
        fields: ['TRANID', 'RULEID', 'OBJVERS', 'SOURCEFIELD', 'TARGETFIELD', 'RULETYPE'],
      });
      result.transformations = data.rows;
    } catch (err) {
      this.logger.warn(`RSTRANRULE read failed: ${err.message}`);
      result.transformations = [];
    }

    // RSDCUBEMULTI - InfoProviders
    try {
      const data = await this._readTable('RSDCUBEMULTI', {
        fields: ['INFOCUBE', 'OBJVERS', 'PARTCUBE', 'CUBETYPE'],
      });
      result.infoProviders = data.rows;
    } catch (err) {
      this.logger.warn(`RSDCUBEMULTI read failed: ${err.message}`);
      result.infoProviders = [];
    }

    // RSDIOBJ - InfoObjects
    try {
      const data = await this._readTable('RSDIOBJ', {
        fields: ['IOBJNM', 'OBJVERS', 'IOBJTP', 'CHATYP', 'DATATP', 'CONVEXIT'],
      });
      result.infoObjects = data.rows;
    } catch (err) {
      this.logger.warn(`RSDIOBJ read failed: ${err.message}`);
      result.infoObjects = [];
    }

    // RSPC - Process chains
    try {
      const data = await this._readTable('RSPC', {
        fields: ['CHAIN_ID', 'OBJVERS', 'TYPE', 'TXTLG', 'CHAIN_STATUS', 'LAST_RUN'],
      });
      result.processChains = data.rows;
    } catch (err) {
      this._trackCoverage('RSPC', 'skipped', { reason: err.message });
      result.processChains = [];
    }

    // RSPCTOOL - Process chain steps
    try {
      const data = await this._readTable('RSPCTOOL', {
        fields: ['CHAIN_ID', 'STEP_ID', 'OBJVERS', 'TYPE', 'VARIANT', 'PREDECESSOR'],
      });
      result.processChainSteps = data.rows;
    } catch (err) {
      this._trackCoverage('RSPCTOOL', 'skipped', { reason: err.message });
      result.processChainSteps = [];
    }

    // RSSELDONE - Extraction history
    try {
      const data = await this._readTable('RSSELDONE', {
        fields: ['OLTPSOURCE', 'LOGSYS', 'REQUNR', 'DATUM', 'ZEIT', 'RECORDS'],
        maxRows: 500,
      });
      result.extractionHistory = data.rows;
    } catch (err) {
      this._trackCoverage('RSSELDONE', 'skipped', { reason: err.message });
      result.extractionHistory = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/bw-data.json');
    this._trackCoverage('RSOLTPSOURCE', 'extracted', { rowCount: mockData.dataSources.length });
    this._trackCoverage('RSTRANRULE', 'extracted', { rowCount: mockData.transformations.length });
    this._trackCoverage('RSDCUBEMULTI', 'extracted', { rowCount: mockData.infoProviders.length });
    this._trackCoverage('RSDIOBJ', 'extracted', { rowCount: mockData.infoObjects.length });
    this._trackCoverage('RSPC', 'extracted', { rowCount: mockData.processChains.length });
    this._trackCoverage('RSPCTOOL', 'extracted', { rowCount: mockData.processChainSteps.length });
    this._trackCoverage('RSSELDONE', 'extracted', { rowCount: mockData.extractionHistory.length });
    return mockData;
  }
}

BWExtractor._extractorId = 'BW_EXTRACTOR';
BWExtractor._module = 'BW';
BWExtractor._category = 'config';
ExtractorRegistry.register(BWExtractor);

module.exports = BWExtractor;
