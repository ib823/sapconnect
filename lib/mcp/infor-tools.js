/**
 * MCP Infor Tool Definitions
 *
 * 15 MCP tool definitions for Infor ERP integration — covering ION BOD queries,
 * M3 API execution, Data Lake analytics, workflow management, database profiling,
 * IDO queries, customization discovery, migration assessment, and field mapping.
 *
 * Same format as TOOL_DEFINITIONS in server.js for seamless registration.
 */

'use strict';

const INFOR_TOOL_DEFINITIONS = [
  {
    name: 'infor_query_bod',
    description: 'Query Infor ION BOD documents by noun and verb. Returns matching BOD instances with metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        noun: { type: 'string', description: 'BOD noun (e.g., "SyncItem", "ProcessPurchaseOrder", "SyncSalesOrder")' },
        verb: { type: 'string', description: 'BOD verb (e.g., "Sync", "Process", "Get", "Confirm")' },
        filters: { type: 'object', description: 'Filter criteria (e.g., { "status": "active", "since": "2024-01-01" })' },
        limit: { type: 'number', description: 'Maximum documents to return', default: 50 },
      },
      required: ['noun'],
    },
  },
  {
    name: 'infor_execute_m3api',
    description: 'Execute an Infor M3 API program transaction. Calls the M3 API server and returns the response fields.',
    inputSchema: {
      type: 'object',
      properties: {
        program: { type: 'string', description: 'M3 API program name (e.g., "CRS610MI", "MMS200MI")' },
        transaction: { type: 'string', description: 'Transaction name (e.g., "GetBasicData", "LstByName")' },
        inputFields: { type: 'object', description: 'Input field key-value pairs for the transaction' },
        maxRecords: { type: 'number', description: 'Maximum records for list transactions', default: 100 },
      },
      required: ['program', 'transaction'],
    },
  },
  {
    name: 'infor_query_datalake',
    description: 'Query Infor Data Lake using SQL-like syntax. Returns tabular data from the Infor Data Fabric.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'SQL-like query string for the data lake' },
        dataArea: { type: 'string', description: 'Logical data area (e.g., "M3", "LN", "CloudSuite")' },
        limit: { type: 'number', description: 'Maximum rows to return', default: 1000 },
      },
      required: ['query'],
    },
  },
  {
    name: 'infor_get_workflow',
    description: 'Retrieve Infor ION workflow definitions and their execution status.',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Workflow ID or name pattern' },
        status: { type: 'string', description: 'Filter by status: active, completed, error, suspended' },
        includeHistory: { type: 'boolean', description: 'Include execution history', default: false },
      },
      required: ['workflowId'],
    },
  },
  {
    name: 'infor_profile_db',
    description: 'Profile Infor database tables — row counts, column statistics, data quality metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: { type: 'string', description: 'Database table name (e.g., "MITMAS", "OCUSMA", "CIDMAS")' },
        schema: { type: 'string', description: 'Database schema name' },
        includeStats: { type: 'boolean', description: 'Include column-level statistics (min, max, nulls, distinct)', default: true },
      },
      required: ['tableName'],
    },
  },
  {
    name: 'infor_list_connections',
    description: 'List all configured Infor ION API connection points and their status.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Filter by connection type: api, bod, dataflow, workflow' },
        status: { type: 'string', description: 'Filter by status: active, inactive, error' },
      },
    },
  },
  {
    name: 'infor_get_bod_schema',
    description: 'Get the XML/JSON schema definition for a specific BOD noun, including field types and cardinality.',
    inputSchema: {
      type: 'object',
      properties: {
        noun: { type: 'string', description: 'BOD noun (e.g., "SyncItem", "SyncCodeDefinition")' },
        version: { type: 'string', description: 'Schema version (default: latest)' },
        format: { type: 'string', description: 'Output format: xsd, json-schema', default: 'json-schema' },
      },
      required: ['noun'],
    },
  },
  {
    name: 'infor_list_mi_programs',
    description: 'List available M3 MI (Management Interface) API programs with their transactions.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', description: 'Filter by program name pattern (e.g., "CRS*", "*200MI")' },
        category: { type: 'string', description: 'Filter by category: customer, item, order, finance, manufacturing' },
      },
    },
  },
  {
    name: 'infor_query_ido',
    description: 'Query Infor IDO (Intelligent Data Objects) in SyteLine/CloudSuite Industrial.',
    inputSchema: {
      type: 'object',
      properties: {
        idoName: { type: 'string', description: 'IDO name (e.g., "SLItems", "SLCustomers", "SLPurchaseOrders")' },
        properties: { type: 'array', items: { type: 'string' }, description: 'Properties (columns) to return' },
        filter: { type: 'string', description: 'OData-style filter expression' },
        orderBy: { type: 'string', description: 'Sort expression' },
        maxRecords: { type: 'number', description: 'Maximum records', default: 100 },
      },
      required: ['idoName'],
    },
  },
  {
    name: 'infor_get_customizations',
    description: 'Discover customizations in an Infor environment — personalized forms, user scripts, custom BODs, modified APIs.',
    inputSchema: {
      type: 'object',
      properties: {
        scope: { type: 'string', description: 'Scope: forms, scripts, bods, apis, all', default: 'all' },
        module: { type: 'string', description: 'Restrict to specific module (e.g., "M3", "LN", "SyteLine")' },
      },
    },
  },
  {
    name: 'infor_run_assessment',
    description: 'Run a migration readiness assessment on an Infor system — analyzing data volumes, customizations, interfaces, and complexity.',
    inputSchema: {
      type: 'object',
      properties: {
        systemType: { type: 'string', description: 'Infor system type: M3, LN, SyteLine, CloudSuite' },
        modules: { type: 'array', items: { type: 'string' }, description: 'Modules to assess (e.g., ["Finance", "Manufacturing", "Supply Chain"])' },
        depth: { type: 'string', description: 'Assessment depth: quick, standard, deep', default: 'standard' },
      },
      required: ['systemType'],
    },
  },
  {
    name: 'infor_get_complexity_score',
    description: 'Calculate migration complexity score for an Infor environment based on customizations, data volume, and integrations.',
    inputSchema: {
      type: 'object',
      properties: {
        systemType: { type: 'string', description: 'Infor system type: M3, LN, SyteLine, CloudSuite' },
        includeBreakdown: { type: 'boolean', description: 'Include per-area complexity breakdown', default: true },
      },
      required: ['systemType'],
    },
  },
  {
    name: 'infor_map_field',
    description: 'Map a field from Infor source to SAP S/4HANA target, with transformation rules and data type conversion.',
    inputSchema: {
      type: 'object',
      properties: {
        sourceSystem: { type: 'string', description: 'Source system: M3, LN, SyteLine' },
        sourceTable: { type: 'string', description: 'Source table name (e.g., "MITMAS", "CIDMAS")' },
        sourceField: { type: 'string', description: 'Source field name' },
        targetTable: { type: 'string', description: 'Optional target SAP table override' },
      },
      required: ['sourceSystem', 'sourceTable', 'sourceField'],
    },
  },
  {
    name: 'infor_get_industry_gaps',
    description: 'Identify functional gaps between Infor industry solution and SAP S/4HANA for a specific industry vertical.',
    inputSchema: {
      type: 'object',
      properties: {
        industry: { type: 'string', description: 'Industry: manufacturing, distribution, food-beverage, automotive, fashion, equipment' },
        sourceSystem: { type: 'string', description: 'Current Infor product: M3, LN, SyteLine, CloudSuite' },
        modules: { type: 'array', items: { type: 'string' }, description: 'Modules to analyze' },
      },
      required: ['industry', 'sourceSystem'],
    },
  },
  {
    name: 'infor_migrate_object',
    description: 'Migrate a specific data object from Infor to SAP S/4HANA — extract, transform, validate, and optionally load.',
    inputSchema: {
      type: 'object',
      properties: {
        objectType: { type: 'string', description: 'Object type: customer, item, supplier, bom, routing, gl_account, cost_center' },
        sourceSystem: { type: 'string', description: 'Source system: M3, LN, SyteLine' },
        mode: { type: 'string', description: 'Execution mode: analyze, transform, validate, full', default: 'analyze' },
        limit: { type: 'number', description: 'Max records to process', default: 100 },
      },
      required: ['objectType', 'sourceSystem'],
    },
  },
];

module.exports = { INFOR_TOOL_DEFINITIONS };
