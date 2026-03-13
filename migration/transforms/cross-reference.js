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
 * Rule ID → Transform ID Cross-Reference
 *
 * Maps rule IDs from the registry to transform IDs that handle them.
 * This resolves the mismatch between rule IDs (SIMPL-DM-001) and
 * auto-generated transform IDs (SIMPL-TBL-KONV, SIMPL-FM-BAPI_PO_CREATE1).
 */

const RULE_TO_TRANSFORM = {};
let initialized = false;

/**
 * Build cross-reference by scanning all rules and matching their patterns
 * to existing TABLE_RENAMES and FM_REPLACEMENTS transforms.
 *
 * @param {Array} rules - All rules from the registry
 * @param {Object} tableRenames - TABLE_RENAMES dict from transforms.js
 * @param {Object} fmReplacements - FM_REPLACEMENTS dict from transforms.js
 */
function buildCrossReference(rules, tableRenames, fmReplacements) {
  for (const rule of rules) {
    // Skip if rule already has a direct transform (handled elsewhere)
    if (RULE_TO_TRANSFORM[rule.id]) continue;

    const patternSource = rule.pattern?.source || String(rule.pattern);
    // Normalize: strip regex metacharacters for plain-text comparison
    const patternText = patternSource.toUpperCase();

    // Match rule pattern against TABLE_RENAMES entries
    for (const [table] of Object.entries(tableRenames)) {
      if (patternText.includes(table.toUpperCase())) {
        RULE_TO_TRANSFORM[rule.id] = `SIMPL-TBL-${table}`;
        break;
      }
    }

    // Match rule pattern against FM_REPLACEMENTS entries
    if (!RULE_TO_TRANSFORM[rule.id]) {
      for (const fm of Object.keys(fmReplacements)) {
        if (patternText.includes(fm.toUpperCase())) {
          RULE_TO_TRANSFORM[rule.id] = `SIMPL-FM-${fm.substring(0, 20)}`;
          break;
        }
      }
    }
  }
  initialized = true;
}

function isInitialized() {
  return initialized;
}

/**
 * Reset cross-reference state (for testing)
 */
function reset() {
  for (const key of Object.keys(RULE_TO_TRANSFORM)) {
    delete RULE_TO_TRANSFORM[key];
  }
  initialized = false;
}

module.exports = { RULE_TO_TRANSFORM, buildCrossReference, isInitialized, reset };
