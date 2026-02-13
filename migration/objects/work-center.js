/**
 * Work Center Migration Object
 *
 * Migrates Work Centers from ECC (CRHD/CRCO)
 * to S/4HANA via API_WORK_CENTER_SRV.
 *
 * ~35 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class WorkCenterMigrationObject extends BaseMigrationObject {
  get objectId() { return 'WORK_CENTER'; }
  get name() { return 'Work Center'; }

  getFieldMappings() {
    return [
      // ── CRHD - Work Center Header (20) ──────────────────────
      { source: 'OBJID', target: 'WorkCenterInternalID' },
      { source: 'ARBPL', target: 'WorkCenterNumber' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'VERWE', target: 'WorkCenterCategoryCode' },
      { source: 'KTEXT', target: 'WorkCenterDescription' },
      { source: 'VEESSION_ANT', target: 'PersonResponsible' },
      { source: 'VGWTS', target: 'StandardValueKey' },
      { source: 'KAPID', target: 'CapacityID' },
      { source: 'LANTU', target: 'LaborCapacity', convert: 'toDecimal' },
      { source: 'MASEU', target: 'CapacityUnitOfMeasure' },
      { source: 'FORESSION_ML', target: 'FormulaKey' },
      { source: 'STESSION_EUE', target: 'ControlKey' },

      // ── CRCO - Work Center Cost Assignment (10) ─────────────
      { source: 'KOSTL', target: 'CostCenter', convert: 'padLeft10' },
      { source: 'LESSION_TAR', target: 'ActivityType' },
      { source: 'PESSION_LKZ', target: 'PlannerGroup' },
      { source: 'TESSION_XIS', target: 'SetupTimeKey' },
      { source: 'ARBEI', target: 'ProcessingTimeKey' },
      { source: 'RUESSION_EST', target: 'RestTime' },
      { source: 'ANESSION_BR', target: 'TeardownKey' },
      { source: 'LOESSION_GKZ', target: 'LocationKey' },

      // ── Capacity & scheduling (10) ──────────────────────────
      { source: 'SPESSION_ACE', target: 'AvailableCapacity', convert: 'toDecimal' },
      { source: 'BEGDA', target: 'ValidFrom', convert: 'toDate' },
      { source: 'ENDDA', target: 'ValidTo', convert: 'toDate' },
      { source: 'CRESSION_EW', target: 'WorkCenterType' },
      { source: 'STATUS', target: 'WorkCenterStatus' },
      { source: 'BUKRS', target: 'CompanyCode' },

      // ── Defaults / derived fields (5) ───────────────────────
      { source: 'KOKRS', target: 'ControllingArea' },
      { source: 'SPRAS', target: 'Language', convert: 'toUpperCase' },
      { source: 'ERDAT', target: 'CreationDate', convert: 'toDate' },
      { source: 'AEDAT', target: 'LastChangeDate', convert: 'toDate' },
      { source: 'AENAM', target: 'ChangedBy' },

      // ── Metadata ────────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'WORK_CENTER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['WorkCenterNumber', 'Plant', 'WorkCenterCategoryCode'],
      exactDuplicate: { keys: ['WorkCenterNumber', 'Plant'] },
    };
  }

  _extractMock() {
    const records = [];
    const plants = ['1000', '2000'];
    const categories = [
      { code: 'A', type: 'ASSEMBLY', names: ['Assembly Line 1', 'Assembly Line 2', 'Assembly Line 3', 'Assembly Cell A', 'Assembly Cell B'] },
      { code: 'M', type: 'MACHINING', names: ['CNC Milling Center', 'CNC Lathe Station', 'Drill Press Bay', 'Grinding Station', 'Boring Mill'] },
      { code: 'T', type: 'TESTING', names: ['Quality Test Lab', 'Stress Test Cell', 'Calibration Bench', 'Environmental Chamber', 'NDT Station'] },
      { code: 'P', type: 'PACKAGING', names: ['Pack Line 1', 'Pack Line 2', 'Palletizing Station', 'Labeling Station', 'Shrink Wrap Cell'] },
      { code: 'S', type: 'PAINTING', names: ['Paint Booth 1', 'Paint Booth 2', 'Powder Coat Line', 'Drying Oven', 'Surface Prep Station'] },
    ];

    let wcCounter = 0;
    for (const plant of plants) {
      for (const cat of categories) {
        const namesForPlant = plant === '1000' ? cat.names.slice(0, 3) : cat.names.slice(0, 2);
        for (let n = 0; n < namesForPlant.length; n++) {
          wcCounter++;
          const wcNum = `WC-${cat.code}${String(wcCounter).padStart(3, '0')}`;
          const laborCap = (80 + Math.floor(Math.random() * 20)).toFixed(1);
          const availCap = (160 + Math.floor(Math.random() * 80)).toFixed(1);

          records.push({
            OBJID: String(10000 + wcCounter),
            ARBPL: wcNum,
            WERKS: plant,
            VERWE: `00${cat.code === 'A' ? '01' : cat.code === 'M' ? '02' : cat.code === 'T' ? '03' : cat.code === 'P' ? '04' : '05'}`,
            KTEXT: namesForPlant[n],
            VEESSION_ANT: `WC_MGR_${plant.slice(-2)}${String(n + 1).padStart(2, '0')}`,
            VGWTS: `SAP${String(((wcCounter - 1) % 6) + 1).padStart(3, '0')}`,
            KAPID: `KAP-${wcNum}`,
            LANTU: laborCap,
            MASEU: 'H',
            FORESSION_ML: `FML${String(((wcCounter - 1) % 3) + 1).padStart(3, '0')}`,
            STESSION_EUE: cat.code === 'T' ? 'QM01' : 'PP01',
            KOSTL: `CC${plant.slice(-2)}${String(((wcCounter - 1) % 5) + 1).padStart(2, '0')}`,
            LESSION_TAR: `LAT${String(((wcCounter - 1) % 4) + 1).padStart(3, '0')}`,
            PESSION_LKZ: `PG${String(((wcCounter - 1) % 3) + 1).padStart(2, '0')}`,
            TESSION_XIS: cat.code === 'M' ? 'STK01' : '',
            ARBEI: `PTK${String(((wcCounter - 1) % 4) + 1).padStart(2, '0')}`,
            RUESSION_EST: cat.code === 'A' ? '15' : cat.code === 'M' ? '30' : '10',
            ANESSION_BR: cat.code === 'M' ? 'TDK01' : '',
            LOESSION_GKZ: `LOC-${plant}-${String(((wcCounter - 1) % 4) + 1).padStart(2, '0')}`,
            SPESSION_ACE: availCap,
            BEGDA: '20200101',
            ENDDA: '99991231',
            CRESSION_EW: cat.type,
            STATUS: 'ACTIVE',
            BUKRS: plant === '1000' ? '1000' : '2000',
            KOKRS: '1000',
            SPRAS: 'EN',
            ERDAT: '20200101',
            AEDAT: '20240115',
            AENAM: 'MIGRATION',
          });
        }
      }
    }

    return records; // 2 plants × (3+3+3+3+3 + 2+2+2+2+2) = 25 records
  }
}

module.exports = WorkCenterMigrationObject;
