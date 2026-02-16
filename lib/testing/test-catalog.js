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
'use strict';

/**
 * Pre-Built Test Template Catalog
 *
 * Contains 30+ templates across FI/CO/MM/SD/PP/HR modules with variable
 * placeholders for instantiation. Provides template lookup, filtering,
 * instantiation, validation, and categorization.
 */

const Logger = require('../logger');
const { TestingError } = require('../errors');

const log = new Logger('test-catalog');

/**
 * Static catalog of test templates.
 * Each template uses {{variable}} placeholders that are filled during instantiation.
 */
const TEST_CATALOG = [
  // ── FI Templates ──────────────────────────────────────────────────────
  {
    id: 'TPL-FI-001',
    module: 'FI',
    name: 'GL Posting (FB01)',
    description: 'Create a general ledger posting via FB01 with debit/credit line items',
    type: 'e2e',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Open FB01 transaction', type: 'rfc_call', params: { tcode: 'FB01', companyCode: '{{companyCode}}' }, expectedResult: 'GL posting screen opens' },
      { stepNumber: 2, action: 'Enter document header', type: 'field_validation', params: { docType: '{{docType}}', postingDate: '{{postingDate}}', currency: '{{currency}}' }, expectedResult: 'Header data validated' },
      { stepNumber: 3, action: 'Enter debit line item', type: 'bapi_call', params: { glAccount: '{{debitAccount}}', amount: '{{amount}}' }, expectedResult: 'Debit line item accepted' },
      { stepNumber: 4, action: 'Enter credit line item', type: 'bapi_call', params: { glAccount: '{{creditAccount}}', amount: '{{amount}}' }, expectedResult: 'Credit line item accepted' },
      { stepNumber: 5, action: 'Post document', type: 'bapi_call', params: { bapi: 'BAPI_ACC_DOCUMENT_POST' }, expectedResult: 'Document number {{docNumber}} generated' },
    ],
    variables: [
      { name: 'companyCode', description: 'SAP Company Code', type: 'string', required: true, defaultValue: '1000' },
      { name: 'docType', description: 'Document Type', type: 'string', required: true, defaultValue: 'SA' },
      { name: 'postingDate', description: 'Posting Date (YYYYMMDD)', type: 'date', required: true },
      { name: 'currency', description: 'Currency Key', type: 'string', required: false, defaultValue: 'USD' },
      { name: 'debitAccount', description: 'GL Account for debit', type: 'string', required: true },
      { name: 'creditAccount', description: 'GL Account for credit', type: 'string', required: true },
      { name: 'amount', description: 'Posting amount', type: 'number', required: true },
      { name: 'docNumber', description: 'Expected document number', type: 'string', required: false, defaultValue: 'AUTO' },
    ],
  },
  {
    id: 'TPL-FI-002',
    module: 'FI',
    name: 'Vendor Payment (F-53)',
    description: 'Post a vendor payment clearing open invoices',
    type: 'e2e',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Open F-53 vendor payment', type: 'rfc_call', params: { tcode: 'F-53', companyCode: '{{companyCode}}' }, expectedResult: 'Payment screen opens' },
      { stepNumber: 2, action: 'Enter vendor and bank data', type: 'field_validation', params: { vendor: '{{vendorNumber}}', bankAccount: '{{bankAccount}}' }, expectedResult: 'Vendor and bank validated' },
      { stepNumber: 3, action: 'Select open items to clear', type: 'field_validation', params: { amount: '{{paymentAmount}}' }, expectedResult: 'Open items selected for clearing' },
      { stepNumber: 4, action: 'Post payment', type: 'bapi_call', params: { bapi: 'BAPI_ACC_DOCUMENT_POST' }, expectedResult: 'Payment document created' },
    ],
    variables: [
      { name: 'companyCode', description: 'SAP Company Code', type: 'string', required: true, defaultValue: '1000' },
      { name: 'vendorNumber', description: 'Vendor account number', type: 'string', required: true },
      { name: 'bankAccount', description: 'Bank GL account', type: 'string', required: true },
      { name: 'paymentAmount', description: 'Payment amount', type: 'number', required: true },
    ],
  },
  {
    id: 'TPL-FI-003',
    module: 'FI',
    name: 'Customer Invoice (FB70)',
    description: 'Post a customer invoice with revenue and tax lines',
    type: 'e2e',
    priority: 'high',
    steps: [
      { stepNumber: 1, action: 'Open FB70 customer invoice', type: 'rfc_call', params: { tcode: 'FB70', companyCode: '{{companyCode}}' }, expectedResult: 'Invoice entry screen opens' },
      { stepNumber: 2, action: 'Enter customer and invoice data', type: 'field_validation', params: { customer: '{{customerNumber}}', amount: '{{invoiceAmount}}', taxCode: '{{taxCode}}' }, expectedResult: 'Invoice header validated' },
      { stepNumber: 3, action: 'Enter revenue line items', type: 'bapi_call', params: { glAccount: '{{revenueAccount}}' }, expectedResult: 'Revenue line items balanced' },
      { stepNumber: 4, action: 'Post invoice', type: 'bapi_call', params: { bapi: 'BAPI_ACC_DOCUMENT_POST' }, expectedResult: 'Invoice document created with tax' },
    ],
    variables: [
      { name: 'companyCode', description: 'SAP Company Code', type: 'string', required: true, defaultValue: '1000' },
      { name: 'customerNumber', description: 'Customer account number', type: 'string', required: true },
      { name: 'invoiceAmount', description: 'Invoice amount', type: 'number', required: true },
      { name: 'taxCode', description: 'Tax code', type: 'string', required: false, defaultValue: 'V1' },
      { name: 'revenueAccount', description: 'Revenue GL account', type: 'string', required: true },
    ],
  },
  {
    id: 'TPL-FI-004',
    module: 'FI',
    name: 'Period Close (S_ALR_87012377)',
    description: 'Close a posting period and verify no further postings allowed',
    type: 'regression',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Open period maintenance OB52', type: 'rfc_call', params: { tcode: 'OB52', companyCode: '{{companyCode}}' }, expectedResult: 'Period table displayed' },
      { stepNumber: 2, action: 'Close period {{period}} for variant {{variant}}', type: 'table_check', params: { table: 'T001B', period: '{{period}}' }, expectedResult: 'Period closed successfully' },
      { stepNumber: 3, action: 'Attempt posting to closed period', type: 'bapi_call', params: { bapi: 'BAPI_ACC_DOCUMENT_POST', period: '{{period}}' }, expectedResult: 'Posting rejected with period closed error' },
    ],
    variables: [
      { name: 'companyCode', description: 'SAP Company Code', type: 'string', required: true, defaultValue: '1000' },
      { name: 'period', description: 'Fiscal period to close (MM)', type: 'string', required: true },
      { name: 'variant', description: 'Period variant', type: 'string', required: false, defaultValue: '0001' },
    ],
  },
  {
    id: 'TPL-FI-005',
    module: 'FI',
    name: 'Asset Acquisition (ABZON)',
    description: 'Post an asset acquisition and verify capitalization',
    type: 'e2e',
    priority: 'high',
    steps: [
      { stepNumber: 1, action: 'Post asset acquisition via ABZON', type: 'bapi_call', params: { bapi: 'BAPI_ACC_DOCUMENT_POST', assetNumber: '{{assetNumber}}' }, expectedResult: 'Asset acquisition posted' },
      { stepNumber: 2, action: 'Verify asset value updated', type: 'table_check', params: { table: 'ANLA', assetNumber: '{{assetNumber}}' }, expectedResult: 'Asset capitalized value matches posting' },
      { stepNumber: 3, action: 'Verify depreciation area updated', type: 'table_check', params: { table: 'ANLC' }, expectedResult: 'Depreciation area reflects acquisition' },
    ],
    variables: [
      { name: 'assetNumber', description: 'Asset main number', type: 'string', required: true },
      { name: 'acquisitionAmount', description: 'Acquisition amount', type: 'number', required: true },
    ],
  },
  {
    id: 'TPL-FI-006',
    module: 'FI',
    name: 'Bank Reconciliation',
    description: 'Reconcile bank statement with GL postings',
    type: 'integration',
    priority: 'high',
    steps: [
      { stepNumber: 1, action: 'Upload bank statement', type: 'rfc_call', params: { tcode: 'FF_5', bankAccount: '{{bankAccount}}' }, expectedResult: 'Bank statement loaded' },
      { stepNumber: 2, action: 'Run auto-matching algorithm', type: 'bapi_call', params: { algorithm: 'auto' }, expectedResult: 'Matches identified' },
      { stepNumber: 3, action: 'Verify matched items', type: 'table_check', params: { table: 'FEBEP' }, expectedResult: 'Statement items matched to GL entries' },
      { stepNumber: 4, action: 'Post clearing entries', type: 'bapi_call', params: { bapi: 'BAPI_ACC_DOCUMENT_POST' }, expectedResult: 'Clearing documents created' },
    ],
    variables: [
      { name: 'bankAccount', description: 'Bank GL account', type: 'string', required: true },
      { name: 'statementDate', description: 'Statement date', type: 'date', required: true },
    ],
  },

  // ── CO Templates ──────────────────────────────────────────────────────
  {
    id: 'TPL-CO-001',
    module: 'CO',
    name: 'Cost Center Posting',
    description: 'Manual cost posting to a cost center via KB11N',
    type: 'e2e',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Open KB11N manual cost posting', type: 'rfc_call', params: { tcode: 'KB11N' }, expectedResult: 'Cost posting screen opens' },
      { stepNumber: 2, action: 'Enter cost center {{costCenter}} and cost element {{costElement}}', type: 'field_validation', params: { costCenter: '{{costCenter}}', costElement: '{{costElement}}' }, expectedResult: 'Cost center and element validated' },
      { stepNumber: 3, action: 'Post amount {{amount}}', type: 'bapi_call', params: { bapi: 'BAPI_ACC_MANUAL_ALLOC_POST', amount: '{{amount}}' }, expectedResult: 'CO document created' },
    ],
    variables: [
      { name: 'costCenter', description: 'Cost center', type: 'string', required: true },
      { name: 'costElement', description: 'Cost element (primary)', type: 'string', required: true },
      { name: 'amount', description: 'Posting amount', type: 'number', required: true },
    ],
  },
  {
    id: 'TPL-CO-002',
    module: 'CO',
    name: 'Activity Allocation',
    description: 'Allocate activities between cost centers via KB21N',
    type: 'e2e',
    priority: 'high',
    steps: [
      { stepNumber: 1, action: 'Open KB21N activity allocation', type: 'rfc_call', params: { tcode: 'KB21N' }, expectedResult: 'Activity allocation screen opens' },
      { stepNumber: 2, action: 'Enter sender {{senderCC}} and receiver {{receiverCC}}', type: 'field_validation', params: { sender: '{{senderCC}}', receiver: '{{receiverCC}}', activityType: '{{activityType}}' }, expectedResult: 'Sender and receiver validated' },
      { stepNumber: 3, action: 'Enter quantity and post', type: 'bapi_call', params: { quantity: '{{quantity}}' }, expectedResult: 'Activity allocation document created' },
    ],
    variables: [
      { name: 'senderCC', description: 'Sender cost center', type: 'string', required: true },
      { name: 'receiverCC', description: 'Receiver cost center', type: 'string', required: true },
      { name: 'activityType', description: 'Activity type', type: 'string', required: true },
      { name: 'quantity', description: 'Activity quantity', type: 'number', required: true },
    ],
  },
  {
    id: 'TPL-CO-003',
    module: 'CO',
    name: 'Internal Order Settlement',
    description: 'Settle internal order costs to receivers via KO88',
    type: 'e2e',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Open KO88 order settlement', type: 'rfc_call', params: { tcode: 'KO88', order: '{{orderNumber}}' }, expectedResult: 'Settlement screen opens' },
      { stepNumber: 2, action: 'Verify settlement rule', type: 'table_check', params: { table: 'COBRB', order: '{{orderNumber}}' }, expectedResult: 'Settlement rule found' },
      { stepNumber: 3, action: 'Execute settlement', type: 'bapi_call', params: { period: '{{period}}', fiscalYear: '{{fiscalYear}}' }, expectedResult: 'Settlement amounts transferred to receivers' },
    ],
    variables: [
      { name: 'orderNumber', description: 'Internal order number', type: 'string', required: true },
      { name: 'period', description: 'Settlement period', type: 'string', required: true },
      { name: 'fiscalYear', description: 'Fiscal year', type: 'string', required: true },
    ],
  },
  {
    id: 'TPL-CO-004',
    module: 'CO',
    name: 'Profit Center Assignment',
    description: 'Assign a cost center to a profit center and verify',
    type: 'integration',
    priority: 'high',
    steps: [
      { stepNumber: 1, action: 'Open cost center master KS02', type: 'rfc_call', params: { tcode: 'KS02', costCenter: '{{costCenter}}' }, expectedResult: 'Cost center master displayed' },
      { stepNumber: 2, action: 'Assign profit center {{profitCenter}}', type: 'field_validation', params: { profitCenter: '{{profitCenter}}' }, expectedResult: 'Profit center assigned' },
      { stepNumber: 3, action: 'Verify assignment', type: 'table_check', params: { table: 'CSKS', costCenter: '{{costCenter}}' }, expectedResult: 'Profit center matches in master record' },
    ],
    variables: [
      { name: 'costCenter', description: 'Cost center to assign', type: 'string', required: true },
      { name: 'profitCenter', description: 'Target profit center', type: 'string', required: true },
    ],
  },
  {
    id: 'TPL-CO-005',
    module: 'CO',
    name: 'Cost Element Verification',
    description: 'Verify cost element configuration and category',
    type: 'unit',
    priority: 'medium',
    steps: [
      { stepNumber: 1, action: 'Display cost element KA03', type: 'rfc_call', params: { tcode: 'KA03', costElement: '{{costElement}}' }, expectedResult: 'Cost element displayed' },
      { stepNumber: 2, action: 'Verify element category', type: 'table_check', params: { table: 'CSKA', expectedCategory: '{{category}}' }, expectedResult: 'Cost element category matches expected' },
    ],
    variables: [
      { name: 'costElement', description: 'Cost element number', type: 'string', required: true },
      { name: 'category', description: 'Expected cost element category', type: 'string', required: true },
    ],
  },

  // ── MM Templates ──────────────────────────────────────────────────────
  {
    id: 'TPL-MM-001',
    module: 'MM',
    name: 'Purchase Order Creation (ME21N)',
    description: 'Create a standard purchase order with line items',
    type: 'e2e',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Open ME21N purchase order creation', type: 'rfc_call', params: { tcode: 'ME21N' }, expectedResult: 'PO creation screen opens' },
      { stepNumber: 2, action: 'Enter vendor {{vendor}} and org data', type: 'field_validation', params: { vendor: '{{vendor}}', purchOrg: '{{purchOrg}}', companyCode: '{{companyCode}}' }, expectedResult: 'Vendor and org data validated' },
      { stepNumber: 3, action: 'Add material {{material}} with quantity {{quantity}}', type: 'field_validation', params: { material: '{{material}}', quantity: '{{quantity}}', price: '{{price}}' }, expectedResult: 'Line item added with pricing' },
      { stepNumber: 4, action: 'Save PO', type: 'bapi_call', params: { bapi: 'BAPI_PO_CREATE1' }, expectedResult: 'PO number generated' },
    ],
    variables: [
      { name: 'vendor', description: 'Vendor number', type: 'string', required: true },
      { name: 'purchOrg', description: 'Purchasing organization', type: 'string', required: true },
      { name: 'companyCode', description: 'Company code', type: 'string', required: true, defaultValue: '1000' },
      { name: 'material', description: 'Material number', type: 'string', required: true },
      { name: 'quantity', description: 'Order quantity', type: 'number', required: true },
      { name: 'price', description: 'Net price', type: 'number', required: true },
    ],
  },
  {
    id: 'TPL-MM-002',
    module: 'MM',
    name: 'Goods Receipt (MIGO)',
    description: 'Post goods receipt against purchase order',
    type: 'e2e',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Open MIGO for goods receipt', type: 'rfc_call', params: { tcode: 'MIGO', movementType: '101' }, expectedResult: 'Goods receipt screen opens' },
      { stepNumber: 2, action: 'Enter PO reference {{poNumber}}', type: 'field_validation', params: { poNumber: '{{poNumber}}' }, expectedResult: 'PO items loaded automatically' },
      { stepNumber: 3, action: 'Confirm quantity {{quantity}}', type: 'field_validation', params: { quantity: '{{quantity}}' }, expectedResult: 'Quantity accepted within tolerance' },
      { stepNumber: 4, action: 'Post goods receipt', type: 'bapi_call', params: { bapi: 'BAPI_GOODSMVT_CREATE' }, expectedResult: 'Material document and accounting document created' },
    ],
    variables: [
      { name: 'poNumber', description: 'Purchase order number', type: 'string', required: true },
      { name: 'quantity', description: 'Receipt quantity', type: 'number', required: true },
    ],
  },
  {
    id: 'TPL-MM-003',
    module: 'MM',
    name: 'Invoice Verification (MIRO)',
    description: 'Enter and verify vendor invoice against PO and GR',
    type: 'e2e',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Open MIRO invoice entry', type: 'rfc_call', params: { tcode: 'MIRO' }, expectedResult: 'Invoice entry screen opens' },
      { stepNumber: 2, action: 'Enter PO reference {{poNumber}} and amount {{amount}}', type: 'field_validation', params: { poNumber: '{{poNumber}}', amount: '{{amount}}' }, expectedResult: 'Three-way match verified (PO, GR, Invoice)' },
      { stepNumber: 3, action: 'Post invoice', type: 'bapi_call', params: { bapi: 'BAPI_INCOMINGINVOICE_CREATE' }, expectedResult: 'Invoice document created' },
    ],
    variables: [
      { name: 'poNumber', description: 'Purchase order number', type: 'string', required: true },
      { name: 'amount', description: 'Invoice amount', type: 'number', required: true },
    ],
  },
  {
    id: 'TPL-MM-004',
    module: 'MM',
    name: 'Stock Transfer',
    description: 'Transfer stock between plants or storage locations',
    type: 'integration',
    priority: 'high',
    steps: [
      { stepNumber: 1, action: 'Open MIGO for transfer posting', type: 'rfc_call', params: { tcode: 'MIGO', movementType: '311' }, expectedResult: 'Transfer posting screen opens' },
      { stepNumber: 2, action: 'Enter material {{material}} and locations', type: 'field_validation', params: { material: '{{material}}', fromSloc: '{{fromSloc}}', toSloc: '{{toSloc}}' }, expectedResult: 'Locations validated with sufficient stock' },
      { stepNumber: 3, action: 'Post transfer', type: 'bapi_call', params: { bapi: 'BAPI_GOODSMVT_CREATE', quantity: '{{quantity}}' }, expectedResult: 'Material document created for transfer' },
    ],
    variables: [
      { name: 'material', description: 'Material number', type: 'string', required: true },
      { name: 'fromSloc', description: 'Source storage location', type: 'string', required: true },
      { name: 'toSloc', description: 'Target storage location', type: 'string', required: true },
      { name: 'quantity', description: 'Transfer quantity', type: 'number', required: true },
    ],
  },
  {
    id: 'TPL-MM-005',
    module: 'MM',
    name: 'Vendor Master Create (XK01)',
    description: 'Create a new vendor master record with all views',
    type: 'e2e',
    priority: 'high',
    steps: [
      { stepNumber: 1, action: 'Open XK01 vendor create', type: 'rfc_call', params: { tcode: 'XK01', companyCode: '{{companyCode}}' }, expectedResult: 'Vendor creation screen opens' },
      { stepNumber: 2, action: 'Enter general data', type: 'field_validation', params: { name: '{{vendorName}}', country: '{{country}}' }, expectedResult: 'General data validated' },
      { stepNumber: 3, action: 'Enter accounting data', type: 'field_validation', params: { reconAccount: '{{reconAccount}}' }, expectedResult: 'Accounting data validated' },
      { stepNumber: 4, action: 'Enter purchasing data', type: 'field_validation', params: { purchOrg: '{{purchOrg}}', paymentTerms: '{{paymentTerms}}' }, expectedResult: 'Purchasing data validated' },
      { stepNumber: 5, action: 'Save vendor', type: 'bapi_call', params: { bapi: 'BAPI_VENDOR_CREATE' }, expectedResult: 'Vendor number assigned' },
    ],
    variables: [
      { name: 'companyCode', description: 'Company code', type: 'string', required: true, defaultValue: '1000' },
      { name: 'vendorName', description: 'Vendor name', type: 'string', required: true },
      { name: 'country', description: 'Country key', type: 'string', required: true, defaultValue: 'US' },
      { name: 'reconAccount', description: 'Reconciliation account', type: 'string', required: true },
      { name: 'purchOrg', description: 'Purchasing organization', type: 'string', required: true },
      { name: 'paymentTerms', description: 'Payment terms key', type: 'string', required: false, defaultValue: 'NT30' },
    ],
  },

  // ── SD Templates ──────────────────────────────────────────────────────
  {
    id: 'TPL-SD-001',
    module: 'SD',
    name: 'Sales Order Create (VA01)',
    description: 'Create a standard sales order with pricing determination',
    type: 'e2e',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Open VA01 sales order creation', type: 'rfc_call', params: { tcode: 'VA01', orderType: '{{orderType}}' }, expectedResult: 'Sales order screen opens' },
      { stepNumber: 2, action: 'Enter sold-to party {{customer}} and ship-to', type: 'field_validation', params: { customer: '{{customer}}', salesOrg: '{{salesOrg}}' }, expectedResult: 'Customer data validated' },
      { stepNumber: 3, action: 'Add material {{material}} qty {{quantity}}', type: 'field_validation', params: { material: '{{material}}', quantity: '{{quantity}}' }, expectedResult: 'Material and pricing determined' },
      { stepNumber: 4, action: 'Save order', type: 'bapi_call', params: { bapi: 'BAPI_SALESORDER_CREATEFROMDAT2' }, expectedResult: 'Sales order number generated' },
    ],
    variables: [
      { name: 'orderType', description: 'Sales order type', type: 'string', required: true, defaultValue: 'OR' },
      { name: 'customer', description: 'Sold-to party number', type: 'string', required: true },
      { name: 'salesOrg', description: 'Sales organization', type: 'string', required: true },
      { name: 'material', description: 'Material number', type: 'string', required: true },
      { name: 'quantity', description: 'Order quantity', type: 'number', required: true },
    ],
  },
  {
    id: 'TPL-SD-002',
    module: 'SD',
    name: 'Delivery Create (VL01N)',
    description: 'Create outbound delivery from sales order',
    type: 'e2e',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Open VL01N delivery creation', type: 'rfc_call', params: { tcode: 'VL01N', shippingPoint: '{{shippingPoint}}' }, expectedResult: 'Delivery creation screen opens' },
      { stepNumber: 2, action: 'Enter sales order {{salesOrder}}', type: 'field_validation', params: { salesOrder: '{{salesOrder}}' }, expectedResult: 'Order items loaded for delivery' },
      { stepNumber: 3, action: 'Pick and pack items', type: 'bapi_call', params: { bapi: 'BAPI_OUTB_DELIVERY_CREATE_SLS' }, expectedResult: 'Delivery document created' },
      { stepNumber: 4, action: 'Post goods issue', type: 'bapi_call', params: { bapi: 'BAPI_OUTB_DELIVERY_CONFIRM_DEC' }, expectedResult: 'Goods issue posted, stock reduced' },
    ],
    variables: [
      { name: 'shippingPoint', description: 'Shipping point', type: 'string', required: true },
      { name: 'salesOrder', description: 'Sales order number', type: 'string', required: true },
    ],
  },
  {
    id: 'TPL-SD-003',
    module: 'SD',
    name: 'Billing Create (VF01)',
    description: 'Create billing document from delivery',
    type: 'e2e',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Open VF01 billing', type: 'rfc_call', params: { tcode: 'VF01' }, expectedResult: 'Billing screen opens' },
      { stepNumber: 2, action: 'Enter delivery {{delivery}}', type: 'field_validation', params: { delivery: '{{delivery}}' }, expectedResult: 'Delivery loaded for billing' },
      { stepNumber: 3, action: 'Create billing document', type: 'bapi_call', params: { bapi: 'BAPI_BILLINGDOC_CREATEMULTIPLE' }, expectedResult: 'Billing document created with accounting entry' },
    ],
    variables: [
      { name: 'delivery', description: 'Delivery document number', type: 'string', required: true },
    ],
  },
  {
    id: 'TPL-SD-004',
    module: 'SD',
    name: 'Pricing Condition',
    description: 'Maintain and verify pricing condition records',
    type: 'integration',
    priority: 'high',
    steps: [
      { stepNumber: 1, action: 'Open VK11 pricing maintenance', type: 'rfc_call', params: { tcode: 'VK11', conditionType: '{{conditionType}}' }, expectedResult: 'Condition maintenance screen opens' },
      { stepNumber: 2, action: 'Create condition record for material {{material}}', type: 'field_validation', params: { material: '{{material}}', amount: '{{conditionAmount}}' }, expectedResult: 'Condition record created' },
      { stepNumber: 3, action: 'Verify pricing in sales order', type: 'table_check', params: { table: 'KONV' }, expectedResult: 'Condition applied correctly in pricing procedure' },
    ],
    variables: [
      { name: 'conditionType', description: 'Condition type (e.g., PR00)', type: 'string', required: true, defaultValue: 'PR00' },
      { name: 'material', description: 'Material number', type: 'string', required: true },
      { name: 'conditionAmount', description: 'Condition amount', type: 'number', required: true },
    ],
  },
  {
    id: 'TPL-SD-005',
    module: 'SD',
    name: 'Credit Management Check',
    description: 'Verify credit limit check blocks orders when exceeded',
    type: 'negative',
    priority: 'high',
    steps: [
      { stepNumber: 1, action: 'Check customer credit exposure FD32', type: 'table_check', params: { table: 'KNKK', customer: '{{customer}}' }, expectedResult: 'Credit limit and exposure displayed' },
      { stepNumber: 2, action: 'Create sales order exceeding credit limit', type: 'bapi_call', params: { bapi: 'BAPI_SALESORDER_CREATEFROMDAT2', amount: '{{excessAmount}}' }, expectedResult: 'Order created but blocked for credit' },
      { stepNumber: 3, action: 'Verify credit block status', type: 'table_check', params: { table: 'VBAK', creditStatus: 'blocked' }, expectedResult: 'Order has credit block indicator' },
    ],
    variables: [
      { name: 'customer', description: 'Customer number', type: 'string', required: true },
      { name: 'excessAmount', description: 'Amount exceeding credit limit', type: 'number', required: true },
    ],
  },

  // ── PP Templates ──────────────────────────────────────────────────────
  {
    id: 'TPL-PP-001',
    module: 'PP',
    name: 'BOM Create (CS01)',
    description: 'Create a bill of materials for a finished product',
    type: 'e2e',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Open CS01 BOM creation', type: 'rfc_call', params: { tcode: 'CS01', material: '{{material}}', plant: '{{plant}}' }, expectedResult: 'BOM creation screen opens' },
      { stepNumber: 2, action: 'Add component {{component1}}', type: 'field_validation', params: { component: '{{component1}}', quantity: '{{compQty1}}' }, expectedResult: 'Component added to BOM' },
      { stepNumber: 3, action: 'Save BOM', type: 'bapi_call', params: { bapi: 'CSAP_MAT_BOM_CREATE' }, expectedResult: 'BOM created with group number' },
    ],
    variables: [
      { name: 'material', description: 'Header material (FERT)', type: 'string', required: true },
      { name: 'plant', description: 'Plant', type: 'string', required: true, defaultValue: '1000' },
      { name: 'component1', description: 'Component material', type: 'string', required: true },
      { name: 'compQty1', description: 'Component quantity', type: 'number', required: true },
    ],
  },
  {
    id: 'TPL-PP-002',
    module: 'PP',
    name: 'Routing Create (CA01)',
    description: 'Create a routing with operations for production',
    type: 'e2e',
    priority: 'high',
    steps: [
      { stepNumber: 1, action: 'Open CA01 routing creation', type: 'rfc_call', params: { tcode: 'CA01', material: '{{material}}', plant: '{{plant}}' }, expectedResult: 'Routing creation screen opens' },
      { stepNumber: 2, action: 'Add operation at work center {{workCenter}}', type: 'field_validation', params: { workCenter: '{{workCenter}}', setupTime: '{{setupTime}}', machineTime: '{{machineTime}}' }, expectedResult: 'Operation added with times' },
      { stepNumber: 3, action: 'Save routing', type: 'rfc_call', params: { tcode: 'CA01' }, expectedResult: 'Routing saved with group counter' },
    ],
    variables: [
      { name: 'material', description: 'Material for routing', type: 'string', required: true },
      { name: 'plant', description: 'Plant', type: 'string', required: true, defaultValue: '1000' },
      { name: 'workCenter', description: 'Work center', type: 'string', required: true },
      { name: 'setupTime', description: 'Setup time in minutes', type: 'number', required: false, defaultValue: 30 },
      { name: 'machineTime', description: 'Machine time in minutes', type: 'number', required: false, defaultValue: 60 },
    ],
  },
  {
    id: 'TPL-PP-003',
    module: 'PP',
    name: 'Production Order (CO01)',
    description: 'Create and release a production order',
    type: 'e2e',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Create production order CO01', type: 'bapi_call', params: { bapi: 'BAPI_PRODORD_CREATE', material: '{{material}}', plant: '{{plant}}', quantity: '{{quantity}}' }, expectedResult: 'Production order created' },
      { stepNumber: 2, action: 'Release production order', type: 'bapi_call', params: { bapi: 'BAPI_PRODORD_RELEASE' }, expectedResult: 'Order released for execution' },
      { stepNumber: 3, action: 'Verify order status', type: 'table_check', params: { table: 'AFKO' }, expectedResult: 'Order status is REL (released)' },
    ],
    variables: [
      { name: 'material', description: 'Material to produce', type: 'string', required: true },
      { name: 'plant', description: 'Production plant', type: 'string', required: true, defaultValue: '1000' },
      { name: 'quantity', description: 'Order quantity', type: 'number', required: true },
    ],
  },
  {
    id: 'TPL-PP-004',
    module: 'PP',
    name: 'Order Confirmation (CO11N)',
    description: 'Confirm production order operations with yield',
    type: 'e2e',
    priority: 'high',
    steps: [
      { stepNumber: 1, action: 'Open CO11N confirmation', type: 'rfc_call', params: { tcode: 'CO11N', orderNumber: '{{orderNumber}}' }, expectedResult: 'Confirmation screen opens' },
      { stepNumber: 2, action: 'Enter yield {{yield}} and scrap {{scrap}}', type: 'field_validation', params: { yield: '{{yield}}', scrap: '{{scrap}}' }, expectedResult: 'Quantities validated' },
      { stepNumber: 3, action: 'Post confirmation', type: 'bapi_call', params: { bapi: 'BAPI_PRODORDCONF_CREATE_TT' }, expectedResult: 'Confirmation posted with goods movements' },
    ],
    variables: [
      { name: 'orderNumber', description: 'Production order number', type: 'string', required: true },
      { name: 'yield', description: 'Yield quantity', type: 'number', required: true },
      { name: 'scrap', description: 'Scrap quantity', type: 'number', required: false, defaultValue: 0 },
    ],
  },

  // ── HR Templates ──────────────────────────────────────────────────────
  {
    id: 'TPL-HR-001',
    module: 'HR',
    name: 'Employee Create (PA30)',
    description: 'Create a new employee record with essential infotypes',
    type: 'e2e',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Open PA30 personnel administration', type: 'rfc_call', params: { tcode: 'PA30' }, expectedResult: 'Personnel master screen opens' },
      { stepNumber: 2, action: 'Create infotype 0002 (Personal Data)', type: 'field_validation', params: { infotype: '0002', firstName: '{{firstName}}', lastName: '{{lastName}}' }, expectedResult: 'Personal data saved' },
      { stepNumber: 3, action: 'Create infotype 0001 (Org Assignment)', type: 'field_validation', params: { infotype: '0001', personnelArea: '{{personnelArea}}', orgUnit: '{{orgUnit}}' }, expectedResult: 'Organizational assignment saved' },
      { stepNumber: 4, action: 'Verify employee number assigned', type: 'table_check', params: { table: 'PA0001' }, expectedResult: 'Employee record created with number' },
    ],
    variables: [
      { name: 'firstName', description: 'Employee first name', type: 'string', required: true },
      { name: 'lastName', description: 'Employee last name', type: 'string', required: true },
      { name: 'personnelArea', description: 'Personnel area', type: 'string', required: true },
      { name: 'orgUnit', description: 'Organizational unit', type: 'string', required: true },
    ],
  },
  {
    id: 'TPL-HR-002',
    module: 'HR',
    name: 'Payroll Simulation (PC00)',
    description: 'Run payroll simulation and verify calculations',
    type: 'integration',
    priority: 'critical',
    steps: [
      { stepNumber: 1, action: 'Run payroll simulation PC00_M99_CALC_SIMU', type: 'rfc_call', params: { tcode: 'PC00_M99_CALC_SIMU', employee: '{{employeeNumber}}', period: '{{payPeriod}}' }, expectedResult: 'Simulation completed without errors' },
      { stepNumber: 2, action: 'Verify gross amount', type: 'field_validation', params: { expectedGross: '{{expectedGross}}' }, expectedResult: 'Gross amount matches expected' },
      { stepNumber: 3, action: 'Verify deductions', type: 'table_check', params: { table: 'PCL2' }, expectedResult: 'Deductions calculated correctly' },
    ],
    variables: [
      { name: 'employeeNumber', description: 'Employee personnel number', type: 'string', required: true },
      { name: 'payPeriod', description: 'Pay period (MM/YYYY)', type: 'string', required: true },
      { name: 'expectedGross', description: 'Expected gross amount', type: 'number', required: false },
    ],
  },
  {
    id: 'TPL-HR-003',
    module: 'HR',
    name: 'Time Entry (PA61)',
    description: 'Record employee attendance or absence',
    type: 'e2e',
    priority: 'high',
    steps: [
      { stepNumber: 1, action: 'Open PA61 time management', type: 'rfc_call', params: { tcode: 'PA61', employee: '{{employeeNumber}}' }, expectedResult: 'Time entry screen opens' },
      { stepNumber: 2, action: 'Enter absence type {{absenceType}} for dates', type: 'field_validation', params: { infotype: '2001', absenceType: '{{absenceType}}', startDate: '{{startDate}}', endDate: '{{endDate}}' }, expectedResult: 'Absence entry validated (no collision)' },
      { stepNumber: 3, action: 'Save time record', type: 'bapi_call', params: { bapi: 'BAPI_ABSENCE_CREATE' }, expectedResult: 'Time record saved' },
    ],
    variables: [
      { name: 'employeeNumber', description: 'Employee number', type: 'string', required: true },
      { name: 'absenceType', description: 'Absence type code', type: 'string', required: true, defaultValue: '0100' },
      { name: 'startDate', description: 'Absence start date', type: 'date', required: true },
      { name: 'endDate', description: 'Absence end date', type: 'date', required: true },
    ],
  },
  {
    id: 'TPL-HR-004',
    module: 'HR',
    name: 'Org Unit Maintenance',
    description: 'Create or update organizational unit in OM',
    type: 'integration',
    priority: 'medium',
    steps: [
      { stepNumber: 1, action: 'Open PPOME organization management', type: 'rfc_call', params: { tcode: 'PPOME' }, expectedResult: 'Organization structure displayed' },
      { stepNumber: 2, action: 'Create/modify org unit {{orgUnit}}', type: 'field_validation', params: { orgUnit: '{{orgUnit}}', description: '{{description}}' }, expectedResult: 'Org unit maintained' },
      { stepNumber: 3, action: 'Verify in org structure', type: 'table_check', params: { table: 'HRP1000', objectType: 'O' }, expectedResult: 'Org unit appears in hierarchy' },
    ],
    variables: [
      { name: 'orgUnit', description: 'Organizational unit ID', type: 'string', required: true },
      { name: 'description', description: 'Org unit description', type: 'string', required: true },
    ],
  },
  {
    id: 'TPL-HR-005',
    module: 'HR',
    name: 'Position Maintenance',
    description: 'Create or assign a position in organizational management',
    type: 'integration',
    priority: 'medium',
    steps: [
      { stepNumber: 1, action: 'Open PPOME for position maintenance', type: 'rfc_call', params: { tcode: 'PPOME' }, expectedResult: 'Position management screen opens' },
      { stepNumber: 2, action: 'Create position under org unit {{orgUnit}}', type: 'field_validation', params: { positionName: '{{positionName}}', orgUnit: '{{orgUnit}}' }, expectedResult: 'Position created and linked to org unit' },
      { stepNumber: 3, action: 'Verify position in hierarchy', type: 'table_check', params: { table: 'HRP1001', objectType: 'S' }, expectedResult: 'Position visible in org chart' },
    ],
    variables: [
      { name: 'orgUnit', description: 'Parent organizational unit', type: 'string', required: true },
      { name: 'positionName', description: 'Position description', type: 'string', required: true },
    ],
  },
];

class TestCatalog {
  /**
   * Get the static test catalog
   * @returns {object[]}
   */
  static get TEST_CATALOG() {
    return TEST_CATALOG;
  }

  /**
   * Get a template by ID
   * @param {string} templateId
   * @returns {object}
   */
  static getTemplate(templateId) {
    const template = TEST_CATALOG.find(t => t.id === templateId);
    if (!template) {
      throw new TestingError(`Template not found: ${templateId}`, { templateId });
    }
    return JSON.parse(JSON.stringify(template)); // deep clone
  }

  /**
   * List templates with optional filters
   * @param {object} [filters] - { module?, type?, priority? }
   * @returns {object[]}
   */
  static listTemplates(filters) {
    let results = [...TEST_CATALOG];

    if (filters) {
      if (filters.module) {
        results = results.filter(t => t.module === filters.module.toUpperCase());
      }
      if (filters.type) {
        results = results.filter(t => t.type === filters.type);
      }
      if (filters.priority) {
        results = results.filter(t => t.priority === filters.priority);
      }
    }

    return results.map(t => JSON.parse(JSON.stringify(t)));
  }

  /**
   * Instantiate a template by filling variable placeholders with concrete values
   * @param {string} templateId
   * @param {object} variables - Key-value pairs for variable substitution
   * @returns {object} - Filled test case
   */
  static instantiate(templateId, variables = {}) {
    const template = TestCatalog.getTemplate(templateId);

    // Check required variables
    const missingRequired = (template.variables || [])
      .filter(v => v.required && variables[v.name] === undefined && v.defaultValue === undefined)
      .map(v => v.name);

    if (missingRequired.length > 0) {
      throw new TestingError(`Missing required variables: ${missingRequired.join(', ')}`, {
        templateId,
        missingRequired,
      });
    }

    // Build substitution map including defaults
    const substitutionMap = {};
    for (const varDef of (template.variables || [])) {
      if (variables[varDef.name] !== undefined) {
        substitutionMap[varDef.name] = String(variables[varDef.name]);
      } else if (varDef.defaultValue !== undefined) {
        substitutionMap[varDef.name] = String(varDef.defaultValue);
      }
    }

    // Recursive substitution
    const substitute = (obj) => {
      if (typeof obj === 'string') {
        let result = obj;
        for (const [key, val] of Object.entries(substitutionMap)) {
          result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
        }
        return result;
      }
      if (Array.isArray(obj)) {
        return obj.map(item => substitute(item));
      }
      if (obj !== null && typeof obj === 'object') {
        const result = {};
        for (const [key, val] of Object.entries(obj)) {
          result[key] = substitute(val);
        }
        return result;
      }
      return obj;
    };

    const filled = substitute(template);

    // Convert to test case format (remove variables definition, add generated metadata)
    const testCase = {
      id: filled.id,
      name: filled.name,
      type: filled.type,
      module: filled.module,
      priority: filled.priority,
      tags: [filled.module.toLowerCase(), 'catalog', filled.type],
      steps: filled.steps,
      expectedResults: filled.steps.map(s => s.expectedResult),
      preconditions: ['SAP system available', `User has ${filled.module} authorization`],
      generatedAt: new Date().toISOString(),
      templateId: templateId,
    };

    log.info('Instantiated template', { templateId, variables: Object.keys(variables) });
    return testCase;
  }

  /**
   * Validate a test case against the required schema
   * @param {object} testCase
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validateTestCase(testCase) {
    const errors = [];

    if (!testCase) {
      return { valid: false, errors: ['Test case is null or undefined'] };
    }

    if (!testCase.id) {
      errors.push('Missing required field: id');
    }

    if (!testCase.name) {
      errors.push('Missing required field: name');
    }

    if (!testCase.type) {
      errors.push('Missing required field: type');
    }

    if (!testCase.steps || !Array.isArray(testCase.steps)) {
      errors.push('Missing required field: steps (must be an array)');
    } else if (testCase.steps.length === 0) {
      errors.push('Steps array must contain at least 1 step');
    } else {
      for (let i = 0; i < testCase.steps.length; i++) {
        const step = testCase.steps[i];
        if (!step.action) {
          errors.push(`Step ${i + 1}: missing action`);
        }
        if (!step.expectedResult) {
          errors.push(`Step ${i + 1}: missing expectedResult`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Categorize test cases by module, type, and priority
   * @param {object[]} testCases
   * @returns {{ byModule: object, byType: object, byPriority: object }}
   */
  static categorize(testCases) {
    const byModule = {};
    const byType = {};
    const byPriority = {};

    for (const tc of testCases) {
      // By module
      const mod = tc.module || 'UNKNOWN';
      if (!byModule[mod]) byModule[mod] = [];
      byModule[mod].push(tc);

      // By type
      const type = tc.type || 'unknown';
      if (!byType[type]) byType[type] = [];
      byType[type].push(tc);

      // By priority
      const prio = tc.priority || 'medium';
      if (!byPriority[prio]) byPriority[prio] = [];
      byPriority[prio].push(tc);
    }

    return { byModule, byType, byPriority };
  }
}

module.exports = { TestCatalog, TEST_CATALOG };
