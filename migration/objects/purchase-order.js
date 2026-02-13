/**
 * Purchase Order Migration Object
 *
 * Migrates open Purchase Orders from ECC (EKKO/EKPO)
 * to S/4HANA via API_PURCHASEORDER_PROCESS_SRV.
 *
 * ~50 field mappings (25 header + 25 item).
 * Only open POs (status not DELETED, not fully delivered).
 */

const BaseMigrationObject = require('./base-migration-object');

class PurchaseOrderMigrationObject extends BaseMigrationObject {
  get objectId() { return 'PURCHASE_ORDER'; }
  get name() { return 'Purchase Order (Open)'; }

  getFieldMappings() {
    return [
      // ── Header fields (EKKO) — 25 ─────────────────────────
      { source: 'EBELN', target: 'PurchaseOrder', convert: 'padLeft10' },
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'BSTYP', target: 'PurchasingDocumentCategory' },
      { source: 'BSART', target: 'PurchaseOrderType' },
      { source: 'LOEKZ', target: 'IsDeleted', convert: 'boolYN' },
      { source: 'AEDAT', target: 'CreationDate', convert: 'toDate' },
      { source: 'ERNAM', target: 'CreatedByUser' },
      { source: 'LIFNR', target: 'Supplier', convert: 'padLeft10' },
      { source: 'ZTERM', target: 'PaymentTerms' },
      { source: 'EKORG', target: 'PurchasingOrganization' },
      { source: 'EKGRP', target: 'PurchasingGroup' },
      { source: 'WAERS', target: 'DocumentCurrency' },
      { source: 'BEDAT', target: 'PurchaseOrderDate', convert: 'toDate' },
      { source: 'KDATB', target: 'ValidityStartDate', convert: 'toDate' },
      { source: 'KDATE', target: 'ValidityEndDate', convert: 'toDate' },
      { source: 'INCO1', target: 'Incoterms' },
      { source: 'INCO2', target: 'IncotermsLocation' },
      { source: 'WKURS', target: 'ExchangeRate', convert: 'toDecimal' },
      { source: 'KUFIX', target: 'IsExchangeRateFixed', convert: 'boolYN' },
      { source: 'VERKF', target: 'SupplierContactPerson' },
      { source: 'TELF1', target: 'SupplierPhoneNumber' },
      { source: 'LLIEF', target: 'SupplyingSupplier', convert: 'padLeft10' },
      { source: 'RESWK', target: 'SupplyingPlant' },
      { source: 'KONNR', target: 'OutlineAgreement', convert: 'padLeft10' },
      { source: 'MEMORY', target: 'IsMemoryCompleted', convert: 'boolYN' },

      // ── Item fields (EKPO) — 25 ───────────────────────────
      { source: 'EBELP', target: 'PurchaseOrderItem' },
      { source: 'MATNR', target: 'Material', convert: 'padLeft40' },
      { source: 'TXZ01', target: 'ShortText' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'LGORT', target: 'StorageLocation' },
      { source: 'MATKL', target: 'MaterialGroup' },
      { source: 'MENGE', target: 'OrderQuantity', convert: 'toDecimal' },
      { source: 'MEINS', target: 'OrderUnit' },
      { source: 'NETPR', target: 'NetPriceAmount', convert: 'toDecimal' },
      { source: 'PEINH', target: 'NetPriceQuantity', convert: 'toInteger' },
      { source: 'BPRME', target: 'PriceUnit' },
      { source: 'NETWR', target: 'NetOrderValue', convert: 'toDecimal' },
      { source: 'MWSKZ', target: 'TaxCode' },
      { source: 'BWTAR', target: 'ValuationType' },
      { source: 'PSTYP', target: 'ItemCategory' },
      { source: 'KNTTP', target: 'AccountAssignmentCategory' },
      { source: 'REPOS', target: 'IsInvoiceReceiptExpected', convert: 'boolYN' },
      { source: 'WEBRE', target: 'IsGoodsReceiptBased', convert: 'boolYN' },
      { source: 'WEPOS', target: 'IsGoodsReceiptExpected', convert: 'boolYN' },
      { source: 'BANFN', target: 'PurchaseRequisition', convert: 'padLeft10' },
      { source: 'BNFPO', target: 'PurchaseRequisitionItem' },
      { source: 'SAKTO', target: 'GLAccount', convert: 'padLeft10' },
      { source: 'KOSTL', target: 'CostCenter', convert: 'padLeft10' },
      { source: 'WEMPF', target: 'GoodsRecipient' },
      { source: 'ABLAD', target: 'UnloadingPoint' },

      // ── Metadata ───────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'PURCHASE_ORDER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['PurchaseOrder', 'PurchaseOrderItem', 'Supplier', 'PurchasingOrganization'],
      exactDuplicate: { keys: ['PurchaseOrder', 'PurchaseOrderItem'] },
    };
  }

  _extractMock() {
    const records = [];
    const poTypes = ['NB', 'NB', 'FO', 'NB', 'NB'];
    const vendors = ['0000200001', '0000200002', '0000200003', '0000200005', '0000200010'];
    const materials = ['MAT00001', 'MAT00003', 'MAT00005', 'MAT00008', 'MAT00012'];

    for (let h = 1; h <= 20; h++) {
      const items = 2 + (h % 3); // 2-4 items per PO
      for (let i = 1; i <= items; i++) {
        records.push({
          EBELN: String(4500000000 + h),
          BUKRS: h % 3 === 0 ? '2000' : '1000',
          BSTYP: 'F',
          BSART: poTypes[(h - 1) % 5],
          LOEKZ: '',
          AEDAT: `2024${String(1 + (h % 12)).padStart(2, '0')}${String(1 + (h % 28)).padStart(2, '0')}`,
          ERNAM: 'PURCHASER',
          LIFNR: vendors[(h - 1) % 5],
          ZTERM: h % 2 === 0 ? '0030' : '0045',
          EKORG: '1000',
          EKGRP: `00${1 + (h % 3)}`,
          WAERS: 'USD',
          BEDAT: `2024${String(1 + (h % 12)).padStart(2, '0')}01`,
          KDATB: '',
          KDATE: '',
          INCO1: h % 3 === 0 ? 'CIF' : 'FOB',
          INCO2: 'New York',
          WKURS: '1.00000',
          KUFIX: '',
          VERKF: `Vendor Contact ${(h - 1) % 5 + 1}`,
          TELF1: `555-${String(h).padStart(4, '0')}`,
          LLIEF: '',
          RESWK: '',
          KONNR: '',
          MEMORY: '',
          EBELP: String(i * 10).padStart(5, '0'),
          MATNR: materials[(h + i - 2) % 5],
          TXZ01: `PO Item ${h}-${i} material`,
          WERKS: h % 2 === 0 ? '2000' : '1000',
          LGORT: '0001',
          MATKL: `MG${String(1 + ((h + i) % 10)).padStart(2, '0')}`,
          MENGE: String(10 * (i + h % 5)),
          MEINS: i % 2 === 0 ? 'KG' : 'EA',
          NETPR: (10 + Math.random() * 990).toFixed(2),
          PEINH: '1',
          BPRME: i % 2 === 0 ? 'KG' : 'EA',
          NETWR: (100 + Math.random() * 9900).toFixed(2),
          MWSKZ: 'V1',
          BWTAR: '',
          PSTYP: '0',
          KNTTP: '',
          REPOS: 'X',
          WEBRE: 'X',
          WEPOS: 'X',
          BANFN: '',
          BNFPO: '',
          SAKTO: '',
          KOSTL: '',
          WEMPF: '',
          ABLAD: '',
        });
      }
    }

    return records;
  }
}

module.exports = PurchaseOrderMigrationObject;
