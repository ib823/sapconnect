/**
 * Canonical Data Model — Module Exports
 *
 * OAGIS-aligned entity schemas for normalizing data from any ERP source system
 * (SAP, Infor LN, Infor M3, Infor CSI, Infor Lawson) into a common format.
 */

const BaseCanonicalEntity = require('./base-entity');
const EntityRegistry       = require('./entity-registry');
const { getMappings, getSourceSystems } = require('./source-mapping');

// Entity classes
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

module.exports = {
  // Base
  BaseCanonicalEntity,

  // Registry
  EntityRegistry,

  // Mapping
  getMappings,
  getSourceSystems,

  // Entities
  Item,
  Customer,
  Vendor,
  ChartOfAccounts,
  SalesOrder,
  PurchaseOrder,
  ProductionOrder,
  Inventory,
  GlEntry,
  Employee,
  Bom,
  Routing,
  FixedAsset,
  CostCenter,
};
