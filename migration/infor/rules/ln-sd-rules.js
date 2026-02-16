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
 * Infor LN Sales & Distribution Transformation Rules
 *
 * Maps LN sales fields to SAP SD equivalents:
 * - Sales order type mapping
 * - Customer number formatting
 * - Pricing condition type mapping
 * - Delivery type mapping
 */

module.exports = {
  ruleSetId: 'LN_SD_RULES',
  name: 'Infor LN Sales & Distribution Transformation Rules',
  rules: [
    // ── Sales Order Type ─────────────────────────────────────────
    {
      source: 't$sotp',
      target: 'AUART',
      valueMap: {
        'STD': 'TA',     // Standard order -> SAP Standard Order
        'RSH': 'RE',     // Rush order -> SAP Returns
        'RTN': 'RE',     // Return order -> SAP Returns
        'CRD': 'CR',     // Credit memo -> SAP Credit Memo
        'DBT': 'DR',     // Debit memo -> SAP Debit Memo
        'FRE': 'FD',     // Free of charge -> SAP Free-of-Charge
        'SCH': 'DS',     // Scheduling agreement -> SAP Sched. Agmt
        'CNT': 'CQ',     // Contract -> SAP Quantity Contract
        'QUO': 'QT',     // Quotation -> SAP Quotation
        'ICO': 'TA',     // Intercompany -> SAP Standard Order
      },
      default: 'TA',
      description: 'LN sales order type to SAP sales document type',
    },
    // ── Customer Number ──────────────────────────────────────────
    {
      source: 't$bpid',
      target: 'KUNNR',
      transform: (v) => {
        if (!v) return '';
        // Strip BP prefix, pad to 10 digits
        const num = String(v).replace(/^BP/i, '');
        return num.padStart(10, '0');
      },
      description: 'LN business partner ID to SAP customer number (10-digit)',
    },
    // ── Sales Organization ───────────────────────────────────────
    {
      source: 't$slof',
      target: 'VKORG',
      transform: (v) => {
        if (!v) return '';
        // Extract numeric portion of sales office code
        const num = String(v).replace(/[^0-9]/g, '');
        return num.padStart(4, '0');
      },
      description: 'LN sales office to SAP sales organization',
    },
    // ── Distribution Channel ─────────────────────────────────────
    {
      source: 't$dsch',
      target: 'VTWEG',
      valueMap: {
        'DIR': '10',     // Direct sales
        'WHL': '20',     // Wholesale
        'RTL': '30',     // Retail
        'ONL': '40',     // Online
        'INT': '50',     // Internal / Intercompany
      },
      default: '10',
      description: 'LN distribution channel to SAP distribution channel',
    },
    // ── Pricing Condition Type ───────────────────────────────────
    {
      source: 't$prlt',
      target: 'KSCHL',
      valueMap: {
        'P01': 'PR00',   // Base price
        'P02': 'PR01',   // Price list
        'P03': 'PR02',   // Customer-specific price
        'D01': 'K004',   // Material discount
        'D02': 'K005',   // Customer discount
        'D03': 'K007',   // Volume discount
        'S01': 'KF00',   // Surcharge
        'S02': 'KF01',   // Freight surcharge
        'F01': 'KF00',   // Freight
      },
      default: 'PR00',
      description: 'LN price list type to SAP pricing condition type',
    },
    // ── Payment Terms ────────────────────────────────────────────
    {
      source: 't$ptcd',
      target: 'ZTERM',
      valueMap: {
        'NET30': 'ZN30',   // Net 30 days
        'NET45': 'ZN45',   // Net 45 days
        'NET60': 'ZN60',   // Net 60 days
        'NET90': 'ZN90',   // Net 90 days
        'COD': 'ZC00',     // Cash on delivery
        'CIA': 'ZC00',     // Cash in advance
        '2/10N30': 'ZD10', // 2% 10, net 30
      },
      default: 'ZN30',
      description: 'LN payment terms to SAP payment terms',
    },
    // ── Delivery Type ────────────────────────────────────────────
    {
      source: 't$dltp',
      target: 'LFART',
      valueMap: {
        'STD': 'LF',     // Standard delivery
        'RSH': 'EL',     // Rush delivery -> Express
        'RTN': 'LR',     // Return delivery
        'DRP': 'NL',     // Drop ship
        'ICO': 'NL',     // Intercompany -> replenishment
      },
      default: 'LF',
      description: 'LN delivery type to SAP delivery type',
    },
    // ── Shipping Condition ───────────────────────────────────────
    {
      source: 't$shmd',
      target: 'VSBED',
      valueMap: {
        'STD': '01',     // Standard shipping
        'EXP': '02',     // Express shipping
        'FRT': '03',     // Freight
        'AIR': '04',     // Air freight
        'SEA': '05',     // Sea freight
        'PKP': '06',     // Customer pickup
      },
      default: '01',
      description: 'LN shipping method to SAP shipping condition',
    },
    // ── Order Date ───────────────────────────────────────────────
    {
      source: 't$odat',
      target: 'AUDAT',
      convert: 'toDate',
      description: 'Order date',
    },
    // ── Requested Delivery Date ──────────────────────────────────
    {
      source: 't$ddat',
      target: 'VDATU',
      convert: 'toDate',
      description: 'Requested delivery date',
    },
    // ── Currency ─────────────────────────────────────────────────
    {
      source: 't$ccur',
      target: 'WAERK',
      convert: 'toUpperCase',
      description: 'Order currency',
    },
    // ── Credit Limit ─────────────────────────────────────────────
    {
      source: 't$crli',
      target: 'KLIMK',
      convert: 'toDecimal',
      description: 'Customer credit limit',
    },
    // ── Reference ────────────────────────────────────────────────
    {
      source: 't$ession',
      target: 'BSTNK',
      convert: 'trim',
      description: 'LN sales order number to SAP PO number (customer reference)',
    },
    // ── Metadata ─────────────────────────────────────────────────
    {
      target: 'SourceSystem',
      default: 'INFOR_LN',
      description: 'Source system identifier',
    },
  ],
};
