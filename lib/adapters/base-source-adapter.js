/**
 * Base Source Adapter — Abstract Interface
 *
 * Defines the universal interface for connecting to any ERP source system
 * (SAP, Infor M3, Infor LN, SyteLine, etc.). Concrete adapters extend this
 * base and implement the abstract methods for each source system.
 *
 * Pattern: same as BaseExtractor / BaseMigrationObject — abstract base with
 * mock/live mode switching.
 */

'use strict';

const Logger = require('../logger');

class BaseSourceAdapter {
  /**
   * @param {object} [config]
   * @param {string} [config.mode='mock'] - 'mock' or 'live'
   * @param {object} [config.logger] - Logger instance
   */
  constructor(config = {}) {
    if (new.target === BaseSourceAdapter) {
      throw new Error('Cannot instantiate BaseSourceAdapter directly — use a concrete adapter');
    }
    this.config = config;
    this.mode = config.mode || 'mock';
    this.logger = config.logger || new Logger(`adapter:${this.sourceSystem}`);
    this._connected = false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Abstract Properties (must be overridden)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Source system identifier (e.g., 'SAP', 'INFOR_M3', 'INFOR_LN', 'SYTELINE').
   * @returns {string}
   */
  get sourceSystem() {
    throw new Error('sourceSystem not implemented');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Abstract Methods (must be overridden)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Connect to the source system.
   * @returns {Promise<{ success: boolean, systemInfo: object }>}
   */
  async connect() {
    throw new Error('connect() not implemented');
  }

  /**
   * Disconnect from the source system.
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error('disconnect() not implemented');
  }

  /**
   * Read data from a table or equivalent data structure.
   * @param {string} tableName - Table name or entity set
   * @param {object} [opts]
   * @param {string[]} [opts.fields] - Fields to select
   * @param {string} [opts.where] - Filter / WHERE clause
   * @param {number} [opts.maxRows=100] - Row limit
   * @returns {Promise<{ rows: object[], totalRows: number, fields: string[] }>}
   */
  async readTable(tableName, opts) {
    throw new Error('readTable() not implemented');
  }

  /**
   * Query entities via the system's native API (OData, REST, M3 API, IDO, etc.).
   * @param {string} entityType - Entity type or API program
   * @param {object} [filter] - Filter criteria
   * @returns {Promise<{ entities: object[], totalCount: number }>}
   */
  async queryEntities(entityType, filter) {
    throw new Error('queryEntities() not implemented');
  }

  /**
   * Get system information (version, hostname, modules, etc.).
   * @returns {Promise<object>}
   */
  async getSystemInfo() {
    throw new Error('getSystemInfo() not implemented');
  }

  /**
   * Health check — verify the connection is alive.
   * @returns {Promise<{ healthy: boolean, latencyMs: number, details: object }>}
   */
  async healthCheck() {
    throw new Error('healthCheck() not implemented');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Concrete Methods (shared by all adapters)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Whether the adapter is currently connected.
   * @returns {boolean}
   */
  get isConnected() {
    return this._connected;
  }

  /**
   * Return a summary of the adapter state.
   * @returns {object}
   */
  getStatus() {
    return {
      sourceSystem: this.sourceSystem,
      mode: this.mode,
      connected: this._connected,
    };
  }
}

module.exports = { BaseSourceAdapter };
