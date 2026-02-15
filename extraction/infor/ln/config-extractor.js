/**
 * Infor LN Configuration Extractor
 *
 * Extracts LN system configuration: companies (tcemm030), logistic companies
 * (tcemm040), company parameters (tcmcs060), general parameters (tccom000).
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNConfigExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_CONFIG'; }
  get name() { return 'Infor LN System Configuration'; }
  get module() { return 'LN_BASIS'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'tcemm030', description: 'Financial companies', critical: true },
      { table: 'tcemm040', description: 'Logistic companies', critical: true },
      { table: 'tcmcs060', description: 'Company parameters', critical: false },
      { table: 'tccom000', description: 'General parameters', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    // tcemm030 - Financial Companies
    try {
      const data = await this._readTable('tcemm030', { fields: ['t$cpnb', 't$cpds', 't$ccur', 't$clng', 't$ccty', 't$cgrp'] });
      result.companies = data.rows;
    } catch (err) {
      this.logger.warn(`tcemm030 read failed: ${err.message}`);
      result.companies = [];
    }

    // tcemm040 - Logistic Companies
    try {
      const data = await this._readTable('tcemm040', { fields: ['t$lgnb', 't$lgds', 't$cpnb', 't$stwh', 't$dfwh'] });
      result.logisticCompanies = data.rows;
    } catch (err) {
      this.logger.warn(`tcemm040 read failed: ${err.message}`);
      result.logisticCompanies = [];
    }

    // tcmcs060 - Company Parameters
    try {
      const data = await this._readTable('tcmcs060', { fields: ['t$cpnb', 't$parm', 't$pval', 't$pdsc'] });
      result.companyParameters = data.rows;
    } catch (err) {
      this.logger.warn(`tcmcs060 read failed: ${err.message}`);
      result.companyParameters = [];
    }

    // tccom000 - General Parameters
    try {
      const data = await this._readTable('tccom000', { fields: ['t$base', 't$clng', 't$dfrm', 't$decm', 't$thsm', 't$ccur', 't$rptc', 't$fyer', 't$fprd', 't$sprd', 't$mcmp', 't$mlgc', 't$mwhs'] });
      result.generalParameters = data.rows.length > 0 ? data.rows[0] : {};
    } catch (err) {
      this.logger.warn(`tccom000 read failed: ${err.message}`);
      result.generalParameters = {};
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/config.json');
    this._trackCoverage('tcemm030', 'extracted', { rowCount: mockData.companies.length });
    this._trackCoverage('tcemm040', 'extracted', { rowCount: mockData.logisticCompanies.length });
    this._trackCoverage('tcmcs060', 'extracted', { rowCount: mockData.companyParameters.length });
    this._trackCoverage('tccom000', 'extracted', { rowCount: 1 });
    return mockData;
  }
}

InforLNConfigExtractor._extractorId = 'INFOR_LN_CONFIG';
InforLNConfigExtractor._module = 'LN_BASIS';
InforLNConfigExtractor._category = 'config';
InforLNConfigExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNConfigExtractor);

module.exports = InforLNConfigExtractor;
