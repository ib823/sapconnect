/**
 * Infor LN Organizational Structure Migration Object
 *
 * Migrates LN organizational entities (tcemm100/tcemm120/tcemm130)
 * to SAP Enterprise Structure (T001/T001W/T001L/T001K).
 *
 * Key transforms:
 * - Financial company (fcmp) maps to T001-BUKRS
 * - Warehouse (cwar) maps to T001W-WERKS
 * - Location (lwar) maps to T001L-LGORT
 *
 * ~14 field mappings. Mock: 18 org entities.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforLNOrgStructureMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_LN_ORG_STRUCTURE'; }
  get name() { return 'LN Org Structure to SAP Enterprise Structure'; }

  getFieldMappings() {
    return [
      // ── Company code (T001) ───────────────────────────────────
      { source: 'fcmp', target: 'T001-BUKRS' },
      { source: 'fcmp_desc', target: 'T001-BUTXT' },
      { source: 'curr', target: 'T001-WAERS' },
      { source: 'ccty', target: 'T001-LAND1', convert: 'toUpperCase' },
      { source: 'lnge', target: 'T001-SPRAS', default: 'EN' },

      // ── Plant (T001W) ─────────────────────────────────────────
      { source: 'cwar', target: 'T001W-WERKS' },
      { source: 'cwar_desc', target: 'T001W-NAME1' },
      { source: 'cwar_addr', target: 'T001W-STRAS' },
      { source: 'cwar_city', target: 'T001W-PFACH' },

      // ── Storage location (T001L) ──────────────────────────────
      { source: 'lwar', target: 'T001L-LGORT' },
      { source: 'lwar_desc', target: 'T001L-LGOBE' },

      // ── Controlling area (TKA01) ──────────────────────────────
      { source: 'coa_area', target: 'TKA01-KOKRS' },
      { source: 'coa_desc', target: 'TKA01-BEZEI' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_LN' },
      { target: 'MigrationObjectId', default: 'INFOR_LN_ORG_STRUCTURE' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['T001-BUKRS', 'T001W-WERKS'],
      exactDuplicate: { keys: ['T001-BUKRS', 'T001W-WERKS', 'T001L-LGORT'] },
    };
  }

  _extractMock() {
    const companies = [
      { fcmp: '100', fcmp_desc: 'LN Corp USA', curr: 'USD', ccty: 'US' },
      { fcmp: '200', fcmp_desc: 'LN Corp Europe', curr: 'EUR', ccty: 'DE' },
    ];

    const plants = [
      { cwar: '1000', cwar_desc: 'Main Manufacturing', cwar_addr: '100 Industrial Blvd', cwar_city: 'Chicago' },
      { cwar: '2000', cwar_desc: 'Secondary Plant', cwar_addr: '500 Factory Lane', cwar_city: 'Detroit' },
      { cwar: '3000', cwar_desc: 'Distribution Center', cwar_addr: '200 Logistics Way', cwar_city: 'Dallas' },
    ];

    const slocs = [
      { lwar: '0001', lwar_desc: 'General Storage' },
      { lwar: '0002', lwar_desc: 'Quality Inspection' },
      { lwar: '0003', lwar_desc: 'Shipping Area' },
    ];

    const records = [];
    for (const co of companies) {
      for (const pl of plants) {
        for (const sl of slocs) {
          records.push({
            fcmp: co.fcmp,
            fcmp_desc: co.fcmp_desc,
            curr: co.curr,
            ccty: co.ccty,
            lnge: 'EN',
            cwar: pl.cwar,
            cwar_desc: pl.cwar_desc,
            cwar_addr: pl.cwar_addr,
            cwar_city: pl.cwar_city,
            lwar: sl.lwar,
            lwar_desc: sl.lwar_desc,
            coa_area: co.fcmp === '100' ? '1000' : '2000',
            coa_desc: co.fcmp === '100' ? 'US Controlling Area' : 'EU Controlling Area',
          });
        }
      }
    }

    return records; // 2 companies x 3 plants x 3 slocs = 18 records
  }
}

module.exports = InforLNOrgStructureMigrationObject;
