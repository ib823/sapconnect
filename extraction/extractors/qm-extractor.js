/**
 * QM Extractor
 *
 * Extracts Quality Management data: inspection lots, sample records,
 * usage decisions, characteristics, defect items, catalog profiles,
 * and defect codes.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class QMExtractor extends BaseExtractor {
  get extractorId() { return 'QM_EXTRACTOR'; }
  get name() { return 'Quality Management'; }
  get module() { return 'QM'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'QALS', description: 'Inspection lot', critical: true },
      { table: 'QASR', description: 'Sample records', critical: false },
      { table: 'QAVE', description: 'Usage decisions', critical: true },
      { table: 'QAMV', description: 'Inspection characteristics', critical: true },
      { table: 'QMFE', description: 'Defect items', critical: false },
      { table: 'TQ70', description: 'Catalog profiles', critical: false },
      { table: 'TQ73', description: 'Defect codes', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // Inspection lots
    try {
      const data = await this._readTable('QALS', {
        fields: ['PRUESSION', 'MATNR', 'WERKS', 'CHARG', 'ART', 'HERESSION', 'STAT', 'ERDAT'],
        maxRows: 10000,
      });
      result.inspectionLots = data.rows;
    } catch (err) {
      this.logger.warn(`QALS read failed: ${err.message}`);
      result.inspectionLots = [];
    }

    // Sample records
    try {
      const data = await this._readTable('QASR', {
        fields: ['PRUESSION', 'VESSION', 'PROESSION', 'STESSION'],
        maxRows: 5000,
      });
      result.sampleRecords = data.rows;
    } catch (err) {
      this._trackCoverage('QASR', 'skipped', { reason: err.message });
      result.sampleRecords = [];
    }

    // Usage decisions
    try {
      const data = await this._readTable('QAVE', {
        fields: ['PRUESSION', 'VESSION', 'VCODE', 'VDATUM', 'VZEIT', 'VNAME'],
        maxRows: 10000,
      });
      result.usageDecisions = data.rows;
    } catch (err) {
      this.logger.warn(`QAVE read failed: ${err.message}`);
      result.usageDecisions = [];
    }

    // Inspection characteristics
    try {
      const data = await this._readTable('QAMV', {
        fields: ['PRUESSION', 'VESSION', 'MERESSION', 'VERWMERKM', 'SOLLWERT', 'TOLERANZ'],
        maxRows: 10000,
      });
      result.characteristics = data.rows;
    } catch (err) {
      this.logger.warn(`QAMV read failed: ${err.message}`);
      result.characteristics = [];
    }

    // Defect items
    try {
      const data = await this._readTable('QMFE', {
        fields: ['QMNUM', 'FEESSION', 'FESSION', 'FECOD', 'FEESSION_TXT', 'OTESSION'],
        maxRows: 5000,
      });
      result.defectItems = data.rows;
    } catch (err) {
      this._trackCoverage('QMFE', 'skipped', { reason: err.message });
      result.defectItems = [];
    }

    // Catalog profiles
    try {
      const data = await this._readTable('TQ70', {
        fields: ['KATESSION', 'ART', 'KATESSION_TXT'],
      });
      result.catalogProfiles = data.rows;
    } catch (err) {
      this._trackCoverage('TQ70', 'skipped', { reason: err.message });
      result.catalogProfiles = [];
    }

    // Defect codes
    try {
      const data = await this._readTable('TQ73', {
        fields: ['KATESSION', 'CODE', 'CODETEXT'],
      });
      result.defectCodes = data.rows;
    } catch (err) {
      this._trackCoverage('TQ73', 'skipped', { reason: err.message });
      result.defectCodes = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/qm-extractor.json');
    this._trackCoverage('QALS', 'extracted', { rowCount: mockData.inspectionLots.length });
    this._trackCoverage('QASR', 'extracted', { rowCount: mockData.sampleRecords.length });
    this._trackCoverage('QAVE', 'extracted', { rowCount: mockData.usageDecisions.length });
    this._trackCoverage('QAMV', 'extracted', { rowCount: mockData.characteristics.length });
    this._trackCoverage('QMFE', 'extracted', { rowCount: mockData.defectItems.length });
    this._trackCoverage('TQ70', 'extracted', { rowCount: mockData.catalogProfiles.length });
    this._trackCoverage('TQ73', 'extracted', { rowCount: mockData.defectCodes.length });
    return mockData;
  }
}

QMExtractor._extractorId = 'QM_EXTRACTOR';
QMExtractor._module = 'QM';
QMExtractor._category = 'config';
ExtractorRegistry.register(QMExtractor);

module.exports = QMExtractor;
