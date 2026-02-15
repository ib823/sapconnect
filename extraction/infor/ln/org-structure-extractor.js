/**
 * Infor LN Organization Structure Extractor
 *
 * Extracts LN organizational structure: financial companies (tcemm030),
 * logistic companies (tcemm040), sales offices (tdsls090), warehouses (whwmd001).
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNOrgStructureExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_ORG_STRUCTURE'; }
  get name() { return 'Infor LN Organization Structure'; }
  get module() { return 'LN_BASIS'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'tcemm030', description: 'Financial companies', critical: true },
      { table: 'tcemm040', description: 'Logistic companies', critical: true },
      { table: 'tdsls090', description: 'Sales offices', critical: false },
      { table: 'whwmd001', description: 'Warehouses', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // tcemm030 - Financial Companies
    try {
      const data = await this._readTable('tcemm030', { fields: ['t$cpnb', 't$cpds', 't$ccur', 't$ccty', 't$cgrp', 't$actv'] });
      result.financialCompanies = data.rows;
    } catch (err) {
      this.logger.warn(`tcemm030 read failed: ${err.message}`);
      result.financialCompanies = [];
    }

    // tcemm040 - Logistic Companies
    try {
      const data = await this._readTable('tcemm040', { fields: ['t$lgnb', 't$lgds', 't$cpnb', 't$actv', 't$site'] });
      result.logisticCompanies = data.rows;
    } catch (err) {
      this.logger.warn(`tcemm040 read failed: ${err.message}`);
      result.logisticCompanies = [];
    }

    // tdsls090 - Sales Offices
    try {
      const data = await this._readTable('tdsls090', { fields: ['t$slof', 't$desc', 't$cpnb', 't$lgnb', 't$rgnc', 't$actv'] });
      result.salesOffices = data.rows;
    } catch (err) {
      this.logger.warn(`tdsls090 read failed: ${err.message}`);
      result.salesOffices = [];
    }

    // whwmd001 - Warehouses
    try {
      const data = await this._readTable('whwmd001', { fields: ['t$whno', 't$desc', 't$lgnb', 't$type', 't$addr', 't$actv'] });
      result.warehouses = data.rows;
    } catch (err) {
      this.logger.warn(`whwmd001 read failed: ${err.message}`);
      result.warehouses = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/org-structure.json');
    this._trackCoverage('tcemm030', 'extracted', { rowCount: mockData.financialCompanies.length });
    this._trackCoverage('tcemm040', 'extracted', { rowCount: mockData.logisticCompanies.length });
    this._trackCoverage('tdsls090', 'extracted', { rowCount: mockData.salesOffices.length });
    this._trackCoverage('whwmd001', 'extracted', { rowCount: mockData.warehouses.length });
    return mockData;
  }
}

InforLNOrgStructureExtractor._extractorId = 'INFOR_LN_ORG_STRUCTURE';
InforLNOrgStructureExtractor._module = 'LN_BASIS';
InforLNOrgStructureExtractor._category = 'config';
InforLNOrgStructureExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNOrgStructureExtractor);

module.exports = InforLNOrgStructureExtractor;
