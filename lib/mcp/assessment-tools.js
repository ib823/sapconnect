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
 * MCP Assessment Tool Definitions
 *
 * 7 MCP tool definitions for migration assessment — covering gap analysis,
 * confidence scoring, process mining, human checklists, and migration planning.
 *
 * Same format as TOOL_DEFINITIONS in server.js for seamless registration.
 */

'use strict';

const ASSESSMENT_TOOL_DEFINITIONS = [
  {
    name: 'assessment_analyze_gaps',
    description: 'Run gap analysis between source and target systems. Identifies functional, custom code, integration, and data gaps with severity ratings and remediation recommendations. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        sourceSystem: { type: 'string', description: 'Source ERP system identifier (e.g., "ECC", "R3", "BW")', default: 'ECC' },
        targetSystem: { type: 'string', description: 'Target ERP system identifier (e.g., "S4HANA", "BTP")', default: 'S4HANA' },
        modules: { type: 'array', items: { type: 'string' }, description: 'Optional list of modules to scope the analysis (e.g., ["FI", "MM", "SD"])' },
      },
    },
  },
  {
    name: 'assessment_get_gap_report',
    description: 'Get the cached gap analysis report from the most recent assessment_analyze_gaps run. Returns the full report if available. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'assessment_get_confidence',
    description: 'Get confidence score for migration readiness. Returns an overall score with breakdown by data quality, custom code coverage, process alignment, and integration readiness. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'assessment_get_human_checklist',
    description: 'Get human validation checklist from gap analysis. Returns action items requiring human decisions on business process, data ownership, cutover, and testing. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'assessment_mine_processes',
    description: 'Run process mining on extracted data. Discovers process variants, bottlenecks, and automation opportunities from transaction logs. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        processArea: { type: 'string', description: 'Process area to mine (e.g., "order-to-cash", "procure-to-pay", "record-to-report")' },
        maxVariants: { type: 'number', description: 'Maximum number of process variants to return', default: 20 },
      },
    },
  },
  {
    name: 'assessment_get_process_catalog',
    description: 'Get the process catalog from mining. Returns discovered SAP business processes with their areas, variant counts, related transactions, and complexity ratings. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'assessment_plan_migration',
    description: 'Generate a migration plan based on forensic and gap data. Produces phased timelines, resource requirements, risks, and human decision points. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        strategy: { type: 'string', description: 'Migration strategy: "big-bang", "phased", or "hybrid"', default: 'phased' },
        timeline: { type: 'string', description: 'Timeline aggressiveness: "aggressive", "standard", or "conservative"', default: 'standard' },
      },
    },
  },
];

module.exports = { ASSESSMENT_TOOL_DEFINITIONS };
