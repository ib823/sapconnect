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
 * Purchase Contract Migration Object
 *
 * Migrates Purchase Contracts from ECC (EKKO/EKPO)
 * to S/4HANA via API_PURCHASECONTRACT.
 *
 * ~40 field mappings (header + item level).
 * Covers contract header, item quantities, pricing, target values,
 * release quantities, and status indicators.
 * Mock: 25 contract items (5 contracts × 5 items).
 */

const BaseMigrationObject = require('./base-migration-object');

class PurchaseContractMigrationObject extends BaseMigrationObject {
  get objectId() { return 'PURCHASE_CONTRACT'; }
  get name() { return 'Purchase Contract'; }

  getFieldMappings() {
    return [
      // ── Header fields (EKKO) — 15 ────────────────────────────
      { source: 'EBELN', target: 'ContractNumber' },
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
      { source: 'EBELP', target: 'ContractItem' },
      { source: 'MATNR', target: 'Material', convert: 'padLeft40' },
      { source: 'MATKL', target: 'MaterialGroup' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'KTMNG', target: 'TargetQuantity', convert: 'toDecimal' },
      { source: 'MEINS', target: 'UnitOfMeasure' },
      { source: 'NETPR', target: 'NetPrice', convert: 'toDecimal' },
      { source: 'PEINH', target: 'PriceUnit', convert: 'toInteger' },
      { source: 'KTWRT', target: 'TargetValue', convert: 'toDecimal' },
      { source: 'ZWERT', target: 'AgreementValue', convert: 'toDecimal' },
      { source: 'ABMNG', target: 'ReleaseQuantity', convert: 'toDecimal' },
      { source: 'ABESSION_DAT', target: 'ReleaseDate', convert: 'toDate' },
      { source: 'ELIKZ', target: 'DeliveryCompleted', convert: 'boolYN' },
      { source: 'KONNR', target: 'PrincipalAgreement' },
      { source: 'KTPNR', target: 'PrincipalItem' },
      { source: 'TXZ01', target: 'ShortText' },
      { source: 'PSTYP', target: 'ItemCategory' },
      { source: 'KNTTP', target: 'AccountAssignmentCategory' },
      { source: 'REPOS', target: 'InvoiceReceiptExpected', convert: 'boolYN' },
      { source: 'WEBRE', target: 'GoodsReceiptBased', convert: 'boolYN' },
      { source: 'WEPOS', target: 'GoodsReceiptExpected', convert: 'boolYN' },
      { source: 'MWSKZ', target: 'TaxCode' },
      { source: 'INFNR', target: 'InfoRecordNumber' },

      // ── Migration metadata ────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'PURCHASE_CONTRACT' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['ContractNumber', 'ContractItem', 'Supplier'],
      exactDuplicate: { keys: ['ContractNumber', 'ContractItem'] },
    };
  }

  _extractMock() {
    const records = [];
    const suppliers = ['0000200002', '0000200004', '0000200006', '0000200008', '0000200012'];
    const materials = ['MAT00003', 'MAT00007', 'MAT00011', 'MAT00016', 'MAT00020'];
    const docTypes = ['MK', 'WK', 'MK', 'MK', 'WK'];
    const currencies = ['USD', 'EUR', 'USD', 'GBP', 'USD'];
    const plants = ['1000', '2000', '1000', '2000', '1000'];
    const units = ['EA', 'KG', 'L', 'PC', 'EA'];

    for (let c = 0; c < 5; c++) {
      const contractNum = String(4700000000 + c + 1);
      const startMonth = String(1 + (c * 2) % 12).padStart(2, '0');

      for (let i = 0; i < 5; i++) {
        const itemNum = String((i + 1) * 10).padStart(5, '0');
        const targetQty = (500 + (c * 100) + (i * 50)).toFixed(3);
        const netPrice = (10 + Math.random() * 490).toFixed(2);
        const targetValue = (parseFloat(targetQty) * parseFloat(netPrice)).toFixed(2);
        const agreementValue = (parseFloat(targetValue) * 1.2).toFixed(2);
        const releaseQty = (parseFloat(targetQty) * (0.1 + c * 0.1)).toFixed(3);
        const materialGroup = `MG${String(1 + ((c + i) % 10)).padStart(2, '0')}`;

        records.push({
          EBELN: contractNum,
          BUKRS: c % 2 === 0 ? '1000' : '2000',
          BSART: docTypes[c],
          LIFNR: suppliers[c],
          EKORG: c % 2 === 0 ? '1000' : '2000',
          EKGRP: `00${1 + (c % 3)}`,
          WAERS: currencies[c],
          KDATB: `2024${startMonth}01`,
          KDATE: `2025${startMonth}01`,
          ERDAT: `2023${String(1 + (c % 12)).padStart(2, '0')}01`,
          ERNAM: 'BUYER',
          AEDAT: `2024${startMonth}15`,
          LOEKZ: '',
          ZTERM: c % 2 === 0 ? '0030' : '0060',
          INCO1: c % 3 === 0 ? 'CIF' : 'FOB',
          EBELP: itemNum,
          MATNR: materials[i],
          MATKL: materialGroup,
          WERKS: plants[c],
          KTMNG: targetQty,
          MEINS: units[i],
          NETPR: netPrice,
          PEINH: '1',
          KTWRT: targetValue,
          ZWERT: agreementValue,
          ABMNG: releaseQty,
          ABESSION_DAT: `2024${String(1 + ((c + i) % 12)).padStart(2, '0')}15`,
          ELIKZ: '',
          KONNR: '',
          KTPNR: '',
          TXZ01: `Contract item ${contractNum.slice(-3)}-${itemNum}`,
          PSTYP: '0',
          KNTTP: '',
          REPOS: 'X',
          WEBRE: 'X',
          WEPOS: 'X',
          MWSKZ: 'V1',
          INFNR: `5300${String(c * 5 + i + 1).padStart(6, '0')}`,
        });
      }
    }

    return records; // 5 contracts × 5 items = 25 records
  }
}

module.exports = PurchaseContractMigrationObject;
