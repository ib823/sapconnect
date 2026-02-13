/**
 * Live SAP Connector
 *
 * Provides live extract/load operations for migration objects
 * using the OData client infrastructure.
 */

const Logger = require('../lib/logger');
const { SapClientFactory, SAP_SERVICES } = require('../lib/sap-client-factory');
const { ConnectionError, MigrationObjectError } = require('../lib/errors');

// Maps migration object IDs to their SAP service and entity set
const OBJECT_SERVICE_MAP = {
  GL_BALANCE: { system: 'source', service: 'ECC_GL_BALANCE', entitySet: 'FAGLFLEXT', version: 'v2' },
  GL_ACCOUNT_MASTER: { system: 'target', service: 'GL_ACCOUNT', entitySet: 'GLAccountInChartOfAccounts', version: 'v4' },
  BUSINESS_PARTNER: { system: 'target', service: 'BUSINESS_PARTNER', entitySet: 'A_BusinessPartner', version: 'v2' },
  CUSTOMER_OPEN_ITEM: { system: 'source', service: 'ECC_CUSTOMER', entitySet: 'CustomerOpenItems', version: 'v2' },
  VENDOR_OPEN_ITEM: { system: 'source', service: 'ECC_VENDOR', entitySet: 'VendorOpenItems', version: 'v2' },
  MATERIAL_MASTER: { system: 'target', service: 'MATERIAL', entitySet: 'A_Product', version: 'v2' },
  PURCHASE_ORDER: { system: 'target', service: 'PURCHASE_ORDER', entitySet: 'A_PurchaseOrder', version: 'v2' },
  SALES_ORDER: { system: 'target', service: 'SALES_ORDER', entitySet: 'A_SalesOrder', version: 'v2' },
  FIXED_ASSET: { system: 'target', service: 'FIXED_ASSET', entitySet: 'A_FixedAsset', version: 'v2' },
  COST_CENTER: { system: 'target', service: 'COST_CENTER', entitySet: 'A_CostCenter', version: 'v2' },
  COST_ELEMENT: { system: 'target', service: 'COST_CENTER', entitySet: 'A_CostCenter', version: 'v2' },
  PROFIT_CENTER: { system: 'target', service: 'PROFIT_CENTER', entitySet: 'A_ProfitCenter', version: 'v2' },
  EQUIPMENT_MASTER: { system: 'target', service: 'EQUIPMENT', entitySet: 'Equipment', version: 'v2' },
  MAINTENANCE_ORDER: { system: 'target', service: 'MAINTENANCE_ORDER', entitySet: 'MaintenanceOrder', version: 'v2' },
  PRODUCTION_ORDER: { system: 'target', service: 'PRODUCTION_ORDER', entitySet: 'A_ProductionOrder_2', version: 'v2' },
  BANK_MASTER: { system: 'target', service: 'BANK', entitySet: 'A_BankDetail', version: 'v2' },
  EMPLOYEE_MASTER: { system: 'target', service: 'EMPLOYEE', entitySet: 'A_BusinessPartner', version: 'v2' },
  BATCH_MASTER: { system: 'target', service: 'BATCH', entitySet: 'Batch', version: 'v2' },
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
