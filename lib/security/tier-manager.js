/**
 * Security Tier Manager
 *
 * Classifies operations by tier and enforces permission checks.
 * Uses OPERATION_TIERS mapping for known operations with a fallback
 * tier for unmapped operations. Integrates with user context to
 * determine whether an operation is permitted.
 */

'use strict';

const Logger = require('../logger');
const { SECURITY_TIERS, OPERATION_TIERS, getTierByLevel } = require('./tier-config');

class TierManager {
  /**
   * @param {object} [options]
   * @param {number} [options.defaultTier=4] - Tier for unmapped operations (fail-safe)
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    this.defaultTier = options.defaultTier ?? 4;
    this.logger = options.logger || new Logger('tier-manager');
  }

  /**
   * Get the tier level for an operation.
   * @param {string} operation - Dot-notation operation (e.g., 'migration.load_production')
   * @returns {number} Tier level (1-4)
   */
  getTier(operation) {
    if (!operation || typeof operation !== 'string') {
      return this.defaultTier;
    }
    const tier = OPERATION_TIERS[operation];
    if (tier !== undefined) {
      return tier;
    }
    this.logger.warn(`Unknown operation "${operation}", defaulting to tier ${this.defaultTier}`);
    return this.defaultTier;
  }

  /**
   * Get the full tier definition for an operation.
   * @param {string} operation
   * @returns {object} Tier definition ({ level, label, description, requiresApproval, approvers })
   */
  getTierDefinition(operation) {
    const level = this.getTier(operation);
    return getTierByLevel(level);
  }

  /**
   * Check whether a user is permitted to execute an operation.
   *
   * @param {string} operation - Operation identifier
   * @param {object} userContext - User context
   * @param {number} [userContext.maxTier] - Maximum tier the user is authorized for (1-4)
   * @param {string[]} [userContext.roles] - User roles
   * @param {string} [userContext.userId] - User identifier
   * @returns {{ allowed: boolean, tier: number, tierLabel: string, reason: string }}
   */
  checkPermission(operation, userContext = {}) {
    const tier = this.getTier(operation);
    const tierDef = getTierByLevel(tier);
    const maxTier = userContext.maxTier ?? 1;

    if (tier > maxTier) {
      return {
        allowed: false,
        tier,
        tierLabel: tierDef ? tierDef.label : `Tier ${tier}`,
        reason: `Operation "${operation}" requires tier ${tier} (${tierDef ? tierDef.label : 'Unknown'}) but user is authorized up to tier ${maxTier}`,
      };
    }

    // Check role-based access if roles are defined
    if (userContext.roles && tier === 4) {
      const hasAdminRole = userContext.roles.includes('admin') || userContext.roles.includes('production');
      if (!hasAdminRole) {
        return {
          allowed: false,
          tier,
          tierLabel: tierDef.label,
          reason: `Tier 4 (Production) operations require "admin" or "production" role`,
        };
      }
    }

    return {
      allowed: true,
      tier,
      tierLabel: tierDef ? tierDef.label : `Tier ${tier}`,
      reason: 'Permission granted',
    };
  }

  /**
   * Check whether an operation requires approval.
   * @param {string} operation
   * @returns {boolean}
   */
  requiresApproval(operation) {
    const tier = this.getTier(operation);
    const tierDef = getTierByLevel(tier);
    return tierDef ? tierDef.requiresApproval : true;
  }

  /**
   * Get the number of required approvers for an operation.
   * @param {string} operation
   * @returns {number}
   */
  getRequiredApprovers(operation) {
    const tier = this.getTier(operation);
    const tierDef = getTierByLevel(tier);
    return tierDef ? tierDef.approvers : 2;
  }

  /**
   * List all known operations grouped by tier.
   * @returns {object} Map of tier level → operation names
   */
  listOperationsByTier() {
    const grouped = { 1: [], 2: [], 3: [], 4: [] };
    for (const [op, tier] of Object.entries(OPERATION_TIERS)) {
      if (grouped[tier]) {
        grouped[tier].push(op);
      }
    }
    return grouped;
  }

  /**
   * Classify an operation and return a summary.
   * @param {string} operation
   * @returns {object} Classification with tier, label, approval requirements
   */
  classify(operation) {
    const tier = this.getTier(operation);
    const tierDef = getTierByLevel(tier);
    return {
      operation,
      tier,
      label: tierDef ? tierDef.label : `Tier ${tier}`,
      description: tierDef ? tierDef.description : 'Unknown tier',
      requiresApproval: tierDef ? tierDef.requiresApproval : true,
      requiredApprovers: tierDef ? tierDef.approvers : 2,
    };
  }
}

module.exports = { TierManager };
