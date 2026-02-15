/**
 * Operation Logger
 *
 * Enhanced audit logging specifically for tiered operations (tier 2+).
 * Records operation execution with tier classification, user context,
 * execution results, and timing. Integrates with the existing AuditLogger
 * for centralized audit trail.
 */

'use strict';

const Logger = require('../logger');
const { AuditLogger, AUDIT_EVENTS } = require('./audit-logger');
const { TierManager } = require('./tier-manager');

class OperationLogger {
  /**
   * @param {object} [options]
   * @param {object} [options.auditLogger] - Existing AuditLogger instance
   * @param {object} [options.tierManager] - TierManager instance
   * @param {object} [options.logger] - Logger instance
   * @param {number} [options.maxEntries=10000] - Max in-memory entries
   */
  constructor(options = {}) {
    this.auditLogger = options.auditLogger || new AuditLogger({ store: 'memory' });
    this.tierManager = options.tierManager || new TierManager();
    this.logger = options.logger || new Logger('operation-logger');
    this._entries = [];
    this._maxEntries = options.maxEntries || 10000;
  }

  /**
   * Log a tiered operation execution.
   *
   * @param {string} operation - Operation identifier (e.g., 'transport.import')
   * @param {number} tier - Tier level (1-4)
   * @param {string} user - User who executed the operation
   * @param {object} [details] - Contextual details about the operation
   * @param {object} [result] - Operation result
   * @param {string} [result.status] - 'success', 'failure', 'error'
   * @param {number} [result.durationMs] - Execution duration
   * @param {*} [result.data] - Result data
   * @param {string} [result.error] - Error message if failed
   * @returns {object} Log entry
   */
  logOperation(operation, tier, user, details = {}, result = {}) {
    const entry = {
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      operation,
      tier,
      tierLabel: this._getTierLabel(tier),
      user,
      details,
      result: {
        status: result.status || 'success',
        durationMs: result.durationMs || null,
        data: result.data || null,
        error: result.error || null,
      },
      approvalId: details.approvalId || null,
    };

    this._entries.push(entry);
    if (this._entries.length > this._maxEntries) {
      this._entries = this._entries.slice(-this._maxEntries);
    }

    // Also log to audit logger for tier 2+
    if (tier >= 2) {
      const auditEvent = result.status === 'success'
        ? AUDIT_EVENTS.ADMIN_ACTION
        : AUDIT_EVENTS.API_ERROR;

      this.auditLogger.log(auditEvent, {
        actor: user,
        resource: operation,
        action: 'execute',
        outcome: result.status || 'success',
        metadata: {
          tier,
          tierLabel: entry.tierLabel,
          durationMs: result.durationMs,
          approvalId: entry.approvalId,
          ...details,
        },
      });
    }

    this.logger.info(`Operation logged: ${operation} (tier ${tier}) by ${user} — ${result.status || 'success'}`, {
      durationMs: result.durationMs,
    });

    return { ...entry };
  }

  /**
   * Query the audit trail with filters.
   *
   * @param {object} [filters]
   * @param {string} [filters.operation] - Filter by operation
   * @param {number} [filters.tier] - Filter by tier
   * @param {string} [filters.user] - Filter by user
   * @param {string} [filters.status] - Filter by result status
   * @param {string} [filters.since] - ISO date string — entries after this time
   * @param {string} [filters.until] - ISO date string — entries before this time
   * @param {number} [filters.limit=100] - Max results
   * @param {number} [filters.offset=0] - Skip first N results
   * @returns {{ total: number, entries: object[] }}
   */
  getAuditTrail(filters = {}) {
    let results = [...this._entries];

    if (filters.operation) {
      results = results.filter(e => e.operation === filters.operation);
    }
    if (filters.tier !== undefined) {
      results = results.filter(e => e.tier === filters.tier);
    }
    if (filters.user) {
      results = results.filter(e => e.user === filters.user);
    }
    if (filters.status) {
      results = results.filter(e => e.result.status === filters.status);
    }
    if (filters.since) {
      const since = new Date(filters.since).toISOString();
      results = results.filter(e => e.timestamp >= since);
    }
    if (filters.until) {
      const until = new Date(filters.until).toISOString();
      results = results.filter(e => e.timestamp <= until);
    }

    const total = results.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;

    return {
      total,
      entries: results.slice(offset, offset + limit),
    };
  }

  /**
   * Get the operation history for a specific operation.
   * @param {string} operation - Operation identifier
   * @param {object} [options]
   * @param {number} [options.limit=50] - Max results
   * @returns {object[]} Array of log entries for this operation
   */
  getOperationHistory(operation, options = {}) {
    const limit = options.limit || 50;
    const entries = this._entries
      .filter(e => e.operation === operation)
      .slice(-limit);
    return entries.map(e => ({ ...e }));
  }

  /**
   * Get aggregated statistics for logged operations.
   * @returns {object} Statistics summary
   */
  getStats() {
    const byTier = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const byStatus = { success: 0, failure: 0, error: 0 };
    const byOperation = {};
    const byUser = {};

    for (const entry of this._entries) {
      byTier[entry.tier] = (byTier[entry.tier] || 0) + 1;
      const status = entry.result.status;
      byStatus[status] = (byStatus[status] || 0) + 1;
      byOperation[entry.operation] = (byOperation[entry.operation] || 0) + 1;
      byUser[entry.user] = (byUser[entry.user] || 0) + 1;
    }

    return {
      totalEntries: this._entries.length,
      byTier,
      byStatus,
      byOperation,
      byUser,
      oldestEntry: this._entries[0]?.timestamp || null,
      newestEntry: this._entries[this._entries.length - 1]?.timestamp || null,
    };
  }

  /**
   * Clear all entries (for testing).
   */
  clear() {
    this._entries = [];
  }

  /** @private */
  _getTierLabel(tier) {
    const labels = { 1: 'Assessment', 2: 'Development', 3: 'Staging', 4: 'Production' };
    return labels[tier] || `Tier ${tier}`;
  }

  /** @private */
  _generateId() {
    return `opl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

module.exports = { OperationLogger };
