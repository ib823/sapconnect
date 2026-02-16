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

'use strict';

/**
 * Safety gate enforcement for all SAP write operations.
 *
 * LEGAL CONTEXT: These safety gates serve dual purposes:
 * 1. Protect customer SAP systems from unintended modifications
 * 2. Demonstrate that SEN is a human-controlled tool, not an autonomous
 *    system making decisions on SAP systems — this distinction matters
 *    for SAP licensing and supportability
 *
 * All write operations MUST pass through enforceSafetyGate() before
 * executing against a live SAP system.
 */

const WRITE_OPERATIONS = new Set([
  'writeSource',           // ABAP source code writes
  'createTransport',       // Transport request creation
  'releaseTransport',      // Transport release
  'executeBdcSession',     // BDC configuration automation
  'executeBapi',           // BAPI execution (create/update/delete)
  'runMigrationObject',    // SDT/migration data load
  'runMigrationBatch',     // Batch migration execution
  'writeTargetConfiguration', // Target system config writes
  'setupCloudIntegration', // Integration configuration
  'generateBtpProvisioning' // BTP service provisioning
]);

const READ_OPERATIONS = new Set([
  'searchObject', 'getSource', 'getTableStructure', 'getTableData',
  'getRelationships', 'getCdsView', 'getSystemInfo', 'getTransportStatus',
  'runAtcCheck', 'getAtcFindings', 'getCleanCoreStatus',
  'runCustomCodeAnalysis', 'getCutoverPlan', 'getGoNoGoChecklist',
  'getRollbackPlan', 'runMigrationAssessment', 'runForensicExtraction',
  'runReconciliation', 'connectToSystem', 'healthCheckAll',
  'listConnections', 'readSourceConfiguration', 'discoverApis',
  'runArchivingAdvisor', 'getMigrationPlan', 'getCheckpointStatus'
]);

/**
 * Enforce safety gate for an operation.
 * Write operations require dryRun=false to be explicitly set.
 * Returns { allowed: true/false, reason: string }
 */
function enforceSafetyGate(operation, params = {}) {
  // Read operations always pass
  if (READ_OPERATIONS.has(operation)) {
    return { allowed: true, reason: 'read-operation' };
  }

  // Write operations require explicit opt-in
  if (WRITE_OPERATIONS.has(operation)) {
    if (params.dryRun !== false) {
      return {
        allowed: false,
        reason: 'write-operation-requires-explicit-live-mode',
        message: `Operation "${operation}" modifies SAP system data. ` +
                 `Set dryRun=false to execute. Current mode: dry-run (safe preview).`,
        preview: true
      };
    }
    return { allowed: true, reason: 'write-operation-live-mode-confirmed' };
  }

  // Unknown operations default to denied
  return {
    allowed: false,
    reason: 'unknown-operation',
    message: `Operation "${operation}" is not registered in safety gates.`
  };
}

/**
 * Log a safety gate decision for audit purposes.
 */
function logSafetyDecision(operation, params, decision, auditLogger) {
  const entry = {
    timestamp: new Date().toISOString(),
    operation,
    decision: decision.allowed ? 'ALLOWED' : 'BLOCKED',
    reason: decision.reason,
    dryRun: params.dryRun !== false,
    targetSystem: params.systemId || params.target || 'unknown'
  };

  if (auditLogger && typeof auditLogger.record === 'function') {
    auditLogger.record(entry);
  }

  return entry;
}

module.exports = {
  WRITE_OPERATIONS,
  READ_OPERATIONS,
  enforceSafetyGate,
  logSafetyDecision
};
