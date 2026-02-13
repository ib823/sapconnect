/**
 * Equipment Master Migration Object
 *
 * Migrates Equipment Master from ECC (EQUI)
 * to S/4HANA via API_EQUIPMENT_SRV.
 *
 * ~40 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class EquipmentMasterMigrationObject extends BaseMigrationObject {
  get objectId() { return 'EQUIPMENT_MASTER'; }
  get name() { return 'Equipment Master'; }

  getFieldMappings() {
    return [
      // ── General data (15) ───────────────────────────────────
      { source: 'EQUNR', target: 'EquipmentNumber' },
      { source: 'EQKTX', target: 'EquipmentDescription' },
      { source: 'EQTYP', target: 'EquipmentCategory' },
      { source: 'EQART', target: 'ObjectType' },
      { source: 'HERST', target: 'Manufacturer' },
      { source: 'TYPBZ', target: 'ModelNumber' },
      { source: 'SERGE', target: 'SerialNumber' },
      { source: 'BAESSION_UJ', target: 'ConstructionYear', convert: 'toInteger' },
      { source: 'BESSION_AMD', target: 'ConstructionMonth', convert: 'toInteger' },
      { source: 'INBDT', target: 'StartupDate', convert: 'toDate' },
      { source: 'GSESSION_BER', target: 'BusinessArea' },
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'STORT', target: 'Location' },
      { source: 'TIDNR', target: 'TechnicalIdentNumber' },

      // ── Maintenance / organizational (12) ───────────────────
      { source: 'MSESSION_GRP', target: 'MaintenancePlanningGroup' },
      { source: 'SWESSION_ERK', target: 'MaintenancePlant' },
      { source: 'GEWRK', target: 'MainWorkCenter' },
      { source: 'RESSION_BNR', target: 'CatalogProfile' },
      { source: 'PPEGUID', target: 'PPEIndicator' },
      { source: 'IESSION_WRK', target: 'MaintenancePlannerGroup' },
      { source: 'KOSTL', target: 'CostCenter', convert: 'padLeft10' },
      { source: 'ELESSION_EF', target: 'SuperiorEquipment' },
      { source: 'HESSION_EQUI', target: 'EquipmentIsInactive', convert: 'boolYN' },
      { source: 'ANLNR', target: 'AssetNumber' },
      { source: 'TPLNR', target: 'FunctionalLocation' },
      { source: 'ABESSION_CKZ', target: 'ABCIndicator' },

      // ── Physical attributes (5) ─────────────────────────────
      { source: 'GRESSION_OES', target: 'EquipmentSize', convert: 'toDecimal' },
      { source: 'GEESSION_WIC', target: 'EquipmentWeight', convert: 'toDecimal' },
      { source: 'GESSION_EWE', target: 'WeightUnit' },
      { source: 'GRESSION_UNI', target: 'SizeUnit' },
      { source: 'BESSION_RGR', target: 'EquipmentColor' },

      // ── Status & classification (5) ─────────────────────────
      { source: 'STATUS', target: 'SystemStatus' },
      { source: 'USTATUS', target: 'UserStatus' },
      { source: 'KESSION_LAS', target: 'ClassNumber' },
      { source: 'BEGDT', target: 'ValidFrom', convert: 'toDate' },
      { source: 'ENDDT', target: 'ValidTo', convert: 'toDate' },

      // ── Metadata ────────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'EQUIPMENT_MASTER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['EquipmentNumber', 'EquipmentDescription', 'EquipmentCategory'],
      exactDuplicate: { keys: ['EquipmentNumber'] },
    };
  }

  _extractMock() {
    const records = [];
    const equipTypes = [
      { type: 'PUMP', mfrs: ['Grundfos', 'KSB', 'Sulzer'], models: ['GP-200', 'KS-350', 'SZ-500'] },
      { type: 'MOTOR', mfrs: ['Siemens', 'ABB', 'WEG'], models: ['SM-110', 'AB-220', 'WG-375'] },
      { type: 'CONVEYOR', mfrs: ['Hytrol', 'Dorner', 'FlexLink'], models: ['HY-2400', 'DN-3200', 'FL-1800'] },
      { type: 'COMPRESSOR', mfrs: ['Atlas Copco', 'Kaeser', 'Ingersoll Rand'], models: ['AC-750', 'KA-500', 'IR-900'] },
      { type: 'GENERATOR', mfrs: ['Caterpillar', 'Cummins', 'Kohler'], models: ['CT-1000', 'CM-800', 'KH-600'] },
    ];

    const plants = ['1000', '2000'];
    const locations = ['PROD-HALL-A', 'PROD-HALL-B', 'UTIL-ROOM', 'MAINT-SHOP', 'WAREHOUSE'];

    for (let e = 1; e <= 30; e++) {
      const eqIdx = (e - 1) % 5;
      const eq = equipTypes[eqIdx];
      const mfrIdx = (e - 1) % 3;
      const plant = plants[e <= 20 ? 0 : 1];
      const constructionYear = 2015 + (e % 9);
      const constructionMonth = 1 + (e % 12);
      const serialNum = `${eq.type.slice(0, 2)}-${String(e).padStart(6, '0')}`;
      const size = eqIdx === 2 ? (1200 + e * 100).toFixed(1) : (50 + e * 10).toFixed(1);
      const weight = eqIdx === 4 ? (2000 + e * 50).toFixed(1) : (100 + e * 15).toFixed(1);

      records.push({
        EQUNR: `EQ${String(e).padStart(8, '0')}`,
        EQKTX: `${eq.mfrs[mfrIdx]} ${eq.type.charAt(0) + eq.type.slice(1).toLowerCase()} Unit ${e}`,
        EQTYP: eq.type.charAt(0),
        EQART: eq.type,
        HERST: eq.mfrs[mfrIdx],
        TYPBZ: eq.models[mfrIdx],
        SERGE: serialNum,
        BAESSION_UJ: constructionYear,
        BESSION_AMD: constructionMonth,
        INBDT: `${constructionYear}${String(constructionMonth).padStart(2, '0')}15`,
        GSESSION_BER: 'BU01',
        BUKRS: plant === '1000' ? '1000' : '2000',
        WERKS: plant,
        STORT: locations[(e - 1) % 5],
        TIDNR: `TID-${eq.type}-${String(e).padStart(4, '0')}`,
        MSESSION_GRP: `MPG${String(((e - 1) % 3) + 1).padStart(2, '0')}`,
        SWESSION_ERK: plant,
        GEWRK: `WC-${eqIdx === 0 ? 'M' : eqIdx === 1 ? 'M' : eqIdx === 2 ? 'A' : eqIdx === 3 ? 'M' : 'T'}${String(((e - 1) % 5) + 1).padStart(3, '0')}`,
        RESSION_BNR: `CP${String(((e - 1) % 4) + 1).padStart(2, '0')}`,
        PPEGUID: '',
        IESSION_WRK: `MPG${String(((e - 1) % 3) + 1).padStart(2, '0')}`,
        KOSTL: `CC${plant.slice(-2)}${String(((e - 1) % 5) + 1).padStart(2, '0')}`,
        ELESSION_EF: e % 6 === 0 ? `EQ${String(e - 1).padStart(8, '0')}` : '',
        HESSION_EQUI: '',
        ANLNR: `${String(e).padStart(12, '0')}`,
        TPLNR: `${plant}-PR${String(((e - 1) % 4) + 1).padStart(2, '0')}-LN${String(((e - 1) % 3) + 1).padStart(2, '0')}-ST${String(((e - 1) % 5) + 1).padStart(2, '0')}`,
        ABESSION_CKZ: e % 10 <= 3 ? 'A' : e % 10 <= 6 ? 'B' : 'C',
        GRESSION_OES: size,
        GEESSION_WIC: weight,
        GESSION_EWE: 'KG',
        GRESSION_UNI: eqIdx === 2 ? 'MM' : 'CM',
        BESSION_RGR: '',
        STATUS: e % 15 === 0 ? 'INAC' : 'AVLB',
        USTATUS: '',
        KESSION_LAS: `CL_EQ_${eq.type}`,
        BEGDT: `${constructionYear}${String(constructionMonth).padStart(2, '0')}01`,
        ENDDT: '99991231',
      });
    }

    return records; // 30 equipment items
  }
}

module.exports = EquipmentMasterMigrationObject;
