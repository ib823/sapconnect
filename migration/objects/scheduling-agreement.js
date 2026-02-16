/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Scheduling Agreement Migration Object
 *
 * Migrates Scheduling Agreements from ECC (EKKO/EKPO)
 * to S/4HANA via API_SCHEDULINGAGREEMENT.
 *
 * ~40 field mappings (header + item level).
 * Covers agreement header, item quantities, pricing,
 * delivery scheduling, and status indicators.
 * Mock: 20 agreements (5 suppliers × 4 materials).
 */

const BaseMigrationObject = require('./base-migration-object');

class SchedulingAgreementMigrationObject extends BaseMigrationObject {
  get objectId() { return 'SCHEDULING_AGREEMENT'; }
  get name() { return 'Scheduling Agreement'; }

  getFieldMappings() {
    return [
      // ── Header fields (EKKO) — 15 ────────────────────────────
      { source: 'EBELN', target: 'AgreementNumber' },
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'BSART', target: 'DocumentType' },
      { source: 'LIFNR', target: 'Supplier' },
      { source: 'EKORG', target: 'PurchasingOrganization' },
      { source: 'EKGRP', target: 'PurchasingGroup' },
      { source: 'WAERS', target: 'Currency' },
      { source: 'KDATB', target: 'ValidityStart', convert: 'toDate' },
      { source: 'KDATE', target: 'ValidityEnd', convert: 'toDate' },
      { source: 'ERDAT', target: 'CreatedDate', convert: 'toDate' },
      { source: 'ERNAM', target: 'CreatedBy' },
      { source: 'AEDAT', target: 'ChangedDate', convert: 'toDate' },
      { source: 'LOEKZ', target: 'DeletionIndicator' },
      { source: 'ZTERM', target: 'PaymentTerms' },
      { source: 'INCO1', target: 'Incoterms' },

      // ── Item fields (EKPO) — 23 ──────────────────────────────
      { source: 'EBELP', target: 'AgreementItem' },
      { source: 'MATNR', target: 'Material', convert: 'padLeft40' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'LGORT', target: 'StorageLocation' },
      { source: 'MENGE', target: 'TargetQuantity', convert: 'toDecimal' },
      { source: 'MEINS', target: 'UnitOfMeasure' },
      { source: 'NETPR', target: 'NetPrice', convert: 'toDecimal' },
      { source: 'PEINH', target: 'PriceUnit', convert: 'toInteger' },
      { source: 'BESSION_PRME', target: 'OrderPriceUnit' },
      { source: 'INFNR', target: 'InfoRecordNumber' },
      { source: 'KTMNG', target: 'TargetQuantityCumulat', convert: 'toDecimal' },
      { source: 'WEMNG', target: 'GoodsReceiptQuantity', convert: 'toDecimal' },
      { source: 'ABLAD', target: 'UnloadingPoint' },
      { source: 'EESSION_VERS', target: 'ShippingInstruction' },
      { source: 'ELIKZ', target: 'DeliveryCompleted', convert: 'boolYN' },
      { source: 'TXZ01', target: 'ShortText' },
      { source: 'MATKL', target: 'MaterialGroup' },
      { source: 'PSTYP', target: 'ItemCategory' },
      { source: 'KNTTP', target: 'AccountAssignmentCategory' },
      { source: 'REPOS', target: 'InvoiceReceiptExpected', convert: 'boolYN' },
      { source: 'WEBRE', target: 'GoodsReceiptBased', convert: 'boolYN' },
      { source: 'WEPOS', target: 'GoodsReceiptExpected', convert: 'boolYN' },
      { source: 'MWSKZ', target: 'TaxCode' },

      // ── Migration metadata ────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'SCHEDULING_AGREEMENT' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['AgreementNumber', 'AgreementItem', 'Supplier', 'Material'],
      exactDuplicate: { keys: ['AgreementNumber', 'AgreementItem'] },
    };
  }

  _extractMock() {
    const records = [];
    const suppliers = ['0000200001', '0000200003', '0000200005', '0000200008', '0000200010'];
    const materials = ['MAT00002', 'MAT00006', 'MAT00009', 'MAT00014'];
    const plants = ['1000', '2000'];
    const docTypes = ['LP', 'LPA', 'LP', 'LP'];
    const currencies = ['USD', 'EUR', 'USD', 'USD', 'GBP'];
    const units = ['EA', 'KG', 'EA', 'L'];

    let agreementIdx = 0;

    for (let s = 0; s < suppliers.length; s++) {
      for (let m = 0; m < materials.length; m++) {
        agreementIdx++;
        const agreementNum = String(5500000000 + agreementIdx);
        const itemNum = String(10).padStart(5, '0');
        const plantIdx = agreementIdx % plants.length;
        const startMonth = String(1 + (agreementIdx % 12)).padStart(2, '0');
        const targetQty = (100 + agreementIdx * 50).toFixed(3);
        const cumulQty = (agreementIdx * 20).toFixed(3);
        const grQty = (agreementIdx * 15).toFixed(3);

        records.push({
          EBELN: agreementNum,
          BUKRS: plantIdx === 0 ? '1000' : '2000',
          BSART: docTypes[m % docTypes.length],
          LIFNR: suppliers[s],
          EKORG: plantIdx === 0 ? '1000' : '2000',
          EKGRP: `00${1 + (s % 3)}`,
          WAERS: currencies[s],
          KDATB: `2024${startMonth}01`,
          KDATE: `2025${startMonth}01`,
          ERDAT: `2023${String(1 + (s % 12)).padStart(2, '0')}01`,
          ERNAM: 'SCHEDULER',
          AEDAT: `2024${startMonth}15`,
          LOEKZ: '',
          ZTERM: agreementIdx % 2 === 0 ? '0030' : '0045',
          INCO1: agreementIdx % 3 === 0 ? 'CIF' : 'FOB',
          EBELP: itemNum,
          MATNR: materials[m],
          WERKS: plants[plantIdx],
          LGORT: '0001',
          MENGE: targetQty,
          MEINS: units[m % units.length],
          NETPR: (5 + Math.random() * 495).toFixed(2),
          PEINH: '1',
          BESSION_PRME: units[m % units.length],
          INFNR: `5300${String(agreementIdx).padStart(6, '0')}`,
          KTMNG: cumulQty,
          WEMNG: grQty,
          ABLAD: `Dock ${1 + (agreementIdx % 4)}`,
          EESSION_VERS: '',
          ELIKZ: '',
          TXZ01: `SA item ${suppliers[s].slice(-3)}-${materials[m]}`,
          MATKL: `MG${String(1 + (m % 10)).padStart(2, '0')}`,
          PSTYP: '0',
          KNTTP: '',
          REPOS: 'X',
          WEBRE: 'X',
          WEPOS: 'X',
          MWSKZ: 'V1',
        });
      }
    }

    return records; // 5 suppliers × 4 materials = 20 records
  }
}

module.exports = SchedulingAgreementMigrationObject;
