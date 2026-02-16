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
 * Infor LN Routing Migration Object
 *
 * Migrates LN Routings (tipcf010/tipcf011) to SAP Routing
 * (PLKO/PLPO).
 *
 * Key transforms:
 * - Routing group (rgrp) maps to PLKO-PLNTY
 * - Operation (oper) maps to PLPO-VORNR
 * - Work center (wctr) maps to PLPO-ARBPL
 *
 * ~16 field mappings. Mock: 6 routings with 20 operations.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforLNRoutingMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_LN_ROUTING'; }
  get name() { return 'LN Routing to SAP Routing'; }

  getFieldMappings() {
    return [
      // ── Header fields (PLKO) ──────────────────────────────────
      { source: 'mitm', target: 'PLKO-MATNR', convert: 'toUpperCase' },
      { source: 'rgrp', target: 'PLKO-PLNTY', default: 'N' },
      { source: 'cwar', target: 'PLKO-WERKS' },
      { source: 'rvar', target: 'PLKO-PLNAL', default: '01' },
      { source: 'efdt', target: 'PLKO-DATEFROM', convert: 'toDate' },
      { source: 'lotl', target: 'PLKO-LOSVN', convert: 'toDecimal', default: '1' },
      { source: 'lotu', target: 'PLKO-LOSBS', convert: 'toDecimal', default: '99999999' },

      // ── Operation fields (PLPO) ──────────────────────────────
      { source: 'oper', target: 'PLPO-VORNR', convert: 'padLeft4' },
      { source: 'wctr', target: 'PLPO-ARBPL' },
      { source: 'desc', target: 'PLPO-LTXA1' },
      { source: 'seti', target: 'PLPO-RUEST', convert: 'toDecimal' },
      { source: 'runt', target: 'PLPO-BEARZ', convert: 'toDecimal' },
      { source: 'tuni', target: 'PLPO-VGE01', default: 'MIN' },
      { source: 'bqty', target: 'PLPO-BMSCH', convert: 'toDecimal', default: '1' },
      { source: 'stky', target: 'PLPO-STEUS', default: 'PP01' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_LN' },
      { target: 'MigrationObjectId', default: 'INFOR_LN_ROUTING' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['PLKO-MATNR', 'PLKO-WERKS', 'PLPO-VORNR', 'PLPO-ARBPL'],
      exactDuplicate: { keys: ['PLKO-MATNR', 'PLKO-WERKS', 'PLKO-PLNAL', 'PLPO-VORNR'] },
    };
  }

  _extractMock() {
    const records = [];
    const routings = [
      { mitm: 'FG-30001', cwar: '1000', ops: 4 },
      { mitm: 'FG-30002', cwar: '1000', ops: 3 },
      { mitm: 'FG-30003', cwar: '2000', ops: 4 },
      { mitm: 'FG-30004', cwar: '1000', ops: 3 },
      { mitm: 'SF-20001', cwar: '1000', ops: 3 },
      { mitm: 'SF-20003', cwar: '2000', ops: 3 },
    ];

    const workCenters = ['WC-CUT', 'WC-WELD', 'WC-ASSM', 'WC-TEST', 'WC-PACK'];
    const opDescs = ['Cutting', 'Welding', 'Assembly', 'Testing', 'Packaging'];

    for (const r of routings) {
      for (let o = 0; o < r.ops; o++) {
        records.push({
          mitm: r.mitm,
          rgrp: 'N',
          cwar: r.cwar,
          rvar: '01',
          efdt: '20240101',
          lotl: '1',
          lotu: '99999999',
          oper: String((o + 1) * 10),
          wctr: workCenters[o % 5],
          desc: opDescs[o % 5],
          seti: (Math.random() * 30 + 5).toFixed(1),
          runt: (Math.random() * 60 + 10).toFixed(1),
          tuni: 'MIN',
          bqty: '1',
          stky: 'PP01',
        });
      }
    }

    return records; // 6 routings, 20 operations
  }
}

module.exports = InforLNRoutingMigrationObject;
