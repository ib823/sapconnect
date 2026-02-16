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
 * MCP Greenfield Tool Handlers
 *
 * Handler functions for each of the 10 greenfield MCP tools.
 * Mock mode returns realistic SAP-style data; live mode will
 * connect to actual SAP systems via RFC/OData when available.
 */

'use strict';

const Logger = require('../logger');
const SafetyGatesBridge = require('./safety-gates-bridge');

class GreenfieldToolHandlers {
  /**
   * @param {object} [options]
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   * @param {object} [options.sessionContext] - MCP session context
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.sessionContext = options.sessionContext || null;
    this.logger = options.logger || new Logger('mcp-greenfield-handlers');
    this.safetyBridge = new SafetyGatesBridge({
      mode: this.mode,
      logger: this.logger,
    });
  }

  /**
   * Route a tool call to the correct handler.
   * @param {string} toolName - Tool name (e.g., 'greenfield_generate_bdc')
   * @param {object} params - Tool parameters
   * @returns {object} Result payload
   */
  async handle(toolName, params) {
    const handlerName = `_handle_${toolName}`;
    const handler = this[handlerName];
    if (!handler) {
      throw new Error(`Unknown greenfield tool: ${toolName}`);
    }
    this.logger.debug(`Handling ${toolName}`, { params });
    const result = await handler.call(this, params || {});
    this.logger.debug(`Completed ${toolName}`, { resultKeys: Object.keys(result) });
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BDC Tools
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate a BDC recording for a transaction.
   * @param {object} params
   * @param {string} params.transaction - Transaction code
   * @param {object} params.data - Field values
   * @param {string} [params.variant] - BDC variant
   * @returns {object} BDC recording
   */
  async _handle_greenfield_generate_bdc(params) {
    const { transaction, data, variant } = params;
    const fields = Object.entries(data || {}).map(([name, value]) => ({ name, value: String(value) }));

    return {
      transaction,
      recording: {
        screens: [
          {
            program: `SAPL${transaction}`,
            dynpro: '0100',
            fields: fields.slice(0, Math.ceil(fields.length / 2)),
          },
          {
            program: `SAPL${transaction}`,
            dynpro: '0200',
            fields: fields.slice(Math.ceil(fields.length / 2)),
          },
        ],
      },
      fieldCount: fields.length,
      variant: variant || null,
      estimatedExecutionTime: '2.1s',
      status: 'generated',
    };
  }

  /**
   * Execute a BDC recording on a target system. Write operation — safety-gated.
   * @param {object} params
   * @param {object} params.recording - BDC recording object
   * @param {boolean} [params.dryRun=true] - Simulate execution
   * @param {string} [params.mode='N'] - Processing mode
   * @returns {object} Execution result
   */
  async _handle_greenfield_execute_bdc(params) {
    const { recording, mode } = params;
    const dryRun = params.dryRun !== false;
    const transaction = recording.transaction || recording.screens?.[0]?.program || 'UNKNOWN';

    // Safety gate check for write operations
    const safetyResult = await this.safetyBridge.check({
      toolName: 'greenfield_execute_bdc',
      operation: `Execute BDC recording for ${transaction}`,
      dryRun,
      artifact: dryRun ? null : {
        name: `bdc-${transaction}`,
        type: 'bdc-recording',
        metadata: { transaction, mode: mode || 'N' },
      },
    });

    if (!safetyResult.allowed) {
      return {
        status: 'blocked',
        reason: safetyResult.reason,
        safetyGates: safetyResult.gateResults,
      };
    }

    return {
      dryRun,
      mode: mode || 'N',
      status: dryRun ? 'simulated' : 'executed',
      transaction,
      messagesProcessed: 1,
      returnCode: 0,
      messages: [
        { type: 'S', id: 'msg', number: '001', message: 'Document created successfully' },
      ],
      documentNumber: dryRun ? null : '1000000123',
    };
  }

  /**
   * List available BDC template types.
   * @returns {object} Template list
   */
  async _handle_greenfield_list_bdc_templates() {
    return {
      templates: [
        { id: 'BDC_XK01', transaction: 'XK01', description: 'Create Vendor (Purchasing)', category: 'master-data', fieldCount: 35 },
        { id: 'BDC_XD01', transaction: 'XD01', description: 'Create Customer (Sales)', category: 'master-data', fieldCount: 42 },
        { id: 'BDC_MM01', transaction: 'MM01', description: 'Create Material', category: 'master-data', fieldCount: 58 },
        { id: 'BDC_FB01', transaction: 'FB01', description: 'Post Document (G/L)', category: 'finance', fieldCount: 24 },
        { id: 'BDC_ME21N', transaction: 'ME21N', description: 'Create Purchase Order', category: 'procurement', fieldCount: 38 },
        { id: 'BDC_VA01', transaction: 'VA01', description: 'Create Sales Order', category: 'sales', fieldCount: 32 },
        { id: 'BDC_VL01N', transaction: 'VL01N', description: 'Create Outbound Delivery', category: 'logistics', fieldCount: 20 },
        { id: 'BDC_PA30', transaction: 'PA30', description: 'Maintain HR Master Data', category: 'hr', fieldCount: 28 },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Configuration Templates
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List configuration templates, optionally filtered by area.
   * @param {object} params
   * @param {string} [params.area] - Functional area filter
   * @returns {object} Template list
   */
  async _handle_greenfield_list_config_templates(params) {
    const { area } = params;
    let templates = [
      { id: 'FI_COA_001', name: 'Chart of Accounts Setup', area: 'FI', description: 'Define chart of accounts, account groups, and G/L accounts', steps: 8, complexity: 'medium', prerequisiteTemplates: [] },
      { id: 'FI_FISC_001', name: 'Fiscal Year Variant', area: 'FI', description: 'Configure fiscal year periods and special periods', steps: 4, complexity: 'low', prerequisiteTemplates: [] },
      { id: 'MM_PORG_001', name: 'Purchasing Organization', area: 'MM', description: 'Define purchasing organization and assignment to company code and plant', steps: 6, complexity: 'medium', prerequisiteTemplates: ['FI_COA_001'] },
      { id: 'SD_SORG_001', name: 'Sales Organization', area: 'SD', description: 'Define sales organization, distribution channel, and division', steps: 7, complexity: 'medium', prerequisiteTemplates: ['FI_COA_001'] },
      { id: 'PP_PLANT_001', name: 'Plant Configuration', area: 'PP', description: 'Configure plant, storage locations, and MRP areas', steps: 9, complexity: 'high', prerequisiteTemplates: ['MM_PORG_001'] },
      { id: 'MM_VALUATION_001', name: 'Material Valuation', area: 'MM', description: 'Configure valuation areas, valuation classes, and price control', steps: 5, complexity: 'medium', prerequisiteTemplates: ['MM_PORG_001', 'FI_COA_001'] },
    ];

    if (area) {
      templates = templates.filter(t => t.area === area);
    }

    return { templates };
  }

  /**
   * Get a specific configuration template with detailed steps.
   * @param {object} params
   * @param {string} params.templateId - Template identifier
   * @returns {object} Template details
   */
  async _handle_greenfield_get_config_template(params) {
    const { templateId } = params;

    const templates = {
      FI_COA_001: {
        templateId: 'FI_COA_001',
        name: 'Chart of Accounts Setup',
        area: 'FI',
        description: 'Define chart of accounts, account groups, and G/L accounts for financial reporting',
        steps: [
          {
            stepNumber: 1,
            transaction: 'OB13',
            description: 'Define Chart of Accounts',
            fields: [
              { name: 'KTOPL', description: 'Chart of Accounts key', sampleValue: 'YCOA', required: true },
              { name: 'KTPLT', description: 'Chart of Accounts name', sampleValue: 'Company Chart of Accounts', required: true },
              { name: 'SPRSL', description: 'Maintenance language', sampleValue: 'EN', required: true },
              { name: 'NUMLEN', description: 'Account number length', sampleValue: '10', required: true },
            ],
            notes: 'Chart of accounts is shared across company codes using the same accounting structure',
          },
          {
            stepNumber: 2,
            transaction: 'OBD4',
            description: 'Define Account Groups',
            fields: [
              { name: 'KTOPL', description: 'Chart of Accounts', sampleValue: 'YCOA', required: true },
              { name: 'KTOGR', description: 'Account Group', sampleValue: 'ASET', required: true },
              { name: 'TXT30', description: 'Account Group description', sampleValue: 'Asset Accounts', required: true },
              { name: 'VONKT', description: 'Number range from', sampleValue: '100000', required: true },
              { name: 'BISKT', description: 'Number range to', sampleValue: '199999', required: true },
            ],
            notes: 'Create account groups for Assets, Liabilities, Revenue, Expenses, and Equity',
          },
          {
            stepNumber: 3,
            transaction: 'FS00',
            description: 'Create G/L Accounts',
            fields: [
              { name: 'SAKNR', description: 'G/L Account number', sampleValue: '100000', required: true },
              { name: 'BUKRS', description: 'Company code', sampleValue: '1000', required: true },
              { name: 'KTOGR', description: 'Account group', sampleValue: 'ASET', required: true },
              { name: 'TXT20', description: 'Short text', sampleValue: 'Cash and Bank', required: true },
              { name: 'WAERS', description: 'Currency', sampleValue: 'USD', required: false },
            ],
            notes: 'Create at chart of accounts level first, then extend to company code level',
          },
          {
            stepNumber: 4,
            transaction: 'OB62',
            description: 'Assign Company Code to Chart of Accounts',
            fields: [
              { name: 'BUKRS', description: 'Company code', sampleValue: '1000', required: true },
              { name: 'KTOPL', description: 'Chart of Accounts', sampleValue: 'YCOA', required: true },
            ],
            notes: 'Each company code must be assigned to exactly one chart of accounts',
          },
        ],
        prerequisites: ['Company code must be defined (transaction OX02)', 'Country settings must be maintained'],
        estimatedTime: '4-6 hours',
        humanDecisionsRequired: [
          {
            id: 'HD_COA_STRUCTURE',
            category: 'configuration',
            question: 'What chart of accounts structure should be used — operational, group, or country-specific?',
            options: ['Operational CoA only', 'Operational + Group CoA', 'Operational + Country CoA', 'All three levels'],
            impact: 'Determines financial reporting dimensions and inter-company reconciliation approach',
            blocking: true,
          },
        ],
      },
    };

    const template = templates[templateId];
    if (template) {
      return template;
    }

    // Default fallback for unknown templates
    return {
      templateId,
      name: `Configuration Template ${templateId}`,
      area: templateId.split('_')[0] || 'UNKNOWN',
      description: `Configuration template for ${templateId}`,
      steps: [
        {
          stepNumber: 1,
          transaction: 'SPRO',
          description: 'Open IMG activity',
          fields: [
            { name: 'ACTIVITY', description: 'IMG activity path', sampleValue: templateId, required: true },
          ],
          notes: 'Navigate to the relevant IMG node',
        },
        {
          stepNumber: 2,
          transaction: 'SM30',
          description: 'Maintain configuration table',
          fields: [
            { name: 'TABLE', description: 'Configuration table', sampleValue: 'T001', required: true },
          ],
          notes: 'Enter configuration values as defined in the blueprint',
        },
        {
          stepNumber: 3,
          transaction: 'SE10',
          description: 'Release transport request',
          fields: [
            { name: 'TRKORR', description: 'Transport request number', sampleValue: 'DEVK900001', required: true },
          ],
          notes: 'All configuration changes must be transported to QA and production',
        },
      ],
      prerequisites: ['Enterprise structure must be defined'],
      estimatedTime: '2-4 hours',
      humanDecisionsRequired: [
        {
          id: `HD_${templateId}`,
          category: 'configuration',
          question: 'Confirm configuration values align with business blueprint',
          options: ['Proceed with standard settings', 'Customize for client requirements'],
          impact: 'Affects downstream configuration dependencies',
          blocking: true,
        },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BAPI Catalog
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List available BAPIs by module.
   * @param {object} params
   * @param {string} [params.module] - Module filter
   * @param {string} [params.objectType] - Object type filter
   * @returns {object} BAPI list
   */
  async _handle_greenfield_list_bapis(params) {
    const { module, objectType } = params;
    let bapis = [
      { name: 'BAPI_MATERIAL_SAVEDATA', description: 'Create/Change Material Master', module: 'MM', objectType: 'Material', isReleased: true, parameters: { import: 8, export: 1, tables: 12 } },
      { name: 'BAPI_MATERIAL_GET_DETAIL', description: 'Read Material Master Data', module: 'MM', objectType: 'Material', isReleased: true, parameters: { import: 3, export: 6, tables: 4 } },
      { name: 'BAPI_CUSTOMER_CREATEFROMDATA1', description: 'Create Customer Master', module: 'SD', objectType: 'Customer', isReleased: true, parameters: { import: 5, export: 1, tables: 3 } },
      { name: 'BAPI_ACC_DOCUMENT_POST', description: 'Post Accounting Document', module: 'FI', objectType: 'AccountingDocument', isReleased: true, parameters: { import: 4, export: 2, tables: 6 } },
      { name: 'BAPI_PO_CREATE1', description: 'Create Purchase Order', module: 'MM', objectType: 'PurchaseOrder', isReleased: true, parameters: { import: 6, export: 2, tables: 10 } },
      { name: 'BAPI_SALESORDER_CREATEFROMDAT2', description: 'Create Sales Order', module: 'SD', objectType: 'SalesOrder', isReleased: true, parameters: { import: 7, export: 1, tables: 8 } },
      { name: 'BAPI_COSTCENTER_CREATEMULTIPLE', description: 'Create Cost Centers', module: 'CO', objectType: 'CostCenter', isReleased: true, parameters: { import: 2, export: 1, tables: 3 } },
      { name: 'BAPI_VENDOR_CREATE', description: 'Create Vendor Master', module: 'MM', objectType: 'Vendor', isReleased: true, parameters: { import: 5, export: 1, tables: 4 } },
    ];

    if (module) {
      bapis = bapis.filter(b => b.module === module);
    }
    if (objectType) {
      bapis = bapis.filter(b => b.objectType === objectType);
    }

    return {
      totalBapis: bapis.length,
      bapis,
    };
  }

  /**
   * Get BAPI signature (import/export/tables parameters).
   * @param {object} params
   * @param {string} params.bapiName - BAPI function name
   * @returns {object} BAPI signature
   */
  async _handle_greenfield_get_bapi_signature(params) {
    const { bapiName } = params;

    const signatures = {
      BAPI_MATERIAL_SAVEDATA: {
        bapiName: 'BAPI_MATERIAL_SAVEDATA',
        description: 'Create or change material master data',
        module: 'MM',
        parameters: {
          import: [
            { name: 'HEADDATA', type: 'BAPIMATHEAD', description: 'Header data (material number, industry, material type)', optional: false },
            { name: 'CLIENTDATA', type: 'BAPI_MARA', description: 'Client-level data (base UoM, material group, weight)', optional: true },
            { name: 'CLIENTDATAX', type: 'BAPI_MARAX', description: 'Change flags for client data', optional: true },
            { name: 'PLANTDATA', type: 'BAPI_MARC', description: 'Plant-level data (MRP, purchasing, storage)', optional: true },
            { name: 'PLANTDATAX', type: 'BAPI_MARCX', description: 'Change flags for plant data', optional: true },
            { name: 'VALUATIONDATA', type: 'BAPI_MBEW', description: 'Valuation data (price, price control)', optional: true },
            { name: 'VALUATIONDATAX', type: 'BAPI_MBEWX', description: 'Change flags for valuation data', optional: true },
            { name: 'SALESDATA', type: 'BAPI_MVKE', description: 'Sales organization data', optional: true },
          ],
          export: [
            { name: 'RETURN', type: 'BAPIRET2', description: 'Return messages (errors, warnings, success)' },
          ],
          tables: [
            { name: 'MATERIALDESCRIPTION', type: 'BAPI_MAKT', description: 'Material descriptions (multi-language)' },
            { name: 'UNITSOFMEASURE', type: 'BAPI_MARM', description: 'Units of measure' },
            { name: 'TAXCLASSIFICATIONS', type: 'BAPI_MLAN', description: 'Tax classifications by country' },
            { name: 'RETURNMESSAGES', type: 'BAPIRET2', description: 'Detailed return messages' },
          ],
        },
        returnStructure: 'BAPIRET2',
        sampleCall: {
          HEADDATA: { MATERIAL: '000000000000100001', IND_SECTOR: 'M', MATL_TYPE: 'FERT' },
          CLIENTDATA: { BASE_UOM: 'PC', MATL_GROUP: '001', GROSS_WT: 1.5, NET_WEIGHT: 1.2, UNIT_OF_WT: 'KG' },
          CLIENTDATAX: { BASE_UOM: 'X', MATL_GROUP: 'X', GROSS_WT: 'X', NET_WEIGHT: 'X', UNIT_OF_WT: 'X' },
          MATERIALDESCRIPTION: [{ LANGU: 'EN', MATL_DESC: 'Finished Product A' }],
        },
      },
    };

    const signature = signatures[bapiName];
    if (signature) {
      return signature;
    }

    // Default fallback for unknown BAPIs
    return {
      bapiName,
      description: `BAPI ${bapiName}`,
      module: 'UNKNOWN',
      parameters: {
        import: [
          { name: 'INPUT', type: 'STRUCTURE', description: 'Input parameters', optional: false },
        ],
        export: [
          { name: 'RETURN', type: 'BAPIRET2', description: 'Return messages' },
        ],
        tables: [
          { name: 'DATA', type: 'TABLE', description: 'Data table' },
        ],
      },
      returnStructure: 'BAPIRET2',
      sampleCall: {
        INPUT: {},
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Enhancement Discovery
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Discover BADIs and enhancement points.
   * @param {object} params
   * @param {string} [params.transaction] - Transaction code
   * @param {string} [params.package] - Development package
   * @returns {object} Enhancement list
   */
  async _handle_greenfield_discover_enhancements(params) {
    const { transaction, package: devPackage } = params;

    const enhancements = [
      { type: 'BADI', name: 'ME_PROCESS_PO_CUST', description: 'Customer enhancement for purchase order processing', implemented: true, implementations: 2 },
      { type: 'BADI', name: 'MB_DOCUMENT_BADI', description: 'Enhancement for material document posting', implemented: false, implementations: 0 },
      { type: 'USER_EXIT', name: 'EXIT_SAPMM06E_016', description: 'User exit for purchase order item check', implemented: true, implementations: 1 },
      { type: 'USER_EXIT', name: 'EXIT_SAPLMR1M_001', description: 'User exit for invoice verification', implemented: false, implementations: 0 },
      { type: 'BTES', name: 'BUPA_GENERAL_DATA', description: 'Business partner general data event', implemented: false, implementations: 0 },
      { type: 'BADI', name: 'ACC_DOCUMENT', description: 'Enhancement for accounting document posting', implemented: true, implementations: 3 },
    ];

    const totalBadis = enhancements.filter(e => e.type === 'BADI').length;
    const totalUserExits = enhancements.filter(e => e.type === 'USER_EXIT').length;
    const totalBtes = enhancements.filter(e => e.type === 'BTES').length;

    return {
      transaction: transaction || 'ALL',
      package: devPackage || null,
      enhancements,
      totalBadis,
      totalUserExits,
      totalBtes,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SM30 Customizing Tables
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List known SM30 customizing tables.
   * @param {object} params
   * @param {string} [params.area] - Functional area filter
   * @returns {object} Table list
   */
  async _handle_greenfield_list_sm30_tables(params) {
    const { area } = params;
    let tables = [
      { tableName: 'T001', description: 'Company Codes', area: 'FI', maintenanceView: 'V_T001', transportRequired: true },
      { tableName: 'T001B', description: 'Permitted Posting Periods', area: 'FI', maintenanceView: 'V_T001B', transportRequired: true },
      { tableName: 'T001W', description: 'Plants / Branches', area: 'MM', maintenanceView: 'V_T001W', transportRequired: true },
      { tableName: 'T006', description: 'Units of Measurement', area: 'BASIS', maintenanceView: 'V_T006', transportRequired: true },
      { tableName: 'TCURR', description: 'Exchange Rate Table', area: 'FI', maintenanceView: 'V_TCURR', transportRequired: false },
      { tableName: 'T005', description: 'Countries', area: 'BASIS', maintenanceView: 'V_T005', transportRequired: true },
      { tableName: 'T024', description: 'Purchasing Groups', area: 'MM', maintenanceView: 'V_T024', transportRequired: true },
      { tableName: 'TVKO', description: 'Sales Organizations', area: 'SD', maintenanceView: 'V_TVKO', transportRequired: true },
    ];

    if (area) {
      tables = tables.filter(t => t.area === area);
    }

    return { tables };
  }

  /**
   * Generate SM30 maintenance view recording.
   * @param {object} params
   * @param {string} params.tableName - Customizing table name
   * @param {object[]} params.entries - Entries to insert
   * @returns {object} SM30 recording
   */
  async _handle_greenfield_generate_sm30(params) {
    const { tableName, entries } = params;
    const entriesCount = entries ? entries.length : 0;

    return {
      tableName,
      recording: {
        transaction: 'SM30',
        viewName: `V_${tableName}`,
        action: 'INSERT',
        entries: entriesCount,
        screens: [
          {
            program: 'SAPMSVMA',
            dynpro: '0100',
            fields: [
              { name: 'VIEWNAME', value: `V_${tableName}` },
              { name: 'ACTION', value: 'EDIT' },
            ],
          },
          {
            program: `SAPLSVIM`,
            dynpro: '0200',
            fields: entries
              ? entries.flatMap((entry, idx) =>
                Object.entries(entry).map(([name, value]) => ({
                  name: `ENTRY_${idx + 1}_${name}`,
                  value: String(value),
                }))
              )
              : [],
          },
        ],
      },
      status: 'generated',
      entriesCount,
    };
  }
}

module.exports = { GreenfieldToolHandlers };
