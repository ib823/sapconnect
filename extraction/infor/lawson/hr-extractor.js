/**
 * Lawson HR Extractor
 *
 * Extracts Infor Lawson HR data: EMPLOYEE records, POSITION definitions,
 * department structure, payroll configuration, and benefit plans.
 * Lawson HR/Payroll is a core strength -- often the last module to migrate.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class LawsonHRExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LAWSON_HR'; }
  get name() { return 'Lawson Human Resources & Payroll'; }
  get module() { return 'LAWSON_HR'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'EMPLOYEE', description: 'Employee master records', critical: true },
      { table: 'POSITION', description: 'Position definitions', critical: true },
      { table: 'DEPARTMENT', description: 'Department master', critical: false },
      { table: 'PAYROLLCFG', description: 'Payroll configuration', critical: false },
      { table: 'BENEFITPLAN', description: 'Benefit plan definitions', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const employees = await this._readOData('lawson/v1', 'EMPLOYEE');
      result.employees = employees;
      this._trackCoverage('EMPLOYEE', 'extracted', { rowCount: employees.length });
    } catch (err) {
      this.logger.warn(`EMPLOYEE read failed: ${err.message}`);
      result.employees = [];
      this._trackCoverage('EMPLOYEE', 'failed', { error: err.message });
    }

    try {
      const positions = await this._readOData('lawson/v1', 'POSITION');
      result.positions = positions;
      this._trackCoverage('POSITION', 'extracted', { rowCount: positions.length });
    } catch (err) {
      this.logger.warn(`POSITION read failed: ${err.message}`);
      result.positions = [];
      this._trackCoverage('POSITION', 'failed', { error: err.message });
    }

    try {
      const departments = await this._readOData('lawson/v1', 'DEPARTMENT');
      result.departments = departments;
      this._trackCoverage('DEPARTMENT', 'extracted', { rowCount: departments.length });
    } catch (err) {
      this.logger.warn(`DEPARTMENT read failed: ${err.message}`);
      result.departments = [];
      this._trackCoverage('DEPARTMENT', 'failed', { error: err.message });
    }

    try {
      const payroll = await this._readOData('lawson/v1', 'PAYROLLCFG');
      result.payrollConfig = payroll;
      this._trackCoverage('PAYROLLCFG', 'extracted', { rowCount: Array.isArray(payroll) ? payroll.length : 1 });
    } catch (err) {
      this.logger.warn(`PAYROLLCFG read failed: ${err.message}`);
      result.payrollConfig = {};
      this._trackCoverage('PAYROLLCFG', 'failed', { error: err.message });
    }

    try {
      const benefits = await this._readOData('lawson/v1', 'BENEFITPLAN');
      result.benefitPlans = benefits;
      this._trackCoverage('BENEFITPLAN', 'extracted', { rowCount: benefits.length });
    } catch (err) {
      this.logger.warn(`BENEFITPLAN read failed: ${err.message}`);
      result.benefitPlans = [];
      this._trackCoverage('BENEFITPLAN', 'failed', { error: err.message });
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/lawson/hr.json');
    this._trackCoverage('EMPLOYEE', 'extracted', { rowCount: mockData.employees.length });
    this._trackCoverage('POSITION', 'extracted', { rowCount: mockData.positions.length });
    this._trackCoverage('DEPARTMENT', 'extracted', { rowCount: (mockData.departments || []).length });
    this._trackCoverage('PAYROLLCFG', 'extracted', { rowCount: 1 });
    this._trackCoverage('BENEFITPLAN', 'extracted', { rowCount: 0 });
    return mockData;
  }
}

LawsonHRExtractor._extractorId = 'INFOR_LAWSON_HR';
LawsonHRExtractor._module = 'LAWSON_HR';
LawsonHRExtractor._category = 'master-data';
LawsonHRExtractor._sourceSystem = 'INFOR_LAWSON';
ExtractorRegistry.register(LawsonHRExtractor);

module.exports = LawsonHRExtractor;
