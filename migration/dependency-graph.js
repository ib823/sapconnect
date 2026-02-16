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
 * Migration Object Dependency Graph
 *
 * Determines the correct execution order for migration objects
 * based on data dependencies (e.g., GL accounts before GL balances).
 * Uses topological sort.
 */

const Logger = require('../lib/logger');

// Object dependency definitions
// Key depends on values (values must be migrated first)
const DEPENDENCIES = {
  GL_BALANCE: ['GL_ACCOUNT_MASTER'],
  GL_ACCOUNT_MASTER: [],
  CUSTOMER_OPEN_ITEM: ['BUSINESS_PARTNER'],
  VENDOR_OPEN_ITEM: ['BUSINESS_PARTNER'],
  BUSINESS_PARTNER: ['BANK_MASTER'],
  MATERIAL_MASTER: [],
  PURCHASE_ORDER: ['BUSINESS_PARTNER', 'MATERIAL_MASTER'],
  SALES_ORDER: ['BUSINESS_PARTNER', 'MATERIAL_MASTER', 'PRICING_CONDITION'],
  FIXED_ASSET: ['COST_CENTER'],
  ASSET_ACQUISITION: ['FIXED_ASSET'],
  COST_CENTER: ['PROFIT_CENTER'],
  COST_ELEMENT: [],
  PROFIT_CENTER: [],
  PROFIT_SEGMENT: ['PROFIT_CENTER'],
  BANK_MASTER: [],
  EMPLOYEE_MASTER: ['BUSINESS_PARTNER'],
  EQUIPMENT_MASTER: ['FUNCTIONAL_LOCATION'],
  FUNCTIONAL_LOCATION: [],
  WORK_CENTER: ['COST_CENTER'],
  MAINTENANCE_ORDER: ['EQUIPMENT_MASTER', 'WORK_CENTER'],
  PRODUCTION_ORDER: ['MATERIAL_MASTER', 'WORK_CENTER'],
  BATCH_MASTER: ['MATERIAL_MASTER'],
  SOURCE_LIST: ['BUSINESS_PARTNER', 'MATERIAL_MASTER'],
  SCHEDULING_AGREEMENT: ['BUSINESS_PARTNER', 'MATERIAL_MASTER'],
  PURCHASE_CONTRACT: ['BUSINESS_PARTNER', 'MATERIAL_MASTER'],
  PRICING_CONDITION: ['MATERIAL_MASTER'],
  FI_CONFIG: [],
  CO_CONFIG: [],
  MM_CONFIG: [],
  SD_CONFIG: [],
  WBS_ELEMENT: ['PROFIT_CENTER', 'COST_CENTER'],
  INTERNAL_ORDER: ['COST_CENTER'],
  RFC_DESTINATION: [],
  IDOC_CONFIG: [],
  WEB_SERVICE: [],
  BATCH_JOB: [],
  WAREHOUSE_STRUCTURE: [],
  TRANSPORT_ROUTE: [],
  TRADE_COMPLIANCE: [],
  BW_EXTRACTOR: [],
  BOM_ROUTING: ['MATERIAL_MASTER', 'WORK_CENTER'],
  INSPECTION_PLAN: ['MATERIAL_MASTER'],
  // Infor LN migration objects
  INFOR_LN_ORG_STRUCTURE: [],
  INFOR_LN_GL_ACCOUNT: ['INFOR_LN_ORG_STRUCTURE'],
  INFOR_LN_GL_JOURNAL: ['INFOR_LN_GL_ACCOUNT'],
  INFOR_LN_BUSINESS_PARTNER: ['INFOR_LN_ORG_STRUCTURE'],
  INFOR_LN_ITEM_MASTER: ['INFOR_LN_ORG_STRUCTURE'],
  INFOR_LN_SALES_ORDER: ['INFOR_LN_BUSINESS_PARTNER', 'INFOR_LN_ITEM_MASTER'],
  INFOR_LN_PURCHASE_ORDER: ['INFOR_LN_BUSINESS_PARTNER', 'INFOR_LN_ITEM_MASTER'],
  INFOR_LN_BOM: ['INFOR_LN_ITEM_MASTER'],
  INFOR_LN_ROUTING: ['INFOR_LN_ITEM_MASTER'],
  INFOR_LN_COST_CENTER: ['INFOR_LN_ORG_STRUCTURE'],
  INFOR_LN_FIXED_ASSET: ['INFOR_LN_COST_CENTER'],
  // Infor M3 migration objects
  INFOR_M3_ORG_STRUCTURE: [],
  INFOR_M3_GL_ACCOUNT: ['INFOR_M3_ORG_STRUCTURE'],
  INFOR_M3_GL_JOURNAL: ['INFOR_M3_GL_ACCOUNT'],
  INFOR_M3_CUSTOMER: ['INFOR_M3_ORG_STRUCTURE'],
  INFOR_M3_VENDOR: ['INFOR_M3_ORG_STRUCTURE'],
  INFOR_M3_ITEM_MASTER: ['INFOR_M3_ORG_STRUCTURE'],
  INFOR_M3_SALES_ORDER: ['INFOR_M3_CUSTOMER', 'INFOR_M3_ITEM_MASTER'],
  INFOR_M3_PURCHASE_ORDER: ['INFOR_M3_VENDOR', 'INFOR_M3_ITEM_MASTER'],
  INFOR_M3_BOM: ['INFOR_M3_ITEM_MASTER'],
  INFOR_M3_PRODUCTION_ORDER: ['INFOR_M3_ITEM_MASTER'],
};

class DependencyGraph {
  constructor(options = {}) {
    this.logger = new Logger('dep-graph', { level: options.logLevel || 'info' });
    this.dependencies = { ...DEPENDENCIES };
  }

  /**
   * Add or update dependencies for an object
   */
  setDependencies(objectId, deps) {
    this.dependencies[objectId] = deps;
  }

  /**
   * Get direct dependencies of an object
   */
  getDependencies(objectId) {
    return this.dependencies[objectId] || [];
  }

  /**
   * Get all transitive dependencies (full dependency tree)
   */
  getTransitiveDependencies(objectId, visited = new Set()) {
    if (visited.has(objectId)) return [];
    visited.add(objectId);

    const direct = this.getDependencies(objectId);
    const all = [...direct];

    for (const dep of direct) {
      const transitive = this.getTransitiveDependencies(dep, visited);
      for (const t of transitive) {
        if (!all.includes(t)) all.push(t);
      }
    }

    return all;
  }

  /**
   * Topological sort - returns objects in valid execution order
   */
  getExecutionOrder(objectIds) {
    const available = new Set(objectIds);
    const visited = new Set();
    const order = [];

    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);

      const deps = this.getDependencies(id).filter(d => available.has(d));
      for (const dep of deps) {
        visit(dep);
      }

      order.push(id);
    };

    for (const id of objectIds) {
      visit(id);
    }

    return order;
  }

  /**
   * Get objects grouped by execution wave (can run in parallel within a wave)
   */
  getExecutionWaves(objectIds) {
    const available = new Set(objectIds);
    const completed = new Set();
    const waves = [];

    while (completed.size < available.size) {
      const wave = [];

      for (const id of available) {
        if (completed.has(id)) continue;
        const deps = this.getDependencies(id).filter(d => available.has(d));
        if (deps.every(d => completed.has(d))) {
          wave.push(id);
        }
      }

      if (wave.length === 0) {
        // Circular dependency — add remaining objects
        const remaining = [...available].filter(id => !completed.has(id));
        this.logger.warn(`Circular dependency detected, forcing: ${remaining.join(', ')}`);
        waves.push(remaining);
        break;
      }

      waves.push(wave);
      for (const id of wave) completed.add(id);
    }

    return waves;
  }

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies() {
    const circles = [];
    const visited = new Set();
    const inStack = new Set();

    const dfs = (id, path) => {
      if (inStack.has(id)) {
        const cycleStart = path.indexOf(id);
        circles.push(path.slice(cycleStart).concat(id));
        return;
      }
      if (visited.has(id)) return;

      visited.add(id);
      inStack.add(id);

      for (const dep of this.getDependencies(id)) {
        dfs(dep, [...path, id]);
      }

      inStack.delete(id);
    };

    for (const id of Object.keys(this.dependencies)) {
      dfs(id, []);
    }

    return circles;
  }

  /**
   * Validate that all dependencies exist in the registry
   */
  validate(registeredIds) {
    const registered = new Set(registeredIds);
    const issues = [];

    for (const [objectId, deps] of Object.entries(this.dependencies)) {
      for (const dep of deps) {
        if (!registered.has(dep)) {
          issues.push({ objectId, missingDependency: dep });
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      circularDependencies: this.detectCircularDependencies(),
    };
  }

  // ── Selective Migration ──────────────────────────────────────

  /**
   * Select a subset of objects and resolve all required dependencies.
   * @param {string[]} selectedIds — Objects the user wants to migrate
   * @returns {string[]} — Full set including transitive dependencies, in execution order
   */
  selectSubset(selectedIds) {
    const required = new Set();

    const collectDeps = (id) => {
      if (required.has(id)) return;
      required.add(id);
      for (const dep of this.getDependencies(id)) {
        collectDeps(dep);
      }
    };

    for (const id of selectedIds) {
      collectDeps(id);
    }

    const allRequired = Array.from(required);
    return this.getExecutionOrder(allRequired);
  }

  /**
   * Select all objects belonging to a module.
   * Module is inferred from object ID prefix or provided module map.
   * @param {string} moduleCode — e.g. 'FI', 'MM', 'SD'
   * @param {object} [moduleMap] — { objectId: moduleCode } mapping
   * @returns {string[]} — Full set including cross-module dependencies, in order
   */
  selectModule(moduleCode, moduleMap = {}) {
    // Default module mapping from object ID convention
    const defaultModules = {
      GL_BALANCE: 'FI', GL_ACCOUNT_MASTER: 'FI', FI_CONFIG: 'FI',
      CUSTOMER_OPEN_ITEM: 'FI', VENDOR_OPEN_ITEM: 'FI',
      COST_CENTER: 'CO', COST_ELEMENT: 'CO', PROFIT_CENTER: 'CO',
      PROFIT_SEGMENT: 'CO', CO_CONFIG: 'CO', INTERNAL_ORDER: 'CO',
      WBS_ELEMENT: 'PS',
      MATERIAL_MASTER: 'MM', PURCHASE_ORDER: 'MM', BATCH_MASTER: 'MM',
      SOURCE_LIST: 'MM', MM_CONFIG: 'MM', PURCHASE_CONTRACT: 'MM',
      SCHEDULING_AGREEMENT: 'MM',
      SALES_ORDER: 'SD', PRICING_CONDITION: 'SD', SD_CONFIG: 'SD',
      FIXED_ASSET: 'AA', ASSET_ACQUISITION: 'AA',
      BUSINESS_PARTNER: 'BP', BANK_MASTER: 'BP',
      EMPLOYEE_MASTER: 'HR',
      EQUIPMENT_MASTER: 'PM', FUNCTIONAL_LOCATION: 'PM',
      WORK_CENTER: 'PP', MAINTENANCE_ORDER: 'PM',
      PRODUCTION_ORDER: 'PP', BOM_ROUTING: 'PP', INSPECTION_PLAN: 'QM',
      WAREHOUSE_STRUCTURE: 'WM',
      RFC_DESTINATION: 'BASIS', IDOC_CONFIG: 'BASIS',
      WEB_SERVICE: 'BASIS', BATCH_JOB: 'BASIS',
      TRANSPORT_ROUTE: 'BASIS', BW_EXTRACTOR: 'BW',
      TRADE_COMPLIANCE: 'GTS',
    };

    const effectiveMap = { ...defaultModules, ...moduleMap };
    const moduleIds = Object.entries(effectiveMap)
      .filter(([, mod]) => mod === moduleCode)
      .map(([id]) => id)
      .filter(id => id in this.dependencies);

    return this.selectSubset(moduleIds);
  }

  /**
   * Impact analysis: what objects would be affected if we skip this object?
   * @param {string} objectId
   * @returns {string[]} — All objects that depend (transitively) on objectId
   */
  getImpact(objectId) {
    const impacted = new Set();

    const collectReverse = (id) => {
      for (const [candidate, deps] of Object.entries(this.dependencies)) {
        if (deps.includes(id) && !impacted.has(candidate)) {
          impacted.add(candidate);
          collectReverse(candidate);
        }
      }
    };

    collectReverse(objectId);
    return Array.from(impacted);
  }

  /**
   * Get statistics about the dependency graph.
   * @returns {object}
   */
  getStats() {
    const ids = Object.keys(this.dependencies);
    const edgeCount = Object.values(this.dependencies)
      .reduce((sum, deps) => sum + deps.length, 0);

    const roots = ids.filter(id => this.dependencies[id].length === 0);
    const leaves = ids.filter(id => {
      return !Object.values(this.dependencies).some(deps => deps.includes(id));
    });

    return {
      totalNodes: ids.length,
      totalEdges: edgeCount,
      roots,
      leaves,
      cycles: this.detectCircularDependencies().length,
    };
  }
}

module.exports = { DependencyGraph, DEPENDENCIES };
