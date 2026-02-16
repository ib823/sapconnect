/**
 * MCP Config Tool Handlers
 *
 * Handler functions for each of the 5 config MCP tools.
 * Mock mode returns realistic SAP configuration data; live mode will
 * connect to actual SAP systems when available. Write operations are
 * safety-gated via SafetyGatesBridge.
 */

'use strict';

const Logger = require('../logger');

class ConfigToolHandlers {
  /**
   * @param {object} [options]
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   * @param {object} [options.sessionContext] - MCP session context
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.sessionContext = options.sessionContext || null;
    this.logger = options.logger || new Logger('mcp-config-handlers');
    /** @type {import('./safety-gates-bridge')|null} */
    this._safetyBridge = null;
  }

  /**
   * Lazily initialize the SafetyGatesBridge.
   * @returns {import('./safety-gates-bridge')}
   */
  _getSafetyBridge() {
    if (!this._safetyBridge) {
      const SafetyGatesBridge = require('./safety-gates-bridge');
      this._safetyBridge = new SafetyGatesBridge({ mode: this.mode });
    }
    return this._safetyBridge;
  }

  /**
   * Route a tool call to the correct handler.
   * @param {string} toolName - Tool name (e.g., 'config_read_source')
   * @param {object} params - Tool parameters
   * @returns {object} Result payload
   */
  async handle(toolName, params) {
    const handlerName = `_handle_${toolName}`;
    const handler = this[handlerName];
    if (!handler) {
      throw new Error(`Unknown config tool: ${toolName}`);
    }
    this.logger.debug(`Handling ${toolName}`, { params });
    const result = await handler.call(this, params || {});
    this.logger.debug(`Completed ${toolName}`, { resultKeys: Object.keys(result) });
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Read Operations
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Read configuration from source SAP system.
   * @param {object} params
   * @param {string} params.configType - Configuration type
   * @param {string} [params.systemId] - Source system ID
   * @returns {object} Configuration entries
   */
  async _handle_config_read_source(params) {
    const { configType, systemId } = params;
    const sid = systemId || 'S4D';

    switch (configType) {
      case 'company-codes':
        return {
          configType,
          systemId: sid,
          entries: [
            { code: '1000', name: 'Global Corp', country: 'US', currency: 'USD', chartOfAccounts: 'YCOA' },
            { code: '2000', name: 'EMEA Operations', country: 'DE', currency: 'EUR', chartOfAccounts: 'YCOA' },
            { code: '3000', name: 'APAC Division', country: 'SG', currency: 'SGD', chartOfAccounts: 'YCOA' },
          ],
          totalEntries: 3,
        };

      case 'plants':
        return {
          configType,
          systemId: sid,
          entries: [
            { code: '1000', name: 'Main Plant US', companyCode: '1000', country: 'US', region: 'NA', valuationArea: '1000' },
            { code: '2000', name: 'Frankfurt Plant', companyCode: '2000', country: 'DE', region: 'EMEA', valuationArea: '2000' },
            { code: '3000', name: 'Singapore Plant', companyCode: '3000', country: 'SG', region: 'APAC', valuationArea: '3000' },
            { code: '1100', name: 'Distribution Center US', companyCode: '1000', country: 'US', region: 'NA', valuationArea: '1100' },
          ],
          totalEntries: 4,
        };

      case 'sales-orgs':
        return {
          configType,
          systemId: sid,
          entries: [
            { code: '1000', name: 'US Sales Org', companyCode: '1000', distributionChannel: '10', division: '00', currency: 'USD' },
            { code: '2000', name: 'EMEA Sales Org', companyCode: '2000', distributionChannel: '10', division: '00', currency: 'EUR' },
            { code: '3000', name: 'APAC Sales Org', companyCode: '3000', distributionChannel: '10', division: '00', currency: 'SGD' },
          ],
          totalEntries: 3,
        };

      case 'purchasing-orgs':
        return {
          configType,
          systemId: sid,
          entries: [
            { code: '1000', name: 'Central Purchasing', companyCode: '1000', country: 'US' },
            { code: '2000', name: 'EMEA Purchasing', companyCode: '2000', country: 'DE' },
          ],
          totalEntries: 2,
        };

      case 'chart-of-accounts':
        return {
          configType,
          systemId: sid,
          entries: [
            { code: 'YCOA', name: 'Global Chart of Accounts', length: 10, language: 'EN', blockingIndicator: false },
          ],
          totalEntries: 1,
        };

      default:
        return {
          configType,
          systemId: sid,
          entries: [
            { id: 'SAMPLE-001', description: 'Sample config entry' },
          ],
          totalEntries: 1,
        };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Write Operations (safety-gated)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Write configuration to target system.
   * Safety-gated — respects dryRun flag and transport requirements.
   * @param {object} params
   * @param {string} params.configType - Configuration type
   * @param {object} params.data - Configuration data to write
   * @param {boolean} [params.dryRun=true] - Validate only
   * @param {string} [params.transport] - Transport request number
   * @returns {object} Write result
   */
  async _handle_config_write_target(params) {
    const { configType, data, transport } = params;
    const dryRun = params.dryRun !== false;

    // Run safety check for non-dry-run operations
    if (!dryRun) {
      const bridge = this._getSafetyBridge();
      const safetyResult = await bridge.check({
        toolName: 'config_write_target',
        operation: `Write ${configType} configuration to target system`,
        dryRun: false,
        artifact: { name: configType, type: 'configuration', metadata: data },
      });

      if (!safetyResult.allowed) {
        return {
          configType,
          dryRun: false,
          status: 'blocked',
          reason: safetyResult.reason,
          gateResults: safetyResult.gateResults,
        };
      }
    }

    const entriesProcessed = data && typeof data === 'object'
      ? (Array.isArray(data.entries) ? data.entries.length : 1)
      : 0;

    return {
      configType,
      dryRun,
      status: dryRun ? 'validated' : 'written',
      entriesProcessed,
      transport: transport || null,
      validation: {
        passed: true,
        errors: [],
        warnings: [],
      },
      humanDecisionsRequired: [
        {
          id: 'CFG-001',
          category: 'configuration',
          question: 'Confirm target system configuration overwrite?',
          options: ['Approve', 'Review first', 'Reject'],
          impact: 'Will modify target system configuration',
          blocking: true,
        },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Safety & Audit Operations
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Run safety check on a pending write operation.
   * @param {object} params
   * @param {string} params.operation - Description of the operation
   * @param {object} [params.artifact] - Artifact details for gate validation
   * @returns {object} Safety check result
   */
  async _handle_config_safety_check(params) {
    const { operation, artifact } = params;
    const bridge = this._getSafetyBridge();

    const result = await bridge.check({
      toolName: 'config_safety_check',
      operation,
      dryRun: false,
      artifact: artifact || { name: 'config-operation', type: 'configuration', metadata: { operation } },
    });

    return {
      operation,
      allowed: result.allowed,
      gates: (result.gateResults || []).map(g => ({
        name: g.name,
        status: g.status,
        message: g.message,
      })),
      strictness: 'moderate',
      recommendations: result.allowed
        ? ['Operation passed safety gates — proceed with caution', 'Ensure transport request is assigned before write']
        : ['Operation blocked by safety gates — review gate results', 'Consider running in dry-run mode first', 'Request human approval if override is needed'],
    };
  }

  /**
   * Request human approval for a write operation.
   * @param {object} params
   * @param {string} params.operation - Description of the operation
   * @param {object} [params.details] - Additional details
   * @param {string} [params.urgency='normal'] - Urgency level
   * @returns {object} Approval request
   */
  async _handle_config_request_approval(params) {
    const { operation, details, urgency } = params;
    const bridge = this._getSafetyBridge();

    bridge.requestApproval({
      toolName: 'config_request_approval',
      operation,
      details: details || {},
    });

    const approvalId = `APR-${String(Date.now()).slice(-6).padStart(6, '0')}`;

    return {
      approvalId,
      operation,
      urgency: urgency || 'normal',
      status: 'pending',
      requestedAt: new Date().toISOString(),
      estimatedReviewTime: '2-4 hours',
    };
  }

  /**
   * Get the audit trail of all configuration operations.
   * @param {object} params
   * @param {string} [params.since] - ISO date filter
   * @param {string} [params.artifactType] - Artifact type filter
   * @param {boolean} [params.approved] - Approval status filter
   * @returns {object} Audit trail entries
   */
  async _handle_config_get_audit_trail(params) {
    const { since, artifactType, approved } = params;
    const bridge = this._getSafetyBridge();

    const filters = {};
    if (since) filters.since = since;
    if (artifactType) filters.artifactType = artifactType;
    if (approved !== undefined) filters.approved = approved;

    const trail = bridge.getAuditTrail(filters);

    // If real trail is empty (mock mode), return sample entries
    const entries = (trail && trail.length > 0) ? trail : [
      {
        id: 'AUD-001',
        timestamp: '2024-11-15T08:30:00Z',
        operation: 'Write company-codes configuration',
        artifactName: 'company-codes',
        artifactType: 'configuration',
        approved: true,
        strictness: 'moderate',
      },
      {
        id: 'AUD-002',
        timestamp: '2024-11-15T09:15:00Z',
        operation: 'Write plants configuration',
        artifactName: 'plants',
        artifactType: 'configuration',
        approved: true,
        strictness: 'moderate',
      },
      {
        id: 'AUD-003',
        timestamp: '2024-11-15T10:00:00Z',
        operation: 'Write sales-orgs configuration (dry-run)',
        artifactName: 'sales-orgs',
        artifactType: 'configuration',
        approved: false,
        strictness: 'moderate',
      },
    ];

    return {
      entries,
      totalEntries: entries.length,
      filters: {
        since: since || null,
        artifactType: artifactType || null,
        approved: approved !== undefined ? approved : null,
      },
    };
  }
}

module.exports = { ConfigToolHandlers };
