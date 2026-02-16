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
 * PP Configuration Extractor
 *
 * Extracts Production Planning configuration: plant parameters,
 * MRP controllers, MRP profiles, order types, and production schedulers.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class PPConfigExtractor extends BaseExtractor {
  get extractorId() { return 'PP_CONFIG'; }
  get name() { return 'Production Planning Configuration'; }
  get module() { return 'PP'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'T399D', description: 'Plant parameters for MRP and production', critical: true },
      { table: 'T024D', description: 'MRP controllers', critical: true },
      { table: 'T438M', description: 'MRP profiles', critical: false },
      { table: 'T430', description: 'Production order types', critical: true },
      { table: 'T003O', description: 'Order type parameters', critical: false },
      { table: 'T024F', description: 'Production schedulers', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // Plant parameters
    try {
      const data = await this._readTable('T399D', {
        fields: ['WERKS', 'DISKZ', 'DTEFIXED', 'MRPPP1', 'MRPPP2', 'MRPPP3'],
      });
      result.plantParams = data.rows;
    } catch (err) {
      this.logger.warn(`T399D read failed: ${err.message}`);
      result.plantParams = [];
    }

    // MRP controllers
    try {
      const data = await this._readTable('T024D', {
        fields: ['WERKS', 'DTEFIXED', 'DSNAM'],
      });
      result.mrpControllers = data.rows;
    } catch (err) {
      this.logger.warn(`T024D read failed: ${err.message}`);
      result.mrpControllers = [];
    }

    // MRP profiles
    try {
      const data = await this._readTable('T438M', {
        fields: ['DPROFIL', 'DPROTEXT', 'DISMM', 'DISPO'],
      });
      result.mrpProfiles = data.rows;
    } catch (err) {
      this._trackCoverage('T438M', 'skipped', { reason: err.message });
      result.mrpProfiles = [];
    }

    // Order types
    try {
      const data = await this._readTable('T430', {
        fields: ['AUART', 'AUTEXT', 'AUTYP'],
      });
      result.orderTypes = data.rows;
    } catch (err) {
      this.logger.warn(`T430 read failed: ${err.message}`);
      result.orderTypes = [];
    }

    // Production schedulers
    try {
      const data = await this._readTable('T024F', {
        fields: ['WERKS', 'FEESSION', 'FEESSION_TXT'],
      });
      result.productionSchedulers = data.rows;
    } catch (err) {
      this._trackCoverage('T024F', 'skipped', { reason: err.message });
      result.productionSchedulers = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/pp-config.json');
    this._trackCoverage('T399D', 'extracted', { rowCount: mockData.plantParams.length });
    this._trackCoverage('T024D', 'extracted', { rowCount: mockData.mrpControllers.length });
    this._trackCoverage('T438M', 'extracted', { rowCount: mockData.mrpProfiles.length });
    this._trackCoverage('T430', 'extracted', { rowCount: mockData.orderTypes.length });
    this._trackCoverage('T024F', 'extracted', { rowCount: mockData.productionSchedulers.length });
    return mockData;
  }
}

PPConfigExtractor._extractorId = 'PP_CONFIG';
PPConfigExtractor._module = 'PP';
PPConfigExtractor._category = 'config';
ExtractorRegistry.register(PPConfigExtractor);

module.exports = PPConfigExtractor;
