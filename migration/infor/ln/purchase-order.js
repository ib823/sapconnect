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
 * Infor LN Purchase Order Migration Object
 *
 * Migrates LN Purchase Orders (tdpur400/tdpur401) to SAP Purchase Order
 * (EKKO/EKPO).
 *
 * Key transforms:
 * - Order number (orno) maps to EKKO-EBELN
 * - Vendor (otbp) maps to EKKO-LIFNR
 * - Line items from tdpur401 map to EKPO
 *
 * ~18 field mappings. Mock: 8 purchase orders with 20 line items.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforLNPurchaseOrderMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_LN_PURCHASE_ORDER'; }
  get name() { return 'LN Purchase Order to SAP Purchase Order'; }

  getFieldMappings() {
    return [
      // ── Header fields (EKKO) ──────────────────────────────────
      { source: 'orno', target: 'EKKO-EBELN', convert: 'padLeft10' },
      { source: 'potp', target: 'EKKO-BSART', valueMap: {
        'NOR': 'NB', 'STO': 'UB', 'SUB': 'LO', 'SRV': 'FO',
      }, default: 'NB' },
      { source: 'otbp', target: 'EKKO-LIFNR', convert: 'padLeft10' },
      { source: 'cofc', target: 'EKKO-BUKRS' },
      { source: 'odat', target: 'EKKO-BEDAT', convert: 'toDate' },
      { source: 'curr', target: 'EKKO-WAERS' },
      { source: 'ekgr', target: 'EKKO-EKGRP' },
      { source: 'ekorg', target: 'EKKO-EKORG' },

      // ── Item fields (EKPO) ────────────────────────────────────
      { source: 'pono', target: 'EKPO-EBELP', convert: 'padLeft5' },
      { source: 'item', target: 'EKPO-MATNR', convert: 'toUpperCase' },
      { source: 'qoor', target: 'EKPO-MENGE', convert: 'toDecimal' },
      { source: 'cuni', target: 'EKPO-MEINS' },
      { source: 'pric', target: 'EKPO-NETPR', convert: 'toDecimal' },
      { source: 'dldt', target: 'EKPO-EEIND', convert: 'toDate' },
      { source: 'cwar', target: 'EKPO-WERKS' },
      { source: 'lwar', target: 'EKPO-LGORT', default: '0001' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_LN' },
      { target: 'MigrationObjectId', default: 'INFOR_LN_PURCHASE_ORDER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['EKKO-EBELN', 'EKKO-LIFNR', 'EKPO-MATNR', 'EKPO-MENGE'],
      exactDuplicate: { keys: ['EKKO-EBELN', 'EKPO-EBELP'] },
    };
  }

  _extractMock() {
    const records = [];
    const types = ['NOR', 'NOR', 'STO', 'NOR', 'SUB', 'NOR', 'SRV', 'NOR'];
    const vendors = ['200001', '200002', '200003', '200004', '200001', '200002', '200003', '200004'];

    for (let h = 0; h < 8; h++) {
      const lineCount = h < 4 ? 3 : 2;
      for (let l = 0; l < lineCount; l++) {
        records.push({
          orno: `PO-${String(h + 1).padStart(5, '0')}`,
          potp: types[h],
          otbp: vendors[h],
          cofc: '1000',
          odat: `2024${String((h % 12) + 1).padStart(2, '0')}10`,
          curr: 'USD',
          ekgr: `E${String((h % 3) + 1).padStart(2, '0')}`,
          ekorg: '1000',
          pono: String((l + 1) * 10),
          item: `RM-${String(10001 + l).padStart(5, '0')}`,
          qoor: String(Math.floor(Math.random() * 1000 + 50)),
          cuni: 'kg',
          pric: (Math.random() * 100 + 1).toFixed(2),
          dldt: `2024${String((h % 12) + 2 > 12 ? 12 : (h % 12) + 2).padStart(2, '0')}15`,
          cwar: '1000',
          lwar: '0001',
        });
      }
    }

    return records; // 8 orders, 20 line items
  }
}

module.exports = InforLNPurchaseOrderMigrationObject;
