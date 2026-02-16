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
 * Tool Definitions for AI Function Calling
 *
 * 8 tools that agents can use to interact with the SAP system.
 * Each tool is defined in standard API format with name, description, and input_schema.
 */

const TOOLS = [
  {
    name: 'read_abap_source',
    description: 'Read the ABAP source code of an object (class, interface, function module, program)',
    input_schema: {
      type: 'object',
      properties: {
        object_name: { type: 'string', description: 'Name of the ABAP object (e.g., ZCL_VENDOR_RATING)' },
        object_type: { type: 'string', description: 'Type of object: CLAS, INTF, FUGR, PROG', enum: ['CLAS', 'INTF', 'FUGR', 'PROG'] },
      },
      required: ['object_name'],
    },
  },
  {
    name: 'write_abap_source',
    description: 'Write or update the ABAP source code of an object',
    input_schema: {
      type: 'object',
      properties: {
        object_name: { type: 'string', description: 'Name of the ABAP object' },
        object_type: { type: 'string', description: 'Type of object: CLAS, INTF, FUGR, PROG', enum: ['CLAS', 'INTF', 'FUGR', 'PROG'] },
        source: { type: 'string', description: 'The ABAP source code to write' },
        package: { type: 'string', description: 'Package to create the object in' },
      },
      required: ['object_name', 'source'],
    },
  },
  {
    name: 'list_objects',
    description: 'List all objects in an ABAP package',
    input_schema: {
      type: 'object',
      properties: {
        package: { type: 'string', description: 'Package name (e.g., ZVENDOR_RATING)' },
      },
      required: ['package'],
    },
  },
  {
    name: 'search_repository',
    description: 'Search the ABAP repository for objects matching a pattern',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or pattern' },
        object_type: { type: 'string', description: 'Filter by object type: CLAS, INTF, TABL, DTEL, FUGR, PROG' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_data_dictionary',
    description: 'Get the structure definition of a data dictionary object (table, structure, data element)',
    input_schema: {
      type: 'object',
      properties: {
        object_name: { type: 'string', description: 'Name of the DDIC object (e.g., EKKO, ZVENDOR_RATING)' },
      },
      required: ['object_name'],
    },
  },
  {
    name: 'activate_object',
    description: 'Activate an ABAP object after creation or modification',
    input_schema: {
      type: 'object',
      properties: {
        object_name: { type: 'string', description: 'Name of the ABAP object to activate' },
        object_type: { type: 'string', description: 'Type of object: CLAS, INTF, TABL, DTEL, FUGR, PROG' },
      },
      required: ['object_name'],
    },
  },
  {
    name: 'run_unit_tests',
    description: 'Run ABAP Unit tests for a class or package',
    input_schema: {
      type: 'object',
      properties: {
        object_name: { type: 'string', description: 'Name of the class or package to test' },
        with_coverage: { type: 'boolean', description: 'Include code coverage metrics' },
      },
      required: ['object_name'],
    },
  },
  {
    name: 'run_syntax_check',
    description: 'Run syntax check on an ABAP object',
    input_schema: {
      type: 'object',
      properties: {
        object_name: { type: 'string', description: 'Name of the ABAP object to check' },
        object_type: { type: 'string', description: 'Type of object: CLAS, INTF, FUGR, PROG' },
      },
      required: ['object_name'],
    },
  },
];

/** Tool name -> definition lookup */
const TOOL_MAP = {};
for (const tool of TOOLS) {
  TOOL_MAP[tool.name] = tool;
}

/**
 * Get tool definitions allowed for a given agent role
 * @param {string[]} allowedNames - List of tool names the agent can use
 * @returns {object[]} Array of tool definitions in standard API format
 */
function getToolsForRole(allowedNames) {
  return allowedNames
    .map((name) => TOOL_MAP[name])
    .filter(Boolean);
}

/**
 * Execute a tool call by delegating to the SAP gateway
 * @param {string} toolName - Name of the tool to execute
 * @param {object} toolInput - Input parameters for the tool
 * @param {object} gateway - SapGateway instance
 * @returns {Promise<object>} Tool execution result
 */
async function executeTool(toolName, toolInput, gateway) {
  switch (toolName) {
    case 'read_abap_source':
      return gateway.readAbapSource(toolInput.object_name, toolInput.object_type);
    case 'write_abap_source':
      return gateway.writeAbapSource(toolInput.object_name, toolInput.source, toolInput.object_type, toolInput.package);
    case 'list_objects':
      return gateway.listObjects(toolInput.package);
    case 'search_repository':
      return gateway.searchRepository(toolInput.query, toolInput.object_type);
    case 'get_data_dictionary':
      return gateway.getDataDictionary(toolInput.object_name);
    case 'activate_object':
      return gateway.activateObject(toolInput.object_name, toolInput.object_type);
    case 'run_unit_tests':
      return gateway.runUnitTests(toolInput.object_name, toolInput.with_coverage);
    case 'run_syntax_check':
      return gateway.runSyntaxCheck(toolInput.object_name, toolInput.object_type);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

module.exports = {
  TOOLS,
  TOOL_MAP,
  getToolsForRole,
  executeTool,
};
