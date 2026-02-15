/**
 * Lawson Customization Extractor
 *
 * Extracts Infor Lawson customizations: Design Studio forms,
 * PFI (Process Flow Integrator) workflows, Landmark configuration,
 * and custom programs/user exits. Assesses migration complexity.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class LawsonCustomizationExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LAWSON_CUSTOMIZATIONS'; }
  get name() { return 'Lawson Customizations & Extensions'; }
  get module() { return 'LAWSON_CUSTOM'; }
  get category() { return 'customization'; }

  getExpectedTables() {
    return [
      { table: 'CUSTOMPROG', description: 'Custom programs', critical: true },
      { table: 'USEREXIT', description: 'User exit configurations', critical: true },
      { table: 'DESIGNSTUDIO', description: 'Design Studio form customizations', critical: false },
      { table: 'PFI', description: 'Process Flow Integrator definitions', critical: false },
      { table: 'LANDMARKCFG', description: 'Landmark platform customizations', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const programs = await this._readOData('lawson/v1', 'CUSTOMPROG');
      result.customPrograms = programs;
      this._trackCoverage('CUSTOMPROG', 'extracted', { rowCount: programs.length });
    } catch (err) {
      this.logger.warn(`CUSTOMPROG read failed: ${err.message}`);
      result.customPrograms = [];
      this._trackCoverage('CUSTOMPROG', 'failed', { error: err.message });
    }

    try {
      const exits = await this._readOData('lawson/v1', 'USEREXIT');
      result.userExits = exits;
      this._trackCoverage('USEREXIT', 'extracted', { rowCount: exits.length });
    } catch (err) {
      this.logger.warn(`USEREXIT read failed: ${err.message}`);
      result.userExits = [];
      this._trackCoverage('USEREXIT', 'failed', { error: err.message });
    }

    try {
      const dsForms = await this._readOData('lawson/v1', 'DESIGNSTUDIO');
      result.designStudioForms = dsForms;
      this._trackCoverage('DESIGNSTUDIO', 'extracted', { rowCount: dsForms.length });
    } catch (err) {
      this.logger.warn(`DESIGNSTUDIO read failed: ${err.message}`);
      result.designStudioForms = [];
      this._trackCoverage('DESIGNSTUDIO', 'failed', { error: err.message });
    }

    try {
      const pfis = await this._readOData('lawson/v1', 'PFI');
      result.processFlowIntegrators = pfis;
      this._trackCoverage('PFI', 'extracted', { rowCount: pfis.length });
    } catch (err) {
      this.logger.warn(`PFI read failed: ${err.message}`);
      result.processFlowIntegrators = [];
      this._trackCoverage('PFI', 'failed', { error: err.message });
    }

    try {
      const lmkCfg = await this._readOData('lawson/v1', 'LANDMARKCFG');
      result.landmarkCustomizations = lmkCfg;
      this._trackCoverage('LANDMARKCFG', 'extracted', { rowCount: lmkCfg.length });
    } catch (err) {
      this.logger.warn(`LANDMARKCFG read failed: ${err.message}`);
      result.landmarkCustomizations = [];
      this._trackCoverage('LANDMARKCFG', 'failed', { error: err.message });
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/lawson/customizations.json');
    this._trackCoverage('CUSTOMPROG', 'extracted', { rowCount: mockData.customPrograms.length });
    this._trackCoverage('USEREXIT', 'extracted', { rowCount: mockData.userExits.length });
    this._trackCoverage('DESIGNSTUDIO', 'extracted', { rowCount: 0 });
    this._trackCoverage('PFI', 'extracted', { rowCount: 0 });
    this._trackCoverage('LANDMARKCFG', 'extracted', { rowCount: 0 });
    return mockData;
  }
}

LawsonCustomizationExtractor._extractorId = 'INFOR_LAWSON_CUSTOMIZATIONS';
LawsonCustomizationExtractor._module = 'LAWSON_CUSTOM';
LawsonCustomizationExtractor._category = 'customization';
LawsonCustomizationExtractor._sourceSystem = 'INFOR_LAWSON';
ExtractorRegistry.register(LawsonCustomizationExtractor);

module.exports = LawsonCustomizationExtractor;
