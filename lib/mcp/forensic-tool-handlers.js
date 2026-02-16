/**
 * MCP Forensic Tool Handlers
 *
 * Handler functions for each of the 7 forensic extraction MCP tools.
 * Mock mode returns realistic SAP extraction data; live mode will
 * connect to actual SAP systems via RFC/OData when available.
 *
 * All operations are read-only — no write operations on the SAP system.
 */

'use strict';

const Logger = require('../logger');

class ForensicToolHandlers {
  /**
   * @param {object} [options]
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   * @param {object} [options.sessionContext] - Shared session context for caching results
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.sessionContext = options.sessionContext || {};
    this.logger = options.logger || new Logger('mcp-forensic-handlers');
  }

  /**
   * Route a tool call to the correct handler.
   * @param {string} toolName - Tool name (e.g., 'forensic_run_extraction')
   * @param {object} params - Tool parameters
   * @returns {object} Result payload
   */
  async handle(toolName, params) {
    const handlerName = `_handle_${toolName}`;
    const handler = this[handlerName];
    if (!handler) {
      throw new Error(`Unknown forensic tool: ${toolName}`);
    }
    this.logger.debug(`Handling ${toolName}`, { params });
    const result = await handler.call(this, params || {});
    this.logger.debug(`Completed ${toolName}`, { resultKeys: Object.keys(result) });
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Extraction Tools
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Run full forensic extraction across SAP system modules.
   * @param {object} params
   * @param {string[]} [params.modules] - Modules to extract
   * @param {string} [params.mode='standard'] - Extraction depth
   * @returns {object} Extraction summary
   */
  async _handle_forensic_run_extraction(params) {
    const extractionMode = params.mode || 'standard';
    const modulesExtracted = params.modules || ['FI', 'MM', 'SD', 'PP', 'WM'];
    const startedAt = new Date(Date.now() - 12400).toISOString();
    const completedAt = new Date().toISOString();

    const result = {
      extractionId: `EXT-${Date.now()}`,
      status: 'completed',
      mode: extractionMode,
      startedAt,
      completedAt,
      modulesExtracted,
      summary: {
        totalObjects: 4287,
        tables: 1842,
        programs: 1156,
        functionModules: 743,
        customCode: 389,
        transactions: 157,
      },
      duration: '12.4s',
    };

    this.sessionContext.lastForensicResult = result;

    return result;
  }

  /**
   * Run a single extraction module against the SAP system.
   * @param {object} params
   * @param {string} params.module - Module to extract
   * @param {object} [params.options] - Optional extraction parameters
   * @returns {object} Module extraction results
   */
  async _handle_forensic_run_module(params) {
    const { module: mod, options } = params;

    const moduleObjects = {
      FI: [
        { type: 'table', name: 'BKPF', description: 'Accounting Document Header', lastModified: '2024-11-10T14:20:00Z', package: 'FI_DOC' },
        { type: 'table', name: 'BSEG', description: 'Accounting Document Segment', lastModified: '2024-11-10T14:20:00Z', package: 'FI_DOC' },
        { type: 'program', name: 'RFITEMGL', description: 'G/L Line Item Display', lastModified: '2024-09-15T08:30:00Z', package: 'FI_GL' },
        { type: 'function_module', name: 'BAPI_ACC_DOCUMENT_POST', description: 'Post Accounting Document', lastModified: '2024-08-22T11:00:00Z', package: 'FI_API' },
      ],
      MM: [
        { type: 'table', name: 'EKKO', description: 'Purchasing Document Header', lastModified: '2024-11-12T09:15:00Z', package: 'MM_PUR' },
        { type: 'table', name: 'EKPO', description: 'Purchasing Document Item', lastModified: '2024-11-12T09:15:00Z', package: 'MM_PUR' },
        { type: 'program', name: 'RM06EN00', description: 'Purchase Order Entry', lastModified: '2024-10-05T16:45:00Z', package: 'MM_PUR' },
        { type: 'function_module', name: 'BAPI_PO_CREATE1', description: 'Create Purchase Order', lastModified: '2024-07-18T10:30:00Z', package: 'MM_API' },
        { type: 'transaction', name: 'ME21N', description: 'Create Purchase Order', lastModified: '2024-06-01T08:00:00Z', package: 'MM_PUR' },
      ],
      SD: [
        { type: 'table', name: 'VBAK', description: 'Sales Document Header', lastModified: '2024-11-14T11:30:00Z', package: 'SD_SAL' },
        { type: 'table', name: 'VBAP', description: 'Sales Document Item', lastModified: '2024-11-14T11:30:00Z', package: 'SD_SAL' },
        { type: 'program', name: 'SAPMV45A', description: 'Sales Order Processing', lastModified: '2024-10-20T13:00:00Z', package: 'SD_SAL' },
      ],
      PP: [
        { type: 'table', name: 'AFKO', description: 'Production Order Header', lastModified: '2024-11-08T07:45:00Z', package: 'PP_ORD' },
        { type: 'function_module', name: 'BAPI_PRODORD_CREATE', description: 'Create Production Order', lastModified: '2024-09-10T09:00:00Z', package: 'PP_API' },
        { type: 'transaction', name: 'CO01', description: 'Create Production Order', lastModified: '2024-05-15T10:00:00Z', package: 'PP_ORD' },
      ],
      WM: [
        { type: 'table', name: 'LQUA', description: 'Warehouse Quant', lastModified: '2024-11-06T15:20:00Z', package: 'WM_STK' },
        { type: 'program', name: 'RLLQ0100', description: 'Warehouse Stock Overview', lastModified: '2024-08-01T12:00:00Z', package: 'WM_RPT' },
        { type: 'function_module', name: 'L_TO_CREATE_SINGLE', description: 'Create Transfer Order', lastModified: '2024-07-25T14:00:00Z', package: 'WM_API' },
      ],
    };

    const objects = moduleObjects[mod] || [
      { type: 'table', name: `Z${mod}_MASTER`, description: `${mod} Master Data Table`, lastModified: '2024-11-01T10:00:00Z', package: `${mod}_CUST` },
      { type: 'program', name: `Z${mod}_REPORT`, description: `${mod} Custom Report`, lastModified: '2024-10-15T09:00:00Z', package: `${mod}_CUST` },
      { type: 'function_module', name: `Z_${mod}_EXTRACT`, description: `${mod} Data Extract`, lastModified: '2024-09-20T11:00:00Z', package: `${mod}_CUST` },
    ];

    return {
      module: mod,
      status: 'completed',
      objectsFound: objects.length,
      objects,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Progress & Status Tools
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get progress of a running forensic extraction.
   * @returns {object} Progress status
   */
  async _handle_forensic_get_progress() {
    if (this.sessionContext.lastForensicResult) {
      const lastResult = this.sessionContext.lastForensicResult;
      return {
        status: 'completed',
        modulesCompleted: lastResult.modulesExtracted.length,
        modulesTotal: lastResult.modulesExtracted.length,
        currentModule: null,
        percentComplete: 100,
      };
    }

    return {
      status: 'idle',
      modulesCompleted: 0,
      modulesTotal: 0,
      currentModule: null,
      percentComplete: 0,
    };
  }

  /**
   * Get SAP system information.
   * @returns {object} System info
   */
  async _handle_forensic_get_system_info() {
    return {
      systemId: 'S4D',
      systemNumber: '00',
      client: '100',
      host: 'sap-s4d.example.com',
      sapVersion: 'SAP S/4HANA 2023',
      kernelRelease: '793',
      abapRelease: '758',
      databaseType: 'HANA',
      databaseVersion: '2.0 SPS07',
      operatingSystem: 'Linux',
      installedComponents: [
        { name: 'SAP_BASIS', version: '758', description: 'SAP Basis Component' },
        { name: 'SAP_ABA', version: '758', description: 'Cross-Application Component' },
        { name: 'SAP_UI', version: '758', description: 'User Interface Technology' },
        { name: 'S4CORE', version: '108', description: 'S/4HANA Core' },
        { name: 'S4FND', version: '108', description: 'S/4HANA Foundation' },
        { name: 'FIORI_FND', version: '400', description: 'Fiori Foundation' },
      ],
      instanceType: 'ABAP',
      unicode: true,
      totalUsers: 1250,
      activeUsersLast30Days: 342,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Results & Reporting Tools
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get cached extraction results.
   * @param {object} params
   * @param {string} [params.module] - Filter results by module
   * @returns {object} Cached results or unavailable message
   */
  async _handle_forensic_get_results(params) {
    const { module: mod } = params;

    if (!this.sessionContext.lastForensicResult) {
      return {
        available: false,
        message: 'No extraction results. Run forensic_run_extraction first.',
      };
    }

    const result = { ...this.sessionContext.lastForensicResult, available: true };

    if (mod) {
      result.filter = mod;
      if (result.modulesExtracted && !result.modulesExtracted.includes(mod)) {
        return {
          available: false,
          message: `Module "${mod}" was not included in the last extraction. Extracted modules: ${result.modulesExtracted.join(', ')}`,
        };
      }
    }

    return result;
  }

  /**
   * Get archiving recommendations for SAP tables.
   * @param {object} params
   * @param {number} [params.minAge=12] - Minimum object age in months
   * @returns {object} Archiving advice
   */
  async _handle_forensic_get_archiving_advice(params) {
    const minAge = params.minAge || 12;

    return {
      recommendations: [
        {
          table: 'BKPF',
          currentRows: 12500000,
          estimatedArchivable: 8200000,
          retentionPolicy: 'Fiscal year close + retention period',
          archivingObject: 'FI_DOCUMNT',
          estimatedSavingsGb: 45.2,
          priority: 'high',
        },
        {
          table: 'MSEG',
          currentRows: 28700000,
          estimatedArchivable: 19100000,
          retentionPolicy: 'Material document age > configured retention',
          archivingObject: 'MM_MATBEL',
          estimatedSavingsGb: 82.6,
          priority: 'high',
        },
        {
          table: 'VBAK',
          currentRows: 5400000,
          estimatedArchivable: 2800000,
          retentionPolicy: 'Completed sales orders older than retention period',
          archivingObject: 'SD_VBAK',
          estimatedSavingsGb: 18.3,
          priority: 'medium',
        },
        {
          table: 'CDHDR',
          currentRows: 41200000,
          estimatedArchivable: 35600000,
          retentionPolicy: 'Change documents older than configured threshold',
          archivingObject: 'BC_ARCHIVE',
          estimatedSavingsGb: 67.1,
          priority: 'medium',
        },
      ],
      totalEstimatedSavingsGb: 213.2,
      minAgeMonths: minAge,
      humanDecisionsRequired: [
        {
          id: 'ARCH-001',
          category: 'data-retention',
          question: 'What data retention period applies?',
          options: ['3 years', '5 years', '7 years', '10 years'],
          impact: 'Determines which historical data to archive before migration',
          blocking: true,
        },
      ],
    };
  }

  /**
   * Get a formatted forensic extraction report.
   * @param {object} params
   * @param {string} [params.format='json'] - Report format: 'json' or 'markdown'
   * @returns {object} Formatted report
   */
  async _handle_forensic_get_report(params) {
    const format = params.format || 'json';

    const lastResult = this.sessionContext.lastForensicResult;

    const summary = lastResult
      ? lastResult.summary
      : {
        totalObjects: 4287,
        tables: 1842,
        programs: 1156,
        functionModules: 743,
        customCode: 389,
        transactions: 157,
      };

    const modulesExtracted = lastResult
      ? lastResult.modulesExtracted
      : ['FI', 'MM', 'SD', 'PP', 'WM'];

    const extractionMode = lastResult ? lastResult.mode : 'standard';

    if (format === 'markdown') {
      const lines = [
        '# Forensic Extraction Report',
        '',
        `**System:** S4D (Client 100)`,
        `**Mode:** ${extractionMode}`,
        `**Modules:** ${modulesExtracted.join(', ')}`,
        `**Generated:** ${new Date().toISOString()}`,
        '',
        '## Summary',
        '',
        `| Metric | Count |`,
        `|--------|-------|`,
        `| Total Objects | ${summary.totalObjects} |`,
        `| Tables | ${summary.tables} |`,
        `| Programs | ${summary.programs} |`,
        `| Function Modules | ${summary.functionModules} |`,
        `| Custom Code (Z/Y) | ${summary.customCode} |`,
        `| Transactions | ${summary.transactions} |`,
        '',
        '## Modules Extracted',
        '',
        ...modulesExtracted.map(m => `- **${m}** — completed`),
        '',
        '## Recommendations',
        '',
        '1. Review custom code objects (Z/Y namespace) for S/4HANA compatibility',
        '2. Run archiving analysis on high-volume tables before migration',
        '3. Validate function module usage against simplification list',
      ];

      return {
        format: 'markdown',
        content: lines.join('\n'),
      };
    }

    return {
      format: 'json',
      content: {
        system: 'S4D',
        client: '100',
        mode: extractionMode,
        modulesExtracted,
        summary,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

module.exports = { ForensicToolHandlers };
