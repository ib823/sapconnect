/**
 * Infor M3 Customizations Extractor
 *
 * Extracts M3 customizations: personalized views, custom fields,
 * and API modifications.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3CustomizationExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_CUSTOMIZATION'; }
  get name() { return 'Infor M3 Customizations'; }
  get module() { return 'M3_CUSTOM'; }
  get category() { return 'customization'; }

  getExpectedTables() {
    return [
      { table: 'CMNPVW', description: 'Personalized views', critical: true },
      { table: 'CSYCFD', description: 'Custom field definitions', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('CMNPVW', {
        fields: ['PVVIEW', 'PVPROG', 'PVDESC', 'PVUSER', 'PVSHRD'],
      });
      result.customViews = data.rows;
    } catch (err) {
      this.logger.warn(`CMNPVW read failed: ${err.message}`);
      result.customViews = [];
    }

    try {
      const data = await this._readTable('CSYCFD', {
        fields: ['CFTABL', 'CFFLDN', 'CFDESC', 'CFDTYP', 'CFFLEN', 'CFMAND'],
      });
      result.customFields = data.rows;
    } catch (err) {
      this.logger.warn(`CSYCFD read failed: ${err.message}`);
      result.customFields = [];
    }

    result.summary = {
      totalCustomViews: result.customViews.length,
      totalCustomFields: result.customFields.length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/customizations.json');
    this._trackCoverage('CMNPVW', 'extracted', { rowCount: (mockData.customViews || []).length });
    this._trackCoverage('CSYCFD', 'extracted', { rowCount: (mockData.customFields || []).length });
    return mockData;
  }
}

InforM3CustomizationExtractor._extractorId = 'INFOR_M3_CUSTOMIZATION';
InforM3CustomizationExtractor._module = 'M3_CUSTOM';
InforM3CustomizationExtractor._category = 'customization';
InforM3CustomizationExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3CustomizationExtractor);

module.exports = InforM3CustomizationExtractor;
