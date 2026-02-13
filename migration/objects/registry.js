/**
 * Migration Object Registry
 *
 * Central registry for all migration objects.
 * Auto-registers built-in objects; supports custom object registration.
 */

const Logger = require('../../lib/logger');
const { MigrationObjectError } = require('../../lib/errors');

class MigrationObjectRegistry {
  constructor() {
    this._classes = new Map();
    this._cache = new Map();
    this.logger = new Logger('mig-registry');
    this._registerBuiltins();
  }

  /** Register a migration object class by ID */
  registerClass(id, cls) {
    this._classes.set(id, cls);
  }

  /** Get or create a cached instance */
  getObject(id, gateway, options = {}) {
    if (!this._classes.has(id)) {
      throw new MigrationObjectError(`Unknown migration object: ${id}`, 'MIGOBJ_UNKNOWN');
    }
    const cacheKey = `${id}:${gateway.mode}`;
    if (!this._cache.has(cacheKey)) {
      this._cache.set(cacheKey, new (this._classes.get(id))(gateway, options));
    }
    return this._cache.get(cacheKey);
  }

  /** Create a fresh (non-cached) instance */
  createObject(id, gateway, options = {}) {
    if (!this._classes.has(id)) {
      throw new MigrationObjectError(`Unknown migration object: ${id}`, 'MIGOBJ_UNKNOWN');
    }
    return new (this._classes.get(id))(gateway, options);
  }

  /** List all registered object IDs */
  listObjectIds() {
    return Array.from(this._classes.keys());
  }

  /** List all objects with metadata (requires gateway for instantiation) */
  listObjects(gateway) {
    return this.listObjectIds().map((id) => {
      const obj = this.getObject(id, gateway);
      return { objectId: obj.objectId, name: obj.name };
    });
  }

  /** Run all registered migration objects sequentially */
  async runAll(gateway, options = {}) {
    const ids = this.listObjectIds();
    const results = [];
    const start = Date.now();
    let completed = 0;
    let failed = 0;

    for (const id of ids) {
      const obj = this.createObject(id, gateway, options);
      this.logger.info(`Running ${obj.name} (${obj.objectId})...`);
      const result = await obj.run();
      results.push(result);
      if (result.status === 'error' || result.status === 'validation_failed') {
        failed++;
      } else {
        completed++;
      }
    }

    return {
      results,
      stats: {
        total: ids.length,
        completed,
        failed,
        totalDurationMs: Date.now() - start,
      },
    };
  }

  /** Clear the instance cache */
  clearCache() {
    this._cache.clear();
  }

  /** Register all built-in migration objects */
  _registerBuiltins() {
    const builtins = {
      GL_BALANCE: require('./gl-balance'),
      BUSINESS_PARTNER: require('./business-partner'),
      MATERIAL_MASTER: require('./material-master'),
      PURCHASE_ORDER: require('./purchase-order'),
      SALES_ORDER: require('./sales-order'),
      FIXED_ASSET: require('./fixed-asset'),
      COST_CENTER: require('./cost-center'),
      PROFIT_CENTER: require('./profit-center'),
      INTERNAL_ORDER: require('./internal-order'),
      WBS_ELEMENT: require('./wbs-element'),
      INSPECTION_PLAN: require('./inspection-plan'),
      RFC_DESTINATION: require('./rfc-destination'),
      IDOC_CONFIG: require('./idoc-config'),
      WEB_SERVICE: require('./web-service'),
      BATCH_JOB: require('./batch-job'),
      FI_CONFIG: require('./fi-config'),
      CO_CONFIG: require('./co-config'),
      MM_CONFIG: require('./mm-config'),
      SD_CONFIG: require('./sd-config'),
      WAREHOUSE_STRUCTURE: require('./warehouse-structure'),
      TRANSPORT_ROUTE: require('./transport-route'),
      TRADE_COMPLIANCE: require('./trade-compliance'),
      BOM_ROUTING: require('./bom-routing'),
      BW_EXTRACTOR: require('./bw-extractor'),
      GL_ACCOUNT_MASTER: require('./gl-account-master'),
      CUSTOMER_OPEN_ITEM: require('./customer-open-item'),
      VENDOR_OPEN_ITEM: require('./vendor-open-item'),
      BANK_MASTER: require('./bank-master'),
      EMPLOYEE_MASTER: require('./employee-master'),
      EQUIPMENT_MASTER: require('./equipment-master'),
      WORK_CENTER: require('./work-center'),
      MAINTENANCE_ORDER: require('./maintenance-order'),
      PRODUCTION_ORDER: require('./production-order'),
      SOURCE_LIST: require('./source-list'),
      SCHEDULING_AGREEMENT: require('./scheduling-agreement'),
      PRICING_CONDITION: require('./pricing-condition'),
      FUNCTIONAL_LOCATION: require('./functional-location'),
      BATCH_MASTER: require('./batch-master'),
      PURCHASE_CONTRACT: require('./purchase-contract'),
      COST_ELEMENT: require('./cost-element'),
      ASSET_ACQUISITION: require('./asset-acquisition'),
      PROFIT_SEGMENT: require('./profit-segment'),
    };
    for (const [id, cls] of Object.entries(builtins)) {
      this.registerClass(id, cls);
    }
  }
}

module.exports = MigrationObjectRegistry;
