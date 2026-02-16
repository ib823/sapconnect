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
 * Controlling Configuration Migration Object
 *
 * Migrates CO customizing from ECC to S/4HANA:
 * controlling areas (TKA01), cost center categories (CSKS),
 * cost element groups (CSKA), activity types (CSLA),
 * statistical key figures (TKB1), and allocation cycles.
 *
 * ~25 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class COConfigMigrationObject extends BaseMigrationObject {
  get objectId() { return 'CO_CONFIG'; }
  get name() { return 'Controlling Configuration'; }

  getFieldMappings() {
    return [
      // ── Config item identification ─────────────────────────────
      { source: 'CONFIG_TYPE', target: 'ConfigCategory' },
      { source: 'CONFIG_KEY', target: 'ConfigKey' },
      { source: 'CONFIG_DESC', target: 'ConfigDescription' },

      // ── Controlling area (TKA01) ───────────────────────────────
      { source: 'KOKRS', target: 'ControllingArea' },
      { source: 'KOKRS_NAME', target: 'ControllingAreaName' },
      { source: 'KTOPL', target: 'ChartOfAccounts' },
      { source: 'WAESSION_RS', target: 'Currency' },
      { source: 'GSESSION_BER', target: 'FiscalYearVariant' },

      // ── Cost center category ───────────────────────────────────
      { source: 'KOSAR', target: 'CostCenterCategory' },
      { source: 'KOSAR_DESC', target: 'CategoryDescription' },

      // ── Cost element ───────────────────────────────────────────
      { source: 'KSTAR', target: 'CostElement', convert: 'padLeft10' },
      { source: 'KAESSION_TYP', target: 'CostElementCategory' },
      { source: 'KSTAR_DESC', target: 'CostElementDescription' },

      // ── Activity type (CSLA) ───────────────────────────────────
      { source: 'LSTAR', target: 'ActivityType' },
      { source: 'LSTAR_DESC', target: 'ActivityTypeDescription' },
      { source: 'AUESSION_TYP', target: 'ActivityTypeCategory' },
      { source: 'LEINH', target: 'UnitOfMeasure' },
      { source: 'PRICE', target: 'PlannedPrice', convert: 'toDecimal' },

      // ── Statistical key figure (TKB1) ──────────────────────────
      { source: 'STAGR', target: 'StatisticalKeyFigure' },
      { source: 'STAGR_DESC', target: 'KeyFigureDescription' },
      { source: 'STAGR_UNIT', target: 'KeyFigureUnit' },
      { source: 'STAGR_TYPE', target: 'KeyFigureType' },

      // ── Allocation ─────────────────────────────────────────────
      { source: 'ALLOC_TYPE', target: 'AllocationType' },
      { source: 'ALLOC_CYCLE', target: 'AllocationCycleName' },

      // ── Metadata ───────────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'CO_CONFIG' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['ConfigCategory', 'ConfigKey', 'ConfigDescription'],
      exactDuplicate: { keys: ['ConfigCategory', 'ConfigKey'] },
    };
  }

  _extractMock() {
    const records = [];

    // Controlling areas (TKA01)
    records.push(this._configRecord('CONTROLLING_AREA', '1000', 'Global Controlling Area', {
      KOKRS: '1000', KOKRS_NAME: 'Global Controlling', KTOPL: 'YCOA',
      WAESSION_RS: 'USD', GSESSION_BER: 'K4',
    }));

    // Cost center categories
    const categories = [
      { code: 'E', desc: 'Production' },
      { code: 'F', desc: 'Administration' },
      { code: 'H', desc: 'Management' },
      { code: 'L', desc: 'Logistics' },
      { code: 'P', desc: 'Project' },
      { code: 'V', desc: 'Sales & Distribution' },
    ];
    for (const cat of categories) {
      records.push(this._configRecord('CC_CATEGORY', cat.code, `Cost Center Category: ${cat.desc}`, {
        KOSAR: cat.code, KOSAR_DESC: cat.desc,
      }));
    }

    // Cost elements (primary + secondary)
    const costElements = [
      { code: '0000400000', cat: '1', desc: 'Revenue - Domestic' },
      { code: '0000410000', cat: '1', desc: 'Revenue - Export' },
      { code: '0000500000', cat: '1', desc: 'Material Costs' },
      { code: '0000600000', cat: '1', desc: 'Personnel Costs' },
      { code: '0000610000', cat: '1', desc: 'External Services' },
      { code: '0000620000', cat: '1', desc: 'Depreciation' },
      { code: '0000900000', cat: '41', desc: 'Assessment Allocation' },
      { code: '0000910000', cat: '42', desc: 'Internal Activity Allocation' },
      { code: '0000920000', cat: '43', desc: 'Overhead Surcharge' },
    ];
    for (const ce of costElements) {
      records.push(this._configRecord('COST_ELEMENT', ce.code, ce.desc, {
        KSTAR: ce.code, KAESSION_TYP: ce.cat, KSTAR_DESC: ce.desc,
      }));
    }

    // Activity types (CSLA)
    const activityTypes = [
      { code: 'LABOR', desc: 'Direct Labor', cat: '1', unit: 'H', price: '75.00' },
      { code: 'MACHINE', desc: 'Machine Hours', cat: '1', unit: 'H', price: '120.00' },
      { code: 'SETUP', desc: 'Setup Time', cat: '1', unit: 'H', price: '90.00' },
      { code: 'ENERGY', desc: 'Energy Consumption', cat: '1', unit: 'KWH', price: '0.12' },
      { code: 'OVHD', desc: 'Overhead Allocation', cat: '3', unit: 'PCT', price: '0' },
    ];
    for (const at of activityTypes) {
      records.push(this._configRecord('ACTIVITY_TYPE', at.code, at.desc, {
        LSTAR: at.code, LSTAR_DESC: at.desc, AUESSION_TYP: at.cat, LEINH: at.unit, PRICE: at.price,
      }));
    }

    // Statistical key figures
    const keyFigures = [
      { code: 'HEADCNT', desc: 'Headcount', unit: 'EA', type: 'fixed' },
      { code: 'SQMETER', desc: 'Square Meters', unit: 'M2', type: 'fixed' },
      { code: 'PCHOURS', desc: 'PC Hours', unit: 'H', type: 'total' },
      { code: 'TRNOVER', desc: 'Revenue Share', unit: 'PCT', type: 'total' },
    ];
    for (const kf of keyFigures) {
      records.push(this._configRecord('STAT_KEY_FIGURE', kf.code, kf.desc, {
        STAGR: kf.code, STAGR_DESC: kf.desc, STAGR_UNIT: kf.unit, STAGR_TYPE: kf.type,
      }));
    }

    // Allocation cycles
    const cycles = [
      { type: 'assessment', name: 'ADMIN_ALLOC', desc: 'Admin Cost Assessment' },
      { type: 'distribution', name: 'ENERGY_DIST', desc: 'Energy Cost Distribution' },
      { type: 'activity_alloc', name: 'LABOR_ALLOC', desc: 'Labor Activity Allocation' },
    ];
    for (const cy of cycles) {
      records.push(this._configRecord('ALLOCATION_CYCLE', cy.name, cy.desc, {
        ALLOC_TYPE: cy.type, ALLOC_CYCLE: cy.name,
      }));
    }

    return records; // 1 + 6 + 9 + 5 + 4 + 3 = 28 records
  }

  _configRecord(type, key, desc, extra) {
    return {
      CONFIG_TYPE: type,
      CONFIG_KEY: key,
      CONFIG_DESC: desc,
      KOKRS: '', KOKRS_NAME: '', KTOPL: '', WAESSION_RS: '', GSESSION_BER: '',
      KOSAR: '', KOSAR_DESC: '',
      KSTAR: '', KAESSION_TYP: '', KSTAR_DESC: '',
      LSTAR: '', LSTAR_DESC: '', AUESSION_TYP: '', LEINH: '', PRICE: '',
      STAGR: '', STAGR_DESC: '', STAGR_UNIT: '', STAGR_TYPE: '',
      ALLOC_TYPE: '', ALLOC_CYCLE: '',
      ...extra,
    };
  }
}

module.exports = COConfigMigrationObject;
