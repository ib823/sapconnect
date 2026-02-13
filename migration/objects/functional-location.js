/**
 * Functional Location Migration Object
 *
 * Migrates Functional Locations from ECC (IFLOT/IFLOS)
 * to S/4HANA via API_FUNCTIONALLOCATION_SRV.
 *
 * ~35 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class FunctionalLocationMigrationObject extends BaseMigrationObject {
  get objectId() { return 'FUNCTIONAL_LOCATION'; }
  get name() { return 'Functional Location'; }

  getFieldMappings() {
    return [
      // ── IFLOT - Functional Location Header (15) ─────────────
      { source: 'TPLNR', target: 'FunctionalLocation' },
      { source: 'FLTYP', target: 'FuncLocCategory' },
      { source: 'TXTMI', target: 'FuncLocDescription' },
      { source: 'EESSION_QUI', target: 'EquipmentInstalled' },
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'STORT', target: 'Location' },
      { source: 'BESSION_BER', target: 'PlantSection' },
      { source: 'SESSION_WERK', target: 'MaintenancePlant' },
      { source: 'MSESSION_GRP', target: 'PlannerGroup' },
      { source: 'KOSTL', target: 'CostCenter', convert: 'padLeft10' },
      { source: 'GSESSION_BER', target: 'BusinessArea' },
      { source: 'IESSION_WRK', target: 'MainWorkCenter' },
      { source: 'STRNO', target: 'StructureIndicator' },
      { source: 'EINZL', target: 'SingleInstallation', convert: 'boolYN' },

      // ── IFLOS - Additional attributes (10) ──────────────────
      { source: 'RESSION_BNR', target: 'CatalogProfile' },
      { source: 'ABESSION_CKZ', target: 'ABCIndicator' },
      { source: 'STATUS', target: 'SystemStatus' },
      { source: 'BEGDA', target: 'ValidFrom', convert: 'toDate' },
      { source: 'ENDDA', target: 'ValidTo', convert: 'toDate' },
      { source: 'PESTION_TAT', target: 'IsActive', convert: 'boolYN' },
      { source: 'HESSION_IEQU', target: 'InheritEquipment', convert: 'boolYN' },
      { source: 'TPLMA', target: 'SuperiorFuncLocation' },
      { source: 'USTATUS', target: 'UserStatus' },
      { source: 'GEWRK', target: 'MaintenanceWorkCenter' },

      // ── Classification & organization (5) ───────────────────
      { source: 'KESSION_LAS', target: 'ClassNumber' },
      { source: 'KOKRS', target: 'ControllingArea' },
      { source: 'ERDAT', target: 'CreationDate', convert: 'toDate' },
      { source: 'AEDAT', target: 'LastChangeDate', convert: 'toDate' },
      { source: 'AENAM', target: 'ChangedBy' },

      // ── Metadata ────────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'FUNCTIONAL_LOCATION' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['FunctionalLocation', 'FuncLocCategory', 'FuncLocDescription'],
      exactDuplicate: { keys: ['FunctionalLocation'] },
    };
  }

  _extractMock() {
    const records = [];
    const plants = [
      { id: '1000', code: '1000', company: '1000' },
      { id: '2000', code: '2000', company: '2000' },
    ];

    const areas = [
      { code: 'PR', desc: 'Production Area', section: 'PRODUCTION' },
      { code: 'UT', desc: 'Utilities Area', section: 'UTILITIES' },
      { code: 'WH', desc: 'Warehouse Area', section: 'LOGISTICS' },
    ];

    const lines = [
      { code: 'LN01', desc: 'Line 1' },
      { code: 'LN02', desc: 'Line 2' },
    ];

    const stations = [
      { code: 'ST01', desc: 'Station 1 - Intake' },
      { code: 'ST02', desc: 'Station 2 - Processing' },
    ];

    let counter = 0;

    // Level 1: Plant level functional locations
    for (const plant of plants) {
      counter++;
      const plantFl = `${plant.id}`;
      records.push({
        TPLNR: plantFl,
        FLTYP: 'A',
        TXTMI: `Plant ${plant.id} - Main Location`,
        EESSION_QUI: '',
        BUKRS: plant.company,
        WERKS: plant.code,
        STORT: 'MAIN',
        BESSION_BER: '',
        SESSION_WERK: plant.code,
        MSESSION_GRP: 'MPG01',
        KOSTL: `CC${plant.code.slice(-2)}01`,
        GSESSION_BER: 'BU01',
        IESSION_WRK: `WC-A001`,
        STRNO: 'A',
        EINZL: '',
        RESSION_BNR: 'CP01',
        ABESSION_CKZ: 'A',
        STATUS: 'AVLB',
        BEGDA: '20200101',
        ENDDA: '99991231',
        PESTION_TAT: 'X',
        HESSION_IEQU: 'X',
        TPLMA: '',
        USTATUS: '',
        GEWRK: 'WC-A001',
        KESSION_LAS: 'CL_FL_PLANT',
        KOKRS: '1000',
        ERDAT: '20200101',
        AEDAT: '20240115',
        AENAM: 'MIGRATION',
      });

      // Level 2: Area level
      for (const area of areas) {
        counter++;
        const areaFl = `${plant.id}-${area.code}`;
        records.push({
          TPLNR: areaFl,
          FLTYP: 'A',
          TXTMI: `${area.desc} - Plant ${plant.id}`,
          EESSION_QUI: '',
          BUKRS: plant.company,
          WERKS: plant.code,
          STORT: area.code,
          BESSION_BER: area.section,
          SESSION_WERK: plant.code,
          MSESSION_GRP: 'MPG01',
          KOSTL: `CC${plant.code.slice(-2)}${String(((counter - 1) % 5) + 1).padStart(2, '0')}`,
          GSESSION_BER: 'BU01',
          IESSION_WRK: `WC-A${String(((counter - 1) % 5) + 1).padStart(3, '0')}`,
          STRNO: 'A',
          EINZL: '',
          RESSION_BNR: `CP${String(((counter - 1) % 4) + 1).padStart(2, '0')}`,
          ABESSION_CKZ: 'A',
          STATUS: 'AVLB',
          BEGDA: '20200101',
          ENDDA: '99991231',
          PESTION_TAT: 'X',
          HESSION_IEQU: 'X',
          TPLMA: plantFl,
          USTATUS: '',
          GEWRK: `WC-A${String(((counter - 1) % 5) + 1).padStart(3, '0')}`,
          KESSION_LAS: 'CL_FL_AREA',
          KOKRS: '1000',
          ERDAT: '20200101',
          AEDAT: '20240115',
          AENAM: 'MIGRATION',
        });

        // Level 3: Line level (Production gets 2 lines, Utilities/Warehouse get 1 line)
        if (area.code === 'PR' || area.code === 'UT' || (area.code === 'WH' && plant.id === '1000')) {
          const areaLines = area.code === 'PR' ? lines : [lines[0]];
          const areaStations = area.code === 'PR' ? stations : area.code === 'UT' ? [stations[0]] : [];
          for (const line of areaLines) {
            counter++;
            const lineFl = `${plant.id}-${area.code}-${line.code}`;
            records.push({
              TPLNR: lineFl,
              FLTYP: 'A',
              TXTMI: `${line.desc} - ${area.desc} - Plant ${plant.id}`,
              EESSION_QUI: '',
              BUKRS: plant.company,
              WERKS: plant.code,
              STORT: area.code,
              BESSION_BER: area.section,
              SESSION_WERK: plant.code,
              MSESSION_GRP: `MPG${String(((counter - 1) % 3) + 1).padStart(2, '0')}`,
              KOSTL: `CC${plant.code.slice(-2)}${String(((counter - 1) % 5) + 1).padStart(2, '0')}`,
              GSESSION_BER: 'BU01',
              IESSION_WRK: `WC-M${String(((counter - 1) % 5) + 1).padStart(3, '0')}`,
              STRNO: 'A',
              EINZL: '',
              RESSION_BNR: `CP${String(((counter - 1) % 4) + 1).padStart(2, '0')}`,
              ABESSION_CKZ: 'B',
              STATUS: 'AVLB',
              BEGDA: '20200101',
              ENDDA: '99991231',
              PESTION_TAT: 'X',
              HESSION_IEQU: 'X',
              TPLMA: areaFl,
              USTATUS: '',
              GEWRK: `WC-M${String(((counter - 1) % 5) + 1).padStart(3, '0')}`,
              KESSION_LAS: 'CL_FL_LINE',
              KOKRS: '1000',
              ERDAT: '20200101',
              AEDAT: '20240115',
              AENAM: 'MIGRATION',
            });

            // Level 4: Station level
            for (const station of areaStations) {
              counter++;
              const stationFl = `${plant.id}-${area.code}-${line.code}-${station.code}`;
              records.push({
                TPLNR: stationFl,
                FLTYP: 'A',
                TXTMI: `${station.desc} - ${line.desc} - Plant ${plant.id}`,
                EESSION_QUI: counter % 3 === 0 ? `EQ${String(counter).padStart(8, '0')}` : '',
                BUKRS: plant.company,
                WERKS: plant.code,
                STORT: area.code,
                BESSION_BER: area.section,
                SESSION_WERK: plant.code,
                MSESSION_GRP: `MPG${String(((counter - 1) % 3) + 1).padStart(2, '0')}`,
                KOSTL: `CC${plant.code.slice(-2)}${String(((counter - 1) % 5) + 1).padStart(2, '0')}`,
                GSESSION_BER: 'BU01',
                IESSION_WRK: `WC-M${String(((counter - 1) % 5) + 1).padStart(3, '0')}`,
                STRNO: 'A',
                EINZL: 'X',
                RESSION_BNR: `CP${String(((counter - 1) % 4) + 1).padStart(2, '0')}`,
                ABESSION_CKZ: 'B',
                STATUS: 'AVLB',
                BEGDA: '20200101',
                ENDDA: '99991231',
                PESTION_TAT: 'X',
                HESSION_IEQU: '',
                TPLMA: lineFl,
                USTATUS: '',
                GEWRK: `WC-M${String(((counter - 1) % 5) + 1).padStart(3, '0')}`,
                KESSION_LAS: 'CL_FL_STATION',
                KOKRS: '1000',
                ERDAT: '20200101',
                AEDAT: '20240115',
                AENAM: 'MIGRATION',
              });
            }
          }
        }
      }
    }

    return records; // 25 records in PLANT-AREA-LINE-STATION hierarchy across 2 plants
  }
}

module.exports = FunctionalLocationMigrationObject;
