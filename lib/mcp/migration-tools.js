/**
 * MCP Migration Tool Definitions
 *
 * 8 MCP tool definitions for SAP ETLV migration — covering object listing,
 * object details, ETLV execution, dependency graph, execution ordering,
 * reconciliation, and migration statistics.
 *
 * Same format as TOOL_DEFINITIONS in server.js for seamless registration.
 */

'use strict';

const MIGRATION_TOOL_DEFINITIONS = [
  {
    name: 'migration_list_objects',
    description: 'List all migration object types. Optionally filter by category (master-data, transactional, config, hierarchy).',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter by category (e.g., "master-data", "transactional", "config", "hierarchy")' },
      },
    },
  },
  {
    name: 'migration_get_object',
    description: 'Get details of a specific migration object including field mappings, transform rules, validation rules, and dependencies.',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Migration object ID (e.g., "CUSTOMER_MASTER", "MATERIAL_MASTER")' },
      },
      required: ['objectId'],
    },
  },
  {
    name: 'migration_run_object',
    description: 'Run ETLV (Extract-Transform-Load-Validate) for a single migration object. Write operation with dryRun=true default.',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Migration object ID (e.g., "CUSTOMER_MASTER")' },
        dryRun: { type: 'boolean', description: 'If true, simulate without loading to target', default: true },
        limit: { type: 'number', description: 'Maximum records to process', default: 100 },
      },
      required: ['objectId'],
    },
  },
  {
    name: 'migration_run_all',
    description: 'Run ETLV for all migration objects in dependency order. Write operation with dryRun=true default.',
    inputSchema: {
      type: 'object',
      properties: {
        dryRun: { type: 'boolean', description: 'If true, simulate without loading to target', default: true },
        limit: { type: 'number', description: 'Maximum records per object to process', default: 100 },
      },
    },
  },
  {
    name: 'migration_get_dependency_graph',
    description: 'Get the dependency graph as execution waves. Shows which objects can run in parallel and their ordering constraints.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'migration_get_execution_order',
    description: 'Get flat execution order respecting dependencies. Returns ordered list with positions and dependency references.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'migration_reconcile',
    description: 'Reconcile source vs target data after migration. Compare record counts and identify mismatches.',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Migration object ID. If omitted, reconcile all objects.' },
      },
    },
  },
  {
    name: 'migration_get_stats',
    description: 'Get migration statistics — object counts by category, field mappings, transform rules, validation rules, and coverage.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

module.exports = { MIGRATION_TOOL_DEFINITIONS };
