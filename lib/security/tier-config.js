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
 * 4-Tier Security Configuration
 *
 * Defines the four security tiers (Assessment, Development, Staging, Production)
 * and maps every platform operation to its required security tier.
 * Approval policies govern which operations need human sign-off.
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Tier Definitions
// ─────────────────────────────────────────────────────────────────────────────

const SECURITY_TIERS = {
  ASSESSMENT: {
    level: 1,
    label: 'Assessment',
    description: 'Read-only analysis and discovery',
    requiresApproval: false,
    approvers: 0,
    color: 'green',
  },
  DEVELOPMENT: {
    level: 2,
    label: 'Development',
    description: 'Development and sandbox changes',
    requiresApproval: false,
    approvers: 0,
    color: 'blue',
  },
  STAGING: {
    level: 3,
    label: 'Staging',
    description: 'Pre-production validation and staging loads',
    requiresApproval: true,
    approvers: 1,
    color: 'orange',
  },
  PRODUCTION: {
    level: 4,
    label: 'Production',
    description: 'Production system changes — highest risk',
    requiresApproval: true,
    approvers: 2,
    color: 'red',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Operation → Tier Mapping
// ─────────────────────────────────────────────────────────────────────────────

const OPERATION_TIERS = {
  // Extraction (read-only)
  'extraction.run': 1,
  'extraction.export': 1,
  'extraction.schedule': 1,
  'extraction.profile': 1,

  // Migration — analysis
  'migration.analyze': 1,
  'migration.assess': 1,
  'migration.map_fields': 1,
  'migration.compare': 1,

  // Migration — development
  'migration.transform': 2,
  'migration.validate': 2,
  'migration.load_sandbox': 2,
  'migration.test_run': 2,
  'migration.generate_template': 2,

  // Migration — staging
  'migration.load_staging': 3,
  'migration.cutover_rehearsal': 3,
  'migration.data_reconciliation': 3,

  // Migration — production
  'migration.load_production': 4,
  'migration.cutover_execute': 4,
  'migration.go_live': 4,

  // Transport management
  'transport.create': 2,
  'transport.modify': 2,
  'transport.release': 3,
  'transport.import': 4,
  'transport.import_staging': 3,
  'transport.import_production': 4,

  // Code changes
  'code.read': 1,
  'code.analyze': 1,
  'code.generate': 2,
  'code.write_sandbox': 2,
  'code.write_dev': 2,
  'code.activate_staging': 3,
  'code.activate_production': 4,

  // Configuration
  'config.read': 1,
  'config.export': 1,
  'config.change_sandbox': 2,
  'config.change_dev': 2,
  'config.change_staging': 3,
  'config.change_production': 4,

  // System administration
  'system.info': 1,
  'system.health_check': 1,
  'system.connection_test': 1,
  'system.user_management': 3,
  'system.auth_config': 4,
  'system.security_policy': 4,

  // AI operations
  'ai.generate': 2,
  'ai.review': 1,
  'ai.auto_remediate_sandbox': 2,
  'ai.auto_remediate_staging': 3,
  'ai.auto_remediate_production': 4,

  // Infor-specific
  'infor.query_bod': 1,
  'infor.profile_db': 1,
  'infor.run_assessment': 1,
  'infor.execute_m3api': 2,
  'infor.migrate_object': 2,
  'infor.migrate_staging': 3,
  'infor.migrate_production': 4,
};

// ─────────────────────────────────────────────────────────────────────────────
// Tier Lookup Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the tier definition by level number.
 * @param {number} level - Tier level (1-4)
 * @returns {object|null} Tier definition or null
 */
function getTierByLevel(level) {
  return Object.values(SECURITY_TIERS).find(t => t.level === level) || null;
}

/**
 * Get the tier definition by name.
 * @param {string} name - Tier name (ASSESSMENT, DEVELOPMENT, STAGING, PRODUCTION)
 * @returns {object|null} Tier definition or null
 */
function getTierByName(name) {
  return SECURITY_TIERS[name] || null;
}

/**
 * Get all operation names for a given tier level.
 * @param {number} level - Tier level (1-4)
 * @returns {string[]} Array of operation names
 */
function getOperationsForTier(level) {
  return Object.entries(OPERATION_TIERS)
    .filter(([, tier]) => tier === level)
    .map(([op]) => op);
}

module.exports = {
  SECURITY_TIERS,
  OPERATION_TIERS,
  getTierByLevel,
  getTierByName,
  getOperationsForTier,
};
