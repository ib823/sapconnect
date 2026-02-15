/**
 * Infor LN Bill of Materials Migration Object
 *
 * Migrates LN BOMs (tipcf001/tipcf002) to SAP BOM
 * (STKO/STPO).
 *
 * Key transforms:
 * - Parent item maps to STKO-MATNR
 * - Component items map to STPO-IDNRK
 * - Quantity per assembly maps to STPO-MENGE
 *
 * ~15 field mappings. Mock: 8 BOMs with 25 components.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforLNBOMMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_LN_BOM'; }
  get name() { return 'LN BOM to SAP Bill of Materials'; }

  getFieldMappings() {
    return [
      // ── Header fields (STKO) ──────────────────────────────────
      { source: 'mitm', target: 'STKO-MATNR', convert: 'toUpperCase' },
      { source: 'cwar', target: 'STKO-WERKS' },
      { source: 'bvar', target: 'STKO-STLAL', default: '01' },
      { source: 'bqua', target: 'STKO-BMENG', convert: 'toDecimal', default: '1' },
      { source: 'cuni', target: 'STKO-BMEIN' },
      { source: 'efdt', target: 'STKO-DATEFROM', convert: 'toDate' },
      { source: 'stus', target: 'STKO-STLST', default: '1' },

      // ── Component fields (STPO) ──────────────────────────────
      { source: 'pono', target: 'STPO-POSNR', convert: 'padLeft4' },
      { source: 'citm', target: 'STPO-IDNRK', convert: 'toUpperCase' },
      { source: 'cqty', target: 'STPO-MENGE', convert: 'toDecimal' },
      { source: 'cuni_c', target: 'STPO-MEINS' },
      { source: 'scrap', target: 'STPO-AUSCH', convert: 'toDecimal' },
      { source: 'itca', target: 'STPO-POSTP', valueMap: {
        'NOR': 'L', 'PHN': 'N', 'TXT': 'T', 'SUB': 'L',
      }, default: 'L' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_LN' },
      { target: 'MigrationObjectId', default: 'INFOR_LN_BOM' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['STKO-MATNR', 'STKO-WERKS', 'STPO-IDNRK', 'STPO-MENGE'],
      exactDuplicate: { keys: ['STKO-MATNR', 'STKO-WERKS', 'STKO-STLAL', 'STPO-POSNR'] },
    };
  }

  _extractMock() {
    const records = [];
    const parents = [
      { mitm: 'FG-30001', cwar: '1000', bqua: '1', cuni: 'ea' },
      { mitm: 'FG-30002', cwar: '1000', bqua: '1', cuni: 'ea' },
      { mitm: 'FG-30003', cwar: '2000', bqua: '1', cuni: 'ea' },
      { mitm: 'FG-30004', cwar: '1000', bqua: '1', cuni: 'ea' },
      { mitm: 'SF-20001', cwar: '1000', bqua: '1', cuni: 'ea' },
      { mitm: 'SF-20002', cwar: '1000', bqua: '1', cuni: 'ea' },
      { mitm: 'SF-20003', cwar: '2000', bqua: '1', cuni: 'ea' },
      { mitm: 'FG-30001', cwar: '2000', bqua: '1', cuni: 'ea' },
    ];

    const components = [
      ['RM-10001', 'RM-10002', 'SF-20001'],
      ['RM-10003', 'SF-20002', 'RM-10004'],
      ['SF-20001', 'SF-20003', 'RM-10005', 'RM-10001'],
      ['SF-20001', 'SF-20002', 'SF-20003', 'RM-10003'],
      ['RM-10001', 'RM-10002'],
      ['RM-10003', 'RM-10004', 'RM-10005'],
      ['RM-10001', 'RM-10002', 'RM-10004'],
      ['RM-10001', 'SF-20001', 'RM-10005'],
    ];

    for (let h = 0; h < parents.length; h++) {
      const p = parents[h];
      const comps = components[h];
      for (let c = 0; c < comps.length; c++) {
        records.push({
          mitm: p.mitm,
          cwar: p.cwar,
          bvar: '01',
          bqua: p.bqua,
          cuni: p.cuni,
          efdt: '20240101',
          stus: '1',
          pono: String((c + 1) * 10),
          citm: comps[c],
          cqty: (Math.random() * 10 + 1).toFixed(2),
          cuni_c: 'ea',
          scrap: c === 0 ? '2.0' : '0',
          itca: 'NOR',
        });
      }
    }

    return records; // 8 BOMs, 25 components
  }
}

module.exports = InforLNBOMMigrationObject;
