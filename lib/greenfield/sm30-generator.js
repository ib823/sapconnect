/**
 * SM30 Table Maintenance BDC Generator
 *
 * Generic BDC generator for SM30 (table maintenance) transactions.
 * Works with any SAP table that has SM30 table maintenance configured,
 * with pre-defined field mappings for 80+ commonly maintained customizing tables.
 *
 * BDC flow for SM30:
 * 1. Start transaction SM30
 * 2. Screen SAPMSSY0/0120: Enter view/table name + activity (02=change)
 * 3. Screen SAPMSVMA/0100: Press "New Entries" button
 * 4. Screen SAPMSVMA/0200 (or dynamic screen): Enter field values
 * 5. Save
 */

const Logger = require('../logger');

/**
 * Known SAP customizing table definitions with field mappings.
 * Each entry defines the table, its SM30 view, key fields, and editable fields.
 */
const KNOWN_TABLES = {
  // ─── FI Tables (20) ───────────────────────────────────────────────

  T001: {
    table: 'T001',
    viewName: 'V_T001',
    module: 'FI',
    description: 'Company Codes',
    keyFields: ['BUKRS'],
    editableFields: {
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
      BUTXT: { description: 'Company Name', type: 'CHAR', length: 25 },
      ORT01: { description: 'City', type: 'CHAR', length: 25 },
      LAND1: { description: 'Country', type: 'CHAR', length: 3 },
      WAERS: { description: 'Currency', type: 'CUKY', length: 5 },
      SPRAS: { description: 'Language', type: 'LANG', length: 1 },
      KTOPL: { description: 'Chart of Accounts', type: 'CHAR', length: 4 },
    },
  },

  T004: {
    table: 'T004',
    viewName: 'V_T004',
    module: 'FI',
    description: 'Chart of Accounts',
    keyFields: ['KTOPL'],
    editableFields: {
      KTOPL: { description: 'Chart of Accounts', type: 'CHAR', length: 4 },
      KTPLT: { description: 'Description', type: 'CHAR', length: 30 },
      SPRAS: { description: 'Language', type: 'LANG', length: 1 },
      XBILK: { description: 'Balance Sheet Flag', type: 'CHAR', length: 1 },
    },
  },

  T009: {
    table: 'T009',
    viewName: 'V_T009',
    module: 'FI',
    description: 'Fiscal Year Variants',
    keyFields: ['PERIV'],
    editableFields: {
      PERIV: { description: 'Fiscal Year Variant', type: 'CHAR', length: 2 },
      XJABH: { description: 'Year-Dependent', type: 'CHAR', length: 1 },
      ANPTS: { description: 'Number of Posting Periods', type: 'NUMC', length: 2 },
      ANTSP: { description: 'Number of Special Periods', type: 'NUMC', length: 2 },
    },
  },

  T003: {
    table: 'T003',
    viewName: 'V_T003',
    module: 'FI',
    description: 'Document Types',
    keyFields: ['BLART'],
    editableFields: {
      BLART: { description: 'Document Type', type: 'CHAR', length: 2 },
      BLTYP: { description: 'Type Category', type: 'CHAR', length: 2 },
      NUMKR: { description: 'Number Range', type: 'NUMC', length: 2 },
      XNETB: { description: 'Net Document Type', type: 'CHAR', length: 1 },
    },
  },

  T077S: {
    table: 'T077S',
    viewName: 'V_T077S',
    module: 'FI',
    description: 'GL Account Groups',
    keyFields: ['KTOPL', 'KTOGR'],
    editableFields: {
      KTOPL: { description: 'Chart of Accounts', type: 'CHAR', length: 4 },
      KTOGR: { description: 'Account Group', type: 'CHAR', length: 4 },
      STXTG: { description: 'Description', type: 'CHAR', length: 40 },
      VONKT: { description: 'From Account', type: 'CHAR', length: 10 },
      BISKT: { description: 'To Account', type: 'CHAR', length: 10 },
    },
  },

  T004F: {
    table: 'T004F',
    viewName: 'V_T004F',
    module: 'FI',
    description: 'Field Status Groups',
    keyFields: ['BUKRS', 'FAZIT'],
    editableFields: {
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
      FAZIT: { description: 'Field Status Group', type: 'CHAR', length: 4 },
      FAZNA: { description: 'Description', type: 'CHAR', length: 30 },
    },
  },

  T043T: {
    table: 'T043T',
    viewName: 'V_T043T',
    module: 'FI',
    description: 'Tolerance Groups',
    keyFields: ['BUKRS', 'GRUPP'],
    editableFields: {
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
      GRUPP: { description: 'Tolerance Group', type: 'CHAR', length: 4 },
      HESSION: { description: 'Currency', type: 'CUKY', length: 5 },
      BESSION: { description: 'Amount', type: 'CURR', length: 13 },
    },
  },

  T052: {
    table: 'T052',
    viewName: 'V_T052',
    module: 'FI',
    description: 'Payment Terms',
    keyFields: ['ZTERM'],
    editableFields: {
      ZTERM: { description: 'Payment Terms Key', type: 'CHAR', length: 4 },
      ZTAGG: { description: 'Days Net', type: 'NUMC', length: 3 },
      ZTAG1: { description: 'Days Discount 1', type: 'NUMC', length: 3 },
      ZPRZ1: { description: 'Discount Pct 1', type: 'DEC', length: 5 },
      ZTAG2: { description: 'Days Discount 2', type: 'NUMC', length: 3 },
      ZPRZ2: { description: 'Discount Pct 2', type: 'DEC', length: 5 },
    },
  },

  T007A: {
    table: 'T007A',
    viewName: 'V_T007A',
    module: 'FI',
    description: 'Tax Codes',
    keyFields: ['KALSM', 'MWSKZ'],
    editableFields: {
      KALSM: { description: 'Tax Procedure', type: 'CHAR', length: 6 },
      MWSKZ: { description: 'Tax Code', type: 'CHAR', length: 2 },
      ZMWSK: { description: 'Description', type: 'CHAR', length: 50 },
      XINPUT: { description: 'Input Tax', type: 'CHAR', length: 1 },
      XOUTPUT: { description: 'Output Tax', type: 'CHAR', length: 1 },
    },
  },

  T012: {
    table: 'T012',
    viewName: 'V_T012',
    module: 'FI',
    description: 'House Banks',
    keyFields: ['BUKRS', 'HBKID'],
    editableFields: {
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
      HBKID: { description: 'House Bank ID', type: 'CHAR', length: 5 },
      BANKS: { description: 'Bank Country', type: 'CHAR', length: 3 },
      BANKL: { description: 'Bank Key', type: 'CHAR', length: 15 },
      BANKN: { description: 'Bank Account', type: 'CHAR', length: 18 },
    },
  },

  T012K: {
    table: 'T012K',
    viewName: 'V_T012K',
    module: 'FI',
    description: 'House Bank Accounts',
    keyFields: ['BUKRS', 'HBKID', 'HKTID'],
    editableFields: {
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
      HBKID: { description: 'House Bank ID', type: 'CHAR', length: 5 },
      HKTID: { description: 'Account ID', type: 'CHAR', length: 5 },
      BANKN: { description: 'Bank Account Number', type: 'CHAR', length: 18 },
      HKONT: { description: 'GL Account', type: 'CHAR', length: 10 },
      WAESSION: { description: 'Currency', type: 'CUKY', length: 5 },
    },
  },

  T014: {
    table: 'T014',
    viewName: 'V_T014',
    module: 'FI',
    description: 'Credit Control Areas',
    keyFields: ['KKBER'],
    editableFields: {
      KKBER: { description: 'Credit Control Area', type: 'CHAR', length: 4 },
      KKBTX: { description: 'Description', type: 'CHAR', length: 35 },
      WAERS: { description: 'Currency', type: 'CUKY', length: 5 },
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
    },
  },

  T077D: {
    table: 'T077D',
    viewName: 'V_T077D',
    module: 'FI',
    description: 'Customer Account Groups',
    keyFields: ['KTOKD'],
    editableFields: {
      KTOKD: { description: 'Account Group', type: 'CHAR', length: 4 },
      STXTG: { description: 'Description', type: 'CHAR', length: 40 },
      VONKT: { description: 'From Number', type: 'CHAR', length: 10 },
      BISKT: { description: 'To Number', type: 'CHAR', length: 10 },
    },
  },

  T077Y: {
    table: 'T077Y',
    viewName: 'V_T077Y',
    module: 'FI',
    description: 'Vendor Account Groups',
    keyFields: ['KTOKK'],
    editableFields: {
      KTOKK: { description: 'Account Group', type: 'CHAR', length: 4 },
      STXTG: { description: 'Description', type: 'CHAR', length: 40 },
      VONKT: { description: 'From Number', type: 'CHAR', length: 10 },
      BISKT: { description: 'To Number', type: 'CHAR', length: 10 },
    },
  },

  TCURV: {
    table: 'TCURV',
    viewName: 'V_TCURV',
    module: 'FI',
    description: 'Exchange Rate Types',
    keyFields: ['KESSION'],
    editableFields: {
      KESSION: { description: 'Exchange Rate Type', type: 'CHAR', length: 4 },
      KURSD: { description: 'Description', type: 'CHAR', length: 40 },
      XFIXD: { description: 'Fixed Rate', type: 'CHAR', length: 1 },
    },
  },

  T001B: {
    table: 'T001B',
    viewName: 'V_T001B_I',
    module: 'FI',
    description: 'Posting Period Variants',
    keyFields: ['BUKRS', 'RESSION'],
    editableFields: {
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
      RESSION: { description: 'Period Variant', type: 'CHAR', length: 4 },
      VON_PERIOD: { description: 'From Period', type: 'NUMC', length: 3 },
      BIS_PERIOD: { description: 'To Period', type: 'NUMC', length: 3 },
      VON_JAHR: { description: 'From Year', type: 'NUMC', length: 4 },
      BIS_JAHR: { description: 'To Year', type: 'NUMC', length: 4 },
    },
  },

  T010O: {
    table: 'T010O',
    viewName: 'V_T010O',
    module: 'FI',
    description: 'Posting Periods',
    keyFields: ['BUKRS', 'GJAHR', 'MONAT'],
    editableFields: {
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
      GJAHR: { description: 'Fiscal Year', type: 'NUMC', length: 4 },
      MONAT: { description: 'Period', type: 'NUMC', length: 2 },
      XOPEN: { description: 'Open/Close', type: 'CHAR', length: 1 },
    },
  },

  TBSL: {
    table: 'TBSL',
    viewName: 'V_TBSL',
    module: 'FI',
    description: 'Posting Keys',
    keyFields: ['BSCHL'],
    editableFields: {
      BSCHL: { description: 'Posting Key', type: 'CHAR', length: 2 },
      BSCHLT: { description: 'Description', type: 'CHAR', length: 20 },
      KOESSION: { description: 'Debit/Credit', type: 'CHAR', length: 1 },
      KONTS: { description: 'Account Type', type: 'CHAR', length: 1 },
    },
  },

  T074: {
    table: 'T074',
    viewName: 'V_T074',
    module: 'FI',
    description: 'Special GL Indicators',
    keyFields: ['KOART', 'UMSKZ'],
    editableFields: {
      KOART: { description: 'Account Type', type: 'CHAR', length: 1 },
      UMSKZ: { description: 'Special GL Indicator', type: 'CHAR', length: 1 },
      UMTEXT: { description: 'Description', type: 'CHAR', length: 30 },
      HKONT: { description: 'Recon Account', type: 'CHAR', length: 10 },
    },
  },

  TGSB: {
    table: 'TGSB',
    viewName: 'V_TGSB',
    module: 'FI',
    description: 'Business Areas',
    keyFields: ['GSBER'],
    editableFields: {
      GSBER: { description: 'Business Area', type: 'CHAR', length: 4 },
      GTEXT: { description: 'Description', type: 'CHAR', length: 30 },
    },
  },

  // ─── CO Tables (10) ───────────────────────────────────────────────

  TKA01: {
    table: 'TKA01',
    viewName: 'V_TKA01',
    module: 'CO',
    description: 'Controlling Areas',
    keyFields: ['KOKRS'],
    editableFields: {
      KOKRS: { description: 'Controlling Area', type: 'CHAR', length: 4 },
      BEZEI: { description: 'Description', type: 'CHAR', length: 25 },
      KTOPL: { description: 'Chart of Accounts', type: 'CHAR', length: 4 },
      WAERS: { description: 'Currency', type: 'CUKY', length: 5 },
    },
  },

  T003O: {
    table: 'T003O',
    viewName: 'V_T003O',
    module: 'CO',
    description: 'Order Types',
    keyFields: ['AUART'],
    editableFields: {
      AUART: { description: 'Order Type', type: 'CHAR', length: 4 },
      KOKRS: { description: 'Controlling Area', type: 'CHAR', length: 4 },
      AUTEXT: { description: 'Description', type: 'CHAR', length: 40 },
    },
  },

  CSKA: {
    table: 'CSKA',
    viewName: 'V_CSKA',
    module: 'CO',
    description: 'Cost Elements',
    keyFields: ['KSTAR', 'KOKRS'],
    editableFields: {
      KSTAR: { description: 'Cost Element', type: 'CHAR', length: 10 },
      KOKRS: { description: 'Controlling Area', type: 'CHAR', length: 4 },
      KATYP: { description: 'Cost Element Type', type: 'NUMC', length: 2 },
      TXJCD: { description: 'Description', type: 'CHAR', length: 50 },
    },
  },

  CSKS: {
    table: 'CSKS',
    viewName: 'V_CSKS',
    module: 'CO',
    description: 'Cost Centers',
    keyFields: ['KOSTL', 'KOKRS'],
    editableFields: {
      KOSTL: { description: 'Cost Center', type: 'CHAR', length: 10 },
      KOKRS: { description: 'Controlling Area', type: 'CHAR', length: 4 },
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
      KTEXT: { description: 'Description', type: 'CHAR', length: 20 },
      KOSAR: { description: 'Cost Center Category', type: 'CHAR', length: 1 },
      VEESSION: { description: 'Responsible Person', type: 'CHAR', length: 20 },
    },
  },

  CSLA: {
    table: 'CSLA',
    viewName: 'V_CSLA',
    module: 'CO',
    description: 'Activity Types',
    keyFields: ['LSTAR', 'KOKRS'],
    editableFields: {
      LSTAR: { description: 'Activity Type', type: 'CHAR', length: 6 },
      KOKRS: { description: 'Controlling Area', type: 'CHAR', length: 4 },
      LTEXT: { description: 'Description', type: 'CHAR', length: 20 },
      LEINH: { description: 'Unit of Measure', type: 'UNIT', length: 3 },
    },
  },

  TKA09: {
    table: 'TKA09',
    viewName: 'V_TKA09',
    module: 'CO',
    description: 'Statistical Key Figures',
    keyFields: ['STAGR', 'KOKRS'],
    editableFields: {
      STAGR: { description: 'Stat Key Figure', type: 'CHAR', length: 6 },
      KOKRS: { description: 'Controlling Area', type: 'CHAR', length: 4 },
      STESSION: { description: 'Description', type: 'CHAR', length: 20 },
      STAESSION: { description: 'Key Figure Type', type: 'CHAR', length: 1 },
      MESSION: { description: 'Unit of Measure', type: 'UNIT', length: 3 },
    },
  },

  CEPC: {
    table: 'CEPC',
    viewName: 'V_CEPC',
    module: 'CO',
    description: 'Profit Centers',
    keyFields: ['PRCTR', 'KOKRS'],
    editableFields: {
      PRCTR: { description: 'Profit Center', type: 'CHAR', length: 10 },
      KOKRS: { description: 'Controlling Area', type: 'CHAR', length: 4 },
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
      KTEXT: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  COKP: {
    table: 'COKP',
    viewName: 'V_COKP',
    module: 'CO',
    description: 'Planning Profiles',
    keyFields: ['KOKRS', 'PLESSION'],
    editableFields: {
      KOKRS: { description: 'Controlling Area', type: 'CHAR', length: 4 },
      PLESSION: { description: 'Planning Profile', type: 'CHAR', length: 6 },
      PLTEXT: { description: 'Description', type: 'CHAR', length: 30 },
    },
  },

  TKA02: {
    table: 'TKA02',
    viewName: 'V_TKA02',
    module: 'CO',
    description: 'Controlling Area Assignments',
    keyFields: ['BUKRS'],
    editableFields: {
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
      KOKRS: { description: 'Controlling Area', type: 'CHAR', length: 4 },
    },
  },

  SETTYPE: {
    table: 'SETTYPE',
    viewName: 'V_SETTYPE',
    module: 'CO',
    description: 'Set Types',
    keyFields: ['SETCLASS'],
    editableFields: {
      SETCLASS: { description: 'Set Class', type: 'CHAR', length: 4 },
      TEXT: { description: 'Description', type: 'CHAR', length: 30 },
    },
  },

  // ─── MM Tables (15) ───────────────────────────────────────────────

  T134: {
    table: 'T134',
    viewName: 'V_T134',
    module: 'MM',
    description: 'Material Types',
    keyFields: ['MTART'],
    editableFields: {
      MTART: { description: 'Material Type', type: 'CHAR', length: 4 },
      MTBEZ: { description: 'Description', type: 'CHAR', length: 25 },
      VPRSV: { description: 'Price Control', type: 'CHAR', length: 1 },
      BWTTY: { description: 'Valuation Category', type: 'CHAR', length: 1 },
    },
  },

  T023: {
    table: 'T023',
    viewName: 'V_T023',
    module: 'MM',
    description: 'Material Groups',
    keyFields: ['MATKL'],
    editableFields: {
      MATKL: { description: 'Material Group', type: 'CHAR', length: 9 },
      WGBEZ: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  T024: {
    table: 'T024',
    viewName: 'V_T024',
    module: 'MM',
    description: 'Purchasing Groups',
    keyFields: ['EKGRP'],
    editableFields: {
      EKGRP: { description: 'Purchasing Group', type: 'CHAR', length: 3 },
      EKNAM: { description: 'Description', type: 'CHAR', length: 18 },
    },
  },

  T024E: {
    table: 'T024E',
    viewName: 'V_T024E',
    module: 'MM',
    description: 'Purchasing Organizations',
    keyFields: ['EKORG'],
    editableFields: {
      EKORG: { description: 'Purchasing Org', type: 'CHAR', length: 4 },
      EKOTX: { description: 'Description', type: 'CHAR', length: 20 },
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
    },
  },

  T025: {
    table: 'T025',
    viewName: 'V_T025',
    module: 'MM',
    description: 'Valuation Classes',
    keyFields: ['BKLAS'],
    editableFields: {
      BKLAS: { description: 'Valuation Class', type: 'CHAR', length: 4 },
      BKBEZ: { description: 'Description', type: 'CHAR', length: 25 },
    },
  },

  T161: {
    table: 'T161',
    viewName: 'V_T161',
    module: 'MM',
    description: 'Purchasing Document Types',
    keyFields: ['BSART'],
    editableFields: {
      BSART: { description: 'Document Type', type: 'CHAR', length: 4 },
      BSTYP: { description: 'Document Category', type: 'CHAR', length: 1 },
      BATXT: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  T156: {
    table: 'T156',
    viewName: 'V_T156',
    module: 'MM',
    description: 'Movement Types',
    keyFields: ['BWART'],
    editableFields: {
      BWART: { description: 'Movement Type', type: 'CHAR', length: 3 },
      XMOBJ: { description: 'Description', type: 'CHAR', length: 40 },
      KZBEW: { description: 'Movement Indicator', type: 'CHAR', length: 1 },
    },
  },

  T156T: {
    table: 'T156T',
    viewName: 'V_T156T',
    module: 'MM',
    description: 'Movement Type Texts',
    keyFields: ['SPRAS', 'BWART'],
    editableFields: {
      SPRAS: { description: 'Language', type: 'LANG', length: 1 },
      BWART: { description: 'Movement Type', type: 'CHAR', length: 3 },
      BTEXT: { description: 'Description', type: 'CHAR', length: 40 },
    },
  },

  T024W: {
    table: 'T024W',
    viewName: 'V_T024W',
    module: 'MM',
    description: 'Purchasing Org to Plant Assignment',
    keyFields: ['EKORG', 'WERKS'],
    editableFields: {
      EKORG: { description: 'Purchasing Org', type: 'CHAR', length: 4 },
      WERKS: { description: 'Plant', type: 'CHAR', length: 4 },
    },
  },

  T163K: {
    table: 'T163K',
    viewName: 'V_T163K',
    module: 'MM',
    description: 'Release Codes',
    keyFields: ['FRGCO'],
    editableFields: {
      FRGCO: { description: 'Release Code', type: 'CHAR', length: 2 },
      FTEXT: { description: 'Description', type: 'CHAR', length: 30 },
    },
  },

  T007V: {
    table: 'T007V',
    viewName: 'V_T007V',
    module: 'MM',
    description: 'Purchasing Value Keys',
    keyFields: ['EKORG', 'EKGRP'],
    editableFields: {
      EKORG: { description: 'Purchasing Org', type: 'CHAR', length: 4 },
      EKGRP: { description: 'Purchasing Group', type: 'CHAR', length: 3 },
      WESSION: { description: 'Value Key', type: 'CHAR', length: 4 },
    },
  },

  T006: {
    table: 'T006',
    viewName: 'V_T006',
    module: 'MM',
    description: 'Units of Measure',
    keyFields: ['MSEHI'],
    editableFields: {
      MSEHI: { description: 'Unit of Measure', type: 'UNIT', length: 3 },
      DIMID: { description: 'Dimension Key', type: 'CHAR', length: 6 },
    },
  },

  T006A: {
    table: 'T006A',
    viewName: 'V_T006A',
    module: 'MM',
    description: 'Unit of Measure Texts',
    keyFields: ['SPRAS', 'MSEHI'],
    editableFields: {
      SPRAS: { description: 'Language', type: 'LANG', length: 1 },
      MSEHI: { description: 'Unit of Measure', type: 'UNIT', length: 3 },
      MSEHL: { description: 'Description', type: 'CHAR', length: 30 },
    },
  },

  T001L: {
    table: 'T001L',
    viewName: 'V_T001L',
    module: 'MM',
    description: 'Storage Locations',
    keyFields: ['WERKS', 'LGORT'],
    editableFields: {
      WERKS: { description: 'Plant', type: 'CHAR', length: 4 },
      LGORT: { description: 'Storage Location', type: 'CHAR', length: 4 },
      LGOBE: { description: 'Description', type: 'CHAR', length: 16 },
    },
  },

  T438A: {
    table: 'T438A',
    viewName: 'V_T438A',
    module: 'MM',
    description: 'MRP Groups',
    keyFields: ['DISGR'],
    editableFields: {
      DISGR: { description: 'MRP Group', type: 'CHAR', length: 4 },
      DESSION: { description: 'Description', type: 'CHAR', length: 40 },
    },
  },

  // ─── SD Tables (15) ───────────────────────────────────────────────

  TVAK: {
    table: 'TVAK',
    viewName: 'V_TVAK',
    module: 'SD',
    description: 'Sales Document Types',
    keyFields: ['AUART'],
    editableFields: {
      AUART: { description: 'Sales Document Type', type: 'CHAR', length: 4 },
      BEZEI: { description: 'Description', type: 'CHAR', length: 20 },
      VBTYP: { description: 'SD Document Category', type: 'CHAR', length: 1 },
    },
  },

  TVAP: {
    table: 'TVAP',
    viewName: 'V_TVAP',
    module: 'SD',
    description: 'Item Categories',
    keyFields: ['PSTYV'],
    editableFields: {
      PSTYV: { description: 'Item Category', type: 'CHAR', length: 4 },
      VTEXT: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  TVLK: {
    table: 'TVLK',
    viewName: 'V_TVLK',
    module: 'SD',
    description: 'Delivery Types',
    keyFields: ['LFART'],
    editableFields: {
      LFART: { description: 'Delivery Type', type: 'CHAR', length: 4 },
      VTEXT: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  TVFK: {
    table: 'TVFK',
    viewName: 'V_TVFK',
    module: 'SD',
    description: 'Billing Types',
    keyFields: ['FKART'],
    editableFields: {
      FKART: { description: 'Billing Type', type: 'CHAR', length: 4 },
      VTEXT: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  T683S: {
    table: 'T683S',
    viewName: 'V_T683S',
    module: 'SD',
    description: 'Pricing Procedures',
    keyFields: ['KALSM'],
    editableFields: {
      KALSM: { description: 'Pricing Procedure', type: 'CHAR', length: 6 },
      KALST: { description: 'Description', type: 'CHAR', length: 30 },
    },
  },

  T685A: {
    table: 'T685A',
    viewName: 'V_T685A',
    module: 'SD',
    description: 'Condition Types',
    keyFields: ['KSCHL'],
    editableFields: {
      KSCHL: { description: 'Condition Type', type: 'CHAR', length: 4 },
      VTEXT: { description: 'Description', type: 'CHAR', length: 20 },
      KOESSION: { description: 'Condition Class', type: 'CHAR', length: 1 },
      KRESSION: { description: 'Calculation Type', type: 'CHAR', length: 1 },
    },
  },

  TNAPR: {
    table: 'TNAPR',
    viewName: 'V_TNAPR',
    module: 'SD',
    description: 'Output Types',
    keyFields: ['KSCHL'],
    editableFields: {
      KSCHL: { description: 'Output Type', type: 'CHAR', length: 4 },
      VTEXT: { description: 'Description', type: 'CHAR', length: 30 },
    },
  },

  TVKO: {
    table: 'TVKO',
    viewName: 'V_TVKO',
    module: 'SD',
    description: 'Sales Organizations',
    keyFields: ['VKORG'],
    editableFields: {
      VKORG: { description: 'Sales Organization', type: 'CHAR', length: 4 },
      VTEXT: { description: 'Description', type: 'CHAR', length: 20 },
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
      WAERS: { description: 'Currency', type: 'CUKY', length: 5 },
    },
  },

  TVTW: {
    table: 'TVTW',
    viewName: 'V_TVTW',
    module: 'SD',
    description: 'Distribution Channels',
    keyFields: ['VTWEG'],
    editableFields: {
      VTWEG: { description: 'Distribution Channel', type: 'CHAR', length: 2 },
      VTEXT: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  TSPA: {
    table: 'TSPA',
    viewName: 'V_TSPA',
    module: 'SD',
    description: 'Divisions',
    keyFields: ['SESSION'],
    editableFields: {
      SESSION: { description: 'Division', type: 'CHAR', length: 2 },
      VTEXT: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  TVKBZ: {
    table: 'TVKBZ',
    viewName: 'V_TVKBZ',
    module: 'SD',
    description: 'Sales Offices',
    keyFields: ['VKBUR'],
    editableFields: {
      VKBUR: { description: 'Sales Office', type: 'CHAR', length: 4 },
      BEZEI: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  TVKGR: {
    table: 'TVKGR',
    viewName: 'V_TVKGR',
    module: 'SD',
    description: 'Sales Groups',
    keyFields: ['VKGRP'],
    editableFields: {
      VKGRP: { description: 'Sales Group', type: 'CHAR', length: 3 },
      BEZEI: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  VSBED: {
    table: 'VSBED',
    viewName: 'V_VSBED',
    module: 'SD',
    description: 'Shipping Conditions',
    keyFields: ['VSBED'],
    editableFields: {
      VSBED: { description: 'Shipping Condition', type: 'CHAR', length: 2 },
      VTEXT: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  T171: {
    table: 'T171',
    viewName: 'V_T171',
    module: 'SD',
    description: 'Sales Districts',
    keyFields: ['BZIRK'],
    editableFields: {
      BZIRK: { description: 'Sales District', type: 'CHAR', length: 6 },
      BZTXT: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  TVST: {
    table: 'TVST',
    viewName: 'V_TVST',
    module: 'SD',
    description: 'Shipping Points',
    keyFields: ['VSTEL'],
    editableFields: {
      VSTEL: { description: 'Shipping Point', type: 'CHAR', length: 4 },
      VTEXT: { description: 'Description', type: 'CHAR', length: 20 },
      ATEFG: { description: 'Departure Zone', type: 'CHAR', length: 4 },
      WERKS: { description: 'Plant', type: 'CHAR', length: 4 },
      LADGR: { description: 'Loading Group', type: 'CHAR', length: 4 },
      FABKL: { description: 'Factory Calendar', type: 'CHAR', length: 2 },
    },
  },

  // ─── HR Tables (10) ───────────────────────────────────────────────

  T500P: {
    table: 'T500P',
    viewName: 'V_T500P',
    module: 'HR',
    description: 'Personnel Areas',
    keyFields: ['PERSA'],
    editableFields: {
      PERSA: { description: 'Personnel Area', type: 'CHAR', length: 4 },
      NAME1: { description: 'Description', type: 'CHAR', length: 30 },
      BUKRS: { description: 'Company Code', type: 'CHAR', length: 4 },
      MOLGA: { description: 'Country Grouping', type: 'CHAR', length: 2 },
    },
  },

  T001P: {
    table: 'T001P',
    viewName: 'V_T001P',
    module: 'HR',
    description: 'Personnel Subareas',
    keyFields: ['WERKS', 'BTRTL'],
    editableFields: {
      WERKS: { description: 'Personnel Area', type: 'CHAR', length: 4 },
      BTRTL: { description: 'Personnel Subarea', type: 'CHAR', length: 4 },
      BTEXT: { description: 'Description', type: 'CHAR', length: 25 },
    },
  },

  T501: {
    table: 'T501',
    viewName: 'V_T501',
    module: 'HR',
    description: 'Employee Groups',
    keyFields: ['PERSG'],
    editableFields: {
      PERSG: { description: 'Employee Group', type: 'CHAR', length: 1 },
      PTEXT: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  T503: {
    table: 'T503',
    viewName: 'V_T503',
    module: 'HR',
    description: 'Employee Subgroups',
    keyFields: ['PERSG', 'PERSK'],
    editableFields: {
      PERSG: { description: 'Employee Group', type: 'CHAR', length: 1 },
      PERSK: { description: 'Employee Subgroup', type: 'CHAR', length: 2 },
      PTEXT: { description: 'Description', type: 'CHAR', length: 20 },
    },
  },

  T508A: {
    table: 'T508A',
    viewName: 'V_T508A',
    module: 'HR',
    description: 'Work Schedules',
    keyFields: ['MOLGA', 'SCHESSION'],
    editableFields: {
      MOLGA: { description: 'Country Grouping', type: 'CHAR', length: 2 },
      SCHESSION: { description: 'Work Schedule Rule', type: 'CHAR', length: 8 },
      RESSION: { description: 'Description', type: 'CHAR', length: 30 },
    },
  },

  T510: {
    table: 'T510',
    viewName: 'V_T510',
    module: 'HR',
    description: 'Pay Scale Types',
    keyFields: ['MOLGA', 'TRESSION'],
    editableFields: {
      MOLGA: { description: 'Country Grouping', type: 'CHAR', length: 2 },
      TRESSION: { description: 'Pay Scale Type', type: 'CHAR', length: 2 },
      TTEXT: { description: 'Description', type: 'CHAR', length: 25 },
    },
  },

  T510G: {
    table: 'T510G',
    viewName: 'V_T510G',
    module: 'HR',
    description: 'Pay Scale Groups',
    keyFields: ['MOLGA', 'TRESSION', 'TRFGR'],
    editableFields: {
      MOLGA: { description: 'Country Grouping', type: 'CHAR', length: 2 },
      TRESSION: { description: 'Pay Scale Type', type: 'CHAR', length: 2 },
      TRFGR: { description: 'Pay Scale Group', type: 'CHAR', length: 8 },
      GTEXT: { description: 'Description', type: 'CHAR', length: 25 },
    },
  },

  T510N: {
    table: 'T510N',
    viewName: 'V_T510N',
    module: 'HR',
    description: 'Pay Scale Areas',
    keyFields: ['MOLGA', 'TRFGB'],
    editableFields: {
      MOLGA: { description: 'Country Grouping', type: 'CHAR', length: 2 },
      TRFGB: { description: 'Pay Scale Area', type: 'CHAR', length: 2 },
      GTEXT: { description: 'Description', type: 'CHAR', length: 25 },
    },
  },

  T503K: {
    table: 'T503K',
    viewName: 'V_T503K',
    module: 'HR',
    description: 'Employee Subgroup Groupings',
    keyFields: ['PERSG', 'PERSK', 'BEGDA'],
    editableFields: {
      PERSG: { description: 'Employee Group', type: 'CHAR', length: 1 },
      PERSK: { description: 'Employee Subgroup', type: 'CHAR', length: 2 },
      BEGDA: { description: 'Start Date', type: 'DATS', length: 8 },
      ENDDA: { description: 'End Date', type: 'DATS', length: 8 },
    },
  },

  T549A: {
    table: 'T549A',
    viewName: 'V_T549A',
    module: 'HR',
    description: 'Payroll Areas',
    keyFields: ['MOLGA', 'ABKRS'],
    editableFields: {
      MOLGA: { description: 'Country Grouping', type: 'CHAR', length: 2 },
      ABKRS: { description: 'Payroll Area', type: 'CHAR', length: 2 },
      AESSION: { description: 'Description', type: 'CHAR', length: 25 },
    },
  },

  // ─── S/4HANA Tables (10) ──────────────────────────────────────────

  TB003: {
    table: 'TB003',
    viewName: 'V_TB003',
    module: 'S4',
    description: 'BP Groupings',
    keyFields: ['BU_GROUP'],
    editableFields: {
      BU_GROUP: { description: 'BP Grouping', type: 'CHAR', length: 4 },
      BUGRPTEXT: { description: 'Description', type: 'CHAR', length: 30 },
      NRRANGE: { description: 'Number Range', type: 'CHAR', length: 2 },
    },
  },

  TB004: {
    table: 'TB004',
    viewName: 'V_TB004',
    module: 'S4',
    description: 'BP Roles',
    keyFields: ['RLTYP'],
    editableFields: {
      RLTYP: { description: 'BP Role', type: 'CHAR', length: 6 },
      RLTXT: { description: 'Description', type: 'CHAR', length: 30 },
    },
  },

  NRIV: {
    table: 'NRIV',
    viewName: 'V_NRIV',
    module: 'S4',
    description: 'Number Ranges',
    keyFields: ['OBJECT', 'NR'],
    editableFields: {
      OBJECT: { description: 'Number Range Object', type: 'CHAR', length: 10 },
      NR: { description: 'Number Range Number', type: 'CHAR', length: 2 },
      FROMNUMBER: { description: 'From Number', type: 'CHAR', length: 20 },
      TONUMBER: { description: 'To Number', type: 'CHAR', length: 20 },
      EXTERNIND: { description: 'External Flag', type: 'CHAR', length: 1 },
    },
  },

  T001K_ML: {
    table: 'T001K_ML',
    viewName: 'V_T001K_ML',
    module: 'S4',
    description: 'Material Ledger Activation',
    keyFields: ['BWKEY'],
    editableFields: {
      BWKEY: { description: 'Valuation Area', type: 'CHAR', length: 4 },
      ML_ACTIVE: { description: 'ML Active', type: 'CHAR', length: 1 },
      VCESSION: { description: 'Currency Type', type: 'CHAR', length: 2 },
    },
  },

  FAGL_ACTIVEC: {
    table: 'FAGL_ACTIVEC',
    viewName: 'V_FAGL_ACTIVEC',
    module: 'S4',
    description: 'New GL Activation',
    keyFields: ['RLDNR'],
    editableFields: {
      RLDNR: { description: 'Ledger', type: 'CHAR', length: 2 },
      ACTIVE: { description: 'Active Flag', type: 'CHAR', length: 1 },
      XCESSION: { description: 'Leading Ledger', type: 'CHAR', length: 1 },
    },
  },

  '/UI2/CHIP_CATAL': {
    table: '/UI2/CHIP_CATAL',
    viewName: 'V_UI2_CHIP_CATAL',
    module: 'S4',
    description: 'Fiori Catalogs',
    keyFields: ['CATALOG_ID'],
    editableFields: {
      CATALOG_ID: { description: 'Catalog ID', type: 'CHAR', length: 40 },
      ROLE: { description: 'Role', type: 'CHAR', length: 30 },
      ACTIVE: { description: 'Active Flag', type: 'CHAR', length: 1 },
    },
  },

  UKM_CR_AREA: {
    table: 'UKM_CR_AREA',
    viewName: 'V_UKM_CR_AREA',
    module: 'S4',
    description: 'Credit Management Areas',
    keyFields: ['KKBER'],
    editableFields: {
      KKBER: { description: 'Credit Control Area', type: 'CHAR', length: 4 },
      ACTIVE: { description: 'Active Flag', type: 'CHAR', length: 1 },
      WAERS: { description: 'Currency', type: 'CUKY', length: 5 },
    },
  },

  CVI_CUST_LINK: {
    table: 'CVI_CUST_LINK',
    viewName: 'V_CVI_CUST_LINK',
    module: 'S4',
    description: 'Customer-BP Mapping',
    keyFields: ['CUSTOMER'],
    editableFields: {
      CUSTOMER: { description: 'Customer Number', type: 'CHAR', length: 10 },
      PARTNER: { description: 'BP Number', type: 'CHAR', length: 10 },
      ACTIVE: { description: 'Active Flag', type: 'CHAR', length: 1 },
    },
  },

  CVI_VEND_LINK: {
    table: 'CVI_VEND_LINK',
    viewName: 'V_CVI_VEND_LINK',
    module: 'S4',
    description: 'Vendor-BP Mapping',
    keyFields: ['VENDOR'],
    editableFields: {
      VENDOR: { description: 'Vendor Number', type: 'CHAR', length: 10 },
      PARTNER: { description: 'BP Number', type: 'CHAR', length: 10 },
      ACTIVE: { description: 'Active Flag', type: 'CHAR', length: 1 },
    },
  },

  BUPA_NRIV: {
    table: 'BUPA_NRIV',
    viewName: 'V_BUPA_NRIV',
    module: 'S4',
    description: 'BP Number Ranges',
    keyFields: ['OBJECT', 'NR'],
    editableFields: {
      OBJECT: { description: 'Object', type: 'CHAR', length: 10 },
      NR: { description: 'Number Range', type: 'CHAR', length: 2 },
      FROMNUMBER: { description: 'From Number', type: 'CHAR', length: 20 },
      TONUMBER: { description: 'To Number', type: 'CHAR', length: 20 },
      EXTERNIND: { description: 'External', type: 'CHAR', length: 1 },
    },
  },
};


class SM30Generator {
  /**
   * @param {object} [options]
   * @param {'mock'|'live'} [options.mode='mock']
   * @param {object} [options.logger]
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.log = options.logger || new Logger('sm30-generator');
    this._tables = { ...KNOWN_TABLES };
  }

  /**
   * Generate a BDC recording for SM30 table maintenance.
   * @param {string} tableName - SAP table or view name
   * @param {object[]} entries - Array of { field1: 'val1', ... } rows to add
   * @param {object} [options]
   * @param {string} [options.viewName] - Override the SM30 view name
   * @param {'02'|'03'} [options.activity='02'] - 02=change, 03=display
   * @returns {{ recording: object[], transaction: string, type: string }}
   */
  generateSM30Bdc(tableName, entries, options = {}) {
    if (!tableName) {
      throw new Error('Table name is required');
    }
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      throw new Error('Entries must be a non-empty array');
    }

    const tableDef = this._tables[tableName];
    const viewName = options.viewName || (tableDef ? tableDef.viewName : tableName);
    const activity = options.activity || '02';

    // Validate entries against known table definition
    if (tableDef) {
      for (const entry of entries) {
        const validation = this.validateEntry(tableName, entry);
        if (!validation.valid) {
          throw new Error(`Entry validation failed for ${tableName}: ${validation.errors.join(', ')}`);
        }
      }
    }

    const recording = [];

    // Screen 1: SM30 initial screen — enter view/table and activity
    recording.push({
      program: 'SAPMSSY0',
      dynpro: '0120',
      dynbegin: 'X',
      fnam: '',
      fval: '',
    });
    recording.push({
      program: '',
      dynpro: '',
      dynbegin: '',
      fnam: 'VIEWNAME',
      fval: viewName,
    });
    recording.push({
      program: '',
      dynpro: '',
      dynbegin: '',
      fnam: 'VIESSION',
      fval: activity,
    });
    recording.push({
      program: '',
      dynpro: '',
      dynbegin: '',
      fnam: 'BDC_OKCODE',
      fval: '=SHOW',
    });

    // Screen 2: Table overview — press New Entries
    recording.push({
      program: 'SAPMSVMA',
      dynpro: '0100',
      dynbegin: 'X',
      fnam: '',
      fval: '',
    });
    recording.push({
      program: '',
      dynpro: '',
      dynbegin: '',
      fnam: 'BDC_OKCODE',
      fval: '=NEWL',
    });

    // Screen 3: Data entry screen — enter field values for first entry
    const entry = entries[0];
    recording.push({
      program: 'SAPMSVMA',
      dynpro: '0200',
      dynbegin: 'X',
      fnam: '',
      fval: '',
    });

    for (const [fieldName, fieldValue] of Object.entries(entry)) {
      recording.push({
        program: '',
        dynpro: '',
        dynbegin: '',
        fnam: fieldName,
        fval: String(fieldValue),
      });
    }

    // Save
    recording.push({
      program: '',
      dynpro: '',
      dynbegin: '',
      fnam: 'BDC_OKCODE',
      fval: '=SAVE',
    });

    this.log.info(`Generated SM30 BDC for ${tableName}`, {
      viewName,
      activity,
      entryCount: 1,
      steps: recording.length,
    });

    return { recording, transaction: 'SM30', type: 'sm30' };
  }

  /**
   * Generate a bulk SM30 BDC recording with multiple new entries.
   * @param {string} tableName - SAP table or view name
   * @param {object[]} entries - Array of row objects to add
   * @returns {{ recording: object[], transaction: string, type: string }}
   */
  generateBulkSM30(tableName, entries) {
    if (!tableName) {
      throw new Error('Table name is required');
    }
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      throw new Error('Entries must be a non-empty array');
    }

    const tableDef = this._tables[tableName];
    const viewName = tableDef ? tableDef.viewName : tableName;

    // Validate all entries first
    if (tableDef) {
      for (let i = 0; i < entries.length; i++) {
        const validation = this.validateEntry(tableName, entries[i]);
        if (!validation.valid) {
          throw new Error(`Entry ${i} validation failed for ${tableName}: ${validation.errors.join(', ')}`);
        }
      }
    }

    const recording = [];

    // Screen 1: SM30 initial screen
    recording.push({
      program: 'SAPMSSY0',
      dynpro: '0120',
      dynbegin: 'X',
      fnam: '',
      fval: '',
    });
    recording.push({
      program: '',
      dynpro: '',
      dynbegin: '',
      fnam: 'VIEWNAME',
      fval: viewName,
    });
    recording.push({
      program: '',
      dynpro: '',
      dynbegin: '',
      fnam: 'VIESSION',
      fval: '02',
    });
    recording.push({
      program: '',
      dynpro: '',
      dynbegin: '',
      fnam: 'BDC_OKCODE',
      fval: '=SHOW',
    });

    // For each entry, press New Entries and fill fields
    for (let i = 0; i < entries.length; i++) {
      // New Entries button
      recording.push({
        program: 'SAPMSVMA',
        dynpro: '0100',
        dynbegin: 'X',
        fnam: '',
        fval: '',
      });
      recording.push({
        program: '',
        dynpro: '',
        dynbegin: '',
        fnam: 'BDC_OKCODE',
        fval: '=NEWL',
      });

      // Data entry
      recording.push({
        program: 'SAPMSVMA',
        dynpro: '0200',
        dynbegin: 'X',
        fnam: '',
        fval: '',
      });

      const entry = entries[i];
      for (const [fieldName, fieldValue] of Object.entries(entry)) {
        recording.push({
          program: '',
          dynpro: '',
          dynbegin: '',
          fnam: fieldName,
          fval: String(fieldValue),
        });
      }

      // Confirm entry (Enter) — except for last entry, where we save
      if (i < entries.length - 1) {
        recording.push({
          program: '',
          dynpro: '',
          dynbegin: '',
          fnam: 'BDC_OKCODE',
          fval: '/00',
        });
      } else {
        recording.push({
          program: '',
          dynpro: '',
          dynbegin: '',
          fnam: 'BDC_OKCODE',
          fval: '=SAVE',
        });
      }
    }

    this.log.info(`Generated bulk SM30 BDC for ${tableName}`, {
      viewName,
      entryCount: entries.length,
      steps: recording.length,
    });

    return { recording, transaction: 'SM30', type: 'sm30_bulk' };
  }

  /**
   * List all known table definitions.
   * @returns {object[]} Array of table definitions with module and field info
   */
  listKnownTables() {
    return Object.values(this._tables).map(t => ({
      table: t.table,
      viewName: t.viewName,
      module: t.module,
      description: t.description,
      keyFields: t.keyFields,
      fieldCount: Object.keys(t.editableFields).length,
    }));
  }

  /**
   * Get the full definition for a known table.
   * @param {string} tableName
   * @returns {object|null} Table definition or null if not known
   */
  getTableDefinition(tableName) {
    return this._tables[tableName] || null;
  }

  /**
   * Validate an entry against a known table definition.
   * @param {string} tableName
   * @param {object} entry - Field/value pairs
   * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
   */
  validateEntry(tableName, entry) {
    const errors = [];
    const warnings = [];

    const tableDef = this._tables[tableName];
    if (!tableDef) {
      // Unknown table — cannot validate, pass through
      return { valid: true, errors: [], warnings: ['Table not in known definitions; fields not validated'] };
    }

    // Check key fields are present
    for (const keyField of tableDef.keyFields) {
      if (entry[keyField] === undefined || entry[keyField] === null || entry[keyField] === '') {
        errors.push(`Missing required key field: ${keyField}`);
      }
    }

    // Validate field values against definitions
    for (const [fieldName, fieldValue] of Object.entries(entry)) {
      const fieldDef = tableDef.editableFields[fieldName];
      if (!fieldDef) {
        warnings.push(`Unknown field "${fieldName}" for table ${tableName}`);
        continue;
      }

      const strVal = String(fieldValue);

      // Check length
      if (strVal.length > fieldDef.length) {
        warnings.push(`Field "${fieldName}" value "${strVal}" exceeds max length ${fieldDef.length}`);
      }

      // Type-specific validation
      if (fieldDef.type === 'NUMC' && !/^\d*$/.test(strVal)) {
        errors.push(`Field "${fieldName}" must be numeric (NUMC), got "${strVal}"`);
      }

      if (fieldDef.type === 'DATS' && strVal.length > 0 && !/^\d{8}$/.test(strVal)) {
        errors.push(`Field "${fieldName}" must be date format YYYYMMDD (DATS), got "${strVal}"`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Check if a table has predefined field mappings.
   * @param {string} tableName
   * @returns {boolean}
   */
  isKnownTable(tableName) {
    return tableName in this._tables;
  }

  /**
   * Get known tables filtered by module.
   * @param {string} module - FI, CO, MM, SD, HR, S4
   * @returns {object[]} Filtered table definitions
   */
  getTablesByModule(module) {
    return Object.values(this._tables)
      .filter(t => t.module === module)
      .map(t => ({
        table: t.table,
        viewName: t.viewName,
        module: t.module,
        description: t.description,
        keyFields: t.keyFields,
        fieldCount: Object.keys(t.editableFields).length,
      }));
  }
}

module.exports = { SM30Generator, KNOWN_TABLES };
