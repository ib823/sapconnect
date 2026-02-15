/**
 * Lawson Data Quality Extractor
 *
 * Profiles data quality across key Lawson tables: completeness scores,
 * duplicate detection, cross-table integrity checks, and accounting
 * string validation (decomposition rule verification).
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class LawsonDataQualityExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LAWSON_DATA_QUALITY'; }
  get name() { return 'Lawson Data Quality Profiling'; }
  get module() { return 'LAWSON_DQ'; }
  get category() { return 'data-quality'; }

  getExpectedTables() {
    return [
      { table: 'DQ_PROFILE', description: 'Data quality profile results', critical: true },
      { table: 'DQ_ACCTSTRING', description: 'Accounting string validation results', critical: true },
      { table: 'DQ_INTEGRITY', description: 'Cross-table integrity checks', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const profiles = await this._readOData('lawson/v1', 'DQ_PROFILE');
      result.tableProfiles = profiles;
      this._trackCoverage('DQ_PROFILE', 'extracted', { rowCount: profiles.length });
    } catch (err) {
      this.logger.warn(`DQ_PROFILE read failed: ${err.message}`);
      result.tableProfiles = [];
      this._trackCoverage('DQ_PROFILE', 'failed', { error: err.message });
    }

    try {
      const acctAnalysis = await this._readOData('lawson/v1', 'DQ_ACCTSTRING');
      result.accountingStringAnalysis = Array.isArray(acctAnalysis) ? acctAnalysis[0] : acctAnalysis;
      this._trackCoverage('DQ_ACCTSTRING', 'extracted', { rowCount: 1 });
    } catch (err) {
      this.logger.warn(`DQ_ACCTSTRING read failed: ${err.message}`);
      result.accountingStringAnalysis = {};
      this._trackCoverage('DQ_ACCTSTRING', 'failed', { error: err.message });
    }

    try {
      const integrity = await this._readOData('lawson/v1', 'DQ_INTEGRITY');
      result.crossTableIntegrity = integrity;
      this._trackCoverage('DQ_INTEGRITY', 'extracted', { rowCount: integrity.length });
    } catch (err) {
      this.logger.warn(`DQ_INTEGRITY read failed: ${err.message}`);
      result.crossTableIntegrity = [];
      this._trackCoverage('DQ_INTEGRITY', 'failed', { error: err.message });
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/lawson/data-quality.json');
    this._trackCoverage('DQ_PROFILE', 'extracted', { rowCount: mockData.tableProfiles.length });
    this._trackCoverage('DQ_ACCTSTRING', 'extracted', { rowCount: 1 });
    this._trackCoverage('DQ_INTEGRITY', 'extracted', { rowCount: mockData.crossTableIntegrity.length });
    return mockData;
  }
}

LawsonDataQualityExtractor._extractorId = 'INFOR_LAWSON_DATA_QUALITY';
LawsonDataQualityExtractor._module = 'LAWSON_DQ';
LawsonDataQualityExtractor._category = 'data-quality';
LawsonDataQualityExtractor._sourceSystem = 'INFOR_LAWSON';
ExtractorRegistry.register(LawsonDataQualityExtractor);

module.exports = LawsonDataQualityExtractor;
