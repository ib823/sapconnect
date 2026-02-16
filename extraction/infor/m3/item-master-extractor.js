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
 * Infor M3 Item Master Extractor
 *
 * Extracts items: MITMAS (item master), MITFAC (item/facility),
 * MITBAL (item/warehouse balance), MITVEN (item/vendor).
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3ItemMasterExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_ITEM_MASTER'; }
  get name() { return 'Infor M3 Item Master'; }
  get module() { return 'M3_MM'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'MITMAS', description: 'Item master', critical: true },
      { table: 'MITFAC', description: 'Item/facility', critical: true },
      { table: 'MITBAL', description: 'Item/warehouse balance', critical: false },
      { table: 'MITVEN', description: 'Item/vendor', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('MITMAS', {
        fields: ['MMITNO', 'MMITDS', 'MMUNMS', 'MMITTY', 'MMITGR', 'MMSTAT', 'MMNEWE', 'MMGRWE', 'MMCONO', 'MMRESP', 'MMMABU'],
      });
      result.items = data.rows;
    } catch (err) {
      this.logger.warn(`MITMAS read failed: ${err.message}`);
      result.items = [];
    }

    try {
      const data = await this._readTable('MITFAC', {
        fields: ['M9ITNO', 'M9FACI', 'M9CONO', 'M9WHLO', 'M9ORTY', 'M9PLCD', 'M9LEDT', 'M9SSQT', 'M9EOQT'],
      });
      result.itemFacility = data.rows;
    } catch (err) {
      this.logger.warn(`MITFAC read failed: ${err.message}`);
      result.itemFacility = [];
    }

    try {
      const data = await this._readTable('MITBAL', {
        fields: ['MBITNO', 'MBWHLO', 'MBCONO', 'MBSTQT', 'MBALQT', 'MBUNIT'],
      });
      result.itemWarehouseBalance = data.rows;
    } catch (err) {
      this.logger.warn(`MITBAL read failed: ${err.message}`);
      result.itemWarehouseBalance = [];
    }

    try {
      const data = await this._readTable('MITVEN', {
        fields: ['IEITNO', 'IESUNO', 'IECONO', 'IESUNM', 'IELEAD', 'IEPUPR', 'IECUCD', 'IESTAT'],
      });
      result.itemVendor = data.rows;
    } catch (err) {
      this.logger.warn(`MITVEN read failed: ${err.message}`);
      result.itemVendor = [];
    }

    result.summary = {
      totalItems: result.items.length,
      itemFacilityRecords: result.itemFacility.length,
      itemWarehouseBalances: (result.itemWarehouseBalance || []).length,
      itemVendorRecords: (result.itemVendor || []).length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/item-master.json');
    this._trackCoverage('MITMAS', 'extracted', { rowCount: (mockData.items || []).length });
    this._trackCoverage('MITFAC', 'extracted', { rowCount: (mockData.itemFacility || []).length });
    this._trackCoverage('MITBAL', 'extracted', { rowCount: (mockData.itemWarehouseBalance || []).length });
    this._trackCoverage('MITVEN', 'extracted', { rowCount: (mockData.itemVendor || []).length });
    return mockData;
  }
}

InforM3ItemMasterExtractor._extractorId = 'INFOR_M3_ITEM_MASTER';
InforM3ItemMasterExtractor._module = 'M3_MM';
InforM3ItemMasterExtractor._category = 'master-data';
InforM3ItemMasterExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3ItemMasterExtractor);

module.exports = InforM3ItemMasterExtractor;
