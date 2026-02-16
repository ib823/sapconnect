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
 * Infor M3 Production Order Migration Object
 *
 * Migrates M3 Manufacturing Orders (MWOHED/MWOMAT)
 * to SAP Production Order (AUFK/AFKO/AFPO).
 *
 * M3 MWOHED uses VH prefix for MO header:
 *   VHMFNO — manufacturing order number
 *   VHPRNO — product number
 *
 * ~18 field mappings. Mock: 10 production orders.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforM3ProductionOrderMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_M3_PRODUCTION_ORDER'; }
  get name() { return 'Infor M3 Production Order'; }

  getFieldMappings() {
    return [
      // ── Header fields (AUFK/AFKO) ──────────────────────────
      { source: 'VHMFNO', target: 'AUFK-AUFNR', transform: (v) => v === null || v === undefined ? '' : String(v).padStart(12, '0') },
      { source: 'VHPRNO', target: 'AFKO-MATNR', convert: 'toUpperCase' },
      { source: 'VHFACI', target: 'AFKO-WERKS' },
      { source: 'VHORQT', target: 'AFKO-GAMNG', convert: 'toDecimal' },
      { source: 'VHUNMS', target: 'AFKO-GMEIN' },
      { source: 'VHSTDT', target: 'AFKO-GSTRP', convert: 'toDate' },
      { source: 'VHFIDT', target: 'AFKO-GLTRP', convert: 'toDate' },
      { source: 'VHWHST', target: 'AUFK-STAT', valueMap: {
        '10': 'CRTD', '20': 'REL', '30': 'PCNF', '40': 'CNF', '50': 'DLV', '90': 'TECO',
      }, default: 'CRTD' },
      { source: 'VHPLGR', target: 'AFKO-PLGRP' },

      // ── Item fields (AFPO) ──────────────────────────────────
      { source: 'VHWHLO', target: 'AFPO-LGORT' },
      { source: 'VHDIVI', target: 'AUFK-BUKRS' },
      { source: 'VHPLNO', target: 'AFKO-PLNTY', default: 'N' },
      { source: 'VHSCHD', target: 'AUFK-TERKZ', valueMap: {
        'FW': '1', 'BW': '2',
      }, default: '1' },

      // ── Cost data ──────────────────────────────────────────
      { source: 'VHCOCE', target: 'AUFK-KOSTV', convert: 'padLeft10' },
      { source: 'VHPROJ', target: 'AUFK-PRCTR', convert: 'padLeft10' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_M3' },
      { target: 'MigrationObjectId', default: 'INFOR_M3_PRODUCTION_ORDER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['AUFK-AUFNR', 'AFKO-MATNR', 'AFKO-WERKS', 'AFKO-GAMNG'],
      exactDuplicate: { keys: ['AUFK-AUFNR'] },
    };
  }

  _extractMock() {
    const records = [];
    const products = ['M3ITM0003', 'M3ITM0005', 'M3ITM0008', 'M3ITM0010', 'M3ITM0012',
                      'M3ITM0003', 'M3ITM0005', 'M3ITM0008', 'M3ITM0010', 'M3ITM0012'];
    const statuses = ['20', '20', '30', '40', '50', '10', '20', '90', '20', '10'];
    const facilities = ['F01', 'F01', 'F02', 'F01', 'F03', 'F01', 'F02', 'F01', 'F03', 'F02'];

    for (let i = 0; i < 10; i++) {
      const month = String((i % 12) + 1).padStart(2, '0');
      const endMonth = String(Math.min((i % 12) + 2, 12)).padStart(2, '0');
      records.push({
        VHMFNO: `M3MO${String(i + 1).padStart(6, '0')}`,
        VHPRNO: products[i],
        VHFACI: facilities[i],
        VHORQT: String(Math.floor(Math.random() * 500 + 50)),
        VHUNMS: 'EA',
        VHSTDT: `2024${month}01`,
        VHFIDT: `2024${endMonth}15`,
        VHWHST: statuses[i],
        VHPLGR: `PG${String((i % 4) + 1).padStart(2, '0')}`,
        VHWHLO: 'WH01',
        VHDIVI: 'D1',
        VHPLNO: 'N',
        VHSCHD: i % 2 === 0 ? 'FW' : 'BW',
        VHCOCE: `CC${String((i % 5) + 1).padStart(2, '0')}`,
        VHPROJ: `PC${String((i % 3) + 1).padStart(2, '0')}`,
      });
    }

    return records; // 10 production orders
  }
}

module.exports = InforM3ProductionOrderMigrationObject;
