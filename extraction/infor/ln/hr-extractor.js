/**
 * Infor LN HR Extractor
 *
 * Extracts HR data from Infor LN including employee data, organizational
 * chart, payroll configuration, and positions.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNHRExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_HR'; }
  get name() { return 'Infor LN Human Resources'; }
  get module() { return 'LN_HR'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'tccom001', description: 'Employee master', critical: true },
      { table: 'tccom010', description: 'Departments', critical: true },
      { table: 'tccom020', description: 'Positions', critical: false },
      { table: 'tccom030', description: 'Payroll configuration', critical: false },
    ];
  }

  async _extractLive() {
    // NOTE: HR data contains sensitive PII. In production, anonymization
    // should be applied before storing extraction results.
    const result = {};

    // tccom001 - Employee master
    try {
      const data = await this._readTable('tccom001', {
        fields: ['t$emno', 't$name', 't$dept', 't$posn', 't$cpnb', 't$hidt', 't$stat', 't$egrp', 't$jlvl'],
        maxRows: 50000,
      });
      result.employees = data.rows;
    } catch (err) {
      this.logger.warn(`tccom001 read failed: ${err.message}`);
      result.employees = [];
    }

    // tccom010 - Departments
    try {
      const data = await this._readTable('tccom010', {
        fields: ['t$dept', 't$desc', 't$mgr', 't$cpnb', 't$prnt', 't$actv'],
      });
      result.departments = data.rows;
    } catch (err) {
      this.logger.warn(`tccom010 read failed: ${err.message}`);
      result.departments = [];
    }

    // tccom020 - Positions
    try {
      const data = await this._readTable('tccom020', {
        fields: ['t$posn', 't$desc', 't$dept', 't$jlvl', 't$head', 't$fill'],
      });
      result.positions = data.rows;
    } catch (err) {
      this._trackCoverage('tccom020', 'skipped', { reason: err.message });
      result.positions = [];
    }

    // tccom030 - Payroll configuration
    try {
      const data = await this._readTable('tccom030', {
        fields: ['t$cpnb', 't$freq', 't$ccur', 't$txjr'],
      });
      result.payrollConfig = { payFrequencies: data.rows, benefitPlans: [] };
    } catch (err) {
      this._trackCoverage('tccom030', 'skipped', { reason: err.message });
      result.payrollConfig = { payFrequencies: [], benefitPlans: [] };
    }

    // Compute summary
    result.summary = this._computeSummary(result);

    return result;
  }

  _computeSummary(result) {
    const employees = result.employees || [];
    const active = employees.filter(e => e.t$stat === 'ACT').length;
    const onLeave = employees.filter(e => e.t$stat === 'LEV').length;
    const partTime = employees.filter(e => e.t$egrp === 'PART').length;
    const companies = [...new Set(employees.map(e => e.t$cpnb))];

    return {
      totalEmployees: employees.length,
      activeEmployees: active,
      onLeave: onLeave,
      partTime: partTime,
      departments: (result.departments || []).length,
      positions: (result.positions || []).length,
      companiesCovered: companies,
      extractedAt: new Date().toISOString(),
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/hr.json');
    this._trackCoverage('tccom001', 'extracted', { rowCount: mockData.employees.length });
    this._trackCoverage('tccom010', 'extracted', { rowCount: mockData.departments.length });
    this._trackCoverage('tccom020', 'extracted', { rowCount: mockData.positions.length });
    this._trackCoverage('tccom030', 'extracted', { rowCount: mockData.payrollConfig.payFrequencies.length });
    return mockData;
  }
}

InforLNHRExtractor._extractorId = 'INFOR_LN_HR';
InforLNHRExtractor._module = 'LN_HR';
InforLNHRExtractor._category = 'master-data';
InforLNHRExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNHRExtractor);

module.exports = InforLNHRExtractor;
