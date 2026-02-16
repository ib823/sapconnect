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
 * Customer Open Items Migration Object
 *
 * Migrates customer open items (AR) from BSID/BSAD
 * to S/4HANA ACDOCA-based open items.
 *
 * ~40 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class CustomerOpenItemMigrationObject extends BaseMigrationObject {
  get objectId() { return 'CUSTOMER_OPEN_ITEM'; }
  get name() { return 'Customer Open Items'; }

  getFieldMappings() {
    return [
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'KUNNR', target: 'Customer' },
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
      { source: 'ZBD2T', target: 'CashDiscountDays2', convert: 'toInteger' },
      { source: 'ZBD3T', target: 'NetPaymentDays', convert: 'toInteger' },
      { source: 'ZBD1P', target: 'CashDiscountPercent1', convert: 'toDecimal' },
      { source: 'SGTXT', target: 'ItemText' },
      { source: 'VBELN', target: 'SalesDocument' },
      { source: 'XREF1', target: 'Reference1' },
      { source: 'XREF2', target: 'Reference2' },
      { source: 'XREF3', target: 'Reference3' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'GSBER', target: 'BusinessArea' },
      { source: 'SEGMENT', target: 'Segment' },
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'CUSTOMER_OPEN_ITEM' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['CompanyCode', 'Customer', 'DocumentNumber', 'FiscalYear', 'AmountInCompanyCodeCurrency'],
      exactDuplicate: { keys: ['CompanyCode', 'DocumentNumber', 'FiscalYear', 'LineItem'] },
    };
  }

  _extractMock() {
    const records = [];
    const customers = ['CUST001', 'CUST002', 'CUST003', 'CUST004', 'CUST005',
                       'CUST006', 'CUST007', 'CUST008', 'CUST009', 'CUST010'];
    const docTypes = ['RV', 'DZ', 'DR', 'DG'];
    let docNum = 1900000000;

    for (let i = 0; i < 40; i++) {
      const cust = customers[i % customers.length];
      const dt = docTypes[i % docTypes.length];
      const amount = (Math.random() * 50000 + 100).toFixed(2);
      docNum++;

      records.push({
        BUKRS: i < 30 ? '1000' : '2000',
        KUNNR: cust,
        UMSKS: '',
        UMSKZ: i % 10 === 0 ? 'A' : '', // some down payments
        AUGDT: '',
        AUGBL: '',
        ZUESSION_ONR: `INV-${String(docNum).slice(-6)}`,
        GJAHR: '2024',
        BELNR: String(docNum),
        BUZEI: '001',
        BUDAT: `2024${String((i % 12) + 1).padStart(2, '0')}15`,
        BLDAT: `2024${String((i % 12) + 1).padStart(2, '0')}10`,
        CPUDT: `2024${String((i % 12) + 1).padStart(2, '0')}15`,
        WAERS: i < 35 ? 'USD' : 'EUR',
        BLART: dt,
        MONAT: String((i % 12) + 1).padStart(2, '0'),
        BSCHL: dt === 'DZ' ? '15' : '01',
        HKONT: '113100',
        DMBTR: amount,
        WRBTR: amount,
        DMBE2: amount,
        SHKZG: dt === 'DZ' || dt === 'DG' ? 'H' : 'S',
        MWSKZ: 'O1',
        MWSTS: (parseFloat(amount) * 0.1).toFixed(2),
        ZFBDT: `2024${String((i % 12) + 1).padStart(2, '0')}15`,
        ZTERM: 'Z030',
        ZBD1T: '10',
        ZBD2T: '20',
        ZBD3T: '30',
        ZBD1P: '2.00',
        SGTXT: `Invoice for ${cust}`,
        VBELN: `80${String(docNum).slice(-6)}`,
        XREF1: '',
        XREF2: '',
        XREF3: '',
        PRCTR: `PC${String((i % 5) + 1).padStart(4, '0')}`,
        GSBER: 'BU01',
        SEGMENT: 'SEG1',
      });
    }

    return records; // 40
  }
}

module.exports = CustomerOpenItemMigrationObject;
