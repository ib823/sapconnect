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
 * Materials Management Configuration Migration Object
 *
 * Migrates MM customizing from ECC to S/4HANA:
 * plants (T001W), storage locations (T001L), purchasing orgs (T024E),
 * purchasing groups (T024), material types (T134), material groups (T023),
 * vendor account groups (T077K), and pricing conditions.
 *
 * ~25 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class MMConfigMigrationObject extends BaseMigrationObject {
  get objectId() { return 'MM_CONFIG'; }
  get name() { return 'MM Configuration'; }

  getFieldMappings() {
    return [
      // ── Config item identification ─────────────────────────────
      { source: 'CONFIG_TYPE', target: 'ConfigCategory' },
      { source: 'CONFIG_KEY', target: 'ConfigKey' },
      { source: 'CONFIG_DESC', target: 'ConfigDescription' },

      // ── Plant (T001W) ──────────────────────────────────────────
      { source: 'WERKS', target: 'Plant' },
      { source: 'WERKS_NAME', target: 'PlantName' },
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'FABKL', target: 'FactoryCalendar' },
      { source: 'LAND1', target: 'Country', convert: 'toUpperCase' },

      // ── Storage location (T001L) ───────────────────────────────
      { source: 'LGORT', target: 'StorageLocation' },
      { source: 'LGORT_DESC', target: 'StorageLocationDescription' },

      // ── Purchasing org (T024E) ─────────────────────────────────
      { source: 'EKORG', target: 'PurchasingOrganization' },
      { source: 'EKORG_DESC', target: 'PurchasingOrgDescription' },

      // ── Purchasing group (T024) ────────────────────────────────
      { source: 'EKGRP', target: 'PurchasingGroup' },
      { source: 'EKGRP_DESC', target: 'PurchasingGroupDescription' },

      // ── Material type (T134) ───────────────────────────────────
      { source: 'MTART', target: 'MaterialType' },
      { source: 'MTART_DESC', target: 'MaterialTypeDescription' },
      { source: 'MTREF', target: 'ReferenceMaterialType' },
      { source: 'NUMKR', target: 'NumberRangeKey' },

      // ── Material group (T023) ──────────────────────────────────
      { source: 'MATKL', target: 'MaterialGroup' },
      { source: 'MATKL_DESC', target: 'MaterialGroupDescription' },

      // ── Vendor account group (T077K) ───────────────────────────
      { source: 'KTOKK', target: 'VendorAccountGroup' },
      { source: 'KTOKK_DESC', target: 'VendorAccountGroupDescription' },

      // ── Valuation ──────────────────────────────────────────────
      { source: 'BWKEY', target: 'ValuationArea' },
      { source: 'MLAST', target: 'PriceDetermination' },

      // ── Metadata ───────────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'MM_CONFIG' },
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

    // Plants (T001W)
    const plants = [
      { code: '1100', name: 'US Manufacturing', cc: '1000', cal: 'US', country: 'US' },
      { code: '1200', name: 'US Distribution', cc: '1000', cal: 'US', country: 'US' },
      { code: '2100', name: 'DE Manufacturing', cc: '2000', cal: 'DE', country: 'DE' },
      { code: '2200', name: 'DE Distribution', cc: '2000', cal: 'DE', country: 'DE' },
      { code: '3100', name: 'SG Operations', cc: '3000', cal: 'SG', country: 'SG' },
    ];
    for (const p of plants) {
      records.push(this._configRecord('PLANT', p.code, `Plant ${p.code} - ${p.name}`, {
        WERKS: p.code, WERKS_NAME: p.name, BUKRS: p.cc, FABKL: p.cal, LAND1: p.country,
      }));
    }

    // Storage locations
    const storLocs = [
      { plant: '1100', code: '0001', desc: 'Raw Materials' },
      { plant: '1100', code: '0002', desc: 'Finished Goods' },
      { plant: '1100', code: '0003', desc: 'Quality Inspection' },
      { plant: '1200', code: '0001', desc: 'Distribution Center' },
      { plant: '2100', code: '0001', desc: 'Raw Materials' },
      { plant: '2100', code: '0002', desc: 'Finished Goods' },
      { plant: '3100', code: '0001', desc: 'General Storage' },
    ];
    for (const sl of storLocs) {
      records.push(this._configRecord('STORAGE_LOCATION', `${sl.plant}-${sl.code}`, sl.desc, {
        WERKS: sl.plant, LGORT: sl.code, LGORT_DESC: sl.desc,
      }));
    }

    // Purchasing organizations
    const purchOrgs = [
      { code: '1000', desc: 'US Purchasing', cc: '1000' },
      { code: '2000', desc: 'EU Purchasing', cc: '2000' },
      { code: '3000', desc: 'APAC Purchasing', cc: '3000' },
    ];
    for (const po of purchOrgs) {
      records.push(this._configRecord('PURCHASING_ORG', po.code, po.desc, {
        EKORG: po.code, EKORG_DESC: po.desc, BUKRS: po.cc,
      }));
    }

    // Purchasing groups
    const purchGroups = [
      { code: '001', desc: 'Direct Materials' },
      { code: '002', desc: 'Indirect Materials' },
      { code: '003', desc: 'Services' },
      { code: '004', desc: 'Capital Equipment' },
    ];
    for (const pg of purchGroups) {
      records.push(this._configRecord('PURCHASING_GROUP', pg.code, pg.desc, {
        EKGRP: pg.code, EKGRP_DESC: pg.desc,
      }));
    }

    // Material types
    const matTypes = [
      { code: 'ROH', desc: 'Raw Material', ref: '', nrk: '01' },
      { code: 'HALB', desc: 'Semi-Finished', ref: '', nrk: '01' },
      { code: 'FERT', desc: 'Finished Product', ref: '', nrk: '01' },
      { code: 'HAWA', desc: 'Trading Goods', ref: '', nrk: '02' },
      { code: 'DIEN', desc: 'Service', ref: '', nrk: '03' },
      { code: 'NLAG', desc: 'Non-Stock Material', ref: '', nrk: '03' },
      { code: 'VERP', desc: 'Packaging Material', ref: 'ROH', nrk: '01' },
    ];
    for (const mt of matTypes) {
      records.push(this._configRecord('MATERIAL_TYPE', mt.code, mt.desc, {
        MTART: mt.code, MTART_DESC: mt.desc, MTREF: mt.ref, NUMKR: mt.nrk,
      }));
    }

    // Material groups
    const matGroups = [
      { code: '001', desc: 'Metals & Alloys' },
      { code: '002', desc: 'Plastics & Polymers' },
      { code: '003', desc: 'Electronics' },
      { code: '004', desc: 'Chemicals' },
      { code: '005', desc: 'Packaging' },
    ];
    for (const mg of matGroups) {
      records.push(this._configRecord('MATERIAL_GROUP', mg.code, mg.desc, {
        MATKL: mg.code, MATKL_DESC: mg.desc,
      }));
    }

    // Vendor account groups
    const vendorGroups = [
      { code: 'LIEF', desc: 'Standard Vendor' },
      { code: 'KRED', desc: 'Creditor (one-time)' },
      { code: 'CPDI', desc: 'Intercompany Vendor' },
    ];
    for (const vg of vendorGroups) {
      records.push(this._configRecord('VENDOR_ACCOUNT_GROUP', vg.code, vg.desc, {
        KTOKK: vg.code, KTOKK_DESC: vg.desc,
      }));
    }

    return records; // 5 + 7 + 3 + 4 + 7 + 5 + 3 = 34 records
  }

  _configRecord(type, key, desc, extra) {
    return {
      CONFIG_TYPE: type,
      CONFIG_KEY: key,
      CONFIG_DESC: desc,
      WERKS: '', WERKS_NAME: '', BUKRS: '', FABKL: '', LAND1: '',
      LGORT: '', LGORT_DESC: '',
      EKORG: '', EKORG_DESC: '',
      EKGRP: '', EKGRP_DESC: '',
      MTART: '', MTART_DESC: '', MTREF: '', NUMKR: '',
      MATKL: '', MATKL_DESC: '',
      KTOKK: '', KTOKK_DESC: '',
      BWKEY: '', MLAST: '',
      ...extra,
    };
  }
}

module.exports = MMConfigMigrationObject;
