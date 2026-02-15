/**
 * Infor LN Financial Configuration Extractor
 *
 * Extracts FI configuration: chart of accounts (tfgld010), dimensions (tfgld020),
 * journal groups (tfgld001), tax configuration.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNFIConfigExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_FI_CONFIG'; }
  get name() { return 'Infor LN Financial Configuration'; }
  get module() { return 'LN_FI'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'tfgld010', description: 'Chart of accounts', critical: true },
      { table: 'tfgld020', description: 'Dimensions', critical: true },
      { table: 'tfgld001', description: 'Journal groups', critical: false },
      { table: 'tcmcs036', description: 'Tax codes', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    // tfgld010 - Chart of Accounts
    try {
      const data = await this._readTable('tfgld010', { fields: ['t$cano', 't$desc', 't$cpnb', 't$nlvl', 't$fdig', 't$actv'] });
      result.chartsOfAccounts = data.rows;
    } catch (err) {
      this.logger.warn(`tfgld010 read failed: ${err.message}`);
      result.chartsOfAccounts = [];
    }

    // tfgld020 - Dimensions
    try {
      const data = await this._readTable('tfgld020', { fields: ['t$dimn', 't$desc', 't$actv', 't$mand', 't$type'] });
      result.dimensions = data.rows;
    } catch (err) {
      this.logger.warn(`tfgld020 read failed: ${err.message}`);
      result.dimensions = [];
    }

    // tfgld001 - Journal Groups
    try {
      const data = await this._readTable('tfgld001', { fields: ['t$jgrp', 't$desc', 't$auto', 't$appr'] });
      result.journalGroups = data.rows;
    } catch (err) {
      this.logger.warn(`tfgld001 read failed: ${err.message}`);
      result.journalGroups = [];
    }

    // tcmcs036 - Tax Codes
    try {
      const data = await this._readTable('tcmcs036', { fields: ['t$txcd', 't$desc', 't$rate', 't$type', 't$ctry', 't$actv'] });
      result.taxCodes = data.rows;
    } catch (err) {
      this.logger.warn(`tcmcs036 read failed: ${err.message}`);
      result.taxCodes = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/fi-config.json');
    this._trackCoverage('tfgld010', 'extracted', { rowCount: mockData.chartsOfAccounts.length });
    this._trackCoverage('tfgld020', 'extracted', { rowCount: mockData.dimensions.length });
    this._trackCoverage('tfgld001', 'extracted', { rowCount: mockData.journalGroups.length });
    this._trackCoverage('tcmcs036', 'extracted', { rowCount: mockData.taxCodes.length });
    return mockData;
  }
}

InforLNFIConfigExtractor._extractorId = 'INFOR_LN_FI_CONFIG';
InforLNFIConfigExtractor._module = 'LN_FI';
InforLNFIConfigExtractor._category = 'config';
InforLNFIConfigExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNFIConfigExtractor);

module.exports = InforLNFIConfigExtractor;
