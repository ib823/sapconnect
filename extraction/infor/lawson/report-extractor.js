/**
 * Lawson Report Extractor
 *
 * Extracts Infor Lawson reporting landscape: LBI (Lawson Business Intelligence)
 * reports, Crystal reports, custom reports, and batch job definitions.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class LawsonReportExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LAWSON_REPORTS'; }
  get name() { return 'Lawson Reports & Batch Jobs'; }
  get module() { return 'LAWSON_RPT'; }
  get category() { return 'reports'; }

  getExpectedTables() {
    return [
      { table: 'LBIREPORT', description: 'LBI report definitions', critical: true },
      { table: 'CRYSTALRPT', description: 'Crystal Reports definitions', critical: false },
      { table: 'CUSTOMRPT', description: 'Custom report definitions', critical: false },
      { table: 'BATCHJOB', description: 'Batch job schedules', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const reports = await this._readOData('lawson/v1', 'LBIREPORT');
      result.reports = reports;
      this._trackCoverage('LBIREPORT', 'extracted', { rowCount: reports.length });
    } catch (err) {
      this.logger.warn(`LBIREPORT read failed: ${err.message}`);
      result.reports = [];
      this._trackCoverage('LBIREPORT', 'failed', { error: err.message });
    }

    try {
      const crystal = await this._readOData('lawson/v1', 'CRYSTALRPT');
      result.crystalReports = crystal;
      this._trackCoverage('CRYSTALRPT', 'extracted', { rowCount: crystal.length });
    } catch (err) {
      this.logger.warn(`CRYSTALRPT read failed: ${err.message}`);
      result.crystalReports = [];
      this._trackCoverage('CRYSTALRPT', 'failed', { error: err.message });
    }

    try {
      const custom = await this._readOData('lawson/v1', 'CUSTOMRPT');
      result.customReports = custom;
      this._trackCoverage('CUSTOMRPT', 'extracted', { rowCount: custom.length });
    } catch (err) {
      this.logger.warn(`CUSTOMRPT read failed: ${err.message}`);
      result.customReports = [];
      this._trackCoverage('CUSTOMRPT', 'failed', { error: err.message });
    }

    try {
      const jobs = await this._readOData('lawson/v1', 'BATCHJOB');
      result.batchJobs = jobs;
      this._trackCoverage('BATCHJOB', 'extracted', { rowCount: jobs.length });
    } catch (err) {
      this.logger.warn(`BATCHJOB read failed: ${err.message}`);
      result.batchJobs = [];
      this._trackCoverage('BATCHJOB', 'failed', { error: err.message });
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/lawson/reports.json');
    this._trackCoverage('LBIREPORT', 'extracted', { rowCount: (mockData.reports || []).length });
    this._trackCoverage('CRYSTALRPT', 'extracted', { rowCount: 0 });
    this._trackCoverage('CUSTOMRPT', 'extracted', { rowCount: (mockData.customReports || []).length });
    this._trackCoverage('BATCHJOB', 'extracted', { rowCount: 0 });
    return mockData;
  }
}

LawsonReportExtractor._extractorId = 'INFOR_LAWSON_REPORTS';
LawsonReportExtractor._module = 'LAWSON_RPT';
LawsonReportExtractor._category = 'reports';
LawsonReportExtractor._sourceSystem = 'INFOR_LAWSON';
ExtractorRegistry.register(LawsonReportExtractor);

module.exports = LawsonReportExtractor;
