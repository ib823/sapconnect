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
 * Sales Order Migration Object
 *
 * Migrates open Sales Orders from ECC (VBAK/VBAP)
 * to S/4HANA via API_SALES_ORDER_SRV.
 *
 * ~50 field mappings (25 header + 25 item).
 * Only open SOs (not fully delivered/billed, not rejected).
 */

const BaseMigrationObject = require('./base-migration-object');

class SalesOrderMigrationObject extends BaseMigrationObject {
  get objectId() { return 'SALES_ORDER'; }
  get name() { return 'Sales Order (Open)'; }

  getFieldMappings() {
    return [
      // ── Header fields (VBAK) — 25 ─────────────────────────
      { source: 'VBELN', target: 'SalesOrder', convert: 'padLeft10' },
      { source: 'AUART', target: 'SalesOrderType' },
      { source: 'VKORG', target: 'SalesOrganization' },
      { source: 'VTWEG', target: 'DistributionChannel' },
      { source: 'SPART', target: 'Division' },
      { source: 'VKBUR', target: 'SalesOffice' },
      { source: 'VKGRP', target: 'SalesGroup' },
      { source: 'KUNNR', target: 'SoldToParty', convert: 'padLeft10' },
      { source: 'KUNWE', target: 'ShipToParty', convert: 'padLeft10' },
      { source: 'KUNRE', target: 'BillToParty', convert: 'padLeft10' },
      { source: 'KUNRG', target: 'Payer', convert: 'padLeft10' },
      { source: 'ERDAT', target: 'CreationDate', convert: 'toDate' },
      { source: 'ERNAM', target: 'CreatedByUser' },
      { source: 'AUDAT', target: 'SalesOrderDate', convert: 'toDate' },
      { source: 'VDATU', target: 'RequestedDeliveryDate', convert: 'toDate' },
      { source: 'BNDDT', target: 'BindingPeriodEndDate', convert: 'toDate' },
      { source: 'WAERK', target: 'TransactionCurrency' },
      { source: 'NETWR', target: 'TotalNetAmount', convert: 'toDecimal' },
      { source: 'KALSM', target: 'PricingProcedure' },
      { source: 'INCO1', target: 'Incoterms' },
      { source: 'INCO2', target: 'IncotermsLocation' },
      { source: 'ZTERM', target: 'PaymentTerms' },
      { source: 'BSTNK', target: 'CustomerPurchaseOrderNumber' },
      { source: 'BSTDK', target: 'CustomerPurchaseOrderDate', convert: 'toDate' },
      { source: 'KNUMV', target: 'PricingDocument' },

      // ── Item fields (VBAP) — 25 ───────────────────────────
      { source: 'POSNR', target: 'SalesOrderItem' },
      { source: 'MATNR', target: 'Material', convert: 'padLeft40' },
      { source: 'ARKTX', target: 'SalesOrderItemText' },
      { source: 'PSTYV', target: 'SalesOrderItemCategory' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'LGORT', target: 'StorageLocation' },
      { source: 'KWMENG', target: 'RequestedQuantity', convert: 'toDecimal' },
      { source: 'VRKME', target: 'RequestedQuantityUnit' },
      { source: 'NETPR', target: 'NetPriceAmount', convert: 'toDecimal' },
      { source: 'KPEIN', target: 'NetPriceQuantity', convert: 'toInteger' },
      { source: 'KMEIN', target: 'PriceUnit' },
      { source: 'NETWR_I', target: 'NetAmount', convert: 'toDecimal' },
      { source: 'MWSKZ', target: 'TaxCode' },
      { source: 'MATWA', target: 'MaterialByCustomer' },
      { source: 'GRPOS', target: 'HigherLevelItem' },
      { source: 'UEPOS', target: 'HigherLevelItemUsage' },
      { source: 'ABGRS', target: 'BillingPlanRule' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'KOSTL', target: 'CostCenter', convert: 'padLeft10' },
      { source: 'MVGR1', target: 'MaterialGroup1' },
      { source: 'MVGR2', target: 'MaterialGroup2' },
      { source: 'MVGR3', target: 'MaterialGroup3' },
      { source: 'PRODH', target: 'ProductHierarchy' },
      { source: 'ROUTE', target: 'Route' },
      { source: 'VSTEL', target: 'ShippingPoint' },

      // ── Metadata ───────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'SALES_ORDER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['SalesOrder', 'SalesOrderItem', 'SoldToParty', 'SalesOrganization'],
      exactDuplicate: { keys: ['SalesOrder', 'SalesOrderItem'] },
    };
  }

  _extractMock() {
    const records = [];
    const soTypes = ['OR', 'OR', 'RE', 'OR', 'CR'];
    const customers = ['0000100001', '0000100005', '0000100010', '0000100020', '0000100030'];
    const materials = ['MAT00002', 'MAT00004', 'MAT00007', 'MAT00010', 'MAT00015'];

    for (let h = 1; h <= 15; h++) {
      const items = 2 + (h % 4); // 2-5 items per SO
      for (let i = 1; i <= items; i++) {
        records.push({
          VBELN: String(5000000 + h),
          AUART: soTypes[(h - 1) % 5],
          VKORG: '1000',
          VTWEG: '10',
          SPART: '00',
          VKBUR: h % 3 === 0 ? 'BU02' : 'BU01',
          VKGRP: '',
          KUNNR: customers[(h - 1) % 5],
          KUNWE: customers[(h - 1) % 5],
          KUNRE: customers[(h - 1) % 5],
          KUNRG: customers[(h - 1) % 5],
          ERDAT: `2024${String(1 + (h % 12)).padStart(2, '0')}15`,
          ERNAM: 'SALESPERSON',
          AUDAT: `2024${String(1 + (h % 12)).padStart(2, '0')}15`,
          VDATU: `2024${String(Math.min(12, 1 + h % 12 + 1)).padStart(2, '0')}01`,
          BNDDT: '',
          WAERK: 'USD',
          NETWR: (1000 + Math.random() * 99000).toFixed(2),
          KALSM: 'RVAA01',
          INCO1: 'FOB',
          INCO2: 'Customer Warehouse',
          ZTERM: '0030',
          BSTNK: `PO-CUST-${h}`,
          BSTDK: `2024${String(1 + (h % 12)).padStart(2, '0')}10`,
          KNUMV: String(6000000 + h),
          POSNR: String(i * 10).padStart(6, '0'),
          MATNR: materials[(h + i - 2) % 5],
          ARKTX: `Sales item ${h}-${i}`,
          PSTYV: 'TAN',
          WERKS: h % 2 === 0 ? '2000' : '1000',
          LGORT: '0001',
          KWMENG: String(5 * (i + h % 10)),
          VRKME: i % 3 === 0 ? 'KG' : 'EA',
          NETPR: (50 + Math.random() * 950).toFixed(2),
          KPEIN: '1',
          KMEIN: i % 3 === 0 ? 'KG' : 'EA',
          NETWR_I: (500 + Math.random() * 9500).toFixed(2),
          MWSKZ: 'A1',
          MATWA: '',
          GRPOS: '',
          UEPOS: '',
          ABGRS: '',
          PRCTR: `PC${h % 2 === 0 ? '20' : '10'}01`,
          KOSTL: '',
          MVGR1: '',
          MVGR2: '',
          MVGR3: '',
          PRODH: '',
          ROUTE: '',
          VSTEL: h % 2 === 0 ? '2000' : '1000',
        });
      }
    }

    return records;
  }
}

module.exports = SalesOrderMigrationObject;
