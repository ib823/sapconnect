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
 * Validate tool input against its JSON schema definition.
 * Returns null if valid, or an error string describing the violation.
 * @param {string} toolName - Name of the tool
 * @param {object} toolInput - Input parameters to validate
 * @returns {string|null} Error message or null if valid
 */
function validateToolInput(toolName, toolInput) {
  const tool = TOOL_MAP[toolName];
  if (!tool) return `Unknown tool: ${toolName}`;

  const schema = tool.input_schema;
  if (!schema) return null; // No schema defined — allow

  if (typeof toolInput !== 'object' || toolInput === null) {
    return `Tool input must be an object, got ${typeof toolInput}`;
  }

  const errors = [];

  // Check required fields
  if (Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (toolInput[field] === undefined || toolInput[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Validate each provided property against schema
  if (schema.properties) {
    for (const [key, value] of Object.entries(toolInput)) {
      const propSchema = schema.properties[key];
      if (!propSchema) {
        errors.push(`Unexpected field: ${key}`);
        continue;
      }
      // Type check
      if (propSchema.type === 'string' && typeof value !== 'string') {
        errors.push(`Field ${key}: expected string, got ${typeof value}`);
      } else if (propSchema.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Field ${key}: expected boolean, got ${typeof value}`);
      }
      // Enum check
      if (propSchema.enum && typeof value === 'string' && !propSchema.enum.includes(value)) {
        errors.push(`Field ${key}: value '${value}' not in allowed values [${propSchema.enum.join(', ')}]`);
      }
      // String length guard — reject excessively long inputs
      if (propSchema.type === 'string' && typeof value === 'string' && value.length > 100000) {
        errors.push(`Field ${key}: value exceeds maximum length (100000 chars)`);
      }
    }
  }

  return errors.length > 0 ? errors.join('; ') : null;
}

/**
 * Execute a tool call by delegating to the SAP gateway.
 * Validates input against the tool's schema before execution (fail-closed).
 * @param {string} toolName - Name of the tool to execute
 * @param {object} toolInput - Input parameters for the tool
 * @param {object} gateway - SapGateway instance
 * @returns {Promise<object>} Tool execution result
 */
async function executeTool(toolName, toolInput, gateway) {
  // Validate input against tool schema — fail-closed on invalid input
  const validationError = validateToolInput(toolName, toolInput);
  if (validationError) {
    return { error: `Tool input validation failed: ${validationError}` };
  }

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
  validateToolInput,
};
