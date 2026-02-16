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
 * WM Extractor
 *
 * Extracts Warehouse Management data: warehouse numbers, storage types,
 * storage sections, storage bins, quants, transfer orders,
 * put-away strategies, and stock removal strategies.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class WMExtractor extends BaseExtractor {
  get extractorId() { return 'WM_EXTRACTOR'; }
  get name() { return 'Warehouse Management'; }
  get module() { return 'WM'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'T300', description: 'Warehouse numbers', critical: true },
      { table: 'T300T', description: 'Warehouse number texts', critical: false },
      { table: 'T301', description: 'Storage types', critical: true },
      { table: 'T310', description: 'Storage sections', critical: false },
      { table: 'T310T', description: 'Storage section texts', critical: false },
      { table: 'T311', description: 'Storage bins', critical: false },
      { table: 'LQUA', description: 'Quants (warehouse stock)', critical: true },
      { table: 'LTBK', description: 'Transfer order header', critical: true },
      { table: 'LTBP', description: 'Transfer order item', critical: true },
      { table: 'T334P', description: 'Put-away strategies', critical: false },
      { table: 'T334G', description: 'Stock removal strategies', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // Warehouse numbers
    try {
      const t300 = await this._readTable('T300', {
        fields: ['LGNUM', 'WERKS', 'LGORT', 'KESSION'],
      });
      const t300t = await this._readTable('T300T', {
        fields: ['LGNUM', 'SPRAS', 'LNUMT'],
      });
      result.warehouseNumbers = t300.rows.map(w => {
        const text = t300t.rows.find(t => t.LGNUM === w.LGNUM && t.SPRAS === 'E');
        return { ...w, LNUMT: text ? text.LNUMT : '' };
      });
    } catch (err) {
      this.logger.warn(`T300/T300T read failed: ${err.message}`);
      result.warehouseNumbers = [];
    }

    // Storage types
    try {
      const data = await this._readTable('T301', {
        fields: ['LGNUM', 'LGTYP', 'LTYPT', 'PLESSION'],
      });
      result.storageTypes = data.rows;
    } catch (err) {
      this.logger.warn(`T301 read failed: ${err.message}`);
      result.storageTypes = [];
    }

    // Storage sections
    try {
      const data = await this._readTable('T310', {
        fields: ['LGNUM', 'LGTYP', 'LGBER', 'LESSION'],
      });
      result.storageSections = data.rows;
    } catch (err) {
      this._trackCoverage('T310', 'skipped', { reason: err.message });
      result.storageSections = [];
    }

    // Storage bins
    try {
      const data = await this._readTable('T311', {
        fields: ['LGNUM', 'LGTYP', 'LGPLA', 'LGBER', 'KESSION'],
        maxRows: 20000,
      });
      result.storageBins = data.rows;
    } catch (err) {
      this._trackCoverage('T311', 'skipped', { reason: err.message });
      result.storageBins = [];
    }

    // Quants
    try {
      const data = await this._readTable('LQUA', {
        fields: ['LGNUM', 'LQNUM', 'MATNR', 'WERKS', 'LGTYP', 'LGPLA', 'GESME', 'MEINS'],
        maxRows: 20000,
      });
      result.quants = data.rows;
    } catch (err) {
      this.logger.warn(`LQUA read failed: ${err.message}`);
      result.quants = [];
    }

    // Transfer orders
    try {
      const ltbk = await this._readTable('LTBK', {
        fields: ['LGNUM', 'TESSION', 'BESSION', 'BDATU', 'ERDAT', 'ERNAM'],
        maxRows: 10000,
      });
      const ltbp = await this._readTable('LTBP', {
        fields: ['LGNUM', 'TESSION', 'TAESSION', 'MATNR', 'ANFME', 'MEINS', 'VLTYP', 'VLPLA', 'NLTYP', 'NLPLA'],
        maxRows: 20000,
      });
      result.transferOrders = ltbk.rows.map(h => ({
        ...h,
        items: ltbp.rows.filter(i => i.LGNUM === h.LGNUM && i.TESSION === h.TESSION),
      }));
    } catch (err) {
      this.logger.warn(`LTBK/LTBP read failed: ${err.message}`);
      result.transferOrders = [];
    }

    // Put-away strategies
    try {
      const data = await this._readTable('T334P', {
        fields: ['LGNUM', 'LGTYP', 'PLESSION', 'PLTXT'],
      });
      result.putAwayStrategies = data.rows;
    } catch (err) {
      this._trackCoverage('T334P', 'skipped', { reason: err.message });
      result.putAwayStrategies = [];
    }

    // Stock removal strategies
    try {
      const data = await this._readTable('T334G', {
        fields: ['LGNUM', 'LGTYP', 'SLESSION', 'SLTXT'],
      });
      result.stockRemovalStrategies = data.rows;
    } catch (err) {
      this._trackCoverage('T334G', 'skipped', { reason: err.message });
      result.stockRemovalStrategies = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/wm-extractor.json');
    this._trackCoverage('T300', 'extracted', { rowCount: mockData.warehouseNumbers.length });
    this._trackCoverage('T300T', 'extracted', { rowCount: mockData.warehouseNumbers.length });
    this._trackCoverage('T301', 'extracted', { rowCount: mockData.storageTypes.length });
    this._trackCoverage('T310', 'extracted', { rowCount: mockData.storageSections.length });
    this._trackCoverage('T311', 'extracted', { rowCount: mockData.storageBins.length });
    this._trackCoverage('LQUA', 'extracted', { rowCount: mockData.quants.length });
    this._trackCoverage('LTBK', 'extracted', { rowCount: mockData.transferOrders.length });
    this._trackCoverage('T334P', 'extracted', { rowCount: mockData.putAwayStrategies.length });
    this._trackCoverage('T334G', 'extracted', { rowCount: mockData.stockRemovalStrategies.length });
    return mockData;
  }
}

WMExtractor._extractorId = 'WM_EXTRACTOR';
WMExtractor._module = 'WM';
WMExtractor._category = 'config';
ExtractorRegistry.register(WMExtractor);

module.exports = WMExtractor;
