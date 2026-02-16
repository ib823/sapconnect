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
 * Maintenance Order Migration Object
 *
 * Migrates PM Maintenance Orders from ECC (AUFK)
 * to S/4HANA PM Order via API_MAINTENANCEORDER.
 *
 * ~40 field mappings covering order header, scheduling, work, and cost fields.
 * Order types: PM01 (corrective), PM02 (preventive), PM03 (condition-based).
 */

const BaseMigrationObject = require('./base-migration-object');

class MaintenanceOrderMigrationObject extends BaseMigrationObject {
  get objectId() { return 'MAINTENANCE_ORDER'; }
  get name() { return 'Maintenance Order'; }

  getFieldMappings() {
    return [
      // ── Order header fields (AUFK) — 20 ─────────────────────
      { source: 'AUFNR', target: 'OrderNumber' },
      { source: 'AUART', target: 'OrderType' },
      { source: 'AUTYP', target: 'OrderCategory' },
      { source: 'KTEXT', target: 'OrderDescription' },
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'TPLNR', target: 'FunctionalLocation' },
      { source: 'EQUNR', target: 'EquipmentNumber' },
      { source: 'IWERK', target: 'MaintenancePlant' },
      { source: 'INGPR', target: 'PlannerGroup' },
      { source: 'GEWRK', target: 'MainWorkCenter' },
      { source: 'KOSTL', target: 'CostCenter', convert: 'padLeft10' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'GSBER', target: 'BusinessArea' },
      { source: 'PRIESSION_OT', target: 'Priority' },
      { source: 'ERDAT', target: 'CreatedDate', convert: 'toDate' },
      { source: 'ERNAM', target: 'CreatedBy' },
      { source: 'AEDAT', target: 'ChangedDate', convert: 'toDate' },
      { source: 'OBJNR', target: 'ObjectNumber' },
      { source: 'ILART', target: 'MaintenanceActivityType' },

      // ── Scheduling fields — 8 ───────────────────────────────
      { source: 'GSTRP', target: 'BasicStartDate', convert: 'toDate' },
      { source: 'GLTRP', target: 'BasicFinishDate', convert: 'toDate' },
      { source: 'FTRMS', target: 'ScheduledStartDate', convert: 'toDate' },
      { source: 'FTRMP', target: 'ScheduledFinishDate', convert: 'toDate' },
      { source: 'GETRI', target: 'ActualStartDate', convert: 'toDate' },
      { source: 'GLTRI', target: 'ActualFinishDate', convert: 'toDate' },
      { source: 'CYCLE', target: 'MaintenanceCycle' },
      { source: 'REVNR', target: 'RevisionNumber' },

      // ── Work and cost fields — 6 ────────────────────────────
      { source: 'ARBEI', target: 'PlannedWork', convert: 'toDecimal' },
      { source: 'ISMNW', target: 'ActualWork', convert: 'toDecimal' },
      { source: 'QMNUM', target: 'NotificationNumber' },
      { source: 'WAESSION_RS', target: 'Currency' },

      // ── User and status fields — 4 ──────────────────────────
      { source: 'IPHAS', target: 'Phase' },
      { source: 'SYSTD', target: 'SystemStatus' },
      { source: 'USERD', target: 'UserStatus' },
      { source: 'STORT', target: 'Location' },
      { source: 'MSGRP', target: 'MaintenancePlanGroup' },
      { source: 'WARPL', target: 'MaintenancePlan' },
      { source: 'ABESSION_NUM', target: 'MaintenanceCallNumber' },

      // ── Metadata ───────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'MAINTENANCE_ORDER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['OrderNumber', 'OrderType', 'CompanyCode', 'Plant'],
      exactDuplicate: { keys: ['OrderNumber'] },
    };
  }

  _extractMock() {
    const records = [];
    const orderTypes = ['PM01', 'PM02', 'PM03'];
    const typeDescriptions = {
      PM01: 'Corrective Maintenance',
      PM02: 'Preventive Maintenance',
      PM03: 'Condition-Based Maintenance',
    };
    const plants = ['1000', '2000'];
    const funcLocs = ['FL-PROD-01', 'FL-PROD-02', 'FL-UTIL-01', 'FL-WHSE-01', 'FL-PACK-01'];
    const equipment = ['EQ-PUMP-001', 'EQ-MOTOR-002', 'EQ-CONV-003', 'EQ-COMP-004', 'EQ-TANK-005'];
    const workCenters = ['PM-MECH', 'PM-ELEC', 'PM-INST', 'PM-PIPE', 'PM-HVAC'];
    const priorities = ['1', '2', '3', '4'];
    const activityTypes = ['001', '002', '003', '004'];

    for (let i = 1; i <= 25; i++) {
      const type = orderTypes[(i - 1) % 3];
      const plant = plants[(i - 1) % 2];
      const hasActual = i <= 15;

      records.push({
        AUFNR: String(4000000 + i),
        AUART: type,
        AUTYP: '30',
        KTEXT: `${typeDescriptions[type]} - ${equipment[(i - 1) % 5]}`,
        BUKRS: plant === '2000' ? '2000' : '1000',
        WERKS: plant,
        TPLNR: funcLocs[(i - 1) % 5],
        EQUNR: equipment[(i - 1) % 5],
        IWERK: plant,
        INGPR: `IG${String(1 + ((i - 1) % 3)).padStart(2, '0')}`,
        GEWRK: workCenters[(i - 1) % 5],
        KOSTL: `CC${String(((i - 1) % 10) + 1).padStart(4, '0')}`,
        PRCTR: `PC${String(((i - 1) % 5) + 1).padStart(4, '0')}`,
        GSBER: 'BU01',
        PRIESSION_OT: priorities[(i - 1) % 4],
        ERDAT: '20240115',
        ERNAM: 'PLANNER',
        AEDAT: '20240201',
        OBJNR: `OR${String(4000000 + i)}`,
        ILART: activityTypes[(i - 1) % 4],
        GSTRP: `2024${String(1 + (i % 12)).padStart(2, '0')}01`,
        GLTRP: `2024${String(1 + (i % 12)).padStart(2, '0')}15`,
        FTRMS: `2024${String(1 + (i % 12)).padStart(2, '0')}02`,
        FTRMP: `2024${String(1 + (i % 12)).padStart(2, '0')}14`,
        GETRI: hasActual ? `2024${String(1 + (i % 12)).padStart(2, '0')}03` : '',
        GLTRI: hasActual ? `2024${String(1 + (i % 12)).padStart(2, '0')}12` : '',
        CYCLE: type === 'PM02' ? `CYC${String(((i - 1) % 4) + 1).padStart(2, '0')}` : '',
        REVNR: type === 'PM02' ? `REV${String(i).padStart(3, '0')}` : '',
        ARBEI: String((2 + (i % 8)) * 10),
        ISMNW: hasActual ? String((2 + (i % 6)) * 10) : '0',
        QMNUM: i % 3 === 0 ? String(10000000 + i) : '',
        WAESSION_RS: 'USD',
        IPHAS: hasActual ? '5' : '3',
        SYSTD: hasActual ? 'REL CNF' : 'REL',
        USERD: '',
        STORT: funcLocs[(i - 1) % 5],
        MSGRP: type === 'PM02' ? 'PREV-GRP' : '',
        WARPL: type === 'PM02' ? `MP-${String(((i - 1) % 5) + 1).padStart(3, '0')}` : '',
        ABESSION_NUM: type === 'PM02' ? String(i) : '',
      });
    }

    return records; // 25 maintenance orders
  }
}

module.exports = MaintenanceOrderMigrationObject;
