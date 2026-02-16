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
 * TM Extractor
 *
 * Extracts Transportation Management configuration including transport
 * orders, freight units, carriers, and freight rates.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class TMExtractor extends BaseExtractor {
  get extractorId() { return 'TM_EXTRACTOR'; }
  get name() { return 'Transportation Management'; }
  get module() { return 'TM'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: '/SCMTMS/TOR', description: 'Transportation orders', critical: true },
      { table: '/SCMTMS/FU', description: 'Freight units', critical: true },
      { table: '/SCMTMS/CARRIER', description: 'Carriers', critical: false },
      { table: '/SCMTMS/RATE', description: 'Freight rates', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // /SCMTMS/TOR - Transportation orders
    try {
      const data = await this._readTable('/SCMTMS/TOR', {
        fields: ['TOR_ID', 'TOR_TYPE', 'LIFECYCLE', 'SHIP_FROM', 'SHIP_TO', 'PLAN_TRANS_TIME', 'CARRIER_ID'],
      });
      result.transportOrders = data.rows;
    } catch (err) {
      this.logger.warn(`/SCMTMS/TOR read failed: ${err.message}`);
      result.transportOrders = [];
    }

    // /SCMTMS/FU - Freight units
    try {
      const data = await this._readTable('/SCMTMS/FU', {
        fields: ['FU_ID', 'FU_TYPE', 'TOR_ID', 'TOTAL_WEIGHT', 'WEIGHT_UOM', 'TOTAL_VOLUME', 'VOLUME_UOM'],
      });
      result.freightUnits = data.rows;
    } catch (err) {
      this.logger.warn(`/SCMTMS/FU read failed: ${err.message}`);
      result.freightUnits = [];
    }

    // /SCMTMS/CARRIER - Carriers
    try {
      const data = await this._readTable('/SCMTMS/CARRIER', {
        fields: ['CARRIER_ID', 'CARRIER_NAME', 'SCAC_CODE', 'MODE_OF_TRANSPORT', 'STATUS'],
      });
      result.carriers = data.rows;
    } catch (err) {
      this._trackCoverage('/SCMTMS/CARRIER', 'skipped', { reason: err.message });
      result.carriers = [];
    }

    // /SCMTMS/RATE - Freight rates
    try {
      const data = await this._readTable('/SCMTMS/RATE', {
        fields: ['RATE_ID', 'CARRIER_ID', 'LANE_ID', 'RATE_VALUE', 'CURRENCY', 'VALID_FROM', 'VALID_TO'],
      });
      result.freightRates = data.rows;
    } catch (err) {
      this._trackCoverage('/SCMTMS/RATE', 'skipped', { reason: err.message });
      result.freightRates = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/tm-data.json');
    this._trackCoverage('/SCMTMS/TOR', 'extracted', { rowCount: mockData.transportOrders.length });
    this._trackCoverage('/SCMTMS/FU', 'extracted', { rowCount: mockData.freightUnits.length });
    this._trackCoverage('/SCMTMS/CARRIER', 'extracted', { rowCount: mockData.carriers.length });
    this._trackCoverage('/SCMTMS/RATE', 'extracted', { rowCount: mockData.freightRates.length });
    return mockData;
  }
}

TMExtractor._extractorId = 'TM_EXTRACTOR';
TMExtractor._module = 'TM';
TMExtractor._category = 'config';
ExtractorRegistry.register(TMExtractor);

module.exports = TMExtractor;
