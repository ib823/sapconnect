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
