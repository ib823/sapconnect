/**
 * Batch Master Migration Object
 *
 * Migrates Batch Master data from ECC (MCH1/MCHA)
 * to S/4HANA Batch via API_BATCH_SRV.
 *
 * ~30 field mappings covering batch identification, stock quantities,
 * shelf-life dates, and classification fields.
 * MATNR extended from 18 to 40 chars via padLeft40.
 */

const BaseMigrationObject = require('./base-migration-object');

class BatchMasterMigrationObject extends BaseMigrationObject {
  get objectId() { return 'BATCH_MASTER'; }
  get name() { return 'Batch Master'; }

  getFieldMappings() {
    return [
      // ── Batch identification (MCH1) — 8 ─────────────────────
      { source: 'MATNR', target: 'Material', convert: 'padLeft40' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'CHARG', target: 'BatchNumber' },
      { source: 'ERDAT', target: 'CreatedDate', convert: 'toDate' },
      { source: 'ERNAM', target: 'CreatedBy' },
      { source: 'ZUESSION_STD', target: 'BatchStatus' },
      { source: 'FESSION_ISTX', target: 'BatchDescription' },
      { source: 'LGORT', target: 'StorageLocation' },

      // ── Shelf-life / date fields — 4 ────────────────────────
      { source: 'HSDAT', target: 'ManufactureDate', convert: 'toDate' },
      { source: 'VFDAT', target: 'ShelfLifeExpDate', convert: 'toDate' },
      { source: 'VEESSION_RAB', target: 'AvailableFrom', convert: 'toDate' },
      { source: 'VEESSION_RBE', target: 'AvailableTo', convert: 'toDate' },

      // ── Stock quantity fields (MCHA/MCHB) — 3 ──────────────
      { source: 'CLABS', target: 'UnrestrictedStock', convert: 'toDecimal' },
      { source: 'CINSM', target: 'QualityInspStock', convert: 'toDecimal' },
      { source: 'CSPEM', target: 'BlockedStock', convert: 'toDecimal' },

      // ── Classification / origin fields — 7 ──────────────────
      { source: 'LIESSION_FNR', target: 'Supplier' },
      { source: 'HERKUNFT', target: 'CountryOfOrigin' },
      { source: 'ZESSION_USTAN', target: 'BatchCondition' },
      { source: 'MEINS', target: 'BaseUnitOfMeasure' },
      { source: 'BWTAR', target: 'ValuationType' },
      { source: 'HESSION_RKL', target: 'RegionOfOrigin' },
      { source: 'KESSION_LASS', target: 'BatchClass' },

      // ── User / custom fields — 5 ────────────────────────────
      { source: 'CUESSION_SOBJ', target: 'ClassificationObject' },
      { source: 'MCH1_AESSION_DAT', target: 'LastChangeDate', convert: 'toDate' },
      { source: 'MCH1_AESSION_NAM', target: 'ChangedBy' },
      { source: 'LOESSION_KZ', target: 'IsDeleted', convert: 'boolYN' },
      { source: 'LVESSION_ORM', target: 'IsMarkedForDeletion', convert: 'boolYN' },

      // ── Metadata ───────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'BATCH_MASTER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['Material', 'BatchNumber', 'Plant'],
      exactDuplicate: { keys: ['Material', 'BatchNumber', 'Plant'] },
    };
  }

  _extractMock() {
    const records = [];
    const materials = [
      'PHARMA-API-001', 'PHARMA-EXC-002', 'CHEM-SOL-003',
      'FOOD-FLV-004', 'COSM-BAS-005',
    ];
    const plants = ['1000', '2000', '3000'];
    const storageLocations = ['0001', '0002'];
    const suppliers = ['VENDOR-001', 'VENDOR-002', 'VENDOR-003'];
    const countries = ['US', 'DE', 'CN', 'IN', 'JP'];
    const conditions = ['NEW', 'REWORK', 'STANDARD'];
    const statuses = ['UNRES', 'RESTR', 'QUAL'];

    let count = 0;
    for (let m = 0; m < materials.length; m++) {
      const batchCount = 7; // 7 batches per material = 35 total
      for (let b = 1; b <= batchCount; b++) {
        count++;
        const plant = plants[b % 3];
        const sloc = storageLocations[b % 2];
        const batchAge = b * 30; // days back from "today"
        const mfgMonth = String(1 + ((b + m) % 12)).padStart(2, '0');
        const expMonth = String(1 + ((b + m + 6) % 12)).padStart(2, '0');
        const hasExpiry = m < 3; // first 3 materials are shelf-life managed

        records.push({
          MATNR: materials[m],
          WERKS: plant,
          CHARG: `B${String(2024).slice(-2)}${String(m + 1).padStart(2, '0')}${String(b).padStart(4, '0')}`,
          ERDAT: `2024${mfgMonth}01`,
          ERNAM: 'BATCHMGR',
          ZUESSION_STD: statuses[b % 3],
          FESSION_ISTX: `Batch ${b} of ${materials[m]}`,
          LGORT: sloc,
          HSDAT: `2024${mfgMonth}01`,
          VFDAT: hasExpiry ? `2025${expMonth}28` : '',
          VEESSION_RAB: `2024${mfgMonth}02`,
          VEESSION_RBE: hasExpiry ? `2025${expMonth}27` : '',
          CLABS: String(Math.floor(100 + Math.random() * 900)),
          CINSM: b % 4 === 0 ? String(Math.floor(10 + Math.random() * 50)) : '0',
          CSPEM: b % 5 === 0 ? String(Math.floor(5 + Math.random() * 20)) : '0',
          LIESSION_FNR: suppliers[m % 3],
          HERKUNFT: countries[m % 5],
          ZESSION_USTAN: conditions[b % 3],
          MEINS: m < 2 ? 'KG' : m === 2 ? 'L' : 'EA',
          BWTAR: b % 3 === 0 ? 'BATCH' : '',
          HESSION_RKL: '',
          KESSION_LASS: `CL_BATCH_${String(m + 1).padStart(2, '0')}`,
          CUESSION_SOBJ: '',
          MCH1_AESSION_DAT: `2024${mfgMonth}15`,
          MCH1_AESSION_NAM: 'BATCHMGR',
          LOESSION_KZ: '',
          LVESSION_ORM: '',
        });
      }
    }

    return records; // 5 materials x 7 batches = 35 records
  }
}

module.exports = BatchMasterMigrationObject;
