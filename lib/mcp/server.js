/**
 * MCP (Model Context Protocol) Server
 *
 * Exposes SAP tools to AI assistants and other MCP clients via JSON-RPC 2.0
 * over stdio. Implements the MCP specification directly without external
 * SDK dependencies.
 *
 * Supports 43 SAP tools and 4 resource types in both mock and live modes.
 */

'use strict';

const Logger = require('../logger');
const { INFOR_TOOL_DEFINITIONS } = require('./infor-tools');
const InforToolHandlers = require('./infor-tool-handlers');

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'sapconnect-mcp';
const SERVER_VERSION = '1.0.0';

// ─────────────────────────────────────────────────────────────────────────────
// Tool Definitions
// ─────────────────────────────────────────────────────────────────────────────

const TOOL_DEFINITIONS = [
  {
    name: 'searchObject',
    description: 'Search ABAP repository objects by query string and optional type filter.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g., "Z_MATERIAL*")' },
        objectType: { type: 'string', description: 'ABAP object type filter (PROG, CLAS, FUGR, TABL, etc.)' },
        maxResults: { type: 'number', description: 'Maximum results to return', default: 50 },
      },
      required: ['query'],
    },
  },
  {
    name: 'getSource',
    description: 'Read ABAP source code for a given object URI.',
    inputSchema: {
      type: 'object',
      properties: {
        objectUri: { type: 'string', description: 'ADT object URI (e.g., "/sap/bc/adt/programs/programs/Z_TEST")' },
      },
      required: ['objectUri'],
    },
  },
  {
    name: 'writeSource',
    description: 'Write ABAP source code to a given object URI. Performs lock, write, unlock sequence.',
    inputSchema: {
      type: 'object',
      properties: {
        objectUri: { type: 'string', description: 'ADT object URI' },
        source: { type: 'string', description: 'ABAP source code to write' },
      },
      required: ['objectUri', 'source'],
    },
  },
  {
    name: 'getTableStructure',
    description: 'Get table field metadata including names, types, lengths, and descriptions.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: { type: 'string', description: 'SAP table name (e.g., "MARA", "KNA1")' },
      },
      required: ['tableName'],
    },
  },
  {
    name: 'getTableData',
    description: 'Read table contents with optional field selection and WHERE filter.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: { type: 'string', description: 'SAP table name' },
        fields: { type: 'array', items: { type: 'string' }, description: 'Fields to select' },
        where: { type: 'string', description: 'WHERE clause for filtering' },
        maxRows: { type: 'number', description: 'Maximum rows to return', default: 100 },
      },
      required: ['tableName'],
    },
  },
  {
    name: 'getRelationships',
    description: 'Discover foreign key relationships for a table.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: { type: 'string', description: 'SAP table name' },
        depth: { type: 'number', description: 'Relationship traversal depth', default: 1 },
      },
      required: ['tableName'],
    },
  },
  {
    name: 'getFunctionInterface',
    description: 'Get the parameter interface of a function module.',
    inputSchema: {
      type: 'object',
      properties: {
        functionModule: { type: 'string', description: 'Function module name (e.g., "BAPI_MATERIAL_GETDETAIL")' },
      },
      required: ['functionModule'],
    },
  },
  {
    name: 'callBAPI',
    description: 'Execute any BAPI/function module with optional commit.',
    inputSchema: {
      type: 'object',
      properties: {
        functionModule: { type: 'string', description: 'Function module name' },
        imports: { type: 'object', description: 'IMPORT parameters' },
        tables: { type: 'object', description: 'TABLE parameters' },
        withCommit: { type: 'boolean', description: 'Whether to BAPI_TRANSACTION_COMMIT after call', default: false },
      },
      required: ['functionModule'],
    },
  },
  {
    name: 'runATCCheck',
    description: 'Run ATC (ABAP Test Cockpit) quality check on an object set.',
    inputSchema: {
      type: 'object',
      properties: {
        objectSet: { type: 'string', description: 'Object set to check (program name, package, etc.)' },
        checkVariant: { type: 'string', description: 'ATC check variant', default: 'S4HANA_READINESS' },
      },
      required: ['objectSet'],
    },
  },
  {
    name: 'manageTransport',
    description: 'Create, release, or query transport requests.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'release', 'check', 'list'], description: 'Transport action' },
        transportNumber: { type: 'string', description: 'Transport number (for release/check)' },
        description: { type: 'string', description: 'Description (for create)' },
        type: { type: 'string', enum: ['workbench', 'customizing'], description: 'Transport type (for create)', default: 'workbench' },
      },
      required: ['action'],
    },
  },
  {
    name: 'getCDSView',
    description: 'Get CDS view source code and annotations.',
    inputSchema: {
      type: 'object',
      properties: {
        cdsName: { type: 'string', description: 'CDS view name (e.g., "I_PRODUCT")' },
      },
      required: ['cdsName'],
    },
  },
  {
    name: 'getSystemInfo',
    description: 'Get SAP system version, component list, and configuration details.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ── Pillar 6: Signavio Tools ─────────────────────────────────────────────
  {
    name: 'signavio_list_models',
    description: 'List Signavio process models in a folder',
    inputSchema: {
      type: 'object',
      properties: {
        folderId: { type: 'string', description: 'Folder ID (optional)' },
      },
    },
  },
  {
    name: 'signavio_get_model',
    description: 'Get Signavio process model JSON by revision ID',
    inputSchema: {
      type: 'object',
      properties: {
        revisionId: { type: 'string', description: 'Model revision ID' },
      },
      required: ['revisionId'],
    },
  },
  {
    name: 'signavio_search_models',
    description: 'Search Signavio models by query',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'signavio_get_bpmn',
    description: 'Export BPMN 2.0 XML for a Signavio model',
    inputSchema: {
      type: 'object',
      properties: {
        revisionId: { type: 'string', description: 'Model revision ID' },
      },
      required: ['revisionId'],
    },
  },
  {
    name: 'signavio_parse_process',
    description: 'Parse BPMN XML into structured process flow',
    inputSchema: {
      type: 'object',
      properties: {
        bpmnXml: { type: 'string', description: 'BPMN 2.0 XML content' },
      },
      required: ['bpmnXml'],
    },
  },
  {
    name: 'signavio_map_to_config',
    description: 'Map BPMN process to SAP configuration steps',
    inputSchema: {
      type: 'object',
      properties: {
        bpmnXml: { type: 'string', description: 'BPMN 2.0 XML content' },
      },
      required: ['bpmnXml'],
    },
  },

  // ── Pillar 7: Testing Tools ──────────────────────────────────────────────
  {
    name: 'test_generate_from_description',
    description: 'Generate test cases from natural language description',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Natural language test description' },
      },
      required: ['description'],
    },
  },
  {
    name: 'test_generate_from_config',
    description: 'Generate tests from configuration delta',
    inputSchema: {
      type: 'object',
      properties: {
        configChanges: { type: 'array', description: 'Configuration changes', items: { type: 'object' } },
      },
      required: ['configChanges'],
    },
  },
  {
    name: 'test_generate_from_bpmn',
    description: 'Generate test scenarios from BPMN process model',
    inputSchema: {
      type: 'object',
      properties: {
        bpmnXml: { type: 'string', description: 'BPMN 2.0 XML content' },
      },
      required: ['bpmnXml'],
    },
  },
  {
    name: 'test_get_template',
    description: 'Get a pre-built test template by ID',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template ID (e.g., TPL-FI-001)' },
      },
      required: ['templateId'],
    },
  },
  {
    name: 'test_list_templates',
    description: 'List available test templates with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        module: { type: 'string', description: 'Filter by SAP module (FI, MM, SD, etc.)' },
        type: { type: 'string', description: 'Filter by test type' },
        priority: { type: 'string', description: 'Filter by priority' },
      },
    },
  },
  {
    name: 'test_run_suite',
    description: 'Execute a test suite in mock mode',
    inputSchema: {
      type: 'object',
      properties: {
        testCases: { type: 'array', description: 'Array of test cases to execute', items: { type: 'object' } },
      },
      required: ['testCases'],
    },
  },
  {
    name: 'test_get_report',
    description: 'Get test execution report',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['json', 'markdown', 'html', 'csv'], description: 'Report format', default: 'json' },
      },
    },
  },

  // ── Pillar 8a: SuccessFactors Tools ──────────────────────────────────────
  {
    name: 'sf_query_entities',
    description: 'Query SuccessFactors OData entities',
    inputSchema: {
      type: 'object',
      properties: {
        entitySet: { type: 'string', description: 'Entity set name (e.g., EmpEmployment, FOCompany)' },
        filter: { type: 'string', description: 'OData $filter expression' },
        select: { type: 'string', description: 'OData $select fields' },
        top: { type: 'number', description: 'Maximum results', default: 20 },
      },
      required: ['entitySet'],
    },
  },
  {
    name: 'sf_get_entity',
    description: 'Get a single SuccessFactors entity by key',
    inputSchema: {
      type: 'object',
      properties: {
        entitySet: { type: 'string', description: 'Entity set name' },
        key: { type: 'string', description: 'Entity key value' },
      },
      required: ['entitySet', 'key'],
    },
  },
  {
    name: 'sf_create_entity',
    description: 'Create a new SuccessFactors entity',
    inputSchema: {
      type: 'object',
      properties: {
        entitySet: { type: 'string', description: 'Entity set name' },
        data: { type: 'object', description: 'Entity data' },
      },
      required: ['entitySet', 'data'],
    },
  },
  {
    name: 'sf_get_metadata',
    description: 'Get SuccessFactors entity metadata definitions',
    inputSchema: {
      type: 'object',
      properties: {
        entitySet: { type: 'string', description: 'Entity set name (optional, all if omitted)' },
      },
    },
  },
  {
    name: 'sf_batch_operation',
    description: 'Execute batch CRUD operations on SuccessFactors',
    inputSchema: {
      type: 'object',
      properties: {
        operations: { type: 'array', description: 'Batch operations', items: { type: 'object' } },
      },
      required: ['operations'],
    },
  },

  // ── Pillar 8b: Ariba Tools ───────────────────────────────────────────────
  {
    name: 'ariba_get_purchase_orders',
    description: 'Query Ariba purchase orders',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by PO status' },
        top: { type: 'number', description: 'Maximum results', default: 20 },
      },
    },
  },
  {
    name: 'ariba_get_requisitions',
    description: 'Query Ariba requisitions',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status' },
        top: { type: 'number', description: 'Maximum results', default: 20 },
      },
    },
  },
  {
    name: 'ariba_get_contracts',
    description: 'Query Ariba contract workspaces',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status' },
        top: { type: 'number', description: 'Maximum results', default: 20 },
      },
    },
  },
  {
    name: 'ariba_get_report',
    description: 'Get Ariba operational reporting data',
    inputSchema: {
      type: 'object',
      properties: {
        viewId: { type: 'string', description: 'Report view ID' },
        filters: { type: 'object', description: 'Report filters' },
      },
      required: ['viewId'],
    },
  },

  // ── Pillar 8c: Concur Tools ──────────────────────────────────────────────
  {
    name: 'concur_get_expense_reports',
    description: 'List Concur expense reports',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status' },
        limit: { type: 'number', description: 'Maximum results', default: 20 },
      },
    },
  },
  {
    name: 'concur_get_travel_requests',
    description: 'List Concur travel requests',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status' },
        limit: { type: 'number', description: 'Maximum results', default: 20 },
      },
    },
  },
  {
    name: 'concur_manage_users',
    description: 'SCIM user management for Concur',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'create', 'update', 'deactivate'], description: 'User management action' },
        userId: { type: 'string', description: 'User ID (for update/deactivate)' },
        data: { type: 'object', description: 'User data (for create/update)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'concur_create_expense_report',
    description: 'Create a new Concur expense report',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Report name' },
        purpose: { type: 'string', description: 'Business purpose' },
        currency: { type: 'string', description: 'Currency code', default: 'USD' },
      },
      required: ['name'],
    },
  },
  {
    name: 'concur_get_lists',
    description: 'Get Concur list management data',
    inputSchema: {
      type: 'object',
      properties: {
        listId: { type: 'string', description: 'List ID (optional, all lists if omitted)' },
      },
    },
  },

  // ── Pillar 8d: SAC Tools ─────────────────────────────────────────────────
  {
    name: 'sac_get_models',
    description: 'List or get SAP Analytics Cloud models',
    inputSchema: {
      type: 'object',
      properties: {
        modelId: { type: 'string', description: 'Model ID (optional, list all if omitted)' },
      },
    },
  },
  {
    name: 'sac_get_stories',
    description: 'List or get SAP Analytics Cloud stories',
    inputSchema: {
      type: 'object',
      properties: {
        storyId: { type: 'string', description: 'Story ID (optional, list all if omitted)' },
      },
    },
  },
  {
    name: 'sac_import_data',
    description: 'Import data into SAC model',
    inputSchema: {
      type: 'object',
      properties: {
        modelId: { type: 'string', description: 'Target model ID' },
        data: { type: 'array', description: 'Data rows to import', items: { type: 'object' } },
      },
      required: ['modelId', 'data'],
    },
  },
  {
    name: 'sac_get_dimensions',
    description: 'Get model dimensions and master data',
    inputSchema: {
      type: 'object',
      properties: {
        modelId: { type: 'string', description: 'Model ID' },
        dimensionId: { type: 'string', description: 'Dimension ID (optional)' },
      },
      required: ['modelId'],
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Resource Definitions
// ─────────────────────────────────────────────────────────────────────────────

const RESOURCE_DEFINITIONS = [
  {
    uri: 'sap://system/info',
    name: 'SAP System Information',
    description: 'Current SAP system version, components, and configuration',
    mimeType: 'application/json',
  },
  {
    uri: 'sap://objects/{type}/{name}',
    name: 'ABAP Object Source',
    description: 'Source code for an ABAP repository object',
    mimeType: 'text/plain',
  },
  {
    uri: 'sap://tables/{name}/structure',
    name: 'Table Structure',
    description: 'Field definitions and metadata for a SAP table',
    mimeType: 'application/json',
  },
  {
    uri: 'sap://tables/{name}/data',
    name: 'Table Data Sample',
    description: 'Sample data rows from a SAP table',
    mimeType: 'application/json',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data for Tools
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_DATA = {
  searchObject: (params) => ({
    results: [
      { uri: '/sap/bc/adt/programs/programs/Z_MATERIAL_REPORT', type: 'PROG', name: 'Z_MATERIAL_REPORT', description: 'Material Listing Report' },
      { uri: '/sap/bc/adt/oo/classes/ZCL_MATERIAL_HELPER', type: 'CLAS', name: 'ZCL_MATERIAL_HELPER', description: 'Material Helper Class' },
      { uri: '/sap/bc/adt/functions/groups/Z_MATERIAL_FM', type: 'FUGR', name: 'Z_MATERIAL_FM', description: 'Material Function Group' },
    ].filter(r => !params.objectType || r.type === params.objectType)
      .slice(0, params.maxResults || 50),
    totalResults: 3,
    query: params.query,
  }),

  getSource: (params) => ({
    uri: params.objectUri,
    source: `REPORT z_material_report.\n\n` +
      `* Material listing report\n` +
      `DATA: lt_mara TYPE TABLE OF mara,\n` +
      `      ls_mara TYPE mara.\n\n` +
      `SELECT * FROM mara INTO TABLE lt_mara UP TO 100 ROWS.\n\n` +
      `LOOP AT lt_mara INTO ls_mara.\n` +
      `  WRITE: / ls_mara-matnr, ls_mara-mtart, ls_mara-matkl.\n` +
      `ENDLOOP.\n`,
    language: 'abap',
    length: 285,
  }),

  writeSource: (params) => ({
    uri: params.objectUri,
    status: 'saved',
    lockToken: 'LCK_' + Date.now().toString(36).toUpperCase(),
    timestamp: new Date().toISOString(),
    warnings: [],
  }),

  getTableStructure: (params) => ({
    tableName: params.tableName,
    description: `Structure of ${params.tableName}`,
    category: 'TRANSP',
    fields: [
      { name: 'MANDT', type: 'CLNT', length: 3, decimals: 0, description: 'Client', keyField: true },
      { name: 'MATNR', type: 'CHAR', length: 40, decimals: 0, description: 'Material Number', keyField: true },
      { name: 'MTART', type: 'CHAR', length: 4, decimals: 0, description: 'Material Type', keyField: false },
      { name: 'MATKL', type: 'CHAR', length: 9, decimals: 0, description: 'Material Group', keyField: false },
      { name: 'MEINS', type: 'UNIT', length: 3, decimals: 0, description: 'Base Unit of Measure', keyField: false },
      { name: 'BRGEW', type: 'QUAN', length: 13, decimals: 3, description: 'Gross Weight', keyField: false },
      { name: 'NTGEW', type: 'QUAN', length: 13, decimals: 3, description: 'Net Weight', keyField: false },
      { name: 'GEWEI', type: 'UNIT', length: 3, decimals: 0, description: 'Weight Unit', keyField: false },
    ],
    totalFields: 8,
  }),

  getTableData: (params) => ({
    tableName: params.tableName,
    fields: params.fields || ['MANDT', 'MATNR', 'MTART', 'MATKL'],
    rows: [
      { MANDT: '100', MATNR: 'MAT-001', MTART: 'FERT', MATKL: '001' },
      { MANDT: '100', MATNR: 'MAT-002', MTART: 'ROH', MATKL: '002' },
      { MANDT: '100', MATNR: 'MAT-003', MTART: 'HALB', MATKL: '001' },
    ].slice(0, params.maxRows || 100),
    totalRows: 3,
    where: params.where || null,
  }),

  getRelationships: (params) => ({
    tableName: params.tableName,
    depth: params.depth || 1,
    relationships: [
      { fromTable: params.tableName, fromField: 'MATNR', toTable: 'MAKT', toField: 'MATNR', cardinality: '1:N', description: 'Material Descriptions' },
      { fromTable: params.tableName, fromField: 'MATNR', toTable: 'MARC', toField: 'MATNR', cardinality: '1:N', description: 'Plant Data for Material' },
      { fromTable: params.tableName, fromField: 'MATNR', toTable: 'MARD', toField: 'MATNR', cardinality: '1:N', description: 'Storage Location Data' },
      { fromTable: params.tableName, fromField: 'MTART', toTable: 'T134', toField: 'MTART', cardinality: 'N:1', description: 'Material Type Config' },
    ],
    totalRelationships: 4,
  }),

  getFunctionInterface: (params) => ({
    name: params.functionModule,
    imports: [
      { name: 'MATERIAL', type: 'BAPIMATHEAD', optional: false, default: '' },
      { name: 'PLANT', type: 'BAPI_PLANT', optional: true, default: '' },
    ],
    exports: [
      { name: 'RETURN', type: 'BAPIRETURN' },
      { name: 'MATERIAL_GENERAL_DATA', type: 'BAPI_MARA' },
    ],
    changing: [],
    tables: [
      { name: 'MATERIALDESCRIPTION', type: 'BAPI_MAKT' },
      { name: 'UNITSOFMEASURE', type: 'BAPI_MARM' },
    ],
  }),

  callBAPI: (params) => ({
    functionModule: params.functionModule,
    result: {
      RETURN: { TYPE: 'S', ID: 'MM', NUMBER: '000', MESSAGE: 'Success' },
      MATERIAL_GENERAL_DATA: { MATERIAL: 'MAT-001', MATL_TYPE: 'FERT', MATL_GROUP: '001', BASE_UOM: 'EA' },
    },
    committed: params.withCommit || false,
    executionTime: 245,
  }),

  runATCCheck: (params) => ({
    objectSet: params.objectSet,
    checkVariant: params.checkVariant || 'S4HANA_READINESS',
    status: 'completed',
    findings: [
      { priority: 1, category: 'PERFORMANCE', messageTitle: 'SELECT * used without field list', uri: '/sap/bc/adt/programs/programs/Z_TEST/source/main#start=7', line: 7 },
      { priority: 2, category: 'SECURITY', messageTitle: 'Authority check missing for transaction', uri: '/sap/bc/adt/programs/programs/Z_TEST/source/main#start=15', line: 15 },
      { priority: 3, category: 'CONVENTION', messageTitle: 'Variable naming does not follow convention', uri: '/sap/bc/adt/programs/programs/Z_TEST/source/main#start=3', line: 3 },
    ],
    summary: { total: 3, priority1: 1, priority2: 1, priority3: 1 },
  }),

  manageTransport: (params) => {
    if (params.action === 'create') {
      return {
        action: 'create',
        transportNumber: 'DEVK900123',
        description: params.description || 'New transport request',
        type: params.type || 'workbench',
        owner: 'DEVELOPER',
        status: 'modifiable',
        createdAt: new Date().toISOString(),
      };
    }
    if (params.action === 'release') {
      return {
        action: 'release',
        transportNumber: params.transportNumber,
        status: 'released',
        releasedAt: new Date().toISOString(),
        logs: ['Object list checked', 'Transport released successfully'],
      };
    }
    if (params.action === 'check') {
      return {
        action: 'check',
        transportNumber: params.transportNumber,
        status: 'modifiable',
        objects: [
          { pgmid: 'R3TR', object: 'PROG', objName: 'Z_TEST_PROGRAM' },
          { pgmid: 'R3TR', object: 'CLAS', objName: 'ZCL_TEST_CLASS' },
        ],
        owner: 'DEVELOPER',
      };
    }
    // list
    return {
      action: 'list',
      transports: [
        { number: 'DEVK900120', description: 'Initial development', status: 'released', type: 'workbench' },
        { number: 'DEVK900121', description: 'Bug fix CR-100', status: 'modifiable', type: 'workbench' },
        { number: 'DEVK900122', description: 'Config changes', status: 'modifiable', type: 'customizing' },
      ],
    };
  },

  getCDSView: (params) => ({
    cdsName: params.cdsName,
    source: `@AbapCatalog.sqlViewName: '${params.cdsName.substring(0, 16).toUpperCase()}'\n` +
      `@AbapCatalog.compiler.compareFilter: true\n` +
      `@AccessControl.authorizationCheck: #CHECK\n` +
      `@EndUserText.label: '${params.cdsName} View'\n\n` +
      `define view ${params.cdsName} as select from mara\n` +
      `  association [0..*] to makt as _Text on $projection.Matnr = _Text.Matnr\n` +
      `{\n` +
      `  key matnr as Matnr,\n` +
      `      mtart as MaterialType,\n` +
      `      matkl as MaterialGroup,\n` +
      `      meins as BaseUnit,\n` +
      `      _Text\n` +
      `}\n`,
    annotations: [
      { name: '@AbapCatalog.sqlViewName', value: params.cdsName.substring(0, 16).toUpperCase() },
      { name: '@AccessControl.authorizationCheck', value: '#CHECK' },
    ],
    associations: [{ name: '_Text', target: 'makt', cardinality: '0..*' }],
  }),

  getSystemInfo: () => ({
    systemId: 'S4H',
    client: '100',
    systemNumber: '00',
    host: 'sap-s4h.example.com',
    release: '2023',
    patchLevel: '0005',
    database: 'HDB',
    databaseVersion: '2.00.070',
    kernel: '793',
    operatingSystem: 'Linux',
    abapRelease: '758',
    components: [
      { component: 'SAP_BASIS', release: '758', patchLevel: '0005', description: 'SAP Basis Component' },
      { component: 'SAP_ABA', release: '758', patchLevel: '0005', description: 'Cross-Application Component' },
      { component: 'S4CORE', release: '107', patchLevel: '0003', description: 'S/4HANA Core' },
      { component: 'SAP_UI', release: '758', patchLevel: '0005', description: 'User Interface Technology' },
    ],
    installedLanguages: ['EN', 'DE', 'FR', 'ES'],
    timezone: 'UTC',
    unicode: true,
  }),

  // ── Pillar 6: Signavio Mock Handlers ───────────────────────────────────

  signavio_list_models: (params) => {
    const allModels = [
      { id: 'mdl-o2c-001', name: 'Order-to-Cash (O2C)', description: 'End-to-end O2C process from sales order to payment receipt', revisionId: 'rev-o2c-v3', folder: 'root', lastModified: '2025-12-01T10:00:00Z' },
      { id: 'mdl-p2p-002', name: 'Procure-to-Pay (P2P)', description: 'Procurement lifecycle from requisition to vendor payment', revisionId: 'rev-p2p-v2', folder: 'root', lastModified: '2025-11-15T08:30:00Z' },
      { id: 'mdl-r2r-003', name: 'Record-to-Report (R2R)', description: 'Financial close and reporting cycle', revisionId: 'rev-r2r-v1', folder: 'finance', lastModified: '2025-10-20T14:00:00Z' },
      { id: 'mdl-h2r-004', name: 'Hire-to-Retire (H2R)', description: 'Employee lifecycle from hiring to separation', revisionId: 'rev-h2r-v2', folder: 'hr', lastModified: '2025-11-28T09:15:00Z' },
      { id: 'mdl-i2p-005', name: 'Idea-to-Product (I2P)', description: 'Product development and launch process', revisionId: 'rev-i2p-v1', folder: 'plm', lastModified: '2025-09-10T16:45:00Z' },
    ];
    const filtered = params.folderId
      ? allModels.filter(m => m.folder === params.folderId)
      : allModels;
    return { models: filtered, totalCount: filtered.length };
  },

  signavio_get_model: (params) => ({
    revisionId: params.revisionId,
    modelId: 'mdl-o2c-001',
    name: 'Order-to-Cash (O2C)',
    namespace: 'http://www.signavio.com/bpmn20',
    elements: {
      events: [
        { id: 'evt-start', type: 'startEvent', name: 'Sales Order Received' },
        { id: 'evt-end', type: 'endEvent', name: 'Payment Received' },
      ],
      tasks: [
        { id: 'task-1', type: 'userTask', name: 'Create Sales Order', performer: 'Sales Rep' },
        { id: 'task-2', type: 'serviceTask', name: 'Check Credit', performer: 'System' },
        { id: 'task-3', type: 'userTask', name: 'Deliver Goods', performer: 'Warehouse' },
        { id: 'task-4', type: 'serviceTask', name: 'Create Invoice', performer: 'System' },
      ],
      gateways: [
        { id: 'gw-1', type: 'exclusiveGateway', name: 'Credit Approved?' },
      ],
    },
    connections: [
      { from: 'evt-start', to: 'task-1' },
      { from: 'task-1', to: 'task-2' },
      { from: 'task-2', to: 'gw-1' },
      { from: 'gw-1', to: 'task-3', condition: 'approved' },
      { from: 'task-3', to: 'task-4' },
      { from: 'task-4', to: 'evt-end' },
    ],
  }),

  signavio_search_models: (params) => {
    const allModels = [
      { id: 'mdl-o2c-001', name: 'Order-to-Cash (O2C)', description: 'End-to-end O2C process', revisionId: 'rev-o2c-v3' },
      { id: 'mdl-p2p-002', name: 'Procure-to-Pay (P2P)', description: 'Procurement lifecycle', revisionId: 'rev-p2p-v2' },
      { id: 'mdl-r2r-003', name: 'Record-to-Report (R2R)', description: 'Financial close cycle', revisionId: 'rev-r2r-v1' },
      { id: 'mdl-h2r-004', name: 'Hire-to-Retire (H2R)', description: 'Employee lifecycle', revisionId: 'rev-h2r-v2' },
      { id: 'mdl-i2p-005', name: 'Idea-to-Product (I2P)', description: 'Product development', revisionId: 'rev-i2p-v1' },
    ];
    const q = (params.query || '').toLowerCase();
    const matched = allModels.filter(m =>
      m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    );
    return { results: matched, totalCount: matched.length, query: params.query };
  },

  signavio_get_bpmn: (params) => ({
    revisionId: params.revisionId,
    format: 'BPMN 2.0',
    xml: `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"\n` +
      `  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"\n` +
      `  id="Definitions_1" targetNamespace="http://signavio.com/bpmn20">\n` +
      `  <process id="Process_O2C" name="Order-to-Cash" isExecutable="false">\n` +
      `    <startEvent id="StartEvent_1" name="Sales Order Received"/>\n` +
      `    <userTask id="Task_1" name="Create Sales Order"/>\n` +
      `    <serviceTask id="Task_2" name="Check Credit"/>\n` +
      `    <exclusiveGateway id="Gateway_1" name="Credit Approved?"/>\n` +
      `    <userTask id="Task_3" name="Deliver Goods"/>\n` +
      `    <serviceTask id="Task_4" name="Create Invoice"/>\n` +
      `    <endEvent id="EndEvent_1" name="Payment Received"/>\n` +
      `    <sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1"/>\n` +
      `    <sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Task_2"/>\n` +
      `    <sequenceFlow id="Flow_3" sourceRef="Task_2" targetRef="Gateway_1"/>\n` +
      `    <sequenceFlow id="Flow_4" sourceRef="Gateway_1" targetRef="Task_3"/>\n` +
      `    <sequenceFlow id="Flow_5" sourceRef="Task_3" targetRef="Task_4"/>\n` +
      `    <sequenceFlow id="Flow_6" sourceRef="Task_4" targetRef="EndEvent_1"/>\n` +
      `  </process>\n` +
      `</definitions>`,
  }),

  signavio_parse_process: (params) => ({
    processId: 'Process_O2C',
    processName: 'Order-to-Cash',
    startEvents: [{ id: 'StartEvent_1', name: 'Sales Order Received' }],
    endEvents: [{ id: 'EndEvent_1', name: 'Payment Received' }],
    tasks: [
      { id: 'Task_1', name: 'Create Sales Order', type: 'userTask' },
      { id: 'Task_2', name: 'Check Credit', type: 'serviceTask' },
      { id: 'Task_3', name: 'Deliver Goods', type: 'userTask' },
      { id: 'Task_4', name: 'Create Invoice', type: 'serviceTask' },
    ],
    gateways: [{ id: 'Gateway_1', name: 'Credit Approved?', type: 'exclusiveGateway' }],
    flows: [
      { id: 'Flow_1', source: 'StartEvent_1', target: 'Task_1' },
      { id: 'Flow_2', source: 'Task_1', target: 'Task_2' },
      { id: 'Flow_3', source: 'Task_2', target: 'Gateway_1' },
      { id: 'Flow_4', source: 'Gateway_1', target: 'Task_3' },
      { id: 'Flow_5', source: 'Task_3', target: 'Task_4' },
      { id: 'Flow_6', source: 'Task_4', target: 'EndEvent_1' },
    ],
    metrics: { totalTasks: 4, totalGateways: 1, totalFlows: 6, complexity: 'low' },
  }),

  signavio_map_to_config: (params) => ({
    processName: 'Order-to-Cash',
    configSteps: [
      { step: 1, tcode: 'VA01', activity: 'Create Sales Order', module: 'SD', sapObject: 'VBAK/VBAP', description: 'Create standard sales order with items' },
      { step: 2, tcode: 'FD32', activity: 'Check Credit Limit', module: 'FI', sapObject: 'KNKK', description: 'Automatic credit check against customer credit master' },
      { step: 3, tcode: 'VL01N', activity: 'Deliver Goods', module: 'LE', sapObject: 'LIKP/LIPS', description: 'Create outbound delivery and post goods issue' },
      { step: 4, tcode: 'VF01', activity: 'Create Invoice', module: 'SD-BIL', sapObject: 'VBRK/VBRP', description: 'Create billing document from delivery' },
    ],
    customizingActivities: [
      { imgPath: 'SD > Sales > Sales Documents > Sales Document Types', table: 'TVAK', description: 'Define sales document types' },
      { imgPath: 'FI > AR > Credit Management > Credit Control Area', table: 'T014', description: 'Define credit control areas' },
    ],
    totalSteps: 4,
    coverage: 'full',
  }),

  // ── Pillar 7: Testing Mock Handlers ────────────────────────────────────

  test_generate_from_description: (params) => ({
    description: params.description,
    testCases: [
      { id: 'TC-001', title: 'Happy path - standard flow', type: 'positive', priority: 'high', steps: [{ step: 1, action: 'Enter valid data', expected: 'Data accepted' }, { step: 2, action: 'Submit', expected: 'Success message displayed' }] },
      { id: 'TC-002', title: 'Missing required field', type: 'negative', priority: 'high', steps: [{ step: 1, action: 'Leave required field blank', expected: 'Validation error shown' }] },
      { id: 'TC-003', title: 'Boundary value test', type: 'boundary', priority: 'medium', steps: [{ step: 1, action: 'Enter maximum length value', expected: 'Value accepted within limits' }] },
    ],
    totalGenerated: 3,
  }),

  test_generate_from_config: (params) => ({
    configChanges: params.configChanges,
    testCases: [
      { id: 'TC-CFG-001', title: 'Verify configuration change applied', type: 'positive', priority: 'critical', steps: [{ step: 1, action: 'Navigate to changed configuration', expected: 'New value is active' }, { step: 2, action: 'Execute dependent transaction', expected: 'Transaction uses new config' }] },
      { id: 'TC-CFG-002', title: 'Regression - existing functionality preserved', type: 'regression', priority: 'high', steps: [{ step: 1, action: 'Execute related transaction with existing data', expected: 'No change in behavior for unaffected paths' }] },
    ],
    totalGenerated: 2,
  }),

  test_generate_from_bpmn: (params) => ({
    testScenarios: [
      { id: 'TS-BPMN-001', title: 'Happy path through main process flow', type: 'end-to-end', priority: 'critical', coveredElements: ['StartEvent_1', 'Task_1', 'Task_2', 'Gateway_1', 'Task_3', 'Task_4', 'EndEvent_1'], steps: [{ step: 1, action: 'Trigger start event', expected: 'Process initiated' }, { step: 2, action: 'Complete all tasks in sequence', expected: 'Process reaches end event' }] },
      { id: 'TS-BPMN-002', title: 'Alternative path at gateway', type: 'alternative', priority: 'high', coveredElements: ['StartEvent_1', 'Task_1', 'Task_2', 'Gateway_1'], steps: [{ step: 1, action: 'Trigger negative gateway condition', expected: 'Process follows alternative path' }] },
    ],
    totalScenarios: 2,
    processCoverage: '85%',
  }),

  test_get_template: (params) => ({
    templateId: params.templateId,
    name: 'FI Document Posting Test',
    module: 'FI',
    type: 'integration',
    priority: 'high',
    description: 'End-to-end test for financial document posting in SAP FI module',
    prerequisites: ['Company code configured', 'GL accounts exist', 'Posting period open'],
    steps: [
      { step: 1, tcode: 'FB50', action: 'Create GL account document', input: { docType: 'SA', companyCode: '1000' }, expected: 'Document number generated' },
      { step: 2, tcode: 'FB03', action: 'Display posted document', input: {}, expected: 'Document displayed with correct amounts' },
      { step: 3, tcode: 'FBL3N', action: 'Verify line items in GL', input: {}, expected: 'Line items visible in GL account' },
    ],
    estimatedDuration: '15 min',
  }),

  test_list_templates: (params) => {
    const allTemplates = [
      { templateId: 'TPL-FI-001', name: 'FI Document Posting', module: 'FI', type: 'integration', priority: 'high' },
      { templateId: 'TPL-FI-002', name: 'FI Period Close', module: 'FI', type: 'process', priority: 'critical' },
      { templateId: 'TPL-MM-001', name: 'MM Purchase Order Cycle', module: 'MM', type: 'end-to-end', priority: 'high' },
      { templateId: 'TPL-SD-001', name: 'SD Order-to-Cash', module: 'SD', type: 'end-to-end', priority: 'critical' },
      { templateId: 'TPL-PP-001', name: 'PP Production Order', module: 'PP', type: 'integration', priority: 'medium' },
    ];
    let filtered = allTemplates;
    if (params.module) filtered = filtered.filter(t => t.module === params.module);
    if (params.type) filtered = filtered.filter(t => t.type === params.type);
    if (params.priority) filtered = filtered.filter(t => t.priority === params.priority);
    return { templates: filtered, totalCount: filtered.length };
  },

  test_run_suite: (params) => {
    const cases = params.testCases || [];
    const results = cases.map((tc, idx) => ({
      testCaseId: tc.id || `TC-RUN-${idx + 1}`,
      title: tc.title || `Test Case ${idx + 1}`,
      status: idx % 3 === 2 ? 'failed' : 'passed',
      duration: Math.floor(Math.random() * 5000) + 500,
      assertions: { total: 3, passed: idx % 3 === 2 ? 2 : 3, failed: idx % 3 === 2 ? 1 : 0 },
      error: idx % 3 === 2 ? { message: 'Expected value mismatch', step: 2 } : null,
    }));
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    return {
      suiteId: 'SUITE-' + Date.now().toString(36).toUpperCase(),
      status: failed > 0 ? 'failed' : 'passed',
      results,
      summary: { total: results.length, passed, failed, duration: results.reduce((s, r) => s + r.duration, 0) },
    };
  },

  test_get_report: (params) => ({
    format: params.format || 'json',
    reportId: 'RPT-' + Date.now().toString(36).toUpperCase(),
    generatedAt: new Date().toISOString(),
    summary: {
      totalSuites: 3,
      totalCases: 15,
      passed: 12,
      failed: 2,
      skipped: 1,
      passRate: '80%',
      avgDuration: 2500,
    },
    moduleBreakdown: [
      { module: 'FI', total: 5, passed: 4, failed: 1 },
      { module: 'MM', total: 5, passed: 5, failed: 0 },
      { module: 'SD', total: 5, passed: 3, failed: 1 },
    ],
    failedCases: [
      { id: 'TC-FI-003', title: 'FI posting with blocked period', error: 'Posting period 12/2025 is closed' },
      { id: 'TC-SD-002', title: 'SD pricing with missing condition', error: 'Condition type PR00 not found' },
    ],
  }),

  // ── Pillar 8a: SuccessFactors Mock Handlers ────────────────────────────

  sf_query_entities: (params) => {
    const mockEntities = {
      EmpEmployment: [
        { userId: 'EMP001', personIdExternal: 'P001', startDate: '2020-01-15', jobTitle: 'Senior Consultant', department: 'IT', status: 'active' },
        { userId: 'EMP002', personIdExternal: 'P002', startDate: '2021-06-01', jobTitle: 'Manager', department: 'Finance', status: 'active' },
        { userId: 'EMP003', personIdExternal: 'P003', startDate: '2019-03-10', jobTitle: 'Director', department: 'HR', status: 'active' },
      ],
      FOCompany: [
        { externalCode: 'C001', name: 'ACME Corp', country: 'US', currency: 'USD', status: 'active' },
        { externalCode: 'C002', name: 'ACME GmbH', country: 'DE', currency: 'EUR', status: 'active' },
      ],
    };
    const entities = mockEntities[params.entitySet] || [{ id: '1', name: 'Mock Entity', entitySet: params.entitySet }];
    const top = params.top || 20;
    return { d: { results: entities.slice(0, top) }, entitySet: params.entitySet, totalCount: entities.length };
  },

  sf_get_entity: (params) => ({
    d: {
      entitySet: params.entitySet,
      key: params.key,
      userId: params.key,
      personIdExternal: 'P' + params.key,
      firstName: 'John',
      lastName: 'Doe',
      startDate: '2020-01-15',
      jobTitle: 'Senior Consultant',
      department: 'IT',
      status: 'active',
      email: 'john.doe@example.com',
    },
  }),

  sf_create_entity: (params) => ({
    d: {
      ...params.data,
      __metadata: { uri: `https://api.successfactors.com/odata/v2/${params.entitySet}('${params.data.userId || 'NEW001'}')`, type: `SFOData.${params.entitySet}` },
    },
    status: 'created',
    entitySet: params.entitySet,
  }),

  sf_get_metadata: (params) => {
    const allMetadata = {
      EmpEmployment: {
        entityType: 'EmpEmployment',
        properties: [
          { name: 'userId', type: 'Edm.String', maxLength: 100, nullable: false, key: true },
          { name: 'personIdExternal', type: 'Edm.String', maxLength: 100, nullable: false },
          { name: 'startDate', type: 'Edm.DateTime', nullable: false },
          { name: 'jobTitle', type: 'Edm.String', maxLength: 256, nullable: true },
          { name: 'department', type: 'Edm.String', maxLength: 128, nullable: true },
          { name: 'status', type: 'Edm.String', maxLength: 50, nullable: true },
        ],
        navigationProperties: ['employmentNav', 'personNav'],
      },
      FOCompany: {
        entityType: 'FOCompany',
        properties: [
          { name: 'externalCode', type: 'Edm.String', maxLength: 32, nullable: false, key: true },
          { name: 'name', type: 'Edm.String', maxLength: 256, nullable: true },
          { name: 'country', type: 'Edm.String', maxLength: 3, nullable: true },
          { name: 'currency', type: 'Edm.String', maxLength: 5, nullable: true },
        ],
        navigationProperties: ['countryNav'],
      },
    };
    if (params.entitySet) {
      return { entityTypes: [allMetadata[params.entitySet] || { entityType: params.entitySet, properties: [], navigationProperties: [] }] };
    }
    return { entityTypes: Object.values(allMetadata) };
  },

  sf_batch_operation: (params) => ({
    batchId: 'BATCH-' + Date.now().toString(36).toUpperCase(),
    results: (params.operations || []).map((op, idx) => ({
      operationIndex: idx,
      method: op.method || 'GET',
      entitySet: op.entitySet || 'Unknown',
      status: 'success',
      statusCode: op.method === 'POST' ? 201 : 200,
      body: { d: { id: `RES-${idx + 1}` } },
    })),
    totalOperations: (params.operations || []).length,
    successCount: (params.operations || []).length,
    failureCount: 0,
  }),

  // ── Pillar 8b: Ariba Mock Handlers ─────────────────────────────────────

  ariba_get_purchase_orders: (params) => {
    const allPOs = [
      { poNumber: 'PO-2025-001', vendor: 'V100', vendorName: 'TechSupply Inc.', amount: 45000.00, currency: 'USD', status: 'Approved', createdDate: '2025-11-01' },
      { poNumber: 'PO-2025-002', vendor: 'V200', vendorName: 'OfficeMax Corp.', amount: 12500.00, currency: 'USD', status: 'Pending', createdDate: '2025-11-15' },
      { poNumber: 'PO-2025-003', vendor: 'V300', vendorName: 'CloudWare GmbH', amount: 89000.00, currency: 'EUR', status: 'Approved', createdDate: '2025-12-01' },
    ];
    const filtered = params.status ? allPOs.filter(po => po.status === params.status) : allPOs;
    return { purchaseOrders: filtered.slice(0, params.top || 20), totalCount: filtered.length };
  },

  ariba_get_requisitions: (params) => {
    const allReqs = [
      { reqId: 'REQ-2025-001', title: 'IT Equipment Purchase', requester: 'John Doe', amount: 15000.00, currency: 'USD', status: 'Approved', createdDate: '2025-10-20' },
      { reqId: 'REQ-2025-002', title: 'Office Supplies Q4', requester: 'Jane Smith', amount: 3200.00, currency: 'USD', status: 'Submitted', createdDate: '2025-11-05' },
      { reqId: 'REQ-2025-003', title: 'Cloud License Renewal', requester: 'Bob Wilson', amount: 52000.00, currency: 'USD', status: 'Pending', createdDate: '2025-11-20' },
    ];
    const filtered = params.status ? allReqs.filter(r => r.status === params.status) : allReqs;
    return { requisitions: filtered.slice(0, params.top || 20), totalCount: filtered.length };
  },

  ariba_get_contracts: (params) => {
    const allContracts = [
      { contractId: 'CW-2025-001', title: 'Annual IT Services Agreement', vendor: 'TechConsult AG', value: 250000.00, currency: 'USD', status: 'Active', startDate: '2025-01-01', endDate: '2025-12-31' },
      { contractId: 'CW-2025-002', title: 'Cloud Hosting SLA', vendor: 'CloudWare GmbH', value: 120000.00, currency: 'EUR', status: 'Active', startDate: '2025-03-01', endDate: '2026-02-28' },
      { contractId: 'CW-2025-003', title: 'Office Supply Framework', vendor: 'OfficeMax Corp.', value: 50000.00, currency: 'USD', status: 'Draft', startDate: '2026-01-01', endDate: '2026-12-31' },
    ];
    const filtered = params.status ? allContracts.filter(c => c.status === params.status) : allContracts;
    return { contracts: filtered.slice(0, params.top || 20), totalCount: filtered.length };
  },

  ariba_get_report: (params) => ({
    viewId: params.viewId,
    reportTitle: 'Procurement Analytics Report',
    generatedAt: new Date().toISOString(),
    filters: params.filters || {},
    data: [
      { category: 'Direct Materials', spend: 1250000, poCount: 45, vendorCount: 12 },
      { category: 'IT Services', spend: 890000, poCount: 23, vendorCount: 8 },
      { category: 'Office Supplies', spend: 125000, poCount: 67, vendorCount: 5 },
    ],
    totals: { totalSpend: 2265000, totalPOs: 135, totalVendors: 25 },
  }),

  // ── Pillar 8c: Concur Mock Handlers ────────────────────────────────────

  concur_get_expense_reports: (params) => {
    const allReports = [
      { reportId: 'EXP-2025-001', name: 'Q4 Client Visit - NYC', owner: 'John Doe', amount: 2450.00, currency: 'USD', status: 'Approved', submittedDate: '2025-11-10' },
      { reportId: 'EXP-2025-002', name: 'SAP TechEd Conference', owner: 'Jane Smith', amount: 4800.00, currency: 'USD', status: 'Submitted', submittedDate: '2025-11-22' },
      { reportId: 'EXP-2025-003', name: 'Customer Workshop Berlin', owner: 'Hans Mueller', amount: 3200.00, currency: 'EUR', status: 'Draft', submittedDate: null },
    ];
    const filtered = params.status ? allReports.filter(r => r.status === params.status) : allReports;
    return { expenseReports: filtered.slice(0, params.limit || 20), totalCount: filtered.length };
  },

  concur_get_travel_requests: (params) => {
    const allRequests = [
      { requestId: 'TR-2025-001', name: 'Customer Visit Q1', traveler: 'John Doe', startDate: '2026-01-15', endDate: '2026-01-17', estimatedCost: 1800.00, currency: 'USD', status: 'Approved' },
      { requestId: 'TR-2025-002', name: 'SAP Conference', traveler: 'Jane Smith', startDate: '2026-02-10', endDate: '2026-02-14', estimatedCost: 3500.00, currency: 'USD', status: 'Pending' },
      { requestId: 'TR-2025-003', name: 'Partner Meeting Munich', traveler: 'Hans Mueller', startDate: '2026-03-01', endDate: '2026-03-03', estimatedCost: 2200.00, currency: 'EUR', status: 'Submitted' },
    ];
    const filtered = params.status ? allRequests.filter(r => r.status === params.status) : allRequests;
    return { travelRequests: filtered.slice(0, params.limit || 20), totalCount: filtered.length };
  },

  concur_manage_users: (params) => {
    if (params.action === 'list') {
      return {
        action: 'list',
        users: [
          { userId: 'USR-001', loginId: 'jdoe@example.com', firstName: 'John', lastName: 'Doe', active: true, email: 'jdoe@example.com' },
          { userId: 'USR-002', loginId: 'jsmith@example.com', firstName: 'Jane', lastName: 'Smith', active: true, email: 'jsmith@example.com' },
          { userId: 'USR-003', loginId: 'hmueller@example.com', firstName: 'Hans', lastName: 'Mueller', active: true, email: 'hmueller@example.com' },
        ],
        totalCount: 3,
      };
    }
    if (params.action === 'create') {
      return {
        action: 'create',
        user: { userId: 'USR-NEW', ...(params.data || {}), active: true, createdAt: new Date().toISOString() },
        status: 'created',
      };
    }
    if (params.action === 'update') {
      return {
        action: 'update',
        userId: params.userId,
        updated: params.data || {},
        status: 'updated',
      };
    }
    // deactivate
    return {
      action: 'deactivate',
      userId: params.userId,
      active: false,
      status: 'deactivated',
    };
  },

  concur_create_expense_report: (params) => ({
    reportId: 'EXP-NEW-' + Date.now().toString(36).toUpperCase(),
    name: params.name,
    purpose: params.purpose || '',
    currency: params.currency || 'USD',
    status: 'Draft',
    createdAt: new Date().toISOString(),
    owner: 'Current User',
    entries: [],
    totalAmount: 0,
  }),

  concur_get_lists: (params) => {
    const allLists = [
      { listId: 'LST-001', name: 'Cost Centers', itemCount: 45, isConnected: true, lastUpdated: '2025-11-01T10:00:00Z' },
      { listId: 'LST-002', name: 'Departments', itemCount: 12, isConnected: true, lastUpdated: '2025-10-15T08:30:00Z' },
      { listId: 'LST-003', name: 'Project Codes', itemCount: 78, isConnected: false, lastUpdated: '2025-09-20T14:00:00Z' },
    ];
    if (params.listId) {
      const found = allLists.find(l => l.listId === params.listId);
      return found
        ? { list: found, items: [{ code: 'CC-100', value: 'Engineering' }, { code: 'CC-200', value: 'Finance' }] }
        : { list: null, error: 'List not found' };
    }
    return { lists: allLists, totalCount: allLists.length };
  },

  // ── Pillar 8d: SAC Mock Handlers ───────────────────────────────────────

  sac_get_models: (params) => {
    const allModels = [
      { modelId: 'MOD-FIN-001', name: 'Financial Planning Model', type: 'planning', description: 'Corporate financial planning and forecasting', lastModified: '2025-11-15T10:00:00Z' },
      { modelId: 'MOD-SAL-002', name: 'Sales Analytics', type: 'analytic', description: 'Sales performance and pipeline analysis', lastModified: '2025-12-01T08:30:00Z' },
      { modelId: 'MOD-HR-003', name: 'Workforce Planning', type: 'planning', description: 'Headcount and cost planning model', lastModified: '2025-10-20T14:00:00Z' },
    ];
    if (params.modelId) {
      const found = allModels.find(m => m.modelId === params.modelId);
      return found || { error: 'Model not found', modelId: params.modelId };
    }
    return { models: allModels, totalCount: allModels.length };
  },

  sac_get_stories: (params) => {
    const allStories = [
      { storyId: 'STR-001', name: 'Executive Dashboard', type: 'dashboard', description: 'C-level KPI overview', createdBy: 'Admin', lastModified: '2025-12-01T10:00:00Z' },
      { storyId: 'STR-002', name: 'Sales Performance Report', type: 'report', description: 'Monthly sales analysis with drill-down', createdBy: 'SalesOps', lastModified: '2025-11-20T08:30:00Z' },
      { storyId: 'STR-003', name: 'Workforce Analytics', type: 'dashboard', description: 'HR metrics and workforce insights', createdBy: 'HRAnalyst', lastModified: '2025-11-10T14:00:00Z' },
    ];
    if (params.storyId) {
      const found = allStories.find(s => s.storyId === params.storyId);
      return found || { error: 'Story not found', storyId: params.storyId };
    }
    return { stories: allStories, totalCount: allStories.length };
  },

  sac_import_data: (params) => ({
    modelId: params.modelId,
    importId: 'IMP-' + Date.now().toString(36).toUpperCase(),
    status: 'completed',
    rowsImported: (params.data || []).length,
    rowsFailed: 0,
    warnings: [],
    startedAt: new Date(Date.now() - 5000).toISOString(),
    completedAt: new Date().toISOString(),
  }),

  sac_get_dimensions: (params) => {
    const dimensions = [
      { dimensionId: 'Account', type: 'account', description: 'Account dimension', memberCount: 150 },
      { dimensionId: 'Date', type: 'date', description: 'Time dimension', memberCount: 36 },
      { dimensionId: 'CostCenter', type: 'generic', description: 'Cost center dimension', memberCount: 45 },
      { dimensionId: 'Version', type: 'version', description: 'Planning version', memberCount: 3 },
    ];
    if (params.dimensionId) {
      const found = dimensions.find(d => d.dimensionId === params.dimensionId);
      return {
        modelId: params.modelId,
        dimension: found || { dimensionId: params.dimensionId, type: 'generic', description: 'Unknown', memberCount: 0 },
        members: [
          { id: 'M001', description: 'Member 1', parentId: null },
          { id: 'M002', description: 'Member 2', parentId: 'M001' },
        ],
      };
    }
    return { modelId: params.modelId, dimensions, totalDimensions: dimensions.length };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// McpServer Class
// ─────────────────────────────────────────────────────────────────────────────

class McpServer {
  /**
   * @param {object} [options]
   * @param {object} [options.sapGateway] — SAP gateway instance for live calls
   * @param {string} [options.mode='mock'] — 'mock' or 'live'
   * @param {object} [options.logger]
   */
  constructor(options = {}) {
    this.sapGateway = options.sapGateway || null;
    this.mode = options.mode || 'mock';
    this.log = options.logger || new Logger('mcp-server');
    this._initialized = false;
    this._stdinBuffer = '';
  }

  /**
   * Handle an incoming JSON-RPC 2.0 message.
   * @param {object} message — Parsed JSON-RPC message
   * @returns {object} JSON-RPC response
   */
  async handleMessage(message) {
    if (!message || typeof message !== 'object') {
      return this._errorResponse(null, -32600, 'Invalid Request');
    }

    const { id, method, params } = message;

    if (!method || typeof method !== 'string') {
      return this._errorResponse(id || null, -32600, 'Invalid Request: missing method');
    }

    this.log.debug(`Handling MCP method: ${method}`, { id, params });

    try {
      let result;
      switch (method) {
        case 'initialize':
          result = await this._handleInitialize(params || {});
          break;
        case 'initialized':
          // Notification — no response needed, but return acknowledgment for non-notifications
          this._initialized = true;
          if (id !== undefined && id !== null) {
            return this._successResponse(id, {});
          }
          return null; // Notification: no response
        case 'tools/list':
          result = await this._handleToolsList();
          break;
        case 'tools/call':
          if (!params || !params.name) {
            return this._errorResponse(id, -32602, 'Invalid params: missing tool name');
          }
          result = await this._handleToolsCall(params.name, params.arguments || {});
          break;
        case 'resources/list':
          result = await this._handleResourcesList();
          break;
        case 'resources/read':
          if (!params || !params.uri) {
            return this._errorResponse(id, -32602, 'Invalid params: missing resource URI');
          }
          result = await this._handleResourcesRead(params.uri);
          break;
        case 'ping':
          result = {};
          break;
        default:
          return this._errorResponse(id, -32601, `Method not found: ${method}`);
      }
      return this._successResponse(id, result);
    } catch (err) {
      this.log.error(`Error handling ${method}: ${err.message}`);
      return this._errorResponse(id, -32603, err.message);
    }
  }

  /**
   * Handle initialize request. Returns server capabilities.
   * @param {object} params — Client capabilities and info
   * @returns {object} Server capabilities
   */
  async _handleInitialize(params) {
    this.log.info('MCP initialize', { clientInfo: params.clientInfo });
    this._initialized = true;
    return {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
      },
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
    };
  }

  /**
   * Handle tools/list request. Returns all available tools with schemas.
   * @returns {object} Tools list
   */
  async _handleToolsList() {
    const allTools = [...TOOL_DEFINITIONS, ...INFOR_TOOL_DEFINITIONS];
    return {
      tools: allTools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    };
  }

  /**
   * Handle tools/call request. Dispatches to tool handler.
   * @param {string} name — Tool name
   * @param {object} args — Tool arguments
   * @returns {object} Tool result
   */
  async _handleToolsCall(name, args) {
    const allTools = [...TOOL_DEFINITIONS, ...INFOR_TOOL_DEFINITIONS];
    const toolDef = allTools.find(t => t.name === name);
    if (!toolDef) {
      throw new Error(`Unknown tool: ${name}`);
    }

    this.log.info(`Tool call: ${name}`, { arguments: args });

    // Infor tools are handled by InforToolHandlers
    if (name.startsWith('infor_')) {
      if (!this._inforHandlers) {
        this._inforHandlers = new InforToolHandlers({ mode: this.mode, logger: this.log });
      }
      const result = await this._inforHandlers.handle(name, args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (this.mode === 'live' && this.sapGateway) {
      return this._handleLiveToolCall(name, args);
    }

    return this._handleMockToolCall(name, args);
  }

  /**
   * Handle resources/list request.
   * @returns {object} Resources list
   */
  async _handleResourcesList() {
    return {
      resources: RESOURCE_DEFINITIONS.map(r => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
    };
  }

  /**
   * Handle resources/read request.
   * @param {string} uri — Resource URI
   * @returns {object} Resource contents
   */
  async _handleResourcesRead(uri) {
    this.log.info(`Resource read: ${uri}`);

    const systemInfoMatch = uri === 'sap://system/info';
    const objectMatch = uri.match(/^sap:\/\/objects\/([^/]+)\/(.+)$/);
    const structureMatch = uri.match(/^sap:\/\/tables\/([^/]+)\/structure$/);
    const dataMatch = uri.match(/^sap:\/\/tables\/([^/]+)\/data$/);

    let content;

    if (systemInfoMatch) {
      const result = this.mode === 'live' && this.sapGateway
        ? await this._liveGetSystemInfo()
        : MOCK_DATA.getSystemInfo();
      content = JSON.stringify(result, null, 2);
    } else if (objectMatch) {
      const type = objectMatch[1];
      const name = objectMatch[2];
      const objectUri = `/sap/bc/adt/${this._typeToAdtPath(type)}/${name}`;
      const result = this.mode === 'live' && this.sapGateway
        ? await this._liveGetSource({ objectUri })
        : MOCK_DATA.getSource({ objectUri });
      content = result.source;
    } else if (structureMatch) {
      const tableName = structureMatch[1];
      const result = this.mode === 'live' && this.sapGateway
        ? await this._liveGetTableStructure({ tableName })
        : MOCK_DATA.getTableStructure({ tableName });
      content = JSON.stringify(result, null, 2);
    } else if (dataMatch) {
      const tableName = dataMatch[1];
      const result = this.mode === 'live' && this.sapGateway
        ? await this._liveGetTableData({ tableName, maxRows: 10 })
        : MOCK_DATA.getTableData({ tableName, maxRows: 10 });
      content = JSON.stringify(result, null, 2);
    } else {
      throw new Error(`Unknown resource URI: ${uri}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: uri.includes('/structure') || uri.includes('/data') || uri === 'sap://system/info'
            ? 'application/json'
            : 'text/plain',
          text: content,
        },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mock Tool Handlers
  // ─────────────────────────────────────────────────────────────────────────

  _handleMockToolCall(name, args) {
    const handler = MOCK_DATA[name];
    if (!handler) {
      throw new Error(`No mock handler for tool: ${name}`);
    }
    const result = handler(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Live Tool Handlers
  // ─────────────────────────────────────────────────────────────────────────

  async _handleLiveToolCall(name, args) {
    let result;
    switch (name) {
      case 'searchObject':
        result = await this._liveSearchObject(args);
        break;
      case 'getSource':
        result = await this._liveGetSource(args);
        break;
      case 'writeSource':
        result = await this._liveWriteSource(args);
        break;
      case 'getTableStructure':
        result = await this._liveGetTableStructure(args);
        break;
      case 'getTableData':
        result = await this._liveGetTableData(args);
        break;
      case 'getRelationships':
        result = await this._liveGetRelationships(args);
        break;
      case 'getFunctionInterface':
        result = await this._liveGetFunctionInterface(args);
        break;
      case 'callBAPI':
        result = await this._liveCallBAPI(args);
        break;
      case 'runATCCheck':
        result = await this._liveRunATCCheck(args);
        break;
      case 'manageTransport':
        result = await this._liveManageTransport(args);
        break;
      case 'getCDSView':
        result = await this._liveGetCDSView(args);
        break;
      case 'getSystemInfo':
        result = await this._liveGetSystemInfo();
        break;

      // ── Pillar 6: Signavio ───────────────────────────────────────────
      case 'signavio_list_models':
        result = await this.sapGateway.signavioClient.listModels(args.folderId);
        break;
      case 'signavio_get_model':
        result = await this.sapGateway.signavioClient.getModel(args.revisionId);
        break;
      case 'signavio_search_models':
        result = await this.sapGateway.signavioClient.searchModels(args.query);
        break;
      case 'signavio_get_bpmn':
        result = await this.sapGateway.signavioClient.exportBpmn(args.revisionId);
        break;
      case 'signavio_parse_process':
        result = await this.sapGateway.signavioClient.parseProcess(args.bpmnXml);
        break;
      case 'signavio_map_to_config':
        result = await this.sapGateway.signavioClient.mapToConfig(args.bpmnXml);
        break;

      // ── Pillar 7: Testing ────────────────────────────────────────────
      case 'test_generate_from_description':
        result = await this.sapGateway.testEngine.generateFromDescription(args.description);
        break;
      case 'test_generate_from_config':
        result = await this.sapGateway.testEngine.generateFromConfig(args.configChanges);
        break;
      case 'test_generate_from_bpmn':
        result = await this.sapGateway.testEngine.generateFromBpmn(args.bpmnXml);
        break;
      case 'test_get_template':
        result = await this.sapGateway.testEngine.getTemplate(args.templateId);
        break;
      case 'test_list_templates':
        result = await this.sapGateway.testEngine.listTemplates({ module: args.module, type: args.type, priority: args.priority });
        break;
      case 'test_run_suite':
        result = await this.sapGateway.testEngine.runSuite(args.testCases);
        break;
      case 'test_get_report':
        result = await this.sapGateway.testEngine.getReport(args.format);
        break;

      // ── Pillar 8a: SuccessFactors ────────────────────────────────────
      case 'sf_query_entities':
        result = await this.sapGateway.sfClient.query(args.entitySet, { filter: args.filter, select: args.select, top: args.top });
        break;
      case 'sf_get_entity':
        result = await this.sapGateway.sfClient.getEntity(args.entitySet, args.key);
        break;
      case 'sf_create_entity':
        result = await this.sapGateway.sfClient.createEntity(args.entitySet, args.data);
        break;
      case 'sf_get_metadata':
        result = await this.sapGateway.sfClient.getMetadata(args.entitySet);
        break;
      case 'sf_batch_operation':
        result = await this.sapGateway.sfClient.batch(args.operations);
        break;

      // ── Pillar 8b: Ariba ─────────────────────────────────────────────
      case 'ariba_get_purchase_orders':
        result = await this.sapGateway.aribaClient.getPurchaseOrders({ status: args.status, top: args.top });
        break;
      case 'ariba_get_requisitions':
        result = await this.sapGateway.aribaClient.getRequisitions({ status: args.status, top: args.top });
        break;
      case 'ariba_get_contracts':
        result = await this.sapGateway.aribaClient.getContracts({ status: args.status, top: args.top });
        break;
      case 'ariba_get_report':
        result = await this.sapGateway.aribaClient.getReport(args.viewId, args.filters);
        break;

      // ── Pillar 8c: Concur ────────────────────────────────────────────
      case 'concur_get_expense_reports':
        result = await this.sapGateway.concurClient.getExpenseReports({ status: args.status, limit: args.limit });
        break;
      case 'concur_get_travel_requests':
        result = await this.sapGateway.concurClient.getTravelRequests({ status: args.status, limit: args.limit });
        break;
      case 'concur_manage_users':
        result = await this.sapGateway.concurClient.manageUsers(args.action, { userId: args.userId, data: args.data });
        break;
      case 'concur_create_expense_report':
        result = await this.sapGateway.concurClient.createExpenseReport({ name: args.name, purpose: args.purpose, currency: args.currency });
        break;
      case 'concur_get_lists':
        result = await this.sapGateway.concurClient.getLists(args.listId);
        break;

      // ── Pillar 8d: SAC ───────────────────────────────────────────────
      case 'sac_get_models':
        result = await this.sapGateway.sacClient.getModels(args.modelId);
        break;
      case 'sac_get_stories':
        result = await this.sapGateway.sacClient.getStories(args.storyId);
        break;
      case 'sac_import_data':
        result = await this.sapGateway.sacClient.importData(args.modelId, args.data);
        break;
      case 'sac_get_dimensions':
        result = await this.sapGateway.sacClient.getDimensions(args.modelId, args.dimensionId);
        break;

      default:
        throw new Error(`No live handler for tool: ${name}`);
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async _liveSearchObject(args) {
    const adt = this.sapGateway.adtClient;
    const results = await adt.search(args.query, {
      objectType: args.objectType,
      maxResults: args.maxResults || 50,
    });
    return { results, totalResults: results.length, query: args.query };
  }

  async _liveGetSource(args) {
    const adt = this.sapGateway.adtClient;
    const source = await adt.getObjectSource(args.objectUri);
    return { uri: args.objectUri, source, language: 'abap', length: source.length };
  }

  async _liveWriteSource(args) {
    const adt = this.sapGateway.adtClient;
    const lockToken = await adt.lock(args.objectUri);
    try {
      await adt.writeObjectSource(args.objectUri, args.source, lockToken);
      return { uri: args.objectUri, status: 'saved', lockToken, timestamp: new Date().toISOString(), warnings: [] };
    } finally {
      await adt.unlock(args.objectUri, lockToken).catch(() => {});
    }
  }

  async _liveGetTableStructure(args) {
    const tableIntel = this.sapGateway.tableIntelligence;
    const structure = await tableIntel.getFieldInfo(args.tableName);
    return structure;
  }

  async _liveGetTableData(args) {
    const tableReader = this.sapGateway.tableReader;
    const result = await tableReader.readTable(args.tableName, {
      fields: args.fields,
      where: args.where,
      maxRows: args.maxRows || 100,
    });
    return { tableName: args.tableName, ...result, where: args.where || null };
  }

  async _liveGetRelationships(args) {
    const tableIntel = this.sapGateway.tableIntelligence;
    const relationships = await tableIntel.discoverForeignKeys(args.tableName, { depth: args.depth || 1 });
    return { tableName: args.tableName, depth: args.depth || 1, relationships, totalRelationships: relationships.length };
  }

  async _liveGetFunctionInterface(args) {
    const functionCaller = this.sapGateway.functionCaller;
    return functionCaller.getInterface(args.functionModule);
  }

  async _liveCallBAPI(args) {
    const functionCaller = this.sapGateway.functionCaller;
    const startTime = Date.now();
    let result;
    if (args.withCommit) {
      result = await functionCaller.callWithCommit(args.functionModule, args.imports || {});
    } else {
      result = await functionCaller.call(args.functionModule, args.imports || {}, args.tables || {});
    }
    return {
      functionModule: args.functionModule,
      result,
      committed: args.withCommit || false,
      executionTime: Date.now() - startTime,
    };
  }

  async _liveRunATCCheck(args) {
    const adt = this.sapGateway.adtClient;
    const result = await adt.runAtcCheck(args.objectSet, { checkVariant: args.checkVariant || 'S4HANA_READINESS' });
    return result;
  }

  async _liveManageTransport(args) {
    const adt = this.sapGateway.adtClient;
    switch (args.action) {
      case 'create':
        return adt.createTransport({ description: args.description, type: args.type || 'workbench' });
      case 'release':
        return adt.releaseTransport(args.transportNumber);
      case 'check':
        return adt.checkTransport(args.transportNumber);
      case 'list':
        return adt.listTransports();
      default:
        throw new Error(`Unknown transport action: ${args.action}`);
    }
  }

  async _liveGetCDSView(args) {
    const adt = this.sapGateway.adtClient;
    const source = await adt.getObjectSource(`/sap/bc/adt/ddic/ddl/sources/${args.cdsName.toLowerCase()}`);
    return { cdsName: args.cdsName, source, annotations: [], associations: [] };
  }

  async _liveGetSystemInfo() {
    const functionCaller = this.sapGateway.functionCaller;
    const result = await functionCaller.call('RFC_SYSTEM_INFO');
    const info = result.RFCSI_EXPORT || result;
    return {
      systemId: (info.RFCSYSID || '').trim(),
      client: (info.RFCCLIENT || '').trim(),
      host: (info.RFCHOST || '').trim(),
      release: (info.RFCSAPRL || '').trim(),
      database: (info.RFCDBSYS || '').trim(),
      operatingSystem: (info.RFCOPSYS || '').trim(),
      kernel: (info.RFCKERNRL || '').trim(),
      unicode: info.RFCUNICODE === 'X',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Stdio Transport
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start stdio transport. Reads from stdin, writes responses to stdout.
   * @param {object} [options]
   * @param {object} [options.stdin] — Readable stream (default: process.stdin)
   * @param {object} [options.stdout] — Writable stream (default: process.stdout)
   * @returns {Promise<void>}
   */
  startStdio(options = {}) {
    const stdin = options.stdin || process.stdin;
    const stdout = options.stdout || process.stdout;

    this.log.info('MCP stdio transport started');

    stdin.setEncoding('utf8');

    stdin.on('data', async (chunk) => {
      this._stdinBuffer += chunk;
      const lines = this._stdinBuffer.split('\n');
      // Keep the last incomplete line in the buffer
      this._stdinBuffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const response = await this.processLine(trimmed);
        if (response) {
          stdout.write(JSON.stringify(response) + '\n');
        }
      }
    });

    stdin.on('end', () => {
      this.log.info('MCP stdin closed');
    });

    return new Promise((resolve) => {
      stdin.on('end', resolve);
      stdin.on('close', resolve);
    });
  }

  /**
   * Process a single line of JSON-RPC input.
   * @param {string} line — Raw JSON string
   * @returns {object|null} JSON-RPC response, or null for notifications
   */
  async processLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch (err) {
      return this._errorResponse(null, -32700, 'Parse error: invalid JSON');
    }

    if (message.jsonrpc !== '2.0') {
      return this._errorResponse(message.id || null, -32600, 'Invalid Request: jsonrpc must be "2.0"');
    }

    const response = await this.handleMessage(message);
    return response;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  _successResponse(id, result) {
    return {
      jsonrpc: '2.0',
      id: id !== undefined ? id : null,
      result,
    };
  }

  _errorResponse(id, code, message) {
    return {
      jsonrpc: '2.0',
      id: id !== undefined ? id : null,
      error: {
        code,
        message,
      },
    };
  }

  _typeToAdtPath(type) {
    const map = {
      PROG: 'programs/programs',
      CLAS: 'oo/classes',
      INTF: 'oo/interfaces',
      FUGR: 'functions/groups',
      FUNC: 'functions/groups',
      TABL: 'dictionary/structures',
      DTEL: 'dictionary/dataelements',
      DOMA: 'dictionary/domains',
      DDLS: 'ddic/ddl/sources',
      TTYP: 'dictionary/tabletypes',
    };
    return map[type] || `repository/${type.toLowerCase()}`;
  }
}

module.exports = McpServer;
