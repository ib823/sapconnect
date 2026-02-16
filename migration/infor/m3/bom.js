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
 * Infor M3 Bill of Materials Migration Object
 *
 * Migrates M3 BOMs (MPDMAT)
 * to SAP BOM (STKO/STPO).
 *
 * M3 MPDMAT uses SC prefix for BOM fields:
 *   SCPRNO — parent item number
 *   SCMTNO — component item number
 *
 * ~14 field mappings. Mock: 6 BOMs with 18 components.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforM3BOMMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_M3_BOM'; }
  get name() { return 'Infor M3 BOM'; }

  getFieldMappings() {
    return [
      // ── Header fields (STKO) ────────────────────────────────
      { source: 'SCPRNO', target: 'STKO-MATNR', convert: 'toUpperCase' },
      { source: 'SCFACI', target: 'STKO-WERKS' },
      { source: 'SCSTRT', target: 'STKO-STLAL', default: '01' },
      { source: 'SCBAQT', target: 'STKO-BMENG', convert: 'toDecimal', default: '1' },
      { source: 'SCUNMS', target: 'STKO-BMEIN' },
      { source: 'SCFDAT', target: 'STKO-DATEFROM', convert: 'toDate' },

      // ── Component fields (STPO) ─────────────────────────────
      { source: 'SCMSEQ', target: 'STPO-POSNR', transform: (v) => v === null || v === undefined ? '' : String(v).padStart(4, '0') },
      { source: 'SCMTNO', target: 'STPO-IDNRK', convert: 'toUpperCase' },
      { source: 'SCCNQT', target: 'STPO-MENGE', convert: 'toDecimal' },
      { source: 'SCUNMT', target: 'STPO-MEINS' },
      { source: 'SCSCRA', target: 'STPO-AUSCH', convert: 'toDecimal' },
      { source: 'SCBYPE', target: 'STPO-POSTP', valueMap: {
        '1': 'L', '2': 'N', '3': 'T',
      }, default: 'L' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_M3' },
      { target: 'MigrationObjectId', default: 'INFOR_M3_BOM' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['STKO-MATNR', 'STKO-WERKS', 'STPO-IDNRK', 'STPO-MENGE'],
      exactDuplicate: { keys: ['STKO-MATNR', 'STKO-WERKS', 'STKO-STLAL', 'STPO-POSNR'] },
    };
  }

  _extractMock() {
    const records = [];
    const boms = [
      { parent: 'M3ITM0003', facility: 'F01', comps: ['M3ITM0001', 'M3ITM0002', 'M3ITM0004'] },
      { parent: 'M3ITM0005', facility: 'F01', comps: ['M3ITM0001', 'M3ITM0003', 'M3ITM0006'] },
      { parent: 'M3ITM0007', facility: 'F02', comps: ['M3ITM0002', 'M3ITM0004'] },
      { parent: 'M3ITM0008', facility: 'F01', comps: ['M3ITM0003', 'M3ITM0005', 'M3ITM0009'] },
      { parent: 'M3ITM0010', facility: 'F02', comps: ['M3ITM0001', 'M3ITM0006', 'M3ITM0011'] },
      { parent: 'M3ITM0012', facility: 'F03', comps: ['M3ITM0002', 'M3ITM0008', 'M3ITM0010'] },
    ];

    for (const b of boms) {
      for (let c = 0; c < b.comps.length; c++) {
        records.push({
          SCPRNO: b.parent,
          SCFACI: b.facility,
          SCSTRT: '01',
          SCBAQT: '1',
          SCUNMS: 'EA',
          SCFDAT: '20240101',
          SCMSEQ: String((c + 1) * 10),
          SCMTNO: b.comps[c],
          SCCNQT: (Math.random() * 8 + 1).toFixed(2),
          SCUNMT: 'EA',
          SCSCRA: c === 0 ? '3.0' : '0',
          SCBYPE: '1',
        });
      }
    }

    return records; // 6 BOMs, 18 components
  }
}

module.exports = InforM3BOMMigrationObject;
