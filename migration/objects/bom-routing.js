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
 * BOM / Routing Migration Object (PLM)
 *
 * Migrates Bill of Materials (STKO/STPO) and Routings (PLKO/PLPO)
 * for S/4HANA with 40-character material number support.
 *
 * ~45 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class BomRoutingMigrationObject extends BaseMigrationObject {
  get objectId() { return 'BOM_ROUTING'; }
  get name() { return 'BOM and Routing'; }

  getFieldMappings() {
    return [
      // Record type indicator
      { source: 'RECORD_TYPE', target: 'RecordType' },
      // BOM Header (STKO)
      { source: 'STLNR', target: 'BOMNumber' },
      { source: 'STLAL', target: 'BOMAlternative' },
      { source: 'STLAN', target: 'BOMUsage' },
      { source: 'MATNR', target: 'Material', convert: 'padLeft40' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'DAESSION_TU', target: 'BOMValidFrom', convert: 'toDate' },
      { source: 'STKTX', target: 'BOMDescription' },
      { source: 'BMENG', target: 'BaseQuantity', convert: 'toDecimal' },
      { source: 'BMEIN', target: 'BaseUnit' },
      { source: 'STLST', target: 'BOMStatus' },
      // BOM Item (STPO)
      { source: 'POSNR', target: 'ItemNumber' },
      { source: 'POSTP', target: 'ItemCategory' },
      { source: 'IDNRK', target: 'ComponentMaterial', convert: 'padLeft40' },
      { source: 'MENGE', target: 'ComponentQuantity', convert: 'toDecimal' },
      { source: 'MEINS', target: 'ComponentUnit' },
      { source: 'SORTF', target: 'SortString' },
      { source: 'ALPGR', target: 'AlternativeItemGroup' },
      { source: 'ALPRF', target: 'AlternativeItemPriority', convert: 'toInteger' },
      { source: 'SCHGT', target: 'BulkMaterial', convert: 'boolYN' },
      { source: 'ERSKZ', target: 'SparePartIndicator', convert: 'boolYN' },
      // Routing Header (PLKO)
      { source: 'PLNTY', target: 'RoutingType' },
      { source: 'PLNNR', target: 'RoutingGroup' },
      { source: 'PLNAL', target: 'RoutingGroupCounter' },
      { source: 'KTEXT', target: 'RoutingDescription' },
      { source: 'VERWE', target: 'RoutingUsage' },
      { source: 'STATU', target: 'RoutingStatus' },
      { source: 'LOESSION_SZ', target: 'LotSizeFrom', convert: 'toDecimal' },
      { source: 'LOSESSION_ZB', target: 'LotSizeTo', convert: 'toDecimal' },
      // Routing Operation (PLPO)
      { source: 'VESSION_ORNR', target: 'OperationNumber' },
      { source: 'LTXA1', target: 'OperationDescription' },
      { source: 'ARBPL', target: 'WorkCenter' },
      { source: 'STEUS', target: 'ControlKey' },
      { source: 'VGW01', target: 'SetupTime', convert: 'toDecimal' },
      { source: 'VGW02', target: 'MachineTime', convert: 'toDecimal' },
      { source: 'VGW03', target: 'LaborTime', convert: 'toDecimal' },
      { source: 'VGE01', target: 'SetupTimeUnit' },
      { source: 'VGE02', target: 'MachineTimeUnit' },
      { source: 'VGE03', target: 'LaborTimeUnit' },
      { source: 'BMSCH', target: 'OperationBaseQuantity', convert: 'toDecimal' },
      // Component assignment
      { source: 'OBJTY', target: 'ObjectType' },
      { source: 'ZUESSION_ORD', target: 'AssignedComponent', convert: 'padLeft40' },
      // Engineering change
      { source: 'AESSION_ENNR', target: 'ChangeNumber' },
      // Metadata
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'BOM_ROUTING' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['Material', 'Plant', 'RecordType'],
      exactDuplicate: { keys: ['Material', 'Plant', 'RecordType', 'ItemNumber', 'OperationNumber'] },
    };
  }

  _extractMock() {
    const records = [];
    const materials = [
      { mat: 'FERT001', desc: 'Finished Product A', plant: '1000' },
      { mat: 'FERT002', desc: 'Finished Product B', plant: '1000' },
      { mat: 'FERT003', desc: 'Finished Product C', plant: '2000' },
      { mat: 'HALB001', desc: 'Semi-Finished D', plant: '1000' },
      { mat: 'HALB002', desc: 'Semi-Finished E', plant: '2000' },
    ];

    const components = ['ROH001', 'ROH002', 'ROH003', 'ROH004', 'ROH005', 'HALB001', 'HALB002'];
    const workCenters = ['WC-ASSY', 'WC-MACH', 'WC-PACK', 'WC-QUAL', 'WC-WELD'];

    for (const m of materials) {
      // BOM items (4-6 per material)
      const compCount = 4 + (materials.indexOf(m) % 3);
      for (let i = 1; i <= compCount; i++) {
        records.push({
          RECORD_TYPE: 'BOM_ITEM',
          STLNR: `BOM_${m.mat}`, STLAL: '01', STLAN: '1',
          MATNR: m.mat, WERKS: m.plant,
          DAESSION_TU: '20200101', STKTX: `BOM for ${m.desc}`,
          BMENG: '1', BMEIN: 'EA', STLST: '01',
          POSNR: String(i * 10).padStart(4, '0'),
          POSTP: i <= compCount - 1 ? 'L' : 'N',
          IDNRK: components[(i - 1) % components.length],
          MENGE: String(i <= 2 ? 2 : 1), MEINS: 'EA',
          SORTF: String(i).padStart(4, '0'),
          ALPGR: '', ALPRF: '', SCHGT: '', ERSKZ: '',
          PLNTY: '', PLNNR: '', PLNAL: '', KTEXT: '',
          VERWE: '', STATU: '',
          LOESSION_SZ: '', LOSESSION_ZB: '',
          VESSION_ORNR: '', LTXA1: '', ARBPL: '', STEUS: '',
          VGW01: '', VGW02: '', VGW03: '',
          VGE01: '', VGE02: '', VGE03: '',
          BMSCH: '',
          OBJTY: '', ZUESSION_ORD: '',
          AESSION_ENNR: i === 1 ? 'ECN-001' : '',
        });
      }

      // Routing operations (3-4 per material)
      const opCount = 3 + (materials.indexOf(m) % 2);
      for (let o = 1; o <= opCount; o++) {
        const wc = workCenters[(o - 1) % workCenters.length];
        records.push({
          RECORD_TYPE: 'ROUTING_OP',
          STLNR: '', STLAL: '', STLAN: '',
          MATNR: m.mat, WERKS: m.plant,
          DAESSION_TU: '', STKTX: '',
          BMENG: '', BMEIN: '', STLST: '',
          POSNR: '', POSTP: '', IDNRK: '',
          MENGE: '', MEINS: '',
          SORTF: '', ALPGR: '', ALPRF: '', SCHGT: '', ERSKZ: '',
          PLNTY: 'N', PLNNR: `RTG_${m.mat}`, PLNAL: '01',
          KTEXT: `Routing for ${m.desc}`,
          VERWE: '1', STATU: '04',
          LOESSION_SZ: '1', LOSESSION_ZB: '99999',
          VESSION_ORNR: String(o * 10).padStart(4, '0'),
          LTXA1: `${wc} Operation`,
          ARBPL: wc, STEUS: 'PP01',
          VGW01: String(5 + o), VGW02: String(10 + o * 5),
          VGW03: String(8 + o * 3),
          VGE01: 'MIN', VGE02: 'MIN', VGE03: 'MIN',
          BMSCH: '1',
          OBJTY: 'M', ZUESSION_ORD: o <= 2 ? components[o - 1] : '',
          AESSION_ENNR: '',
        });
      }
    }

    return records; // 5 materials × (avg 5 BOM items + avg 3.5 ops) ≈ ~42 records
  }
}

module.exports = BomRoutingMigrationObject;
