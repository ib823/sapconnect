/**
 * Infor M3 Process Mining Extractor
 *
 * Extracts process mining data from M3 audit logs and transaction
 * history. Covers OIS100/OIS300 (order entry/confirm), PPS200 (MO),
 * and APS100 (planning) processes.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3ProcessMiningExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_PROCESS_MINING'; }
  get name() { return 'Infor M3 Process Mining'; }
  get module() { return 'M3_PM'; }
  get category() { return 'process'; }

  getExpectedTables() {
    return [
      { table: 'CSYLOG', description: 'System audit log', critical: true },
      { table: 'OOHEAD', description: 'Customer order headers', critical: true },
      { table: 'MWOHED', description: 'Manufacturing order headers', critical: true },
      { table: 'MPHEAD', description: 'Purchase order headers', critical: false },
    ];
  }

  async _extractLive() {
    const result = { events: [], processVariants: [] };

    try {
      const data = await this._readTable('CSYLOG', {
        fields: ['CSCASE', 'CSDOCN', 'CSPROG', 'CSACTN', 'CSDATE', 'CSUSER'],
      });
      result.events = this._transformToEvents(data.rows);
      this._trackCoverage('CSYLOG', 'extracted', { rowCount: data.rows.length });
    } catch (err) {
      this.logger.warn(`CSYLOG read failed: ${err.message}`);
      this._trackCoverage('CSYLOG', 'failed', { error: err.message });
    }

    result.processVariants = this._analyzeVariants(result.events);
    result.summary = {
      totalEvents: result.events.length,
      uniqueCases: new Set(result.events.map(e => e.caseId)).size,
      uniqueActivities: new Set(result.events.map(e => e.activity)).size,
      processVariants: result.processVariants.length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  _transformToEvents(rows) {
    return rows.map(row => ({
      caseId: row.CSCASE || row.CSDOCN,
      activity: `${row.CSPROG}-${row.CSACTN}`,
      timestamp: row.CSDATE,
      user: row.CSUSER,
      program: row.CSPROG,
    }));
  }

  _analyzeVariants(events) {
    const caseMap = new Map();
    for (const event of events) {
      if (!caseMap.has(event.caseId)) caseMap.set(event.caseId, []);
      caseMap.get(event.caseId).push(event.activity);
    }
    const variantMap = new Map();
    for (const [, steps] of caseMap) {
      const key = steps.join(' -> ');
      variantMap.set(key, (variantMap.get(key) || 0) + 1);
    }
    return Array.from(variantMap.entries()).map(([variant, frequency]) => ({
      variant,
      frequency,
      steps: variant.split(' -> '),
    }));
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/process-mining.json');
    this._trackCoverage('CSYLOG', 'extracted', { rowCount: (mockData.events || []).length });
    this._trackCoverage('OOHEAD', 'extracted', { rowCount: 0 });
    this._trackCoverage('MWOHED', 'extracted', { rowCount: 0 });
    this._trackCoverage('MPHEAD', 'extracted', { rowCount: 0 });
    return mockData;
  }
}

InforM3ProcessMiningExtractor._extractorId = 'INFOR_M3_PROCESS_MINING';
InforM3ProcessMiningExtractor._module = 'M3_PM';
InforM3ProcessMiningExtractor._category = 'process';
InforM3ProcessMiningExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3ProcessMiningExtractor);

module.exports = InforM3ProcessMiningExtractor;
