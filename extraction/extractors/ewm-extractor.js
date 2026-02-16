/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * EWM Extractor
 *
 * Extracts Extended Warehouse Management configuration including
 * quants, handling unit items, warehouse config, tasks, and wave headers.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class EWMExtractor extends BaseExtractor {
  get extractorId() { return 'EWM_EXTRACTOR'; }
  get name() { return 'Extended Warehouse Management'; }
  get module() { return 'EWM'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: '/SCWM/AQUA', description: 'Quants (available quantities)', critical: true },
      { table: '/SCWM/HUITM', description: 'Handling unit items', critical: true },
      { table: '/SCWM/T300', description: 'Warehouse configuration', critical: true },
      { table: '/SCWM/TRSEG', description: 'Warehouse task segments', critical: false },
      { table: '/SCWM/WAVEHDR', description: 'Wave headers', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // /SCWM/AQUA - Quants
    try {
      const data = await this._readTable('/SCWM/AQUA', {
        fields: ['LGNUM', 'HUIDENT', 'MATNR', 'BATCHID', 'QUAN', 'UOM', 'LGTYP', 'LGPLA'],
      });
      result.quants = data.rows;
    } catch (err) {
      this.logger.warn(`/SCWM/AQUA read failed: ${err.message}`);
      result.quants = [];
    }

    // /SCWM/HUITM - Handling unit items
    try {
      const data = await this._readTable('/SCWM/HUITM', {
        fields: ['LGNUM', 'HUIDENT', 'MATNR', 'QUAN', 'UOM', 'STOCK_TYPE', 'OWNER'],
      });
      result.huItems = data.rows;
    } catch (err) {
      this.logger.warn(`/SCWM/HUITM read failed: ${err.message}`);
      result.huItems = [];
    }

    // /SCWM/T300 - Warehouse configuration
    try {
      const data = await this._readTable('/SCWM/T300', {
        fields: ['LGNUM', 'LNUMT', 'KOBER', 'ADRNR', 'LGTYP_MAX', 'WHS_STATUS'],
      });
      result.warehouseConfig = data.rows;
    } catch (err) {
      this.logger.warn(`/SCWM/T300 read failed: ${err.message}`);
      result.warehouseConfig = [];
    }

    // /SCWM/TRSEG - Warehouse task segments
    try {
      const data = await this._readTable('/SCWM/TRSEG', {
        fields: ['LGNUM', 'TANUM', 'TAPOS', 'MATNR', 'VLTYP', 'VLPLA', 'NLTYP', 'NLPLA', 'VSOLM'],
      });
      result.warehouseTasks = data.rows;
    } catch (err) {
      this._trackCoverage('/SCWM/TRSEG', 'skipped', { reason: err.message });
      result.warehouseTasks = [];
    }

    // /SCWM/WAVEHDR - Wave headers
    try {
      const data = await this._readTable('/SCWM/WAVEHDR', {
        fields: ['LGNUM', 'WAVE', 'WAVE_TYPE', 'STATUS', 'CREA_DATE', 'CREA_TIME', 'ITEMS_COUNT'],
      });
      result.waveHeaders = data.rows;
    } catch (err) {
      this._trackCoverage('/SCWM/WAVEHDR', 'skipped', { reason: err.message });
      result.waveHeaders = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/ewm-data.json');
    this._trackCoverage('/SCWM/AQUA', 'extracted', { rowCount: mockData.quants.length });
    this._trackCoverage('/SCWM/HUITM', 'extracted', { rowCount: mockData.huItems.length });
    this._trackCoverage('/SCWM/T300', 'extracted', { rowCount: mockData.warehouseConfig.length });
    this._trackCoverage('/SCWM/TRSEG', 'extracted', { rowCount: mockData.warehouseTasks.length });
    this._trackCoverage('/SCWM/WAVEHDR', 'extracted', { rowCount: mockData.waveHeaders.length });
    return mockData;
  }
}

EWMExtractor._extractorId = 'EWM_EXTRACTOR';
EWMExtractor._module = 'EWM';
EWMExtractor._category = 'config';
ExtractorRegistry.register(EWMExtractor);

module.exports = EWMExtractor;
