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
 * Infor LN Warehouse Extractor
 *
 * Extracts warehouse data from Infor LN including warehouses (whwmd200),
 * locations (whwmd210), lots (whwmd400), and inventory balances.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNWarehouseExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_WAREHOUSE'; }
  get name() { return 'Infor LN Warehouse'; }
  get module() { return 'LN_WM'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'whwmd200', description: 'Warehouses', critical: true },
      { table: 'whwmd210', description: 'Warehouse locations', critical: true },
      { table: 'whwmd400', description: 'Lot data', critical: false },
      { table: 'whinh110', description: 'Inventory balances', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    // whwmd200 - Warehouses
    try {
      const data = await this._readTable('whwmd200', {
        fields: ['t$whno', 't$desc', 't$lgnb', 't$type', 't$addr', 't$actv', 't$mgtm'],
      });
      result.warehouses = data.rows;
    } catch (err) {
      this.logger.warn(`whwmd200 read failed: ${err.message}`);
      result.warehouses = [];
    }

    // whwmd210 - Warehouse locations
    try {
      const data = await this._readTable('whwmd210', {
        fields: ['t$whno', 't$locn', 't$desc', 't$zone', 't$type', 't$maxw', 't$actv'],
        maxRows: 100000,
      });
      result.locations = data.rows;
    } catch (err) {
      this.logger.warn(`whwmd210 read failed: ${err.message}`);
      result.locations = [];
    }

    // whwmd400 - Lot data
    try {
      const data = await this._readTable('whwmd400', {
        fields: ['t$ltnm', 'item', 't$whno', 't$qnty', 't$cuni', 't$rcdt', 't$exdt', 't$stat', 't$cert'],
        maxRows: 100000,
      });
      result.lots = data.rows;
    } catch (err) {
      this._trackCoverage('whwmd400', 'skipped', { reason: err.message });
      result.lots = [];
    }

    // whinh110 - Inventory balances
    try {
      const data = await this._readTable('whinh110', {
        fields: ['item', 't$whno', 't$locn', 't$qnoh', 't$qnal', 't$qnrs', 't$cuni', 't$lstc'],
        maxRows: 500000,
      });
      result.inventory = data.rows;
    } catch (err) {
      this.logger.warn(`whinh110 read failed: ${err.message}`);
      result.inventory = [];
    }

    // Compute summary
    result.summary = this._computeSummary(result);

    return result;
  }

  _computeSummary(result) {
    const warehouses = result.warehouses || [];
    const types = [...new Set(warehouses.map(w => w.t$type))];

    return {
      totalWarehouses: warehouses.length,
      totalLocations: (result.locations || []).length,
      totalLots: (result.lots || []).length,
      totalInventoryRecords: (result.inventory || []).length,
      warehouseTypes: types,
      extractedAt: new Date().toISOString(),
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/warehouse.json');
    this._trackCoverage('whwmd200', 'extracted', { rowCount: mockData.warehouses.length });
    this._trackCoverage('whwmd210', 'extracted', { rowCount: mockData.locations.length });
    this._trackCoverage('whwmd400', 'extracted', { rowCount: mockData.lots.length });
    this._trackCoverage('whinh110', 'extracted', { rowCount: mockData.inventory.length });
    return mockData;
  }
}

InforLNWarehouseExtractor._extractorId = 'INFOR_LN_WAREHOUSE';
InforLNWarehouseExtractor._module = 'LN_WM';
InforLNWarehouseExtractor._category = 'master-data';
InforLNWarehouseExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNWarehouseExtractor);

module.exports = InforLNWarehouseExtractor;
