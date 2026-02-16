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
 * Configuration Template Library
 *
 * Pre-built configuration templates for common SAP implementation project types.
 * Each template defines the complete set of customizing settings needed for a
 * specific module or project type, with variables for site-specific values.
 *
 * Templates support dependency ordering, variable validation, and effort estimation.
 * Settings reference BDC sequence names for automated execution via BdcEngine.
 */

const Logger = require('../logger');

/**
 * Template definitions for SAP implementation projects.
 * Each template contains ordered settings with dependencies, variables, and BDC sequences.
 */
const TEMPLATES = {
  fi_co_basic: {
    id: 'fi_co_basic',
    name: 'FI/CO Basic Configuration',
    module: 'FI',
    projectType: 'greenfield',
    description: 'Complete Finance and Controlling basic configuration for a greenfield SAP implementation. Covers company code, chart of accounts, GL accounts, cost centers, profit centers, and all supporting customizing.',
    dependsOn: [],
    settings: [
      {
        sequence: 'company_code',
        table: 'T001',
        required: true,
        order: 1,
        data: { BUKRS: '{{company_code}}', BUTXT: '{{company_name}}', ORT01: '{{city}}', LAND1: '{{country}}', WAERS: '{{currency}}', SPRAS: '{{language}}', KTOPL: '{{chart_of_accounts}}' },
        variables: ['company_code', 'company_name', 'city', 'country', 'currency', 'language', 'chart_of_accounts'],
        dependencies: [],
        description: 'Create company code',
      },
      {
        sequence: 'chart_of_accounts',
        table: 'T004',
        required: true,
        order: 2,
        data: { KTOPL: '{{chart_of_accounts}}', KTPLT: '{{chart_of_accounts_name}}', SPRAS: '{{language}}' },
        variables: ['chart_of_accounts', 'chart_of_accounts_name', 'language'],
        dependencies: [],
        description: 'Create chart of accounts',
      },
      {
        sequence: 'fiscal_year_variant',
        table: 'T009',
        required: true,
        order: 3,
        data: { PERIV: '{{fiscal_year_variant}}', XJABH: 'X', ANPTS: '01', LAESSION: '12' },
        variables: ['fiscal_year_variant'],
        dependencies: [],
        description: 'Define fiscal year variant',
      },
      {
        sequence: 'posting_period',
        table: 'T001B',
        required: true,
        order: 4,
        data: { BUKRS: '{{company_code}}', RESSION: '{{fiscal_year_variant}}' },
        variables: ['company_code', 'fiscal_year_variant'],
        dependencies: ['company_code', 'fiscal_year_variant'],
        description: 'Open posting periods',
      },
      {
        sequence: 'document_type_sa',
        table: 'T003',
        required: true,
        order: 5,
        data: { BLART: 'SA', BLTYP: 'SA', NUMKR: '19' },
        variables: [],
        dependencies: ['company_code'],
        description: 'FI document type SA (GL posting)',
      },
      {
        sequence: 'document_type_kr',
        table: 'T003',
        required: true,
        order: 6,
        data: { BLART: 'KR', BLTYP: 'KR', NUMKR: '19' },
        variables: [],
        dependencies: ['company_code'],
        description: 'FI document type KR (vendor invoice)',
      },
      {
        sequence: 'document_type_kz',
        table: 'T003',
        required: true,
        order: 7,
        data: { BLART: 'KZ', BLTYP: 'KZ', NUMKR: '15' },
        variables: [],
        dependencies: ['company_code'],
        description: 'FI document type KZ (vendor payment)',
      },
      {
        sequence: 'document_type_dr',
        table: 'T003',
        required: true,
        order: 8,
        data: { BLART: 'DR', BLTYP: 'DR', NUMKR: '01' },
        variables: [],
        dependencies: ['company_code'],
        description: 'FI document type DR (customer invoice)',
      },
      {
        sequence: 'document_type_dz',
        table: 'T003',
        required: true,
        order: 9,
        data: { BLART: 'DZ', BLTYP: 'DZ', NUMKR: '16' },
        variables: [],
        dependencies: ['company_code'],
        description: 'FI document type DZ (customer payment)',
      },
      {
        sequence: 'document_type_ab',
        table: 'T003',
        required: true,
        order: 10,
        data: { BLART: 'AB', BLTYP: 'AB', NUMKR: '17' },
        variables: [],
        dependencies: ['company_code'],
        description: 'FI document type AB (general posting)',
      },
      {
        sequence: 'document_type_aa',
        table: 'T003',
        required: true,
        order: 11,
        data: { BLART: 'AA', BLTYP: 'AA', NUMKR: '01' },
        variables: [],
        dependencies: ['company_code'],
        description: 'FI document type AA (asset posting)',
      },
      {
        sequence: 'number_range_fi_01',
        table: 'NRIV',
        required: true,
        order: 12,
        data: { OBJECT: 'RF_BELEG', NR: '01', FROMNUMBER: '0100000000', TONUMBER: '0199999999', EXTERNIND: '' },
        variables: [],
        dependencies: ['document_type_dr'],
        description: 'Number range 01 for customer invoices',
      },
      {
        sequence: 'number_range_fi_15',
        table: 'NRIV',
        required: true,
        order: 13,
        data: { OBJECT: 'RF_BELEG', NR: '15', FROMNUMBER: '1500000000', TONUMBER: '1599999999', EXTERNIND: '' },
        variables: [],
        dependencies: ['document_type_kz'],
        description: 'Number range 15 for vendor payments',
      },
      {
        sequence: 'number_range_fi_16',
        table: 'NRIV',
        required: true,
        order: 14,
        data: { OBJECT: 'RF_BELEG', NR: '16', FROMNUMBER: '1600000000', TONUMBER: '1699999999', EXTERNIND: '' },
        variables: [],
        dependencies: ['document_type_dz'],
        description: 'Number range 16 for customer payments',
      },
      {
        sequence: 'number_range_fi_17',
        table: 'NRIV',
        required: true,
        order: 15,
        data: { OBJECT: 'RF_BELEG', NR: '17', FROMNUMBER: '1700000000', TONUMBER: '1799999999', EXTERNIND: '' },
        variables: [],
        dependencies: ['document_type_ab'],
        description: 'Number range 17 for general postings',
      },
      {
        sequence: 'number_range_fi_19',
        table: 'NRIV',
        required: true,
        order: 16,
        data: { OBJECT: 'RF_BELEG', NR: '19', FROMNUMBER: '1900000000', TONUMBER: '1999999999', EXTERNIND: '' },
        variables: [],
        dependencies: ['document_type_sa'],
        description: 'Number range 19 for GL postings',
      },
      {
        sequence: 'account_group_sako',
        table: 'T077S',
        required: true,
        order: 17,
        data: { KTOPL: '{{chart_of_accounts}}', KTOGR: 'SAKO', STXTG: 'General GL Accounts', VONKT: '0000000000', BISKT: '9999999999' },
        variables: ['chart_of_accounts'],
        dependencies: ['chart_of_accounts'],
        description: 'GL account group SAKO (general)',
      },
      {
        sequence: 'account_group_bs',
        table: 'T077S',
        required: true,
        order: 18,
        data: { KTOPL: '{{chart_of_accounts}}', KTOGR: 'BS', STXTG: 'Balance Sheet Accounts', VONKT: '0000100000', BISKT: '0000399999' },
        variables: ['chart_of_accounts'],
        dependencies: ['chart_of_accounts'],
        description: 'GL account group BS (balance sheet)',
      },
      {
        sequence: 'account_group_pl',
        table: 'T077S',
        required: true,
        order: 19,
        data: { KTOPL: '{{chart_of_accounts}}', KTOGR: 'PL', STXTG: 'P&L Accounts', VONKT: '0000400000', BISKT: '0000899999' },
        variables: ['chart_of_accounts'],
        dependencies: ['chart_of_accounts'],
        description: 'GL account group PL (profit & loss)',
      },
      {
        sequence: 'field_status_group',
        table: 'T004F',
        required: true,
        order: 20,
        data: { BUKRS: '{{company_code}}', FAZIT: 'G001', FAZNA: 'General postings' },
        variables: ['company_code'],
        dependencies: ['company_code'],
        description: 'Field status group for postings',
      },
      {
        sequence: 'tolerance_group_fi',
        table: 'T043T',
        required: true,
        order: 21,
        data: { BUKRS: '{{company_code}}', HESSION: '{{currency}}', GRUPP: '', BESSION: '999999999' },
        variables: ['company_code', 'currency'],
        dependencies: ['company_code'],
        description: 'FI tolerance group (blank = all users)',
      },
      {
        sequence: 'payment_terms_nt30',
        table: 'T052',
        required: true,
        order: 22,
        data: { ZESSION: 'NT30', ZTAGG: '30', ZDESSION: 'Net 30 days' },
        variables: [],
        dependencies: [],
        description: 'Payment terms NT30 (Net 30 days)',
      },
      {
        sequence: 'payment_terms_nt60',
        table: 'T052',
        required: true,
        order: 23,
        data: { ZESSION: 'NT60', ZTAGG: '60', ZDESSION: 'Net 60 days' },
        variables: [],
        dependencies: [],
        description: 'Payment terms NT60 (Net 60 days)',
      },
      {
        sequence: 'payment_terms_210n30',
        table: 'T052',
        required: true,
        order: 24,
        data: { ZESSION: '210N', ZTAGG: '30', ZTAG1: '10', ZPRZ1: '2.00', ZDESSION: '2/10 Net 30' },
        variables: [],
        dependencies: [],
        description: 'Payment terms 2/10 Net 30',
      },
      {
        sequence: 'tax_code_i0',
        table: 'T007A',
        required: true,
        order: 25,
        data: { KALSM: 'TAXUS', MESSION: 'I0', ZMESSION: 'Input tax 0%', XINPUT: 'X' },
        variables: [],
        dependencies: ['company_code'],
        description: 'Tax code I0 (input tax 0%)',
      },
      {
        sequence: 'tax_code_i1',
        table: 'T007A',
        required: true,
        order: 26,
        data: { KALSM: 'TAXUS', MESSION: 'I1', ZMESSION: 'Input tax standard', XINPUT: 'X' },
        variables: [],
        dependencies: ['company_code'],
        description: 'Tax code I1 (input tax standard rate)',
      },
      {
        sequence: 'tax_code_o0',
        table: 'T007A',
        required: true,
        order: 27,
        data: { KALSM: 'TAXUS', MESSION: 'O0', ZMESSION: 'Output tax 0%', XOUTPUT: 'X' },
        variables: [],
        dependencies: ['company_code'],
        description: 'Tax code O0 (output tax 0%)',
      },
      {
        sequence: 'tax_code_o1',
        table: 'T007A',
        required: true,
        order: 28,
        data: { KALSM: 'TAXUS', MESSION: 'O1', ZMESSION: 'Output tax standard', XOUTPUT: 'X' },
        variables: [],
        dependencies: ['company_code'],
        description: 'Tax code O1 (output tax standard rate)',
      },
      {
        sequence: 'exchange_rate_type_m',
        table: 'TCURV',
        required: true,
        order: 29,
        data: { KESSION: 'M', KURSD: 'Average rate' },
        variables: [],
        dependencies: [],
        description: 'Exchange rate type M (average)',
      },
      {
        sequence: 'exchange_rate_type_g',
        table: 'TCURV',
        required: false,
        order: 30,
        data: { KESSION: 'G', KURSD: 'Buying rate' },
        variables: [],
        dependencies: [],
        description: 'Exchange rate type G (buying)',
      },
      {
        sequence: 'exchange_rate_type_b',
        table: 'TCURV',
        required: false,
        order: 31,
        data: { KESSION: 'B', KURSD: 'Selling rate' },
        variables: [],
        dependencies: [],
        description: 'Exchange rate type B (selling)',
      },
      {
        sequence: 'house_bank',
        table: 'T012',
        required: true,
        order: 32,
        data: { BUKRS: '{{company_code}}', HBKID: 'MAIN', BANKS: '{{country}}', BANKN: '{{bank_account_number}}' },
        variables: ['company_code', 'country', 'bank_account_number'],
        dependencies: ['company_code'],
        description: 'Create main house bank',
      },
      {
        sequence: 'gl_account_cash',
        table: 'SKA1',
        required: true,
        order: 33,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000100000', KTOKS: 'BS', TXT20: 'Cash', XBILK: 'X' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_bs'],
        description: 'GL account: Cash',
      },
      {
        sequence: 'gl_account_bank',
        table: 'SKA1',
        required: true,
        order: 34,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000110000', KTOKS: 'BS', TXT20: 'Bank clearing', XBILK: 'X' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_bs'],
        description: 'GL account: Bank clearing',
      },
      {
        sequence: 'gl_account_ar',
        table: 'SKA1',
        required: true,
        order: 35,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000140000', KTOKS: 'BS', TXT20: 'Accounts Receivable', XBILK: 'X' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_bs'],
        description: 'GL account: Accounts receivable',
      },
      {
        sequence: 'gl_account_ap',
        table: 'SKA1',
        required: true,
        order: 36,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000160000', KTOKS: 'BS', TXT20: 'Accounts Payable', XBILK: 'X' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_bs'],
        description: 'GL account: Accounts payable',
      },
      {
        sequence: 'gl_account_revenue',
        table: 'SKA1',
        required: true,
        order: 37,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000400000', KTOKS: 'PL', TXT20: 'Revenue domestic', XBILK: '' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_pl'],
        description: 'GL account: Revenue domestic',
      },
      {
        sequence: 'gl_account_revenue_export',
        table: 'SKA1',
        required: true,
        order: 38,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000410000', KTOKS: 'PL', TXT20: 'Revenue export', XBILK: '' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_pl'],
        description: 'GL account: Revenue export',
      },
      {
        sequence: 'gl_account_cogs',
        table: 'SKA1',
        required: true,
        order: 39,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000500000', KTOKS: 'PL', TXT20: 'Cost of goods sold', XBILK: '' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_pl'],
        description: 'GL account: Cost of goods sold',
      },
      {
        sequence: 'gl_account_salary',
        table: 'SKA1',
        required: true,
        order: 40,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000600000', KTOKS: 'PL', TXT20: 'Salaries expense', XBILK: '' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_pl'],
        description: 'GL account: Salaries',
      },
      {
        sequence: 'gl_account_rent',
        table: 'SKA1',
        required: true,
        order: 41,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000610000', KTOKS: 'PL', TXT20: 'Rent expense', XBILK: '' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_pl'],
        description: 'GL account: Rent',
      },
      {
        sequence: 'gl_account_travel',
        table: 'SKA1',
        required: true,
        order: 42,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000620000', KTOKS: 'PL', TXT20: 'Travel expense', XBILK: '' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_pl'],
        description: 'GL account: Travel',
      },
      {
        sequence: 'gl_account_depreciation',
        table: 'SKA1',
        required: true,
        order: 43,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000630000', KTOKS: 'PL', TXT20: 'Depreciation expense', XBILK: '' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_pl'],
        description: 'GL account: Depreciation',
      },
      {
        sequence: 'gl_account_materials',
        table: 'SKA1',
        required: true,
        order: 44,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000640000', KTOKS: 'PL', TXT20: 'Materials expense', XBILK: '' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_pl'],
        description: 'GL account: Materials',
      },
      {
        sequence: 'gl_account_misc_expense',
        table: 'SKA1',
        required: true,
        order: 45,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000650000', KTOKS: 'PL', TXT20: 'Miscellaneous expense', XBILK: '' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_pl'],
        description: 'GL account: Miscellaneous expense',
      },
      {
        sequence: 'gl_account_interest_income',
        table: 'SKA1',
        required: true,
        order: 46,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000700000', KTOKS: 'PL', TXT20: 'Interest income', XBILK: '' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_pl'],
        description: 'GL account: Interest income',
      },
      {
        sequence: 'gl_account_interest_expense',
        table: 'SKA1',
        required: true,
        order: 47,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000710000', KTOKS: 'PL', TXT20: 'Interest expense', XBILK: '' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_pl'],
        description: 'GL account: Interest expense',
      },
      {
        sequence: 'gl_account_fixed_assets',
        table: 'SKA1',
        required: true,
        order: 48,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000200000', KTOKS: 'BS', TXT20: 'Fixed assets', XBILK: 'X' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_bs'],
        description: 'GL account: Fixed assets',
      },
      {
        sequence: 'gl_account_accum_depr',
        table: 'SKA1',
        required: true,
        order: 49,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000210000', KTOKS: 'BS', TXT20: 'Accumulated depreciation', XBILK: 'X' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_bs'],
        description: 'GL account: Accumulated depreciation',
      },
      {
        sequence: 'gl_account_inventory',
        table: 'SKA1',
        required: true,
        order: 50,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000300000', KTOKS: 'BS', TXT20: 'Inventory', XBILK: 'X' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_bs'],
        description: 'GL account: Inventory',
      },
      {
        sequence: 'gl_account_grn_ir',
        table: 'SKA1',
        required: true,
        order: 51,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000191000', KTOKS: 'BS', TXT20: 'GR/IR clearing', XBILK: 'X' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_bs'],
        description: 'GL account: GR/IR clearing',
      },
      {
        sequence: 'gl_account_retained_earnings',
        table: 'SKA1',
        required: true,
        order: 52,
        data: { KTOPL: '{{chart_of_accounts}}', SAESSION: '0000390000', KTOKS: 'BS', TXT20: 'Retained earnings', XBILK: 'X' },
        variables: ['chart_of_accounts'],
        dependencies: ['account_group_bs'],
        description: 'GL account: Retained earnings',
      },
      {
        sequence: 'vendor_account_group_kred',
        table: 'T077Y',
        required: true,
        order: 53,
        data: { KTOKK: 'KRED', STXTG: 'Domestic vendors' },
        variables: [],
        dependencies: ['company_code'],
        description: 'Vendor account group KRED (domestic)',
      },
      {
        sequence: 'vendor_account_group_krau',
        table: 'T077Y',
        required: true,
        order: 54,
        data: { KTOKK: 'KRAU', STXTG: 'Foreign vendors' },
        variables: [],
        dependencies: ['company_code'],
        description: 'Vendor account group KRAU (foreign)',
      },
      {
        sequence: 'customer_account_group_debi',
        table: 'T077D',
        required: true,
        order: 55,
        data: { KTOKD: 'DEBI', STXTG: 'Domestic customers' },
        variables: [],
        dependencies: ['company_code'],
        description: 'Customer account group DEBI (domestic)',
      },
      {
        sequence: 'customer_account_group_deau',
        table: 'T077D',
        required: true,
        order: 56,
        data: { KTOKD: 'DEAU', STXTG: 'Foreign customers' },
        variables: [],
        dependencies: ['company_code'],
        description: 'Customer account group DEAU (foreign)',
      },
      {
        sequence: 'controlling_area',
        table: 'TKA01',
        required: true,
        order: 57,
        data: { KOKRS: '{{controlling_area}}', BEZEI: '{{controlling_area_name}}', KTOPL: '{{chart_of_accounts}}', WAERS: '{{currency}}', BUKRS: '{{company_code}}' },
        variables: ['controlling_area', 'controlling_area_name', 'chart_of_accounts', 'currency', 'company_code'],
        dependencies: ['company_code', 'chart_of_accounts'],
        description: 'Create controlling area and assign to company code',
      },
      {
        sequence: 'cost_element_salary',
        table: 'CSKA',
        required: true,
        order: 58,
        data: { KSTAR: '0000600000', KOKRS: '{{controlling_area}}', KATYP: '1', TXJCD: 'Salary costs' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Primary cost element: Salary',
      },
      {
        sequence: 'cost_element_travel',
        table: 'CSKA',
        required: true,
        order: 59,
        data: { KSTAR: '0000620000', KOKRS: '{{controlling_area}}', KATYP: '1', TXJCD: 'Travel expenses' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Primary cost element: Travel',
      },
      {
        sequence: 'cost_element_materials',
        table: 'CSKA',
        required: true,
        order: 60,
        data: { KSTAR: '0000640000', KOKRS: '{{controlling_area}}', KATYP: '1', TXJCD: 'Material costs' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Primary cost element: Materials',
      },
      {
        sequence: 'cost_element_rent',
        table: 'CSKA',
        required: true,
        order: 61,
        data: { KSTAR: '0000610000', KOKRS: '{{controlling_area}}', KATYP: '1', TXJCD: 'Rent and lease costs' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Primary cost element: Rent',
      },
      {
        sequence: 'cost_element_depreciation',
        table: 'CSKA',
        required: true,
        order: 62,
        data: { KSTAR: '0000630000', KOKRS: '{{controlling_area}}', KATYP: '1', TXJCD: 'Depreciation costs' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Primary cost element: Depreciation',
      },
      {
        sequence: 'cost_element_utilities',
        table: 'CSKA',
        required: true,
        order: 63,
        data: { KSTAR: '0000660000', KOKRS: '{{controlling_area}}', KATYP: '1', TXJCD: 'Utilities' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Primary cost element: Utilities',
      },
      {
        sequence: 'cost_element_insurance',
        table: 'CSKA',
        required: true,
        order: 64,
        data: { KSTAR: '0000670000', KOKRS: '{{controlling_area}}', KATYP: '1', TXJCD: 'Insurance' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Primary cost element: Insurance',
      },
      {
        sequence: 'cost_element_consulting',
        table: 'CSKA',
        required: true,
        order: 65,
        data: { KSTAR: '0000680000', KOKRS: '{{controlling_area}}', KATYP: '1', TXJCD: 'Consulting fees' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Primary cost element: Consulting',
      },
      {
        sequence: 'cost_element_maintenance',
        table: 'CSKA',
        required: true,
        order: 66,
        data: { KSTAR: '0000690000', KOKRS: '{{controlling_area}}', KATYP: '1', TXJCD: 'Maintenance' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Primary cost element: Maintenance',
      },
      {
        sequence: 'cost_element_telecom',
        table: 'CSKA',
        required: true,
        order: 67,
        data: { KSTAR: '0000700100', KOKRS: '{{controlling_area}}', KATYP: '1', TXJCD: 'Telecommunications' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Primary cost element: Telecommunications',
      },
      {
        sequence: 'cost_center_admin',
        table: 'CSKS',
        required: true,
        order: 68,
        data: { KOSTL: 'CC-ADMIN', KOKRS: '{{controlling_area}}', BUKRS: '{{company_code}}', KTEXT: 'Administration', KOSAR: '1', VEESSION: '{{cost_center_hierarchy}}' },
        variables: ['controlling_area', 'company_code', 'cost_center_hierarchy'],
        dependencies: ['controlling_area'],
        description: 'Cost center: Administration',
      },
      {
        sequence: 'cost_center_it',
        table: 'CSKS',
        required: true,
        order: 69,
        data: { KOSTL: 'CC-IT', KOKRS: '{{controlling_area}}', BUKRS: '{{company_code}}', KTEXT: 'Information Technology', KOSAR: '1', VEESSION: '{{cost_center_hierarchy}}' },
        variables: ['controlling_area', 'company_code', 'cost_center_hierarchy'],
        dependencies: ['controlling_area'],
        description: 'Cost center: IT',
      },
      {
        sequence: 'cost_center_hr',
        table: 'CSKS',
        required: true,
        order: 70,
        data: { KOSTL: 'CC-HR', KOKRS: '{{controlling_area}}', BUKRS: '{{company_code}}', KTEXT: 'Human Resources', KOSAR: '1', VEESSION: '{{cost_center_hierarchy}}' },
        variables: ['controlling_area', 'company_code', 'cost_center_hierarchy'],
        dependencies: ['controlling_area'],
        description: 'Cost center: Human Resources',
      },
      {
        sequence: 'cost_center_finance',
        table: 'CSKS',
        required: true,
        order: 71,
        data: { KOSTL: 'CC-FIN', KOKRS: '{{controlling_area}}', BUKRS: '{{company_code}}', KTEXT: 'Finance', KOSAR: '1', VEESSION: '{{cost_center_hierarchy}}' },
        variables: ['controlling_area', 'company_code', 'cost_center_hierarchy'],
        dependencies: ['controlling_area'],
        description: 'Cost center: Finance',
      },
      {
        sequence: 'cost_center_operations',
        table: 'CSKS',
        required: true,
        order: 72,
        data: { KOSTL: 'CC-OPS', KOKRS: '{{controlling_area}}', BUKRS: '{{company_code}}', KTEXT: 'Operations', KOSAR: '1', VEESSION: '{{cost_center_hierarchy}}' },
        variables: ['controlling_area', 'company_code', 'cost_center_hierarchy'],
        dependencies: ['controlling_area'],
        description: 'Cost center: Operations',
      },
      {
        sequence: 'cost_center_sales',
        table: 'CSKS',
        required: true,
        order: 73,
        data: { KOSTL: 'CC-SALES', KOKRS: '{{controlling_area}}', BUKRS: '{{company_code}}', KTEXT: 'Sales', KOSAR: '1', VEESSION: '{{cost_center_hierarchy}}' },
        variables: ['controlling_area', 'company_code', 'cost_center_hierarchy'],
        dependencies: ['controlling_area'],
        description: 'Cost center: Sales',
      },
      {
        sequence: 'cost_center_group_overhead',
        table: 'SETHEADER',
        required: true,
        order: 74,
        data: { SETCLASS: '0101', SUBCLASS: '{{controlling_area}}', SETNAME: 'OVERHEAD', DESSION: 'Overhead Cost Centers' },
        variables: ['controlling_area'],
        dependencies: ['cost_center_admin'],
        description: 'Cost center group: Overhead',
      },
      {
        sequence: 'cost_center_group_production',
        table: 'SETHEADER',
        required: true,
        order: 75,
        data: { SETCLASS: '0101', SUBCLASS: '{{controlling_area}}', SETNAME: 'PROD', DESSION: 'Production Cost Centers' },
        variables: ['controlling_area'],
        dependencies: ['cost_center_operations'],
        description: 'Cost center group: Production',
      },
      {
        sequence: 'activity_type_labor',
        table: 'CSLA',
        required: true,
        order: 76,
        data: { LSTAR: 'LABOR', KOKRS: '{{controlling_area}}', LTEXT: 'Labor Hours', LEINH: 'H' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Activity type: Labor hours',
      },
      {
        sequence: 'activity_type_machine',
        table: 'CSLA',
        required: true,
        order: 77,
        data: { LSTAR: 'MACH', KOKRS: '{{controlling_area}}', LTEXT: 'Machine Hours', LEINH: 'H' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Activity type: Machine hours',
      },
      {
        sequence: 'stat_key_figure_headcount',
        table: 'TKA09',
        required: true,
        order: 78,
        data: { STAGR: 'HEADS', KOKRS: '{{controlling_area}}', STESSION: 'Headcount', STAESSION: '1', MESSION: 'EA' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Statistical key figure: Headcount',
      },
      {
        sequence: 'stat_key_figure_sqm',
        table: 'TKA09',
        required: false,
        order: 79,
        data: { STAGR: 'SQM', KOKRS: '{{controlling_area}}', STESSION: 'Square meters', STAESSION: '2', MESSION: 'M2' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Statistical key figure: Square meters',
      },
      {
        sequence: 'profit_center_default',
        table: 'CEPC',
        required: true,
        order: 80,
        data: { PRCTR: 'PC-0001', KOKRS: '{{controlling_area}}', BUKRS: '{{company_code}}', KTEXT: 'Default Profit Center' },
        variables: ['controlling_area', 'company_code'],
        dependencies: ['controlling_area'],
        description: 'Profit center: Default',
      },
      {
        sequence: 'profit_center_domestic',
        table: 'CEPC',
        required: true,
        order: 81,
        data: { PRCTR: 'PC-0010', KOKRS: '{{controlling_area}}', BUKRS: '{{company_code}}', KTEXT: 'Domestic Operations' },
        variables: ['controlling_area', 'company_code'],
        dependencies: ['controlling_area'],
        description: 'Profit center: Domestic operations',
      },
      {
        sequence: 'profit_center_export',
        table: 'CEPC',
        required: false,
        order: 82,
        data: { PRCTR: 'PC-0020', KOKRS: '{{controlling_area}}', BUKRS: '{{company_code}}', KTEXT: 'Export Operations' },
        variables: ['controlling_area', 'company_code'],
        dependencies: ['controlling_area'],
        description: 'Profit center: Export operations',
      },
      {
        sequence: 'internal_order_type_invest',
        table: 'T003O',
        required: true,
        order: 83,
        data: { AUART: 'INV', KOKRS: '{{controlling_area}}', AUTEXT: 'Investment Order' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Internal order type: Investment',
      },
      {
        sequence: 'internal_order_type_maint',
        table: 'T003O',
        required: true,
        order: 84,
        data: { AUART: 'MAINT', KOKRS: '{{controlling_area}}', AUTEXT: 'Maintenance Order' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Internal order type: Maintenance',
      },
      {
        sequence: 'internal_order_type_mktg',
        table: 'T003O',
        required: false,
        order: 85,
        data: { AUART: 'MKTG', KOKRS: '{{controlling_area}}', AUTEXT: 'Marketing Order' },
        variables: ['controlling_area'],
        dependencies: ['controlling_area'],
        description: 'Internal order type: Marketing',
      },
    ],
    variables: {
      company_code: { type: 'string', required: true, pattern: '^[A-Z0-9]{4}$', description: 'SAP company code (4 chars)', example: '1000' },
      company_name: { type: 'string', required: true, pattern: '^.{1,25}$', description: 'Company name (max 25 chars)', example: 'ACME Corporation' },
      city: { type: 'string', required: false, pattern: '^.{1,25}$', description: 'City name', example: 'New York' },
      country: { type: 'string', required: true, pattern: '^[A-Z]{2}$', description: 'ISO country code (2 chars)', example: 'US' },
      currency: { type: 'string', required: true, pattern: '^[A-Z]{3}$', description: 'ISO currency code (3 chars)', example: 'USD' },
      language: { type: 'string', required: true, pattern: '^[A-Z]{1,2}$', description: 'SAP language key', example: 'EN' },
      chart_of_accounts: { type: 'string', required: true, pattern: '^[A-Z0-9]{4}$', description: 'Chart of accounts key (4 chars)', example: 'CAUS' },
      chart_of_accounts_name: { type: 'string', required: false, pattern: '^.{1,40}$', description: 'Chart of accounts description', example: 'US Chart of Accounts' },
      fiscal_year_variant: { type: 'string', required: true, pattern: '^[A-Z0-9]{2}$', description: 'Fiscal year variant (2 chars)', example: 'K4' },
      controlling_area: { type: 'string', required: true, pattern: '^[A-Z0-9]{4}$', description: 'Controlling area key (4 chars)', example: '1000' },
      controlling_area_name: { type: 'string', required: false, pattern: '^.{1,25}$', description: 'Controlling area description', example: 'US Controlling Area' },
      cost_center_hierarchy: { type: 'string', required: true, pattern: '^.{1,12}$', description: 'Standard hierarchy for cost centers', example: 'STDHIER' },
      bank_account_number: { type: 'string', required: false, pattern: '^.{1,18}$', description: 'Bank account number', example: '123456789' },
    },
  },

  mm_basic: {
    id: 'mm_basic',
    name: 'MM Basic Configuration',
    module: 'MM',
    projectType: 'greenfield',
    description: 'Complete Materials Management configuration including plant, storage locations, purchasing organizations, material types, movement types, and purchasing documents.',
    dependsOn: ['fi_co_basic'],
    settings: [
      {
        sequence: 'plant',
        table: 'T001W',
        required: true,
        order: 1,
        data: { WERKS: '{{plant_code}}', NAME1: '{{plant_name}}', BUKRS: '{{company_code}}', LAND1: '{{country}}' },
        variables: ['plant_code', 'plant_name', 'company_code', 'country'],
        dependencies: [],
        description: 'Create main plant and assign to company code',
      },
      {
        sequence: 'storage_location_raw',
        table: 'T001L',
        required: true,
        order: 2,
        data: { WERKS: '{{plant_code}}', LGORT: '0001', LGOBE: 'Raw Materials' },
        variables: ['plant_code'],
        dependencies: ['plant'],
        description: 'Storage location: Raw materials',
      },
      {
        sequence: 'storage_location_finished',
        table: 'T001L',
        required: true,
        order: 3,
        data: { WERKS: '{{plant_code}}', LGORT: '0002', LGOBE: 'Finished Goods' },
        variables: ['plant_code'],
        dependencies: ['plant'],
        description: 'Storage location: Finished goods',
      },
      {
        sequence: 'storage_location_scrap',
        table: 'T001L',
        required: false,
        order: 4,
        data: { WERKS: '{{plant_code}}', LGORT: '0003', LGOBE: 'Scrap' },
        variables: ['plant_code'],
        dependencies: ['plant'],
        description: 'Storage location: Scrap',
      },
      {
        sequence: 'purchasing_org',
        table: 'T024E',
        required: true,
        order: 5,
        data: { EKORG: '{{purchasing_org}}', EKOTX: '{{purchasing_org_name}}', BUKRS: '{{company_code}}' },
        variables: ['purchasing_org', 'purchasing_org_name', 'company_code'],
        dependencies: [],
        description: 'Create purchasing organization and assign to company code',
      },
      {
        sequence: 'purchasing_org_plant',
        table: 'T024W',
        required: true,
        order: 6,
        data: { EKORG: '{{purchasing_org}}', WERKS: '{{plant_code}}' },
        variables: ['purchasing_org', 'plant_code'],
        dependencies: ['purchasing_org', 'plant'],
        description: 'Assign purchasing organization to plant',
      },
      {
        sequence: 'purchasing_group_raw',
        table: 'T024',
        required: true,
        order: 7,
        data: { EKGRP: '001', EKNAM: 'Raw Materials Buyers' },
        variables: [],
        dependencies: ['purchasing_org'],
        description: 'Purchasing group: Raw materials',
      },
      {
        sequence: 'purchasing_group_mro',
        table: 'T024',
        required: true,
        order: 8,
        data: { EKGRP: '002', EKNAM: 'MRO Buyers' },
        variables: [],
        dependencies: ['purchasing_org'],
        description: 'Purchasing group: MRO',
      },
      {
        sequence: 'purchasing_group_services',
        table: 'T024',
        required: false,
        order: 9,
        data: { EKGRP: '003', EKNAM: 'Services Buyers' },
        variables: [],
        dependencies: ['purchasing_org'],
        description: 'Purchasing group: Services',
      },
      {
        sequence: 'material_type_roh',
        table: 'T134',
        required: true,
        order: 10,
        data: { MTART: 'ROH', MTBEZ: 'Raw Materials' },
        variables: [],
        dependencies: [],
        description: 'Material type ROH (raw materials)',
      },
      {
        sequence: 'material_type_halb',
        table: 'T134',
        required: true,
        order: 11,
        data: { MTART: 'HALB', MTBEZ: 'Semi-Finished Goods' },
        variables: [],
        dependencies: [],
        description: 'Material type HALB (semi-finished)',
      },
      {
        sequence: 'material_type_fert',
        table: 'T134',
        required: true,
        order: 12,
        data: { MTART: 'FERT', MTBEZ: 'Finished Products' },
        variables: [],
        dependencies: [],
        description: 'Material type FERT (finished goods)',
      },
      {
        sequence: 'material_type_hibe',
        table: 'T134',
        required: true,
        order: 13,
        data: { MTART: 'HIBE', MTBEZ: 'Operating Supplies' },
        variables: [],
        dependencies: [],
        description: 'Material type HIBE (operating supplies)',
      },
      {
        sequence: 'material_type_dien',
        table: 'T134',
        required: false,
        order: 14,
        data: { MTART: 'DIEN', MTBEZ: 'Services' },
        variables: [],
        dependencies: [],
        description: 'Material type DIEN (services)',
      },
      {
        sequence: 'material_group_raw',
        table: 'T023',
        required: true,
        order: 15,
        data: { MATKL: '001', WGBEZ: 'Raw Materials' },
        variables: [],
        dependencies: [],
        description: 'Material group: Raw materials',
      },
      {
        sequence: 'material_group_packaging',
        table: 'T023',
        required: true,
        order: 16,
        data: { MATKL: '002', WGBEZ: 'Packaging' },
        variables: [],
        dependencies: [],
        description: 'Material group: Packaging',
      },
      {
        sequence: 'material_group_consumables',
        table: 'T023',
        required: true,
        order: 17,
        data: { MATKL: '003', WGBEZ: 'Consumables' },
        variables: [],
        dependencies: [],
        description: 'Material group: Consumables',
      },
      {
        sequence: 'material_group_spare_parts',
        table: 'T023',
        required: false,
        order: 18,
        data: { MATKL: '004', WGBEZ: 'Spare Parts' },
        variables: [],
        dependencies: [],
        description: 'Material group: Spare parts',
      },
      {
        sequence: 'valuation_class_roh',
        table: 'T025',
        required: true,
        order: 19,
        data: { BKLAS: '3000', BKBEZ: 'Raw Materials Valuation' },
        variables: [],
        dependencies: ['material_type_roh'],
        description: 'Valuation class for raw materials',
      },
      {
        sequence: 'valuation_class_halb',
        table: 'T025',
        required: true,
        order: 20,
        data: { BKLAS: '3010', BKBEZ: 'Semi-Finished Valuation' },
        variables: [],
        dependencies: ['material_type_halb'],
        description: 'Valuation class for semi-finished goods',
      },
      {
        sequence: 'valuation_class_fert',
        table: 'T025',
        required: true,
        order: 21,
        data: { BKLAS: '3020', BKBEZ: 'Finished Goods Valuation' },
        variables: [],
        dependencies: ['material_type_fert'],
        description: 'Valuation class for finished goods',
      },
      {
        sequence: 'purchasing_doc_type_nb',
        table: 'T161',
        required: true,
        order: 22,
        data: { BSART: 'NB', BSTYP: 'F', BATXT: 'Standard Purchase Order' },
        variables: [],
        dependencies: ['purchasing_org'],
        description: 'Purchasing document type NB (standard PO)',
      },
      {
        sequence: 'purchasing_doc_type_fo',
        table: 'T161',
        required: true,
        order: 23,
        data: { BSART: 'FO', BSTYP: 'F', BATXT: 'Framework Order' },
        variables: [],
        dependencies: ['purchasing_org'],
        description: 'Purchasing document type FO (framework order)',
      },
      {
        sequence: 'purchasing_doc_type_ub',
        table: 'T161',
        required: false,
        order: 24,
        data: { BSART: 'UB', BSTYP: 'F', BATXT: 'Stock Transfer Order' },
        variables: [],
        dependencies: ['purchasing_org'],
        description: 'Purchasing document type UB (stock transfer)',
      },
      {
        sequence: 'movement_type_101',
        table: 'T156',
        required: true,
        order: 25,
        data: { BWART: '101', XMOBJ: 'Goods Receipt for PO' },
        variables: [],
        dependencies: ['plant'],
        description: 'Movement type 101 (goods receipt for PO)',
      },
      {
        sequence: 'movement_type_102',
        table: 'T156',
        required: true,
        order: 26,
        data: { BWART: '102', XMOBJ: 'Reversal of GR for PO' },
        variables: [],
        dependencies: ['plant'],
        description: 'Movement type 102 (GR reversal)',
      },
      {
        sequence: 'movement_type_201',
        table: 'T156',
        required: true,
        order: 27,
        data: { BWART: '201', XMOBJ: 'Consumption from cost center' },
        variables: [],
        dependencies: ['plant'],
        description: 'Movement type 201 (consumption for cost center)',
      },
      {
        sequence: 'movement_type_261',
        table: 'T156',
        required: true,
        order: 28,
        data: { BWART: '261', XMOBJ: 'Goods Issue for Production Order' },
        variables: [],
        dependencies: ['plant'],
        description: 'Movement type 261 (goods issue for production)',
      },
      {
        sequence: 'movement_type_301',
        table: 'T156',
        required: true,
        order: 29,
        data: { BWART: '301', XMOBJ: 'Stock Transfer Plant to Plant' },
        variables: [],
        dependencies: ['plant'],
        description: 'Movement type 301 (plant-to-plant transfer)',
      },
      {
        sequence: 'movement_type_561',
        table: 'T156',
        required: true,
        order: 30,
        data: { BWART: '561', XMOBJ: 'Initial Entry of Stock' },
        variables: [],
        dependencies: ['plant'],
        description: 'Movement type 561 (initial stock entry)',
      },
      {
        sequence: 'vendor_template',
        table: 'LFA1',
        required: false,
        order: 31,
        data: { LIFNR: '{{vendor_number}}', NAME1: 'Template Vendor', LAND1: '{{country}}', BUKRS: '{{company_code}}', EKORG: '{{purchasing_org}}' },
        variables: ['vendor_number', 'country', 'company_code', 'purchasing_org'],
        dependencies: ['purchasing_org'],
        description: 'Create template vendor master',
      },
      {
        sequence: 'info_record_template',
        table: 'EINA',
        required: false,
        order: 32,
        data: { LIFNR: '{{vendor_number}}', MATNR: '{{material_number}}', EKORG: '{{purchasing_org}}', WERKS: '{{plant_code}}' },
        variables: ['vendor_number', 'material_number', 'purchasing_org', 'plant_code'],
        dependencies: ['vendor_template'],
        description: 'Sample purchasing info record',
      },
      {
        sequence: 'source_list_template',
        table: 'EORD',
        required: false,
        order: 33,
        data: { MATNR: '{{material_number}}', WERKS: '{{plant_code}}', LIFNR: '{{vendor_number}}', EKORG: '{{purchasing_org}}' },
        variables: ['material_number', 'plant_code', 'vendor_number', 'purchasing_org'],
        dependencies: ['info_record_template'],
        description: 'Sample source list entry',
      },
      {
        sequence: 'condition_type_pb00',
        table: 'T685A',
        required: true,
        order: 34,
        data: { KSCHL: 'PB00', VTEXT: 'Gross Price', KOESSION: 'A', KRESSION: 'C' },
        variables: [],
        dependencies: ['purchasing_org'],
        description: 'MM condition type PB00 (gross price)',
      },
      {
        sequence: 'condition_type_ra01',
        table: 'T685A',
        required: true,
        order: 35,
        data: { KSCHL: 'RA01', VTEXT: 'Discount %', KOESSION: 'A', KRESSION: 'A' },
        variables: [],
        dependencies: ['purchasing_org'],
        description: 'MM condition type RA01 (% discount)',
      },
      {
        sequence: 'condition_type_rb00',
        table: 'T685A',
        required: false,
        order: 36,
        data: { KSCHL: 'RB00', VTEXT: 'Absolute Discount', KOESSION: 'A', KRESSION: 'C' },
        variables: [],
        dependencies: ['purchasing_org'],
        description: 'MM condition type RB00 (absolute discount)',
      },
    ],
    variables: {
      plant_code: { type: 'string', required: true, pattern: '^[A-Z0-9]{4}$', description: 'Plant code (4 chars)', example: '1000' },
      plant_name: { type: 'string', required: true, pattern: '^.{1,30}$', description: 'Plant description', example: 'Main Plant' },
      company_code: { type: 'string', required: true, pattern: '^[A-Z0-9]{4}$', description: 'SAP company code (4 chars)', example: '1000' },
      country: { type: 'string', required: true, pattern: '^[A-Z]{2}$', description: 'ISO country code', example: 'US' },
      purchasing_org: { type: 'string', required: true, pattern: '^[A-Z0-9]{4}$', description: 'Purchasing organization (4 chars)', example: '1000' },
      purchasing_org_name: { type: 'string', required: false, pattern: '^.{1,20}$', description: 'Purchasing org description', example: 'US Purchasing' },
      vendor_number: { type: 'string', required: false, pattern: '^[0-9]{1,10}$', description: 'Vendor account number', example: '0000001000' },
      material_number: { type: 'string', required: false, pattern: '^.{1,18}$', description: 'Material number', example: 'MAT-001' },
    },
  },

  sd_basic: {
    id: 'sd_basic',
    name: 'SD Basic Configuration',
    module: 'SD',
    projectType: 'greenfield',
    description: 'Complete Sales and Distribution configuration including sales organizations, distribution channels, pricing, shipping, billing, and output management.',
    dependsOn: ['fi_co_basic', 'mm_basic'],
    settings: [
      {
        sequence: 'sales_org',
        table: 'TVKO',
        required: true,
        order: 1,
        data: { VKORG: '{{sales_org}}', VTEXT: '{{sales_org_name}}', BUKRS: '{{company_code}}', WAERS: '{{currency}}' },
        variables: ['sales_org', 'sales_org_name', 'company_code', 'currency'],
        dependencies: [],
        description: 'Create sales organization and assign to company code',
      },
      {
        sequence: 'distribution_channel_10',
        table: 'TVTW',
        required: true,
        order: 2,
        data: { VTWEG: '10', VTEXT: 'Direct Sales' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Distribution channel 10 (direct)',
      },
      {
        sequence: 'distribution_channel_20',
        table: 'TVTW',
        required: true,
        order: 3,
        data: { VTWEG: '20', VTEXT: 'Retail' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Distribution channel 20 (retail)',
      },
      {
        sequence: 'distribution_channel_30',
        table: 'TVTW',
        required: false,
        order: 4,
        data: { VTWEG: '30', VTEXT: 'Wholesale' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Distribution channel 30 (wholesale)',
      },
      {
        sequence: 'division_00',
        table: 'TSPA',
        required: true,
        order: 5,
        data: { SESSION: '00', VTEXT: 'Cross-Division' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Division 00 (cross-division)',
      },
      {
        sequence: 'division_01',
        table: 'TSPA',
        required: true,
        order: 6,
        data: { SESSION: '01', VTEXT: 'Product Line A' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Division 01 (product line A)',
      },
      {
        sequence: 'sales_office',
        table: 'TVKBZ',
        required: true,
        order: 7,
        data: { VKBUR: '{{sales_office_code}}', BEZEI: '{{sales_office_name}}' },
        variables: ['sales_office_code', 'sales_office_name'],
        dependencies: ['sales_org'],
        description: 'Main sales office',
      },
      {
        sequence: 'sales_group_domestic',
        table: 'TVKGR',
        required: true,
        order: 8,
        data: { VKGRP: '001', BEZEI: 'Domestic Sales' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Sales group: Domestic',
      },
      {
        sequence: 'sales_group_export',
        table: 'TVKGR',
        required: false,
        order: 9,
        data: { VKGRP: '002', BEZEI: 'Export Sales' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Sales group: Export',
      },
      {
        sequence: 'shipping_point',
        table: 'TVST',
        required: true,
        order: 10,
        data: { VSTEL: '{{shipping_point}}', VTEXT: '{{shipping_point_name}}', WERKS: '{{plant_code}}' },
        variables: ['shipping_point', 'shipping_point_name', 'plant_code'],
        dependencies: ['sales_org'],
        description: 'Create main shipping point and assign to plant',
      },
      {
        sequence: 'sales_doc_type_or',
        table: 'TVAK',
        required: true,
        order: 11,
        data: { AUART: 'OR', BEZEI: 'Standard Order', VBTYP: 'C' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Sales document type OR (standard order)',
      },
      {
        sequence: 'sales_doc_type_qt',
        table: 'TVAK',
        required: true,
        order: 12,
        data: { AUART: 'QT', BEZEI: 'Quotation', VBTYP: 'B' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Sales document type QT (quotation)',
      },
      {
        sequence: 'sales_doc_type_ro',
        table: 'TVAK',
        required: true,
        order: 13,
        data: { AUART: 'RO', BEZEI: 'Return Order', VBTYP: 'H' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Sales document type RO (return order)',
      },
      {
        sequence: 'sales_doc_type_cr',
        table: 'TVAK',
        required: true,
        order: 14,
        data: { AUART: 'CR', BEZEI: 'Credit Memo Request', VBTYP: 'K' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Sales document type CR (credit memo request)',
      },
      {
        sequence: 'item_category_tan',
        table: 'TVAP',
        required: true,
        order: 15,
        data: { PSTYV: 'TAN', VTEXT: 'Standard Item' },
        variables: [],
        dependencies: ['sales_doc_type_or'],
        description: 'Item category TAN (standard)',
      },
      {
        sequence: 'item_category_tann',
        table: 'TVAP',
        required: false,
        order: 16,
        data: { PSTYV: 'TANN', VTEXT: 'Free of Charge Item' },
        variables: [],
        dependencies: ['sales_doc_type_or'],
        description: 'Item category TANN (free of charge)',
      },
      {
        sequence: 'item_category_tax',
        table: 'TVAP',
        required: false,
        order: 17,
        data: { PSTYV: 'TAX', VTEXT: 'Text Item' },
        variables: [],
        dependencies: ['sales_doc_type_or'],
        description: 'Item category TAX (text item)',
      },
      {
        sequence: 'delivery_type_lf',
        table: 'TVLK',
        required: true,
        order: 18,
        data: { LFART: 'LF', VTEXT: 'Standard Delivery' },
        variables: [],
        dependencies: ['shipping_point'],
        description: 'Delivery type LF (standard delivery)',
      },
      {
        sequence: 'delivery_type_nl',
        table: 'TVLK',
        required: false,
        order: 19,
        data: { LFART: 'NL', VTEXT: 'Replenishment Delivery' },
        variables: [],
        dependencies: ['shipping_point'],
        description: 'Delivery type NL (replenishment)',
      },
      {
        sequence: 'delivery_type_lr',
        table: 'TVLK',
        required: true,
        order: 20,
        data: { LFART: 'LR', VTEXT: 'Return Delivery' },
        variables: [],
        dependencies: ['shipping_point'],
        description: 'Delivery type LR (returns)',
      },
      {
        sequence: 'billing_type_f2',
        table: 'TVFK',
        required: true,
        order: 21,
        data: { FKART: 'F2', VTEXT: 'Invoice' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Billing type F2 (invoice)',
      },
      {
        sequence: 'billing_type_g2',
        table: 'TVFK',
        required: true,
        order: 22,
        data: { FKART: 'G2', VTEXT: 'Credit Memo' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Billing type G2 (credit memo)',
      },
      {
        sequence: 'billing_type_re',
        table: 'TVFK',
        required: true,
        order: 23,
        data: { FKART: 'RE', VTEXT: 'Returns Credit' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Billing type RE (returns credit)',
      },
      {
        sequence: 'pricing_procedure',
        table: 'T683S',
        required: true,
        order: 24,
        data: { KALSM: 'RVAA01', KALST: 'Standard Pricing' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Standard pricing procedure RVAA01',
      },
      {
        sequence: 'condition_type_pr00',
        table: 'T685A',
        required: true,
        order: 25,
        data: { KSCHL: 'PR00', VTEXT: 'Price', KOESSION: 'B', KRESSION: 'C' },
        variables: [],
        dependencies: ['pricing_procedure'],
        description: 'SD condition type PR00 (price)',
      },
      {
        sequence: 'condition_type_k004',
        table: 'T685A',
        required: true,
        order: 26,
        data: { KSCHL: 'K004', VTEXT: 'Material Discount', KOESSION: 'A', KRESSION: 'A' },
        variables: [],
        dependencies: ['pricing_procedure'],
        description: 'SD condition type K004 (material discount)',
      },
      {
        sequence: 'condition_type_k007',
        table: 'T685A',
        required: true,
        order: 27,
        data: { KSCHL: 'K007', VTEXT: 'Customer Discount', KOESSION: 'A', KRESSION: 'A' },
        variables: [],
        dependencies: ['pricing_procedure'],
        description: 'SD condition type K007 (customer discount)',
      },
      {
        sequence: 'condition_type_mwst',
        table: 'T685A',
        required: true,
        order: 28,
        data: { KSCHL: 'MWST', VTEXT: 'Tax', KOESSION: 'D', KRESSION: 'A' },
        variables: [],
        dependencies: ['pricing_procedure'],
        description: 'SD condition type MWST (tax)',
      },
      {
        sequence: 'output_type_rd00',
        table: 'TNAPR',
        required: true,
        order: 29,
        data: { KSCHL: 'RD00', VTEXT: 'Order Confirmation' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Output type RD00 (order confirmation)',
      },
      {
        sequence: 'output_type_ld00',
        table: 'TNAPR',
        required: true,
        order: 30,
        data: { KSCHL: 'LD00', VTEXT: 'Delivery Note' },
        variables: [],
        dependencies: ['shipping_point'],
        description: 'Output type LD00 (delivery note)',
      },
      {
        sequence: 'output_type_rd01',
        table: 'TNAPR',
        required: true,
        order: 31,
        data: { KSCHL: 'RD01', VTEXT: 'Invoice Output' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Output type RD01 (invoice)',
      },
      {
        sequence: 'credit_control_area',
        table: 'T014',
        required: true,
        order: 32,
        data: { KKBER: '{{credit_control_area}}', KKBTX: 'Credit Control', BUKRS: '{{company_code}}', WAERS: '{{currency}}' },
        variables: ['credit_control_area', 'company_code', 'currency'],
        dependencies: ['sales_org'],
        description: 'Create credit control area and assign to company code',
      },
      {
        sequence: 'shipping_condition_01',
        table: 'VSBED',
        required: true,
        order: 33,
        data: { VSBED: '01', VTEXT: 'Standard Shipping' },
        variables: [],
        dependencies: [],
        description: 'Shipping condition 01 (standard)',
      },
      {
        sequence: 'shipping_condition_02',
        table: 'VSBED',
        required: true,
        order: 34,
        data: { VSBED: '02', VTEXT: 'Express Shipping' },
        variables: [],
        dependencies: [],
        description: 'Shipping condition 02 (express)',
      },
      {
        sequence: 'shipping_condition_03',
        table: 'VSBED',
        required: false,
        order: 35,
        data: { VSBED: '03', VTEXT: 'Freight Collect' },
        variables: [],
        dependencies: [],
        description: 'Shipping condition 03 (freight)',
      },
      {
        sequence: 'sales_district_north',
        table: 'T171',
        required: true,
        order: 36,
        data: { BZIRK: 'N', BZTXT: 'North Region' },
        variables: [],
        dependencies: [],
        description: 'Sales district: North',
      },
      {
        sequence: 'sales_district_south',
        table: 'T171',
        required: true,
        order: 37,
        data: { BZIRK: 'S', BZTXT: 'South Region' },
        variables: [],
        dependencies: [],
        description: 'Sales district: South',
      },
      {
        sequence: 'sales_district_east',
        table: 'T171',
        required: true,
        order: 38,
        data: { BZIRK: 'E', BZTXT: 'East Region' },
        variables: [],
        dependencies: [],
        description: 'Sales district: East',
      },
      {
        sequence: 'sales_district_west',
        table: 'T171',
        required: true,
        order: 39,
        data: { BZIRK: 'W', BZTXT: 'West Region' },
        variables: [],
        dependencies: [],
        description: 'Sales district: West',
      },
      {
        sequence: 'customer_acct_group_sold',
        table: 'T077D',
        required: true,
        order: 40,
        data: { KTOKD: 'SOLD', STXTG: 'Sold-to Party' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Customer account group SOLD (sold-to)',
      },
      {
        sequence: 'customer_acct_group_ship',
        table: 'T077D',
        required: true,
        order: 41,
        data: { KTOKD: 'SHIP', STXTG: 'Ship-to Party' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Customer account group SHIP (ship-to)',
      },
      {
        sequence: 'customer_acct_group_bill',
        table: 'T077D',
        required: true,
        order: 42,
        data: { KTOKD: 'BILL', STXTG: 'Bill-to Party' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Customer account group BILL (bill-to)',
      },
      {
        sequence: 'customer_acct_group_payr',
        table: 'T077D',
        required: true,
        order: 43,
        data: { KTOKD: 'PAYR', STXTG: 'Payer' },
        variables: [],
        dependencies: ['sales_org'],
        description: 'Customer account group PAYR (payer)',
      },
    ],
    variables: {
      sales_org: { type: 'string', required: true, pattern: '^[A-Z0-9]{4}$', description: 'Sales organization (4 chars)', example: '1000' },
      sales_org_name: { type: 'string', required: false, pattern: '^.{1,20}$', description: 'Sales organization description', example: 'US Sales Org' },
      company_code: { type: 'string', required: true, pattern: '^[A-Z0-9]{4}$', description: 'SAP company code (4 chars)', example: '1000' },
      currency: { type: 'string', required: true, pattern: '^[A-Z]{3}$', description: 'ISO currency code', example: 'USD' },
      plant_code: { type: 'string', required: true, pattern: '^[A-Z0-9]{4}$', description: 'Plant code (4 chars)', example: '1000' },
      shipping_point: { type: 'string', required: true, pattern: '^[A-Z0-9]{4}$', description: 'Shipping point (4 chars)', example: '1000' },
      shipping_point_name: { type: 'string', required: false, pattern: '^.{1,20}$', description: 'Shipping point description', example: 'Main Shipping' },
      sales_office_code: { type: 'string', required: false, pattern: '^[A-Z0-9]{4}$', description: 'Sales office code', example: '1000' },
      sales_office_name: { type: 'string', required: false, pattern: '^.{1,20}$', description: 'Sales office description', example: 'Main Office' },
      credit_control_area: { type: 'string', required: false, pattern: '^[A-Z0-9]{4}$', description: 'Credit control area', example: '1000' },
    },
  },

  s4_mandatory: {
    id: 's4_mandatory',
    name: 'S/4HANA Mandatory Settings',
    module: 'S4',
    projectType: 'greenfield',
    description: 'Mandatory configuration settings for any S/4HANA system. Covers Business Partner integration, material ledger activation, new GL, credit management, and Fiori basics.',
    dependsOn: [],
    settings: [
      {
        sequence: 'bp_number_range_internal',
        table: 'NRIV',
        required: true,
        order: 1,
        data: { OBJECT: 'BU_PARTNER', NR: '01', FROMNUMBER: '{{bp_number_from}}', TONUMBER: '{{bp_number_to}}', EXTERNIND: '' },
        variables: ['bp_number_from', 'bp_number_to'],
        dependencies: [],
        description: 'BP internal number range',
      },
      {
        sequence: 'bp_number_range_external',
        table: 'NRIV',
        required: true,
        order: 2,
        data: { OBJECT: 'BU_PARTNER', NR: '02', FROMNUMBER: '0000000001', TONUMBER: '0000099999', EXTERNIND: 'X' },
        variables: [],
        dependencies: [],
        description: 'BP external number range',
      },
      {
        sequence: 'bp_grouping_bpcu',
        table: 'TB003',
        required: true,
        order: 3,
        data: { BU_GROUP: 'BPCU', BUGRPTEXT: 'Customer', NRRANGE: '01' },
        variables: [],
        dependencies: ['bp_number_range_internal'],
        description: 'BP grouping BPCU (customer)',
      },
      {
        sequence: 'bp_grouping_bpve',
        table: 'TB003',
        required: true,
        order: 4,
        data: { BU_GROUP: 'BPVE', BUGRPTEXT: 'Vendor', NRRANGE: '01' },
        variables: [],
        dependencies: ['bp_number_range_internal'],
        description: 'BP grouping BPVE (vendor)',
      },
      {
        sequence: 'bp_grouping_bpem',
        table: 'TB003',
        required: true,
        order: 5,
        data: { BU_GROUP: 'BPEM', BUGRPTEXT: 'Employee', NRRANGE: '01' },
        variables: [],
        dependencies: ['bp_number_range_internal'],
        description: 'BP grouping BPEM (employee)',
      },
      {
        sequence: 'bp_grouping_bpor',
        table: 'TB003',
        required: true,
        order: 6,
        data: { BU_GROUP: 'BPOR', BUGRPTEXT: 'Organization', NRRANGE: '01' },
        variables: [],
        dependencies: ['bp_number_range_internal'],
        description: 'BP grouping BPOR (organization)',
      },
      {
        sequence: 'cvi_vendor_sync',
        table: 'CVI_VEND_LINK',
        required: true,
        order: 7,
        data: { ACTIVE: 'X', DIRECTION: 'BOTH', SYNC_TYPE: 'ONLINE' },
        variables: [],
        dependencies: ['bp_grouping_bpve'],
        description: 'Customer-Vendor Integration: vendor to BP sync',
      },
      {
        sequence: 'cvi_customer_sync',
        table: 'CVI_CUST_LINK',
        required: true,
        order: 8,
        data: { ACTIVE: 'X', DIRECTION: 'BOTH', SYNC_TYPE: 'ONLINE' },
        variables: [],
        dependencies: ['bp_grouping_bpcu'],
        description: 'Customer-Vendor Integration: customer to BP sync',
      },
      {
        sequence: 'material_ledger_activation',
        table: 'T001K_ML',
        required: true,
        order: 9,
        data: { BWKEY: '{{plant_code}}', ML_ACTIVE: 'X', VCESSION: '2' },
        variables: ['plant_code'],
        dependencies: [],
        description: 'Activate material ledger per plant',
      },
      {
        sequence: 'new_gl_activation',
        table: 'FAGL_ACTIVEC',
        required: true,
        order: 10,
        data: { RLDNR: '{{ledger_id}}', ACTIVE: 'X', XCESSION: 'X' },
        variables: ['ledger_id'],
        dependencies: [],
        description: 'Activate new GL and leading ledger',
      },
      {
        sequence: 'simplified_gl_account',
        table: 'FAGL_ACTIVEC',
        required: true,
        order: 11,
        data: { RLDNR: '{{ledger_id}}', XRECON: 'X', FIAA_INTEG: 'X' },
        variables: ['ledger_id'],
        dependencies: ['new_gl_activation'],
        description: 'Simplified GL: reconciliation account handling with FIAA integration',
      },
      {
        sequence: 'revenue_recognition',
        table: 'SM30_REV_REC',
        required: false,
        order: 12,
        data: { ACTIVE: 'X', IFRS15: 'X', RAR_ACTIVE: 'X' },
        variables: [],
        dependencies: ['new_gl_activation'],
        description: 'Revenue recognition (IFRS 15) activation',
      },
      {
        sequence: 'credit_management',
        table: 'UKM_CR_AREA',
        required: true,
        order: 13,
        data: { ACTIVE: 'X', KKBER: '{{credit_control_area}}', WAERS: '{{currency}}' },
        variables: ['credit_control_area', 'currency'],
        dependencies: [],
        description: 'New credit management activation',
      },
      {
        sequence: 'output_management',
        table: 'SM30_OUTPUT',
        required: true,
        order: 14,
        data: { ACTIVE: 'X', FRAMEWORK: 'BRF+', CHANNEL: 'PRINT' },
        variables: [],
        dependencies: [],
        description: 'New output management framework activation',
      },
      {
        sequence: 'fiori_launchpad',
        table: '/UI2/CHIP_CATAL',
        required: true,
        order: 15,
        data: { CATALOG_ID: 'SAP_BASIS_BC', ROLE: 'SAP_BR_ADMINISTRATOR', ACTIVE: 'X' },
        variables: [],
        dependencies: [],
        description: 'Basic Fiori launchpad catalog assignment',
      },
    ],
    variables: {
      bp_number_from: { type: 'string', required: true, pattern: '^[0-9]{10}$', description: 'BP number range start (10 digits)', example: '0000100000' },
      bp_number_to: { type: 'string', required: true, pattern: '^[0-9]{10}$', description: 'BP number range end (10 digits)', example: '0000999999' },
      ledger_id: { type: 'string', required: true, pattern: '^[A-Z0-9]{2}$', description: 'Leading ledger ID', example: '0L' },
      plant_code: { type: 'string', required: false, pattern: '^[A-Z0-9]{4}$', description: 'Plant code for material ledger', example: '1000' },
      credit_control_area: { type: 'string', required: false, pattern: '^[A-Z0-9]{4}$', description: 'Credit control area', example: '1000' },
      currency: { type: 'string', required: false, pattern: '^[A-Z]{3}$', description: 'Currency code', example: 'USD' },
    },
  },
};

class ConfigTemplateLibrary {
  /**
   * @param {object} [options]
   * @param {'mock'|'live'} [options.mode='mock']
   * @param {object} [options.logger]
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.log = options.logger || new Logger('config-templates');
    this._templates = { ...TEMPLATES };
  }

  /**
   * Get a template by ID.
   * @param {string} templateId
   * @returns {object|null} Full template definition or null if not found
   */
  getTemplate(templateId) {
    return this._templates[templateId] || null;
  }

  /**
   * List all available templates with summary info.
   * @returns {Array<{ id, name, module, projectType, settingCount, variableCount }>}
   */
  listTemplates() {
    return Object.values(this._templates).map(t => ({
      id: t.id,
      name: t.name,
      module: t.module,
      projectType: t.projectType,
      settingCount: t.settings.length,
      variableCount: Object.keys(t.variables).length,
    }));
  }

  /**
   * Instantiate a template by filling all {{variable}} placeholders.
   * @param {string} templateId
   * @param {object} variables - key/value map of variable values
   * @returns {object[]} Array of settings with variables resolved
   */
  instantiate(templateId, variables) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Unknown template: ${templateId}`);
    }

    const validation = this.validateVariables(templateId, variables);
    if (!validation.valid) {
      throw new Error(`Variable validation failed: ${validation.errors.join(', ')}`);
    }

    const resolvedSettings = template.settings.map(setting => {
      const resolved = { ...setting, data: { ...setting.data } };

      for (const [key, value] of Object.entries(resolved.data)) {
        if (typeof value === 'string') {
          resolved.data[key] = value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
            return variables[varName] !== undefined ? variables[varName] : match;
          });
        }
      }

      return resolved;
    });

    this.log.info(`Instantiated template ${templateId}`, {
      settingCount: resolvedSettings.length,
      variableCount: Object.keys(variables).length,
    });

    return resolvedSettings;
  }

  /**
   * Validate variables against template requirements.
   * @param {string} templateId
   * @param {object} variables
   * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
   */
  validateVariables(templateId, variables) {
    const template = this.getTemplate(templateId);
    if (!template) {
      return { valid: false, errors: [`Unknown template: ${templateId}`], warnings: [] };
    }

    const errors = [];
    const warnings = [];

    for (const [varName, varDef] of Object.entries(template.variables)) {
      if (varDef.required && (variables[varName] === undefined || variables[varName] === null || variables[varName] === '')) {
        errors.push(`Missing required variable: ${varName} (${varDef.description})`);
      } else if (variables[varName] !== undefined && variables[varName] !== null && variables[varName] !== '') {
        if (varDef.pattern) {
          const regex = new RegExp(varDef.pattern);
          if (!regex.test(String(variables[varName]))) {
            errors.push(`Variable "${varName}" value "${variables[varName]}" does not match pattern ${varDef.pattern}`);
          }
        }
      }
    }

    // Warn about unknown variables
    for (const varName of Object.keys(variables)) {
      if (!template.variables[varName]) {
        warnings.push(`Unknown variable: ${varName} (not defined in template)`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Get dependency order for multiple template IDs (topological sort).
   * @param {string[]} templateIds
   * @returns {string[]} Ordered template IDs
   */
  getDependencyOrder(templateIds) {
    const templates = templateIds.map(id => {
      const t = this.getTemplate(id);
      if (!t) throw new Error(`Unknown template: ${id}`);
      return t;
    });

    // Check that all dependencies are in the list
    for (const t of templates) {
      for (const dep of t.dependsOn) {
        if (!templateIds.includes(dep)) {
          throw new Error(`Template "${t.id}" depends on "${dep}" which is not in the provided list`);
        }
      }
    }

    // Topological sort using Kahn's algorithm
    const inDegree = {};
    const adjList = {};
    for (const id of templateIds) {
      inDegree[id] = 0;
      adjList[id] = [];
    }

    for (const t of templates) {
      for (const dep of t.dependsOn) {
        adjList[dep].push(t.id);
        inDegree[t.id]++;
      }
    }

    const queue = templateIds.filter(id => inDegree[id] === 0);
    const result = [];

    while (queue.length > 0) {
      const node = queue.shift();
      result.push(node);
      for (const neighbor of adjList[node]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (result.length !== templateIds.length) {
      throw new Error('Circular dependency detected among templates');
    }

    return result;
  }

  /**
   * Group settings by module tag.
   * @param {string} templateId
   * @returns {object} Map of module -> settings[]
   */
  getSettingsByModule(templateId) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Unknown template: ${templateId}`);
    }

    const groups = {};
    for (const setting of template.settings) {
      // Derive module from table name or use template module
      const module = this._deriveModule(setting.table) || template.module;
      if (!groups[module]) {
        groups[module] = [];
      }
      groups[module].push(setting);
    }

    return groups;
  }

  /**
   * Estimate effort for a template.
   * @param {string} templateId
   * @returns {{ totalSettings: number, automated: number, manual: number, estimatedMinutes: number }}
   */
  estimateEffort(templateId) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Unknown template: ${templateId}`);
    }

    const totalSettings = template.settings.length;
    // Most settings are automated via BDC; some (like number ranges, GL accounts) may need manual review
    const manualTables = new Set(['NRIV', 'SKA1', 'SKB1', 'FAGL_ACTIVEC', 'SM30_REV_REC', 'SM30_OUTPUT', '/UI2/CHIP_CATAL']);
    let manual = 0;
    let automated = 0;

    for (const setting of template.settings) {
      if (manualTables.has(setting.table)) {
        manual++;
      } else {
        automated++;
      }
    }

    // Estimate: automated = 2 min each, manual = 10 min each
    const estimatedMinutes = (automated * 2) + (manual * 10);

    return { totalSettings, automated, manual, estimatedMinutes };
  }

  /**
   * Derive module from SAP table name.
   * @param {string} table
   * @returns {string|null}
   * @private
   */
  _deriveModule(table) {
    const moduleMap = {
      T001: 'FI', T004: 'FI', T009: 'FI', T001B: 'FI', T003: 'FI',
      NRIV: 'FI', T077S: 'FI', T004F: 'FI', T043T: 'FI', T052: 'FI',
      T007A: 'FI', TCURV: 'FI', T012: 'FI', SKA1: 'FI', SKB1: 'FI',
      T077Y: 'FI', T077D: 'FI', T014: 'FI', TBSL: 'FI', T074: 'FI', TGSB: 'FI',
      TKA01: 'CO', TKA02: 'CO', T003O: 'CO', CSKA: 'CO', CSKS: 'CO',
      CSLA: 'CO', TKA09: 'CO', CEPC: 'CO', SETHEADER: 'CO', COKP: 'CO', SETTYPE: 'CO',
      T001W: 'MM', T001L: 'MM', T024E: 'MM', T024: 'MM', T024W: 'MM',
      T134: 'MM', T023: 'MM', T025: 'MM', T161: 'MM', T156: 'MM',
      LFA1: 'MM', EINA: 'MM', EINE: 'MM', EORD: 'MM', T685A: 'SD',
      T156T: 'MM', T163K: 'MM', T007V: 'MM', T006: 'MM', T006A: 'MM', T438A: 'MM',
      TVKO: 'SD', TVTW: 'SD', TSPA: 'SD', TVKBZ: 'SD', TVKGR: 'SD',
      TVST: 'SD', TVAK: 'SD', TVAP: 'SD', TVLK: 'SD', TVFK: 'SD',
      T683S: 'SD', TNAPR: 'SD', VSBED: 'SD', T171: 'SD',
      TB003: 'S4', TB004: 'S4', T001K_ML: 'S4', FAGL_ACTIVEC: 'S4',
      '/UI2/CHIP_CATAL': 'S4', UKM_CR_AREA: 'S4', CVI_CUST_LINK: 'S4',
      CVI_VEND_LINK: 'S4', BUPA_NRIV: 'S4', SM30_REV_REC: 'S4', SM30_OUTPUT: 'S4',
    };
    return moduleMap[table] || null;
  }
}

module.exports = { ConfigTemplateLibrary, TEMPLATES };
