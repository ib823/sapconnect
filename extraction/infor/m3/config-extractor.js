/**
 * Infor M3 Configuration Extractor
 *
 * Extracts M3 system configuration: companies (CMNFCN), divisions,
 * facilities, and warehouse settings.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3ConfigExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_CONFIG'; }
  get name() { return 'Infor M3 System Configuration'; }
  get module() { return 'M3_BASIS'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'CMNCMP', description: 'Companies', critical: true },
      { table: 'CMNDIV', description: 'Divisions', critical: true },
      { table: 'CFACIL', description: 'Facilities', critical: true },
      { table: 'MITWHL', description: 'Warehouses', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('CMNCMP', {
        fields: ['CCCONO', 'CCCONM', 'CCDIVI', 'CCCSCD', 'CCLOCD', 'CCCOCU', 'CCACCU', 'CCSTAT'],
      });
      result.companies = data.rows;
    } catch (err) {
      this.logger.warn(`CMNCMP read failed: ${err.message}`);
      result.companies = [];
    }

    try {
      const data = await this._readTable('CMNDIV', {
        fields: ['CCDIVI', 'CCCONO', 'CCDIVN', 'CCCSCD', 'CCDCFM', 'CCACGR'],
      });
      result.divisions = data.rows;
    } catch (err) {
      this.logger.warn(`CMNDIV read failed: ${err.message}`);
      result.divisions = [];
    }

    try {
      const data = await this._readTable('CFACIL', {
        fields: ['CFFACI', 'CFCONO', 'CFFACN', 'CFCSCD', 'CFSTAT', 'CFWHLO'],
      });
      result.facilities = data.rows;
    } catch (err) {
      this.logger.warn(`CFACIL read failed: ${err.message}`);
      result.facilities = [];
    }

    try {
      const data = await this._readTable('MITWHL', {
        fields: ['MHWHLO', 'MHCONO', 'MHWHNM', 'MHWHTY', 'MHFACI', 'MHCSCD', 'MHSTAT'],
      });
      result.warehouses = data.rows;
    } catch (err) {
      this.logger.warn(`MITWHL read failed: ${err.message}`);
      result.warehouses = [];
    }

    result.summary = {
      totalCompanies: result.companies.length,
      totalDivisions: result.divisions.length,
      totalFacilities: result.facilities.length,
      totalWarehouses: result.warehouses.length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/config.json');
    this._trackCoverage('CMNCMP', 'extracted', { rowCount: mockData.companies.length });
    this._trackCoverage('CMNDIV', 'extracted', { rowCount: mockData.divisions.length });
    this._trackCoverage('CFACIL', 'extracted', { rowCount: mockData.facilities.length });
    this._trackCoverage('MITWHL', 'extracted', { rowCount: mockData.warehouses.length });
    return mockData;
  }
}

InforM3ConfigExtractor._extractorId = 'INFOR_M3_CONFIG';
InforM3ConfigExtractor._module = 'M3_BASIS';
InforM3ConfigExtractor._category = 'config';
InforM3ConfigExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3ConfigExtractor);

module.exports = InforM3ConfigExtractor;
