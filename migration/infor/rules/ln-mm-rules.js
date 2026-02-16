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
 * Infor LN Materials Management Transformation Rules
 *
 * Maps LN item/material fields to SAP MM equivalents:
 * - Item type (kitm) to material type (MTART)
 * - Unit of measure conversion
 * - Item group to material group
 * - Warehouse to storage location
 * - Purchasing group mapping
 */

module.exports = {
  ruleSetId: 'LN_MM_RULES',
  name: 'Infor LN Materials Management Transformation Rules',
  rules: [
    // ── Item/Material Number ─────────────────────────────────────
    {
      source: 'item',
      target: 'MATNR',
      convert: 'toUpperCase',
      description: 'LN item code to SAP material number',
    },
    {
      source: 'dsca',
      target: 'MAKTX',
      convert: 'trim',
      description: 'Item description to material description',
    },
    // ── Item Type → Material Type ────────────────────────────────
    {
      source: 'kitm',
      target: 'MTART',
      valueMap: {
        '1': 'ROH',    // Purchased item -> Raw Material
        '2': 'HALB',   // Manufactured item -> Semi-Finished
        '3': 'FERT',   // Generic item -> Finished Product
        '4': 'HAWA',   // Trading good
        '5': 'DIEN',   // Service item -> Service
        '6': 'NLAG',   // Non-stocked -> Non-Stock Material
      },
      default: 'HAWA',
      description: 'LN item type (kitm) to SAP material type (MTART)',
    },
    // ── Procurement Type ─────────────────────────────────────────
    {
      source: 'kitm',
      target: 'BESKZ',
      valueMap: {
        '1': 'F',    // Purchased -> External procurement
        '2': 'E',    // Manufactured -> In-house production
        '3': 'F',    // Generic -> External
        '4': 'F',    // Trading -> External
        '5': 'F',    // Service -> External
        '6': 'X',    // Non-stocked -> Both
      },
      default: 'F',
      description: 'LN item type to SAP procurement type',
    },
    // ── Unit of Measure ──────────────────────────────────────────
    {
      source: 'cuni',
      target: 'MEINS',
      valueMap: {
        'ea': 'EA', 'EA': 'EA', 'pcs': 'ST', 'PCS': 'ST', 'pc': 'ST',
        'kg': 'KG', 'KG': 'KG', 'g': 'G', 'G': 'G',
        'l': 'L', 'L': 'L', 'ml': 'ML', 'ML': 'ML',
        'm': 'M', 'M': 'M', 'cm': 'CM', 'CM': 'CM', 'mm': 'MM', 'MM': 'MM',
        'ft': 'FT', 'FT': 'FT', 'in': 'IN', 'IN': 'IN',
        'lb': 'LB', 'LB': 'LB', 'oz': 'OZ',
        'gal': 'GAL', 'GAL': 'GAL',
        'box': 'BOX', 'BOX': 'BOX', 'set': 'SET', 'SET': 'SET',
        'pal': 'PAL', 'PAL': 'PAL',
        'hr': 'UR', 'HR': 'UR', 'min': 'MIN',
        'SH': 'ST',
      },
      default: 'EA',
      description: 'LN unit of measure to SAP base unit of measure',
    },
    // ── Item Group → Material Group ──────────────────────────────
    {
      source: 'csig',
      target: 'MATKL',
      convert: 'toUpperCase',
      description: 'LN item signal code (group) to SAP material group',
    },
    // ── Item Sub-Group → External Material Group ─────────────────
    {
      source: 'citg',
      target: 'EXTWG',
      convert: 'toUpperCase',
      description: 'LN item type group to SAP external material group',
    },
    // ── Weight ───────────────────────────────────────────────────
    {
      source: 'wght',
      target: 'BRGEW',
      convert: 'toDecimal',
      description: 'Gross weight',
    },
    {
      source: 'ntwt',
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
      source: 'stwi',
      target: 'STPRS',
      convert: 'toDecimal',
      description: 'LN standard cost to SAP standard price',
    },
    // ── Warehouse → Plant / Storage Location ─────────────────────
    {
      source: 'cwar',
      target: 'WERKS',
      transform: (v) => {
        if (!v) return '';
        // LN warehouse codes may contain alpha; SAP plant is 4 chars
        return String(v).substring(0, 4).toUpperCase();
      },
      description: 'LN warehouse to SAP plant (4-char truncation)',
    },
    {
      source: 'lwar',
      target: 'LGORT',
      transform: (v) => {
        if (!v) return '0001';
        return String(v).substring(0, 4);
      },
      description: 'LN location within warehouse to SAP storage location',
    },
    // ── Purchasing Group ─────────────────────────────────────────
    {
      source: 't$pgrp',
      target: 'EKGRP',
      valueMap: {
        'PG01': '001', 'PG02': '002', 'PG03': '003',
        'PG04': '004', 'PG05': '005',
        'RAW': '001', 'MRO': '002', 'SVC': '003',
        'CAP': '004', 'PKG': '005',
      },
      default: '001',
      description: 'LN purchasing group to SAP purchasing group',
    },
    // ── MRP Controller ───────────────────────────────────────────
    {
      source: 'cmnf',
      target: 'DISPO',
      transform: (v) => {
        if (!v) return '000';
        return String(v).substring(0, 3);
      },
      description: 'LN planner code to SAP MRP controller',
    },
    // ── Planning Type ────────────────────────────────────────────
    {
      source: 't$plng',
      target: 'DISMM',
      valueMap: {
        'MRP': 'PD',      // MRP-planned -> MRP
        'Reorder': 'VB',   // Reorder point -> Reorder point
        'None': 'ND',      // No planning -> No planning
        'Manual': 'VB',    // Manual -> Reorder point
      },
      default: 'ND',
      description: 'LN planning method to SAP MRP type',
    },
    // ── Safety Stock / Reorder Point ─────────────────────────────
    {
      source: 'sfty',
      target: 'EISBE',
      convert: 'toDecimal',
      description: 'Safety stock quantity',
    },
    {
      source: 'reop',
      target: 'MINBE',
      convert: 'toDecimal',
      description: 'Reorder point',
    },
    // ── Lead Time ────────────────────────────────────────────────
    {
      source: 'pldt',
      target: 'PLIFZ',
      convert: 'toInteger',
      description: 'Planned delivery time in days',
    },
    // ── EAN/Barcode ──────────────────────────────────────────────
    {
      source: 'erpn',
      target: 'EAN11',
      convert: 'trim',
      description: 'International Article Number (EAN)',
    },
    // ── Metadata ─────────────────────────────────────────────────
    {
      target: 'SourceSystem',
      default: 'INFOR_LN',
      description: 'Source system identifier',
    },
  ],
};
