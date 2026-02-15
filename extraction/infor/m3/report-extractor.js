/**
 * Infor M3 Reports Extractor
 *
 * Extracts report definitions and batch job configurations
 * from the M3 system.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3ReportExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_REPORTS'; }
  get name() { return 'Infor M3 Reports & Batch Jobs'; }
  get module() { return 'M3_RPT'; }
  get category() { return 'reports'; }

  getExpectedTables() {
    return [
      { table: 'CSYRPT', description: 'Report definitions', critical: true },
      { table: 'CSYJOB', description: 'Batch job definitions', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('CSYRPT', {
        fields: ['RPRPID', 'RPNAME', 'RPMOD', 'RPFREQ', 'RPFMT', 'RPSTAT'],
      });
      result.reports = data.rows;
    } catch (err) {
      this.logger.warn(`CSYRPT read failed: ${err.message}`);
      result.reports = [];
    }

    try {
      const data = await this._readTable('CSYJOB', {
        fields: ['JBJBID', 'JBNAME', 'JBPROG', 'JBSCHE', 'JBSTAT', 'JBPRIO'],
      });
      result.batchJobs = data.rows;
    } catch (err) {
      this.logger.warn(`CSYJOB read failed: ${err.message}`);
      result.batchJobs = [];
    }

    result.summary = {
      totalReports: result.reports.length,
      totalBatchJobs: result.batchJobs.length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/reports.json');
    this._trackCoverage('CSYRPT', 'extracted', { rowCount: (mockData.reports || []).length });
    this._trackCoverage('CSYJOB', 'extracted', { rowCount: (mockData.batchJobs || mockData.customReports || []).length });
    return mockData;
  }
}

InforM3ReportExtractor._extractorId = 'INFOR_M3_REPORTS';
InforM3ReportExtractor._module = 'M3_RPT';
InforM3ReportExtractor._category = 'reports';
InforM3ReportExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3ReportExtractor);

module.exports = InforM3ReportExtractor;
