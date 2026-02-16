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
 * Safety Gates Bridge for MCP
 *
 * Wraps the existing SafetyGates class to enforce write-operation
 * safety checks on MCP tool calls. All tools that modify SAP systems
 * must pass through this bridge before execution.
 */

'use strict';

const SafetyGates = require('../ai/safety-gates');
const Logger = require('../logger');

class SafetyGatesBridge {
  /**
   * @param {object} [options]
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   * @param {string} [options.strictness='moderate']
   * @param {object} [options.logger]
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.log = options.logger || new Logger('safety-gates-bridge');
    this.gates = new SafetyGates({
      mode: this.mode,
      strictness: options.strictness || 'moderate',
      logger: this.log,
    });
  }

  /**
   * Check if a write operation is allowed.
   * @param {object} params
   * @param {string} params.toolName — MCP tool name
   * @param {string} params.operation — Description of the write operation
   * @param {boolean} [params.dryRun=true] — If true, skip safety check
   * @param {object} [params.artifact] — Artifact details for gate validation
   * @returns {object} { allowed, reason, gateResults }
   */
  async check(params) {
    const { toolName, operation, dryRun = true, artifact } = params;

    // Dry-run mode always allowed
    if (dryRun) {
      return {
        allowed: true,
        reason: 'Dry-run mode — no system changes',
        dryRun: true,
        gateResults: [],
      };
    }

    // Mock mode — simulate safety check
    if (this.mode === 'mock') {
      this.log.info(`Safety check (mock): ${toolName} — ${operation}`);
      return {
        allowed: true,
        reason: 'Mock mode — safety gates simulated',
        dryRun: false,
        gateResults: [
          { name: 'mock-gate', status: 'passed', message: 'Mock mode auto-pass' },
        ],
      };
    }

    // Live mode — run through actual safety gates
    if (artifact) {
      const validation = await this.gates.validateArtifact(artifact);
      return {
        allowed: validation.approved,
        reason: validation.approved
          ? 'All safety gates passed'
          : `Safety gates blocked: ${validation.overallStatus}`,
        dryRun: false,
        gateResults: validation.gates,
      };
    }

    // No artifact provided — default to requiring confirmation
    return {
      allowed: false,
      reason: 'Write operation requires artifact details for safety validation',
      dryRun: false,
      gateResults: [],
    };
  }

  /**
   * Request human approval for a write operation.
   * @param {object} params
   * @param {string} params.toolName
   * @param {string} params.operation
   * @param {object} params.details
   * @returns {object} Approval request
   */
  requestApproval(params) {
    const { toolName, operation, details } = params;
    const artifact = {
      name: toolName,
      type: 'configuration',
      metadata: { operation, ...details },
    };
    return this.gates.requestApproval(artifact, []);
  }

  /**
   * Get the audit trail.
   * @param {object} [filters]
   * @returns {object[]}
   */
  getAuditTrail(filters = {}) {
    return this.gates.getAuditLog(filters);
  }
}

module.exports = SafetyGatesBridge;
