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
 * MCP Greenfield Tool Definitions
 *
 * 10 MCP tool definitions for SAP greenfield implementation automation — covering
 * BDC recording generation and execution, configuration templates, BAPI catalog,
 * enhancement discovery, and SM30 customizing table maintenance.
 *
 * Same format as TOOL_DEFINITIONS in server.js for seamless registration.
 */

'use strict';

const GREENFIELD_TOOL_DEFINITIONS = [
  {
    name: 'greenfield_generate_bdc',
    description: 'Generate a BDC recording for a transaction. Returns screen sequences with field mappings ready for execution.',
    inputSchema: {
      type: 'object',
      properties: {
        transaction: { type: 'string', description: 'SAP transaction code (e.g., "XK01", "MM01", "FB01")' },
        data: { type: 'object', description: 'Field values to populate in the recording' },
        variant: { type: 'string', description: 'Optional BDC variant name for pre-configured field sets' },
      },
      required: ['transaction', 'data'],
    },
  },
  {
    name: 'greenfield_execute_bdc',
    description: '[WRITE OPERATION — requires dryRun=false for live execution. User must hold valid SAP Named User license.] Execute a BDC recording on a target system. Requires safety gate approval for non-dry-run execution.',
    inputSchema: {
      type: 'object',
      properties: {
        recording: { type: 'object', description: 'BDC recording object (from greenfield_generate_bdc)' },
        dryRun: { type: 'boolean', description: 'Simulate execution without making changes', default: true },
        mode: { type: 'string', description: 'Processing mode: "A" (display all), "N" (no display), "E" (errors only)', default: 'N' },
      },
      required: ['recording'],
    },
  },
  {
    name: 'greenfield_list_bdc_templates',
    description: 'List available BDC template types for common SAP transactions.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'greenfield_list_config_templates',
    description: 'List configuration templates for SAP implementation. Optionally filter by functional area.',
    inputSchema: {
      type: 'object',
      properties: {
        area: { type: 'string', description: 'Functional area filter (e.g., "FI", "MM", "SD", "PP")' },
      },
    },
  },
  {
    name: 'greenfield_get_config_template',
    description: 'Get a specific configuration template with detailed steps, fields, and prerequisites.',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template identifier (e.g., "FI_COA_001", "MM_PORG_001")' },
      },
      required: ['templateId'],
    },
  },
  {
    name: 'greenfield_list_bapis',
    description: 'List available BAPIs by module and object type. Returns BAPI metadata including parameter counts.',
    inputSchema: {
      type: 'object',
      properties: {
        module: { type: 'string', description: 'SAP module filter (e.g., "MM", "SD", "FI")' },
        objectType: { type: 'string', description: 'Business object type filter (e.g., "Material", "Customer", "PurchaseOrder")' },
      },
    },
  },
  {
    name: 'greenfield_get_bapi_signature',
    description: 'Get BAPI signature including import, export, and tables parameters with types and descriptions.',
    inputSchema: {
      type: 'object',
      properties: {
        bapiName: { type: 'string', description: 'BAPI function name (e.g., "BAPI_MATERIAL_SAVEDATA")' },
      },
      required: ['bapiName'],
    },
  },
  {
    name: 'greenfield_discover_enhancements',
    description: 'Discover BADIs, user exits, and business transaction events for a transaction or package.',
    inputSchema: {
      type: 'object',
      properties: {
        transaction: { type: 'string', description: 'SAP transaction code to search for enhancements' },
        package: { type: 'string', description: 'SAP development package to search for enhancements' },
      },
    },
  },
  {
    name: 'greenfield_list_sm30_tables',
    description: 'List known SM30 customizing tables with maintenance view information.',
    inputSchema: {
      type: 'object',
      properties: {
        area: { type: 'string', description: 'Functional area filter (e.g., "FI", "MM", "SD", "BASIS")' },
      },
    },
  },
  {
    name: 'greenfield_generate_sm30',
    description: 'Generate an SM30 maintenance view recording to insert entries into a customizing table.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: { type: 'string', description: 'Customizing table name (e.g., "T001", "T001W", "TCURR")' },
        entries: { type: 'array', items: { type: 'object' }, description: 'Array of entry objects to insert into the table' },
      },
      required: ['tableName', 'entries'],
    },
  },
];

module.exports = { GREENFIELD_TOOL_DEFINITIONS };
