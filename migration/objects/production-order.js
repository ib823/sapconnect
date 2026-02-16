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
 * Production Order Migration Object
 *
 * Migrates PP Production Orders from ECC (AUFK/AFKO)
 * to S/4HANA via API_PRODUCTION_ORDER.
 *
 * ~45 field mappings covering order header, scheduling, BOM/routing,
 * quantity, and cost assignment fields.
 * Material types: FERT (finished goods), HALB (semifinished products).
 */

const BaseMigrationObject = require('./base-migration-object');

class ProductionOrderMigrationObject extends BaseMigrationObject {
  get objectId() { return 'PRODUCTION_ORDER'; }
  get name() { return 'Production Order'; }

  getFieldMappings() {
    return [
      // ── Order header fields (AUFK) — 15 ─────────────────────
      { source: 'AUFNR', target: 'OrderNumber' },
      { source: 'AUART', target: 'OrderType' },
      { source: 'KTEXT', target: 'OrderDescription' },
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'MATNR', target: 'Material', convert: 'padLeft40' },
      { source: 'GAMNG', target: 'OrderQuantity', convert: 'toDecimal' },
      { source: 'GMEIN', target: 'UnitOfMeasure' },
      { source: 'ERDAT', target: 'CreatedDate', convert: 'toDate' },
      { source: 'ERNAM', target: 'CreatedBy' },
      { source: 'STATUS', target: 'SystemStatus' },
      { source: 'OBJNR', target: 'ObjectNumber' },
      { source: 'CYESSION_CLE', target: 'SettlementRule' },
      { source: 'PESSION_ROF', target: 'OrderProfile' },
      { source: 'LOESSION_KZ', target: 'IsDeleted', convert: 'boolYN' },

      // ── Scheduling fields — 8 ──────────────────────────────
      { source: 'GSTRP', target: 'BasicStartDate', convert: 'toDate' },
      { source: 'GLTRP', target: 'BasicFinishDate', convert: 'toDate' },
      { source: 'FTRMS', target: 'ScheduledStart', convert: 'toDate' },
      { source: 'FTRMP', target: 'ScheduledFinish', convert: 'toDate' },
      { source: 'GETRI', target: 'ActualStartDate', convert: 'toDate' },
      { source: 'GLTRI', target: 'ActualFinishDate', convert: 'toDate' },
      { source: 'FEESSION_VOR', target: 'SchedulingType' },
      { source: 'TESSION_RMN', target: 'SchedulingMargin' },

      // ── BOM / Routing fields — 6 ───────────────────────────
      { source: 'PLNBEZ', target: 'RoutingNumber' },
      { source: 'STLNR', target: 'BOMNumber' },
      { source: 'DESSION_IKT', target: 'ProductionVersion' },
      { source: 'PLESSION_NUM', target: 'PlannedOrderNumber' },
      { source: 'PLESSION_GRP', target: 'PlannerGroup' },
      { source: 'ARBPL', target: 'WorkCenter' },

      // ── Cost assignment fields — 6 ─────────────────────────
      { source: 'KOSTL', target: 'CostCenter', convert: 'padLeft10' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'GSBER', target: 'BusinessArea' },
      { source: 'LGORT', target: 'StorageLocation' },
      { source: 'RGESSION_KL', target: 'RecipeGroup' },
      { source: 'ABLAD', target: 'UnloadingPoint' },

      // ── Quantity fields — 5 ─────────────────────────────────
      { source: 'IGMNG', target: 'ScrapQuantity', convert: 'toDecimal' },
      { source: 'GAESSION_SMG', target: 'TotalConfirmedQty', convert: 'toDecimal' },
      { source: 'IAMNG', target: 'ActualQuantity', convert: 'toDecimal' },
      { source: 'UMESSION_REZ', target: 'ConversionFactor', convert: 'toDecimal' },
      { source: 'WEMNG', target: 'GoodsReceiptQuantity', convert: 'toDecimal' },

      // ── Metadata ───────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'PRODUCTION_ORDER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['OrderNumber', 'OrderType', 'CompanyCode', 'Material'],
      exactDuplicate: { keys: ['OrderNumber'] },
    };
  }

  _extractMock() {
    const records = [];
    const orderTypes = ['PP01', 'PP01', 'PP02', 'PP01', 'PP03'];
    const materialTypes = ['FERT', 'HALB'];
    const plants = ['1000', '2000'];
    const workCenters = ['WC-ASSY', 'WC-MACH', 'WC-PACK', 'WC-WELD', 'WC-PAINT'];
    const storageLocations = ['0001', '0002', '0003'];

    const fertMaterials = [
      'FERT-PUMP-100', 'FERT-MOTOR-200', 'FERT-VALVE-300',
      'FERT-GEAR-400', 'FERT-FRAME-500',
    ];
    const halbMaterials = [
      'HALB-SHAFT-110', 'HALB-HOUS-210', 'HALB-SEAL-310',
      'HALB-BEAR-410', 'HALB-FLNG-510',
    ];

    for (let i = 1; i <= 20; i++) {
      const matType = materialTypes[(i - 1) % 2];
      const material = matType === 'FERT'
        ? fertMaterials[(i - 1) % 5]
        : halbMaterials[(i - 1) % 5];
      const plant = plants[(i - 1) % 2];
      const qty = 50 + (i * 10);
      const hasActual = i <= 12;
      const confirmed = hasActual ? Math.floor(qty * (0.6 + Math.random() * 0.35)) : 0;

      records.push({
        AUFNR: String(1000000 + i),
        AUART: orderTypes[(i - 1) % 5],
        KTEXT: `Production of ${material}`,
        BUKRS: plant === '2000' ? '2000' : '1000',
        WERKS: plant,
        MATNR: material,
        GAMNG: String(qty),
        GMEIN: matType === 'FERT' ? 'EA' : 'PC',
        ERDAT: `2024${String(1 + (i % 12)).padStart(2, '0')}05`,
        ERNAM: 'PP_PLANNER',
        STATUS: hasActual ? 'REL CNF' : 'CRTD REL',
        OBJNR: `OR${String(1000000 + i)}`,
        CYESSION_CLE: 'SETT01',
        PESSION_ROF: 'PP01',
        LOESSION_KZ: '',
        GSTRP: `2024${String(1 + (i % 12)).padStart(2, '0')}10`,
        GLTRP: `2024${String(1 + (i % 12)).padStart(2, '0')}25`,
        FTRMS: `2024${String(1 + (i % 12)).padStart(2, '0')}11`,
        FTRMP: `2024${String(1 + (i % 12)).padStart(2, '0')}24`,
        GETRI: hasActual ? `2024${String(1 + (i % 12)).padStart(2, '0')}12` : '',
        GLTRI: hasActual && i <= 8 ? `2024${String(1 + (i % 12)).padStart(2, '0')}23` : '',
        FEESSION_VOR: i % 2 === 0 ? '1' : '2',
        TESSION_RMN: '1',
        PLNBEZ: `RTG-${String(((i - 1) % 5) + 1).padStart(4, '0')}`,
        STLNR: `BOM-${String(((i - 1) % 5) + 1).padStart(4, '0')}`,
        DESSION_IKT: '0001',
        PLESSION_NUM: i % 3 === 0 ? String(9000000 + i) : '',
        PLESSION_GRP: `PG${String(1 + ((i - 1) % 3)).padStart(2, '0')}`,
        ARBPL: workCenters[(i - 1) % 5],
        KOSTL: `CC${String(((i - 1) % 10) + 1).padStart(4, '0')}`,
        PRCTR: `PC${String(((i - 1) % 5) + 1).padStart(4, '0')}`,
        GSBER: 'BU01',
        LGORT: storageLocations[(i - 1) % 3],
        RGESSION_KL: '',
        ABLAD: '',
        IGMNG: String(Math.floor(qty * 0.02)),
        GAESSION_SMG: String(confirmed),
        IAMNG: hasActual ? String(confirmed) : '0',
        UMESSION_REZ: '1.000',
        WEMNG: hasActual && i <= 8 ? String(confirmed) : '0',
      });
    }

    return records; // 20 production orders
  }
}

module.exports = ProductionOrderMigrationObject;
