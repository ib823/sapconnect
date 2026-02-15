/**
 * Infor M3 XtendM3 Extensions Extractor
 *
 * Extracts XtendM3 extensions (TypeScript-based): triggers,
 * utilities, and API extensions with complexity ratings.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3XtendM3Extractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_XTENDM3'; }
  get name() { return 'Infor M3 XtendM3 Extensions'; }
  get module() { return 'M3_CUSTOM'; }
  get category() { return 'customization'; }

  getExpectedTables() {
    return [
      { table: 'XTDTRG', description: 'XtendM3 triggers', critical: true },
      { table: 'XTDUTL', description: 'XtendM3 utilities', critical: false },
      { table: 'XTDAPI', description: 'XtendM3 API extensions', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      result.triggers = await this._readOData('M3/XtendM3', 'Triggers');
    } catch (err) {
      this.logger.warn(`XtendM3 triggers extraction failed: ${err.message}`);
      result.triggers = [];
    }

    try {
      result.utilities = await this._readOData('M3/XtendM3', 'Utilities');
    } catch (err) {
      this.logger.warn(`XtendM3 utilities extraction failed: ${err.message}`);
      result.utilities = [];
    }

    try {
      result.apiExtensions = await this._readOData('M3/XtendM3', 'APIExtensions');
    } catch (err) {
      this.logger.warn(`XtendM3 API extensions extraction failed: ${err.message}`);
      result.apiExtensions = [];
    }

    result.summary = {
      totalTriggers: result.triggers.length,
      activeTriggers: result.triggers.filter(t => t.status === 'Active').length,
      totalUtilities: result.utilities.length,
      totalApiExtensions: result.apiExtensions.length,
      totalLinesOfCode: [...result.triggers, ...result.utilities, ...result.apiExtensions]
        .reduce((sum, ext) => sum + (ext.linesOfCode || 0), 0),
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/xtendm3.json');
    this._trackCoverage('XTDTRG', 'extracted', { rowCount: (mockData.triggers || []).length });
    this._trackCoverage('XTDUTL', 'extracted', { rowCount: (mockData.utilities || []).length });
    this._trackCoverage('XTDAPI', 'extracted', { rowCount: (mockData.apiExtensions || []).length });
    return mockData;
  }
}

InforM3XtendM3Extractor._extractorId = 'INFOR_M3_XTENDM3';
InforM3XtendM3Extractor._module = 'M3_CUSTOM';
InforM3XtendM3Extractor._category = 'customization';
InforM3XtendM3Extractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3XtendM3Extractor);

module.exports = InforM3XtendM3Extractor;
