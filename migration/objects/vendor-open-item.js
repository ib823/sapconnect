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
 * Vendor Open Items Migration Object
 *
 * Migrates vendor open items (AP) from BSIK/BSAK
 * to S/4HANA ACDOCA-based open items.
 *
 * ~40 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class VendorOpenItemMigrationObject extends BaseMigrationObject {
  get objectId() { return 'VENDOR_OPEN_ITEM'; }
  get name() { return 'Vendor Open Items'; }

  getFieldMappings() {
    return [
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'LIFNR', target: 'Supplier' },
      { source: 'UMSKS', target: 'SpecialGLIndicator' },
      { source: 'UMSKZ', target: 'SpecialGLTransactionType' },
      { source: 'AUGDT', target: 'ClearingDate', convert: 'toDate' },
      { source: 'AUGBL', target: 'ClearingDocument' },
      { source: 'ZUESSION_ONR', target: 'AssignmentReference' },
      { source: 'GJAHR', target: 'FiscalYear' },
      { source: 'BELNR', target: 'DocumentNumber' },
      { source: 'BUZEI', target: 'LineItem' },
      { source: 'BUDAT', target: 'PostingDate', convert: 'toDate' },
      { source: 'BLDAT', target: 'DocumentDate', convert: 'toDate' },
      { source: 'CPUDT', target: 'EntryDate', convert: 'toDate' },
      { source: 'WAERS', target: 'TransactionCurrency' },
      { source: 'BLART', target: 'DocumentType' },
      { source: 'MONAT', target: 'PostingPeriod' },
      { source: 'BSCHL', target: 'PostingKey' },
      { source: 'HKONT', target: 'GLAccount', convert: 'padLeft10' },
      { source: 'DMBTR', target: 'AmountInCompanyCodeCurrency', convert: 'toDecimal' },
      { source: 'WRBTR', target: 'AmountInTransactionCurrency', convert: 'toDecimal' },
      { source: 'DMBE2', target: 'AmountInGroupCurrency', convert: 'toDecimal' },
      { source: 'SHKZG', target: 'DebitCreditIndicator' },
      { source: 'MWSKZ', target: 'TaxCode' },
      { source: 'MWSTS', target: 'TaxAmount', convert: 'toDecimal' },
      { source: 'ZFBDT', target: 'BaselineDateForDueDate', convert: 'toDate' },
      { source: 'ZTERM', target: 'PaymentTerms' },
      { source: 'ZBD1T', target: 'CashDiscountDays1', convert: 'toInteger' },
      { source: 'ZBD3T', target: 'NetPaymentDays', convert: 'toInteger' },
      { source: 'ZBD1P', target: 'CashDiscountPercent1', convert: 'toDecimal' },
      { source: 'SGTXT', target: 'ItemText' },
      { source: 'EBELN', target: 'PurchaseOrder' },
      { source: 'EBELP', target: 'PurchaseOrderItem' },
      { source: 'XREF1', target: 'Reference1' },
      { source: 'XREF2', target: 'Reference2' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'GSBER', target: 'BusinessArea' },
      { source: 'KOSTL', target: 'CostCenter', convert: 'padLeft10' },
      { source: 'SEGMENT', target: 'Segment' },
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'VENDOR_OPEN_ITEM' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['CompanyCode', 'Supplier', 'DocumentNumber', 'FiscalYear', 'AmountInCompanyCodeCurrency'],
      exactDuplicate: { keys: ['CompanyCode', 'DocumentNumber', 'FiscalYear', 'LineItem'] },
    };
  }

  _extractMock() {
    const records = [];
    const vendors = ['VEND001', 'VEND002', 'VEND003', 'VEND004', 'VEND005',
                     'VEND006', 'VEND007', 'VEND008'];
    const docTypes = ['RE', 'KZ', 'KR', 'KG'];
    let docNum = 5100000000;

    for (let i = 0; i < 35; i++) {
      const vendor = vendors[i % vendors.length];
      const dt = docTypes[i % docTypes.length];
      const amount = (Math.random() * 80000 + 200).toFixed(2);
      docNum++;

      records.push({
        BUKRS: i < 25 ? '1000' : '2000',
        LIFNR: vendor,
        UMSKS: '',
        UMSKZ: i % 12 === 0 ? 'A' : '',
        AUGDT: '',
        AUGBL: '',
        ZUESSION_ONR: `PO-${String(docNum).slice(-6)}`,
        GJAHR: '2024',
        BELNR: String(docNum),
        BUZEI: '001',
        BUDAT: `2024${String((i % 12) + 1).padStart(2, '0')}20`,
        BLDAT: `2024${String((i % 12) + 1).padStart(2, '0')}15`,
        CPUDT: `2024${String((i % 12) + 1).padStart(2, '0')}20`,
        WAERS: i < 30 ? 'USD' : 'EUR',
        BLART: dt,
        MONAT: String((i % 12) + 1).padStart(2, '0'),
        BSCHL: dt === 'KZ' ? '25' : '31',
        HKONT: '200000',
        DMBTR: amount,
        WRBTR: amount,
        DMBE2: amount,
        SHKZG: dt === 'KZ' || dt === 'KG' ? 'S' : 'H',
        MWSKZ: 'V1',
        MWSTS: (parseFloat(amount) * 0.1).toFixed(2),
        ZFBDT: `2024${String((i % 12) + 1).padStart(2, '0')}20`,
        ZTERM: 'Z045',
        ZBD1T: '14',
        ZBD3T: '45',
        ZBD1P: '3.00',
        SGTXT: `Invoice from ${vendor}`,
        EBELN: `45${String(docNum).slice(-8)}`,
        EBELP: '00010',
        XREF1: '',
        XREF2: '',
        PRCTR: `PC${String((i % 5) + 1).padStart(4, '0')}`,
        GSBER: 'BU01',
        KOSTL: `CC${String((i % 10) + 1).padStart(4, '0')}`,
        SEGMENT: 'SEG1',
      });
    }

    return records; // 35
  }
}

module.exports = VendorOpenItemMigrationObject;
