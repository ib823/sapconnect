/**
 * MM Master Data Extractor
 *
 * Extracts Materials Management master data: materials, plant data,
 * storage data, sales data, valuation data, purchasing info records,
 * and condition records.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class MMMasterdataExtractor extends BaseExtractor {
  get extractorId() { return 'MM_MASTERDATA'; }
  get name() { return 'MM Master Data'; }
  get module() { return 'MM'; }
  get category() { return 'masterdata'; }

  getExpectedTables() {
    return [
      { table: 'MARA', description: 'General material data', critical: true },
      { table: 'MAKT', description: 'Material descriptions', critical: true },
      { table: 'MARC', description: 'Plant data for material', critical: true },
      { table: 'MARD', description: 'Storage location data', critical: true },
      { table: 'MVKE', description: 'Sales data for material', critical: false },
      { table: 'MBEW', description: 'Material valuation', critical: true },
      { table: 'MLAN', description: 'Tax classification', critical: false },
      { table: 'EINE', description: 'Purchasing info record - org level', critical: false },
      { table: 'EINA', description: 'Purchasing info record - general', critical: false },
      { table: 'A017', description: 'Condition table - material info record', critical: false },
      { table: 'A018', description: 'Condition table - material vendor', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // General material data with descriptions
    try {
      const mara = await this._readTable('MARA', {
        fields: ['MATNR', 'MTART', 'MATKL', 'MEINS', 'MBRSH', 'MSTAE', 'ERSDA'],
        maxRows: 5000,
      });
      result.materials = mara.rows;
    } catch (err) {
      this.logger.warn(`MARA read failed: ${err.message}`);
      result.materials = [];
    }

    // Plant data
    try {
      const marc = await this._readTable('MARC', {
        fields: ['MATNR', 'WERKS', 'DISMM', 'DISPO', 'EKGRP', 'LADGR', 'PLIFZ'],
        maxRows: 10000,
      });
      result.plantData = marc.rows;
    } catch (err) {
      this.logger.warn(`MARC read failed: ${err.message}`);
      result.plantData = [];
    }

    // Storage location data
    try {
      const mard = await this._readTable('MARD', {
        fields: ['MATNR', 'WERKS', 'LGORT', 'LABST', 'INSME', 'SPEME'],
        maxRows: 10000,
      });
      result.storageData = mard.rows;
    } catch (err) {
      this.logger.warn(`MARD read failed: ${err.message}`);
      result.storageData = [];
    }

    // Sales data
    try {
      const mvke = await this._readTable('MVKE', {
        fields: ['MATNR', 'VKORG', 'VTWEG', 'DWERK', 'KONDM', 'KTGRM'],
        maxRows: 5000,
      });
      result.salesData = mvke.rows;
    } catch (err) {
      this._trackCoverage('MVKE', 'skipped', { reason: err.message });
      result.salesData = [];
    }

    // Valuation data
    try {
      const mbew = await this._readTable('MBEW', {
        fields: ['MATNR', 'BWKEY', 'VPRSV', 'VERPR', 'STPRS', 'PEINH', 'BKLAS'],
        maxRows: 5000,
      });
      result.valuationData = mbew.rows;
    } catch (err) {
      this.logger.warn(`MBEW read failed: ${err.message}`);
      result.valuationData = [];
    }

    // Purchasing info records
    try {
      const eina = await this._readTable('EINA', {
        fields: ['INFNR', 'MATNR', 'LIFNR', 'LOEKZ'],
        maxRows: 5000,
      });
      result.purchasingInfoRecords = eina.rows;
    } catch (err) {
      this._trackCoverage('EINA', 'skipped', { reason: err.message });
      result.purchasingInfoRecords = [];
    }

    // Conditions
    try {
      const a017 = await this._readTable('A017', {
        fields: ['KAPPL', 'KSCHL', 'LIFNR', 'MATNR', 'EKORG', 'KNUMH'],
        maxRows: 5000,
      });
      result.conditions = a017.rows;
    } catch (err) {
      this._trackCoverage('A017', 'skipped', { reason: err.message });
      result.conditions = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/mm-masterdata.json');
    this._trackCoverage('MARA', 'extracted', { rowCount: mockData.materials.length });
    this._trackCoverage('MARC', 'extracted', { rowCount: mockData.plantData.length });
    this._trackCoverage('MARD', 'extracted', { rowCount: mockData.storageData.length });
    this._trackCoverage('MVKE', 'extracted', { rowCount: mockData.salesData.length });
    this._trackCoverage('MBEW', 'extracted', { rowCount: mockData.valuationData.length });
    this._trackCoverage('EINA', 'extracted', { rowCount: mockData.purchasingInfoRecords.length });
    this._trackCoverage('A017', 'extracted', { rowCount: mockData.conditions.length });
    return mockData;
  }
}

MMMasterdataExtractor._extractorId = 'MM_MASTERDATA';
MMMasterdataExtractor._module = 'MM';
MMMasterdataExtractor._category = 'masterdata';
ExtractorRegistry.register(MMMasterdataExtractor);

module.exports = MMMasterdataExtractor;
