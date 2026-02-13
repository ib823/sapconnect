/**
 * Transport Extractor
 *
 * Extracts transport request history including requests, object entries,
 * request texts, client attributes, and import queue status.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class TransportExtractor extends BaseExtractor {
  get extractorId() { return 'TRANSPORTS'; }
  get name() { return 'Transport History'; }
  get module() { return 'BASIS'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'E070', description: 'Transport request header', critical: true },
      { table: 'E071', description: 'Transport object entries', critical: true },
      { table: 'E07T', description: 'Transport request texts', critical: false },
      { table: 'E070C', description: 'Transport client attributes', critical: false },
      { table: 'TMSQREQ', description: 'Import queue requests', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // E070 - Transport requests
    try {
      const data = await this._readTable('E070', {
        fields: ['TRKORR', 'TRFUNCTION', 'TRSTATUS', 'TARSYSTEM', 'AS4USER', 'AS4DATE', 'AS4TIME', 'STRKORR'],
      });
      result.requests = data.rows;
    } catch (err) {
      this.logger.warn(`E070 read failed: ${err.message}`);
      result.requests = [];
    }

    // E071 - Transport object entries
    try {
      const data = await this._readTable('E071', {
        fields: ['TRKORR', 'AS4POS', 'PGMID', 'OBJECT', 'OBJ_NAME', 'OBJFUNC', 'LOCKFLAG'],
      });
      result.objectEntries = data.rows;
    } catch (err) {
      this.logger.warn(`E071 read failed: ${err.message}`);
      result.objectEntries = [];
    }

    // E07T - Request texts
    try {
      const data = await this._readTable('E07T', {
        fields: ['TRKORR', 'AS4TEXT'],
      });
      result.requestTexts = data.rows;
    } catch (err) {
      this._trackCoverage('E07T', 'skipped', { reason: err.message });
      result.requestTexts = [];
    }

    // E070C - Client attributes
    try {
      const data = await this._readTable('E070C', {
        fields: ['TRKORR', 'CLIENTID', 'INTSYS', 'CATEGORY'],
      });
      result.clientAttributes = data.rows;
    } catch (err) {
      this._trackCoverage('E070C', 'skipped', { reason: err.message });
      result.clientAttributes = [];
    }

    // TMSQREQ - Import queue
    try {
      const data = await this._readTable('TMSQREQ', {
        fields: ['TRKORR', 'TARSYSTEM', 'TRFUNCTION', 'RETCODE', 'IMPTED'],
      });
      result.importQueue = data.rows;
    } catch (err) {
      this._trackCoverage('TMSQREQ', 'skipped', { reason: err.message });
      result.importQueue = [];
    }

    // Compute stats
    result.stats = this._computeStats(result);

    return result;
  }

  _computeStats(result) {
    const totalTransports = result.requests.length;
    const unreleasedCount = result.requests.filter(r => r.TRSTATUS === 'D').length;
    const totalObjects = result.objectEntries.length;
    const objectsPerTransport = totalTransports > 0
      ? Math.round((totalObjects / totalTransports) * 100) / 100
      : 0;

    return {
      totalTransports,
      unreleasedCount,
      objectsPerTransport,
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/transport-data.json');
    this._trackCoverage('E070', 'extracted', { rowCount: mockData.requests.length });
    this._trackCoverage('E071', 'extracted', { rowCount: mockData.objectEntries.length });
    this._trackCoverage('E07T', 'extracted', { rowCount: mockData.requestTexts.length });
    this._trackCoverage('E070C', 'extracted', { rowCount: mockData.clientAttributes.length });
    this._trackCoverage('TMSQREQ', 'extracted', { rowCount: mockData.importQueue.length });
    return mockData;
  }
}

TransportExtractor._extractorId = 'TRANSPORTS';
TransportExtractor._module = 'BASIS';
TransportExtractor._category = 'config';
ExtractorRegistry.register(TransportExtractor);

module.exports = TransportExtractor;
