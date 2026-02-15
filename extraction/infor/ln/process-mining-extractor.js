/**
 * Infor LN Process Mining Extractor
 *
 * Extracts process mining data from ttaud audit tables and transaction logs.
 * Covers P2P (Procure-to-Pay), O2C (Order-to-Cash), and R2R (Record-to-Report).
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNProcessMiningExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_PROCESS_MINING'; }
  get name() { return 'Infor LN Process Mining'; }
  get module() { return 'LN_PM'; }
  get category() { return 'process'; }

  getExpectedTables() {
    return [
      { table: 'ttaud0100', description: 'Audit trail events', critical: true },
      { table: 'ttaud0200', description: 'Transaction log details', critical: false },
      { table: 'ttaud0300', description: 'Process step metadata', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // ttaud0100 - Audit Trail Events
    try {
      const data = await this._readTable('ttaud0100', {
        fields: ['t$evid', 't$proc', 't$step', 't$user', 't$sess', 't$docn', 't$cpnb', 't$ts', 't$stat', 't$refn'],
      });
      result.auditEvents = data.rows;
    } catch (err) {
      this.logger.warn(`ttaud0100 read failed: ${err.message}`);
      result.auditEvents = [];
    }

    // Compute process statistics from the audit events
    result.processStats = this._computeProcessStats(result.auditEvents);

    return result;
  }

  _computeProcessStats(events) {
    const stats = {};
    const processes = [...new Set(events.map(e => e['t$proc']))];

    for (const proc of processes) {
      const procEvents = events.filter(e => e['t$proc'] === proc);
      const documents = [...new Set(procEvents.map(e => e['t$docn']))];

      const cycleTimes = [];
      for (const doc of documents) {
        const docEvents = procEvents
          .filter(e => e['t$docn'] === doc)
          .sort((a, b) => new Date(a['t$ts']) - new Date(b['t$ts']));
        if (docEvents.length >= 2) {
          const first = new Date(docEvents[0]['t$ts']);
          const last = new Date(docEvents[docEvents.length - 1]['t$ts']);
          cycleTimes.push((last - first) / (1000 * 60 * 60 * 24));
        }
      }

      const autoEvents = procEvents.filter(e => e['t$user'] === 'system').length;

      stats[proc] = {
        totalEvents: procEvents.length,
        avgCycleTimeDays: cycleTimes.length > 0
          ? Math.round((cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) * 10) / 10
          : 0,
        minCycleTimeDays: cycleTimes.length > 0
          ? Math.round(Math.min(...cycleTimes) * 10) / 10
          : 0,
        maxCycleTimeDays: cycleTimes.length > 0
          ? Math.round(Math.max(...cycleTimes) * 10) / 10
          : 0,
        automationRate: procEvents.length > 0
          ? Math.round((autoEvents / procEvents.length) * 100) / 100
          : 0,
      };
    }

    return stats;
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/process-mining.json');
    this._trackCoverage('ttaud0100', 'extracted', { rowCount: mockData.auditEvents.length });
    this._trackCoverage('ttaud0200', 'extracted', { rowCount: 0 });
    this._trackCoverage('ttaud0300', 'extracted', { rowCount: 0 });
    return mockData;
  }
}

InforLNProcessMiningExtractor._extractorId = 'INFOR_LN_PROCESS_MINING';
InforLNProcessMiningExtractor._module = 'LN_PM';
InforLNProcessMiningExtractor._category = 'process';
InforLNProcessMiningExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNProcessMiningExtractor);

module.exports = InforLNProcessMiningExtractor;
