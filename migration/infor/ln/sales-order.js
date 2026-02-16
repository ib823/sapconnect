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
 * Infor LN Sales Order Migration Object
 *
 * Migrates LN Sales Orders (tdsls400/tdsls401) to SAP Sales Order
 * (VBAK/VBAP/VBEP).
 *
 * Key transforms:
 * - Order number (orno) maps to VBAK-VBELN
 * - Order type mapped via value map to VBAK-AUART
 * - Line items from tdsls401 map to VBAP/VBEP
 *
 * ~18 field mappings. Mock: 10 sales orders with 25 line items.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforLNSalesOrderMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_LN_SALES_ORDER'; }
  get name() { return 'LN Sales Order to SAP Sales Order'; }

  getFieldMappings() {
    return [
      // ── Header fields (VBAK) ──────────────────────────────────
      { source: 'orno', target: 'VBAK-VBELN', convert: 'padLeft10' },
      { source: 'sotp', target: 'VBAK-AUART', valueMap: {
        'NOR': 'TA', 'RET': 'RE', 'RUS': 'SO', 'FRE': 'FD',
      }, default: 'TA' },
      { source: 'ofbp', target: 'VBAK-KUNNR', convert: 'padLeft10' },
      { source: 'cofc', target: 'VBAK-VKORG' },
      { source: 'cdis', target: 'VBAK-VTWEG', default: '10' },
      { source: 'odat', target: 'VBAK-AUDAT', convert: 'toDate' },
      { source: 'curr', target: 'VBAK-WAERK' },
      { source: 'refn', target: 'VBAK-BSTNK' },

      // ── Item fields (VBAP) ────────────────────────────────────
      { source: 'pono', target: 'VBAP-POSNR', convert: 'padLeft6' },
      { source: 'item', target: 'VBAP-MATNR', convert: 'toUpperCase' },
      { source: 'qoor', target: 'VBAP-KWMENG', convert: 'toDecimal' },
      { source: 'cuni', target: 'VBAP-VRKME' },
      { source: 'pric', target: 'VBAP-NETPR', convert: 'toDecimal' },
      { source: 'dldt', target: 'VBEP-EDATU', convert: 'toDate' },
      { source: 'cwar', target: 'VBAP-WERKS' },
      { source: 'lwar', target: 'VBAP-LGORT', default: '0001' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_LN' },
      { target: 'MigrationObjectId', default: 'INFOR_LN_SALES_ORDER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['VBAK-VBELN', 'VBAK-KUNNR', 'VBAP-MATNR', 'VBAP-KWMENG'],
      exactDuplicate: { keys: ['VBAK-VBELN', 'VBAP-POSNR'] },
    };
  }

  _extractMock() {
    const records = [];
    const types = ['NOR', 'NOR', 'NOR', 'RET', 'NOR', 'RUS', 'NOR', 'NOR', 'FRE', 'NOR'];
    const customers = ['100001', '100002', '100003', '100004', '100005', '100001', '100002', '100006', '100003', '100004'];

    for (let h = 0; h < 10; h++) {
      const lineCount = h < 3 ? 3 : 2;
      for (let l = 0; l < lineCount; l++) {
        records.push({
          orno: `SO-${String(h + 1).padStart(5, '0')}`,
          sotp: types[h],
          ofbp: customers[h],
          cofc: '1000',
          cdis: '10',
          odat: `2024${String((h % 12) + 1).padStart(2, '0')}15`,
          curr: 'USD',
          refn: `PO-CUST-${String(h + 1).padStart(4, '0')}`,
          pono: String((l + 1) * 10),
          item: `FG-${String(30001 + l).padStart(5, '0')}`,
          qoor: String(Math.floor(Math.random() * 100 + 5)),
          cuni: 'ea',
          pric: (Math.random() * 500 + 50).toFixed(2),
          dldt: `2024${String((h % 12) + 2 > 12 ? 12 : (h % 12) + 2).padStart(2, '0')}01`,
          cwar: '1000',
          lwar: '0001',
        });
      }
    }

    return records; // 10 orders, 25 line items
  }
}

module.exports = InforLNSalesOrderMigrationObject;
