/**
 * Infor M3 Organizational Structure Migration Object
 *
 * Migrates M3 organizational entities (CMNDIV/CFACIL/CWHOUS)
 * to SAP Enterprise Structure (T001/T001W/T001L).
 *
 * M3 uses:
 *   CMNDIV — divisions (company codes)
 *   CFACIL — facilities (plants)
 *   CWHOUS — warehouses (storage locations)
 *
 * ~14 field mappings. Mock: 15 org entities.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforM3OrgStructureMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_M3_ORG_STRUCTURE'; }
  get name() { return 'Infor M3 Org Structure'; }

  getFieldMappings() {
    return [
      // ── Division / Company code (T001) ───────────────────────
      { source: 'DIVI', target: 'T001-BUKRS' },
      { source: 'DIVNM', target: 'T001-BUTXT' },
      { source: 'CUCD', target: 'T001-WAERS' },
      { source: 'CSCD', target: 'T001-LAND1', convert: 'toUpperCase' },
      { source: 'LNCD', target: 'T001-SPRAS', default: 'EN' },

      // ── Facility / Plant (T001W) ─────────────────────────────
      { source: 'FACI', target: 'T001W-WERKS' },
      { source: 'FACNM', target: 'T001W-NAME1' },
      { source: 'FASTR', target: 'T001W-STRAS' },
      { source: 'FACTY', target: 'T001W-PFACH' },

      // ── Warehouse / Storage location (T001L) ─────────────────
      { source: 'WHLO', target: 'T001L-LGORT' },
      { source: 'WHLNM', target: 'T001L-LGOBE' },

      // ── Controlling area (TKA01) ─────────────────────────────
      { source: 'COAR', target: 'TKA01-KOKRS' },
      { source: 'COARNM', target: 'TKA01-BEZEI' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_M3' },
      { target: 'MigrationObjectId', default: 'INFOR_M3_ORG_STRUCTURE' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['T001-BUKRS', 'T001W-WERKS'],
      exactDuplicate: { keys: ['T001-BUKRS', 'T001W-WERKS', 'T001L-LGORT'] },
    };
  }

  _extractMock() {
    const divisions = [
      { DIVI: 'D1', DIVNM: 'M3 Division North America', CUCD: 'USD', CSCD: 'US' },
      { DIVI: 'D2', DIVNM: 'M3 Division Europe', CUCD: 'EUR', CSCD: 'DE' },
      { DIVI: 'D3', DIVNM: 'M3 Division Asia Pacific', CUCD: 'JPY', CSCD: 'JP' },
    ];

    const facilities = [
      { FACI: 'F01', FACNM: 'Main Factory', FASTR: '100 Manufacturing Ave', FACTY: 'Cleveland' },
      { FACI: 'F02', FACNM: 'Assembly Plant', FASTR: '200 Assembly Dr', FACTY: 'Detroit' },
      { FACI: 'F03', FACNM: 'Distribution Hub', FASTR: '300 Logistics Blvd', FACTY: 'Memphis' },
    ];

    const warehouses = [
      { WHLO: 'WH01', WHLNM: 'Raw Materials Store' },
      { WHLO: 'WH02', WHLNM: 'Finished Goods Store' },
    ];

    const records = [];
    for (const div of divisions) {
      for (const fac of facilities) {
        for (const wh of warehouses) {
          records.push({
            DIVI: div.DIVI,
            DIVNM: div.DIVNM,
            CUCD: div.CUCD,
            CSCD: div.CSCD,
            LNCD: 'EN',
            FACI: fac.FACI,
            FACNM: fac.FACNM,
            FASTR: fac.FASTR,
            FACTY: fac.FACTY,
            WHLO: wh.WHLO,
            WHLNM: wh.WHLNM,
            COAR: div.DIVI === 'D1' ? '1000' : div.DIVI === 'D2' ? '2000' : '3000',
            COARNM: `${div.DIVNM} Controlling`,
          });
        }
      }
    }

    return records; // 3 divisions x 3 facilities x 2 warehouses = 18 records
  }
}

module.exports = InforM3OrgStructureMigrationObject;
