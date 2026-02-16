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
 * Migration Source Router
 *
 * Routes migration operations to the correct migration objects based on
 * the source system type. Each source system (SAP, Infor M3, Infor LN, etc.)
 * supports a different subset of migration objects. The router maps source
 * systems to their available objects and orchestrates migration execution.
 */

'use strict';

const Logger = require('../lib/logger');
const MigrationObjectRegistry = require('./objects/registry');

// ─────────────────────────────────────────────────────────────────────────────
// Source System → Migration Object Mapping
// ─────────────────────────────────────────────────────────────────────────────

const SOURCE_OBJECT_MAP = {
  SAP: [
    'GL_BALANCE', 'GL_ACCOUNT_MASTER', 'BUSINESS_PARTNER', 'MATERIAL_MASTER',
    'PURCHASE_ORDER', 'SALES_ORDER', 'FIXED_ASSET', 'COST_CENTER',
    'PROFIT_CENTER', 'INTERNAL_ORDER', 'WBS_ELEMENT', 'INSPECTION_PLAN',
    'RFC_DESTINATION', 'IDOC_CONFIG', 'WEB_SERVICE', 'BATCH_JOB',
    'FI_CONFIG', 'CO_CONFIG', 'MM_CONFIG', 'SD_CONFIG',
    'WAREHOUSE_STRUCTURE', 'TRANSPORT_ROUTE', 'TRADE_COMPLIANCE',
    'BOM_ROUTING', 'BW_EXTRACTOR', 'CUSTOMER_OPEN_ITEM', 'VENDOR_OPEN_ITEM',
    'BANK_MASTER', 'EMPLOYEE_MASTER', 'EQUIPMENT_MASTER', 'WORK_CENTER',
    'MAINTENANCE_ORDER', 'PRODUCTION_ORDER', 'SOURCE_LIST',
    'SCHEDULING_AGREEMENT', 'PRICING_CONDITION', 'PURCHASE_CONTRACT',
    'BATCH_MASTER', 'ASSET_ACQUISITION', 'PROFIT_SEGMENT',
    'FUNCTIONAL_LOCATION', 'COST_ELEMENT',
  ],
  INFOR_M3: [
    'GL_BALANCE', 'GL_ACCOUNT_MASTER', 'BUSINESS_PARTNER', 'MATERIAL_MASTER',
    'PURCHASE_ORDER', 'SALES_ORDER', 'COST_CENTER', 'PROFIT_CENTER',
    'BANK_MASTER', 'EMPLOYEE_MASTER', 'EQUIPMENT_MASTER', 'WORK_CENTER',
    'BOM_ROUTING', 'PRODUCTION_ORDER', 'WAREHOUSE_STRUCTURE',
    'PRICING_CONDITION', 'BATCH_MASTER', 'FIXED_ASSET',
  ],
  INFOR_LN: [
    'GL_BALANCE', 'GL_ACCOUNT_MASTER', 'BUSINESS_PARTNER', 'MATERIAL_MASTER',
    'PURCHASE_ORDER', 'SALES_ORDER', 'COST_CENTER', 'FIXED_ASSET',
    'BANK_MASTER', 'EMPLOYEE_MASTER', 'EQUIPMENT_MASTER', 'WORK_CENTER',
    'BOM_ROUTING', 'PRODUCTION_ORDER', 'WAREHOUSE_STRUCTURE',
    'MAINTENANCE_ORDER', 'FUNCTIONAL_LOCATION',
  ],
  SYTELINE: [
    'GL_BALANCE', 'GL_ACCOUNT_MASTER', 'BUSINESS_PARTNER', 'MATERIAL_MASTER',
    'PURCHASE_ORDER', 'SALES_ORDER', 'COST_CENTER', 'FIXED_ASSET',
    'BANK_MASTER', 'EMPLOYEE_MASTER', 'BOM_ROUTING', 'PRODUCTION_ORDER',
    'WAREHOUSE_STRUCTURE',
  ],
};

class SourceRouter {
  /**
   * @param {object} [options]
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    this.logger = options.logger || new Logger('source-router');
    this._registry = new MigrationObjectRegistry();
  }

  /**
   * Get available migration object IDs for a source system.
   * @param {string} sourceSystem - System type (e.g., 'SAP', 'INFOR_M3')
   * @returns {string[]} Array of migration object IDs
   */
  getObjectIds(sourceSystem) {
    const key = (sourceSystem || '').toUpperCase();
    const objectIds = SOURCE_OBJECT_MAP[key];
    if (!objectIds) {
      throw new Error(
        `Unknown source system: "${sourceSystem}". Supported: ${Object.keys(SOURCE_OBJECT_MAP).join(', ')}`
      );
    }
    return [...objectIds];
  }

  /**
   * List supported source systems.
   * @returns {string[]}
   */
  listSourceSystems() {
    return Object.keys(SOURCE_OBJECT_MAP);
  }

  /**
   * Get summary information for a source system.
   * @param {string} sourceSystem
   * @returns {{ sourceSystem: string, objectCount: number, objectIds: string[] }}
   */
  getSourceSummary(sourceSystem) {
    const objectIds = this.getObjectIds(sourceSystem);
    return {
      sourceSystem: sourceSystem.toUpperCase(),
      objectCount: objectIds.length,
      objectIds,
    };
  }

  /**
   * Create a migration object for a source system.
   * @param {string} sourceSystem - System type
   * @param {string} objectId - Migration object ID
   * @param {object} gateway - Gateway with mode ('mock' | 'live')
   * @param {object} [options] - Migration object options
   * @returns {BaseMigrationObject} Migration object instance
   */
  createObject(sourceSystem, objectId, gateway, options = {}) {
    const validIds = this.getObjectIds(sourceSystem);
    if (!validIds.includes(objectId)) {
      throw new Error(
        `Object "${objectId}" is not available for source system "${sourceSystem}". ` +
        `Available: ${validIds.join(', ')}`
      );
    }
    return this._registry.createObject(objectId, gateway, options);
  }

  /**
   * Run all migration objects for a source system.
   * @param {string} sourceSystem - System type
   * @param {object} gateway - Gateway with mode
   * @param {object} [options]
   * @param {string[]} [options.objectIds] - Subset of objects (default: all for this source)
   * @param {boolean} [options.parallel=true] - Parallel execution
   * @param {Function} [options.onProgress] - Progress callback
   * @returns {Promise<object>} Migration results
   */
  async runMigration(sourceSystem, gateway, options = {}) {
    const allIds = this.getObjectIds(sourceSystem);
    const requestedIds = options.objectIds
      ? options.objectIds.filter(id => allIds.includes(id))
      : allIds;

    this.logger.info(`Running migration for ${sourceSystem}: ${requestedIds.length} objects`);

    return this._registry.runAll(gateway, {
      ...options,
      objectIds: requestedIds,
    });
  }
}

module.exports = { SourceRouter, SOURCE_OBJECT_MAP };
