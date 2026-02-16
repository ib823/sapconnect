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
 * Warehouse Structure Migration Object
 *
 * Migrates legacy WM warehouse/storage data (T300/LAGP/LQUA)
 * to embedded EWM structure (/SCWM/T300, /SCWM/LAGP).
 *
 * ~40 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class WarehouseStructureMigrationObject extends BaseMigrationObject {
  get objectId() { return 'WAREHOUSE_STRUCTURE'; }
  get name() { return 'Warehouse Structure'; }

  getFieldMappings() {
    return [
      // Warehouse master
      { source: 'LGNUM', target: 'WarehouseNumber' },
      { source: 'LNUMK', target: 'WarehouseDescription' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'LGORT', target: 'StorageLocation' },
      { source: 'LGTYP', target: 'StorageType' },
      { source: 'LTYPT', target: 'StorageTypeDescription' },
      { source: 'LGPLA', target: 'StorageBin' },
      { source: 'LGBER', target: 'StorageSection' },
      { source: 'KOBER', target: 'PickingArea' },
      { source: 'LGVER', target: 'StorageUnitType' },
      // Bin attributes
      { source: 'SKESSION_ZAL', target: 'MaximumWeight' },
      { source: 'GEESSION_WI', target: 'CurrentWeight' },
      { source: 'MEESSION_INS', target: 'WeightUnit' },
      { source: 'VOLUM', target: 'MaximumVolume' },
      { source: 'VOLEH', target: 'VolumeUnit' },
      { source: 'ANZLE', target: 'MaxStorageUnits' },
      { source: 'NESSION_ZLE', target: 'CurrentStorageUnits' },
      { source: 'VERME', target: 'AvailableQuantity' },
      // Quant data (from LQUA)
      { source: 'LQNUM', target: 'QuantNumber' },
      { source: 'MATNR', target: 'Product', convert: 'padLeft40' },
      { source: 'WERKS_LQUA', target: 'QuantPlant' },
      { source: 'LGORT_LQUA', target: 'QuantStorageLocation' },
      { source: 'CHARG', target: 'Batch' },
      { source: 'BESTQ', target: 'StockCategory' },
      { source: 'SOBKZ', target: 'SpecialStockIndicator' },
      { source: 'GESME', target: 'TotalStockQuantity', convert: 'toDecimal' },
      { source: 'MEINS', target: 'BaseUnitOfMeasure' },
      { source: 'WDATU', target: 'GoodsReceiptDate', convert: 'toDate' },
      // Activity area
      { source: 'AESSION_KTF', target: 'ActivityArea' },
      { source: 'BLOCK_IND', target: 'BlockIndicator', convert: 'boolYN' },
      // EWM mapping targets
      { source: 'EWM_WH', target: 'EWMWarehouse' },
      { source: 'EWM_ST', target: 'EWMStorageType' },
      { source: 'EWM_BIN', target: 'EWMStorageBin' },
      // Migration metadata
      { source: 'RECORD_TYPE', target: 'RecordType' },
      { source: 'STATUS', target: 'MigrationStatus' },
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'WAREHOUSE_STRUCTURE' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['WarehouseNumber', 'StorageType', 'StorageBin'],
      exactDuplicate: { keys: ['WarehouseNumber', 'StorageType', 'StorageBin'] },
    };
  }

  _extractMock() {
    const records = [];
    const warehouses = ['WH01', 'WH02'];
    const storageTypes = ['001', '002', '003', '010', '020', '100'];
    const stDescriptions = {
      '001': 'High Rack', '002': 'Bulk Storage', '003': 'Fixed Bin',
      '010': 'Goods Receipt', '020': 'Goods Issue', '100': 'Interim Storage',
    };
    const plants = { 'WH01': '1000', 'WH02': '2000' };

    let binCounter = 0;
    for (const wh of warehouses) {
      for (const st of storageTypes) {
        const binsPerType = st <= '003' ? 5 : 2;
        for (let b = 1; b <= binsPerType; b++) {
          binCounter++;
          records.push({
            LGNUM: wh,
            LNUMK: `Warehouse ${wh}`,
            WERKS: plants[wh],
            LGORT: wh === 'WH01' ? '0001' : '0002',
            LGTYP: st,
            LTYPT: stDescriptions[st],
            LGPLA: `${st}-${String(b).padStart(3, '0')}`,
            LGBER: st <= '003' ? 'MAIN' : 'STAGING',
            KOBER: st <= '003' ? `PA${st}` : '',
            LGVER: st === '001' ? 'PALLET' : 'CARTON',
            SKESSION_ZAL: st === '001' ? '2000' : '500',
            GEESSION_WI: String(Math.floor(Math.random() * 400)),
            MEESSION_INS: 'KG',
            VOLUM: st === '001' ? '10' : '3',
            VOLEH: 'M3',
            ANZLE: st === '001' ? '4' : '1',
            NESSION_ZLE: String(Math.floor(Math.random() * 3)),
            VERME: String(Math.floor(Math.random() * 1000)),
            LQNUM: `Q${String(binCounter).padStart(6, '0')}`,
            MATNR: `MAT${String(((binCounter - 1) % 10) + 1).padStart(4, '0')}`,
            WERKS_LQUA: plants[wh],
            LGORT_LQUA: wh === 'WH01' ? '0001' : '0002',
            CHARG: binCounter % 3 === 0 ? `BATCH${String(binCounter).padStart(3, '0')}` : '',
            BESTQ: '',
            SOBKZ: '',
            GESME: String(Math.floor(Math.random() * 500 + 10)),
            MEINS: 'EA',
            WDATU: '20240115',
            AESSION_KTF: 'PICK',
            BLOCK_IND: '',
            EWM_WH: `/SCWM/${wh}`,
            EWM_ST: `/SCWM/${st}`,
            EWM_BIN: `/SCWM/${st}-${String(b).padStart(3, '0')}`,
            RECORD_TYPE: 'BIN_QUANT',
            STATUS: 'ACTIVE',
          });
        }
      }
    }

    return records; // 2 warehouses × (5×3 + 2×3) = 2 × 21 = 42
  }
}

module.exports = WarehouseStructureMigrationObject;
