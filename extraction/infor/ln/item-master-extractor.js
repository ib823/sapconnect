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
 * Infor LN Item Master Extractor
 *
 * Extracts item master data from Infor LN including items (tcibd001),
 * item costs (tcibd002), text tables, and item groups (tcibd051).
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNItemMasterExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_ITEM_MASTER'; }
  get name() { return 'Infor LN Item Master'; }
  get module() { return 'LN_MM'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'tcibd001', description: 'Item general data', critical: true },
      { table: 'tcibd002', description: 'Item cost data', critical: true },
      { table: 'tcibd051', description: 'Item groups', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // tcibd001 - Item general data
    try {
      const data = await this._readTable('tcibd001', {
        fields: ['item', 'dsca', 'cuni', 'kitm', 'csig', 'stwi', 'wght'],
        maxRows: 50000,
      });
      result.items = data.rows;
    } catch (err) {
      this.logger.warn(`tcibd001 read failed: ${err.message}`);
      result.items = [];
    }

    // tcibd002 - Item cost data
    try {
      const data = await this._readTable('tcibd002', {
        fields: ['item', 't$ccur', 't$stco', 't$maco', 't$laco', 't$ovco'],
        maxRows: 50000,
      });
      result.itemCosts = data.rows;
    } catch (err) {
      this.logger.warn(`tcibd002 read failed: ${err.message}`);
      result.itemCosts = [];
    }

    // tcibd051 - Item groups
    try {
      const data = await this._readTable('tcibd051', {
        fields: ['csig', 'dsca', 't$mitm', 't$plng'],
      });
      result.itemGroups = data.rows;
    } catch (err) {
      this._trackCoverage('tcibd051', 'skipped', { reason: err.message });
      result.itemGroups = [];
    }

    // Compute summary
    result.summary = this._computeSummary(result);

    return result;
  }

  _computeSummary(result) {
    const items = result.items || [];
    const purchased = items.filter(i => i.kitm === 1).length;
    const manufactured = items.filter(i => i.kitm === 2).length;
    const generic = items.filter(i => i.kitm === 3).length;
    const cost = items.filter(i => i.kitm === 6).length;

    return {
      totalItems: items.length,
      purchasedItems: purchased,
      manufacturedItems: manufactured,
      genericItems: generic,
      costItems: cost,
      itemGroups: (result.itemGroups || []).length,
      extractedAt: new Date().toISOString(),
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/item-master.json');
    this._trackCoverage('tcibd001', 'extracted', { rowCount: mockData.items.length });
    this._trackCoverage('tcibd002', 'extracted', { rowCount: mockData.itemCosts.length });
    this._trackCoverage('tcibd051', 'extracted', { rowCount: mockData.itemGroups.length });
    return mockData;
  }
}

InforLNItemMasterExtractor._extractorId = 'INFOR_LN_ITEM_MASTER';
InforLNItemMasterExtractor._module = 'LN_MM';
InforLNItemMasterExtractor._category = 'master-data';
InforLNItemMasterExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNItemMasterExtractor);

module.exports = InforLNItemMasterExtractor;
