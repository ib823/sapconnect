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
 * MCP Cloud Tool Handlers
 *
 * Handler functions for the 7 Cloud ALM and BTP provisioning MCP tools.
 * Mock mode returns realistic SAP Cloud ALM / BTP data; live mode will
 * connect to actual Cloud ALM and BTP APIs when available.
 *
 * Write operations are gated through SafetyGatesBridge to enforce
 * the AI safety pipeline (Generate -> Quality Check -> Human Review -> Transport).
 */

'use strict';

const Logger = require('../logger');

class CloudToolHandlers {
  /**
   * @param {object} [options]
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   * @param {object} [options.sessionContext] - Shared MCP session context
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.sessionContext = options.sessionContext || null;
    this.logger = options.logger || new Logger('mcp-cloud-handlers');

    /** @type {object|null} Lazy-loaded SafetyGatesBridge */
    this._safetyBridge = null;

    /** @type {object|null} Cached provisioning status */
    this._provisioningStatus = null;
  }

  /**
   * Route a tool call to the correct handler.
   * @param {string} toolName - Tool name (e.g., 'cloud_alm_sync_project')
   * @param {object} params - Tool parameters
   * @returns {object} Result payload
   */
  async handle(toolName, params) {
    const handlerName = `_handle_${toolName}`;
    const handler = this[handlerName];
    if (!handler) {
      throw new Error(`Unknown Cloud tool: ${toolName}`);
    }
    this.logger.debug(`Handling ${toolName}`, { params });
    const result = await handler.call(this, params || {});
    this.logger.debug(`Completed ${toolName}`, { resultKeys: Object.keys(result) });
    return result;
  }

  /**
   * Lazily initialize the SafetyGatesBridge.
   * @returns {object} SafetyGatesBridge instance
   */
  _ensureSafetyBridge() {
    if (!this._safetyBridge) {
      const SafetyGatesBridge = require('./safety-gates-bridge');
      this._safetyBridge = new SafetyGatesBridge({ mode: this.mode });
    }
    return this._safetyBridge;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cloud ALM Tools
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Sync migration project with SAP Cloud ALM.
   * @param {object} params
   * @param {string} [params.projectId]
   * @param {string} [params.projectName]
   * @param {string[]} [params.phases]
   * @returns {object} Sync result
   */
  async _handle_cloud_alm_sync_project(params) {
    const { projectId, projectName, phases } = params;

    const bridge = this._ensureSafetyBridge();
    const safetyResult = await bridge.check({
      toolName: 'cloud_alm_sync_project',
      operation: 'Sync migration project to Cloud ALM',
      dryRun: false,
      artifact: {
        name: 'cloud_alm_sync_project',
        type: 'configuration',
        metadata: { projectId, projectName },
      },
    });

    if (!safetyResult.allowed) {
      return {
        blocked: true,
        reason: safetyResult.reason,
        gateResults: safetyResult.gateResults,
      };
    }

    const resolvedProjectId = projectId || 'PROJ-001';
    const resolvedProjectName = projectName || 'S/4HANA Migration';
    const resolvedPhases = phases || ['discover', 'prepare', 'realize', 'deploy'];

    return {
      projectId: resolvedProjectId,
      projectName: resolvedProjectName,
      status: 'synced',
      almProjectUrl: `https://alm.cloud.sap/projects/${resolvedProjectId}`,
      phases: [
        { name: 'discover', status: 'completed', tasks: 12 },
        { name: 'prepare', status: 'in_progress', tasks: 24 },
        { name: 'realize', status: 'not_started', tasks: 48 },
        { name: 'deploy', status: 'not_started', tasks: 16 },
      ],
      lastSyncedAt: new Date().toISOString(),
      humanDecisionsRequired: [
        {
          id: 'ALM-001',
          category: 'project-setup',
          question: 'Which Cloud ALM project template to use?',
          options: ['SAP S/4HANA System Conversion', 'New Implementation', 'Custom'],
          impact: 'Determines project structure',
          blocking: false,
        },
      ],
    };
  }

  /**
   * Sync a specific task to Cloud ALM.
   * @param {object} params
   * @param {string} params.taskId
   * @param {string} params.status
   * @param {string} [params.assignee]
   * @returns {object} Task sync result
   */
  async _handle_cloud_alm_sync_task(params) {
    const { taskId, status, assignee } = params;

    const bridge = this._ensureSafetyBridge();
    const safetyResult = await bridge.check({
      toolName: 'cloud_alm_sync_task',
      operation: `Sync task ${taskId} to Cloud ALM with status ${status}`,
      dryRun: false,
      artifact: {
        name: 'cloud_alm_sync_task',
        type: 'configuration',
        metadata: { taskId, status, assignee },
      },
    });

    if (!safetyResult.allowed) {
      return {
        blocked: true,
        reason: safetyResult.reason,
        gateResults: safetyResult.gateResults,
      };
    }

    return {
      taskId,
      status,
      almTaskUrl: `https://alm.cloud.sap/tasks/${taskId}`,
      syncedAt: new Date().toISOString(),
      assignee: assignee || 'unassigned',
      previousStatus: 'open',
    };
  }

  /**
   * Push migration status update to Cloud ALM.
   * @param {object} params
   * @param {string} params.phase
   * @param {string} params.status
   * @param {object} [params.details]
   * @returns {object} Push result
   */
  async _handle_cloud_alm_push_status(params) {
    const { phase, status, details } = params;

    const bridge = this._ensureSafetyBridge();
    const safetyResult = await bridge.check({
      toolName: 'cloud_alm_push_status',
      operation: `Push status update for phase ${phase}: ${status}`,
      dryRun: false,
      artifact: {
        name: 'cloud_alm_push_status',
        type: 'configuration',
        metadata: { phase, status, details },
      },
    });

    if (!safetyResult.allowed) {
      return {
        blocked: true,
        reason: safetyResult.reason,
        gateResults: safetyResult.gateResults,
      };
    }

    return {
      phase,
      status,
      pushedAt: new Date().toISOString(),
      acknowledged: true,
      almDashboardUrl: `https://alm.cloud.sap/dashboard/${phase}`,
    };
  }

  /**
   * Create an issue/defect in Cloud ALM.
   * @param {object} params
   * @param {string} params.title
   * @param {string} params.description
   * @param {string} [params.priority='medium']
   * @param {string} [params.category]
   * @returns {object} Created issue
   */
  async _handle_cloud_alm_create_issue(params) {
    const { title, description, priority, category } = params;

    const bridge = this._ensureSafetyBridge();
    const safetyResult = await bridge.check({
      toolName: 'cloud_alm_create_issue',
      operation: `Create Cloud ALM issue: ${title}`,
      dryRun: false,
      artifact: {
        name: 'cloud_alm_create_issue',
        type: 'configuration',
        metadata: { title, priority, category },
      },
    });

    if (!safetyResult.allowed) {
      return {
        blocked: true,
        reason: safetyResult.reason,
        gateResults: safetyResult.gateResults,
      };
    }

    const issueId = `ISS-${Date.now()}`;
    return {
      issueId,
      title,
      priority: priority || 'medium',
      category: category || 'migration',
      status: 'open',
      almIssueUrl: `https://alm.cloud.sap/issues/${issueId}`,
      createdAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BTP Provisioning Tools
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Provision BTP services for migration.
   * @param {object} params
   * @param {string[]} params.services
   * @param {string} [params.landscape='cf-eu10']
   * @param {boolean} [params.dryRun=true]
   * @returns {object} Provisioning result
   */
  async _handle_cloud_provision_btp(params) {
    const { services, landscape, dryRun } = params;
    const isDryRun = dryRun !== false;
    const resolvedLandscape = landscape || 'cf-eu10';

    const bridge = this._ensureSafetyBridge();
    const safetyResult = await bridge.check({
      toolName: 'cloud_provision_btp',
      operation: `Provision BTP services: ${services.join(', ')}`,
      dryRun: isDryRun,
      artifact: {
        name: 'cloud_provision_btp',
        type: 'configuration',
        metadata: { services, landscape: resolvedLandscape },
      },
    });

    if (!safetyResult.allowed) {
      return {
        blocked: true,
        reason: safetyResult.reason,
        gateResults: safetyResult.gateResults,
      };
    }

    const serviceCosts = {
      'hana-cloud': 450,
      'integration-suite': 320,
      'launchpad': 180,
      'build-workzone': 250,
      'destination': 50,
      'connectivity': 80,
      'xsuaa': 0,
      'application-logging': 60,
    };

    const estimatedTimes = {
      'hana-cloud': 25,
      'integration-suite': 15,
      'launchpad': 10,
      'build-workzone': 12,
      'destination': 3,
      'connectivity': 5,
      'xsuaa': 2,
      'application-logging': 5,
    };

    const provisioningId = `PROV-${Date.now()}`;
    const mappedServices = services.map((s, i) => ({
      name: s,
      status: isDryRun ? 'planned' : 'provisioning',
      instanceId: isDryRun ? null : `inst-${Date.now()}-${i}`,
      plan: 'standard',
      estimatedTimeMin: estimatedTimes[s] || 10,
    }));

    const totalMonthlyCost = services.reduce((sum, s) => sum + (serviceCosts[s] || 100), 0);

    const result = {
      dryRun: isDryRun,
      services: mappedServices,
      landscape: resolvedLandscape,
      totalCostEstimate: {
        monthly: `$${totalMonthlyCost}`,
        currency: 'USD',
      },
      provisioningId: isDryRun ? null : provisioningId,
      humanDecisionsRequired: [
        {
          id: 'BTP-001',
          category: 'infrastructure',
          question: 'Which BTP service plans to use?',
          options: ['Standard', 'Premium', 'Enterprise'],
          impact: 'Affects cost and performance',
          blocking: true,
        },
      ],
    };

    // Cache provisioning status for cloud_get_provisioning_status
    if (!isDryRun) {
      this._provisioningStatus = {
        provisioningId,
        status: 'provisioning',
        services: mappedServices,
        landscape: resolvedLandscape,
        startedAt: new Date().toISOString(),
      };
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Read-Only Cloud Tools
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Discover available APIs on target system.
   * @param {object} params
   * @param {string} [params.systemType='S4HANA']
   * @param {string} [params.category]
   * @returns {object} API discovery result
   */
  async _handle_cloud_discover_apis(params) {
    const { systemType, category } = params;
    const resolvedSystemType = systemType || 'S4HANA';

    const allApis = [
      {
        name: 'API_BUSINESS_PARTNER',
        type: 'OData',
        version: 'V2',
        description: 'Business Partner API — create, read, update customers, suppliers, and contacts',
        authentication: 'OAuth2 / Basic',
        status: 'available',
        category: 'masterData',
      },
      {
        name: 'API_MATERIAL_DOCUMENT_SRV',
        type: 'OData',
        version: 'V2',
        description: 'Material Document API — goods movements, receipts, and inventory postings',
        authentication: 'OAuth2 / Basic',
        status: 'available',
        category: 'transactional',
      },
      {
        name: 'API_SALES_ORDER_SRV',
        type: 'OData',
        version: 'V2',
        description: 'Sales Order API — create and manage sales orders with items and schedules',
        authentication: 'OAuth2 / Basic',
        status: 'available',
        category: 'transactional',
      },
      {
        name: 'API_PRODUCT_SRV',
        type: 'OData',
        version: 'V4',
        description: 'Product Master API — material master data with classifications and descriptions',
        authentication: 'OAuth2 / Basic',
        status: 'available',
        category: 'masterData',
      },
      {
        name: 'API_JOURNAL_ENTRY_SRV',
        type: 'OData',
        version: 'V2',
        description: 'Journal Entry API — financial postings, accruals, and adjustments',
        authentication: 'OAuth2 / Basic',
        status: 'available',
        category: 'transactional',
      },
      {
        name: 'API_COST_CENTER_SRV',
        type: 'OData',
        version: 'V2',
        description: 'Cost Center API — organizational cost center master data',
        authentication: 'OAuth2 / Basic',
        status: 'available',
        category: 'masterData',
      },
      {
        name: 'YY1_ANALYTICS_SRV',
        type: 'OData',
        version: 'V2',
        description: 'Custom CDS Analytics API — embedded analytics and KPI queries',
        authentication: 'OAuth2',
        status: 'available',
        category: 'analytics',
      },
      {
        name: 'API_CLOUD_INTEGRATION',
        type: 'REST',
        version: 'V1',
        description: 'Cloud Integration API — message monitoring, iFlow management, and artifact deployment',
        authentication: 'OAuth2',
        status: 'available',
        category: 'integration',
      },
    ];

    let filteredApis = allApis;
    if (category) {
      filteredApis = allApis.filter(a => a.category === category);
    }

    const categories = {
      masterData: allApis.filter(a => a.category === 'masterData').length,
      transactional: allApis.filter(a => a.category === 'transactional').length,
      analytics: allApis.filter(a => a.category === 'analytics').length,
      integration: allApis.filter(a => a.category === 'integration').length,
    };

    return {
      systemType: resolvedSystemType,
      totalApis: filteredApis.length,
      apis: filteredApis,
      categories,
    };
  }

  /**
   * Get status of BTP provisioning.
   * @returns {object} Provisioning status
   */
  async _handle_cloud_get_provisioning_status() {
    if (this._provisioningStatus) {
      return this._provisioningStatus;
    }

    return {
      provisioningId: null,
      status: 'not_started',
      services: [],
      message: 'No provisioning in progress. Use cloud_provision_btp to start.',
    };
  }
}

module.exports = { CloudToolHandlers };
