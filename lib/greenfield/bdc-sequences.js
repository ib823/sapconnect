/**
 * BDC Screen Sequence Definitions
 *
 * Comprehensive screen sequences for SAP enterprise configuration via
 * Batch Data Communication (BDC). Organized by SAP module:
 *
 *   ES  — Enterprise Structure (7 sequences)
 *   FI  — Financial Accounting (15 sequences)
 *   CO  — Controlling (8 sequences)
 *   MM  — Materials Management (10 sequences)
 *   SD  — Sales & Distribution (10 sequences)
 *   S4  — S/4HANA Mandatory (5 sequences)
 *
 * Total: 55 screen sequences
 *
 * Each sequence defines:
 *   transaction  — SAP transaction code
 *   description  — Human-readable purpose
 *   table        — SAP customizing table(s) maintained
 *   module       — Module grouping (ES, FI, CO, MM, SD, S4)
 *   screens[]    — Ordered list of dynpro interactions
 *     program    — ABAP program name
 *     dynpro     — Screen (dynpro) number
 *     fields     — Map of data-key to SAP field name
 *     action     — OK-code action (fnam/fval)
 */

const SCREEN_SEQUENCES = {

  // ═══════════════════════════════════════════════════════════════════
  // ES — Enterprise Structure
  // ═══════════════════════════════════════════════════════════════════

  company_code: {
    transaction: 'OX02',
    description: 'Create Company Code (T001)',
    table: 'T001',
    module: 'ES',
    screens: [
      {
        program: 'SAPMF02K',
        dynpro: '0100',
        fields: {
          BUKRS: 'RF02K-BUKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMF02K',
        dynpro: '0110',
        fields: {
          BUTXT: 'T001-BUTXT',
          ORT01: 'T001-ORT01',
          LAND1: 'T001-LAND1',
          WAERS: 'T001-WAERS',
          SPRAS: 'T001-SPRAS',
          KTOPL: 'T001-KTOPL',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=ENTR' },
      },
      {
        program: 'SAPMF02K',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  plant: {
    transaction: 'OX10',
    description: 'Create Plant (T001W)',
    table: 'T001W',
    module: 'ES',
    screens: [
      {
        program: 'SAPMV12A',
        dynpro: '0100',
        fields: {
          WERKS: 'T001W-WERKS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMV12A',
        dynpro: '0200',
        fields: {
          NAME1: 'T001W-NAME1',
          NAME2: 'T001W-NAME2',
          STRAS: 'T001W-STRAS',
          ORT01: 'T001W-ORT01',
          LAND1: 'T001W-LAND1',
          BUKRS: 'T001W-BUKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  sales_org: {
    transaction: 'OVXD',
    description: 'Create Sales Organization (TVKO)',
    table: 'TVKO',
    module: 'ES',
    screens: [
      {
        program: 'SAPMV12A',
        dynpro: '0100',
        fields: {
          VKORG: 'TVKO-VKORG',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMV12A',
        dynpro: '0200',
        fields: {
          VTEXT: 'TVKOT-VTEXT',
          BUKRS: 'TVKO-BUKRS',
          LAND1: 'TVKO-LAND1',
          WAESSION: 'TVKO-WAESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  purchasing_org: {
    transaction: 'OX08',
    description: 'Create Purchasing Organization (T024E)',
    table: 'T024E',
    module: 'ES',
    screens: [
      {
        program: 'SAPMM06E',
        dynpro: '0100',
        fields: {
          EKORG: 'T024E-EKORG',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMM06E',
        dynpro: '0200',
        fields: {
          EKOTX: 'T024E-EKOTX',
          BUKRS: 'T024E-BUKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  controlling_area: {
    transaction: 'OKKP',
    description: 'Create Controlling Area (TKA01)',
    table: 'TKA01',
    module: 'ES',
    screens: [
      {
        program: 'SAPLSPO4',
        dynpro: '0100',
        fields: {
          KOKRS: 'TKA01-KOKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPLSPO4',
        dynpro: '0200',
        fields: {
          BEZEI: 'TKA01-BEZEI',
          KTOPL: 'TKA01-KTOPL',
          WAESSION: 'TKA01-WAESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=ENTR' },
      },
      {
        program: 'SAPLSPO4',
        dynpro: '0300',
        fields: {
          BUKRS: 'TKA02-BUKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  storage_location: {
    transaction: 'OX09',
    description: 'Create Storage Location (T001L)',
    table: 'T001L',
    module: 'ES',
    screens: [
      {
        program: 'SAPMM03L',
        dynpro: '0100',
        fields: {
          WERKS: 'T001L-WERKS',
          LGORT: 'T001L-LGORT',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMM03L',
        dynpro: '0200',
        fields: {
          LGOBE: 'T001L-LGOBE',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  shipping_point: {
    transaction: 'OVXC',
    description: 'Create Shipping Point (TVST)',
    table: 'TVST',
    module: 'ES',
    screens: [
      {
        program: 'SAPMV12A',
        dynpro: '0100',
        fields: {
          VSTEL: 'TVST-VSTEL',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMV12A',
        dynpro: '0200',
        fields: {
          VTEXT: 'TVSTT-VTEXT',
          ATEFG: 'TVST-ATEFG',
          WERKS: 'TVST-WERKS',
          LADGR: 'TVST-LADGR',
          FABKL: 'TVST-FABKL',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // FI — Financial Accounting
  // ═══════════════════════════════════════════════════════════════════

  fiscal_year_variant: {
    transaction: 'OB29',
    description: 'Maintain Fiscal Year Variant (T009)',
    table: 'T009/T009B',
    module: 'FI',
    screens: [
      {
        program: 'SAPMF08A',
        dynpro: '0100',
        fields: {
          PERIV: 'T009-PERIV',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMF08A',
        dynpro: '0200',
        fields: {
          XJMON: 'T009-XJMON',
          XKALE: 'T009-XKALE',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  posting_period: {
    transaction: 'OB52',
    description: 'Open/Close Posting Periods (T001B)',
    table: 'T001B',
    module: 'FI',
    screens: [
      {
        program: 'SAPMF08A',
        dynpro: '0100',
        fields: {
          BUKRS: 'T001B-BUKRS',
          RLDNR: 'T001B-RLDNR',
          GJAHR: 'T001B-GJAHR',
          MOESSION: 'T001B-MOESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMF08A',
        dynpro: '0200',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  document_type_fi: {
    transaction: 'OBA7',
    description: 'Define FI Document Types (T003)',
    table: 'T003',
    module: 'FI',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          BLART: 'T003-BLART',
          TXTLG: 'T003-TXTLG',
          NUMKR: 'T003-NUMKR',
          KOESSION: 'T003-KOESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  number_range_fi: {
    transaction: 'FBN1',
    description: 'Define FI Document Number Ranges (NRIV)',
    table: 'NRIV',
    module: 'FI',
    screens: [
      {
        program: 'SAPMSNUM',
        dynpro: '0100',
        fields: {
          BUKRS: 'SAPMSNUM-BUKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMSNUM',
        dynpro: '0200',
        fields: {
          NRFROM: 'NRIV-NRFROM',
          NRTO: 'NRIV-NRTO',
          EXTERNIND: 'NRIV-EXTERNIND',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  chart_of_accounts: {
    transaction: 'OB13',
    description: 'Define Chart of Accounts (T004)',
    table: 'T004',
    module: 'FI',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          KTOPL: 'T004-KTOPL',
          KTPLTEXT: 'T004-KTPLTEXT',
          KTPLL: 'T004-KTPLL',
          WAESSION: 'T004-WAESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  account_group: {
    transaction: 'OBD4',
    description: 'Define GL Account Groups (T077S)',
    table: 'T077S',
    module: 'FI',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          KTOGR: 'T077S-KTOGR',
          TXTLG: 'T077S-TXTLG',
          VONKT: 'T077S-VONKT',
          BISKT: 'T077S-BISKT',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  field_status_group: {
    transaction: 'OBC4',
    description: 'Define Field Status Groups (T004F)',
    table: 'T004F',
    module: 'FI',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          FAZLG: 'T004F-FAZLG',
          FAESSION: 'T004F-FAESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  tolerance_group_fi: {
    transaction: 'OBA4',
    description: 'Define FI Tolerance Groups (T043T)',
    table: 'T043T',
    module: 'FI',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          HTEFG: 'T043T-HTEFG',
          KOESSION: 'T043T-KOESSION',
          BEWTP: 'T043T-BEWTP',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  payment_terms: {
    transaction: 'OBB8',
    description: 'Define Payment Terms (T052)',
    table: 'T052',
    module: 'FI',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          ZTERM: 'T052-ZTERM',
          TEXT1: 'T052-TEXT1',
          ZTAG1: 'T052-ZTAG1',
          ZPRZ1: 'T052-ZPRZ1',
          ZTAG2: 'T052-ZTAG2',
          ZTAG3: 'T052-ZTAG3',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  tax_code: {
    transaction: 'FTXP',
    description: 'Maintain Tax Code (T007A)',
    table: 'T007A',
    module: 'FI',
    screens: [
      {
        program: 'SAPMF07F',
        dynpro: '1000',
        fields: {
          KALSM: 'T007A-KALSM',
          MWSKZ: 'T007A-MWSKZ',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMF07F',
        dynpro: '2000',
        fields: {
          TXTLG: 'T007A-TXTLG',
          ZMWST: 'T007A-ZMWST',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  house_bank: {
    transaction: 'FI12',
    description: 'Maintain House Bank (T012/T012K)',
    table: 'T012/T012K',
    module: 'FI',
    screens: [
      {
        program: 'SAPMF12B',
        dynpro: '0100',
        fields: {
          BUKRS: 'T012-BUKRS',
          HBKID: 'T012-HBKID',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMF12B',
        dynpro: '0200',
        fields: {
          BANKL: 'T012-BANKL',
          BANKS: 'T012-BANKS',
          BKREF: 'T012-BKREF',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  gl_account: {
    transaction: 'FS00',
    description: 'Create GL Account (SKA1/SKB1)',
    table: 'SKA1/SKB1',
    module: 'FI',
    screens: [
      {
        program: 'SAPL0ACR',
        dynpro: '0100',
        fields: {
          BUKRS: 'SKB1-BUKRS',
          SAESSION: 'SKA1-SAESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPL0ACR',
        dynpro: '0200',
        fields: {
          TXTLG: 'SKA1-TXTLG',
          KTOGR: 'SKA1-KTOGR',
          XBILK: 'SKA1-XBILK',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=ENTR' },
      },
      {
        program: 'SAPL0ACR',
        dynpro: '0300',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=ENTR' },
      },
      {
        program: 'SAPL0ACR',
        dynpro: '0400',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  vendor_account_group: {
    transaction: 'OBD3',
    description: 'Define Vendor Account Groups (T077Y)',
    table: 'T077Y',
    module: 'FI',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          KTOKK: 'T077Y-KTOKK',
          TXTLG: 'T077Y-TXTLG',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  customer_account_group: {
    transaction: 'OBD2',
    description: 'Define Customer Account Groups (T077D)',
    table: 'T077D',
    module: 'FI',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          KTOKD: 'T077D-KTOKD',
          TXTLG: 'T077D-TXTLG',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  exchange_rate_type: {
    transaction: 'OB07',
    description: 'Define Exchange Rate Types (TCURV)',
    table: 'TCURV',
    module: 'FI',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          KURST: 'TCURV-KURST',
          XINVR: 'TCURV-XINVR',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CO — Controlling
  // ═══════════════════════════════════════════════════════════════════

  cost_element: {
    transaction: 'KA06',
    description: 'Create Primary Cost Element (CSKA/CSKB)',
    table: 'CSKA/CSKB',
    module: 'CO',
    screens: [
      {
        program: 'SAPLKMA1',
        dynpro: '0100',
        fields: {
          KSTAR: 'CSKA-KSTAR',
          KOKRS: 'CSKA-KOKRS',
          DATBI: 'CSKA-DATBI',
          DATAB: 'CSKA-DATAB',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPLKMA1',
        dynpro: '0200',
        fields: {
          TXTLG: 'CSKA-TXTLG',
          KAESSION: 'CSKA-KAESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  cost_center: {
    transaction: 'KS01',
    description: 'Create Cost Center (CSKS/CSKT)',
    table: 'CSKS/CSKT',
    module: 'CO',
    screens: [
      {
        program: 'SAPLKMA2',
        dynpro: '0100',
        fields: {
          KOSTL: 'CSKS-KOSTL',
          BUKRS: 'CSKS-BUKRS',
          DATBI: 'CSKS-DATBI',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPLKMA2',
        dynpro: '0200',
        fields: {
          KTEXT: 'CSKT-KTEXT',
          VEESSION: 'CSKS-VEESSION',
          KOESSION: 'CSKS-KOESSION',
          KHINR: 'CSKS-KHINR',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  cost_center_group: {
    transaction: 'KSH1',
    description: 'Create Cost Center Group (SETHEADER/SETNODE)',
    table: 'SETHEADER/SETNODE',
    module: 'CO',
    screens: [
      {
        program: 'SAPLKGR1',
        dynpro: '0100',
        fields: {
          SETNAME: 'SETHEADER-SETNAME',
          DESSION: 'SETHEADER-DESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPLKGR1',
        dynpro: '0200',
        fields: {
          TXLG: 'SETHEADER-TXLG',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  activity_type: {
    transaction: 'KL01',
    description: 'Create Activity Type (CSLA/CSLT)',
    table: 'CSLA/CSLT',
    module: 'CO',
    screens: [
      {
        program: 'SAPLKMA3',
        dynpro: '0100',
        fields: {
          LSTAR: 'CSLA-LSTAR',
          KOKRS: 'CSLA-KOKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPLKMA3',
        dynpro: '0200',
        fields: {
          TXTLG: 'CSLA-TXTLG',
          LEIESSION: 'CSLA-LEIESSION',
          AUESSION: 'CSLA-AUESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  statistical_key_figure: {
    transaction: 'KK01',
    description: 'Create Statistical Key Figure (TKA09)',
    table: 'TKA09',
    module: 'CO',
    screens: [
      {
        program: 'SAPLKMA4',
        dynpro: '0100',
        fields: {
          STAGR: 'TKA09-STAGR',
          KOKRS: 'TKA09-KOKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPLKMA4',
        dynpro: '0200',
        fields: {
          TXTLG: 'TKA09-TXTLG',
          SIEGR: 'TKA09-SIEGR',
          SESSION: 'TKA09-SESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  internal_order_type: {
    transaction: 'SM30',
    description: 'Define Internal Order Types (T003O)',
    table: 'T003O',
    module: 'CO',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          AUART: 'T003O-AUART',
          TXTLG: 'T003O-TXTLG',
          AUTYP: 'T003O-AUTYP',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  profit_center: {
    transaction: 'KE51',
    description: 'Create Profit Center (CEPC/CEPCT)',
    table: 'CEPC/CEPCT',
    module: 'CO',
    screens: [
      {
        program: 'SAPLKEFV',
        dynpro: '0100',
        fields: {
          PRCTR: 'CEPC-PRCTR',
          KOKRS: 'CEPC-KOKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPLKEFV',
        dynpro: '0200',
        fields: {
          KTEXT: 'CEPCT-KTEXT',
          VEESSION: 'CEPC-VEESSION',
          BUKRS: 'CEPC-BUKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  assessment_cycle_co: {
    transaction: 'KSU5',
    description: 'Create CO Assessment Cycle (COKP/COSP)',
    table: 'COKP/COSP',
    module: 'CO',
    screens: [
      {
        program: 'SAPLKGAL',
        dynpro: '0100',
        fields: {
          SETNAME: 'COKP-SETNAME',
          KOKRS: 'COKP-KOKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPLKGAL',
        dynpro: '0200',
        fields: {
          TXTLG: 'COKP-TXTLG',
          SESSION: 'COKP-SESSION',
          RESSION: 'COKP-RESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // MM — Materials Management
  // ═══════════════════════════════════════════════════════════════════

  material_type: {
    transaction: 'SM30',
    description: 'Define Material Types (T134)',
    table: 'T134',
    module: 'MM',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          MTART: 'T134-MTART',
          MTREF: 'T134-MTREF',
          MBESSION: 'T134-MBESSION',
          TXTLG: 'T134-TXTLG',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  material_group: {
    transaction: 'SM30',
    description: 'Define Material Groups (T023)',
    table: 'T023',
    module: 'MM',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          MATKL: 'T023-MATKL',
          WGBEZ: 'T023-WGBEZ',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  purchasing_group: {
    transaction: 'SM30',
    description: 'Define Purchasing Groups (T024)',
    table: 'T024',
    module: 'MM',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          EKGRP: 'T024-EKGRP',
          EKNAM: 'T024-EKNAM',
          EKTEL: 'T024-EKTEL',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  valuation_class: {
    transaction: 'SM30',
    description: 'Define Valuation Classes (T025)',
    table: 'T025',
    module: 'MM',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          BKLAS: 'T025-BKLAS',
          BKBEZ: 'T025-BKBEZ',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  purchasing_doc_type: {
    transaction: 'SM30',
    description: 'Define Purchasing Document Types (T161)',
    table: 'T161',
    module: 'MM',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          BSART: 'T161-BSART',
          BATXT: 'T161-BATXT',
          BSAKZ: 'T161-BSAKZ',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  vendor_create: {
    transaction: 'XK01',
    description: 'Create Vendor Master (LFA1/LFB1/LFM1)',
    table: 'LFA1/LFB1/LFM1',
    module: 'MM',
    screens: [
      {
        program: 'SAPMF02K',
        dynpro: '0100',
        fields: {
          LIFNR: 'RF02K-LIFNR',
          BUKRS: 'RF02K-BUKRS',
          EKORG: 'RF02K-EKORG',
          KTOKK: 'RF02K-KTOKK',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMF02K',
        dynpro: '0110',
        fields: {
          NAME1: 'LFA1-NAME1',
          SORTL: 'LFA1-SORTL',
          STRAS: 'LFA1-STRAS',
          ORT01: 'LFA1-ORT01',
          PSTLZ: 'LFA1-PSTLZ',
          LAND1: 'LFA1-LAND1',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=ENTR' },
      },
      {
        program: 'SAPMF02K',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=ENTR' },
      },
      {
        program: 'SAPMF02K',
        dynpro: '0210',
        fields: {
          AKONT: 'LFB1-AKONT',
          ZTERM: 'LFB1-ZTERM',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=ENTR' },
      },
      {
        program: 'SAPMF02K',
        dynpro: '0310',
        fields: {
          WAERS: 'LFM1-WAERS',
          ZTERM_PUR: 'LFM1-ZTERM',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  info_record: {
    transaction: 'ME11',
    description: 'Create Purchasing Info Record (EINA/EINE)',
    table: 'EINA/EINE',
    module: 'MM',
    screens: [
      {
        program: 'SAPMM06I',
        dynpro: '0100',
        fields: {
          LIFNR: 'EINA-LIFNR',
          MATNR: 'EINA-MATNR',
          EKORG: 'EINE-EKORG',
          WERKS: 'EINE-WERKS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMM06I',
        dynpro: '0200',
        fields: {
          TXTLG: 'EINA-TXTLG',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=ENTR' },
      },
      {
        program: 'SAPMM06I',
        dynpro: '0210',
        fields: {
          NETPR: 'EINE-NETPR',
          PEINH: 'EINE-PEINH',
          WAERS: 'EINE-WAERS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  source_list: {
    transaction: 'ME01',
    description: 'Maintain Source List (EORD)',
    table: 'EORD',
    module: 'MM',
    screens: [
      {
        program: 'SAPMM06S',
        dynpro: '0100',
        fields: {
          MATNR: 'EORD-MATNR',
          WERKS: 'EORD-WERKS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMM06S',
        dynpro: '0200',
        fields: {
          VDATU: 'EORD-VDATU',
          BDATU: 'EORD-BDATU',
          LIFNR: 'EORD-LIFNR',
          EKORG: 'EORD-EKORG',
          FESSION: 'EORD-FESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  movement_type: {
    transaction: 'SM30',
    description: 'Define Movement Types (T156)',
    table: 'T156',
    module: 'MM',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          BWART: 'T156-BWART',
          TXTLG: 'T156-TXTLG',
          KZZUG: 'T156-KZZUG',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  purchasing_value_key: {
    transaction: 'SM30',
    description: 'Define Purchasing Value Keys (T007V)',
    table: 'T007V',
    module: 'MM',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          EKORG: 'T007V-EKORG',
          BWSCL: 'T007V-BWSCL',
          TXTLG: 'T007V-TXTLG',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // SD — Sales & Distribution
  // ═══════════════════════════════════════════════════════════════════

  sales_doc_type: {
    transaction: 'SM30',
    description: 'Define Sales Document Types (TVAK)',
    table: 'TVAK',
    module: 'SD',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          AUART: 'TVAK-AUART',
          BEZEI: 'TVAK-BEZEI',
          VBTYP: 'TVAK-VBTYP',
          NUMKI: 'TVAK-NUMKI',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  item_category: {
    transaction: 'SM30',
    description: 'Define Item Categories (TVAP)',
    table: 'TVAP',
    module: 'SD',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          PSTYV: 'TVAP-PSTYV',
          BEZEI: 'TVAP-BEZEI',
          PSTYK: 'TVAP-PSTYK',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  delivery_type: {
    transaction: 'SM30',
    description: 'Define Delivery Types (TVLK)',
    table: 'TVLK',
    module: 'SD',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          LFART: 'TVLK-LFART',
          TXTLG: 'TVLK-TXTLG',
          VBTYP: 'TVLK-VBTYP',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  billing_type: {
    transaction: 'SM30',
    description: 'Define Billing Types (TVFK)',
    table: 'TVFK',
    module: 'SD',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          FKART: 'TVFK-FKART',
          TXTLG: 'TVFK-TXTLG',
          VBTYP: 'TVFK-VBTYP',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  pricing_procedure: {
    transaction: 'SM30',
    description: 'Define Pricing Procedures (T683S)',
    table: 'T683S',
    module: 'SD',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          KVEWE: 'T683S-KVEWE',
          KAPPL: 'T683S-KAPPL',
          KALSM: 'T683S-KALSM',
          TXTLG: 'T683S-TXTLG',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  condition_type_sd: {
    transaction: 'SM30',
    description: 'Define SD Condition Types (T685A)',
    table: 'T685A',
    module: 'SD',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          KSCHL: 'T685A-KSCHL',
          TXTLG: 'T685A-TXTLG',
          KOESSION: 'T685A-KOESSION',
          KRESSION: 'T685A-KRESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  output_type_sd: {
    transaction: 'SM30',
    description: 'Define SD Output Types (TNAPR)',
    table: 'TNAPR',
    module: 'SD',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          NAESSION: 'TNAPR-NAESSION',
          TXTLG: 'TNAPR-TXTLG',
          VERSN: 'TNAPR-VERSN',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  credit_control_area: {
    transaction: 'OB45',
    description: 'Define Credit Control Areas (T014)',
    table: 'T014',
    module: 'SD',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          KKBER: 'T014-KKBER',
          TXTLG: 'T014-TXTLG',
          WAESSION: 'T014-WAESSION',
          BUKRS: 'T014-BUKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  shipping_condition: {
    transaction: 'SM30',
    description: 'Define Shipping Conditions (VSBED)',
    table: 'VSBED',
    module: 'SD',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          VSBED: 'VSBED-VSBED',
          TXTLG: 'VSBED-TXTLG',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  sales_district: {
    transaction: 'SM30',
    description: 'Define Sales Districts (T171)',
    table: 'T171',
    module: 'SD',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          BZIRK: 'T171-BZIRK',
          BZTXT: 'T171-BZTXT',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // S4 — S/4HANA Mandatory Configuration
  // ═══════════════════════════════════════════════════════════════════

  bp_number_range: {
    transaction: 'BUCF',
    description: 'Define Business Partner Number Ranges (NRIV)',
    table: 'NRIV',
    module: 'S4',
    screens: [
      {
        program: 'SAPMSNUM',
        dynpro: '0100',
        fields: {
          OBJECT: 'SAPMSNUM-OBJECT',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMSNUM',
        dynpro: '0200',
        fields: {
          FROESSION: 'NRIV-FROESSION',
          TOESSION: 'NRIV-TOESSION',
          EXTERNIND: 'NRIV-EXTERNIND',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  bp_grouping: {
    transaction: 'SM30',
    description: 'Define Business Partner Groupings (TB003)',
    table: 'TB003',
    module: 'S4',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          BU_GROUP: 'TB003-BU_GROUP',
          TXTLG: 'TB003-TXTLG',
          NRCAT: 'TB003-NRCAT',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  material_ledger_plant: {
    transaction: 'SM30',
    description: 'Activate Material Ledger for Plant (T001K_ML)',
    table: 'T001K_ML',
    module: 'S4',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          BWKEY: 'T001K_ML-BWKEY',
          MLACTIVE: 'T001K_ML-MLACTIVE',
          MLCURRENCY: 'T001K_ML-MLCURRENCY',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  new_gl_activation: {
    transaction: 'SM30',
    description: 'Activate New GL Accounting (FAGL_ACTIVEC)',
    table: 'FAGL_ACTIVEC',
    module: 'S4',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          RLDNR: 'FAGL_ACTIVEC-RLDNR',
          ACTIVE: 'FAGL_ACTIVEC-ACTIVE',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  fiori_catalog_assign: {
    transaction: 'SM30',
    description: 'Assign Fiori Catalog Tiles (/UI2/CHIP_CATAL)',
    table: '/UI2/CHIP_CATAL',
    module: 'S4',
    screens: [
      {
        program: 'SAPMSSY0',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=NEWL' },
      },
      {
        program: 'SAPMSVMA',
        dynpro: '0100',
        fields: {
          CATALOG_ID: '/UI2/CHIP_CATAL-CATALOG_ID',
          CHIP_ID: '/UI2/CHIP_CATAL-CHIP_ID',
          DESCRIPTION: '/UI2/CHIP_CATAL-DESCRIPTION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },
};

module.exports = { SCREEN_SEQUENCES };
