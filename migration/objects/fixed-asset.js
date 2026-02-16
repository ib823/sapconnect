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
 * Fixed Asset Migration Object
 *
 * Migrates Fixed Assets from ECC (ANLA/ANLB/ANLC)
 * to S/4HANA New Asset Accounting (ACDOCA-based).
 *
 * ~60 field mappings: 25 master + 15 depreciation areas + 15 accumulated values + 5 time-dependent.
 * Mock: 30 assets × 2 depreciation areas.
 */

const BaseMigrationObject = require('./base-migration-object');

class FixedAssetMigrationObject extends BaseMigrationObject {
  get objectId() { return 'FIXED_ASSET'; }
  get name() { return 'Fixed Asset'; }

  getFieldMappings() {
    return [
      // ── Master data (ANLA) — 25 ───────────────────────────
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'ANLN1', target: 'MasterFixedAsset', convert: 'padLeft10' },
      { source: 'ANLN2', target: 'FixedAsset', convert: 'padLeft10' },
      { source: 'ANLKL', target: 'AssetClass' },
      { source: 'TXT50', target: 'AssetDescription' },
      { source: 'TXA50', target: 'AdditionalDescription' },
      { source: 'SERNR', target: 'SerialNumber' },
      { source: 'INVNR', target: 'InventoryNumber' },
      { source: 'AKTIV', target: 'CapitalizationDate', convert: 'toDate' },
      { source: 'DEAKT', target: 'DeactivationDate', convert: 'toDate' },
      { source: 'ZUGDT', target: 'FirstAcquisitionDate', convert: 'toDate' },
      { source: 'KOSTL', target: 'CostCenter', convert: 'padLeft10' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'STORT', target: 'AssetLocation' },
      { source: 'RAESSION', target: 'Room' },
      { source: 'ANLUE', target: 'AssetSuperNumber' },
      { source: 'EAUFN', target: 'SettlementOrder' },
      { source: 'AUFNR', target: 'InternalOrder' },
      { source: 'GSBER', target: 'BusinessArea' },
      { source: 'SEGMENT', target: 'Segment' },
      { source: 'LAND1', target: 'Country', convert: 'toUpperCase' },
      { source: 'MENGE', target: 'Quantity', convert: 'toDecimal' },
      { source: 'MEINS', target: 'BaseUnit' },
      { source: 'LVORM', target: 'IsMarkedForDeletion', convert: 'boolYN' },

      // ── Depreciation area data (ANLB) — 15 ────────────────
      { source: 'AFESSION_NR', target: 'DepreciationArea' },
      { source: 'AFABG', target: 'DepreciationStartDate', convert: 'toDate' },
      { source: 'AFASL', target: 'DepreciationKey' },
      { source: 'NDJAR', target: 'UsefulLife', convert: 'toInteger' },
      { source: 'NDPER', target: 'UsefulLifePeriods', convert: 'toInteger' },
      { source: 'SCHRW', target: 'ScrapValue', convert: 'toDecimal' },
      { source: 'SCHRW_PRC', target: 'ScrapValuePercentage', convert: 'toDecimal' },
      { source: 'ZINESSION_KZ', target: 'InterestIndicator' },
      { source: 'XAFAR', target: 'IsDepreciationAreaActive', convert: 'boolYN' },
      { source: 'SAFBG', target: 'SpecialDepStartDate', convert: 'toDate' },
      { source: 'UMESSION_KZ', target: 'TransferReserveIndicator' },
      { source: 'NACBW', target: 'SubsequentAcquisition', convert: 'toDecimal' },
      { source: 'URWRT', target: 'OriginalValue', convert: 'toDecimal' },
      { source: 'AIESSION_NR', target: 'InvestmentMeasure' },
      { source: 'GPESSION_NR', target: 'InvestmentProgram' },

      // ── Accumulated values (ANLC) — 15 ────────────────────
      { source: 'KANSW', target: 'AcquisitionValue', convert: 'toDecimal' },
      { source: 'KNAFA', target: 'AccumulatedDepreciation', convert: 'toDecimal' },
      { source: 'KAUFW', target: 'Revaluation', convert: 'toDecimal' },
      { source: 'KSAFA', target: 'SpecialDepreciation', convert: 'toDecimal' },
      { source: 'KAAFA', target: 'UnplannedDepreciation', convert: 'toDecimal' },
      { source: 'KINVZ', target: 'InvestmentGrant', convert: 'toDecimal' },
      { source: 'ANSWL', target: 'NetBookValue', convert: 'toDecimal' },
      { source: 'NAFAZ', target: 'OrdinaryDepCurrentYear', convert: 'toDecimal' },
      { source: 'SAFAZ', target: 'SpecialDepCurrentYear', convert: 'toDecimal' },
      { source: 'AAFAZ', target: 'UnplannedDepCurrentYear', convert: 'toDecimal' },
      { source: 'MESSION_AFZ', target: 'ManualDepCurrentYear', convert: 'toDecimal' },
      { source: 'GJAHR', target: 'FiscalYear', convert: 'toInteger' },
      { source: 'PEESSION_AF', target: 'DepreciationPeriod', convert: 'toInteger' },
      { source: 'ZESSION_UCH', target: 'Additions', convert: 'toDecimal' },
      { source: 'ABGANG', target: 'Retirements', convert: 'toDecimal' },

      // ── Time-dependent data — 5 ───────────────────────────
      { source: 'KOSTLV', target: 'ResponsibleCostCenter', convert: 'padLeft10' },
      { source: 'PRCTRV', target: 'ResponsibleProfitCenter', convert: 'padLeft10' },
      { source: 'ADESSION_KZ', target: 'AssetSubdivisionIndicator' },
      { source: 'BEGDT', target: 'ValidityStartDate', convert: 'toDate' },
      { source: 'ENDDT', target: 'ValidityEndDate', convert: 'toDate' },

      // ── Metadata ───────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'FIXED_ASSET' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['CompanyCode', 'MasterFixedAsset', 'AssetClass', 'CapitalizationDate'],
      exactDuplicate: { keys: ['CompanyCode', 'MasterFixedAsset', 'FixedAsset', 'DepreciationArea'] },
      range: [
        { field: 'UsefulLife', min: 1, max: 99 },
        { field: 'FiscalYear', min: 1990, max: 2030 },
      ],
    };
  }

  _extractMock() {
    const records = [];
    const assetClasses = ['1000', '2000', '3000', '3100', '4000']; // Buildings, Machinery, Vehicles, IT Equipment, Furniture
    const descriptions = [
      'Office Building Main', 'Production Machine A', 'Delivery Truck', 'Server Rack', 'Office Desk',
      'Warehouse', 'CNC Machine', 'Forklift', 'Laptop Fleet', 'Conference Table',
      'Parking Garage', 'Assembly Robot', 'Company Van', 'Network Switch', 'Ergonomic Chair',
      'Factory Hall B', 'Lathe Machine', 'Crane Truck', 'Storage Array', 'Filing Cabinet',
      'Gate House', 'Press Machine', 'Electric Vehicle', 'UPS System', 'Standing Desk',
      'Annex Building', 'Welding Station', 'Refrigerated Truck', 'Firewall Appliance', 'Bookshelf',
    ];
    const depAreas = ['01', '15']; // Book depreciation, Tax depreciation

    for (let a = 1; a <= 30; a++) {
      for (const afaNr of depAreas) {
        const cl = assetClasses[(a - 1) % 5];
        const usefulLife = cl === '1000' ? 40 : cl === '2000' ? 10 : cl === '3000' ? 5 : cl === '3100' ? 3 : 8;
        const acqValue = cl === '1000' ? 500000 + a * 10000 : cl === '2000' ? 50000 + a * 2000 : 10000 + a * 500;
        const yearsDepreciated = Math.min(a % usefulLife + 1, usefulLife);
        const annualDep = acqValue / usefulLife;
        const accumDep = annualDep * yearsDepreciated;

        records.push({
          BUKRS: a <= 20 ? '1000' : '2000',
          ANLN1: String(a).padStart(12, '0'),
          ANLN2: '0000',
          ANLKL: cl,
          TXT50: descriptions[a - 1] || `Asset ${a}`,
          TXA50: '',
          SERNR: a % 3 === 0 ? `SN-${String(a).padStart(6, '0')}` : '',
          INVNR: `INV-${String(a).padStart(6, '0')}`,
          AKTIV: `${2024 - yearsDepreciated}0101`,
          DEAKT: '',
          ZUGDT: `${2024 - yearsDepreciated}0101`,
          KOSTL: `CC${a <= 20 ? '10' : '20'}01`,
          PRCTR: `PC${a <= 20 ? '10' : '20'}01`,
          WERKS: a <= 20 ? '1000' : '2000',
          STORT: `LOC${String((a % 5) + 1).padStart(2, '0')}`,
          RAESSION: '',
          ANLUE: '',
          EAUFN: '',
          AUFNR: '',
          GSBER: 'BU01',
          SEGMENT: 'SEG1',
          LAND1: 'US',
          MENGE: cl === '3100' ? String(5 + (a % 20)) : '1',
          MEINS: cl === '3100' ? 'EA' : 'EA',
          LVORM: '',
          AFESSION_NR: afaNr,
          AFABG: `${2024 - yearsDepreciated}0101`,
          AFASL: afaNr === '01' ? 'LINA' : 'LINT',
          NDJAR: usefulLife,
          NDPER: 0,
          SCHRW: (acqValue * 0.05).toFixed(2),
          SCHRW_PRC: '5.00',
          ZINESSION_KZ: '',
          XAFAR: 'X',
          SAFBG: '',
          UMESSION_KZ: '',
          NACBW: '0.00',
          URWRT: acqValue.toFixed(2),
          AIESSION_NR: '',
          GPESSION_NR: '',
          KANSW: acqValue.toFixed(2),
          KNAFA: accumDep.toFixed(2),
          KAUFW: '0.00',
          KSAFA: '0.00',
          KAAFA: '0.00',
          KINVZ: '0.00',
          ANSWL: (acqValue - accumDep).toFixed(2),
          NAFAZ: annualDep.toFixed(2),
          SAFAZ: '0.00',
          AAFAZ: '0.00',
          MESSION_AFZ: '0.00',
          GJAHR: 2024,
          PEESSION_AF: 1,
          ZESSION_UCH: '0.00',
          ABGANG: '0.00',
          KOSTLV: `CC${a <= 20 ? '10' : '20'}01`,
          PRCTRV: `PC${a <= 20 ? '10' : '20'}01`,
          ADESSION_KZ: '',
          BEGDT: `${2024 - yearsDepreciated}0101`,
          ENDDT: '99991231',
        });
      }
    }

    return records; // 30 × 2 = 60 records
  }
}

module.exports = FixedAssetMigrationObject;
