/**
 * MCP Migration Tool Handlers
 *
 * Handler functions for each of the 8 migration MCP tools.
 * Mock mode returns realistic SAP ETLV migration data; live mode will
 * connect to actual migration framework when available.
 */

'use strict';

const Logger = require('../logger');

// ─────────────────────────────────────────────────────────────────────────────
// Migration Object Catalog (mock data)
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATION_OBJECTS = [
  { id: 'GL_ACCOUNT', name: 'G/L Account', category: 'config', sourceTable: 'SKA1/SKB1', targetBapi: 'BAPI_GL_ACCOUNT_CREATEMODIFY', priority: 1, dependencies: [] },
  { id: 'COST_CENTER', name: 'Cost Center', category: 'config', sourceTable: 'CSKS/CSKT', targetBapi: 'BAPI_COSTCENTER_CREATEMULTIPLE', priority: 1, dependencies: [] },
  { id: 'PROFIT_CENTER', name: 'Profit Center', category: 'config', sourceTable: 'CEPC/CEPCT', targetBapi: 'BAPI_PROFITCENTER_CREATE', priority: 1, dependencies: [] },
  { id: 'CUSTOMER_MASTER', name: 'Customer Master', category: 'master-data', sourceTable: 'KNA1/KNB1/KNVV', targetBapi: 'BAPI_BUPA_CREATE_FROM_DATA', priority: 2, dependencies: ['GL_ACCOUNT', 'COST_CENTER'] },
  { id: 'VENDOR_MASTER', name: 'Vendor Master', category: 'master-data', sourceTable: 'LFA1/LFB1/LFM1', targetBapi: 'BAPI_BUPA_CREATE_FROM_DATA', priority: 2, dependencies: ['GL_ACCOUNT', 'COST_CENTER'] },
  { id: 'MATERIAL_MASTER', name: 'Material Master', category: 'master-data', sourceTable: 'MARA/MARC/MARD', targetBapi: 'BAPI_MATERIAL_SAVEDATA', priority: 3, dependencies: ['CUSTOMER_MASTER', 'VENDOR_MASTER'] },
  { id: 'BOM', name: 'Bill of Materials', category: 'master-data', sourceTable: 'STKO/STPO', targetBapi: 'CSAP_MAT_BOM_CREATE', priority: 3, dependencies: ['MATERIAL_MASTER'] },
  { id: 'ROUTING', name: 'Routing', category: 'master-data', sourceTable: 'PLKO/PLPO', targetBapi: 'BAPI_ROUTING_CREATE', priority: 4, dependencies: ['MATERIAL_MASTER', 'COST_CENTER'] },
  { id: 'CONDITION_RECORD', name: 'Condition Record (Pricing)', category: 'master-data', sourceTable: 'KONP/KONH', targetBapi: 'BAPI_PRICES_CONDITIONS', priority: 4, dependencies: ['CUSTOMER_MASTER', 'MATERIAL_MASTER'] },
  { id: 'SALES_ORDER', name: 'Sales Order', category: 'transactional', sourceTable: 'VBAK/VBAP', targetBapi: 'BAPI_SALESORDER_CREATEFROMDAT2', priority: 5, dependencies: ['CUSTOMER_MASTER', 'MATERIAL_MASTER'] },
  { id: 'PURCHASE_ORDER', name: 'Purchase Order', category: 'transactional', sourceTable: 'EKKO/EKPO', targetBapi: 'BAPI_PO_CREATE1', priority: 5, dependencies: ['VENDOR_MASTER', 'MATERIAL_MASTER'] },
];

class MigrationToolHandlers {
  /**
   * @param {object} [options]
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   * @param {object} [options.sessionContext] - MCP session context
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.sessionContext = options.sessionContext || null;
    this.logger = options.logger || new Logger('mcp-migration-handlers');

    /** @type {object|null} Lazily created SafetyGatesBridge */
    this._safetyBridge = null;
  }

  /**
   * Route a tool call to the correct handler.
   * @param {string} toolName - Tool name (e.g., 'migration_list_objects')
   * @param {object} params - Tool parameters
   * @returns {object} Result payload
   */
  async handle(toolName, params) {
    const handlerName = `_handle_${toolName}`;
    const handler = this[handlerName];
    if (!handler) {
      throw new Error(`Unknown migration tool: ${toolName}`);
    }
    this.logger.debug(`Handling ${toolName}`, { params });
    const result = await handler.call(this, params || {});
    this.logger.debug(`Completed ${toolName}`, { resultKeys: Object.keys(result) });
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Read-Only Tools
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List all migration object types, optionally filtered by category.
   * @param {object} params
   * @param {string} [params.category] - Filter by category
   * @returns {object} Object list
   */
  async _handle_migration_list_objects(params) {
    const { category } = params;
    let objects = MIGRATION_OBJECTS.map(obj => ({
      id: obj.id,
      name: obj.name,
      category: obj.category,
      sourceTable: obj.sourceTable,
      targetBapi: obj.targetBapi,
      priority: obj.priority,
      dependencies: obj.dependencies,
    }));

    if (category) {
      objects = objects.filter(obj => obj.category === category);
    }

    return {
      totalObjects: 42,
      objects,
    };
  }

  /**
   * Get details of a specific migration object.
   * @param {object} params
   * @param {string} params.objectId - Migration object ID
   * @returns {object} Object details with sample field mappings
   */
  async _handle_migration_get_object(params) {
    const { objectId } = params;
    const obj = MIGRATION_OBJECTS.find(o => o.id === objectId);

    if (!obj) {
      return { error: 'not_found', message: `Migration object '${objectId}' not found` };
    }

    // Sample field mappings per object type
    const sampleMappings = {
      CUSTOMER_MASTER: [
        { source: 'KNA1-KUNNR', target: 'BP_NUMBER', transform: 'padLeft10', notes: 'Customer number to Business Partner' },
        { source: 'KNA1-NAME1', target: 'BUT000-NAME_ORG1', transform: 'truncate40', notes: 'Customer name to BP org name' },
        { source: 'KNA1-LAND1', target: 'BUT000-PARTNER_COUNTRY', transform: 'direct', notes: 'Country code direct mapping' },
        { source: 'KNB1-AKONT', target: 'DFKKBPTAXNUM-TAXNUM', transform: 'accountLookup', notes: 'Reconciliation account mapping' },
      ],
      MATERIAL_MASTER: [
        { source: 'MARA-MATNR', target: 'MARA-MATNR', transform: 'padLeft40', notes: 'Material number — extended to 40 chars in S/4' },
        { source: 'MARA-MTART', target: 'MARA-MTART', transform: 'valueMap', notes: 'Material type mapping (e.g., FERT, HALB, ROH)' },
        { source: 'MARA-MEINS', target: 'MARA-MEINS', transform: 'uomMap', notes: 'Base unit of measure' },
      ],
      GL_ACCOUNT: [
        { source: 'SKA1-SAKNR', target: 'SKA1-SAKNR', transform: 'padLeft10', notes: 'G/L account number' },
        { source: 'SKA1-KTOKS', target: 'SKA1-KTOKS', transform: 'valueMap', notes: 'Account group mapping' },
        { source: 'SKB1-WAERS', target: 'SKB1-WAERS', transform: 'direct', notes: 'Currency code direct' },
      ],
      VENDOR_MASTER: [
        { source: 'LFA1-LIFNR', target: 'BP_NUMBER', transform: 'padLeft10', notes: 'Vendor to Business Partner conversion' },
        { source: 'LFA1-NAME1', target: 'BUT000-NAME_ORG1', transform: 'truncate40', notes: 'Vendor name to BP org name' },
        { source: 'LFA1-LAND1', target: 'BUT000-PARTNER_COUNTRY', transform: 'direct', notes: 'Country code direct mapping' },
      ],
    };

    const defaultMapping = [
      { source: `${obj.sourceTable.split('/')[0]}-KEY`, target: 'TARGET-KEY', transform: 'direct', notes: 'Primary key mapping' },
      { source: `${obj.sourceTable.split('/')[0]}-DESC`, target: 'TARGET-DESC', transform: 'truncate40', notes: 'Description field' },
      { source: `${obj.sourceTable.split('/')[0]}-STATUS`, target: 'TARGET-STATUS', transform: 'valueMap', notes: 'Status mapping' },
    ];

    return {
      objectId: obj.id,
      name: obj.name,
      category: obj.category,
      description: `ETLV migration object for ${obj.name} — extracts from ${obj.sourceTable}, transforms to S/4HANA format, validates, and loads via ${obj.targetBapi}`,
      sourceSystem: 'ECC',
      targetSystem: 'S4HANA',
      sourceTable: obj.sourceTable,
      targetBapi: obj.targetBapi,
      fieldMappings: objectId === 'CUSTOMER_MASTER' ? 34 : objectId === 'MATERIAL_MASTER' ? 48 : 22,
      transformRules: objectId === 'CUSTOMER_MASTER' ? 18 : objectId === 'MATERIAL_MASTER' ? 26 : 12,
      validationRules: objectId === 'CUSTOMER_MASTER' ? 15 : objectId === 'MATERIAL_MASTER' ? 22 : 10,
      dependencies: obj.dependencies,
      sampleMapping: sampleMappings[objectId] || defaultMapping,
      status: 'ready',
    };
  }

  /**
   * Get the dependency graph as execution waves.
   * @returns {object} Wave-based dependency graph
   */
  async _handle_migration_get_dependency_graph() {
    return {
      waves: [
        { wave: 1, objects: ['GL_ACCOUNT', 'COST_CENTER', 'PROFIT_CENTER'], parallel: true },
        { wave: 2, objects: ['CUSTOMER_MASTER', 'VENDOR_MASTER'], parallel: true },
        { wave: 3, objects: ['MATERIAL_MASTER', 'BOM'], parallel: false },
        { wave: 4, objects: ['SALES_ORDER', 'PURCHASE_ORDER'], parallel: true },
      ],
      totalWaves: 4,
      totalObjects: 11,
    };
  }

  /**
   * Get flat execution order respecting dependencies.
   * @returns {object} Ordered list of migration objects
   */
  async _handle_migration_get_execution_order() {
    return {
      order: [
        { position: 1, objectId: 'GL_ACCOUNT', dependencies: [] },
        { position: 2, objectId: 'COST_CENTER', dependencies: [] },
        { position: 3, objectId: 'PROFIT_CENTER', dependencies: [] },
        { position: 4, objectId: 'CUSTOMER_MASTER', dependencies: ['GL_ACCOUNT', 'COST_CENTER'] },
        { position: 5, objectId: 'VENDOR_MASTER', dependencies: ['GL_ACCOUNT', 'COST_CENTER'] },
        { position: 6, objectId: 'MATERIAL_MASTER', dependencies: ['CUSTOMER_MASTER', 'VENDOR_MASTER'] },
        { position: 7, objectId: 'BOM', dependencies: ['MATERIAL_MASTER'] },
        { position: 8, objectId: 'ROUTING', dependencies: ['MATERIAL_MASTER', 'COST_CENTER'] },
        { position: 9, objectId: 'CONDITION_RECORD', dependencies: ['CUSTOMER_MASTER', 'MATERIAL_MASTER'] },
        { position: 10, objectId: 'SALES_ORDER', dependencies: ['CUSTOMER_MASTER', 'MATERIAL_MASTER'] },
        { position: 11, objectId: 'PURCHASE_ORDER', dependencies: ['VENDOR_MASTER', 'MATERIAL_MASTER'] },
      ],
    };
  }

  /**
   * Reconcile source vs target data after migration.
   * @param {object} params
   * @param {string} [params.objectId] - Specific object or all if omitted
   * @returns {object} Reconciliation results
   */
  async _handle_migration_reconcile(params) {
    const { objectId } = params;

    const allReconciliation = [
      { objectId: 'GL_ACCOUNT', sourceCount: 2450, targetCount: 2448, matched: 2445, mismatched: 3, missing: 2, extra: 0, matchRate: 99.8 },
      { objectId: 'COST_CENTER', sourceCount: 850, targetCount: 850, matched: 850, mismatched: 0, missing: 0, extra: 0, matchRate: 100.0 },
      { objectId: 'CUSTOMER_MASTER', sourceCount: 12500, targetCount: 12487, matched: 12480, mismatched: 7, missing: 13, extra: 0, matchRate: 99.8 },
      { objectId: 'VENDOR_MASTER', sourceCount: 4200, targetCount: 4198, matched: 4195, mismatched: 3, missing: 2, extra: 0, matchRate: 99.9 },
      { objectId: 'MATERIAL_MASTER', sourceCount: 45000, targetCount: 44985, matched: 44970, mismatched: 15, missing: 15, extra: 0, matchRate: 99.9 },
    ];

    let reconciliation;
    if (objectId) {
      const rec = allReconciliation.find(r => r.objectId === objectId);
      reconciliation = rec ? [rec] : [{ objectId, sourceCount: 0, targetCount: 0, matched: 0, mismatched: 0, missing: 0, extra: 0, matchRate: 0 }];
    } else {
      reconciliation = allReconciliation;
    }

    const totalSource = reconciliation.reduce((sum, r) => sum + r.sourceCount, 0);
    const totalMatched = reconciliation.reduce((sum, r) => sum + r.matched, 0);
    const overallMatchRate = totalSource > 0 ? Math.round((totalMatched / totalSource) * 1000) / 10 : 0;

    const issues = [
      { objectId: 'GL_ACCOUNT', type: 'missing', key: 'SAKNR=0000199901', details: 'Account marked for deletion in source, skipped during migration' },
      { objectId: 'GL_ACCOUNT', type: 'missing', key: 'SAKNR=0000199902', details: 'Account marked for deletion in source, skipped during migration' },
      { objectId: 'CUSTOMER_MASTER', type: 'mismatch', key: 'KUNNR=0000012345', details: 'Address data differs — source updated after extraction cutoff' },
      { objectId: 'MATERIAL_MASTER', type: 'missing', key: 'MATNR=000000000000000100', details: 'Material type UNBW not mapped in target system' },
    ];

    const filteredIssues = objectId ? issues.filter(i => i.objectId === objectId) : issues;

    return {
      objectId: objectId || 'ALL',
      reconciliation,
      overallMatchRate,
      issues: filteredIssues,
    };
  }

  /**
   * Get migration statistics.
   * @returns {object} Aggregate migration stats
   */
  async _handle_migration_get_stats() {
    return {
      totalObjects: 42,
      objectsByCategory: {
        'master-data': 15,
        transactional: 12,
        config: 10,
        hierarchy: 5,
      },
      totalFieldMappings: 881,
      totalTransformRules: 423,
      totalValidationRules: 312,
      estimatedRecords: 2450000,
      coveragePercent: 94,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Write Operations (safety-gated)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Run ETLV for a single migration object.
   * @param {object} params
   * @param {string} params.objectId - Migration object ID
   * @param {boolean} [params.dryRun=true] - Dry-run mode
   * @param {number} [params.limit=100] - Record limit
   * @returns {object} ETLV execution results
   */
  async _handle_migration_run_object(params) {
    const { objectId, limit } = params;
    const dryRun = params.dryRun !== false;
    const maxRecords = limit || 100;

    // Safety gate check for write operations
    if (!this._safetyBridge) {
      const SafetyGatesBridge = require('./safety-gates-bridge');
      this._safetyBridge = new SafetyGatesBridge({ mode: this.mode });
    }
    const safety = await this._safetyBridge.check({
      toolName: 'migration_run_object',
      operation: 'Run ETLV migration',
      dryRun,
    });
    if (!safety.allowed) {
      return { error: 'blocked', reason: safety.reason, gateResults: safety.gateResults };
    }

    const obj = MIGRATION_OBJECTS.find(o => o.id === objectId);
    if (!obj) {
      return { error: 'not_found', message: `Migration object '${objectId}' not found` };
    }

    const recordsProcessed = Math.min(maxRecords, 100);
    const extracted = recordsProcessed;
    const transformed = recordsProcessed - 2;
    const validated = transformed - 1;

    return {
      objectId,
      dryRun,
      status: 'completed',
      recordsProcessed,
      extracted,
      transformed,
      validated,
      loaded: dryRun ? 0 : recordsProcessed,
      errors: [
        { record: `${objectId}-REC-047`, field: 'CURRENCY', error: 'Invalid currency code: XYZ — not found in T005' },
        { record: `${objectId}-REC-083`, field: 'UNIT', error: 'Unknown unit of measure: DRUM — not found in T006' },
      ],
      warnings: 5,
      duration: `${(recordsProcessed * 0.023).toFixed(1)}s`,
      humanDecisionsRequired: [
        {
          id: `HD-${objectId}-001`,
          category: 'data-mapping',
          question: `Field LEGACY_STATUS has 3 unmapped values (X, Y, Z) — how should they map to S/4HANA status?`,
          options: ['Map all to inactive', 'Map X=active, Y/Z=inactive', 'Skip unmapped records', 'Fail migration'],
          impact: `Affects ${Math.floor(recordsProcessed * 0.03)} records`,
          blocking: true,
        },
      ],
    };
  }

  /**
   * Run ETLV for all migration objects in dependency order.
   * @param {object} params
   * @param {boolean} [params.dryRun=true] - Dry-run mode
   * @param {number} [params.limit=100] - Record limit per object
   * @returns {object} Full migration run results
   */
  async _handle_migration_run_all(params) {
    const { limit } = params;
    const dryRun = params.dryRun !== false;
    const maxRecords = limit || 100;

    // Safety gate check for write operations
    if (!this._safetyBridge) {
      const SafetyGatesBridge = require('./safety-gates-bridge');
      this._safetyBridge = new SafetyGatesBridge({ mode: this.mode });
    }
    const safety = await this._safetyBridge.check({
      toolName: 'migration_run_all',
      operation: 'Run ETLV migration for all objects',
      dryRun,
    });
    if (!safety.allowed) {
      return { error: 'blocked', reason: safety.reason, gateResults: safety.gateResults };
    }

    const totalRecords = MIGRATION_OBJECTS.length * maxRecords;

    return {
      dryRun,
      status: 'completed',
      waves: [
        { wave: 1, objects: ['GL_ACCOUNT', 'COST_CENTER', 'PROFIT_CENTER'], status: 'completed' },
        { wave: 2, objects: ['CUSTOMER_MASTER', 'VENDOR_MASTER'], status: 'completed' },
        { wave: 3, objects: ['MATERIAL_MASTER', 'BOM'], status: 'completed' },
        { wave: 4, objects: ['ROUTING', 'CONDITION_RECORD'], status: 'completed' },
        { wave: 5, objects: ['SALES_ORDER', 'PURCHASE_ORDER'], status: 'completed' },
      ],
      totalObjects: MIGRATION_OBJECTS.length,
      totalRecords,
      errors: 7,
      duration: `${(totalRecords * 0.018).toFixed(1)}s`,
      humanDecisionsRequired: [],
    };
  }
}

module.exports = { MigrationToolHandlers };
