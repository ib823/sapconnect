'use strict';

/**
 * SourceAdapter -- Abstract base class for Infor ERP source adapters.
 *
 * Each Infor product adapter (LN, M3, CSI/SyteLine, Lawson) extends this
 * class and implements the required methods for reading data from the
 * source ERP during competitive displacement migrations.
 *
 * Adapters operate in 'mock' or 'live' mode, just like SAP extractors.
 * All methods throw InforError if not overridden by subclasses.
 */

const Logger = require('../logger');
const { InforError } = require('../errors');

class SourceAdapter {
  /**
   * @param {object} config
   * @param {string} config.product - Infor product identifier ('ln', 'm3', 'csi', 'lawson')
   * @param {string} [config.mode='mock'] - 'mock' or 'live'
   * @param {object} [config.logger] - Logger instance
   */
  constructor(config = {}) {
    if (new.target === SourceAdapter) {
      throw new InforError('SourceAdapter is abstract and cannot be instantiated directly');
    }

    this.product = config.product || 'unknown';
    this.mode = config.mode || 'mock';
    this.log = config.logger || new Logger(`infor-${this.product}`);
    this._connected = false;
  }

  /**
   * Whether the adapter is currently connected.
   * @returns {boolean}
   */
  get isConnected() {
    return this._connected;
  }

  /**
   * Connect to the source ERP system.
   * Subclasses must override this to initialize their specific clients.
   * @returns {Promise<void>}
   */
  async connect() {
    throw new InforError(`connect() not implemented by ${this.constructor.name}`);
  }

  /**
   * Disconnect from the source ERP system.
   * Subclasses may override this for cleanup. Default implementation
   * sets the connected flag to false.
   * @returns {Promise<void>}
   */
  async disconnect() {
    this._connected = false;
    this.log.info(`${this.constructor.name} disconnected`);
  }

  /**
   * Read table data from the source ERP.
   *
   * @param {string} tableName - Table or entity name
   * @param {object} [opts={}] - Query options
   * @param {string[]} [opts.fields] - Columns/properties to return
   * @param {string} [opts.filter] - Filter expression (SQL WHERE or OData $filter)
   * @param {number} [opts.maxRows] - Maximum rows to return
   * @param {number} [opts.offset] - Row offset for pagination
   * @param {string} [opts.orderBy] - Sort expression
   * @returns {Promise<{ rows: object[], metadata: object }>}
   */
  async readTable(tableName, opts = {}) {
    throw new InforError(`readTable() not implemented by ${this.constructor.name}`);
  }

  /**
   * Call an API endpoint on the source ERP.
   *
   * @param {string} endpoint - API endpoint path or program name
   * @param {object} [params={}] - API parameters
   * @returns {Promise<object>} API response
   */
  async callApi(endpoint, params = {}) {
    throw new InforError(`callApi() not implemented by ${this.constructor.name}`);
  }

  /**
   * Query entities from the source ERP using a typed entity query.
   *
   * @param {string} entityType - Entity type name (e.g., 'SalesOrder', 'Item')
   * @param {string} [filter] - Filter expression
   * @param {object} [opts={}] - Additional query options
   * @returns {Promise<{ entities: object[], totalCount: number }>}
   */
  async queryEntities(entityType, filter, opts = {}) {
    throw new InforError(`queryEntities() not implemented by ${this.constructor.name}`);
  }

  /**
   * Get system information for the source ERP.
   * Returns product version, installed modules, company data, etc.
   *
   * @returns {Promise<object>} System info object with at least:
   *   { product, version, company, environment, modules, timestamp }
   */
  async getSystemInfo() {
    throw new InforError(`getSystemInfo() not implemented by ${this.constructor.name}`);
  }

  /**
   * Health check for the adapter connection.
   *
   * @returns {Promise<{ ok: boolean, latencyMs: number, status: string, product: string, error?: string }>}
   */
  async healthCheck() {
    throw new InforError(`healthCheck() not implemented by ${this.constructor.name}`);
  }
}

module.exports = SourceAdapter;
