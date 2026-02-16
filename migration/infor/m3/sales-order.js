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
 * Infor M3 Sales Order Migration Object
 *
 * Migrates M3 Sales Orders (OOHEAD/OOLINE)
 * to SAP Sales Order (VBAK/VBAP/VBEP).
 *
 * M3 OOHEAD uses OA prefix for order header:
 *   OAORNO — order number
 *   OACUNO — customer number
 *
 * ~18 field mappings. Mock: 10 orders with 22 line items.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforM3SalesOrderMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_M3_SALES_ORDER'; }
  get name() { return 'Infor M3 Sales Order'; }

  getFieldMappings() {
    return [
      // ── Header fields (VBAK) ────────────────────────────────
      { source: 'OAORNO', target: 'VBAK-VBELN', convert: 'padLeft10' },
      { source: 'OAORTP', target: 'VBAK-AUART', valueMap: {
        'CO1': 'TA', 'CO2': 'TAR', 'RO1': 'RE', 'DO1': 'FD',
      }, default: 'TA' },
      { source: 'OACUNO', target: 'VBAK-KUNNR', convert: 'padLeft10' },
      { source: 'OAFACI', target: 'VBAK-VKORG' },
      { source: 'OAORDT', target: 'VBAK-AUDAT', convert: 'toDate' },
      { source: 'OACUCD', target: 'VBAK-WAERK' },
      { source: 'OACUOR', target: 'VBAK-BSTNK' },
      { source: 'OADISY', target: 'VBAK-VTWEG', default: '10' },

      // ── Item fields (VBAP) ──────────────────────────────────
      { source: 'OBPONR', target: 'VBAP-POSNR', transform: (v) => v === null || v === undefined ? '' : String(v).padStart(6, '0') },
      { source: 'OBITNO', target: 'VBAP-MATNR', convert: 'toUpperCase' },
      { source: 'OBORQT', target: 'VBAP-KWMENG', convert: 'toDecimal' },
      { source: 'OBUNMS', target: 'VBAP-VRKME' },
      { source: 'OBSAPR', target: 'VBAP-NETPR', convert: 'toDecimal' },
      { source: 'OBDWDT', target: 'VBEP-EDATU', convert: 'toDate' },
      { source: 'OBWHLO', target: 'VBAP-WERKS' },
      { source: 'OBLGRT', target: 'VBAP-LGORT', default: '0001' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_M3' },
      { target: 'MigrationObjectId', default: 'INFOR_M3_SALES_ORDER' },
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
    const types = ['CO1', 'CO1', 'CO2', 'CO1', 'RO1', 'CO1', 'CO1', 'DO1', 'CO1', 'CO1'];
    const customers = ['M3C00001', 'M3C00002', 'M3C00003', 'M3C00004', 'M3C00005',
                       'M3C00001', 'M3C00006', 'M3C00002', 'M3C00007', 'M3C00003'];

    for (let h = 0; h < 10; h++) {
      const lineCount = h < 2 ? 3 : 2;
      for (let l = 0; l < lineCount; l++) {
        records.push({
          OAORNO: `M3SO${String(h + 1).padStart(6, '0')}`,
          OAORTP: types[h],
          OACUNO: customers[h],
          OAFACI: 'F01',
          OAORDT: `2024${String((h % 12) + 1).padStart(2, '0')}10`,
          OACUCD: h % 4 === 0 ? 'EUR' : 'USD',
          OACUOR: `CUPO-${String(h + 1).padStart(4, '0')}`,
          OADISY: '10',
          OBPONR: String((l + 1) * 10),
          OBITNO: `M3ITM${String(l + 1).padStart(4, '0')}`,
          OBORQT: String(Math.floor(Math.random() * 200 + 10)),
          OBUNMS: 'EA',
          OBSAPR: (Math.random() * 400 + 25).toFixed(2),
          OBDWDT: `2024${String(Math.min((h % 12) + 2, 12)).padStart(2, '0')}15`,
          OBWHLO: 'WH01',
          OBLGRT: '0001',
        });
      }
    }

    return records; // 10 orders, 22 line items
  }
}

module.exports = InforM3SalesOrderMigrationObject;
