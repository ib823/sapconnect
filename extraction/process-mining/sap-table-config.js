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
 * SAP Table-to-Event-Log Mapping Configuration
 *
 * Complete table, field, activity, case-ID correlation, and KPI definitions
 * for all 7 standard SAP business processes. Supports ECC 6.0 and S/4HANA.
 *
 * This is pure configuration data. Extraction logic lives in
 * document-flow-reconstructor.js; event assembly in event-log-builder.js.
 *
 * Table classification determines how rows become events:
 *   RECORD      - business object creation (EKKO, VBAK)      -> "Create [Object]"
 *   TRANSACTION - process transactions (RBKP, BKPF)          -> activity from TCODE
 *   FLOW        - document relationships (VBFA, EKBE)         -> activity from doc-type transition
 *   CHANGE      - modification history (CDHDR/CDPOS)          -> activity from field changes
 *   DETAIL      - line items (EKPO, BSEG)                     -> enrichment, no events
 *   STATUS      - status tables (VBUK, JEST)                  -> activity from status transitions
 *   MASTER      - master data (KNA1, LFA1)                    -> enrichment only
 */

'use strict';

// ---------------------------------------------------------------------------
// Table type classification
// ---------------------------------------------------------------------------

const TABLE_TYPES = {
  RECORD: 'record',
  TRANSACTION: 'transaction',
  FLOW: 'flow',
  CHANGE: 'change',
  DETAIL: 'detail',
  STATUS: 'status',
  MASTER: 'master',
};

// ---------------------------------------------------------------------------
// O2C  -  Order to Cash
// ---------------------------------------------------------------------------

const O2C = {
  id: 'O2C',
  name: 'Order to Cash',
  description: 'End-to-end sales process from order creation through payment receipt',

  caseId: {
    primary: { table: 'VBAK', field: 'VBELN' },
    correlations: [
      { table: 'VBFA', sourceField: 'VBELV', targetField: 'VBELN', targetTable: 'VBAK' },
      { table: 'LIKP', via: 'VBFA', linkField: 'VBELN' },
      { table: 'VBRK', via: 'VBFA', linkField: 'VBELN' },
      { table: 'BKPF', via: 'VBRK', linkField: 'BELNR', linkTable: 'BKPF', joinField: 'AWKEY' },
      { table: 'BSAD', via: 'BKPF', linkField: 'BELNR' },
      { table: 'BSID', via: 'BKPF', linkField: 'BELNR' },
      { table: 'NAST', linkField: 'OBJKY', targetField: 'VBELN', targetTable: 'VBRK' },
    ],
  },

  tables: {
    // ----- Sales Order Header -----
    VBAK: {
      type: TABLE_TYPES.RECORD,
      description: 'Sales document header',
      fields: [
        'VBELN', 'ERDAT', 'ERZET', 'AUART', 'KUNNR', 'VKORG',
        'VTWEG', 'SPART', 'NETWR', 'WAERK', 'ERNAM', 'VDATU',
        'BNDDT', 'GWLDT', 'KNUMV', 'BSTNK',
      ],
      activityMapping: {
        activity: 'Create Sales Order',
        timestampField: 'ERDAT',
        timeField: 'ERZET',
        resourceField: 'ERNAM',
      },
      caseIdField: 'VBELN',
      s4hana: { statusFields: ['GBSTK', 'LFSTK', 'FKSTK', 'ABSTK'] },
    },

    // ----- Sales Order Item -----
    VBAP: {
      type: TABLE_TYPES.DETAIL,
      description: 'Sales document item',
      fields: [
        'VBELN', 'POSNR', 'MATNR', 'KWMENG', 'VRKME', 'NETWR',
        'WERKS', 'LGORT', 'PSTYV', 'ABGRU', 'WAVWR',
      ],
      caseIdField: 'VBELN',
      s4hana: { statusFields: ['GBSTA', 'LFSTA', 'FKSTA'] },
    },

    // ----- Schedule Lines -----
    VBEP: {
      type: TABLE_TYPES.DETAIL,
      description: 'Sales document schedule line',
      fields: [
        'VBELN', 'POSNR', 'ETENR', 'EDATU', 'WMENG', 'BMENG',
        'LMENG', 'ETTYP', 'WADAT',
      ],
      caseIdField: 'VBELN',
    },

    // ----- Document Flow -----
    VBFA: {
      type: TABLE_TYPES.FLOW,
      description: 'Sales document flow',
      fields: [
        'VBELV', 'POSNV', 'VBELN', 'POSNN', 'VBTYP_N', 'VBTYP_V',
        'RFMNG', 'RFWRT', 'ERDAT', 'ERZET', 'MAESSION',
      ],
      caseIdField: 'VBELV',
      documentTypeMap: {
        'A': 'Create Inquiry',
        'B': 'Create Quotation',
        'C': 'Create Sales Order',
        'H': 'Create Return Order',
        'J': 'Create Delivery',
        'K': 'Create Credit Memo Request',
        'L': 'Create Debit Memo Request',
        'M': 'Create Invoice',
        'N': 'Create Invoice Cancellation',
        'O': 'Create Credit Memo',
        'P': 'Create Debit Memo',
        'R': 'Create Goods Movement',
        'T': 'Create Shipment',
        'U': 'Create Delivery (Returns)',
        'V': 'Create Purchase Order',
        'W': 'Create Independent Requirements',
        '0': 'Create Master Contract',
        '7': 'Create Handling Unit',
        '8': 'Create Down Payment Request',
      },
    },

    // ----- Delivery Header -----
    LIKP: {
      type: TABLE_TYPES.RECORD,
      description: 'Delivery header',
      fields: [
        'VBELN', 'ERDAT', 'ERZET', 'LFART', 'WADAT', 'WADAT_IST',
        'KUNNR', 'VSTEL', 'ROUTE', 'ERNAM', 'KODAT', 'PODAT',
        'LFDAT', 'TRESSION',
      ],
      activityMapping: {
        activity: 'Create Delivery',
        timestampField: 'ERDAT',
        timeField: 'ERZET',
        resourceField: 'ERNAM',
      },
      additionalActivities: [
        { activity: 'Goods Issue', timestampField: 'WADAT_IST', condition: 'WADAT_IST IS NOT NULL' },
        { activity: 'Pick', timestampField: 'KODAT', condition: 'KODAT IS NOT NULL' },
        { activity: 'Pack', timestampField: 'PODAT', condition: 'PODAT IS NOT NULL' },
      ],
      caseIdField: 'VBELN',
    },

    // ----- Delivery Item -----
    LIPS: {
      type: TABLE_TYPES.DETAIL,
      description: 'Delivery item',
      fields: [
        'VBELN', 'POSNR', 'MATNR', 'WERKS', 'LGORT', 'LFIMG',
        'VRKME', 'VGBEL', 'VGPOS', 'PSTYV',
      ],
      caseIdField: 'VBELN',
    },

    // ----- Billing Header -----
    VBRK: {
      type: TABLE_TYPES.RECORD,
      description: 'Billing document header',
      fields: [
        'VBELN', 'FKART', 'FKDAT', 'ERDAT', 'ERZET', 'VKORG',
        'KUNAG', 'KUNRG', 'NETWR', 'WAERK', 'ERNAM', 'BUKRS',
        'BELNR', 'GJAHR',
      ],
      activityMapping: {
        activity: 'Create Invoice',
        timestampField: 'ERDAT',
        timeField: 'ERZET',
        resourceField: 'ERNAM',
      },
      caseIdField: 'VBELN',
    },

    // ----- Billing Item -----
    VBRP: {
      type: TABLE_TYPES.DETAIL,
      description: 'Billing document item',
      fields: [
        'VBELN', 'POSNR', 'MATNR', 'FKIMG', 'VRKME', 'NETWR',
        'WERKS', 'AUBEL', 'AUPOS',
      ],
      caseIdField: 'VBELN',
    },

    // ----- Accounting Document Header -----
    BKPF: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Accounting document header',
      fields: [
        'BUKRS', 'BELNR', 'GJAHR', 'BLART', 'BUDAT', 'BLDAT',
        'CPUDT', 'CPUTM', 'USNAM', 'TCODE', 'BKTXT', 'WAERS',
        'AWTYP', 'AWKEY',
      ],
      activityMapping: {
        activity: 'Post Accounting Document',
        timestampField: 'CPUDT',
        timeField: 'CPUTM',
        resourceField: 'USNAM',
      },
      caseIdField: 'BELNR',
    },

    // ----- Accounting Line Items -----
    BSEG: {
      type: TABLE_TYPES.DETAIL,
      description: 'Accounting document line item',
      fields: [
        'BUKRS', 'BELNR', 'GJAHR', 'BUZEI', 'BSCHL', 'KOART',
        'HKONT', 'KUNNR', 'LIFNR', 'WRBTR', 'SHKZG', 'KOSTL',
        'AUGDT', 'AUGBL', 'ZUONR', 'SGTXT',
      ],
      caseIdField: 'BELNR',
    },

    // ----- Customer Open Items -----
    BSID: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Customer open items (accounting)',
      fields: [
        'BUKRS', 'KUNNR', 'UMSKS', 'UMSKZ', 'AUGDT', 'AUGBL',
        'GJAHR', 'BELNR', 'BUZEI', 'BUDAT', 'BLDAT', 'BLART',
        'WRBTR', 'SHKZG', 'WAERS', 'ZUONR',
      ],
      caseIdField: 'BELNR',
    },

    // ----- Customer Cleared Items -----
    BSAD: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Customer cleared items (accounting)',
      fields: [
        'BUKRS', 'KUNNR', 'UMSKS', 'UMSKZ', 'AUGDT', 'AUGBL',
        'GJAHR', 'BELNR', 'BUZEI', 'BUDAT', 'BLDAT', 'BLART',
        'WRBTR', 'SHKZG', 'WAERS', 'ZUONR',
      ],
      activityMapping: {
        activity: 'Payment Received',
        timestampField: 'AUGDT',
        resourceField: null,
      },
      caseIdField: 'BELNR',
    },

    // ----- Output / Messages -----
    NAST: {
      type: TABLE_TYPES.STATUS,
      description: 'Message status',
      fields: [
        'KAPESSION', 'OBJKY', 'KSCHL', 'SPRAS', 'PESSION',
        'NAESSION', 'DAESSION', 'UHESSION', 'VSTAT', 'ERDAT',
        'USNAM',
      ],
      activityMapping: {
        activity: 'Send Invoice',
        timestampField: 'ERDAT',
        resourceField: 'USNAM',
        condition: 'VSTAT = 1',
      },
      caseIdField: 'OBJKY',
    },

    // ----- Sales Document Header Status (ECC only) -----
    VBUK: {
      type: TABLE_TYPES.STATUS,
      description: 'Sales document header status',
      ecc_only: true,
      fields: [
        'VBELN', 'GBSTK', 'LFSTK', 'FKSTK', 'ABSTK', 'COSTA',
        'LVSTK', 'LFGSK', 'FKIVK', 'UVALL', 'CMGST',
      ],
      statusTransitions: {
        'LFSTK': { 'A': 'Delivery Not Yet Processed', 'B': 'Delivery Partially Processed', 'C': 'Delivery Fully Processed' },
        'FKSTK': { 'A': 'Billing Not Yet Processed', 'B': 'Billing Partially Processed', 'C': 'Billing Fully Processed' },
        'CMGST': { 'A': 'Credit Check Not Performed', 'B': 'Credit Check Failed', 'C': 'Credit Check Passed' },
      },
      caseIdField: 'VBELN',
    },

    // ----- Sales Document Item Status (ECC only) -----
    VBUP: {
      type: TABLE_TYPES.STATUS,
      description: 'Sales document item status',
      ecc_only: true,
      fields: [
        'VBELN', 'POSNR', 'GBSTA', 'LFSTA', 'FKSTA', 'ABSTA',
        'COSTA', 'LVSTA', 'FKSAA', 'UVALL',
      ],
      caseIdField: 'VBELN',
    },

    // ----- Change Document Header -----
    CDHDR: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document header',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'USERNAME', 'UDATE',
        'UTIME', 'TCODE', 'PLESSION',
      ],
      objectClasses: ['VERKBELEG', 'LIEFERUNG', 'FAKTBELEG'],
      caseIdField: 'OBJECTID',
    },

    // ----- Change Document Items -----
    CDPOS: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document items',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'TABNAME', 'TABKEY',
        'FNAME', 'CHNGIND', 'VALUE_NEW', 'VALUE_OLD',
      ],
      caseIdField: 'OBJECTID',
    },

    // ----- Customer Master -----
    KNA1: {
      type: TABLE_TYPES.MASTER,
      description: 'Customer master (general)',
      fields: [
        'KUNNR', 'NAME1', 'NAME2', 'LAND1', 'ORT01', 'REGIO',
        'PSTLZ', 'KTOKD', 'STCD1',
      ],
    },
  },

  referenceActivities: [
    'Create Sales Order',
    'Credit Check',
    'Create Delivery',
    'Pick',
    'Pack',
    'Goods Issue',
    'Create Invoice',
    'Send Invoice',
    'Payment Received',
  ],

  kpis: {
    'Order to Delivery Time': {
      from: 'Create Sales Order', to: 'Create Delivery', unit: 'days', target: 5,
    },
    'Delivery to Invoice Time': {
      from: 'Create Delivery', to: 'Create Invoice', unit: 'days', target: 2,
    },
    'Days Sales Outstanding': {
      from: 'Create Invoice', to: 'Payment Received', unit: 'days', target: 30,
    },
    'Order to Cash Cycle': {
      from: 'Create Sales Order', to: 'Payment Received', unit: 'days', target: 45,
    },
    'Perfect Order Rate': {
      type: 'ratio', numerator: 'no_rework_cases', denominator: 'total_cases', target: 0.95,
    },
    'On-Time Delivery Rate': {
      type: 'ratio', numerator: 'on_time_deliveries', denominator: 'total_deliveries', target: 0.95,
    },
    'Order Rejection Rate': {
      type: 'ratio', numerator: 'rejected_orders', denominator: 'total_orders', target: 0.02,
    },
  },

  tcodeMap: {
    'VA01': 'Create Sales Order',
    'VA02': 'Change Sales Order',
    'VA03': 'Display Sales Order',
    'VL01N': 'Create Delivery',
    'VL02N': 'Change Delivery',
    'VL06G': 'Goods Issue (List)',
    'VF01': 'Create Invoice',
    'VF02': 'Change Invoice',
    'VF04': 'Maintain Billing Due List',
    'VF11': 'Cancel Invoice',
    'F-28': 'Post Payment',
    'F-32': 'Clear Customer',
    'FBL5N': 'Display Customer Line Items',
    'VKM1': 'Credit Management (Blocked SOs)',
    'VKM3': 'Credit Management (Released SOs)',
    'VA05': 'List Sales Orders',
  },

  enrichment: {
    KNA1: { joinField: 'KUNNR', enrichFields: ['NAME1', 'LAND1', 'ORT01', 'REGIO'] },
    MARA: { joinField: 'MATNR', enrichFields: ['MAKTX', 'MTART', 'MATKL'] },
    TVKO: { joinField: 'VKORG', enrichFields: ['VTEXT'] },
  },

  s4hana: {
    tableReplacements: {
      'VBUK': null,
      'VBUP': null,
    },
    fieldMigrations: {
      'VBUK.GBSTK': 'VBAK.GBSTK',
      'VBUK.LFSTK': 'VBAK.LFSTK',
      'VBUK.FKSTK': 'VBAK.FKSTK',
      'VBUK.CMGST': 'VBAK.CMGST',
      'VBUP.GBSTA': 'VBAP.GBSTA',
      'VBUP.LFSTA': 'VBAP.LFSTA',
      'VBUP.FKSTA': 'VBAP.FKSTA',
    },
    cdsViews: {
      'I_SalesDocument': 'VBAK/VBAP replacement CDS view',
      'I_SalesDocumentItem': 'VBAP replacement CDS view',
      'I_BillingDocument': 'VBRK replacement CDS view',
      'I_DeliveryDocument': 'LIKP replacement CDS view',
    },
  },
};

// ---------------------------------------------------------------------------
// P2P  -  Procure to Pay
// ---------------------------------------------------------------------------

const P2P = {
  id: 'P2P',
  name: 'Procure to Pay',
  description: 'End-to-end procurement process from purchase requisition through vendor payment',

  caseId: {
    primary: { table: 'EKKO', field: 'EBELN' },
    correlations: [
      { table: 'EBAN', sourceField: 'EBELN', targetField: 'EBELN', targetTable: 'EKKO', description: 'PR assigned to PO' },
      { table: 'EKBE', sourceField: 'EBELN', targetField: 'EBELN', targetTable: 'EKKO' },
      { table: 'RBKP', via: 'RSEG', linkField: 'EBELN' },
      { table: 'BKPF', via: 'RBKP', linkField: 'BELNR', joinField: 'AWKEY' },
      { table: 'BSAK', via: 'BKPF', linkField: 'BELNR' },
      { table: 'BSIK', via: 'BKPF', linkField: 'BELNR' },
    ],
  },

  tables: {
    // ----- Purchase Requisition -----
    EBAN: {
      type: TABLE_TYPES.RECORD,
      description: 'Purchase requisition',
      fields: [
        'BANFN', 'BNFPO', 'BSART', 'MATNR', 'WERKS', 'LGORT',
        'MENGE', 'MEINS', 'LFDAT', 'EKGRP', 'AFNAM', 'ERDAT',
        'ERNAM', 'FRGZU', 'FRGST', 'FRGKZ', 'EBELN', 'EBELP',
        'BADAT', 'TXZ01',
      ],
      activityMapping: {
        activity: 'Create Purchase Requisition',
        timestampField: 'ERDAT',
        resourceField: 'ERNAM',
      },
      additionalActivities: [
        { activity: 'Approve Purchase Requisition', timestampField: 'FRGDT', condition: 'FRGKZ = X', resourceField: null },
      ],
      caseIdField: 'BANFN',
    },

    // ----- PR Account Assignment -----
    EBKN: {
      type: TABLE_TYPES.DETAIL,
      description: 'Purchase requisition account assignment',
      fields: [
        'BANFN', 'BNFPO', 'SAKTO', 'KOSTL', 'AUFNR', 'ANLN1',
        'NPLNR', 'WRBTR',
      ],
      caseIdField: 'BANFN',
    },

    // ----- Purchase Order Header -----
    EKKO: {
      type: TABLE_TYPES.RECORD,
      description: 'Purchasing document header',
      fields: [
        'EBELN', 'BUKRS', 'BSTYP', 'BSART', 'LOEKZ', 'AEDAT',
        'ERNAM', 'EKORG', 'EKGRP', 'LIFNR', 'ZTERM', 'INCO1',
        'INCO2', 'FRGZU', 'FRGST', 'FRGKE', 'PROCSTAT',
      ],
      activityMapping: {
        activity: 'Create Purchase Order',
        timestampField: 'AEDAT',
        resourceField: 'ERNAM',
      },
      additionalActivities: [
        { activity: 'Approve Purchase Order', condition: 'FRGKE = X', timestampField: 'AEDAT' },
      ],
      caseIdField: 'EBELN',
    },

    // ----- Purchase Order Item -----
    EKPO: {
      type: TABLE_TYPES.DETAIL,
      description: 'Purchasing document item',
      fields: [
        'EBELN', 'EBELP', 'MATNR', 'TXZ01', 'WERKS', 'LGORT',
        'MENGE', 'MEINS', 'NETPR', 'PEINH', 'NETWR', 'BPRME',
        'PSTYP', 'KNTTP', 'LOEKZ', 'RETPO',
      ],
      caseIdField: 'EBELN',
    },

    // ----- PO Schedule Lines -----
    EKET: {
      type: TABLE_TYPES.DETAIL,
      description: 'Purchasing document schedule line',
      fields: [
        'EBELN', 'EBELP', 'ETENR', 'EINDT', 'SLFDT', 'MENGE',
        'WEMNG', 'WAMNG',
      ],
      caseIdField: 'EBELN',
    },

    // ----- PO History (goods receipts, invoice receipts) -----
    EKBE: {
      type: TABLE_TYPES.FLOW,
      description: 'Purchasing document history',
      fields: [
        'EBELN', 'EBELP', 'ZEKKN', 'VGABE', 'BEWTP', 'BELNR',
        'BUZEI', 'GJAHR', 'BUDAT', 'MENGE', 'DMBTR', 'WAERS',
        'SHKZG', 'BWART', 'XBLNR', 'CPUDT', 'CPUTM', 'USNAM',
        'LFBNR', 'LFGJA', 'LFPOS',
      ],
      documentTypeMap: {
        '1': 'Goods Receipt',
        '2': 'Invoice Receipt',
        '3': 'Goods Issue (Reversal)',
        '4': 'Delivery from Subcontractor',
        '5': 'Subsequent Adjustment',
        '6': 'Subsequent Debit/Credit',
        'E': 'Goods Receipt (Valuated)',
        'Q': 'Goods Receipt (Delivery Costs)',
        'R': 'Invoice Receipt (ERS)',
      },
      caseIdField: 'EBELN',
    },

    // ----- Invoice Document Header -----
    RBKP: {
      type: TABLE_TYPES.RECORD,
      description: 'Invoice document header (logistics)',
      fields: [
        'BELNR', 'GJAHR', 'BLDAT', 'BUDAT', 'CPUDT', 'CPUTM',
        'USNAM', 'TCODE', 'XBLNR', 'LIFNR', 'WAERS', 'RMWWR',
        'WMWST1', 'STJAH', 'STBLG', 'BKTXT',
      ],
      activityMapping: {
        activity: 'Invoice Receipt',
        timestampField: 'CPUDT',
        timeField: 'CPUTM',
        resourceField: 'USNAM',
      },
      caseIdField: 'BELNR',
    },

    // ----- Invoice Document Item -----
    RSEG: {
      type: TABLE_TYPES.DETAIL,
      description: 'Invoice document item (logistics)',
      fields: [
        'BELNR', 'GJAHR', 'BUZEI', 'EBELN', 'EBELP', 'MATNR',
        'WERKS', 'MENGE', 'BPRME', 'WRBTR', 'WAERS',
      ],
      caseIdField: 'BELNR',
    },

    // ----- Accounting Document Header -----
    BKPF: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Accounting document header',
      fields: [
        'BUKRS', 'BELNR', 'GJAHR', 'BLART', 'BUDAT', 'BLDAT',
        'CPUDT', 'CPUTM', 'USNAM', 'TCODE', 'BKTXT', 'WAERS',
        'AWTYP', 'AWKEY',
      ],
      activityMapping: {
        activity: 'Post Accounting Document',
        timestampField: 'CPUDT',
        timeField: 'CPUTM',
        resourceField: 'USNAM',
      },
      caseIdField: 'BELNR',
    },

    // ----- Accounting Line Items -----
    BSEG: {
      type: TABLE_TYPES.DETAIL,
      description: 'Accounting document line item',
      fields: [
        'BUKRS', 'BELNR', 'GJAHR', 'BUZEI', 'BSCHL', 'KOART',
        'HKONT', 'KUNNR', 'LIFNR', 'WRBTR', 'SHKZG', 'KOSTL',
        'AUGDT', 'AUGBL', 'ZUONR', 'SGTXT',
      ],
      caseIdField: 'BELNR',
    },

    // ----- Vendor Open Items -----
    BSIK: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Vendor open items (accounting)',
      fields: [
        'BUKRS', 'LIFNR', 'UMSKS', 'UMSKZ', 'AUGDT', 'AUGBL',
        'GJAHR', 'BELNR', 'BUZEI', 'BUDAT', 'BLDAT', 'BLART',
        'WRBTR', 'SHKZG', 'WAERS', 'ZUONR', 'ZFBDT', 'ZBD1T',
      ],
      caseIdField: 'BELNR',
    },

    // ----- Vendor Cleared Items -----
    BSAK: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Vendor cleared items (accounting)',
      fields: [
        'BUKRS', 'LIFNR', 'UMSKS', 'UMSKZ', 'AUGDT', 'AUGBL',
        'GJAHR', 'BELNR', 'BUZEI', 'BUDAT', 'BLDAT', 'BLART',
        'WRBTR', 'SHKZG', 'WAERS', 'ZUONR',
      ],
      activityMapping: {
        activity: 'Payment Sent',
        timestampField: 'AUGDT',
        resourceField: null,
      },
      caseIdField: 'BELNR',
    },

    // ----- Change Document Header -----
    CDHDR: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document header',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'USERNAME', 'UDATE',
        'UTIME', 'TCODE',
      ],
      objectClasses: ['EINKBELEG', 'BANF'],
      caseIdField: 'OBJECTID',
    },

    // ----- Change Document Items -----
    CDPOS: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document items',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'TABNAME', 'TABKEY',
        'FNAME', 'CHNGIND', 'VALUE_NEW', 'VALUE_OLD',
      ],
      caseIdField: 'OBJECTID',
    },

    // ----- Output / Messages -----
    NAST: {
      type: TABLE_TYPES.STATUS,
      description: 'Message status',
      fields: [
        'KAPPL', 'OBJKY', 'KSCHL', 'SPRAS', 'PESSION',
        'NAESSION', 'DAESSION', 'UHESSION', 'VSTAT', 'ERDAT',
        'USNAM',
      ],
      activityMapping: {
        activity: 'Send Purchase Order',
        timestampField: 'ERDAT',
        resourceField: 'USNAM',
        condition: 'VSTAT = 1 AND KAPPL = EF',
      },
      caseIdField: 'OBJKY',
    },

    // ----- Vendor Master -----
    LFA1: {
      type: TABLE_TYPES.MASTER,
      description: 'Vendor master (general)',
      fields: [
        'LIFNR', 'NAME1', 'NAME2', 'LAND1', 'ORT01', 'REGIO',
        'PSTLZ', 'KTOKK', 'STCD1',
      ],
    },
  },

  referenceActivities: [
    'Create Purchase Requisition',
    'Approve Purchase Requisition',
    'Create Purchase Order',
    'Approve Purchase Order',
    'Send Purchase Order',
    'Goods Receipt',
    'Invoice Receipt',
    'Three-Way Match',
    'Payment Sent',
  ],

  kpis: {
    'PR to PO Time': {
      from: 'Create Purchase Requisition', to: 'Create Purchase Order', unit: 'days', target: 3,
    },
    'PO to GR Time': {
      from: 'Create Purchase Order', to: 'Goods Receipt', unit: 'days', target: 14,
    },
    'GR to IR Time': {
      from: 'Goods Receipt', to: 'Invoice Receipt', unit: 'days', target: 5,
    },
    'Days Payable Outstanding': {
      from: 'Invoice Receipt', to: 'Payment Sent', unit: 'days', target: 45,
    },
    'Procure to Pay Cycle': {
      from: 'Create Purchase Requisition', to: 'Payment Sent', unit: 'days', target: 60,
    },
    'Maverick Buying Rate': {
      type: 'ratio', numerator: 'po_without_pr', denominator: 'total_pos', target: 0.05,
    },
    'PO Touchless Rate': {
      type: 'ratio', numerator: 'auto_created_pos', denominator: 'total_pos', target: 0.60,
    },
    'Invoice Automation Rate': {
      type: 'ratio', numerator: 'auto_invoices', denominator: 'total_invoices', target: 0.70,
    },
  },

  tcodeMap: {
    'ME51N': 'Create Purchase Requisition',
    'ME52N': 'Change Purchase Requisition',
    'ME54N': 'Approve Purchase Requisition',
    'ME21N': 'Create Purchase Order',
    'ME22N': 'Change Purchase Order',
    'ME23N': 'Display Purchase Order',
    'ME28': 'Release Purchase Order',
    'ME29N': 'Release Purchase Order',
    'MIGO': 'Goods Receipt',
    'MIRO': 'Invoice Receipt',
    'MIR4': 'Display Invoice',
    'MIR7': 'Park Invoice',
    'MRRL': 'Evaluated Receipt Settlement',
    'F110': 'Payment Run',
    'F-53': 'Post Vendor Payment',
    'F-44': 'Clear Vendor',
    'FBL1N': 'Display Vendor Line Items',
    'ME2M': 'PO by Material',
    'ME2N': 'PO by PO Number',
  },

  enrichment: {
    LFA1: { joinField: 'LIFNR', enrichFields: ['NAME1', 'LAND1', 'ORT01', 'REGIO'] },
    MARA: { joinField: 'MATNR', enrichFields: ['MAKTX', 'MTART', 'MATKL'] },
    T024: { joinField: 'EKGRP', enrichFields: ['EKNAM'] },
  },

  s4hana: {
    tableReplacements: {},
    cdsViews: {
      'I_PurchaseOrderAPI01': 'EKKO/EKPO replacement CDS view',
      'I_PurchaseRequisitionItem': 'EBAN replacement CDS view',
      'I_SupplierInvoice': 'RBKP/RSEG replacement CDS view',
    },
  },
};

// ---------------------------------------------------------------------------
// R2R  -  Record to Report
// ---------------------------------------------------------------------------

const R2R = {
  id: 'R2R',
  name: 'Record to Report',
  description: 'End-to-end financial close process from journal entry creation through reporting',

  caseId: {
    primary: { table: 'BKPF', field: 'BELNR' },
    correlations: [
      { table: 'BSEG', sourceField: 'BELNR', targetField: 'BELNR', targetTable: 'BKPF' },
      { table: 'FAGLFLEXA', sourceField: 'BELNR', targetField: 'BELNR', targetTable: 'BKPF' },
      { table: 'ACDOCA', sourceField: 'BELNR', targetField: 'BELNR', targetTable: 'BKPF' },
    ],
  },

  tables: {
    // ----- Accounting Document Header -----
    BKPF: {
      type: TABLE_TYPES.RECORD,
      description: 'Accounting document header',
      fields: [
        'BUKRS', 'BELNR', 'GJAHR', 'BLART', 'BUDAT', 'BLDAT',
        'CPUDT', 'CPUTM', 'USNAM', 'TCODE', 'BKTXT', 'WAERS',
        'MONAT', 'STBLG', 'STJAH', 'BSTAT', 'XBLNR', 'AWTYP',
        'AWKEY',
      ],
      activityMapping: {
        activity: 'Create Journal Entry',
        timestampField: 'CPUDT',
        timeField: 'CPUTM',
        resourceField: 'USNAM',
      },
      additionalActivities: [
        { activity: 'Park Journal Entry', condition: 'BSTAT = V', timestampField: 'CPUDT', timeField: 'CPUTM' },
        { activity: 'Post Journal Entry', condition: 'BSTAT = " "', timestampField: 'BUDAT' },
        { activity: 'Reverse Journal Entry', condition: 'STBLG IS NOT NULL', timestampField: 'CPUDT' },
      ],
      caseIdField: 'BELNR',
    },

    // ----- Accounting Line Items -----
    BSEG: {
      type: TABLE_TYPES.DETAIL,
      description: 'Accounting document line item',
      fields: [
        'BUKRS', 'BELNR', 'GJAHR', 'BUZEI', 'BSCHL', 'KOART',
        'HKONT', 'KUNNR', 'LIFNR', 'WRBTR', 'DMBTR', 'SHKZG',
        'KOSTL', 'AUFNR', 'PRCTR', 'AUGDT', 'AUGBL', 'ZUONR',
        'SGTXT',
      ],
      caseIdField: 'BELNR',
    },

    // ----- G/L Account Line Items (New GL) -----
    FAGLFLEXA: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'General ledger line items (new GL)',
      ecc_only: true,
      fields: [
        'RLDNR', 'RBUKRS', 'GJAHR', 'BELNR', 'DOCLN', 'RYESSION',
        'POPER', 'RACCT', 'RCNTR', 'PRCTR', 'RFAREA', 'RBUSA',
        'RHCUR', 'HSL', 'TSL', 'DRCRK', 'BUDAT', 'USNAM',
      ],
      caseIdField: 'BELNR',
    },

    // ----- Universal Journal (S/4HANA) -----
    ACDOCA: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Universal journal entry',
      fields: [
        'RCLNT', 'RLDNR', 'RBUKRS', 'GJAHR', 'BELNR', 'DOCLN',
        'RYESSION', 'POPER', 'RACCT', 'RCNTR', 'PRCTR', 'RFAREA',
        'RBUSA', 'RHCUR', 'HSL', 'TSL', 'DRCRK', 'BUDAT',
        'TIMESTAMP', 'USNAM', 'AWTYP', 'AWKEY', 'KTOPL',
      ],
      caseIdField: 'BELNR',
    },

    // ----- G/L Account Master -----
    SKA1: {
      type: TABLE_TYPES.MASTER,
      description: 'G/L account master (chart of accounts)',
      fields: [
        'KTOPL', 'SAKNR', 'BILKT', 'GVTYP', 'KTOKS', 'XBILK',
        'XPLACCOUNT',
      ],
    },

    // ----- Company Code -----
    T001: {
      type: TABLE_TYPES.MASTER,
      description: 'Company codes',
      fields: [
        'BUKRS', 'BUTXT', 'ORT01', 'LAND1', 'WAERS', 'KTOPL',
        'PERIV', 'RCOMP',
      ],
    },

    // ----- Document Types -----
    T003: {
      type: TABLE_TYPES.MASTER,
      description: 'Document types',
      fields: [
        'BLART', 'LTEXT', 'NUMKR', 'KOESSION',
      ],
    },

    // ----- Change Document Header -----
    CDHDR: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document header',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'USERNAME', 'UDATE',
        'UTIME', 'TCODE',
      ],
      objectClasses: ['BELEG', 'BKPF'],
      caseIdField: 'OBJECTID',
    },

    // ----- Change Document Items -----
    CDPOS: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document items',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'TABNAME', 'TABKEY',
        'FNAME', 'CHNGIND', 'VALUE_NEW', 'VALUE_OLD',
      ],
      caseIdField: 'OBJECTID',
    },
  },

  referenceActivities: [
    'Create Journal Entry',
    'Park Journal Entry',
    'Post Journal Entry',
    'Approve Journal Entry',
    'Clear Line Items',
    'Foreign Currency Valuation',
    'GR/IR Clearing',
    'Reconcile Intercompany',
    'Period Close',
    'Generate Report',
  ],

  kpis: {
    'Journal Entry Cycle Time': {
      from: 'Create Journal Entry', to: 'Post Journal Entry', unit: 'hours', target: 4,
    },
    'Period Close Duration': {
      from: 'Period Close', to: 'Generate Report', unit: 'days', target: 5,
    },
    'Posting Error Rate': {
      type: 'ratio', numerator: 'reversed_entries', denominator: 'total_entries', target: 0.01,
    },
    'Automated Posting Rate': {
      type: 'ratio', numerator: 'auto_posted_entries', denominator: 'total_entries', target: 0.80,
    },
    'Manual Journal Entry Rate': {
      type: 'ratio', numerator: 'manual_entries', denominator: 'total_entries', target: 0.15,
    },
    'Intercompany Reconciliation Time': {
      from: 'Period Close', to: 'Reconcile Intercompany', unit: 'days', target: 3,
    },
  },

  tcodeMap: {
    'FB01': 'Post Journal Entry',
    'FB02': 'Change Journal Entry',
    'FB03': 'Display Journal Entry',
    'FB50': 'Post G/L Account Entry',
    'FBV0': 'Park Journal Entry',
    'FBV2': 'Change Parked Entry',
    'FBRA': 'Reset Cleared Items',
    'F-02': 'Post General Ledger Entry',
    'F-03': 'Clear G/L Account',
    'F-04': 'Post with Clearing',
    'F-07': 'Post Incoming Payment',
    'F101': 'Period Close - Repost',
    'FAGL_FC_VAL': 'Foreign Currency Valuation',
    'F.5D': 'GR/IR Clearing',
    'FAGLB03': 'Display GL Balances (New)',
    'F.01': 'Financial Statements',
    'S_ALR_87012284': 'GL Account Line Items',
    'FBB1': 'Post with Reference',
    'FB08': 'Reverse Document',
  },

  enrichment: {
    SKA1: { joinField: 'SAKNR', enrichFields: ['BILKT', 'GVTYP'] },
    T001: { joinField: 'BUKRS', enrichFields: ['BUTXT', 'LAND1', 'WAERS'] },
    T003: { joinField: 'BLART', enrichFields: ['LTEXT'] },
  },

  s4hana: {
    tableReplacements: {
      'FAGLFLEXA': 'ACDOCA',
      'BSIS': 'ACDOCA',
      'BSAS': 'ACDOCA',
      'GLT0': 'ACDOCA',
    },
    cdsViews: {
      'I_JournalEntry': 'BKPF/BSEG replacement CDS view',
      'I_JournalEntryItem': 'BSEG/ACDOCA replacement CDS view',
      'I_GLAccountLineItem': 'FAGLFLEXA/ACDOCA CDS view',
    },
  },
};

// ---------------------------------------------------------------------------
// A2R  -  Acquire to Retire
// ---------------------------------------------------------------------------

const A2R = {
  id: 'A2R',
  name: 'Acquire to Retire',
  description: 'End-to-end fixed asset lifecycle from creation through retirement',

  caseId: {
    primary: { table: 'ANLA', field: 'ANLN1' },
    correlations: [
      { table: 'ANLB', sourceField: 'ANLN1', targetField: 'ANLN1', targetTable: 'ANLA' },
      { table: 'ANLC', sourceField: 'ANLN1', targetField: 'ANLN1', targetTable: 'ANLA' },
      { table: 'ANLP', sourceField: 'ANLN1', targetField: 'ANLN1', targetTable: 'ANLA' },
      { table: 'ANEK', sourceField: 'ANLN1', targetField: 'ANLN1', targetTable: 'ANLA' },
      { table: 'BKPF', via: 'ANEK', linkField: 'BELNR', joinField: 'AWKEY' },
    ],
  },

  tables: {
    // ----- Asset Master - General -----
    ANLA: {
      type: TABLE_TYPES.RECORD,
      description: 'Asset master general data',
      fields: [
        'BUKRS', 'ANLN1', 'ANLN2', 'ANLKL', 'TXT50', 'TXA50',
        'AKTIV', 'DEESSION', 'ERDAT', 'ERNAM', 'ZUGDT', 'ABGDT',
        'KOSTL', 'PRCTR', 'WERKS', 'GSBER', 'INVNR', 'SERNR',
        'ORDNR',
      ],
      activityMapping: {
        activity: 'Create Asset Master',
        timestampField: 'ERDAT',
        resourceField: 'ERNAM',
      },
      additionalActivities: [
        { activity: 'Capitalize Asset', timestampField: 'AKTIV', condition: 'AKTIV IS NOT NULL' },
        { activity: 'Retire Asset', timestampField: 'ABGDT', condition: 'ABGDT IS NOT NULL' },
      ],
      caseIdField: 'ANLN1',
    },

    // ----- Asset Depreciation Terms -----
    ANLB: {
      type: TABLE_TYPES.DETAIL,
      description: 'Asset depreciation terms',
      fields: [
        'BUKRS', 'ANLN1', 'ANLN2', 'AFESSION', 'AFABG', 'AFASL',
        'NDJAR', 'NDPER', 'SCESSION', 'LINESSION',
      ],
      caseIdField: 'ANLN1',
    },

    // ----- Asset Value Fields -----
    ANLC: {
      type: TABLE_TYPES.DETAIL,
      description: 'Asset value fields',
      fields: [
        'BUKRS', 'ANLN1', 'ANLN2', 'GJAHR', 'AFESSION', 'KANSW',
        'ANSWL', 'NAFAG', 'NAFAP', 'NAFAV', 'KNAFA', 'KAESSION',
      ],
      caseIdField: 'ANLN1',
    },

    // ----- Asset Periodic Values -----
    ANLP: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Asset periodic values',
      fields: [
        'BUKRS', 'ANLN1', 'ANLN2', 'GJAHR', 'AFESSION', 'PEESSION',
        'NAFAG', 'NAFAP', 'SAFAG', 'AESSION',
      ],
      activityMapping: {
        activity: 'Post Depreciation',
        timestampField: null,
        derivedTimestamp: 'GJAHR + PEESSION',
      },
      caseIdField: 'ANLN1',
    },

    // ----- Asset Document Header -----
    ANEK: {
      type: TABLE_TYPES.RECORD,
      description: 'Asset document header',
      fields: [
        'BUKRS', 'ANLN1', 'ANLN2', 'GJAHR', 'LNRAN', 'BWASL',
        'BUDAT', 'BLDAT', 'CPUDT', 'CPUTM', 'USNAM', 'BELNR',
        'BZDAT', 'ANBWA',
      ],
      activityMapping: {
        activity: 'Post Asset Transaction',
        timestampField: 'CPUDT',
        timeField: 'CPUTM',
        resourceField: 'USNAM',
      },
      additionalActivities: [
        { activity: 'Acquire Asset', condition: 'ANBWA IN (100,110,150,160)', timestampField: 'BUDAT' },
        { activity: 'Transfer Asset', condition: 'ANBWA IN (300,310,320)', timestampField: 'BUDAT' },
        { activity: 'Retire Asset', condition: 'ANBWA IN (200,210,250,260)', timestampField: 'BUDAT' },
        { activity: 'Revalue Asset', condition: 'ANBWA IN (700,710)', timestampField: 'BUDAT' },
        { activity: 'Write-Up Asset', condition: 'ANBWA IN (800,810)', timestampField: 'BUDAT' },
      ],
      caseIdField: 'ANLN1',
    },

    // ----- Asset Line Items (ECC) / Universal Journal (S/4) -----
    ANEP: {
      type: TABLE_TYPES.DETAIL,
      description: 'Asset line items',
      ecc_only: true,
      fields: [
        'BUKRS', 'ANLN1', 'ANLN2', 'GJAHR', 'LNRAN', 'AFESSION',
        'BWASL', 'ANBWA', 'BZDAT', 'BELNR', 'BUZEI', 'ANBTR',
        'WAERS',
      ],
      caseIdField: 'ANLN1',
    },

    // ----- Universal Journal (S/4HANA for asset postings) -----
    ACDOCA: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Universal journal entry (asset postings)',
      fields: [
        'RCLNT', 'RLDNR', 'RBUKRS', 'GJAHR', 'BELNR', 'DOCLN',
        'RACCT', 'RCNTR', 'PRCTR', 'RHCUR', 'HSL', 'TSL',
        'DRCRK', 'BUDAT', 'TIMESTAMP', 'USNAM', 'ANLN1', 'ANLN2',
        'ANBWA', 'AFESSION',
      ],
      caseIdField: 'ANLN1',
    },

    // ----- Accounting Document Header -----
    BKPF: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Accounting document header',
      fields: [
        'BUKRS', 'BELNR', 'GJAHR', 'BLART', 'BUDAT', 'BLDAT',
        'CPUDT', 'CPUTM', 'USNAM', 'TCODE', 'WAERS', 'AWTYP',
        'AWKEY',
      ],
      caseIdField: 'BELNR',
    },

    // ----- Depreciation Area Config -----
    T093: {
      type: TABLE_TYPES.MASTER,
      description: 'Depreciation areas (real and derived)',
      fields: [
        'AFESSION', 'AFESSION_TXT', 'AFESSION_TYPE',
      ],
    },

    // ----- Change Document Header -----
    CDHDR: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document header',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'USERNAME', 'UDATE',
        'UTIME', 'TCODE',
      ],
      objectClasses: ['ANLA'],
      caseIdField: 'OBJECTID',
    },

    // ----- Change Document Items -----
    CDPOS: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document items',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'TABNAME', 'TABKEY',
        'FNAME', 'CHNGIND', 'VALUE_NEW', 'VALUE_OLD',
      ],
      caseIdField: 'OBJECTID',
    },
  },

  referenceActivities: [
    'Create Asset Master',
    'Acquire Asset',
    'Capitalize Asset',
    'Post Depreciation',
    'Transfer Asset',
    'Revalue Asset',
    'Retire Asset',
    'Scrapping',
  ],

  kpis: {
    'Acquisition Cycle Time': {
      from: 'Create Asset Master', to: 'Acquire Asset', unit: 'days', target: 10,
    },
    'Time to Capitalize': {
      from: 'Acquire Asset', to: 'Capitalize Asset', unit: 'days', target: 30,
    },
    'Depreciation Accuracy': {
      type: 'ratio', numerator: 'correct_depreciation_runs', denominator: 'total_depreciation_runs', target: 0.99,
    },
    'Asset Utilization': {
      type: 'ratio', numerator: 'active_assets', denominator: 'total_assets', target: 0.90,
    },
    'Asset Lifecycle Duration': {
      from: 'Capitalize Asset', to: 'Retire Asset', unit: 'years', target: null,
    },
    'Retirement Processing Time': {
      from: 'Retire Asset', to: 'Scrapping', unit: 'days', target: 5,
    },
  },

  tcodeMap: {
    'AS01': 'Create Asset Master',
    'AS02': 'Change Asset Master',
    'AS03': 'Display Asset Master',
    'AS05': 'Block Asset',
    'AS06': 'Mark for Deletion',
    'ABZON': 'Acquisition (Clearing)',
    'ABSO': 'Miscellaneous Acquisition',
    'AB01': 'Post Asset Acquisition',
    'ABNAN': 'Post-Capitalization',
    'ABUMN': 'Transfer Asset (Within Company)',
    'ABT1N': 'Transfer Asset (Intercompany)',
    'ABAVN': 'Retirement by Scrapping',
    'ABAON': 'Retirement with Revenue',
    'AFAB': 'Depreciation Run',
    'AFAR': 'Recalculate Depreciation',
    'ABAW': 'Balance Sheet Revaluation',
    'AB08': 'Reverse Asset Document',
    'AW01N': 'Asset Explorer',
    'AR01': 'Asset Report',
    'S_ALR_87011990': 'Asset Balances',
  },

  enrichment: {
    ANKA: { joinField: 'ANLKL', enrichFields: ['ANLKLTXT'] },
    T001: { joinField: 'BUKRS', enrichFields: ['BUTXT', 'LAND1', 'WAERS'] },
  },

  s4hana: {
    tableReplacements: {
      'ANEP': 'ACDOCA',
      'ANLP': 'ACDOCA',
    },
    cdsViews: {
      'I_FixedAsset': 'ANLA replacement CDS view',
      'I_FixedAssetDepreciationArea': 'ANLB/ANLC CDS view',
    },
  },
};

// ---------------------------------------------------------------------------
// H2R  -  Hire to Retire
// ---------------------------------------------------------------------------

const H2R = {
  id: 'H2R',
  name: 'Hire to Retire',
  description: 'End-to-end employee lifecycle from hiring through termination',

  caseId: {
    primary: { table: 'PA0000', field: 'PERNR' },
    correlations: [
      { table: 'PA0001', sourceField: 'PERNR', targetField: 'PERNR', targetTable: 'PA0000' },
      { table: 'PA0002', sourceField: 'PERNR', targetField: 'PERNR', targetTable: 'PA0000' },
      { table: 'PA0008', sourceField: 'PERNR', targetField: 'PERNR', targetTable: 'PA0000' },
      { table: 'PA0014', sourceField: 'PERNR', targetField: 'PERNR', targetTable: 'PA0000' },
      { table: 'PA0041', sourceField: 'PERNR', targetField: 'PERNR', targetTable: 'PA0000' },
      { table: 'HRP1000', via: 'PA0001', linkField: 'PLANS', joinField: 'OBJID' },
      { table: 'HRP1001', via: 'HRP1000', linkField: 'OBJID' },
    ],
  },

  tables: {
    // ----- Actions (Hire, Terminate, etc.) -----
    PA0000: {
      type: TABLE_TYPES.RECORD,
      description: 'HR actions (infotype 0000)',
      fields: [
        'PERNR', 'BEGDA', 'ENDDA', 'MASSN', 'MASSG', 'STAT2',
        'AESSION',
      ],
      activityMapping: {
        activity: null,
        timestampField: 'BEGDA',
        resourceField: null,
      },
      actionTypeMap: {
        '01': 'Hire',
        '02': 'Change',
        '03': 'Organizational Reassignment',
        '04': 'Leave of Absence',
        '05': 'Return from Leave',
        '06': 'Separation',
        '07': 'Retirement',
        '08': 'Rehire',
        '10': 'Transfer (External)',
        '12': 'Contract Change',
        'Z1': 'Promotion',
        'Z2': 'Demotion',
      },
      statusMap: {
        '0': 'Withdrawn',
        '1': 'Inactive',
        '2': 'Retired',
        '3': 'Active',
      },
      caseIdField: 'PERNR',
    },

    // ----- Organizational Assignment -----
    PA0001: {
      type: TABLE_TYPES.RECORD,
      description: 'Organizational assignment (infotype 0001)',
      fields: [
        'PERNR', 'BEGDA', 'ENDDA', 'BUKRS', 'WERKS', 'BTRTL',
        'PERSG', 'PERSK', 'ORGEH', 'STELL', 'PLANS', 'KOSTL',
        'ABKRS',
      ],
      activityMapping: {
        activity: 'Assign Position',
        timestampField: 'BEGDA',
        resourceField: null,
      },
      additionalActivities: [
        { activity: 'Transfer (Org Change)', condition: 'ORGEH changed', timestampField: 'BEGDA' },
      ],
      caseIdField: 'PERNR',
    },

    // ----- Personal Data -----
    PA0002: {
      type: TABLE_TYPES.DETAIL,
      description: 'Personal data (infotype 0002)',
      fields: [
        'PERNR', 'BEGDA', 'ENDDA', 'NACHN', 'VORNA', 'GBDAT',
        'SPRSL', 'ANRED', 'GESCH', 'NATIO',
      ],
      caseIdField: 'PERNR',
    },

    // ----- Basic Pay -----
    PA0008: {
      type: TABLE_TYPES.RECORD,
      description: 'Basic pay (infotype 0008)',
      fields: [
        'PERNR', 'BEGDA', 'ENDDA', 'TRFAR', 'TRFGB', 'TRFGR',
        'TRFST', 'ANSAL', 'WAERS', 'BESSION', 'STVOR', 'LGA01',
        'BET01',
      ],
      activityMapping: {
        activity: 'Change Pay',
        timestampField: 'BEGDA',
        resourceField: null,
      },
      caseIdField: 'PERNR',
    },

    // ----- Recurring Payments/Deductions -----
    PA0014: {
      type: TABLE_TYPES.DETAIL,
      description: 'Recurring payments/deductions (infotype 0014)',
      fields: [
        'PERNR', 'BEGDA', 'ENDDA', 'LGART', 'BETRG', 'WAERS',
        'ANZHL',
      ],
      caseIdField: 'PERNR',
    },

    // ----- Date Specifications -----
    PA0041: {
      type: TABLE_TYPES.STATUS,
      description: 'Date specifications (infotype 0041)',
      fields: [
        'PERNR', 'BEGDA', 'ENDDA', 'DAR01', 'DAT01', 'DAR02',
        'DAT02', 'DAR03', 'DAT03', 'DAR04', 'DAT04',
      ],
      dateTypeMap: {
        '01': 'Original Hire Date',
        '02': 'Company Seniority Date',
        '03': 'Last Promotion Date',
        '04': 'Last Pay Increase Date',
        '05': 'Next Probation Review',
        '06': 'End of Probation',
      },
      caseIdField: 'PERNR',
    },

    // ----- Org Management Objects -----
    HRP1000: {
      type: TABLE_TYPES.MASTER,
      description: 'Org management infotype - object',
      fields: [
        'PLVAR', 'OTYPE', 'OBJID', 'BEGDA', 'ENDDA', 'STEXT',
        'LANGU', 'MC_SHORT',
      ],
    },

    // ----- Org Management Relationships -----
    HRP1001: {
      type: TABLE_TYPES.MASTER,
      description: 'Org management infotype - relationships',
      fields: [
        'PLVAR', 'OTYPE', 'OBJID', 'RSIGN', 'RELAT', 'SCLAS',
        'SOBID', 'BEGDA', 'ENDDA',
      ],
    },

    // ----- Payroll Clusters -----
    PCL2: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Payroll cluster (results)',
      fields: [
        'PERNR', 'RELID', 'SESSION', 'SEQNR',
      ],
      activityMapping: {
        activity: 'Process Payroll',
        timestampField: null,
        resourceField: null,
        derivedTimestamp: 'Cluster period markers',
      },
      caseIdField: 'PERNR',
    },

    // ----- Change Document Header -----
    CDHDR: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document header',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'USERNAME', 'UDATE',
        'UTIME', 'TCODE',
      ],
      objectClasses: ['PREL'],
      caseIdField: 'OBJECTID',
    },

    // ----- Change Document Items -----
    CDPOS: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document items',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'TABNAME', 'TABKEY',
        'FNAME', 'CHNGIND', 'VALUE_NEW', 'VALUE_OLD',
      ],
      caseIdField: 'OBJECTID',
    },
  },

  referenceActivities: [
    'Hire',
    'Assign Position',
    'Onboard',
    'Change Pay',
    'Promote',
    'Transfer (Org Change)',
    'Process Payroll',
    'Leave of Absence',
    'Return from Leave',
    'Separation',
  ],

  kpis: {
    'Time to Hire': {
      from: null, to: 'Hire', unit: 'days', target: 30,
      description: 'Days from requisition to hire (requires PA0041 date type mapping)',
    },
    'Onboarding Duration': {
      from: 'Hire', to: 'Onboard', unit: 'days', target: 14,
    },
    'Payroll Processing Time': {
      from: 'Process Payroll', to: 'Process Payroll', unit: 'days', target: 3,
      description: 'Duration of each payroll cycle',
    },
    'Turnover Rate': {
      type: 'ratio', numerator: 'separations', denominator: 'avg_headcount', target: 0.10,
      period: 'annual',
    },
    'Promotion Rate': {
      type: 'ratio', numerator: 'promotions', denominator: 'avg_headcount', target: 0.08,
      period: 'annual',
    },
    'Time to Promote': {
      from: 'Hire', to: 'Promote', unit: 'months', target: 24,
    },
  },

  tcodeMap: {
    'PA40': 'Personnel Action',
    'PA30': 'Maintain HR Master',
    'PA20': 'Display HR Master',
    'PA10': 'Personnel File',
    'PA61': 'Maintain Time',
    'PA63': 'Maintain Time (Quota)',
    'PP01': 'Maintain Org Object',
    'PPOM_OLD': 'Maintain Org Structure',
    'PPOCE': 'Maintain Org Structure (Simple)',
    'PC00_M99_CIPE': 'Payroll Run',
    'PC00_M10_CALC': 'Payroll Calculation (US)',
    'PU03': 'Change Payroll Status',
    'PA42': 'Fast Entry (Actions)',
    'PA71': 'Fast Entry (Time)',
    'PT60': 'Time Evaluation',
    'PT61': 'Time Statement',
    'PA70': 'Fast Entry (Absences)',
    'PRMD': 'Remuneration Statement',
  },

  enrichment: {
    T500P: { joinField: 'PERSA', enrichFields: ['NAME1', 'BUKRS', 'LAND1'] },
    T001P: { joinField: 'BTRTL', enrichFields: ['BTEXT'] },
    T503: { joinField: 'PERSG+PERSK', enrichFields: ['PTEXT'] },
    HRP1000: { joinField: 'OBJID', enrichFields: ['STEXT'] },
  },

  s4hana: {
    tableReplacements: {},
    notes: 'HR in S/4HANA may be SAP SuccessFactors; PA infotypes remain for on-premise HCM.',
    cdsViews: {
      'I_HRPAAction': 'PA0000 CDS view',
      'I_HRPAOrgAssignment': 'PA0001 CDS view',
    },
  },
};

// ---------------------------------------------------------------------------
// P2M  -  Plan to Manufacture
// ---------------------------------------------------------------------------

const P2M = {
  id: 'P2M',
  name: 'Plan to Manufacture',
  description: 'End-to-end manufacturing process from production planning through goods receipt',

  caseId: {
    primary: { table: 'AUFK', field: 'AUFNR' },
    correlations: [
      { table: 'AFKO', sourceField: 'AUFNR', targetField: 'AUFNR', targetTable: 'AUFK' },
      { table: 'AFPO', sourceField: 'AUFNR', targetField: 'AUFNR', targetTable: 'AUFK' },
      { table: 'AFVC', via: 'AFKO', linkField: 'AUFPL', joinField: 'AUFPL' },
      { table: 'AFRU', via: 'AFVC', linkField: 'RUESSION', joinField: 'AUFPL+APLZL' },
      { table: 'MSEG', sourceField: 'AUFNR', targetField: 'AUFNR', targetTable: 'AUFK' },
      { table: 'JEST', sourceField: 'OBJNR', targetField: 'OBJNR', targetTable: 'AUFK' },
      { table: 'RESB', sourceField: 'AUFNR', targetField: 'AUFNR', targetTable: 'AUFK' },
    ],
  },

  tables: {
    // ----- Order Master (header) -----
    AUFK: {
      type: TABLE_TYPES.RECORD,
      description: 'Order master data',
      fields: [
        'AUFNR', 'AUART', 'AUTYP', 'BUKRS', 'WERKS', 'ERDAT',
        'ERNAM', 'AEDAT', 'AENAM', 'KTEXT', 'OBJNR', 'IDAT1',
        'IDAT2', 'IDAT3', 'LOEKZ', 'PRCTR',
      ],
      activityMapping: {
        activity: 'Create Production Order',
        timestampField: 'ERDAT',
        resourceField: 'ERNAM',
      },
      caseIdField: 'AUFNR',
    },

    // ----- Production Order Header -----
    AFKO: {
      type: TABLE_TYPES.RECORD,
      description: 'Production order header',
      fields: [
        'AUFNR', 'AUFPL', 'RSNUM', 'PLNBEZ', 'GAMNG', 'GAESSION',
        'GMEIN', 'IGMNG', 'GSTRP', 'GLTRP', 'GSTRS', 'GLTRS',
        'GSTRI', 'GLTRI', 'FHORI', 'DESSION',
      ],
      caseIdField: 'AUFNR',
    },

    // ----- Production Order Item -----
    AFPO: {
      type: TABLE_TYPES.DETAIL,
      description: 'Production order item',
      fields: [
        'AUFNR', 'POSNR', 'OBJNR', 'MATNR', 'WERKS', 'LGORT',
        'PSMNG', 'AMEIN', 'WEMNG', 'LTRMI',
      ],
      caseIdField: 'AUFNR',
    },

    // ----- Operations -----
    AFVC: {
      type: TABLE_TYPES.RECORD,
      description: 'Order operation (routing)',
      fields: [
        'AUFPL', 'APLZL', 'VORNR', 'STEUS', 'LTXA1', 'ARBID',
        'WERKS', 'ARBPL', 'KTSCH', 'SETUP', 'ESSION', 'TEARDOWN',
        'NTANF', 'NTEND', 'ISDD', 'IEDD',
      ],
      caseIdField: 'AUFPL',
    },

    // ----- Confirmations -----
    AFRU: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Order confirmation',
      fields: [
        'RUESSION', 'AUFNR', 'AUFPL', 'APLZL', 'VORNR', 'PESSION',
        'BUDAT', 'ERDAT', 'ERZET', 'ERNAM', 'LMNGA', 'XMNGA',
        'RMNGA', 'GMESSION', 'ISDD', 'ISDZ', 'IEDD', 'IEDZ',
        'ISM01', 'ISM02', 'ISM03', 'STESSION',
      ],
      activityMapping: {
        activity: 'Confirm Operation',
        timestampField: 'BUDAT',
        timeField: 'ERZET',
        resourceField: 'ERNAM',
      },
      additionalActivities: [
        { activity: 'Final Confirmation', condition: 'AUESSION = X', timestampField: 'BUDAT' },
      ],
      caseIdField: 'AUFNR',
    },

    // ----- Material Documents (GI / GR) -----
    MSEG: {
      type: TABLE_TYPES.FLOW,
      description: 'Material document segment',
      fields: [
        'MBLNR', 'MJAHR', 'ZEESSION', 'BWART', 'MATNR', 'WERKS',
        'LGORT', 'AUFNR', 'MENGE', 'MEINS', 'DMBTR', 'BUDAT_MKPF',
        'CPUDT_MKPF', 'CPUTM_MKPF', 'USNAM_MKPF',
      ],
      documentTypeMap: {
        '101': 'Goods Receipt (Production)',
        '102': 'Goods Receipt Reversal (Production)',
        '261': 'Goods Issue to Production Order',
        '262': 'Goods Issue Reversal (Production)',
        '531': 'By-Product Receipt',
      },
      caseIdField: 'AUFNR',
    },

    // ----- Material Document Header -----
    MKPF: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Material document header',
      fields: [
        'MBLNR', 'MJAHR', 'BUDAT', 'CPUDT', 'CPUTM', 'USNAM',
        'TCODE', 'XBLNR', 'BKTXT',
      ],
      caseIdField: 'MBLNR',
    },

    // ----- Object Status -----
    JEST: {
      type: TABLE_TYPES.STATUS,
      description: 'Individual object status',
      fields: [
        'OBJNR', 'STAT', 'INACT', 'CHGESSION',
      ],
      statusTransitions: {
        'I0001': 'Created',
        'I0002': 'Released',
        'I0009': 'Confirmed',
        'I0010': 'Partially Confirmed',
        'I0012': 'Technically Complete',
        'I0013': 'Locked',
        'I0028': 'Delivered',
        'I0045': 'Closed',
        'I0046': 'Deletion Flag',
        'I0076': 'Goods Receipt Completed',
      },
      caseIdField: 'OBJNR',
    },

    // ----- Reservations -----
    RESB: {
      type: TABLE_TYPES.DETAIL,
      description: 'Reservation / dependent requirement',
      fields: [
        'RSNUM', 'RSPOS', 'RSART', 'MATNR', 'WERKS', 'LGORT',
        'BDMNG', 'MEINS', 'ENMNG', 'AUFNR', 'XWAOK',
      ],
      caseIdField: 'AUFNR',
    },

    // ----- Material Master -----
    MARA: {
      type: TABLE_TYPES.MASTER,
      description: 'Material master (general)',
      fields: [
        'MATNR', 'MTART', 'MATKL', 'MEINS', 'MBRSH', 'MSTAE',
      ],
    },

    // ----- Material Plant Data -----
    MARC: {
      type: TABLE_TYPES.MASTER,
      description: 'Material master (plant level)',
      fields: [
        'MATNR', 'WERKS', 'DISMM', 'DISPO', 'DISLS', 'BESKZ',
        'SOBSL', 'LGPRO', 'LGFSB', 'PLIFZ', 'WEBAZ', 'FHORI',
      ],
    },

    // ----- Change Document Header -----
    CDHDR: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document header',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'USERNAME', 'UDATE',
        'UTIME', 'TCODE',
      ],
      objectClasses: ['AUFK'],
      caseIdField: 'OBJECTID',
    },

    // ----- Change Document Items -----
    CDPOS: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document items',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'TABNAME', 'TABKEY',
        'FNAME', 'CHNGIND', 'VALUE_NEW', 'VALUE_OLD',
      ],
      caseIdField: 'OBJECTID',
    },
  },

  referenceActivities: [
    'Create Production Order',
    'Release Production Order',
    'Issue Materials',
    'Confirm Operation',
    'Final Confirmation',
    'Goods Receipt (Production)',
    'Technically Complete',
    'Settle Order',
  ],

  kpis: {
    'Production Lead Time': {
      from: 'Release Production Order', to: 'Goods Receipt (Production)', unit: 'days', target: 5,
    },
    'Material Availability': {
      type: 'ratio', numerator: 'orders_materials_on_time', denominator: 'total_orders', target: 0.95,
    },
    'Scrap Rate': {
      type: 'ratio', numerator: 'scrapped_quantity', denominator: 'total_produced', target: 0.02,
    },
    'OEE (Overall Equipment Effectiveness)': {
      type: 'composite', components: ['availability', 'performance', 'quality'], target: 0.85,
    },
    'Order Completion Rate': {
      type: 'ratio', numerator: 'completed_orders', denominator: 'total_orders', target: 0.98,
    },
    'On-Time Production Rate': {
      type: 'ratio', numerator: 'on_time_orders', denominator: 'total_orders', target: 0.90,
    },
    'Setup Time': {
      from: 'Release Production Order', to: 'Issue Materials', unit: 'hours', target: 2,
    },
  },

  tcodeMap: {
    'CO01': 'Create Production Order',
    'CO02': 'Change Production Order',
    'CO03': 'Display Production Order',
    'CO05N': 'Release Production Order',
    'CO07': 'Create Without Material',
    'CO11N': 'Confirm Production (Single)',
    'CO15': 'Confirm Production (Final)',
    'MIGO': 'Goods Movement',
    'MB1A': 'Goods Issue',
    'MB31': 'Goods Receipt (Production)',
    'CORS': 'Reprocess Confirmation',
    'CO13': 'Cancel Confirmation',
    'CO88': 'Settle Production Order',
    'KO88': 'Settle Order',
    'COOIS': 'Production Order Info System',
    'CO24': 'Missing Parts Info',
    'MD04': 'Stock/Requirements List',
  },

  enrichment: {
    MARA: { joinField: 'MATNR', enrichFields: ['MTART', 'MATKL'] },
    MARC: { joinField: 'MATNR+WERKS', enrichFields: ['DISMM', 'DISPO'] },
    T001W: { joinField: 'WERKS', enrichFields: ['NAME1', 'LAND1'] },
    CRTX: { joinField: 'ARBPL', enrichFields: ['KTEXT'] },
  },

  s4hana: {
    tableReplacements: {},
    cdsViews: {
      'I_ProductionOrder': 'AUFK/AFKO replacement CDS view',
      'I_ProductionOrderOperation': 'AFVC replacement CDS view',
      'I_ProductionOrderConfirmation': 'AFRU CDS view',
      'I_MaterialDocumentItem': 'MSEG replacement CDS view',
    },
  },
};

// ---------------------------------------------------------------------------
// M2S  -  Maintain to Settle (Plant Maintenance)
// ---------------------------------------------------------------------------

const M2S = {
  id: 'M2S',
  name: 'Maintain to Settle',
  description: 'End-to-end maintenance process from notification through work order settlement',

  caseId: {
    primary: { table: 'QMEL', field: 'QMNUM' },
    correlations: [
      { table: 'QMFE', sourceField: 'QMNUM', targetField: 'QMNUM', targetTable: 'QMEL' },
      { table: 'QMMA', sourceField: 'QMNUM', targetField: 'QMNUM', targetTable: 'QMEL' },
      { table: 'QMSM', sourceField: 'QMNUM', targetField: 'QMNUM', targetTable: 'QMEL' },
      { table: 'AUFK', via: 'QMEL', linkField: 'AUFNR', joinField: 'AUFNR' },
      { table: 'AFIH', sourceField: 'AUFNR', targetField: 'AUFNR', targetTable: 'AUFK' },
      { table: 'AFVC', via: 'AFIH', linkField: 'AUFPL', joinField: 'AUFPL' },
      { table: 'AFRU', via: 'AFVC', linkField: 'AUFPL+APLZL' },
      { table: 'MSEG', via: 'AUFK', linkField: 'AUFNR', joinField: 'AUFNR' },
      { table: 'JEST', via: 'AUFK', linkField: 'OBJNR', joinField: 'OBJNR' },
    ],
  },

  tables: {
    // ----- Notification Header -----
    QMEL: {
      type: TABLE_TYPES.RECORD,
      description: 'Quality notification header (includes PM notifications)',
      fields: [
        'QMNUM', 'QMART', 'QMTXT', 'EQUNR', 'TPLNR', 'MAESSION',
        'SESSION', 'ERDAT', 'ERNAM', 'AEDAT', 'AENAM', 'AUFNR',
        'PRIESSION', 'STRMN', 'LTRMN', 'QMDAB',
      ],
      activityMapping: {
        activity: 'Create Notification',
        timestampField: 'ERDAT',
        resourceField: 'ERNAM',
      },
      additionalActivities: [
        { activity: 'Complete Notification', timestampField: 'QMDAB', condition: 'QMDAB IS NOT NULL' },
      ],
      caseIdField: 'QMNUM',
    },

    // ----- Notification Items (Defects) -----
    QMFE: {
      type: TABLE_TYPES.DETAIL,
      description: 'Notification items (defect data)',
      fields: [
        'QMNUM', 'FEESSION', 'FESSION', 'FETXT', 'OTGRP', 'OTEIL',
        'FECOD', 'FEESSION', 'ERDAT',
      ],
      caseIdField: 'QMNUM',
    },

    // ----- Notification Activities -----
    QMMA: {
      type: TABLE_TYPES.RECORD,
      description: 'Notification activities',
      fields: [
        'QMNUM', 'MESSION', 'MATXT', 'MNGRP', 'MNESSION', 'ERDAT',
        'ERNAM', 'LTRMN', 'MESSION',
      ],
      activityMapping: {
        activity: 'Execute Activity',
        timestampField: 'ERDAT',
        resourceField: 'ERNAM',
      },
      caseIdField: 'QMNUM',
    },

    // ----- Notification Tasks -----
    QMSM: {
      type: TABLE_TYPES.RECORD,
      description: 'Notification tasks',
      fields: [
        'QMNUM', 'MESSION', 'MATXT', 'MNGRP', 'MNESSION', 'ERDAT',
        'ERNAM', 'LTRMN', 'SMESSION',
      ],
      activityMapping: {
        activity: 'Complete Task',
        timestampField: 'ERDAT',
        resourceField: 'ERNAM',
      },
      caseIdField: 'QMNUM',
    },

    // ----- Maintenance Order Master -----
    AUFK: {
      type: TABLE_TYPES.RECORD,
      description: 'Order master data (maintenance)',
      fields: [
        'AUFNR', 'AUART', 'AUTYP', 'BUKRS', 'WERKS', 'ERDAT',
        'ERNAM', 'AEDAT', 'KTEXT', 'OBJNR', 'IDAT1', 'IDAT2',
        'IDAT3', 'LOEKZ', 'PRCTR',
      ],
      activityMapping: {
        activity: 'Create Work Order',
        timestampField: 'ERDAT',
        resourceField: 'ERNAM',
      },
      caseIdField: 'AUFNR',
    },

    // ----- Maintenance Order Header -----
    AFIH: {
      type: TABLE_TYPES.RECORD,
      description: 'Maintenance order header supplement',
      fields: [
        'AUFNR', 'AUFPL', 'EQUNR', 'TPLNR', 'ILOAN', 'QMNUM',
        'IESSION', 'PRIESSION', 'WARESSION',
      ],
      caseIdField: 'AUFNR',
    },

    // ----- Operations -----
    AFVC: {
      type: TABLE_TYPES.RECORD,
      description: 'Order operation (maintenance)',
      fields: [
        'AUFPL', 'APLZL', 'VORNR', 'STEUS', 'LTXA1', 'ARBID',
        'WERKS', 'ARBPL', 'NTANF', 'NTEND', 'ISDD', 'IEDD',
      ],
      caseIdField: 'AUFPL',
    },

    // ----- Confirmations -----
    AFRU: {
      type: TABLE_TYPES.TRANSACTION,
      description: 'Order confirmation (maintenance)',
      fields: [
        'RUESSION', 'AUFNR', 'AUFPL', 'APLZL', 'VORNR', 'PESSION',
        'BUDAT', 'ERDAT', 'ERZET', 'ERNAM', 'LMNGA', 'XMNGA',
        'RMNGA', 'GMESSION', 'ISDD', 'ISDZ', 'IEDD', 'IEDZ',
        'ISM01', 'ISM02', 'ISM03', 'STESSION', 'AUESSION',
      ],
      activityMapping: {
        activity: 'Confirm Work',
        timestampField: 'BUDAT',
        timeField: 'ERZET',
        resourceField: 'ERNAM',
      },
      caseIdField: 'AUFNR',
    },

    // ----- Material Documents (spare parts) -----
    MSEG: {
      type: TABLE_TYPES.FLOW,
      description: 'Material document segment',
      fields: [
        'MBLNR', 'MJAHR', 'ZEESSION', 'BWART', 'MATNR', 'WERKS',
        'LGORT', 'AUFNR', 'MENGE', 'MEINS', 'DMBTR', 'BUDAT_MKPF',
        'CPUDT_MKPF', 'CPUTM_MKPF', 'USNAM_MKPF',
      ],
      documentTypeMap: {
        '261': 'Issue Materials (Maintenance)',
        '262': 'Goods Issue Reversal (Maintenance)',
        '201': 'Goods Issue to Cost Center',
      },
      caseIdField: 'AUFNR',
    },

    // ----- Object Status -----
    JEST: {
      type: TABLE_TYPES.STATUS,
      description: 'Individual object status',
      fields: [
        'OBJNR', 'STAT', 'INACT', 'CHGESSION',
      ],
      statusTransitions: {
        'I0001': 'Created',
        'I0002': 'Released',
        'I0009': 'Confirmed',
        'I0010': 'Partially Confirmed',
        'I0012': 'Technically Complete',
        'I0045': 'Closed',
        'I0046': 'Deletion Flag',
        'E0001': 'Outstanding (Notification)',
        'E0002': 'In Process (Notification)',
        'E0003': 'Completed (Notification)',
      },
      caseIdField: 'OBJNR',
    },

    // ----- Equipment Master -----
    EQUI: {
      type: TABLE_TYPES.MASTER,
      description: 'Equipment master',
      fields: [
        'EQUNR', 'EQTYP', 'EQART', 'SWERK', 'STORT', 'TPLNR',
        'INBDT', 'ERDAT', 'HERST', 'TYPBZ', 'SERGE',
      ],
    },

    // ----- Functional Location -----
    TPLNR: {
      type: TABLE_TYPES.MASTER,
      description: 'Functional location (via IFLOT)',
      fields: [
        'TPLNR', 'FLTYP', 'SWERK', 'STORT', 'IWERK',
      ],
    },

    // ----- PM Object-Location Assignment -----
    ILOA: {
      type: TABLE_TYPES.MASTER,
      description: 'PM object location / account assignment',
      fields: [
        'ILESSION', 'BUKRS', 'SWERK', 'TPLNR', 'EQUNR', 'KOSTL',
        'AUFNR',
      ],
    },

    // ----- Change Document Header -----
    CDHDR: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document header',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'USERNAME', 'UDATE',
        'UTIME', 'TCODE',
      ],
      objectClasses: ['QMIH', 'AUFK'],
      caseIdField: 'OBJECTID',
    },

    // ----- Change Document Items -----
    CDPOS: {
      type: TABLE_TYPES.CHANGE,
      description: 'Change document items',
      fields: [
        'OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'TABNAME', 'TABKEY',
        'FNAME', 'CHNGIND', 'VALUE_NEW', 'VALUE_OLD',
      ],
      caseIdField: 'OBJECTID',
    },
  },

  referenceActivities: [
    'Create Notification',
    'Approve Notification',
    'Create Work Order',
    'Release Work Order',
    'Issue Materials (Maintenance)',
    'Confirm Work',
    'Technically Complete',
    'Complete Notification',
    'Settle Order',
  ],

  kpis: {
    'Mean Time to Repair': {
      from: 'Create Notification', to: 'Technically Complete', unit: 'hours', target: 8,
    },
    'Work Order Cycle Time': {
      from: 'Create Work Order', to: 'Technically Complete', unit: 'days', target: 5,
    },
    'Backlog Aging': {
      from: 'Create Work Order', to: 'Release Work Order', unit: 'days', target: 3,
    },
    'Maintenance Cost per Asset': {
      type: 'ratio', numerator: 'total_maintenance_cost', denominator: 'total_assets', target: null,
    },
    'Planned vs Unplanned Ratio': {
      type: 'ratio', numerator: 'planned_orders', denominator: 'total_orders', target: 0.80,
    },
    'First-Time Fix Rate': {
      type: 'ratio', numerator: 'single_visit_fixes', denominator: 'total_fixes', target: 0.85,
    },
    'Notification to Work Order Time': {
      from: 'Create Notification', to: 'Create Work Order', unit: 'hours', target: 24,
    },
  },

  tcodeMap: {
    'IW21': 'Create Notification',
    'IW22': 'Change Notification',
    'IW23': 'Display Notification',
    'IW24': 'Create Notification (Malfunction)',
    'IW31': 'Create Work Order',
    'IW32': 'Change Work Order',
    'IW33': 'Display Work Order',
    'IW38': 'Work Order List',
    'IW41': 'Confirm Work (Overall)',
    'IW42': 'Confirm Work (Individual)',
    'IW44': 'Confirm Work (Collective)',
    'MIGO': 'Goods Movement (Spare Parts)',
    'MB1A': 'Goods Issue (Spare Parts)',
    'KO88': 'Settle Order',
    'IW28': 'Work Order Change (List)',
    'IW29': 'Notification List',
    'IW64': 'Change Task List',
    'IW65': 'Display Task List',
    'IW39': 'Work Order by Status',
  },

  enrichment: {
    EQUI: { joinField: 'EQUNR', enrichFields: ['EQTYP', 'EQART', 'HERST', 'TYPBZ'] },
    EQKT: { joinField: 'EQUNR', enrichFields: ['EQKTX'] },
    IFLOT: { joinField: 'TPLNR', enrichFields: ['FLTYP', 'SWERK'] },
    T001W: { joinField: 'WERKS', enrichFields: ['NAME1', 'LAND1'] },
    T024I: { joinField: 'INGRP', enrichFields: ['INNAM'] },
  },

  s4hana: {
    tableReplacements: {},
    cdsViews: {
      'I_MaintenanceNotification': 'QMEL replacement CDS view',
      'I_MaintenanceOrder': 'AUFK/AFIH replacement CDS view',
      'I_MaintenanceOrderOperation': 'AFVC replacement CDS view',
      'I_MaintOrderConfirmation': 'AFRU CDS view',
    },
  },
};

// ---------------------------------------------------------------------------
// Aggregate config map
// ---------------------------------------------------------------------------

const PROCESS_CONFIGS = {
  O2C,
  P2P,
  R2R,
  A2R,
  H2R,
  P2M,
  M2S,
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Return the full configuration object for a given process type.
 * @param {string} processId - e.g. 'O2C', 'P2P', etc.
 * @returns {object|null}
 */
function getProcessConfig(processId) {
  return PROCESS_CONFIGS[processId] || null;
}

/**
 * Return all supported process IDs.
 * @returns {string[]}
 */
function getAllProcessIds() {
  return Object.keys(PROCESS_CONFIGS);
}

/**
 * Return a flat array of SAP table names used by a given process.
 * @param {string} processId
 * @returns {string[]}
 */
function getTablesForProcess(processId) {
  const config = PROCESS_CONFIGS[processId];
  if (!config || !config.tables) return [];
  return Object.keys(config.tables);
}

/**
 * Determine whether the connected SAP system is S/4HANA.
 *
 * Heuristic:
 *   1. systemInfo.component contains 'S4' or 'SAP S/4'
 *   2. ACDOCA table exists (universal journal)
 *   3. VBUK table does NOT exist (removed in S/4)
 *   4. Release >= 1709
 *
 * @param {object} systemInfo - output from system-info extractor
 * @returns {boolean}
 */
function isS4Hana(systemInfo) {
  if (!systemInfo) return false;

  const component = (systemInfo.component || systemInfo.COMPONENT || '').toUpperCase();
  if (component.includes('S4') || component.includes('S/4')) return true;

  const release = systemInfo.release || systemInfo.RELEASE || '';
  const releaseNum = parseInt(release, 10);
  if (releaseNum >= 1709) return true;

  if (systemInfo.sapProduct && /S\/4/i.test(systemInfo.sapProduct)) return true;

  if (Array.isArray(systemInfo.installedComponents)) {
    const hasS4 = systemInfo.installedComponents.some(
      c => /S4CORE|SAP_S4/i.test(c.COMPONENT || c.component || '')
    );
    if (hasS4) return true;
  }

  if (systemInfo.tableExists) {
    if (systemInfo.tableExists.ACDOCA && !systemInfo.tableExists.VBUK) return true;
  }

  return false;
}

/**
 * Return a copy of the process config adapted for S/4HANA by applying
 * table replacements and removing ECC-only tables.
 *
 * @param {object} config - original process config (e.g. PROCESS_CONFIGS.O2C)
 * @returns {object} deep-ish copy with S/4 adjustments
 */
function adaptConfigForS4(config) {
  if (!config) return config;

  const adapted = JSON.parse(JSON.stringify(config));

  // Remove ECC-only tables
  for (const [tableName, tableDef] of Object.entries(adapted.tables)) {
    if (tableDef.ecc_only) {
      delete adapted.tables[tableName];
    }
  }

  // Apply table replacements defined in s4hana block
  if (adapted.s4hana && adapted.s4hana.tableReplacements) {
    for (const [oldTable, newTable] of Object.entries(adapted.s4hana.tableReplacements)) {
      if (newTable === null) {
        // Table eliminated in S/4
        delete adapted.tables[oldTable];
      } else if (adapted.tables[oldTable] && !adapted.tables[newTable]) {
        // Rename table entry
        adapted.tables[newTable] = { ...adapted.tables[oldTable] };
        adapted.tables[newTable].description += ` (S/4: replaces ${oldTable})`;
        delete adapted.tables[oldTable];
      }
    }
  }

  // Apply field migrations for S/4 status fields on record tables
  if (adapted.s4hana && adapted.s4hana.fieldMigrations) {
    for (const [source, target] of Object.entries(adapted.s4hana.fieldMigrations)) {
      const [sourceTable, sourceField] = source.split('.');
      const [targetTable, targetField] = target.split('.');
      if (adapted.tables[targetTable] && sourceField && targetField) {
        if (!adapted.tables[targetTable].fields.includes(targetField)) {
          adapted.tables[targetTable].fields.push(targetField);
        }
      }
    }
  }

  adapted._s4adapted = true;
  return adapted;
}

/**
 * Resolve an SAP transaction code to an activity name within a given process.
 *
 * Searches the process-specific tcodeMap first; falls back to scanning all
 * processes when processId is omitted.
 *
 * @param {string} tcode - SAP transaction code (e.g. 'VA01')
 * @param {string} [processId] - optional process to scope the lookup
 * @returns {string|null} activity name, or null if not mapped
 */
function getActivityFromTcode(tcode, processId) {
  if (!tcode) return null;

  const normalizedTcode = tcode.trim().toUpperCase();

  if (processId) {
    const config = PROCESS_CONFIGS[processId];
    if (config && config.tcodeMap && config.tcodeMap[normalizedTcode]) {
      return config.tcodeMap[normalizedTcode];
    }
    return null;
  }

  // Scan all processes
  for (const config of Object.values(PROCESS_CONFIGS)) {
    if (config.tcodeMap && config.tcodeMap[normalizedTcode]) {
      return config.tcodeMap[normalizedTcode];
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  TABLE_TYPES,
  PROCESS_CONFIGS,
  getProcessConfig,
  getAllProcessIds,
  getTablesForProcess,
  isS4Hana,
  adaptConfigForS4,
  getActivityFromTcode,
};
