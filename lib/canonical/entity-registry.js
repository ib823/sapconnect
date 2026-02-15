/**
 * Canonical Entity Registry
 *
 * Central registry for all OAGIS-aligned canonical data model entities.
 * Auto-registers the 14 built-in entity types on load.
 */

const Logger = require('../logger');
const { CanonicalMappingError } = require('../errors');

const log = new Logger('canonical-registry');

class EntityRegistry {
  static _entities = new Map();

  /**
   * Register a canonical entity class.
   * @param {string} entityType — canonical type name (e.g. 'Item')
   * @param {Function} EntityClass — class extending BaseCanonicalEntity
   */
  static register(entityType, EntityClass) {
    if (EntityRegistry._entities.has(entityType)) {
      log.warn(`Overwriting existing entity registration: ${entityType}`);
    }
    EntityRegistry._entities.set(entityType, EntityClass);
    log.debug(`Registered entity: ${entityType}`);
  }

  /**
   * Get the class for a given entity type.
   * @param {string} entityType
   * @returns {Function|null}
   */
  static get(entityType) {
    return EntityRegistry._entities.get(entityType) || null;
  }

  /**
   * Create a new instance of a canonical entity.
   * @param {string} entityType
   * @returns {import('./base-entity')}
   */
  static create(entityType) {
    const EntityClass = EntityRegistry.get(entityType);
    if (!EntityClass) {
      throw new CanonicalMappingError(
        `Unknown entity type: ${entityType}`,
        { entityType, available: EntityRegistry.listTypes() }
      );
    }
    return new EntityClass();
  }

  /**
   * List all registered entity type names.
   * @returns {string[]}
   */
  static listTypes() {
    return Array.from(EntityRegistry._entities.keys());
  }

  /**
   * Clear all registrations (for testing).
   */
  static clear() {
    EntityRegistry._entities.clear();
  }
}

// ── Auto-register built-in entities ────────────────────────────────────

const Item            = require('./entities/item');
const Customer        = require('./entities/customer');
const Vendor          = require('./entities/vendor');
const ChartOfAccounts = require('./entities/chart-of-accounts');
const SalesOrder      = require('./entities/sales-order');
const PurchaseOrder   = require('./entities/purchase-order');
const ProductionOrder = require('./entities/production-order');
const Inventory       = require('./entities/inventory');
const GlEntry         = require('./entities/gl-entry');
const Employee        = require('./entities/employee');
const Bom             = require('./entities/bom');
const Routing         = require('./entities/routing');
const FixedAsset      = require('./entities/fixed-asset');
const CostCenter      = require('./entities/cost-center');

EntityRegistry.register('Item', Item);
EntityRegistry.register('Customer', Customer);
EntityRegistry.register('Vendor', Vendor);
EntityRegistry.register('ChartOfAccounts', ChartOfAccounts);
EntityRegistry.register('SalesOrder', SalesOrder);
EntityRegistry.register('PurchaseOrder', PurchaseOrder);
EntityRegistry.register('ProductionOrder', ProductionOrder);
EntityRegistry.register('Inventory', Inventory);
EntityRegistry.register('GlEntry', GlEntry);
EntityRegistry.register('Employee', Employee);
EntityRegistry.register('Bom', Bom);
EntityRegistry.register('Routing', Routing);
EntityRegistry.register('FixedAsset', FixedAsset);
EntityRegistry.register('CostCenter', CostCenter);

module.exports = EntityRegistry;
