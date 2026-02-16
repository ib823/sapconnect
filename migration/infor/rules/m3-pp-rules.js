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
 * Infor M3 Production Planning Transformation Rules
 *
 * Maps M3 manufacturing fields to SAP PP equivalents:
 * - Product structure (BOM) type mapping
 * - Routing/operation mapping
 * - Work center mapping
 * - Manufacturing order type/status mapping
 */

module.exports = {
  ruleSetId: 'M3_PP_RULES',
  name: 'Infor M3 Production Planning Transformation Rules',
  rules: [
    // ── Product Structure (BOM) Type ─────────────────────────────
    {
      source: 'STRT',
      target: 'STLAN',
      valueMap: {
        'MFG': '1',     // Manufacturing structure -> Production
        'ENG': '2',     // Engineering structure -> Design
        'PMS': '5',     // PM structure -> Plant Maintenance
        'SLS': '6',     // Sales structure -> Sales
        'CST': '3',     // Costing structure -> Costing
      },
      default: '1',
      description: 'M3 product structure type to SAP BOM usage',
    },
    // ── Product Structure Status ─────────────────────────────────
    {
      source: 'PSTS',
      target: 'STLST',
      valueMap: {
        '20': '01',    // Released -> Active
        '10': '02',    // Preliminary -> In creation
        '30': '04',    // Held -> Locked
        '90': '05',    // Phase-out -> Flagged for deletion
      },
      default: '01',
      description: 'M3 structure status to SAP BOM status',
    },
    // ── Component Category ───────────────────────────────────────
    {
      source: 'CMTP',
      target: 'POSTP',
      valueMap: {
        'M': 'L',     // Material component -> Stock item
        'P': 'R',     // Phantom -> Variable-size item
        'T': 'T',     // Text -> Text item
        'D': 'D',     // Document -> Document item
        'B': 'N',     // By-product -> Non-stock item
        'R': 'L',     // Raw material -> Stock item
      },
      default: 'L',
      description: 'M3 component type to SAP BOM item category',
    },
    // ── Component Quantity ───────────────────────────────────────
    {
      source: 'CNQT',
      target: 'MENGE',
      convert: 'toDecimal',
      description: 'Component quantity per base',
    },
    {
      source: 'SCPC',
      target: 'AUSCH',
      convert: 'toDecimal',
      description: 'Scrap percentage',
    },
    // ── Operation Type ───────────────────────────────────────────
    {
      source: 'OPTP',
      target: 'STEUS',
      valueMap: {
        'I': 'PP01',    // Internal -> Internal processing
        'E': 'PP02',    // External -> External processing
        'Q': 'PP03',    // Quality -> Inspection
        'T': 'PP04',    // Testing -> Test operation
        'S': 'PP01',    // Setup -> Internal processing
        'M': 'PP06',    // Move -> Handling
      },
      default: 'PP01',
      description: 'M3 operation type to SAP control key',
    },
    // ── Times ────────────────────────────────────────────────────
    {
      source: 'SETI',
      target: 'VGW01',
      convert: 'toDecimal',
      description: 'Setup time',
    },
    {
      source: 'PITI',
      target: 'VGW02',
      convert: 'toDecimal',
      description: 'Run time per unit',
    },
    {
      source: 'QUEU',
      target: 'VGW03',
      convert: 'toDecimal',
      description: 'Queue time',
    },
    // ── Work Center ──────────────────────────────────────────────
    {
      source: 'PLGR',
      target: 'ARBPL',
      convert: 'toUpperCase',
      description: 'M3 work center / planning group to SAP work center',
    },
    {
      source: 'WCTP',
      target: 'VERWE',
      valueMap: {
        'MCH': '0001',    // Machine center
        'LBR': '0002',    // Labor center
        'ASY': '0003',    // Assembly cell
        'QAL': '0004',    // Quality station
        'PKG': '0005',    // Packaging line
        'WHS': '0006',    // Warehouse
        'SUB': '0007',    // Subcontractor
      },
      default: '0001',
      description: 'M3 work center type to SAP category',
    },
    // ── Manufacturing Order Type ─────────────────────────────────
    {
      source: 'ORTY',
      target: 'AUART',
      valueMap: {
        'M01': 'PP01',   // Discrete manufacturing
        'M02': 'PP02',   // Repetitive manufacturing
        'M03': 'PP03',   // Rework order
        'M04': 'PP04',   // Pilot order
        'M05': 'PP10',   // Subcontracting
        'M06': 'PP01',   // Kanban-triggered
      },
      default: 'PP01',
      description: 'M3 manufacturing order type to SAP order type',
    },
    // ── Manufacturing Order Status ───────────────────────────────
    {
      source: 'ORST',
      target: 'STATUS',
      valueMap: {
        '10': 'CRTD',    // Planned
        '20': 'CRTD',    // Firmed
        '30': 'REL',     // Released
        '40': 'REL',     // Active
        '50': 'REL',     // Started
        '60': 'TECO',    // Reported complete
        '70': 'TECO',    // Costed
        '80': 'DLT',     // Closed
        '90': 'DLT',     // Deleted
      },
      default: 'CRTD',
      description: 'M3 manufacturing order status to SAP order status',
    },
    // ── Material Number ──────────────────────────────────────────
    {
      source: 'ITNO',
      target: 'MATNR',
      convert: 'toUpperCase',
      description: 'Material number',
    },
    // ── Plant / Facility ─────────────────────────────────────────
    {
      source: 'FACI',
      target: 'WERKS',
      transform: (v) => {
        if (!v) return '';
        return String(v).substring(0, 4).toUpperCase();
      },
      description: 'M3 facility to SAP plant',
    },
    // ── Metadata ─────────────────────────────────────────────────
    {
      target: 'SourceSystem',
      default: 'INFOR_M3',
      description: 'Source system identifier',
    },
  ],
};
