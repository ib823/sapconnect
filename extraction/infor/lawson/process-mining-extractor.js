/**
 * Lawson Process Mining Extractor
 *
 * Extracts audit trail events from Infor Lawson for process mining.
 * Reconstructs process variants from Lawson program audit logs
 * including procure-to-pay, patient revenue cycle, hire-to-retire,
 * and period close processes.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class LawsonProcessMiningExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LAWSON_PROCESS_MINING'; }
  get name() { return 'Lawson Process Mining'; }
  get module() { return 'LAWSON_PM'; }
  get category() { return 'process'; }

  getExpectedTables() {
    return [
      { table: 'AUDITTRAIL', description: 'Lawson audit trail events', critical: true },
      { table: 'PROCESSVARIANT', description: 'Reconstructed process variants', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const events = await this._readOData('lawson/v1', 'AUDITTRAIL');
      result.auditEvents = events;
      this._trackCoverage('AUDITTRAIL', 'extracted', { rowCount: events.length });
    } catch (err) {
      this.logger.warn(`AUDITTRAIL read failed: ${err.message}`);
      result.auditEvents = [];
      this._trackCoverage('AUDITTRAIL', 'failed', { error: err.message });
    }

    // Reconstruct process variants from audit events
    result.processVariants = this._reconstructProcesses(result.auditEvents);
    this._trackCoverage('PROCESSVARIANT', 'extracted', { rowCount: result.processVariants.length });

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/lawson/process-mining.json');
    this._trackCoverage('AUDITTRAIL', 'extracted', { rowCount: mockData.auditEvents.length });
    this._trackCoverage('PROCESSVARIANT', 'extracted', { rowCount: mockData.processVariants.length });
    return mockData;
  }

  /**
   * Reconstruct process variants from raw audit events by grouping on CASE_ID
   * and ordering by timestamp.
   */
  _reconstructProcesses(events) {
    if (!events || events.length === 0) return [];

    const cases = {};
    for (const evt of events) {
      const caseId = evt.CASE_ID;
      if (!caseId) continue;
      if (!cases[caseId]) cases[caseId] = [];
      cases[caseId].push(evt);
    }

    for (const caseId of Object.keys(cases)) {
      cases[caseId].sort((a, b) => new Date(a.TIMESTAMP) - new Date(b.TIMESTAMP));
    }

    const patterns = {};
    for (const [caseId, caseEvents] of Object.entries(cases)) {
      const steps = caseEvents.map(e => e.ACTIVITY);
      const pattern = steps.join(' -> ');
      const prefix = caseId.split('-').slice(0, -1).join('-') + '-';

      if (!patterns[pattern]) {
        patterns[pattern] = {
          processName: prefix,
          steps: steps.length,
          caseIds: [],
          firstSeen: caseEvents[0].TIMESTAMP,
          lastSeen: caseEvents[caseEvents.length - 1].TIMESTAMP,
        };
      }
      patterns[pattern].caseIds.push(caseId);
    }

    return Object.values(patterns).map(p => ({
      processName: p.processName,
      steps: p.steps,
      variants: p.caseIds.length,
      avgDurationDays: Math.round(
        (new Date(p.lastSeen) - new Date(p.firstSeen)) / (1000 * 60 * 60 * 24)
      ),
    }));
  }
}

LawsonProcessMiningExtractor._extractorId = 'INFOR_LAWSON_PROCESS_MINING';
LawsonProcessMiningExtractor._module = 'LAWSON_PM';
LawsonProcessMiningExtractor._category = 'process';
LawsonProcessMiningExtractor._sourceSystem = 'INFOR_LAWSON';
ExtractorRegistry.register(LawsonProcessMiningExtractor);

module.exports = LawsonProcessMiningExtractor;
