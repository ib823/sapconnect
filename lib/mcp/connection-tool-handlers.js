/**
 * MCP Connection Tool Handlers
 *
 * Handler functions for each of the 6 connection MCP tools.
 * Mock mode returns realistic SAP connectivity data; live mode will
 * connect to actual SAP systems via RFC/OData when available.
 */

'use strict';

const Logger = require('../logger');

class ConnectionToolHandlers {
  /**
   * @param {object} [options]
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   * @param {object} [options.sessionContext] - Shared SessionContext instance
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.sessionContext = options.sessionContext || null;
    this.logger = options.logger || new Logger('mcp-connection-handlers');
  }

  /**
   * Route a tool call to the correct handler.
   * @param {string} toolName - Tool name (e.g., 'connection_test')
   * @param {object} params - Tool parameters
   * @returns {object} Result payload
   */
  async handle(toolName, params) {
    const handlerName = `_handle_${toolName}`;
    const handler = this[handlerName];
    if (!handler) {
      throw new Error(`Unknown connection tool: ${toolName}`);
    }
    this.logger.debug(`Handling ${toolName}`, { params });
    const result = await handler.call(this, params || {});
    this.logger.debug(`Completed ${toolName}`, { resultKeys: Object.keys(result) });
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Connection Testing & Status
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Test SAP system connectivity.
   * @param {object} params
   * @param {string} [params.host]
   * @param {string} [params.systemNumber]
   * @param {string} [params.client]
   * @param {string} [params.user]
   * @param {string} [params.password]
   * @param {string} [params.connectionType='direct']
   * @returns {object} Connection test result
   */
  async _handle_connection_test(params) {
    const { host, systemNumber, client, user, password, connectionType } = params;
    const connType = connectionType || 'direct';

    const result = {
      status: 'connected',
      connectionType: connType,
      host: host || 'sap-s4d.example.com',
      systemNumber: systemNumber || '00',
      client: client || '100',
      pingTimeMs: 45,
      sapVersion: 'SAP S/4HANA 2023',
      kernelRelease: '793',
      mode: 'mock',
    };

    // Store connection info in sessionContext
    if (this.sessionContext) {
      this.sessionContext.activeConnection = {
        host: result.host,
        systemNumber: result.systemNumber,
        client: result.client,
        connectionType: connType,
        connectedSince: new Date().toISOString(),
      };
      this.sessionContext.mode = this.mode;
    }

    return result;
  }

  /**
   * Get current connection status.
   * @returns {object} Connection status with capabilities
   */
  async _handle_connection_status() {
    const ctx = this.sessionContext;

    return {
      connected: ctx ? ctx.isConnected() : false,
      mode: ctx ? ctx.mode : this.mode,
      connection: ctx && ctx.activeConnection ? {
        host: ctx.activeConnection.host,
        systemNumber: ctx.activeConnection.systemNumber,
        client: ctx.activeConnection.client,
        connectedSince: ctx.activeConnection.connectedSince,
      } : null,
      capabilities: {
        rfc: true,
        odata: true,
        adt: false,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Configuration Validation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Validate connection configuration.
   * @param {object} params
   * @param {object} params.config - Connection parameters to validate
   * @returns {object} Validation result with checks and recommendations
   */
  async _handle_connection_setup_validate(params) {
    const { config } = params;
    const checks = [];
    const recommendations = [];

    // Host check
    if (config.host) {
      checks.push({ check: 'host', status: 'pass', message: `Host "${config.host}" is specified` });
    } else {
      checks.push({ check: 'host', status: 'fail', message: 'Host is required for direct connections' });
      recommendations.push('Provide the SAP application server hostname or IP address');
    }

    // Port / system number check
    if (config.systemNumber !== undefined && config.systemNumber !== null) {
      const sysNr = String(config.systemNumber);
      if (/^\d{2}$/.test(sysNr)) {
        checks.push({ check: 'systemNumber', status: 'pass', message: `System number "${sysNr}" is valid (00-99)` });
      } else {
        checks.push({ check: 'systemNumber', status: 'fail', message: `System number "${sysNr}" must be a two-digit string (00-99)` });
      }
    } else {
      checks.push({ check: 'systemNumber', status: 'warn', message: 'System number not specified, defaulting to "00"' });
      recommendations.push('Specify systemNumber explicitly for clarity');
    }

    // Client check
    if (config.client) {
      const clientStr = String(config.client);
      if (/^\d{3}$/.test(clientStr)) {
        checks.push({ check: 'client', status: 'pass', message: `Client "${clientStr}" is valid (000-999)` });
      } else {
        checks.push({ check: 'client', status: 'fail', message: `Client "${clientStr}" must be a three-digit string (000-999)` });
      }
    } else {
      checks.push({ check: 'client', status: 'warn', message: 'Client not specified, defaulting to "100"' });
      recommendations.push('Specify client explicitly to target the correct SAP client');
    }

    // User check
    if (config.user) {
      checks.push({ check: 'user', status: 'pass', message: `User "${config.user}" is specified` });
    } else {
      checks.push({ check: 'user', status: 'fail', message: 'User is required for authentication' });
      recommendations.push('Provide SAP user credentials');
    }

    // Connectivity type check
    const connType = config.connectionType || 'direct';
    if (['direct', 'load-balanced', 'odata'].includes(connType)) {
      checks.push({ check: 'connectionType', status: 'pass', message: `Connection type "${connType}" is supported` });
    } else {
      checks.push({ check: 'connectionType', status: 'fail', message: `Unknown connection type "${connType}". Use "direct", "load-balanced", or "odata"` });
    }

    // Load-balanced specific
    if (connType === 'load-balanced' && !config.mshost) {
      recommendations.push('Load-balanced connections require mshost, msserv, group, and r3name');
    }

    const failCount = checks.filter(c => c.status === 'fail').length;

    return {
      valid: failCount === 0,
      checks,
      recommendations,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Protocol-Specific Checks
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check RFC connectivity specifically.
   * @param {object} params
   * @param {string} [params.host]
   * @param {string} [params.systemNumber]
   * @returns {object} RFC connectivity details
   */
  async _handle_connection_check_rfc(params) {
    const { host, systemNumber } = params;

    return {
      available: true,
      host: host || 'sap-s4d.example.com',
      systemNumber: systemNumber || '00',
      pingTimeMs: 38,
      rfcSdkVersion: '7.50',
      nodeRfcAvailable: true,
      functionModulesAccessible: [
        'RFC_READ_TABLE',
        'RFC_SYSTEM_INFO',
        'BAPI_USER_GET_DETAIL',
      ],
      mode: 'mock',
    };
  }

  /**
   * Check OData connectivity specifically.
   * @param {object} params
   * @param {string} [params.baseUrl]
   * @param {string} [params.service]
   * @returns {object} OData connectivity details
   */
  async _handle_connection_check_odata(params) {
    const { baseUrl, service } = params;

    return {
      available: true,
      baseUrl: baseUrl || 'https://sap-s4d.example.com:443/sap/opu/odata/sap/',
      service: service || 'API_BUSINESS_PARTNER',
      csrfTokenObtained: true,
      servicesDiscovered: 12,
      responseTimeMs: 120,
      mode: 'mock',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Authorization Checks
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check SAP user authorizations.
   * @param {object} params
   * @param {string} [params.user]
   * @returns {object} Authorization check results
   */
  async _handle_connection_check_authorizations(params) {
    const { user } = params;

    return {
      user: user || 'SAPUSER',
      authorizations: [
        { object: 'S_RFC', status: 'granted', description: 'RFC access' },
        { object: 'S_TABU_DIS', status: 'granted', description: 'Table display' },
        { object: 'S_DEVELOP', status: 'limited', description: 'ABAP development' },
        { object: 'S_TCODE', status: 'granted', description: 'Transaction access' },
        { object: 'S_CTS_ADMI', status: 'not_checked', description: 'Transport admin' },
      ],
      overallStatus: 'sufficient',
      missingCritical: [],
    };
  }
}

module.exports = { ConnectionToolHandlers };
