/**
 * Infor M3 Purchase Order Migration Object
 *
 * Migrates M3 Purchase Orders (MPHEAD/MPLINE)
 * to SAP Purchase Order (EKKO/EKPO).
 *
 * M3 MPHEAD uses IA prefix for PO header:
 *   IAPUNO — PO number
 *   IASUNO — supplier number
 *
 * ~18 field mappings. Mock: 8 POs with 18 line items.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforM3PurchaseOrderMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_M3_PURCHASE_ORDER'; }
  get name() { return 'Infor M3 Purchase Order'; }

  getFieldMappings() {
    return [
      // ── Header fields (EKKO) ────────────────────────────────
      { source: 'IAPUNO', target: 'EKKO-EBELN', convert: 'padLeft10' },
      { source: 'IAPUDT', target: 'EKKO-BEDAT', convert: 'toDate' },
      { source: 'IASUNO', target: 'EKKO-LIFNR', convert: 'padLeft10' },
      { source: 'IADIVI', target: 'EKKO-BUKRS' },
      { source: 'IACUCD', target: 'EKKO-WAERS' },
      { source: 'IABUYE', target: 'EKKO-EKGRP' },
      { source: 'IAFACI', target: 'EKKO-EKORG' },
      { source: 'IAPURC', target: 'EKKO-BSART', valueMap: {
        'PO': 'NB', 'STO': 'UB', 'SUB': 'LO', 'SRV': 'FO',
      }, default: 'NB' },

      // ── Item fields (EKPO) ──────────────────────────────────
      { source: 'IBPNLI', target: 'EKPO-EBELP', transform: (v) => v === null || v === undefined ? '' : String(v).padStart(5, '0') },
      { source: 'IBITNO', target: 'EKPO-MATNR', convert: 'toUpperCase' },
      { source: 'IBORQA', target: 'EKPO-MENGE', convert: 'toDecimal' },
      { source: 'IBUNMS', target: 'EKPO-MEINS' },
      { source: 'IBPUPR', target: 'EKPO-NETPR', convert: 'toDecimal' },
      { source: 'IBCODT', target: 'EKPO-EEIND', convert: 'toDate' },
      { source: 'IBWHLO', target: 'EKPO-WERKS' },
      { source: 'IBLGRT', target: 'EKPO-LGORT', default: '0001' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_M3' },
      { target: 'MigrationObjectId', default: 'INFOR_M3_PURCHASE_ORDER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['EKKO-EBELN', 'EKKO-LIFNR', 'EKPO-MATNR', 'EKPO-MENGE'],
      exactDuplicate: { keys: ['EKKO-EBELN', 'EKPO-EBELP'] },
    };
  }

  _extractMock() {
    const records = [];
    const suppliers = ['M3V00001', 'M3V00002', 'M3V00003', 'M3V00004',
                       'M3V00005', 'M3V00001', 'M3V00002', 'M3V00003'];
    const types = ['PO', 'PO', 'STO', 'PO', 'SUB', 'PO', 'SRV', 'PO'];

    for (let h = 0; h < 8; h++) {
      const lineCount = h < 2 ? 3 : 2;
      for (let l = 0; l < lineCount; l++) {
        records.push({
          IAPUNO: `M3PO${String(h + 1).padStart(6, '0')}`,
          IAPUDT: `2024${String((h % 12) + 1).padStart(2, '0')}05`,
          IASUNO: suppliers[h],
          IADIVI: 'D1',
          IACUCD: h % 3 === 0 ? 'EUR' : 'USD',
          IABUYE: `BY${String((h % 4) + 1).padStart(2, '0')}`,
          IAFACI: 'F01',
          IAPURC: types[h],
          IBPNLI: String((l + 1) * 10),
          IBITNO: `M3ITM${String(l + 1).padStart(4, '0')}`,
          IBORQA: String(Math.floor(Math.random() * 2000 + 100)),
          IBUNMS: 'KG',
          IBPUPR: (Math.random() * 200 + 5).toFixed(2),
          IBCODT: `2024${String(Math.min((h % 12) + 2, 12)).padStart(2, '0')}20`,
          IBWHLO: 'WH01',
          IBLGRT: '0001',
        });
      }
    }

    return records; // 8 POs, 18 line items
  }
}

module.exports = InforM3PurchaseOrderMigrationObject;
