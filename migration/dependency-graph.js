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
}

module.exports = { DependencyGraph, DEPENDENCIES };
