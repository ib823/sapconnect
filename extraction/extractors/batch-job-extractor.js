/**
 * Batch Job Extractor
 *
 * Extracts batch job catalog including job overview, job steps,
 * and job schedules with frequency and status statistics.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class BatchJobExtractor extends BaseExtractor {
  get extractorId() { return 'BATCH_JOBS'; }
  get name() { return 'Batch Job Catalog'; }
  get module() { return 'BASIS'; }
  get category() { return 'process'; }

  getExpectedTables() {
    return [
      { table: 'TBTCO', description: 'Job overview / status', critical: true },
      { table: 'TBTCP', description: 'Job step definitions', critical: true },
      { table: 'TBTCS', description: 'Job scheduling data', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // TBTCO - Job overview
    try {
      const data = await this._readTable('TBTCO', {
        fields: ['JOBNAME', 'JOBCOUNT', 'SDLUNAME', 'STATUS', 'SDLSTRTDT', 'SDLSTRTTM', 'ENDDATE', 'ENDTIME', 'PERIODIC'],
      });
      result.jobOverview = data.rows;
    } catch (err) {
      this.logger.warn(`TBTCO read failed: ${err.message}`);
      result.jobOverview = [];
    }

    // TBTCP - Job steps
    try {
      const data = await this._readTable('TBTCP', {
        fields: ['JOBNAME', 'JOBCOUNT', 'STEPCOUNT', 'PROGNAME', 'VARIANT', 'TYP', 'AUTHCKNAM'],
      });
      result.jobSteps = data.rows;
    } catch (err) {
      this.logger.warn(`TBTCP read failed: ${err.message}`);
      result.jobSteps = [];
    }

    // TBTCS - Job scheduling
    try {
      const data = await this._readTable('TBTCS', {
        fields: ['JOBNAME', 'JOBCOUNT', 'SDLUNAME', 'PRDMINS', 'PRDHOURS', 'PRDDAYS', 'PRDWEEKS', 'PRDMONTHS', 'STARTCOND', 'PREDJOB'],
      });
      result.jobSchedules = data.rows;
    } catch (err) {
      this._trackCoverage('TBTCS', 'skipped', { reason: err.message });
      result.jobSchedules = [];
    }

    // Compute stats
    result.stats = this._computeStats(result);

    return result;
  }

  _computeStats(result) {
    const jobs = result.jobOverview || [];
    const activeJobs = jobs.filter(j => j.STATUS === 'F' || j.STATUS === 'R' || j.STATUS === 'S').length;
    const erroredJobs = jobs.filter(j => j.STATUS === 'A').length;

    const schedules = result.jobSchedules || [];
    const jobsByFrequency = {};
    for (const s of schedules) {
      let freq;
      if (s.PRDMONTHS > 0) freq = 'monthly';
      else if (s.PRDWEEKS > 0) freq = 'weekly';
      else if (s.PRDDAYS > 0) freq = 'daily';
      else if (s.PRDHOURS > 0) freq = `every${s.PRDHOURS}hr`;
      else if (s.PRDMINS > 0) freq = `every${s.PRDMINS}min`;
      else freq = 'adhoc';

      jobsByFrequency[freq] = (jobsByFrequency[freq] || 0) + 1;
    }

    return {
      activeJobs,
      erroredJobs,
      jobsByFrequency,
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/batch-job-data.json');
    this._trackCoverage('TBTCO', 'extracted', { rowCount: mockData.jobOverview.length });
    this._trackCoverage('TBTCP', 'extracted', { rowCount: mockData.jobSteps.length });
    this._trackCoverage('TBTCS', 'extracted', { rowCount: mockData.jobSchedules.length });
    return mockData;
  }
}

BatchJobExtractor._extractorId = 'BATCH_JOBS';
BatchJobExtractor._module = 'BASIS';
BatchJobExtractor._category = 'process';
ExtractorRegistry.register(BatchJobExtractor);

module.exports = BatchJobExtractor;
