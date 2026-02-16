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
 * Live SAP Connector
 *
 * Provides live extract/load operations for migration objects
 * using the OData client infrastructure.
 */

const Logger = require('../lib/logger');
const { SapClientFactory } = require('../lib/sap-client-factory');
const { MigrationObjectError } = require('../lib/errors');

// Maps migration object IDs to their SAP service and entity set
// All 42 objects mapped to SAP OData/RFC services
const OBJECT_SERVICE_MAP = {
  // ── Finance ──────────────────────────────────────────────────
  GL_BALANCE: { system: 'source', service: 'ECC_GL_BALANCE', entitySet: 'FAGLFLEXT', version: 'v2' },
  GL_ACCOUNT_MASTER: { system: 'target', service: 'GL_ACCOUNT', entitySet: 'GLAccountInChartOfAccounts', version: 'v4' },
  CUSTOMER_OPEN_ITEM: { system: 'source', service: 'ECC_CUSTOMER', entitySet: 'CustomerOpenItems', version: 'v2' },
  VENDOR_OPEN_ITEM: { system: 'source', service: 'ECC_VENDOR', entitySet: 'VendorOpenItems', version: 'v2' },
  COST_ELEMENT: { system: 'target', service: 'COST_ELEMENT', entitySet: 'CostCenterActivityType', version: 'v2' },
  ASSET_ACQUISITION: { system: 'target', service: 'FIXED_ASSET', entitySet: 'A_FixedAssetAcquisition', version: 'v2' },
  PROFIT_SEGMENT: { system: 'target', service: 'PROFIT_CENTER', entitySet: 'A_ProfitabilitySegment', version: 'v2' },

  // ── Controlling ──────────────────────────────────────────────
  COST_CENTER: { system: 'target', service: 'COST_CENTER', entitySet: 'A_CostCenter', version: 'v2' },
  PROFIT_CENTER: { system: 'target', service: 'PROFIT_CENTER', entitySet: 'A_ProfitCenter', version: 'v2' },
  INTERNAL_ORDER: { system: 'target', service: 'INTERNAL_ORDER', entitySet: 'A_InternalOrder', version: 'v2' },
  WBS_ELEMENT: { system: 'target', service: 'PROJECT', entitySet: 'A_WBSElement', version: 'v2' },

  // ── Logistics ────────────────────────────────────────────────
  BUSINESS_PARTNER: { system: 'target', service: 'BUSINESS_PARTNER', entitySet: 'A_BusinessPartner', version: 'v2' },
  MATERIAL_MASTER: { system: 'target', service: 'MATERIAL', entitySet: 'A_Product', version: 'v2' },
  PURCHASE_ORDER: { system: 'target', service: 'PURCHASE_ORDER', entitySet: 'A_PurchaseOrder', version: 'v2' },
  SALES_ORDER: { system: 'target', service: 'SALES_ORDER', entitySet: 'A_SalesOrder', version: 'v2' },
  PRICING_CONDITION: { system: 'target', service: 'PRICING_CONDITION', entitySet: 'A_SlsPrcgCndnRecdValidity', version: 'v2' },
  SOURCE_LIST: { system: 'target', service: 'SOURCE_LIST', entitySet: 'A_PurchasingSource', version: 'v2' },
  SCHEDULING_AGREEMENT: { system: 'target', service: 'SCHED_AGREEMENT', entitySet: 'A_SchAgrmtHeader', version: 'v2' },
  PURCHASE_CONTRACT: { system: 'target', service: 'PURCHASE_CONTRACT', entitySet: 'A_PurchaseContract', version: 'v2' },
  BATCH_MASTER: { system: 'target', service: 'BATCH', entitySet: 'Batch', version: 'v2' },
  BANK_MASTER: { system: 'target', service: 'BANK', entitySet: 'A_BankDetail', version: 'v2' },

  // ── Plant Maintenance ────────────────────────────────────────
  EQUIPMENT_MASTER: { system: 'target', service: 'EQUIPMENT', entitySet: 'Equipment', version: 'v2' },
  FUNCTIONAL_LOCATION: { system: 'target', service: 'FUNC_LOCATION', entitySet: 'A_FunctionalLocation', version: 'v2' },
  WORK_CENTER: { system: 'target', service: 'WORK_CENTER', entitySet: 'A_WorkCenter', version: 'v2' },
  MAINTENANCE_ORDER: { system: 'target', service: 'MAINTENANCE_ORDER', entitySet: 'MaintenanceOrder', version: 'v2' },

  // ── Production ───────────────────────────────────────────────
  PRODUCTION_ORDER: { system: 'target', service: 'PRODUCTION_ORDER', entitySet: 'A_ProductionOrder_2', version: 'v2' },
  BOM_ROUTING: { system: 'target', service: 'BOM', entitySet: 'A_BillOfMaterialHeader', version: 'v2' },
  INSPECTION_PLAN: { system: 'target', service: 'INSPECTION_PLAN', entitySet: 'A_InspectionPlan', version: 'v2' },

  // ── Fixed Assets ─────────────────────────────────────────────
  FIXED_ASSET: { system: 'target', service: 'FIXED_ASSET', entitySet: 'A_FixedAsset', version: 'v2' },

  // ── HR ───────────────────────────────────────────────────────
  EMPLOYEE_MASTER: { system: 'target', service: 'EMPLOYEE', entitySet: 'A_BusinessPartner', version: 'v2' },

  // ── Extended (EWM, TM, GTS, BW) ─────────────────────────────
  WAREHOUSE_STRUCTURE: { system: 'target', service: 'WAREHOUSE', entitySet: 'A_Warehouse', version: 'v2' },
  TRANSPORT_ROUTE: { system: 'target', service: 'TRANSPORT_ROUTE', entitySet: 'A_TransportationRoute', version: 'v2' },
  TRADE_COMPLIANCE: { system: 'target', service: 'TRADE_COMPLIANCE', entitySet: 'A_ProductCompliance', version: 'v2' },
  BW_EXTRACTOR: { system: 'source', service: 'BW_EXTRACTOR', entitySet: 'DataSource', version: 'v2' },

  // ── Interfaces ───────────────────────────────────────────────
  RFC_DESTINATION: { system: 'source', service: 'RFC_DESTINATION', entitySet: 'RFCDestination', version: 'v2', transport: 'rfc' },
  IDOC_CONFIG: { system: 'source', service: 'IDOC_CONFIG', entitySet: 'IDocType', version: 'v2', transport: 'rfc' },
  WEB_SERVICE: { system: 'source', service: 'WEB_SERVICE', entitySet: 'WebServiceEndpoint', version: 'v2' },
  BATCH_JOB: { system: 'source', service: 'BATCH_JOB', entitySet: 'BackgroundJob', version: 'v2', transport: 'rfc' },

  // ── Configuration ────────────────────────────────────────────
  FI_CONFIG: { system: 'source', service: 'FI_CONFIG', entitySet: 'CompanyCode', version: 'v2', transport: 'rfc' },
  CO_CONFIG: { system: 'source', service: 'CO_CONFIG', entitySet: 'ControllingArea', version: 'v2', transport: 'rfc' },
  MM_CONFIG: { system: 'source', service: 'MM_CONFIG', entitySet: 'PurchasingOrganization', version: 'v2', transport: 'rfc' },
  SD_CONFIG: { system: 'source', service: 'SD_CONFIG', entitySet: 'SalesOrganization', version: 'v2', transport: 'rfc' },
};

class LiveConnector {
  constructor(config = {}) {
    this.logger = new Logger('live-connector', { level: config.logLevel || 'info' });
    this.factory = config.factory || new SapClientFactory(config);
    this.batchSize = config.batchSize || 500;
    this.maxRecords = config.maxRecords || 100000;
    this._extractionStats = new Map();
  }

  /**
   * Extract records from a live SAP system
   */
  async extract(objectId, options = {}) {
    const mapping = OBJECT_SERVICE_MAP[objectId];
    if (!mapping) {
      this.logger.warn(`No live service mapping for ${objectId}, object must implement _extractLive() directly`);
      throw new MigrationObjectError(`No live service mapping for ${objectId}`, { objectId });
    }

    const client = this.factory.getClient(mapping.system, mapping.service);
    const servicePath = client.servicePath || this.factory.getServicePath(mapping.service);
    const entityPath = `${servicePath}/${mapping.entitySet}`;

    this.logger.info(`Extracting ${objectId} from ${entityPath}...`);
    const startTime = Date.now();

    const params = {};
    if (options.$filter) params.$filter = options.$filter;
    if (options.$select) params.$select = options.$select;
    if (options.$top) params.$top = String(Math.min(options.$top, this.maxRecords));
    if (options.$expand) params.$expand = options.$expand;

    try {
      const records = await client.getAll(entityPath, params);
      const duration = Date.now() - startTime;

      this._extractionStats.set(objectId, {
        recordCount: records.length,
        durationMs: duration,
        timestamp: new Date().toISOString(),
        source: entityPath,
      });

      this.logger.info(`Extracted ${records.length} records for ${objectId} in ${duration}ms`);
      return records;
    } catch (err) {
      this.logger.error(`Extraction failed for ${objectId}: ${err.message}`);
      throw new MigrationObjectError(`Live extraction failed for ${objectId}: ${err.message}`, {
        objectId,
        service: mapping.service,
        cause: err.message,
      });
    }
  }

  /**
   * Load records into a live SAP system using batch operations
   */
  async load(objectId, records, options = {}) {
    const mapping = OBJECT_SERVICE_MAP[objectId];
    if (!mapping) {
      throw new MigrationObjectError(`No live service mapping for ${objectId}`, { objectId });
    }

    const client = this.factory.getClient(mapping.system, mapping.service);
    const servicePath = client.servicePath || this.factory.getServicePath(mapping.service);
    const entityPath = `${servicePath}/${mapping.entitySet}`;
    const batchSize = options.batchSize || this.batchSize;

    this.logger.info(`Loading ${records.length} records for ${objectId} to ${entityPath}...`);
    const startTime = Date.now();

    const results = {
      total: records.length,
      success: 0,
      errors: [],
      batches: 0,
    };

    // Process in batches
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      results.batches++;

      try {
        // Use individual POSTs (batch support varies by service)
        for (const record of batch) {
          try {
            await client.post(entityPath, record);
            results.success++;
          } catch (err) {
            results.errors.push({
              index: i + batch.indexOf(record),
              message: err.message,
              statusCode: err.statusCode,
            });
          }
        }
      } catch (err) {
        this.logger.error(`Batch ${results.batches} failed for ${objectId}: ${err.message}`);
        // Mark remaining in batch as errors
        for (let j = 0; j < batch.length; j++) {
          if (!results.errors.find(e => e.index === i + j)) {
            results.errors.push({ index: i + j, message: err.message });
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    this.logger.info(`Loaded ${results.success}/${results.total} records for ${objectId} in ${duration}ms (${results.errors.length} errors)`);

    return {
      status: results.errors.length === 0 ? 'completed' : results.errors.length === results.total ? 'failed' : 'completed_with_errors',
      recordCount: results.total,
      successCount: results.success,
      errorCount: results.errors.length,
      errors: results.errors.slice(0, 50), // Cap error details
      batches: results.batches,
      batchSize,
      durationMs: duration,
    };
  }

  /**
   * Test connectivity to a system
   */
  async testConnection(systemName) {
    try {
      const system = this.factory.systems.get(systemName);
      if (!system) return { status: 'error', message: `Unknown system: ${systemName}` };

      const client = this.factory.createClient(system);
      // Try a lightweight metadata request
      const startTime = Date.now();
      await client.get(`/sap/opu/odata/sap/API_BUSINESS_PARTNER/$metadata`);
      return {
        status: 'connected',
        system: systemName,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        status: 'error',
        system: systemName,
        message: err.message,
        code: err.code,
      };
    }
  }

  getExtractionStats() {
    return Object.fromEntries(this._extractionStats);
  }

  /**
   * Check if an object has a live service mapping
   */
  hasMapping(objectId) {
    return objectId in OBJECT_SERVICE_MAP;
  }

  /**
   * Get the service mapping for an object
   */
  getMapping(objectId) {
    return OBJECT_SERVICE_MAP[objectId] || null;
  }
}

module.exports = { LiveConnector, OBJECT_SERVICE_MAP };
