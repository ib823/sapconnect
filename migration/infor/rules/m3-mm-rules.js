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
 * Infor M3 Materials Management Transformation Rules
 *
 * Maps M3 item/material fields to SAP MM equivalents:
 * - Item type (ITTY) to material type (MTART)
 * - Unit of measure conversion (M3 uses UNMS field)
 * - Item group (ITGR) to material group (MATKL)
 * - M3 warehouse/location to SAP plant/storage location
 * - Buyer/responsible to purchasing group
 */

module.exports = {
  ruleSetId: 'M3_MM_RULES',
  name: 'Infor M3 Materials Management Transformation Rules',
  rules: [
    // ── Item/Material Number ─────────────────────────────────────
    {
      source: 'ITNO',
      target: 'MATNR',
      convert: 'toUpperCase',
      description: 'M3 item number to SAP material number',
    },
    {
      source: 'ITDS',
      target: 'MAKTX',
      convert: 'trim',
      description: 'M3 item description to SAP material description',
    },
    // ── Item Type → Material Type ────────────────────────────────
    {
      source: 'ITTY',
      target: 'MTART',
      valueMap: {
        'PUR': 'ROH',    // Purchased -> Raw Material
        'MFG': 'HALB',   // Manufactured -> Semi-Finished
        'FIN': 'FERT',   // Finished -> Finished Product
        'TRD': 'HAWA',   // Trading -> Trading Goods
        'SVC': 'DIEN',   // Service -> Service
        'NST': 'NLAG',   // Non-stock -> Non-Stock Material
        'PKG': 'VERP',   // Packaging -> Packaging
        'MRO': 'HIBE',   // MRO -> Operating Supplies
      },
      default: 'HAWA',
      description: 'M3 item type to SAP material type',
    },
    // ── Procurement Type ─────────────────────────────────────────
    {
      source: 'ITTY',
      target: 'BESKZ',
      valueMap: {
        'PUR': 'F',    // Purchased -> External
        'MFG': 'E',    // Manufactured -> In-house
        'FIN': 'E',    // Finished -> In-house
        'TRD': 'F',    // Trading -> External
        'SVC': 'F',    // Service -> External
        'NST': 'X',    // Non-stock -> Both
        'PKG': 'F',    // Packaging -> External
        'MRO': 'F',    // MRO -> External
      },
      default: 'F',
      description: 'M3 item type to SAP procurement type',
    },
    // ── Unit of Measure ──────────────────────────────────────────
    {
      source: 'UNMS',
      target: 'MEINS',
      valueMap: {
        'EA': 'EA', 'PC': 'ST', 'PCS': 'ST',
        'KG': 'KG', 'GRM': 'G', 'TON': 'TO',
        'LTR': 'L', 'MLT': 'ML', 'GAL': 'GAL',
        'MTR': 'M', 'CMT': 'CM', 'MMT': 'MM', 'FT': 'FT', 'IN': 'IN',
        'LB': 'LB', 'OZ': 'OZ',
        'BOX': 'BOX', 'PAL': 'PAL', 'SET': 'SET',
        'HRS': 'UR', 'MIN': 'MIN',
        'SHT': 'ST',
      },
      default: 'EA',
      description: 'M3 unit of measure to SAP base unit',
    },
    // ── Item Group → Material Group ──────────────────────────────
    {
      source: 'ITGR',
      target: 'MATKL',
      convert: 'toUpperCase',
      description: 'M3 item group to SAP material group',
    },
    // ── Product Group → Division ─────────────────────────────────
    {
      source: 'PDLN',
      target: 'SPART',
      transform: (v) => {
        if (!v) return '00';
        return String(v).padStart(2, '0');
      },
      description: 'M3 product line to SAP division',
    },
    // ── Weight ───────────────────────────────────────────────────
    {
      source: 'GRWE',
      target: 'BRGEW',
      convert: 'toDecimal',
      description: 'Gross weight',
    },
    {
      source: 'NEWE',
      target: 'NTGEW',
      convert: 'toDecimal',
      description: 'Net weight',
    },
    {
      target: 'GEWEI',
      default: 'KG',
      description: 'Weight unit (default KG)',
    },
    // ── Standard Price ───────────────────────────────────────────
    {
      source: 'STDC',
      target: 'STPRS',
      convert: 'toDecimal',
      description: 'M3 standard cost to SAP standard price',
    },
    // ── Warehouse → Plant ────────────────────────────────────────
    {
      source: 'WHLO',
      target: 'WERKS',
      transform: (v) => {
        if (!v) return '';
        return String(v).substring(0, 4).toUpperCase();
      },
      description: 'M3 warehouse to SAP plant',
    },
    {
      source: 'WHSL',
      target: 'LGORT',
      transform: (v) => {
        if (!v) return '0001';
        return String(v).substring(0, 4);
      },
      description: 'M3 warehouse location to SAP storage location',
    },
    // ── Buyer → Purchasing Group ─────────────────────────────────
    {
      source: 'BUYE',
      target: 'EKGRP',
      transform: (v) => {
        if (!v) return '001';
        return String(v).substring(0, 3);
      },
      description: 'M3 buyer to SAP purchasing group',
    },
    // ── Planning Method ──────────────────────────────────────────
    {
      source: 'PLCD',
      target: 'DISMM',
      valueMap: {
        '001': 'PD',   // MRP-planned
        '002': 'VB',   // Reorder point
        '003': 'VM',   // Manual reorder
        '004': 'ND',   // No planning
        '005': 'VV',   // Forecast-based
      },
      default: 'ND',
      description: 'M3 planning code to SAP MRP type',
    },
    // ── Safety Stock ─────────────────────────────────────────────
    {
      source: 'SSQT',
      target: 'EISBE',
      convert: 'toDecimal',
      description: 'Safety stock',
    },
    {
      source: 'REOP',
      target: 'MINBE',
      convert: 'toDecimal',
      description: 'Reorder point',
    },
    // ── Lead Time ────────────────────────────────────────────────
    {
      source: 'LEA1',
      target: 'PLIFZ',
      convert: 'toInteger',
      description: 'Supplier lead time in days',
    },
    // ── Country of Origin ────────────────────────────────────────
    {
      source: 'ORCO',
      target: 'HERKL',
      convert: 'toUpperCase',
      description: 'Country of origin',
    },
    // ── ABC Classification ───────────────────────────────────────
    {
      source: 'ABCD',
      target: 'MAABC',
      valueMap: {
        'A': 'A',
        'B': 'B',
        'C': 'C',
      },
      default: 'C',
      description: 'ABC indicator for material',
    },
    // ── Metadata ─────────────────────────────────────────────────
    {
      target: 'SourceSystem',
      default: 'INFOR_M3',
      description: 'Source system identifier',
    },
  ],
};
