/**
 * Material Master Migration Object
 *
 * Migrates Material Master from ECC (MARA/MARC/MARD)
 * to S/4HANA Product structure.
 *
 * ~100 field mappings: 30 MARA + 35 MARC + 15 MARD + 10 text + 10 classification.
 * MATNR extended from 18 → 40 chars via padLeft40.
 */

const BaseMigrationObject = require('./base-migration-object');

class MaterialMasterMigrationObject extends BaseMigrationObject {
  get objectId() { return 'MATERIAL_MASTER'; }
  get name() { return 'Material Master'; }

  getFieldMappings() {
    return [
      // ── MARA - General data (30) ───────────────────────────
      { source: 'MATNR', target: 'Product', convert: 'padLeft40' },
      { source: 'MTART', target: 'ProductType' },
      { source: 'MBRSH', target: 'IndustrySector' },
      { source: 'MATKL', target: 'ProductGroup' },
      { source: 'MEINS', target: 'BaseUnit' },
      { source: 'BRGEW', target: 'GrossWeight', convert: 'toDecimal' },
      { source: 'NTGEW', target: 'NetWeight', convert: 'toDecimal' },
      { source: 'GEWEI', target: 'WeightUnit' },
      { source: 'VOLUM', target: 'Volume', convert: 'toDecimal' },
      { source: 'VOLEH', target: 'VolumeUnit' },
      { source: 'GROES', target: 'Size' },
      { source: 'EAN11', target: 'GTIN' },
      { source: 'NUMTP', target: 'GTINCategory' },
      { source: 'MHDRZ', target: 'MinShelfLife', convert: 'toInteger' },
      { source: 'MHDLP', target: 'ShelfLifeExpPeriod', convert: 'toInteger' },
      { source: 'VPSTA', target: 'MaintenanceStatus' },
      { source: 'PSTAT', target: 'ProfileStatus' },
      { source: 'LVORM', target: 'IsMarkedForDeletion', convert: 'boolYN' },
      { source: 'BISMT', target: 'OldMaterialNumber' },
      { source: 'EXTWG', target: 'ExternalProductGroup' },
      { source: 'LABOR', target: 'Laboratory' },
      { source: 'KOSCH', target: 'ProductCostingGroup' },
      { source: 'FERTH', target: 'ProductionMemo' },
      { source: 'NORMT', target: 'StandardDescription' },
      { source: 'WRKST', target: 'BasicMaterial' },
      { source: 'SPART', target: 'Division' },
      { source: 'TRAGR', target: 'TransportGroup' },
      { source: 'LADGR', target: 'LoadingGroup' },
      { source: 'ERDAT', target: 'CreationDate', convert: 'toDate' },
      { source: 'ERSDA', target: 'CreatedOnDate', convert: 'toDate' },

      // ── MARC - Plant data (35) ─────────────────────────────
      { source: 'WERKS', target: 'Plant' },
      { source: 'EKGRP', target: 'PurchasingGroup' },
      { source: 'DISMM', target: 'MRPType' },
      { source: 'DISPO', target: 'MRPController' },
      { source: 'DISLS', target: 'LotSizingProcedure' },
      { source: 'BSTMI', target: 'MinLotSize', convert: 'toDecimal' },
      { source: 'BSTMA', target: 'MaxLotSize', convert: 'toDecimal' },
      { source: 'BSTFE', target: 'FixedLotSize', convert: 'toDecimal' },
      { source: 'MABST', target: 'MaxStockLevel', convert: 'toDecimal' },
      { source: 'MINBE', target: 'ReorderPoint', convert: 'toDecimal' },
      { source: 'EISBE', target: 'SafetyStock', convert: 'toDecimal' },
      { source: 'PLIFZ', target: 'PlannedDeliveryTime', convert: 'toInteger' },
      { source: 'WEBAZ', target: 'GoodsReceiptDuration', convert: 'toInteger' },
      { source: 'FHORI', target: 'SchedulingFloatForPlannedOrders' },
      { source: 'RWPRO', target: 'CoveragePeriodProfile' },
      { source: 'BESKZ', target: 'ProcurementType' },
      { source: 'SOBSL', target: 'SpecialProcurementType' },
      { source: 'LGPRO', target: 'ProductionStorageLocation' },
      { source: 'LGFSB', target: 'DefaultStorageLocation' },
      { source: 'PERKZ', target: 'PeriodIndicator' },
      { source: 'AUSME', target: 'IssueUnit' },
      { source: 'LOSFX', target: 'LotSizeCostFactor', convert: 'toDecimal' },
      { source: 'SBDKZ', target: 'DependentRequirements' },
      { source: 'FEVOR', target: 'ProductionScheduler' },
      { source: 'SFCPF', target: 'ProductionSchedulingProfile' },
      { source: 'SCHGT', target: 'IsBulkMaterial', convert: 'boolYN' },
      { source: 'INSMK', target: 'QualityInspectionType' },
      { source: 'SSQSS', target: 'QualityMgmtCtrlKey' },
      { source: 'MISKZ', target: 'MixedBatchIndicator' },
      { source: 'XCHPF', target: 'IsBatchManaged', convert: 'boolYN' },
      { source: 'VRMOD', target: 'ConsumptionMode' },
      { source: 'VINT1', target: 'BackwardConsumptionPeriod', convert: 'toInteger' },
      { source: 'VINT2', target: 'ForwardConsumptionPeriod', convert: 'toInteger' },
      { source: 'STRGR', target: 'PlanningStrategyGroup' },
      { source: 'SERNP', target: 'SerialNumberProfile' },

      // ── MARD - Storage location data (15) ──────────────────
      { source: 'LGORT', target: 'StorageLocation' },
      { source: 'LABST', target: 'UnrestrictedStock', convert: 'toDecimal' },
      { source: 'INSME', target: 'QualityInspectionStock', convert: 'toDecimal' },
      { source: 'EINME', target: 'RestrictedStock', convert: 'toDecimal' },
      { source: 'SPEME', target: 'BlockedStock', convert: 'toDecimal' },
      { source: 'RETME', target: 'ReturnsStock', convert: 'toDecimal' },
      { source: 'UMLME', target: 'StockInTransfer', convert: 'toDecimal' },
      { source: 'KLABS', target: 'ConsignmentStock', convert: 'toDecimal' },
      { source: 'KINSM', target: 'ConsignmentQIStock', convert: 'toDecimal' },
      { source: 'KEINM', target: 'ConsignmentRestrictedStock', convert: 'toDecimal' },
      { source: 'KSPEM', target: 'ConsignmentBlockedStock', convert: 'toDecimal' },
      { source: 'LFGJA', target: 'LastGoodsMovementYear', convert: 'toInteger' },
      { source: 'LFMON', target: 'LastGoodsMovementMonth', convert: 'toInteger' },
      { source: 'HERKL', target: 'CountryOfOrigin' },
      { source: 'HERKR', target: 'RegionOfOrigin' },

      // ── Text data (10) ────────────────────────────────────
      { source: 'MAKTX', target: 'ProductDescription' },
      { source: 'MAKTX_EN', target: 'ProductDescriptionEN' },
      { source: 'MAKTX_DE', target: 'ProductDescriptionDE' },
      { source: 'MAKTX_FR', target: 'ProductDescriptionFR' },
      { source: 'MAKTX_ES', target: 'ProductDescriptionES' },
      { source: 'LTEX1', target: 'PurchaseOrderText' },
      { source: 'LTEX2', target: 'SalesText' },
      { source: 'LTEX3', target: 'InternalNote' },
      { source: 'LTEX4', target: 'QualityText' },
      { source: 'LTEX5', target: 'StorageInstructions' },

      // ── Classification (10) ────────────────────────────────
      { source: 'CLASS_TYPE', target: 'ClassType' },
      { source: 'CLASS_NUM', target: 'ClassNumber' },
      { source: 'CHAR01_VAL', target: 'Characteristic01' },
      { source: 'CHAR02_VAL', target: 'Characteristic02' },
      { source: 'CHAR03_VAL', target: 'Characteristic03' },
      { source: 'CHAR04_VAL', target: 'Characteristic04' },
      { source: 'CHAR05_VAL', target: 'Characteristic05' },
      { source: 'HAZMAT_CLASS', target: 'HazardousMaterialClass' },
      { source: 'HAZMAT_NUM', target: 'HazardousMaterialNumber' },
      { source: 'BATCH_CLASS', target: 'BatchClassification' },

      // ── Metadata ───────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'MATERIAL_MASTER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['Product', 'ProductType', 'BaseUnit'],
      exactDuplicate: { keys: ['Product', 'Plant', 'StorageLocation'] },
    };
  }

  _extractMock() {
    const records = [];
    const materialTypes = ['FERT', 'HALB', 'ROH', 'HIBE', 'ERSA'];
    const plants = ['1000', '2000', '3000'];
    const slocs = ['0001', '0002'];

    for (let m = 1; m <= 25; m++) {
      for (const werks of plants) {
        for (const lgort of slocs) {
          records.push({
            MATNR: `MAT${String(m).padStart(5, '0')}`,
            MTART: materialTypes[(m - 1) % 5],
            MBRSH: 'M',
            MATKL: `MG${String(((m - 1) % 10) + 1).padStart(2, '0')}`,
            MEINS: m % 3 === 0 ? 'KG' : m % 3 === 1 ? 'EA' : 'L',
            BRGEW: (Math.random() * 100).toFixed(3),
            NTGEW: (Math.random() * 80).toFixed(3),
            GEWEI: 'KG',
            VOLUM: (Math.random() * 50).toFixed(3),
            VOLEH: 'L',
            GROES: `${10 + m}x${5 + m}x${3 + m}`,
            EAN11: `40${String(m).padStart(11, '0')}`,
            NUMTP: 'HE',
            MHDRZ: m % 4 === 0 ? 365 : 0,
            MHDLP: m % 4 === 0 ? 180 : 0,
            VPSTA: 'KDEBFLPQSVX',
            PSTAT: 'KDEBFLPQSVX',
            LVORM: '',
            BISMT: '',
            EXTWG: '',
            LABOR: 'LAB1',
            KOSCH: '',
            FERTH: '',
            NORMT: '',
            WRKST: m % 5 === 0 ? 'STEEL' : '',
            SPART: '00',
            TRAGR: '0001',
            LADGR: '0001',
            ERDAT: '20200101',
            ERSDA: '20200101',
            WERKS: werks,
            EKGRP: `0${(m % 3) + 1}`,
            DISMM: m % 2 === 0 ? 'PD' : 'ND',
            DISPO: `D${werks.slice(-2)}`,
            DISLS: 'EX',
            BSTMI: '1',
            BSTMA: '9999',
            BSTFE: '0',
            MABST: '5000',
            MINBE: '100',
            EISBE: '50',
            PLIFZ: m % 2 === 0 ? 5 : 10,
            WEBAZ: 1,
            FHORI: '',
            RWPRO: '',
            BESKZ: m % 3 === 0 ? 'E' : 'F',
            SOBSL: '',
            LGPRO: lgort,
            LGFSB: lgort,
            PERKZ: 'M',
            AUSME: '',
            LOSFX: '0',
            SBDKZ: '',
            FEVOR: `F${werks.slice(-2)}`,
            SFCPF: '',
            SCHGT: '',
            INSMK: '',
            SSQSS: '',
            MISKZ: '',
            XCHPF: m % 4 === 0 ? 'X' : '',
            VRMOD: '',
            VINT1: 30,
            VINT2: 30,
            STRGR: '',
            SERNP: '',
            LGORT: lgort,
            LABST: (Math.random() * 1000).toFixed(0),
            INSME: '0',
            EINME: '0',
            SPEME: '0',
            RETME: '0',
            UMLME: '0',
            KLABS: '0',
            KINSM: '0',
            KEINM: '0',
            KSPEM: '0',
            LFGJA: 2024,
            LFMON: 1 + (m % 12),
            HERKL: 'US',
            HERKR: '',
            MAKTX: `Material ${m} - ${materialTypes[(m - 1) % 5]}`,
            MAKTX_EN: `Material ${m} English`,
            MAKTX_DE: `Material ${m} Deutsch`,
            MAKTX_FR: '',
            MAKTX_ES: '',
            LTEX1: '',
            LTEX2: '',
            LTEX3: '',
            LTEX4: '',
            LTEX5: '',
            CLASS_TYPE: '001',
            CLASS_NUM: `CL_MAT_${materialTypes[(m - 1) % 5]}`,
            CHAR01_VAL: '',
            CHAR02_VAL: '',
            CHAR03_VAL: '',
            CHAR04_VAL: '',
            CHAR05_VAL: '',
            HAZMAT_CLASS: '',
            HAZMAT_NUM: '',
            BATCH_CLASS: '',
          });
        }
      }
    }

    return records; // 25 × 3 × 2 = 150 records
  }
}

module.exports = MaterialMasterMigrationObject;
