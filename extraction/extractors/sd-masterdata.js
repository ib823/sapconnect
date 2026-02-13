/**
 * SD Master Data Extractor
 *
 * Extracts Sales & Distribution master data: customers, sales areas,
 * partner functions, customer hierarchy, and condition records.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class SDMasterdataExtractor extends BaseExtractor {
  get extractorId() { return 'SD_MASTERDATA'; }
  get name() { return 'SD Master Data'; }
  get module() { return 'SD'; }
  get category() { return 'masterdata'; }

  getExpectedTables() {
    return [
      { table: 'KNA1', description: 'Customer master - general data', critical: true },
      { table: 'KNVV', description: 'Customer master - sales area data', critical: true },
      { table: 'KNVP', description: 'Customer master - partner functions', critical: false },
      { table: 'KNVH', description: 'Customer hierarchy', critical: false },
      { table: 'KONH', description: 'Condition record header', critical: false },
      { table: 'KONP', description: 'Condition record items', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // Customer master general data
    try {
      const data = await this._readTable('KNA1', {
        fields: ['KUNNR', 'NAME1', 'LAND1', 'ORT01', 'KTOKD', 'STCD1', 'ERDAT'],
        maxRows: 10000,
      });
      result.customers = data.rows;
    } catch (err) {
      this.logger.warn(`KNA1 read failed: ${err.message}`);
      result.customers = [];
    }

    // Sales area data
    try {
      const data = await this._readTable('KNVV', {
        fields: ['KUNNR', 'VKORG', 'VTWEG', 'SPART', 'KDGRP', 'BZIRK', 'WAERS'],
        maxRows: 10000,
      });
      result.salesAreas = data.rows;
    } catch (err) {
      this.logger.warn(`KNVV read failed: ${err.message}`);
      result.salesAreas = [];
    }

    // Partner functions
    try {
      const data = await this._readTable('KNVP', {
        fields: ['KUNNR', 'VKORG', 'VTWEG', 'SPART', 'PARVW', 'KUNN2'],
        maxRows: 10000,
      });
      result.partnerFunctions = data.rows;
    } catch (err) {
      this._trackCoverage('KNVP', 'skipped', { reason: err.message });
      result.partnerFunctions = [];
    }

    // Customer hierarchy
    try {
      const data = await this._readTable('KNVH', {
        fields: ['HESSION', 'KUNNR', 'VKORG', 'VTWEG', 'SPART', 'DATAB', 'DATBI'],
        maxRows: 5000,
      });
      result.customerHierarchy = data.rows;
    } catch (err) {
      this._trackCoverage('KNVH', 'skipped', { reason: err.message });
      result.customerHierarchy = [];
    }

    // Condition records
    try {
      const konh = await this._readTable('KONH', {
        fields: ['KNUMH', 'KSCHL', 'ERDAT', 'ERNAM', 'VAESSION'],
        maxRows: 5000,
      });
      result.conditionRecords = konh.rows;
    } catch (err) {
      this._trackCoverage('KONH', 'skipped', { reason: err.message });
      result.conditionRecords = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/sd-masterdata.json');
    this._trackCoverage('KNA1', 'extracted', { rowCount: mockData.customers.length });
    this._trackCoverage('KNVV', 'extracted', { rowCount: mockData.salesAreas.length });
    this._trackCoverage('KNVP', 'extracted', { rowCount: mockData.partnerFunctions.length });
    this._trackCoverage('KNVH', 'extracted', { rowCount: mockData.customerHierarchy.length });
    this._trackCoverage('KONH', 'extracted', { rowCount: mockData.conditionRecords.length });
    return mockData;
  }
}

SDMasterdataExtractor._extractorId = 'SD_MASTERDATA';
SDMasterdataExtractor._module = 'SD';
SDMasterdataExtractor._category = 'masterdata';
ExtractorRegistry.register(SDMasterdataExtractor);

module.exports = SDMasterdataExtractor;
