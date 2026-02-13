/**
 * MM Configuration Extractor
 *
 * Extracts Materials Management configuration: purchasing orgs,
 * purchasing groups, movement types, document types, plants,
 * storage locations, item categories, material groups, MRP controllers,
 * and tolerance settings.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class MMConfigExtractor extends BaseExtractor {
  get extractorId() { return 'MM_CONFIG'; }
  get name() { return 'Materials Management Configuration'; }
  get module() { return 'MM'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'T024E', description: 'Purchasing organizations', critical: true },
      { table: 'T024', description: 'Purchasing groups', critical: true },
      { table: 'T156', description: 'Movement types', critical: true },
      { table: 'T156T', description: 'Movement type texts', critical: false },
      { table: 'T161', description: 'Purchasing document types', critical: true },
      { table: 'T001W', description: 'Plants', critical: true },
      { table: 'T001L', description: 'Storage locations', critical: true },
      { table: 'T163', description: 'Item categories', critical: false },
      { table: 'T023', description: 'Material groups', critical: false },
      { table: 'T024D', description: 'MRP controllers', critical: false },
      { table: 'T160', description: 'Tolerance keys', critical: false },
      { table: 'TMVF', description: 'Tolerance limits', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // Purchasing organizations
    try {
      const data = await this._readTable('T024E', { fields: ['EKORG', 'EKOTX', 'BUKRS'] });
      result.purchasingOrgs = data.rows;
    } catch (err) {
      this.logger.warn(`T024E read failed: ${err.message}`);
      result.purchasingOrgs = [];
    }

    // Purchasing groups
    try {
      const data = await this._readTable('T024', { fields: ['EKGRP', 'EKNAM'] });
      result.purchasingGroups = data.rows;
    } catch (err) {
      this.logger.warn(`T024 read failed: ${err.message}`);
      result.purchasingGroups = [];
    }

    // Movement types
    try {
      const data = await this._readTable('T156', { fields: ['BWART', 'XAUTO', 'KZBEW', 'KZZUG'] });
      result.movementTypes = data.rows;
    } catch (err) {
      this.logger.warn(`T156 read failed: ${err.message}`);
      result.movementTypes = [];
    }

    // Purchasing document types
    try {
      const data = await this._readTable('T161', { fields: ['BSART', 'BSTYP', 'BATXT'] });
      result.docTypes = data.rows;
    } catch (err) {
      this.logger.warn(`T161 read failed: ${err.message}`);
      result.docTypes = [];
    }

    // Plants
    try {
      const data = await this._readTable('T001W', { fields: ['WERKS', 'NAME1', 'BUKRS', 'FABKL'] });
      result.plants = data.rows;
    } catch (err) {
      this.logger.warn(`T001W read failed: ${err.message}`);
      result.plants = [];
    }

    // Storage locations
    try {
      const data = await this._readTable('T001L', { fields: ['WERKS', 'LGORT', 'LGOBE'] });
      result.storageLocations = data.rows;
    } catch (err) {
      this.logger.warn(`T001L read failed: ${err.message}`);
      result.storageLocations = [];
    }

    // Item categories
    try {
      const data = await this._readTable('T163', { fields: ['PSTYP', 'PTEXT'] });
      result.itemCategories = data.rows;
    } catch (err) {
      this._trackCoverage('T163', 'skipped', { reason: err.message });
      result.itemCategories = [];
    }

    // Material groups
    try {
      const data = await this._readTable('T023', { fields: ['MATKL', 'WGBEZ'] });
      result.materialGroups = data.rows;
    } catch (err) {
      this._trackCoverage('T023', 'skipped', { reason: err.message });
      result.materialGroups = [];
    }

    // MRP controllers
    try {
      const data = await this._readTable('T024D', { fields: ['WERKS', 'DTEFIXED', 'DSNAM'] });
      result.mrpControllers = data.rows;
    } catch (err) {
      this._trackCoverage('T024D', 'skipped', { reason: err.message });
      result.mrpControllers = [];
    }

    // Tolerances
    try {
      const data = await this._readTable('T160', { fields: ['TOESSION', 'TOESSION_TXT'] });
      result.tolerances = data.rows;
    } catch (err) {
      this._trackCoverage('T160', 'skipped', { reason: err.message });
      result.tolerances = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/mm-config.json');
    this._trackCoverage('T024E', 'extracted', { rowCount: mockData.purchasingOrgs.length });
    this._trackCoverage('T024', 'extracted', { rowCount: mockData.purchasingGroups.length });
    this._trackCoverage('T156', 'extracted', { rowCount: mockData.movementTypes.length });
    this._trackCoverage('T161', 'extracted', { rowCount: mockData.docTypes.length });
    this._trackCoverage('T001W', 'extracted', { rowCount: mockData.plants.length });
    this._trackCoverage('T001L', 'extracted', { rowCount: mockData.storageLocations.length });
    this._trackCoverage('T163', 'extracted', { rowCount: mockData.itemCategories.length });
    this._trackCoverage('T023', 'extracted', { rowCount: mockData.materialGroups.length });
    this._trackCoverage('T024D', 'extracted', { rowCount: mockData.mrpControllers.length });
    this._trackCoverage('T160', 'extracted', { rowCount: mockData.tolerances.length });
    return mockData;
  }
}

MMConfigExtractor._extractorId = 'MM_CONFIG';
MMConfigExtractor._module = 'MM';
MMConfigExtractor._category = 'config';
ExtractorRegistry.register(MMConfigExtractor);

module.exports = MMConfigExtractor;
