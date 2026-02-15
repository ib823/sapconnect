/**
 * Infor LN Customization Extractor
 *
 * Extracts customizations: sessions (ttadv), customer sessions (ttadv2100),
 * VRC (Version Release Customization) data.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNCustomizationExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_CUSTOMIZATION'; }
  get name() { return 'Infor LN Customizations'; }
  get module() { return 'LN_CUSTOM'; }
  get category() { return 'customization'; }

  getExpectedTables() {
    return [
      { table: 'ttadv0100', description: 'Standard sessions', critical: true },
      { table: 'ttadv2100', description: 'Customer sessions', critical: true },
      { table: 'ttadv4100', description: 'VRC packages', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    // ttadv0100 - Standard Sessions
    try {
      const data = await this._readTable('ttadv0100', { fields: ['t$sess', 't$desc', 't$pack', 't$modn', 't$type', 't$cust'] });
      result.standardSessions = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv0100 read failed: ${err.message}`);
      result.standardSessions = [];
    }

    // ttadv2100 - Customer Sessions
    try {
      const data = await this._readTable('ttadv2100', { fields: ['t$sess', 't$desc', 't$pack', 't$modn', 't$type', 't$cust', 't$base', 't$vrc'] });
      result.customerSessions = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv2100 read failed: ${err.message}`);
      result.customerSessions = [];
    }

    // ttadv4100 - VRC Packages
    try {
      const data = await this._readTable('ttadv4100', { fields: ['t$vrcc', 't$desc', 't$vers', 't$rels', 't$cust', 't$nsess', 't$nscr', 't$ntbl', 't$cdat'] });
      result.vrcPackages = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv4100 read failed: ${err.message}`);
      result.vrcPackages = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/customizations.json');
    this._trackCoverage('ttadv0100', 'extracted', { rowCount: mockData.standardSessions.length });
    this._trackCoverage('ttadv2100', 'extracted', { rowCount: mockData.customerSessions.length });
    this._trackCoverage('ttadv4100', 'extracted', { rowCount: mockData.vrcPackages.length });
    return mockData;
  }
}

InforLNCustomizationExtractor._extractorId = 'INFOR_LN_CUSTOMIZATION';
InforLNCustomizationExtractor._module = 'LN_CUSTOM';
InforLNCustomizationExtractor._category = 'customization';
InforLNCustomizationExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNCustomizationExtractor);

module.exports = InforLNCustomizationExtractor;
