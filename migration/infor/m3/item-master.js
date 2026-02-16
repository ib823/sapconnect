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
 * Infor M3 Item Master Migration Object
 *
 * Migrates Item Master from M3 (MITMAS/MITFAC/MITBAL/MITVEN)
 * to S/4HANA Material Master (MARA/MARC/MARD/EINA/EINE).
 *
 * M3 uses 6-char uppercase table names with 2-char field prefixes:
 *   MITMAS (MM) — general item data
 *   MITFAC (M9) — facility-level planning
 *   MITBAL (MB) — warehouse balances
 *   MITVEN (IF) — item/supplier links
 *
 * ~35 field mappings. MMITNO → MARA-MATNR via padLeft40.
 * Item type mapping: 1→ROH, 2→HALB, 3→FERT, 4→HAWA.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforM3ItemMasterMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_M3_ITEM_MASTER'; }
  get name() { return 'Infor M3 Item Master'; }

  getFieldMappings() {
    return [
      // ── MITMAS - General item data (MM prefix) — 15 ──────────
      { source: 'MMITNO', target: 'MARA-MATNR', convert: 'padLeft40' },
      { source: 'MMITDS', target: 'MAKT-MAKTX' },
      { source: 'MMFUDS', target: 'MAKT-MAKTX_EN' },
      { source: 'MMUNMS', target: 'MARA-MEINS' },
      { source: 'MMITTY', target: 'MARA-MTART', valueMap: { '1': 'ROH', '2': 'HALB', '3': 'FERT', '4': 'HAWA' } },
      { source: 'MMITGR', target: 'MARA-MATKL' },
      { source: 'MMITCL', target: 'MARA-MBRSH' },
      { source: 'MMGRWE', target: 'MARA-BRGEW', convert: 'toDecimal' },
      { source: 'MMNEWE', target: 'MARA-NTGEW', convert: 'toDecimal' },
      { source: 'MMUNWE', target: 'MARA-GEWEI' },
      { source: 'MMVOL3', target: 'MARA-VOLUM', convert: 'toDecimal' },
      { source: 'MMUNVO', target: 'MARA-VOLEH' },
      { source: 'MMPROD', target: 'MARA-EXTWG' },
      { source: 'MMSPE1', target: 'MARA-BISMT' },
      { source: 'MMSTAT', target: 'MARA-VPSTA', valueMap: { '20': 'ACTIVE', '50': 'BLOCKED', '90': 'DELETED' } },

      // ── MITMAS - Additional item attributes (MM) — 8 ─────────
      { source: 'MMHIE1', target: 'MARA-PRDHA' },
      { source: 'MMHIE2', target: 'MARA-PRODH_D2' },
      { source: 'MMHIE3', target: 'MARA-PRODH_D3' },
      { source: 'MMEAN1', target: 'MARA-EAN11' },
      { source: 'MMSHFL', target: 'MARA-MHDRZ', convert: 'toInteger' },
      { source: 'MMSAEL', target: 'MARA-MHDLP', convert: 'toInteger' },
      { source: 'MMRGDT', target: 'MARA-ERDAT', convert: 'toDate' },
      { source: 'MMDIVI', target: 'MARA-SPART' },

      // ── MITFAC - Facility planning data (M9 prefix) — 8 ──────
      { source: 'M9FACI', target: 'MARC-WERKS' },
      { source: 'M9ORQA', target: 'MARC-DISMM', valueMap: { '1': 'PD', '2': 'VB', '3': 'ND', '4': 'VV' } },
      { source: 'M9PLCD', target: 'MARC-DISPO' },
      { source: 'M9LOQT', target: 'MARC-DISLS', valueMap: { '1': 'EX', '2': 'FX', '3': 'WB' } },
      { source: 'M9SSQT', target: 'MARC-EISBE', convert: 'toDecimal' },
      { source: 'M9REOP', target: 'MARC-MINBE', convert: 'toDecimal' },
      { source: 'M9LEAT', target: 'MARC-PLIFZ', convert: 'toInteger' },
      { source: 'M9BUYE', target: 'MARC-EKGRP' },

      // ── MITBAL - Warehouse balance data (MB prefix) — 5 ──────
      { source: 'MBWHLO', target: 'MARD-LGORT' },
      { source: 'MBSTQT', target: 'MARD-LABST', convert: 'toDecimal' },
      { source: 'MBQUQT', target: 'MARD-INSME', convert: 'toDecimal' },
      { source: 'MBBLQT', target: 'MARD-SPEME', convert: 'toDecimal' },
      { source: 'MBALQT', target: 'MARD-UMLME', convert: 'toDecimal' },

      // ── MITVEN - Item/supplier link (IF prefix) — 5 ──────────
      { source: 'IFSUNO', target: 'EINA-LIFNR', convert: 'padLeft10' },
      { source: 'IFSITE', target: 'EINE-WERKS' },
      { source: 'IFPUPR', target: 'EINE-NETPR', convert: 'toDecimal' },
      { source: 'IFCUCD', target: 'EINE-WAERS' },
      { source: 'IFLEAD', target: 'EINE-APLFZ', convert: 'toInteger' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_M3' },
      { target: 'MigrationObjectId', default: 'INFOR_M3_ITEM_MASTER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['MARA-MATNR', 'MARA-MTART', 'MARA-MEINS', 'MAKT-MAKTX'],
      exactDuplicate: { keys: ['MARA-MATNR', 'MARC-WERKS', 'MARD-LGORT'] },
    };
  }

  _extractMock() {
    const records = [];
    const itemTypes = ['1', '2', '3', '4', '3'];
    const itemGroups = ['MI001', 'MI002', 'MI003', 'MI004', 'MI005'];
    const uoms = ['KG', 'EA', 'L', 'M', 'PC'];
    const facilities = ['F01', 'F02', 'F03'];
    const warehouses = ['WH01', 'WH02'];
    const suppliers = ['SUP001', 'SUP002', 'SUP003'];
    const planMethods = ['1', '2', '3', '4'];
    const lotMethods = ['1', '2', '3'];

    for (let i = 1; i <= 15; i++) {
      const itty = itemTypes[(i - 1) % 5];
      const faci = facilities[(i - 1) % 3];
      const whlo = warehouses[(i - 1) % 2];

      records.push({
        // MITMAS fields
        MMITNO: `M3ITM${String(i).padStart(4, '0')}`,
        MMITDS: `M3 Item ${i} - ${itty === '1' ? 'Raw Material' : itty === '2' ? 'Semi-Finished' : itty === '3' ? 'Finished Good' : 'Trading Good'}`,
        MMFUDS: `M3 Item ${i} English Description`,
        MMUNMS: uoms[(i - 1) % 5],
        MMITTY: itty,
        MMITGR: itemGroups[(i - 1) % 5],
        MMITCL: 'M',
        MMGRWE: (Math.random() * 50 + 0.5).toFixed(3),
        MMNEWE: (Math.random() * 40 + 0.3).toFixed(3),
        MMUNWE: 'KG',
        MMVOL3: (Math.random() * 20 + 0.1).toFixed(3),
        MMUNVO: 'L',
        MMPROD: `PG${String((i - 1) % 8 + 1).padStart(2, '0')}`,
        MMSPE1: i <= 3 ? `LEGACY-${i}` : '',
        MMSTAT: i === 15 ? '50' : '20',
        MMHIE1: `H1-${String((i - 1) % 4 + 1).padStart(2, '0')}`,
        MMHIE2: `H2-${String((i - 1) % 6 + 1).padStart(2, '0')}`,
        MMHIE3: '',
        MMEAN1: `789${String(i).padStart(10, '0')}`,
        MMSHFL: i % 3 === 0 ? 365 : 0,
        MMSAEL: i % 3 === 0 ? 180 : 0,
        MMRGDT: '20190315',
        MMDIVI: `D${(i - 1) % 3 + 1}`,

        // MITFAC fields
        M9FACI: faci,
        M9ORQA: planMethods[(i - 1) % 4],
        M9PLCD: `PL${String((i - 1) % 5 + 1).padStart(2, '0')}`,
        M9LOQT: lotMethods[(i - 1) % 3],
        M9SSQT: String(Math.floor(Math.random() * 100 + 10)),
        M9REOP: String(Math.floor(Math.random() * 200 + 50)),
        M9LEAT: String(Math.floor(Math.random() * 14 + 1)),
        M9BUYE: `BY${String((i - 1) % 4 + 1).padStart(2, '0')}`,

        // MITBAL fields
        MBWHLO: whlo,
        MBSTQT: String(Math.floor(Math.random() * 5000 + 100)),
        MBQUQT: i % 5 === 0 ? String(Math.floor(Math.random() * 50)) : '0',
        MBBLQT: i % 7 === 0 ? String(Math.floor(Math.random() * 20)) : '0',
        MBALQT: i % 4 === 0 ? String(Math.floor(Math.random() * 100)) : '0',

        // MITVEN fields
        IFSUNO: suppliers[(i - 1) % 3],
        IFSITE: faci,
        IFPUPR: (Math.random() * 500 + 5).toFixed(2),
        IFCUCD: i % 4 === 0 ? 'EUR' : 'USD',
        IFLEAD: String(Math.floor(Math.random() * 21 + 3)),
      });
    }

    return records; // 15 M3 item records
  }
}

module.exports = InforM3ItemMasterMigrationObject;
