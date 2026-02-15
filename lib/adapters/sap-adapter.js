/**
 * SAP Source Adapter
 *
 * Concrete adapter for SAP ERP / S/4HANA systems. Wraps the existing
 * lib/rfc/ (TableReader, FunctionCaller) and lib/odata/ (ODataClient)
 * libraries into the BaseSourceAdapter interface.
 *
 * In mock mode, returns realistic SAP-style data without a live connection.
 */

'use strict';

const { BaseSourceAdapter } = require('./base-source-adapter');
const Logger = require('../logger');

class SapAdapter extends BaseSourceAdapter {
  /**
   * @param {object} [config]
   * @param {string} [config.mode='mock'] - 'mock' or 'live'
   * @param {object} [config.rfcParams] - RFC connection parameters
   * @param {object} [config.odataConfig] - OData client configuration
   * @param {object} [config.tableReader] - Pre-built TableReader instance
   * @param {object} [config.odataClient] - Pre-built ODataClient instance
   */
  constructor(config = {}) {
    super(config);
    this.rfcParams = config.rfcParams || {};
    this.odataConfig = config.odataConfig || {};
    this._tableReader = config.tableReader || null;
    this._odataClient = config.odataClient || null;
    this.logger = config.logger || new Logger('adapter:SAP');
  }

  get sourceSystem() {
    return 'SAP';
  }

  async connect() {
    if (this.mode === 'mock') {
      this._connected = true;
      this.logger.info('Connected (mock mode)');
      return {
        success: true,
        systemInfo: await this.getSystemInfo(),
      };
    }

    // Live mode: initialize RFC and OData clients
    try {
      // Lazy-load to avoid hard dependency
      if (!this._tableReader && this.rfcParams.ashost) {
        const { RfcPool } = require('../rfc/pool');
        const { TableReader } = require('../rfc/table-reader');
        const pool = new RfcPool(this.rfcParams, { poolSize: 3 });
        this._tableReader = new TableReader(pool);
      }

      if (!this._odataClient && this.odataConfig.baseUrl) {
        const { ODataClient } = require('../odata/client');
        this._odataClient = new ODataClient(this.odataConfig);
      }

      this._connected = true;
      this.logger.info('Connected (live mode)');
      return {
        success: true,
        systemInfo: await this.getSystemInfo(),
      };
    } catch (err) {
      this._connected = false;
      this.logger.error('Connection failed', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  async disconnect() {
    this._connected = false;
    this._tableReader = null;
    this._odataClient = null;
    this.logger.info('Disconnected');
  }

  async readTable(tableName, opts = {}) {
    if (this.mode === 'mock') {
      return this._mockReadTable(tableName, opts);
    }

    if (!this._tableReader) {
      throw new Error('TableReader not initialized — call connect() first or provide rfcParams');
    }

    return this._tableReader.readTable(tableName, opts);
  }

  async queryEntities(entityType, filter = {}) {
    if (this.mode === 'mock') {
      return this._mockQueryEntities(entityType, filter);
    }

    if (!this._odataClient) {
      throw new Error('ODataClient not initialized — call connect() first or provide odataConfig');
    }

    const params = {};
    if (filter.$filter) params.$filter = filter.$filter;
    if (filter.$select) params.$select = filter.$select;
    if (filter.$top) params.$top = filter.$top;

    const data = await this._odataClient.get(`/${entityType}`, params);
    const results = data.d?.results || data.value || [];
    return {
      entities: results,
      totalCount: results.length,
    };
  }

  async getSystemInfo() {
    if (this.mode === 'mock') {
      return {
        systemId: 'S4H',
        systemType: 'SAP S/4HANA',
        release: '2023',
        hostname: 'sap-prod-01.example.com',
        client: '100',
        database: 'HANA 2.0 SPS06',
        kernel: '793',
        operatingSystem: 'Linux',
        unicode: true,
        modules: ['FI', 'CO', 'MM', 'SD', 'PP', 'QM', 'PM', 'WM', 'HR'],
      };
    }

    // Live: call RFC_SYSTEM_INFO
    if (this._tableReader && this._tableReader.pool) {
      const client = await this._tableReader.pool.acquire();
      try {
        const result = await client.call('RFC_SYSTEM_INFO', {});
        const info = result.RFCSI_EXPORT || {};
        return {
          systemId: info.RFCSYSID || '',
          systemType: 'SAP',
          release: info.RFCDBREL || '',
          hostname: info.RFCHOST || '',
          client: this.rfcParams.client || '',
          database: info.RFCDBSYS || '',
          kernel: info.RFCKERNRL || '',
          operatingSystem: info.RFCOPSYS || '',
          unicode: info.RFCUNICODE === 'X',
        };
      } finally {
        await this._tableReader.pool.release(client);
      }
    }

    return { systemId: 'UNKNOWN', systemType: 'SAP' };
  }

  async healthCheck() {
    const start = Date.now();
    if (this.mode === 'mock') {
      return {
        healthy: true,
        latencyMs: 5,
        details: { mode: 'mock', connected: this._connected },
      };
    }

    try {
      await this.getSystemInfo();
      return {
        healthy: true,
        latencyMs: Date.now() - start,
        details: { mode: 'live', connected: this._connected },
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        details: { mode: 'live', connected: false, error: err.message },
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mock helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** @private */
  _mockReadTable(tableName, opts) {
    const fields = opts.fields || ['FIELD1', 'FIELD2', 'FIELD3'];
    const maxRows = opts.maxRows || 100;
    const mockRow = {};
    for (const f of fields) {
      mockRow[f] = `${tableName}_${f}_VALUE`;
    }
    const rows = [];
    const count = Math.min(maxRows, 5);
    for (let i = 0; i < count; i++) {
      rows.push({ ...mockRow, ROW_INDEX: i + 1 });
    }
    return {
      rows,
      totalRows: count,
      fields: [...fields, 'ROW_INDEX'],
    };
  }

  /** @private */
  _mockQueryEntities(entityType, filter) {
    const entities = [
      { ID: '1001', Name: `${entityType} Entity 1`, Status: 'Active' },
      { ID: '1002', Name: `${entityType} Entity 2`, Status: 'Active' },
      { ID: '1003', Name: `${entityType} Entity 3`, Status: 'Inactive' },
    ];
    return {
      entities,
      totalCount: entities.length,
    };
  }
}

module.exports = { SapAdapter };
