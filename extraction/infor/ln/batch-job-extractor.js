/**
 * Infor LN Batch Job Extractor
 *
 * Extracts batch job data from Infor LN including scheduled jobs (ttjmg),
 * recurring jobs, and job history.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNBatchJobExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_BATCH_JOBS'; }
  get name() { return 'Infor LN Batch Jobs'; }
  get module() { return 'LN_RPT'; }
  get category() { return 'reports'; }

  getExpectedTables() {
    return [
      { table: 'ttjmg0100', description: 'Scheduled batch jobs', critical: true },
      { table: 'ttjmg0200', description: 'Recurring job definitions', critical: false },
      { table: 'ttjmg0300', description: 'Job execution history', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // ttjmg0100 - Scheduled batch jobs
    try {
      const data = await this._readTable('ttjmg0100', {
        fields: ['t$jbid', 't$desc', 't$cpnb', 't$sess', 't$freq', 't$time', 't$stat', 't$prio', 't$user'],
        maxRows: 10000,
      });
      result.scheduledJobs = data.rows;
    } catch (err) {
      this.logger.warn(`ttjmg0100 read failed: ${err.message}`);
      result.scheduledJobs = [];
    }

    // ttjmg0200 - Recurring job definitions
    try {
      const data = await this._readTable('ttjmg0200', {
        fields: ['t$rjid', 't$desc', 't$freq', 't$strt', 't$stop', 't$cpnb', 't$stat'],
        maxRows: 10000,
      });
      result.recurringJobs = data.rows;
    } catch (err) {
      this._trackCoverage('ttjmg0200', 'skipped', { reason: err.message });
      result.recurringJobs = [];
    }

    // ttjmg0300 - Job execution history
    try {
      const data = await this._readTable('ttjmg0300', {
        fields: ['t$jbid', 't$rund', 't$strt', 't$endt', 't$stat', 't$msg'],
        maxRows: 100000,
      });
      result.jobHistory = data.rows;
    } catch (err) {
      this._trackCoverage('ttjmg0300', 'skipped', { reason: err.message });
      result.jobHistory = [];
    }

    // Compute summary
    result.summary = this._computeSummary(result);

    return result;
  }

  _computeSummary(result) {
    const scheduled = result.scheduledJobs || [];
    const history = result.jobHistory || [];
    const active = scheduled.filter(j => j.t$stat === 'ACT').length;
    const successful = history.filter(h => h.t$stat === 'OK').length;
    const warnings = history.filter(h => h.t$stat === 'WRN').length;
    const failed = history.filter(h => h.t$stat === 'ERR').length;

    return {
      totalScheduledJobs: scheduled.length,
      totalRecurringJobs: (result.recurringJobs || []).length,
      totalJobHistory: history.length,
      activeJobs: active,
      successfulRuns: successful,
      warningRuns: warnings,
      failedRuns: failed,
      extractedAt: new Date().toISOString(),
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/batch-jobs.json');
    this._trackCoverage('ttjmg0100', 'extracted', { rowCount: mockData.scheduledJobs.length });
    this._trackCoverage('ttjmg0200', 'extracted', { rowCount: mockData.recurringJobs.length });
    this._trackCoverage('ttjmg0300', 'extracted', { rowCount: mockData.jobHistory.length });
    return mockData;
  }
}

InforLNBatchJobExtractor._extractorId = 'INFOR_LN_BATCH_JOBS';
InforLNBatchJobExtractor._module = 'LN_RPT';
InforLNBatchJobExtractor._category = 'reports';
InforLNBatchJobExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNBatchJobExtractor);

module.exports = InforLNBatchJobExtractor;
