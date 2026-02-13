/**
 * Inspection Plan Migration Object
 *
 * Migrates Inspection Plans from ECC (PLKO/PLPO/PLMK)
 * to S/4HANA.
 *
 * ~40 field mappings: 15 header (PLKO) + 15 operation (PLPO) + 10 characteristics (PLMK).
 */

const BaseMigrationObject = require('./base-migration-object');

class InspectionPlanMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INSPECTION_PLAN'; }
  get name() { return 'Inspection Plan'; }

  getFieldMappings() {
    return [
      // ── Header (PLKO) — 15 ────────────────────────────────
      { source: 'PLNTY', target: 'TaskListType' },
      { source: 'PLNNR', target: 'TaskListGroup' },
      { source: 'PLNAL', target: 'TaskListGroupCounter' },
      { source: 'KTEXT', target: 'TaskListDescription' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'VERWE', target: 'TaskListUsage' },
      { source: 'STATU', target: 'TaskListStatus' },
      { source: 'LOESSION_KZ', target: 'IsDeleted', convert: 'boolYN' },
      { source: 'MATNR', target: 'Material', convert: 'padLeft40' },
      { source: 'DAESSION_TU', target: 'KeyDate', convert: 'toDate' },
      { source: 'ANESSION_DT', target: 'ChangeDate', convert: 'toDate' },
      { source: 'ANESSION_NM', target: 'ChangedBy' },
      { source: 'SLWBEZ', target: 'SampleProcedure' },
      { source: 'STICHPROBE', target: 'SamplingScheme' },
      { source: 'DYNPR', target: 'DynamicModificationRule' },

      // ── Operations (PLPO) — 15 ────────────────────────────
      { source: 'VESSION_ORNR', target: 'OperationNumber' },
      { source: 'LTXA1', target: 'OperationDescription' },
      { source: 'ARBPL', target: 'WorkCenter' },
      { source: 'STEUS', target: 'ControlKey' },
      { source: 'VGW01', target: 'StandardValue1', convert: 'toDecimal' },
      { source: 'VGW02', target: 'StandardValue2', convert: 'toDecimal' },
      { source: 'VGE01', target: 'Unit1' },
      { source: 'VGE02', target: 'Unit2' },
      { source: 'PRZNT', target: 'PercentageScrap', convert: 'toDecimal' },
      { source: 'QKZESSION', target: 'QualityRelevant', convert: 'boolYN' },
      { source: 'PRUESSION_FG', target: 'InspectionType' },
      { source: 'USERC01', target: 'OperationUserField1' },
      { source: 'USERC02', target: 'OperationUserField2' },
      { source: 'INESSION_FOLD', target: 'InspectionFolder' },
      { source: 'ZUESSION_NR', target: 'SequenceNumber' },

      // ── Characteristics (PLMK) — 10 ──────────────────────
      { source: 'MKMNR', target: 'CharacteristicNumber' },
      { source: 'VERWMERKM', target: 'MasterInspCharacteristic' },
      { source: 'KUESSION_ZT', target: 'CharacteristicText' },
      { source: 'QMTB_ART', target: 'CharacteristicType' },
      { source: 'SESSION_OLL', target: 'TargetValue', convert: 'toDecimal' },
      { source: 'TOESSION_LO', target: 'UpperLimit', convert: 'toDecimal' },
      { source: 'TOESSION_LU', target: 'LowerLimit', convert: 'toDecimal' },
      { source: 'MEESSION_INH', target: 'UnitOfMeasure' },
      { source: 'STICHPR', target: 'SampleSize', convert: 'toInteger' },
      { source: 'AUESSION_SW', target: 'Valuation' },

      // ── Metadata ───────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'INSPECTION_PLAN' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['TaskListGroup', 'TaskListDescription', 'Plant'],
      exactDuplicate: { keys: ['TaskListGroup', 'TaskListGroupCounter', 'OperationNumber', 'CharacteristicNumber'] },
    };
  }

  _extractMock() {
    const records = [];
    const plans = [
      { nr: 'QP001', desc: 'Incoming Inspection - Raw Materials', mat: 'MAT00001', usage: '5' },
      { nr: 'QP002', desc: 'In-Process Inspection - Assembly', mat: 'MAT00003', usage: '5' },
      { nr: 'QP003', desc: 'Final Inspection - Finished Goods', mat: 'MAT00005', usage: '5' },
      { nr: 'QP004', desc: 'Vendor Quality Audit', mat: '', usage: '6' },
      { nr: 'QP005', desc: 'Periodic Calibration Check', mat: '', usage: '6' },
    ];

    const ops = [
      { nr: '0010', desc: 'Visual Inspection', wc: 'QC-01', key: 'QM01' },
      { nr: '0020', desc: 'Dimensional Check', wc: 'QC-02', key: 'QM01' },
      { nr: '0030', desc: 'Functional Test', wc: 'QC-03', key: 'QM02' },
    ];

    const chars = [
      { nr: '001', text: 'Surface Quality', type: 'Q', target: 0, upper: 0, lower: 0, unit: '' },
      { nr: '002', text: 'Length (mm)', type: 'M', target: 100, upper: 100.5, lower: 99.5, unit: 'MM' },
      { nr: '003', text: 'Weight (g)', type: 'M', target: 250, upper: 252, lower: 248, unit: 'G' },
    ];

    for (const plan of plans) {
      for (const op of ops) {
        for (const ch of chars) {
          records.push({
            PLNTY: 'Q',
            PLNNR: plan.nr,
            PLNAL: '01',
            KTEXT: plan.desc,
            WERKS: '1000',
            VERWE: plan.usage,
            STATU: '4', // Released
            LOESSION_KZ: '',
            MATNR: plan.mat,
            DAESSION_TU: '20240101',
            ANESSION_DT: '20240115',
            ANESSION_NM: 'QUALITYMGR',
            SLWBEZ: 'SP01',
            STICHPROBE: '',
            DYNPR: '',
            VESSION_ORNR: op.nr,
            LTXA1: op.desc,
            ARBPL: op.wc,
            STEUS: op.key,
            VGW01: '0.50',
            VGW02: '0',
            VGE01: 'H',
            VGE02: '',
            PRZNT: '0',
            QKZESSION: 'X',
            PRUESSION_FG: '01',
            USERC01: '',
            USERC02: '',
            INESSION_FOLD: '',
            ZUESSION_NR: '',
            MKMNR: ch.nr,
            VERWMERKM: `MIC-${ch.nr}`,
            KUESSION_ZT: ch.text,
            QMTB_ART: ch.type,
            SESSION_OLL: String(ch.target),
            TOESSION_LO: String(ch.upper),
            TOESSION_LU: String(ch.lower),
            MEESSION_INH: ch.unit,
            STICHPR: '5',
            AUESSION_SW: '',
          });
        }
      }
    }

    return records; // 5 plans × 3 ops × 3 chars = 45 records
  }
}

module.exports = InspectionPlanMigrationObject;
