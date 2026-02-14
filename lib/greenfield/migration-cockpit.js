/**
 * Migration Cockpit Template Generator
 *
 * Generates pre-populated templates for SAP Migration Cockpit (LTMC) from
 * analyzed source data. Supports 50+ migration objects across FI, CO, MM,
 * SD, BP, HR, PM, PP, and Banking domains with field mapping, validation,
 * staging DDL generation, and XML/Excel export.
 */

'use strict';

const Logger = require('../logger');

// ─────────────────────────────────────────────────────────────────────────────
// Migration Object Catalog (50+ objects across 9 domains)
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATION_CATALOG = {
  // ── FI (Financial Accounting) ──
  'FI-GLACCOUNT': {
    id: 'FI-GLACCOUNT',
    domain: 'FI',
    name: 'GL Account',
    description: 'General Ledger account master data',
    sapObject: 'FINSC_GL_ACCOUNT',
    fields: [
      { name: 'CHART_OF_ACCOUNTS', type: 'CHAR', length: 4, required: true, description: 'Chart of Accounts' },
      { name: 'GL_ACCOUNT', type: 'CHAR', length: 10, required: true, description: 'GL Account Number' },
      { name: 'SHORT_TEXT', type: 'CHAR', length: 20, required: true, description: 'Short Text' },
      { name: 'LONG_TEXT', type: 'CHAR', length: 50, required: false, description: 'Long Text' },
      { name: 'ACCOUNT_GROUP', type: 'CHAR', length: 4, required: true, description: 'Account Group' },
      { name: 'ACCOUNT_TYPE', type: 'CHAR', length: 1, required: true, description: 'Account Type (P/L/BS)', valueHelp: ['P', 'L', 'X'] },
      { name: 'RECONCILIATION_ACCT_TYPE', type: 'CHAR', length: 1, required: false, description: 'Reconciliation Account Type' },
      { name: 'CURRENCY', type: 'CUKY', length: 5, required: false, description: 'Account Currency' },
      { name: 'TAX_CATEGORY', type: 'CHAR', length: 1, required: false, description: 'Tax Category' },
      { name: 'ONLY_BALANCES_IN_LC', type: 'CHAR', length: 1, required: false, description: 'Only Balances in Local Currency' },
    ],
  },
  'FI-COMPANYCODE': {
    id: 'FI-COMPANYCODE',
    domain: 'FI',
    name: 'Company Code',
    description: 'Company code global settings',
    sapObject: 'FINSC_COMPANY_CODE',
    fields: [
      { name: 'COMPANY_CODE', type: 'CHAR', length: 4, required: true, description: 'Company Code' },
      { name: 'COMPANY_NAME', type: 'CHAR', length: 25, required: true, description: 'Company Name' },
      { name: 'CITY', type: 'CHAR', length: 25, required: true, description: 'City' },
      { name: 'COUNTRY', type: 'CHAR', length: 3, required: true, description: 'Country Key' },
      { name: 'CURRENCY', type: 'CUKY', length: 5, required: true, description: 'Currency Key' },
      { name: 'LANGUAGE', type: 'LANG', length: 1, required: true, description: 'Language Key' },
      { name: 'CHART_OF_ACCOUNTS', type: 'CHAR', length: 4, required: true, description: 'Chart of Accounts' },
      { name: 'FISCAL_YEAR_VARIANT', type: 'CHAR', length: 2, required: true, description: 'Fiscal Year Variant' },
      { name: 'POSTING_PERIOD_VARIANT', type: 'CHAR', length: 4, required: false, description: 'Posting Period Variant' },
    ],
  },
  'FI-FISCALYEARVARIANT': {
    id: 'FI-FISCALYEARVARIANT',
    domain: 'FI',
    name: 'Fiscal Year Variant',
    description: 'Fiscal year variant configuration',
    sapObject: 'FINSC_FISCAL_YEAR_VARIANT',
    fields: [
      { name: 'FISCAL_YEAR_VARIANT', type: 'CHAR', length: 2, required: true, description: 'Fiscal Year Variant' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 30, required: true, description: 'Description' },
      { name: 'YEAR_DEPENDENT', type: 'CHAR', length: 1, required: false, description: 'Year Dependent' },
      { name: 'CALENDAR_YEAR', type: 'CHAR', length: 1, required: false, description: 'Same as Calendar Year' },
    ],
  },
  'FI-DOCUMENTTYPE': {
    id: 'FI-DOCUMENTTYPE',
    domain: 'FI',
    name: 'Document Type',
    description: 'FI document type configuration',
    sapObject: 'FINSC_DOCUMENT_TYPE',
    fields: [
      { name: 'DOCUMENT_TYPE', type: 'CHAR', length: 2, required: true, description: 'Document Type' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
      { name: 'NUMBER_RANGE', type: 'CHAR', length: 2, required: true, description: 'Number Range' },
      { name: 'ACCOUNT_TYPE_ALLOWED', type: 'CHAR', length: 5, required: false, description: 'Account Types Allowed' },
      { name: 'REVERSE_DOC_TYPE', type: 'CHAR', length: 2, required: false, description: 'Reverse Document Type' },
      { name: 'NET_DOC_TYPE', type: 'CHAR', length: 1, required: false, description: 'Net Document Type Flag' },
    ],
  },
  'FI-POSTINGKEY': {
    id: 'FI-POSTINGKEY',
    domain: 'FI',
    name: 'Posting Key',
    description: 'FI posting key configuration',
    sapObject: 'FINSC_POSTING_KEY',
    fields: [
      { name: 'POSTING_KEY', type: 'CHAR', length: 2, required: true, description: 'Posting Key' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
      { name: 'DEBIT_CREDIT', type: 'CHAR', length: 1, required: true, description: 'Debit/Credit Indicator', valueHelp: ['S', 'H'] },
      { name: 'ACCOUNT_TYPE', type: 'CHAR', length: 1, required: true, description: 'Account Type' },
      { name: 'SALES_RELATED', type: 'CHAR', length: 1, required: false, description: 'Sales Related' },
    ],
  },
  'FI-TAXCODE': {
    id: 'FI-TAXCODE',
    domain: 'FI',
    name: 'Tax Code',
    description: 'Tax code master data',
    sapObject: 'FINSC_TAX_CODE',
    fields: [
      { name: 'COUNTRY', type: 'CHAR', length: 3, required: true, description: 'Country Key' },
      { name: 'TAX_CODE', type: 'CHAR', length: 2, required: true, description: 'Tax Code' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 50, required: true, description: 'Description' },
      { name: 'TAX_TYPE', type: 'CHAR', length: 1, required: true, description: 'Tax Type (Input/Output)', valueHelp: ['V', 'A'] },
      { name: 'TAX_PERCENT', type: 'DEC', length: 5, required: false, description: 'Tax Percentage', decimals: 2 },
      { name: 'GL_ACCOUNT', type: 'CHAR', length: 10, required: false, description: 'Tax GL Account' },
    ],
  },
  'FI-GLBALANCE': {
    id: 'FI-GLBALANCE',
    domain: 'FI',
    name: 'GL Account Balance',
    description: 'GL account opening balances',
    sapObject: 'FINSC_GL_BALANCE',
    fields: [
      { name: 'COMPANY_CODE', type: 'CHAR', length: 4, required: true, description: 'Company Code' },
      { name: 'GL_ACCOUNT', type: 'CHAR', length: 10, required: true, description: 'GL Account Number' },
      { name: 'FISCAL_YEAR', type: 'NUMC', length: 4, required: true, description: 'Fiscal Year' },
      { name: 'PERIOD', type: 'NUMC', length: 2, required: true, description: 'Posting Period' },
      { name: 'BALANCE', type: 'CURR', length: 15, required: true, description: 'Balance Amount', decimals: 2 },
      { name: 'CURRENCY', type: 'CUKY', length: 5, required: true, description: 'Currency' },
    ],
  },

  // ── CO (Controlling) ──
  'CO-COSTCENTER': {
    id: 'CO-COSTCENTER',
    domain: 'CO',
    name: 'Cost Center',
    description: 'Cost center master data',
    sapObject: 'FINSC_COST_CENTER',
    fields: [
      { name: 'CONTROLLING_AREA', type: 'CHAR', length: 4, required: true, description: 'Controlling Area' },
      { name: 'COST_CENTER', type: 'CHAR', length: 10, required: true, description: 'Cost Center' },
      { name: 'VALID_FROM', type: 'DATS', length: 8, required: true, description: 'Valid From Date' },
      { name: 'VALID_TO', type: 'DATS', length: 8, required: true, description: 'Valid To Date' },
      { name: 'NAME', type: 'CHAR', length: 40, required: true, description: 'Cost Center Name' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: false, description: 'Description' },
      { name: 'PERSON_RESPONSIBLE', type: 'CHAR', length: 20, required: false, description: 'Person Responsible' },
      { name: 'DEPARTMENT', type: 'CHAR', length: 12, required: false, description: 'Department' },
      { name: 'COST_CENTER_CATEGORY', type: 'CHAR', length: 1, required: true, description: 'Category' },
      { name: 'HIERARCHY_AREA', type: 'CHAR', length: 12, required: false, description: 'Hierarchy Area' },
      { name: 'COMPANY_CODE', type: 'CHAR', length: 4, required: true, description: 'Company Code' },
      { name: 'PROFIT_CENTER', type: 'CHAR', length: 10, required: false, description: 'Profit Center' },
    ],
  },
  'CO-PROFITCENTER': {
    id: 'CO-PROFITCENTER',
    domain: 'CO',
    name: 'Profit Center',
    description: 'Profit center master data',
    sapObject: 'FINSC_PROFIT_CENTER',
    fields: [
      { name: 'CONTROLLING_AREA', type: 'CHAR', length: 4, required: true, description: 'Controlling Area' },
      { name: 'PROFIT_CENTER', type: 'CHAR', length: 10, required: true, description: 'Profit Center' },
      { name: 'VALID_FROM', type: 'DATS', length: 8, required: true, description: 'Valid From Date' },
      { name: 'VALID_TO', type: 'DATS', length: 8, required: true, description: 'Valid To Date' },
      { name: 'NAME', type: 'CHAR', length: 40, required: true, description: 'Profit Center Name' },
      { name: 'LONG_TEXT', type: 'CHAR', length: 40, required: false, description: 'Long Text' },
      { name: 'PERSON_RESPONSIBLE', type: 'CHAR', length: 20, required: false, description: 'Person Responsible' },
      { name: 'DEPARTMENT', type: 'CHAR', length: 12, required: false, description: 'Department' },
      { name: 'HIERARCHY_AREA', type: 'CHAR', length: 12, required: false, description: 'Hierarchy Area' },
      { name: 'COMPANY_CODE', type: 'CHAR', length: 4, required: false, description: 'Company Code' },
    ],
  },
  'CO-INTERNALORDER': {
    id: 'CO-INTERNALORDER',
    domain: 'CO',
    name: 'Internal Order',
    description: 'Internal order master data',
    sapObject: 'FINSC_INTERNAL_ORDER',
    fields: [
      { name: 'ORDER_NUMBER', type: 'CHAR', length: 12, required: true, description: 'Order Number' },
      { name: 'ORDER_TYPE', type: 'CHAR', length: 4, required: true, description: 'Order Type' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
      { name: 'CONTROLLING_AREA', type: 'CHAR', length: 4, required: true, description: 'Controlling Area' },
      { name: 'COMPANY_CODE', type: 'CHAR', length: 4, required: true, description: 'Company Code' },
      { name: 'RESPONSIBLE_CCTR', type: 'CHAR', length: 10, required: false, description: 'Responsible Cost Center' },
      { name: 'PROFIT_CENTER', type: 'CHAR', length: 10, required: false, description: 'Profit Center' },
      { name: 'STATUS', type: 'CHAR', length: 1, required: false, description: 'System Status' },
    ],
  },
  'CO-ACTIVITYTYPE': {
    id: 'CO-ACTIVITYTYPE',
    domain: 'CO',
    name: 'Activity Type',
    description: 'Activity type master data',
    sapObject: 'FINSC_ACTIVITY_TYPE',
    fields: [
      { name: 'CONTROLLING_AREA', type: 'CHAR', length: 4, required: true, description: 'Controlling Area' },
      { name: 'ACTIVITY_TYPE', type: 'CHAR', length: 6, required: true, description: 'Activity Type' },
      { name: 'NAME', type: 'CHAR', length: 40, required: true, description: 'Name' },
      { name: 'ACTIVITY_UNIT', type: 'UNIT', length: 3, required: true, description: 'Activity Unit' },
      { name: 'ALLOCATION_TYPE', type: 'CHAR', length: 2, required: false, description: 'Allocation Cost Element' },
    ],
  },
  'CO-STATISTICALKEYFIGURE': {
    id: 'CO-STATISTICALKEYFIGURE',
    domain: 'CO',
    name: 'Statistical Key Figure',
    description: 'Statistical key figure master data',
    sapObject: 'FINSC_STAT_KEY_FIGURE',
    fields: [
      { name: 'CONTROLLING_AREA', type: 'CHAR', length: 4, required: true, description: 'Controlling Area' },
      { name: 'STAT_KEY_FIGURE', type: 'CHAR', length: 6, required: true, description: 'Statistical Key Figure' },
      { name: 'NAME', type: 'CHAR', length: 40, required: true, description: 'Name' },
      { name: 'UNIT', type: 'UNIT', length: 3, required: true, description: 'Unit of Measure' },
      { name: 'KEY_FIGURE_TYPE', type: 'CHAR', length: 1, required: true, description: 'Type (1=Fixed, 2=Totals)', valueHelp: ['1', '2'] },
    ],
  },

  // ── MM (Materials Management) ──
  'MM-MATERIAL': {
    id: 'MM-MATERIAL',
    domain: 'MM',
    name: 'Material Master',
    description: 'Material master data (all views)',
    sapObject: 'MATERIAL',
    fields: [
      { name: 'MATERIAL', type: 'CHAR', length: 40, required: true, description: 'Material Number' },
      { name: 'MATERIAL_TYPE', type: 'CHAR', length: 4, required: true, description: 'Material Type' },
      { name: 'INDUSTRY_SECTOR', type: 'CHAR', length: 1, required: true, description: 'Industry Sector' },
      { name: 'MATERIAL_GROUP', type: 'CHAR', length: 9, required: false, description: 'Material Group' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Material Description' },
      { name: 'BASE_UOM', type: 'UNIT', length: 3, required: true, description: 'Base Unit of Measure' },
      { name: 'GROSS_WEIGHT', type: 'QUAN', length: 13, required: false, description: 'Gross Weight', decimals: 3 },
      { name: 'NET_WEIGHT', type: 'QUAN', length: 13, required: false, description: 'Net Weight', decimals: 3 },
      { name: 'WEIGHT_UNIT', type: 'UNIT', length: 3, required: false, description: 'Weight Unit' },
      { name: 'PLANT', type: 'CHAR', length: 4, required: false, description: 'Plant' },
      { name: 'STORAGE_LOCATION', type: 'CHAR', length: 4, required: false, description: 'Storage Location' },
      { name: 'PURCHASING_GROUP', type: 'CHAR', length: 3, required: false, description: 'Purchasing Group' },
    ],
  },
  'MM-VENDOR': {
    id: 'MM-VENDOR',
    domain: 'MM',
    name: 'Vendor',
    description: 'Vendor master data',
    sapObject: 'VENDOR',
    fields: [
      { name: 'VENDOR', type: 'CHAR', length: 10, required: true, description: 'Vendor Number' },
      { name: 'ACCOUNT_GROUP', type: 'CHAR', length: 4, required: true, description: 'Account Group' },
      { name: 'NAME1', type: 'CHAR', length: 35, required: true, description: 'Name 1' },
      { name: 'NAME2', type: 'CHAR', length: 35, required: false, description: 'Name 2' },
      { name: 'STREET', type: 'CHAR', length: 35, required: false, description: 'Street' },
      { name: 'CITY', type: 'CHAR', length: 35, required: false, description: 'City' },
      { name: 'POSTAL_CODE', type: 'CHAR', length: 10, required: false, description: 'Postal Code' },
      { name: 'COUNTRY', type: 'CHAR', length: 3, required: true, description: 'Country' },
      { name: 'LANGUAGE', type: 'LANG', length: 1, required: false, description: 'Language' },
      { name: 'TELEPHONE', type: 'CHAR', length: 16, required: false, description: 'Telephone' },
      { name: 'TAX_NUMBER', type: 'CHAR', length: 16, required: false, description: 'Tax Number' },
    ],
  },
  'MM-PURCHASEINFORECORD': {
    id: 'MM-PURCHASEINFORECORD',
    domain: 'MM',
    name: 'Purchase Info Record',
    description: 'Purchasing info record data',
    sapObject: 'PURCHASE_INFO_RECORD',
    fields: [
      { name: 'VENDOR', type: 'CHAR', length: 10, required: true, description: 'Vendor Number' },
      { name: 'MATERIAL', type: 'CHAR', length: 40, required: true, description: 'Material Number' },
      { name: 'PURCHASING_ORG', type: 'CHAR', length: 4, required: true, description: 'Purchasing Organization' },
      { name: 'PLANT', type: 'CHAR', length: 4, required: false, description: 'Plant' },
      { name: 'NET_PRICE', type: 'CURR', length: 11, required: false, description: 'Net Price', decimals: 2 },
      { name: 'CURRENCY', type: 'CUKY', length: 5, required: false, description: 'Currency' },
      { name: 'PRICE_UNIT', type: 'DEC', length: 5, required: false, description: 'Price Unit' },
      { name: 'ORDER_UNIT', type: 'UNIT', length: 3, required: false, description: 'Order Unit' },
    ],
  },
  'MM-SOURCELIST': {
    id: 'MM-SOURCELIST',
    domain: 'MM',
    name: 'Source List',
    description: 'Source list for materials',
    sapObject: 'SOURCE_LIST',
    fields: [
      { name: 'MATERIAL', type: 'CHAR', length: 40, required: true, description: 'Material Number' },
      { name: 'PLANT', type: 'CHAR', length: 4, required: true, description: 'Plant' },
      { name: 'VALID_FROM', type: 'DATS', length: 8, required: true, description: 'Valid From' },
      { name: 'VALID_TO', type: 'DATS', length: 8, required: true, description: 'Valid To' },
      { name: 'VENDOR', type: 'CHAR', length: 10, required: true, description: 'Vendor' },
      { name: 'PURCHASING_ORG', type: 'CHAR', length: 4, required: true, description: 'Purchasing Organization' },
      { name: 'FIXED_VENDOR', type: 'CHAR', length: 1, required: false, description: 'Fixed Vendor Indicator' },
      { name: 'BLOCKED', type: 'CHAR', length: 1, required: false, description: 'Blocked Indicator' },
    ],
  },
  'MM-QUOTAARRANGEMENT': {
    id: 'MM-QUOTAARRANGEMENT',
    domain: 'MM',
    name: 'Quota Arrangement',
    description: 'Quota arrangement for procurement',
    sapObject: 'QUOTA_ARRANGEMENT',
    fields: [
      { name: 'MATERIAL', type: 'CHAR', length: 40, required: true, description: 'Material Number' },
      { name: 'PLANT', type: 'CHAR', length: 4, required: true, description: 'Plant' },
      { name: 'VALID_FROM', type: 'DATS', length: 8, required: true, description: 'Valid From' },
      { name: 'VALID_TO', type: 'DATS', length: 8, required: true, description: 'Valid To' },
      { name: 'VENDOR', type: 'CHAR', length: 10, required: true, description: 'Vendor' },
      { name: 'QUOTA_PERCENT', type: 'DEC', length: 3, required: true, description: 'Quota Percentage' },
      { name: 'MINIMUM_QTY', type: 'QUAN', length: 13, required: false, description: 'Minimum Lot Size', decimals: 3 },
    ],
  },
  'MM-STOCKBALANCE': {
    id: 'MM-STOCKBALANCE',
    domain: 'MM',
    name: 'Stock Balance',
    description: 'Material stock opening balances',
    sapObject: 'STOCK_BALANCE',
    fields: [
      { name: 'MATERIAL', type: 'CHAR', length: 40, required: true, description: 'Material Number' },
      { name: 'PLANT', type: 'CHAR', length: 4, required: true, description: 'Plant' },
      { name: 'STORAGE_LOCATION', type: 'CHAR', length: 4, required: true, description: 'Storage Location' },
      { name: 'STOCK_TYPE', type: 'CHAR', length: 2, required: true, description: 'Stock Type' },
      { name: 'QUANTITY', type: 'QUAN', length: 13, required: true, description: 'Quantity', decimals: 3 },
      { name: 'UNIT', type: 'UNIT', length: 3, required: true, description: 'Unit of Measure' },
      { name: 'VALUE', type: 'CURR', length: 15, required: false, description: 'Stock Value', decimals: 2 },
      { name: 'CURRENCY', type: 'CUKY', length: 5, required: false, description: 'Currency' },
    ],
  },

  // ── SD (Sales and Distribution) ──
  'SD-CUSTOMER': {
    id: 'SD-CUSTOMER',
    domain: 'SD',
    name: 'Customer',
    description: 'Customer master data',
    sapObject: 'CUSTOMER',
    fields: [
      { name: 'CUSTOMER', type: 'CHAR', length: 10, required: true, description: 'Customer Number' },
      { name: 'ACCOUNT_GROUP', type: 'CHAR', length: 4, required: true, description: 'Account Group' },
      { name: 'NAME1', type: 'CHAR', length: 35, required: true, description: 'Name 1' },
      { name: 'NAME2', type: 'CHAR', length: 35, required: false, description: 'Name 2' },
      { name: 'STREET', type: 'CHAR', length: 35, required: false, description: 'Street' },
      { name: 'CITY', type: 'CHAR', length: 35, required: false, description: 'City' },
      { name: 'POSTAL_CODE', type: 'CHAR', length: 10, required: false, description: 'Postal Code' },
      { name: 'COUNTRY', type: 'CHAR', length: 3, required: true, description: 'Country' },
      { name: 'LANGUAGE', type: 'LANG', length: 1, required: false, description: 'Language' },
      { name: 'TELEPHONE', type: 'CHAR', length: 16, required: false, description: 'Telephone' },
      { name: 'INDUSTRY', type: 'CHAR', length: 4, required: false, description: 'Industry Key' },
    ],
  },
  'SD-SALESORG': {
    id: 'SD-SALESORG',
    domain: 'SD',
    name: 'Sales Organization',
    description: 'Sales organization configuration',
    sapObject: 'SALES_ORG',
    fields: [
      { name: 'SALES_ORG', type: 'CHAR', length: 4, required: true, description: 'Sales Organization' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
      { name: 'COMPANY_CODE', type: 'CHAR', length: 4, required: true, description: 'Company Code' },
      { name: 'CURRENCY', type: 'CUKY', length: 5, required: true, description: 'Currency' },
      { name: 'COUNTRY', type: 'CHAR', length: 3, required: false, description: 'Country' },
    ],
  },
  'SD-DISTRIBUTIONCHANNEL': {
    id: 'SD-DISTRIBUTIONCHANNEL',
    domain: 'SD',
    name: 'Distribution Channel',
    description: 'Distribution channel configuration',
    sapObject: 'DISTRIBUTION_CHANNEL',
    fields: [
      { name: 'DISTRIBUTION_CHANNEL', type: 'CHAR', length: 2, required: true, description: 'Distribution Channel' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
    ],
  },
  'SD-CONDITIONRECORD': {
    id: 'SD-CONDITIONRECORD',
    domain: 'SD',
    name: 'Condition Record',
    description: 'Pricing condition records',
    sapObject: 'CONDITION_RECORD',
    fields: [
      { name: 'CONDITION_TYPE', type: 'CHAR', length: 4, required: true, description: 'Condition Type' },
      { name: 'SALES_ORG', type: 'CHAR', length: 4, required: true, description: 'Sales Organization' },
      { name: 'DISTRIBUTION_CHANNEL', type: 'CHAR', length: 2, required: false, description: 'Distribution Channel' },
      { name: 'CUSTOMER', type: 'CHAR', length: 10, required: false, description: 'Customer' },
      { name: 'MATERIAL', type: 'CHAR', length: 40, required: false, description: 'Material' },
      { name: 'VALID_FROM', type: 'DATS', length: 8, required: true, description: 'Valid From' },
      { name: 'VALID_TO', type: 'DATS', length: 8, required: true, description: 'Valid To' },
      { name: 'RATE', type: 'CURR', length: 11, required: true, description: 'Rate/Amount', decimals: 2 },
      { name: 'CURRENCY', type: 'CUKY', length: 5, required: true, description: 'Currency' },
      { name: 'PER_UNIT', type: 'QUAN', length: 5, required: false, description: 'Per Unit' },
      { name: 'UNIT', type: 'UNIT', length: 3, required: false, description: 'Unit' },
    ],
  },
  'SD-PRICING': {
    id: 'SD-PRICING',
    domain: 'SD',
    name: 'Pricing Procedure',
    description: 'Pricing procedure configuration',
    sapObject: 'PRICING_PROCEDURE',
    fields: [
      { name: 'PROCEDURE', type: 'CHAR', length: 6, required: true, description: 'Pricing Procedure' },
      { name: 'STEP', type: 'NUMC', length: 3, required: true, description: 'Step Number' },
      { name: 'COUNTER', type: 'NUMC', length: 3, required: true, description: 'Counter' },
      { name: 'CONDITION_TYPE', type: 'CHAR', length: 4, required: true, description: 'Condition Type' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: false, description: 'Description' },
      { name: 'FROM_STEP', type: 'NUMC', length: 3, required: false, description: 'From Step' },
      { name: 'TO_STEP', type: 'NUMC', length: 3, required: false, description: 'To Step' },
      { name: 'MANUAL', type: 'CHAR', length: 1, required: false, description: 'Manual Entry' },
      { name: 'MANDATORY', type: 'CHAR', length: 1, required: false, description: 'Mandatory' },
      { name: 'STATISTICAL', type: 'CHAR', length: 1, required: false, description: 'Statistical' },
    ],
  },
  'SD-CREDITMGMT': {
    id: 'SD-CREDITMGMT',
    domain: 'SD',
    name: 'Credit Management',
    description: 'Customer credit management data',
    sapObject: 'CREDIT_MANAGEMENT',
    fields: [
      { name: 'CUSTOMER', type: 'CHAR', length: 10, required: true, description: 'Customer Number' },
      { name: 'CREDIT_CONTROL_AREA', type: 'CHAR', length: 4, required: true, description: 'Credit Control Area' },
      { name: 'CREDIT_LIMIT', type: 'CURR', length: 15, required: true, description: 'Credit Limit', decimals: 2 },
      { name: 'CURRENCY', type: 'CUKY', length: 5, required: true, description: 'Currency' },
      { name: 'RISK_CATEGORY', type: 'CHAR', length: 3, required: false, description: 'Risk Category' },
    ],
  },

  // ── BP (Business Partner) ──
  'BP-BUSINESSPARTNER': {
    id: 'BP-BUSINESSPARTNER',
    domain: 'BP',
    name: 'Business Partner',
    description: 'Business partner master data',
    sapObject: 'BUSINESS_PARTNER',
    fields: [
      { name: 'BP_NUMBER', type: 'CHAR', length: 10, required: false, description: 'Business Partner Number' },
      { name: 'BP_CATEGORY', type: 'CHAR', length: 1, required: true, description: 'BP Category (1=Person, 2=Org)', valueHelp: ['1', '2'] },
      { name: 'BP_GROUPING', type: 'CHAR', length: 4, required: true, description: 'BP Grouping' },
      { name: 'TITLE', type: 'CHAR', length: 4, required: false, description: 'Title' },
      { name: 'FIRST_NAME', type: 'CHAR', length: 40, required: false, description: 'First Name (Person)' },
      { name: 'LAST_NAME', type: 'CHAR', length: 40, required: false, description: 'Last Name (Person)' },
      { name: 'ORG_NAME1', type: 'CHAR', length: 40, required: false, description: 'Organization Name 1' },
      { name: 'ORG_NAME2', type: 'CHAR', length: 40, required: false, description: 'Organization Name 2' },
      { name: 'STREET', type: 'CHAR', length: 60, required: false, description: 'Street' },
      { name: 'CITY', type: 'CHAR', length: 40, required: false, description: 'City' },
      { name: 'POSTAL_CODE', type: 'CHAR', length: 10, required: false, description: 'Postal Code' },
      { name: 'COUNTRY', type: 'CHAR', length: 3, required: true, description: 'Country' },
      { name: 'LANGUAGE', type: 'LANG', length: 1, required: false, description: 'Language' },
    ],
  },
  'BP-ROLE': {
    id: 'BP-ROLE',
    domain: 'BP',
    name: 'BP Role',
    description: 'Business partner role assignment',
    sapObject: 'BP_ROLE',
    fields: [
      { name: 'BP_NUMBER', type: 'CHAR', length: 10, required: true, description: 'Business Partner Number' },
      { name: 'BP_ROLE', type: 'CHAR', length: 6, required: true, description: 'Business Partner Role' },
      { name: 'VALID_FROM', type: 'DATS', length: 8, required: false, description: 'Valid From' },
      { name: 'VALID_TO', type: 'DATS', length: 8, required: false, description: 'Valid To' },
    ],
  },
  'BP-RELATIONSHIP': {
    id: 'BP-RELATIONSHIP',
    domain: 'BP',
    name: 'BP Relationship',
    description: 'Business partner relationships',
    sapObject: 'BP_RELATIONSHIP',
    fields: [
      { name: 'BP_NUMBER_1', type: 'CHAR', length: 10, required: true, description: 'Business Partner 1' },
      { name: 'BP_NUMBER_2', type: 'CHAR', length: 10, required: true, description: 'Business Partner 2' },
      { name: 'RELATIONSHIP_CATEGORY', type: 'CHAR', length: 6, required: true, description: 'Relationship Category' },
      { name: 'VALID_FROM', type: 'DATS', length: 8, required: false, description: 'Valid From' },
      { name: 'VALID_TO', type: 'DATS', length: 8, required: false, description: 'Valid To' },
    ],
  },
  'BP-BANKDETAIL': {
    id: 'BP-BANKDETAIL',
    domain: 'BP',
    name: 'BP Bank Detail',
    description: 'Business partner bank details',
    sapObject: 'BP_BANK_DETAIL',
    fields: [
      { name: 'BP_NUMBER', type: 'CHAR', length: 10, required: true, description: 'Business Partner Number' },
      { name: 'BANK_ID', type: 'CHAR', length: 5, required: true, description: 'Bank Identification' },
      { name: 'BANK_COUNTRY', type: 'CHAR', length: 3, required: true, description: 'Bank Country' },
      { name: 'BANK_KEY', type: 'CHAR', length: 15, required: true, description: 'Bank Key' },
      { name: 'BANK_ACCOUNT', type: 'CHAR', length: 18, required: true, description: 'Bank Account Number' },
      { name: 'IBAN', type: 'CHAR', length: 34, required: false, description: 'IBAN' },
      { name: 'ACCOUNT_HOLDER', type: 'CHAR', length: 60, required: false, description: 'Account Holder Name' },
    ],
  },

  // ── HR (Human Resources) ──
  'HR-EMPLOYEE': {
    id: 'HR-EMPLOYEE',
    domain: 'HR',
    name: 'Employee',
    description: 'Employee master data',
    sapObject: 'HR_EMPLOYEE',
    fields: [
      { name: 'PERSONNEL_NUMBER', type: 'NUMC', length: 8, required: true, description: 'Personnel Number' },
      { name: 'FIRST_NAME', type: 'CHAR', length: 40, required: true, description: 'First Name' },
      { name: 'LAST_NAME', type: 'CHAR', length: 40, required: true, description: 'Last Name' },
      { name: 'DATE_OF_BIRTH', type: 'DATS', length: 8, required: false, description: 'Date of Birth' },
      { name: 'GENDER', type: 'CHAR', length: 1, required: false, description: 'Gender' },
      { name: 'PERSONNEL_AREA', type: 'CHAR', length: 4, required: true, description: 'Personnel Area' },
      { name: 'PERSONNEL_SUBAREA', type: 'CHAR', length: 4, required: true, description: 'Personnel Subarea' },
      { name: 'EMPLOYEE_GROUP', type: 'CHAR', length: 1, required: true, description: 'Employee Group' },
      { name: 'EMPLOYEE_SUBGROUP', type: 'CHAR', length: 2, required: true, description: 'Employee Subgroup' },
      { name: 'ORG_UNIT', type: 'NUMC', length: 8, required: false, description: 'Organizational Unit' },
      { name: 'POSITION', type: 'NUMC', length: 8, required: false, description: 'Position' },
      { name: 'HIRE_DATE', type: 'DATS', length: 8, required: true, description: 'Hire Date' },
    ],
  },
  'HR-ORGUNIT': {
    id: 'HR-ORGUNIT',
    domain: 'HR',
    name: 'Organizational Unit',
    description: 'Organizational unit master data',
    sapObject: 'HR_ORG_UNIT',
    fields: [
      { name: 'ORG_UNIT', type: 'NUMC', length: 8, required: true, description: 'Organizational Unit' },
      { name: 'SHORT_TEXT', type: 'CHAR', length: 20, required: true, description: 'Short Text' },
      { name: 'LONG_TEXT', type: 'CHAR', length: 40, required: true, description: 'Long Text' },
      { name: 'VALID_FROM', type: 'DATS', length: 8, required: true, description: 'Valid From' },
      { name: 'VALID_TO', type: 'DATS', length: 8, required: true, description: 'Valid To' },
      { name: 'PARENT_ORG_UNIT', type: 'NUMC', length: 8, required: false, description: 'Parent Org Unit' },
      { name: 'COMPANY_CODE', type: 'CHAR', length: 4, required: false, description: 'Company Code' },
    ],
  },
  'HR-POSITION': {
    id: 'HR-POSITION',
    domain: 'HR',
    name: 'Position',
    description: 'Position master data',
    sapObject: 'HR_POSITION',
    fields: [
      { name: 'POSITION', type: 'NUMC', length: 8, required: true, description: 'Position' },
      { name: 'SHORT_TEXT', type: 'CHAR', length: 20, required: true, description: 'Short Text' },
      { name: 'LONG_TEXT', type: 'CHAR', length: 40, required: true, description: 'Long Text' },
      { name: 'VALID_FROM', type: 'DATS', length: 8, required: true, description: 'Valid From' },
      { name: 'VALID_TO', type: 'DATS', length: 8, required: true, description: 'Valid To' },
      { name: 'ORG_UNIT', type: 'NUMC', length: 8, required: true, description: 'Organizational Unit' },
      { name: 'JOB', type: 'NUMC', length: 8, required: false, description: 'Job' },
      { name: 'HEAD_COUNT', type: 'NUMC', length: 3, required: false, description: 'Headcount' },
    ],
  },
  'HR-JOB': {
    id: 'HR-JOB',
    domain: 'HR',
    name: 'Job',
    description: 'Job master data',
    sapObject: 'HR_JOB',
    fields: [
      { name: 'JOB', type: 'NUMC', length: 8, required: true, description: 'Job ID' },
      { name: 'SHORT_TEXT', type: 'CHAR', length: 20, required: true, description: 'Short Text' },
      { name: 'LONG_TEXT', type: 'CHAR', length: 40, required: true, description: 'Long Text' },
      { name: 'VALID_FROM', type: 'DATS', length: 8, required: true, description: 'Valid From' },
      { name: 'VALID_TO', type: 'DATS', length: 8, required: true, description: 'Valid To' },
      { name: 'JOB_FAMILY', type: 'CHAR', length: 8, required: false, description: 'Job Family' },
    ],
  },
  'HR-PAYSCALEAREA': {
    id: 'HR-PAYSCALEAREA',
    domain: 'HR',
    name: 'Pay Scale Area',
    description: 'Pay scale area configuration',
    sapObject: 'HR_PAY_SCALE_AREA',
    fields: [
      { name: 'PAY_SCALE_AREA', type: 'CHAR', length: 2, required: true, description: 'Pay Scale Area' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
      { name: 'COUNTRY', type: 'CHAR', length: 3, required: true, description: 'Country' },
    ],
  },

  // ── PP (Production Planning) ──
  'PP-BOM': {
    id: 'PP-BOM',
    domain: 'PP',
    name: 'Bill of Material',
    description: 'BOM header and items',
    sapObject: 'BOM',
    fields: [
      { name: 'MATERIAL', type: 'CHAR', length: 40, required: true, description: 'Material Number' },
      { name: 'PLANT', type: 'CHAR', length: 4, required: true, description: 'Plant' },
      { name: 'BOM_USAGE', type: 'CHAR', length: 1, required: true, description: 'BOM Usage' },
      { name: 'ALTERNATIVE', type: 'CHAR', length: 2, required: false, description: 'Alternative BOM' },
      { name: 'VALID_FROM', type: 'DATS', length: 8, required: true, description: 'Valid From' },
      { name: 'ITEM_NUMBER', type: 'NUMC', length: 4, required: true, description: 'Item Number' },
      { name: 'COMPONENT', type: 'CHAR', length: 40, required: true, description: 'Component Material' },
      { name: 'QUANTITY', type: 'QUAN', length: 13, required: true, description: 'Component Quantity', decimals: 3 },
      { name: 'UNIT', type: 'UNIT', length: 3, required: true, description: 'Unit' },
    ],
  },
  'PP-ROUTING': {
    id: 'PP-ROUTING',
    domain: 'PP',
    name: 'Routing',
    description: 'Routing/operations data',
    sapObject: 'ROUTING',
    fields: [
      { name: 'MATERIAL', type: 'CHAR', length: 40, required: true, description: 'Material Number' },
      { name: 'PLANT', type: 'CHAR', length: 4, required: true, description: 'Plant' },
      { name: 'GROUP', type: 'CHAR', length: 8, required: true, description: 'Routing Group' },
      { name: 'GROUP_COUNTER', type: 'CHAR', length: 2, required: true, description: 'Group Counter' },
      { name: 'OPERATION', type: 'NUMC', length: 4, required: true, description: 'Operation Number' },
      { name: 'WORK_CENTER', type: 'CHAR', length: 8, required: true, description: 'Work Center' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: false, description: 'Description' },
      { name: 'SETUP_TIME', type: 'QUAN', length: 7, required: false, description: 'Setup Time', decimals: 1 },
      { name: 'MACHINE_TIME', type: 'QUAN', length: 7, required: false, description: 'Machine Time', decimals: 1 },
      { name: 'LABOR_TIME', type: 'QUAN', length: 7, required: false, description: 'Labor Time', decimals: 1 },
    ],
  },
  'PP-WORKCENTER': {
    id: 'PP-WORKCENTER',
    domain: 'PP',
    name: 'Work Center',
    description: 'Work center master data',
    sapObject: 'WORK_CENTER',
    fields: [
      { name: 'WORK_CENTER', type: 'CHAR', length: 8, required: true, description: 'Work Center' },
      { name: 'PLANT', type: 'CHAR', length: 4, required: true, description: 'Plant' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
      { name: 'CATEGORY', type: 'CHAR', length: 4, required: true, description: 'Work Center Category' },
      { name: 'COST_CENTER', type: 'CHAR', length: 10, required: false, description: 'Cost Center' },
      { name: 'CAPACITY_CATEGORY', type: 'CHAR', length: 3, required: false, description: 'Capacity Category' },
    ],
  },

  // ── PM (Plant Maintenance) ──
  'PM-EQUIPMENT': {
    id: 'PM-EQUIPMENT',
    domain: 'PM',
    name: 'Equipment',
    description: 'Equipment master data',
    sapObject: 'EQUIPMENT',
    fields: [
      { name: 'EQUIPMENT', type: 'CHAR', length: 18, required: true, description: 'Equipment Number' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
      { name: 'EQUIPMENT_CATEGORY', type: 'CHAR', length: 1, required: true, description: 'Category' },
      { name: 'PLANT', type: 'CHAR', length: 4, required: true, description: 'Maintenance Plant' },
      { name: 'FUNCTIONAL_LOCATION', type: 'CHAR', length: 30, required: false, description: 'Functional Location' },
      { name: 'COST_CENTER', type: 'CHAR', length: 10, required: false, description: 'Cost Center' },
      { name: 'MANUFACTURER', type: 'CHAR', length: 30, required: false, description: 'Manufacturer' },
      { name: 'MODEL_NUMBER', type: 'CHAR', length: 20, required: false, description: 'Model Number' },
      { name: 'SERIAL_NUMBER', type: 'CHAR', length: 18, required: false, description: 'Serial Number' },
      { name: 'START_DATE', type: 'DATS', length: 8, required: false, description: 'Start-up Date' },
    ],
  },
  'PM-FUNCTIONALLOCATION': {
    id: 'PM-FUNCTIONALLOCATION',
    domain: 'PM',
    name: 'Functional Location',
    description: 'Functional location master data',
    sapObject: 'FUNCTIONAL_LOCATION',
    fields: [
      { name: 'FUNCTIONAL_LOCATION', type: 'CHAR', length: 30, required: true, description: 'Functional Location' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
      { name: 'CATEGORY', type: 'CHAR', length: 1, required: true, description: 'Category' },
      { name: 'STRUCTURE_INDICATOR', type: 'CHAR', length: 4, required: true, description: 'Structure Indicator' },
      { name: 'PLANT', type: 'CHAR', length: 4, required: true, description: 'Maintenance Plant' },
      { name: 'COST_CENTER', type: 'CHAR', length: 10, required: false, description: 'Cost Center' },
      { name: 'SUPERIOR_FUNC_LOC', type: 'CHAR', length: 30, required: false, description: 'Superior Functional Location' },
    ],
  },
  'PM-MAINTENANCEPLAN': {
    id: 'PM-MAINTENANCEPLAN',
    domain: 'PM',
    name: 'Maintenance Plan',
    description: 'Preventive maintenance plans',
    sapObject: 'MAINTENANCE_PLAN',
    fields: [
      { name: 'MAINTENANCE_PLAN', type: 'CHAR', length: 12, required: true, description: 'Maintenance Plan Number' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
      { name: 'PLAN_CATEGORY', type: 'CHAR', length: 2, required: true, description: 'Plan Category' },
      { name: 'CYCLE_UNIT', type: 'UNIT', length: 3, required: true, description: 'Cycle Unit' },
      { name: 'CYCLE_VALUE', type: 'NUMC', length: 4, required: true, description: 'Cycle Value' },
      { name: 'START_DATE', type: 'DATS', length: 8, required: true, description: 'Start Date' },
    ],
  },

  // ── Banking ──
  'BANK-BANKMASTER': {
    id: 'BANK-BANKMASTER',
    domain: 'Banking',
    name: 'Bank Master',
    description: 'Bank master data',
    sapObject: 'BANK_MASTER',
    fields: [
      { name: 'BANK_COUNTRY', type: 'CHAR', length: 3, required: true, description: 'Bank Country' },
      { name: 'BANK_KEY', type: 'CHAR', length: 15, required: true, description: 'Bank Key' },
      { name: 'BANK_NAME', type: 'CHAR', length: 60, required: true, description: 'Bank Name' },
      { name: 'CITY', type: 'CHAR', length: 35, required: false, description: 'City' },
      { name: 'SWIFT_CODE', type: 'CHAR', length: 11, required: false, description: 'SWIFT/BIC Code' },
      { name: 'BANK_GROUP', type: 'CHAR', length: 4, required: false, description: 'Bank Group' },
      { name: 'POST_BANK', type: 'CHAR', length: 1, required: false, description: 'Post Bank Indicator' },
    ],
  },
  'BANK-HOUSEBANK': {
    id: 'BANK-HOUSEBANK',
    domain: 'Banking',
    name: 'House Bank',
    description: 'Company house bank configuration',
    sapObject: 'HOUSE_BANK',
    fields: [
      { name: 'COMPANY_CODE', type: 'CHAR', length: 4, required: true, description: 'Company Code' },
      { name: 'HOUSE_BANK', type: 'CHAR', length: 5, required: true, description: 'House Bank ID' },
      { name: 'BANK_COUNTRY', type: 'CHAR', length: 3, required: true, description: 'Bank Country' },
      { name: 'BANK_KEY', type: 'CHAR', length: 15, required: true, description: 'Bank Key' },
      { name: 'BANK_ACCOUNT', type: 'CHAR', length: 18, required: true, description: 'Bank Account Number' },
      { name: 'GL_ACCOUNT', type: 'CHAR', length: 10, required: true, description: 'GL Account' },
      { name: 'CURRENCY', type: 'CUKY', length: 5, required: false, description: 'Account Currency' },
    ],
  },
  'BANK-PAYMENTMETHOD': {
    id: 'BANK-PAYMENTMETHOD',
    domain: 'Banking',
    name: 'Payment Method',
    description: 'Payment method configuration',
    sapObject: 'PAYMENT_METHOD',
    fields: [
      { name: 'COUNTRY', type: 'CHAR', length: 3, required: true, description: 'Country' },
      { name: 'PAYMENT_METHOD', type: 'CHAR', length: 1, required: true, description: 'Payment Method' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
      { name: 'PAYMENT_TYPE', type: 'CHAR', length: 1, required: true, description: 'Payment Type (I=Incoming, O=Outgoing)', valueHelp: ['I', 'O'] },
      { name: 'MINIMUM_AMOUNT', type: 'CURR', length: 15, required: false, description: 'Minimum Amount', decimals: 2 },
      { name: 'MAXIMUM_AMOUNT', type: 'CURR', length: 15, required: false, description: 'Maximum Amount', decimals: 2 },
    ],
  },

  // ── Additional objects to reach 50+ ──
  'FI-PROFITSEGMENT': {
    id: 'FI-PROFITSEGMENT',
    domain: 'FI',
    name: 'Profit Segment',
    description: 'CO-PA profit segment characteristics',
    sapObject: 'PROFIT_SEGMENT',
    fields: [
      { name: 'RECORD_TYPE', type: 'CHAR', length: 1, required: true, description: 'Record Type' },
      { name: 'CONTROLLING_AREA', type: 'CHAR', length: 4, required: true, description: 'Controlling Area' },
      { name: 'PROFIT_CENTER', type: 'CHAR', length: 10, required: false, description: 'Profit Center' },
      { name: 'PRODUCT', type: 'CHAR', length: 40, required: false, description: 'Product' },
      { name: 'CUSTOMER', type: 'CHAR', length: 10, required: false, description: 'Customer' },
    ],
  },
  'MM-PURCHASEORG': {
    id: 'MM-PURCHASEORG',
    domain: 'MM',
    name: 'Purchasing Organization',
    description: 'Purchasing organization config',
    sapObject: 'PURCHASING_ORG',
    fields: [
      { name: 'PURCHASING_ORG', type: 'CHAR', length: 4, required: true, description: 'Purchasing Organization' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
      { name: 'COMPANY_CODE', type: 'CHAR', length: 4, required: false, description: 'Company Code' },
    ],
  },
  'MM-PLANT': {
    id: 'MM-PLANT',
    domain: 'MM',
    name: 'Plant',
    description: 'Plant master data',
    sapObject: 'PLANT',
    fields: [
      { name: 'PLANT', type: 'CHAR', length: 4, required: true, description: 'Plant' },
      { name: 'NAME', type: 'CHAR', length: 30, required: true, description: 'Plant Name' },
      { name: 'COMPANY_CODE', type: 'CHAR', length: 4, required: true, description: 'Company Code' },
      { name: 'COUNTRY', type: 'CHAR', length: 3, required: true, description: 'Country' },
      { name: 'CITY', type: 'CHAR', length: 25, required: false, description: 'City' },
      { name: 'LANGUAGE', type: 'LANG', length: 1, required: false, description: 'Language' },
    ],
  },
  'MM-STORAGELOCATION': {
    id: 'MM-STORAGELOCATION',
    domain: 'MM',
    name: 'Storage Location',
    description: 'Storage location config',
    sapObject: 'STORAGE_LOCATION',
    fields: [
      { name: 'PLANT', type: 'CHAR', length: 4, required: true, description: 'Plant' },
      { name: 'STORAGE_LOCATION', type: 'CHAR', length: 4, required: true, description: 'Storage Location' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
    ],
  },
  'SD-DIVISION': {
    id: 'SD-DIVISION',
    domain: 'SD',
    name: 'Division',
    description: 'Division configuration',
    sapObject: 'DIVISION',
    fields: [
      { name: 'DIVISION', type: 'CHAR', length: 2, required: true, description: 'Division' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
    ],
  },
  'SD-SALESAREA': {
    id: 'SD-SALESAREA',
    domain: 'SD',
    name: 'Sales Area',
    description: 'Sales area assignment',
    sapObject: 'SALES_AREA',
    fields: [
      { name: 'SALES_ORG', type: 'CHAR', length: 4, required: true, description: 'Sales Organization' },
      { name: 'DISTRIBUTION_CHANNEL', type: 'CHAR', length: 2, required: true, description: 'Distribution Channel' },
      { name: 'DIVISION', type: 'CHAR', length: 2, required: true, description: 'Division' },
    ],
  },
  'CO-COSTELEMENT': {
    id: 'CO-COSTELEMENT',
    domain: 'CO',
    name: 'Cost Element',
    description: 'Primary and secondary cost elements',
    sapObject: 'COST_ELEMENT',
    fields: [
      { name: 'CONTROLLING_AREA', type: 'CHAR', length: 4, required: true, description: 'Controlling Area' },
      { name: 'COST_ELEMENT', type: 'CHAR', length: 10, required: true, description: 'Cost Element' },
      { name: 'VALID_FROM', type: 'DATS', length: 8, required: true, description: 'Valid From' },
      { name: 'VALID_TO', type: 'DATS', length: 8, required: true, description: 'Valid To' },
      { name: 'NAME', type: 'CHAR', length: 40, required: true, description: 'Name' },
      { name: 'COST_ELEMENT_TYPE', type: 'CHAR', length: 2, required: true, description: 'Cost Element Type' },
    ],
  },
  'HR-WAGETYPE': {
    id: 'HR-WAGETYPE',
    domain: 'HR',
    name: 'Wage Type',
    description: 'Wage type configuration',
    sapObject: 'HR_WAGE_TYPE',
    fields: [
      { name: 'WAGE_TYPE', type: 'CHAR', length: 4, required: true, description: 'Wage Type' },
      { name: 'DESCRIPTION', type: 'CHAR', length: 40, required: true, description: 'Description' },
      { name: 'PROCESSING_CLASS', type: 'CHAR', length: 2, required: false, description: 'Processing Class' },
      { name: 'EVALUATION_CLASS', type: 'CHAR', length: 2, required: false, description: 'Evaluation Class' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Levenshtein Distance for Field Matching
// ─────────────────────────────────────────────────────────────────────────────

function levenshtein(a, b) {
  const matrix = [];
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  for (let i = 0; i <= bLen; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= aLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[bLen][aLen];
}

function normalizedSimilarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ─────────────────────────────────────────────────────────────────────────────
// Semantic Matching Helpers
// ─────────────────────────────────────────────────────────────────────────────

const SEMANTIC_SYNONYMS = {
  CUSTOMER: ['KUNNR', 'CUST', 'CUSTOMER_NUMBER', 'CUST_NO', 'CLIENT', 'SOLD_TO'],
  VENDOR: ['LIFNR', 'VEND', 'VENDOR_NUMBER', 'SUPPLIER', 'VEND_NO'],
  MATERIAL: ['MATNR', 'MAT', 'MATERIAL_NUMBER', 'MAT_NO', 'ITEM', 'PRODUCT'],
  PLANT: ['WERKS', 'PLANT_CODE', 'FACTORY'],
  COMPANY_CODE: ['BUKRS', 'COMP_CODE', 'CC'],
  COST_CENTER: ['KOSTL', 'CCTR', 'CC', 'COST_CTR'],
  PROFIT_CENTER: ['PRCTR', 'PC', 'PROF_CTR'],
  GL_ACCOUNT: ['HKONT', 'SAKNR', 'ACCOUNT', 'GL_ACCT', 'ACCT'],
  CURRENCY: ['WAERS', 'CURR', 'CURR_KEY'],
  COUNTRY: ['LAND1', 'COUNTRY_KEY', 'CTRY'],
  DESCRIPTION: ['DESC', 'TEXT', 'NAME', 'DESCR', 'BEZEICHNUNG'],
  QUANTITY: ['MENGE', 'QTY', 'AMOUNT', 'QUAN'],
  DATE_OF_BIRTH: ['BIRTHDATE', 'DOB', 'BIRTH_DATE', 'GBDAT'],
  FIRST_NAME: ['FNAME', 'GIVEN_NAME', 'VORNA'],
  LAST_NAME: ['LNAME', 'SURNAME', 'FAMILY_NAME', 'NACHN'],
  STREET: ['STRAS', 'ADDRESS', 'ADDR'],
  CITY: ['ORT01', 'TOWN'],
  POSTAL_CODE: ['PSTLZ', 'ZIP', 'ZIPCODE', 'ZIP_CODE'],
  TELEPHONE: ['TEL', 'PHONE', 'TELF1'],
};

function semanticScore(sourceField, targetField) {
  const srcUpper = sourceField.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const tgtUpper = targetField.toUpperCase().replace(/[^A-Z0-9]/g, '_');

  // Exact match
  if (srcUpper === tgtUpper) return 1.0;

  // Check synonym groups
  for (const [canonical, synonyms] of Object.entries(SEMANTIC_SYNONYMS)) {
    const allNames = [canonical, ...synonyms];
    const srcMatch = allNames.some(s => srcUpper === s || srcUpper.includes(s) || s.includes(srcUpper));
    const tgtMatch = allNames.some(s => tgtUpper === s || tgtUpper.includes(s) || s.includes(tgtUpper));
    if (srcMatch && tgtMatch) return 0.85;
  }

  // Substring containment
  if (srcUpper.includes(tgtUpper) || tgtUpper.includes(srcUpper)) return 0.7;

  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Type Mapping for DDL
// ─────────────────────────────────────────────────────────────────────────────

const HANA_TYPE_MAP = {
  CHAR: (f) => `NVARCHAR(${f.length})`,
  NUMC: (f) => `NVARCHAR(${f.length})`,
  DATS: () => 'DATE',
  TIMS: () => 'TIME',
  DEC: (f) => `DECIMAL(${f.length}, ${f.decimals || 0})`,
  CURR: (f) => `DECIMAL(${f.length}, ${f.decimals || 2})`,
  QUAN: (f) => `DECIMAL(${f.length}, ${f.decimals || 3})`,
  CUKY: (f) => `NVARCHAR(${f.length})`,
  UNIT: (f) => `NVARCHAR(${f.length})`,
  LANG: (f) => `NVARCHAR(${f.length})`,
  INT4: () => 'INTEGER',
  INT2: () => 'SMALLINT',
  FLTP: () => 'DOUBLE',
  STRING: () => 'NCLOB',
};

// ─────────────────────────────────────────────────────────────────────────────
// MigrationCockpitGenerator
// ─────────────────────────────────────────────────────────────────────────────

class MigrationCockpitGenerator {
  /**
   * @param {object} [options]
   * @param {string} [options.mode='mock'] — 'mock' or 'live'
   * @param {object} [options.logger]
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.log = options.logger || new Logger('migration-cockpit');
  }

  /**
   * List all available LTMC migration objects.
   * @returns {{ objects: object[], totalCount: number, domains: string[] }}
   */
  listMigrationObjects() {
    const objects = Object.values(MIGRATION_CATALOG).map(obj => ({
      id: obj.id,
      domain: obj.domain,
      name: obj.name,
      description: obj.description,
      sapObject: obj.sapObject,
      fieldCount: obj.fields.length,
      requiredFieldCount: obj.fields.filter(f => f.required).length,
    }));

    const domains = [...new Set(objects.map(o => o.domain))].sort();

    return {
      objects,
      totalCount: objects.length,
      domains,
    };
  }

  /**
   * Get the template structure for a given migration object.
   * @param {string} objectId
   * @returns {object} Template structure with field definitions
   */
  getObjectTemplate(objectId) {
    const obj = MIGRATION_CATALOG[objectId];
    if (!obj) {
      throw new Error(`Unknown migration object: ${objectId}`);
    }

    return {
      id: obj.id,
      domain: obj.domain,
      name: obj.name,
      description: obj.description,
      sapObject: obj.sapObject,
      fields: obj.fields.map(f => ({
        name: f.name,
        type: f.type,
        length: f.length,
        decimals: f.decimals || 0,
        required: f.required,
        description: f.description,
        valueHelp: f.valueHelp || null,
      })),
      requiredFields: obj.fields.filter(f => f.required).map(f => f.name),
      optionalFields: obj.fields.filter(f => !f.required).map(f => f.name),
    };
  }

  /**
   * Generate a populated LTMC template from source data and field mapping.
   * @param {string} objectId
   * @param {object[]} sourceData — Array of source records
   * @param {object} fieldMapping — { sourceField: targetField, ... }
   * @returns {object} Generated template with mapped data
   */
  generateTemplate(objectId, sourceData, fieldMapping) {
    const obj = MIGRATION_CATALOG[objectId];
    if (!obj) {
      throw new Error(`Unknown migration object: ${objectId}`);
    }
    if (!Array.isArray(sourceData)) {
      throw new Error('sourceData must be an array');
    }
    if (!fieldMapping || typeof fieldMapping !== 'object') {
      throw new Error('fieldMapping must be an object');
    }

    // Invert the mapping: targetField -> sourceField
    const invertedMapping = {};
    for (const [srcField, tgtField] of Object.entries(fieldMapping)) {
      invertedMapping[tgtField] = srcField;
    }

    // Map source data to target fields
    const mappedRows = sourceData.map((row, idx) => {
      const mapped = {};
      for (const field of obj.fields) {
        const sourceField = invertedMapping[field.name];
        if (sourceField && row[sourceField] !== undefined) {
          mapped[field.name] = this._convertValue(row[sourceField], field);
        } else {
          mapped[field.name] = field.required ? '' : null;
        }
      }
      mapped._rowIndex = idx;
      return mapped;
    });

    // Validate mapped data
    const validationErrors = [];
    for (let i = 0; i < mappedRows.length; i++) {
      const row = mappedRows[i];
      for (const field of obj.fields) {
        if (field.required && (!row[field.name] && row[field.name] !== 0)) {
          validationErrors.push({
            row: i,
            field: field.name,
            message: `Required field "${field.name}" is empty`,
          });
        }
      }
    }

    return {
      objectId: obj.id,
      objectName: obj.name,
      sapObject: obj.sapObject,
      fieldMapping,
      totalRows: mappedRows.length,
      rows: mappedRows,
      validationErrors,
      isValid: validationErrors.length === 0,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Suggest field mapping between source fields and a target migration object.
   * Uses Levenshtein distance + semantic matching for confidence scoring.
   * @param {string[]} sourceFields — Source system field names
   * @param {string} targetObjectId — Target migration object ID
   * @returns {object[]} Array of { source, target, confidence, reason }
   */
  suggestFieldMapping(sourceFields, targetObjectId) {
    const obj = MIGRATION_CATALOG[targetObjectId];
    if (!obj) {
      throw new Error(`Unknown migration object: ${targetObjectId}`);
    }
    if (!Array.isArray(sourceFields)) {
      throw new Error('sourceFields must be an array');
    }

    const suggestions = [];
    const usedTargets = new Set();

    // First pass: find high-confidence matches
    for (const srcField of sourceFields) {
      let bestMatch = null;
      let bestScore = 0;
      let bestReason = '';

      for (const tgtField of obj.fields) {
        if (usedTargets.has(tgtField.name)) continue;

        const srcNorm = srcField.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        const tgtNorm = tgtField.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

        // Exact match
        if (srcNorm === tgtNorm) {
          bestMatch = tgtField.name;
          bestScore = 1.0;
          bestReason = 'Exact match';
          break;
        }

        // Semantic score
        const semScore = semanticScore(srcField, tgtField.name);
        if (semScore > bestScore) {
          bestScore = semScore;
          bestMatch = tgtField.name;
          bestReason = semScore >= 0.85 ? 'Semantic synonym match' : 'Partial name overlap';
        }

        // Levenshtein-based similarity
        const levSim = normalizedSimilarity(srcNorm, tgtNorm);
        if (levSim > bestScore) {
          bestScore = levSim;
          bestMatch = tgtField.name;
          bestReason = 'Fuzzy name similarity';
        }

        // Also try matching against field descriptions
        const descNorm = tgtField.description.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        const descSim = normalizedSimilarity(srcNorm, descNorm);
        const descScore = descSim * 0.7; // discount description matches
        if (descScore > bestScore) {
          bestScore = descScore;
          bestMatch = tgtField.name;
          bestReason = 'Description similarity';
        }
      }

      if (bestMatch && bestScore >= 0.3) {
        suggestions.push({
          source: srcField,
          target: bestMatch,
          confidence: Math.round(bestScore * 100) / 100,
          reason: bestReason,
        });
        usedTargets.add(bestMatch);
      } else {
        suggestions.push({
          source: srcField,
          target: null,
          confidence: 0,
          reason: 'No suitable match found',
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Validate populated template data against migration object rules.
   * @param {string} objectId
   * @param {object[]} data — Array of records with target field names
   * @returns {object} Validation result
   */
  validateTemplate(objectId, data) {
    const obj = MIGRATION_CATALOG[objectId];
    if (!obj) {
      throw new Error(`Unknown migration object: ${objectId}`);
    }
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    const errors = [];
    const warnings = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      for (const field of obj.fields) {
        const value = row[field.name];

        // Required field check
        if (field.required && (value === undefined || value === null || value === '')) {
          errors.push({
            row: i,
            field: field.name,
            type: 'required',
            message: `Required field "${field.name}" is missing or empty`,
          });
          continue;
        }

        if (value === undefined || value === null || value === '') continue;

        // Length check
        const strValue = String(value);
        if (field.type === 'CHAR' || field.type === 'NUMC' || field.type === 'CUKY' || field.type === 'UNIT' || field.type === 'LANG') {
          if (strValue.length > field.length) {
            errors.push({
              row: i,
              field: field.name,
              type: 'length',
              message: `Value "${strValue}" exceeds max length ${field.length} for field "${field.name}"`,
            });
          }
        }

        // NUMC type — must be numeric
        if (field.type === 'NUMC' && !/^\d+$/.test(strValue)) {
          errors.push({
            row: i,
            field: field.name,
            type: 'format',
            message: `Value "${strValue}" must be numeric for NUMC field "${field.name}"`,
          });
        }

        // DATS type — must be valid date format
        if (field.type === 'DATS' && !/^\d{8}$/.test(strValue)) {
          errors.push({
            row: i,
            field: field.name,
            type: 'format',
            message: `Value "${strValue}" must be YYYYMMDD format for date field "${field.name}"`,
          });
        }

        // Value help check
        if (field.valueHelp && !field.valueHelp.includes(strValue)) {
          warnings.push({
            row: i,
            field: field.name,
            type: 'value_help',
            message: `Value "${strValue}" not in allowed values [${field.valueHelp.join(', ')}] for field "${field.name}"`,
          });
        }
      }

      // Check for unknown fields
      for (const key of Object.keys(row)) {
        if (!obj.fields.find(f => f.name === key)) {
          warnings.push({
            row: i,
            field: key,
            type: 'unknown_field',
            message: `Unknown field "${key}" not in migration object template`,
          });
        }
      }
    }

    return {
      objectId,
      objectName: obj.name,
      totalRows: data.length,
      isValid: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors,
      warnings,
    };
  }

  /**
   * Generate HANA DDL for staging tables matching the migration object structure.
   * @param {string} objectId
   * @returns {string} DDL statement
   */
  generateStagingDDL(objectId) {
    const obj = MIGRATION_CATALOG[objectId];
    if (!obj) {
      throw new Error(`Unknown migration object: ${objectId}`);
    }

    const tableName = `ZSTG_${obj.id.replace(/-/g, '_')}`;
    const columns = obj.fields.map(field => {
      const typeMapper = HANA_TYPE_MAP[field.type] || ((f) => `NVARCHAR(${f.length})`);
      const hanaType = typeMapper(field);
      const nullable = field.required ? 'NOT NULL' : 'NULL';
      return `  "${field.name}" ${hanaType} ${nullable}`;
    });

    // Add metadata columns
    columns.push('  "ROW_ID" INTEGER GENERATED ALWAYS AS IDENTITY');
    columns.push('  "LOAD_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    columns.push('  "STATUS" NVARCHAR(20) DEFAULT \'PENDING\'');
    columns.push('  "ERROR_MESSAGE" NVARCHAR(500) NULL');

    const keyFields = obj.fields.filter(f => f.required).slice(0, 3).map(f => `"${f.name}"`);
    const primaryKey = keyFields.length > 0
      ? `,\n  PRIMARY KEY (${keyFields.join(', ')})`
      : '';

    const ddl = `-- Staging table for ${obj.name} (${obj.id})\n` +
      `-- Generated by SAP Connect Migration Cockpit Generator\n` +
      `-- Domain: ${obj.domain}\n\n` +
      `CREATE COLUMN TABLE "${tableName}" (\n` +
      `${columns.join(',\n')}` +
      `${primaryKey}\n` +
      `);\n\n` +
      `-- Index for status tracking\n` +
      `CREATE INDEX "IDX_${tableName}_STATUS" ON "${tableName}" ("STATUS");\n\n` +
      `-- Index for load date\n` +
      `CREATE INDEX "IDX_${tableName}_LOAD" ON "${tableName}" ("LOAD_DATE");\n`;

    return ddl;
  }

  /**
   * Export data as XML in SAP Migration Cockpit format.
   * @param {string} objectId
   * @param {object[]} data — Array of records
   * @returns {string} XML string
   */
  exportToXml(objectId, data) {
    const obj = MIGRATION_CATALOG[objectId];
    if (!obj) {
      throw new Error(`Unknown migration object: ${objectId}`);
    }
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(`<MigrationData object="${this._escapeXml(obj.sapObject)}" name="${this._escapeXml(obj.name)}" domain="${this._escapeXml(obj.domain)}">`);
    lines.push(`  <Header>`);
    lines.push(`    <ObjectId>${this._escapeXml(obj.id)}</ObjectId>`);
    lines.push(`    <Description>${this._escapeXml(obj.description)}</Description>`);
    lines.push(`    <RecordCount>${data.length}</RecordCount>`);
    lines.push(`    <GeneratedAt>${new Date().toISOString()}</GeneratedAt>`);
    lines.push(`  </Header>`);
    lines.push(`  <Fields>`);
    for (const field of obj.fields) {
      lines.push(`    <Field name="${this._escapeXml(field.name)}" type="${field.type}" length="${field.length}" required="${field.required}" />`);
    }
    lines.push(`  </Fields>`);
    lines.push(`  <Records>`);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      lines.push(`    <Record index="${i}">`);
      for (const field of obj.fields) {
        const value = row[field.name] !== undefined && row[field.name] !== null
          ? String(row[field.name])
          : '';
        lines.push(`      <${this._escapeXml(field.name)}>${this._escapeXml(value)}</${this._escapeXml(field.name)}>`);
      }
      lines.push(`    </Record>`);
    }

    lines.push(`  </Records>`);
    lines.push(`</MigrationData>`);

    return lines.join('\n');
  }

  /**
   * Export data as CSV format compatible with Excel upload to LTMC.
   * @param {string} objectId
   * @param {object[]} data — Array of records
   * @returns {string} CSV string
   */
  exportToExcel(objectId, data) {
    const obj = MIGRATION_CATALOG[objectId];
    if (!obj) {
      throw new Error(`Unknown migration object: ${objectId}`);
    }
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    const fieldNames = obj.fields.map(f => f.name);
    const lines = [];

    // Header row
    lines.push(fieldNames.join(','));

    // Data rows
    for (const row of data) {
      const values = fieldNames.map(f => {
        const val = row[f] !== undefined && row[f] !== null ? String(row[f]) : '';
        // Escape commas and quotes for CSV
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      lines.push(values.join(','));
    }

    return lines.join('\n');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  _convertValue(value, field) {
    if (value === null || value === undefined) return null;
    const strVal = String(value).trim();

    switch (field.type) {
      case 'NUMC':
        return strVal.replace(/\D/g, '').padStart(field.length, '0').slice(-field.length);
      case 'DATS': {
        // Try to normalize date formats to YYYYMMDD
        const cleaned = strVal.replace(/[^0-9]/g, '');
        if (cleaned.length === 8) return cleaned;
        // Try ISO date format
        const d = new Date(strVal);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}${m}${day}`;
        }
        return strVal;
      }
      case 'DEC':
      case 'CURR':
      case 'QUAN': {
        const num = parseFloat(strVal);
        return isNaN(num) ? strVal : num;
      }
      default:
        return strVal.length > field.length ? strVal.substring(0, field.length) : strVal;
    }
  }

  _escapeXml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

module.exports = MigrationCockpitGenerator;
