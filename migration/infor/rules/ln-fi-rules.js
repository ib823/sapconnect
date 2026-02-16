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
 * Infor LN Financial Transformation Rules
 *
 * Maps LN financial fields to SAP FI equivalents:
 * - GL account number formatting
 * - Currency code normalization
 * - Fiscal period mapping
 * - Document type mapping
 * - Tax code mapping
 */

module.exports = {
  ruleSetId: 'LN_FI_RULES',
  name: 'Infor LN Financial Transformation Rules',
  rules: [
    // ── GL Account Number ────────────────────────────────────────
    {
      source: 't$leac',
      target: 'SAKNR',
      transform: (v) => {
        if (!v) return '';
        // Strip leading zeros, then re-pad to 10 digits (SAP GL format)
        const stripped = String(v).replace(/^0+/, '') || '0';
        return stripped.padStart(10, '0');
      },
      description: 'LN ledger account to SAP GL account (strip and repad to 10)',
    },
    {
      source: 't$desc',
      target: 'TXT50',
      convert: 'trim',
      description: 'GL account description',
    },
    // ── Currency ─────────────────────────────────────────────────
    {
      source: 't$ccur',
      target: 'WAERS',
      convert: 'toUpperCase',
      description: 'Currency code normalization (ISO 4217)',
    },
    {
      source: 't$rptc',
      target: 'KWAER',
      convert: 'toUpperCase',
      description: 'Reporting currency normalization',
    },
    // ── Fiscal Period ────────────────────────────────────────────
    {
      source: 't$perd',
      target: 'MONAT',
      transform: (v) => {
        if (!v) return '00';
        const p = parseInt(v, 10);
        if (isNaN(p) || p < 1) return '00';
        if (p > 12) return String(p).padStart(3, '0'); // special periods 13-16
        return String(p).padStart(2, '0');
      },
      description: 'LN fiscal period to SAP posting period (zero-padded)',
    },
    {
      source: 't$year',
      target: 'GJAHR',
      convert: 'toInteger',
      description: 'Fiscal year',
    },
    // ── Document Type ────────────────────────────────────────────
    {
      source: 't$dctp',
      target: 'BLART',
      valueMap: {
        'NOR': 'SA',   // Normal journal -> SA (GL Account Document)
        'REV': 'AB',   // Reversal -> AB (Clearing)
        'PRV': 'SA',   // Provisional -> SA
        'RCR': 'AB',   // Recurring -> AB
        'STA': 'SA',   // Statistical -> SA
        'ADJ': 'SA',   // Adjustment -> SA
        'ALO': 'ML',   // Allocation -> ML (Material Ledger)
        'CLO': 'SA',   // Closing -> SA
        'OPN': 'SA',   // Opening -> SA
        'CUR': 'SA',   // Currency reval -> SA
      },
      default: 'SA',
      description: 'LN document type to SAP document type',
    },
    // ── Debit/Credit Indicator ───────────────────────────────────
    {
      source: 't$dbcr',
      target: 'SHKZG',
      valueMap: {
        'D': 'S',   // Debit -> Soll (German for debit)
        'C': 'H',   // Credit -> Haben (German for credit)
        '1': 'S',
        '2': 'H',
      },
      default: 'S',
      description: 'LN debit/credit indicator to SAP posting key indicator',
    },
    // ── Tax Code ─────────────────────────────────────────────────
    {
      source: 't$txcd',
      target: 'MWSKZ',
      valueMap: {
        'V0': 'V0',    // Tax exempt
        'V1': 'A1',    // Standard sales tax -> SAP output tax
        'V2': 'A2',    // Reduced sales tax -> SAP reduced output tax
        'P0': 'V0',    // Purchase tax exempt
        'P1': 'V1',    // Standard purchase tax -> SAP input tax
        'EU1': 'A1',   // EU standard VAT -> output tax full
        'EU2': 'A2',   // EU reduced VAT -> output tax reduced
        'SG1': 'A1',   // Singapore GST -> output tax
      },
      default: 'V0',
      description: 'LN tax code to SAP tax code',
    },
    // ── Document Status ──────────────────────────────────────────
    {
      source: 't$stat',
      target: 'BSTAT',
      valueMap: {
        'FNL': '',     // Final (posted) -> normal
        'PRV': 'V',    // Provisional -> parked
        'NEW': 'V',    // New -> parked
        'APP': '',     // Approved -> normal
        'PAD': '',     // Paid -> normal
        'OPN': '',     // Open -> normal
        'REJ': 'S',    // Rejected -> marked for reversal
      },
      default: '',
      description: 'LN document status to SAP document status',
    },
    // ── Journal Group ────────────────────────────────────────────
    {
      source: 't$jgrp',
      target: 'BKTXT',
      valueMap: {
        'AP': 'Accounts Payable',
        'AR': 'Accounts Receivable',
        'GL': 'General Ledger',
        'FA': 'Fixed Assets',
        'BK': 'Bank Accounting',
        'CM': 'Cash Management',
      },
      default: 'General Ledger',
      description: 'LN journal group to SAP document header text',
    },
    // ── Amount ───────────────────────────────────────────────────
    {
      source: 't$amnt',
      target: 'WRBTR',
      convert: 'toDecimal',
      description: 'Transaction amount',
    },
    {
      source: 't$amtl',
      target: 'DMBTR',
      convert: 'toDecimal',
      description: 'Local currency amount',
    },
    // ── Posting Date ─────────────────────────────────────────────
    {
      source: 't$dcdt',
      target: 'BUDAT',
      convert: 'toDate',
      description: 'Document/posting date',
    },
    {
      source: 't$idat',
      target: 'BLDAT',
      convert: 'toDate',
      description: 'Invoice/document date',
    },
    // ── Company Code ─────────────────────────────────────────────
    {
      source: 't$cpnb',
      target: 'BUKRS',
      transform: (v) => {
        if (!v) return '';
        return String(v).padStart(4, '0');
      },
      description: 'LN financial company to SAP company code (4-digit padded)',
    },
    // ── Ledger Dimension ─────────────────────────────────────────
    {
      source: 't$dim1',
      target: 'KOSTL',
      convert: 'trim',
      description: 'LN dimension 1 mapped to SAP cost center',
    },
    {
      source: 't$dim2',
      target: 'PRCTR',
      convert: 'trim',
      description: 'LN dimension 2 mapped to SAP profit center',
    },
    // ── Reference ────────────────────────────────────────────────
    {
      source: 't$dcnm',
      target: 'XBLNR',
      convert: 'trim',
      description: 'LN document number to SAP reference document number',
    },
    // ── Metadata ─────────────────────────────────────────────────
    {
      target: 'SourceSystem',
      default: 'INFOR_LN',
      description: 'Source system identifier',
    },
  ],
};
