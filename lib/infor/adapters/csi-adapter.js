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
'use strict';

/**
 * CSI Adapter -- Source adapter for Infor CSI (CloudSuite Industrial / SyteLine)
 *
 * Reads data from CSI via the IDO (Intelligent Data Object) REST API
 * and optional direct SQL Server database access. CSI uses IDO names
 * that correspond to SyteLine collections (e.g., SLItems, SLCustomers).
 *
 * Key IDO collections:
 *   SLItems         - Item master
 *   SLCustomers     - Customer master
 *   SLVendors       - Vendor master
 *   SLSalesOrders   - Sales order headers
 *   SLPurchaseOrders - Purchase order headers
 *   SLInventory     - Inventory balances
 *   SLBOMs          - Bills of material
 *   SLRoutings      - Manufacturing routings
 *   SLJobs          - Production jobs
 *   SLChartOfAccounts - Chart of accounts
 *
 * Supports mock mode for demo/testing without a live SyteLine environment.
 */

const Logger = require('../../logger');
const { InforError } = require('../../errors');
const SourceAdapter = require('../source-adapter');

/** @private Mock CSI table data */
const MOCK_TABLE_DATA = {
  SLItems: [
    { Item: 'ITEM-001', Description: 'Steel Bolt M10', UOM: 'EA', Status: 'Active', ProductCode: 'HW' },
    { Item: 'ITEM-002', Description: 'Copper Pipe 2in', UOM: 'FT', Status: 'Active', ProductCode: 'PL' },
    { Item: 'ITEM-003', Description: 'Aluminum Sheet 4x8', UOM: 'EA', Status: 'Active', ProductCode: 'RAW' },
  ],
  SLCustomers: [
    { CustNum: 'C-100', Name: 'Acme Manufacturing', Status: 'Active', CurrCode: 'USD' },
    { CustNum: 'C-200', Name: 'Global Industries', Status: 'Active', CurrCode: 'EUR' },
  ],
  SLVendors: [
    { VendNum: 'V-100', VendName: 'Steel Supplier Co', Status: 'Active', CurrCode: 'USD' },
    { VendNum: 'V-200', VendName: 'Copper World Ltd', Status: 'Active', CurrCode: 'GBP' },
  ],
  SLSalesOrders: [
    { CoNum: 'CO-10001', CustNum: 'C-100', OrderDate: '2024-06-15', Type: 'Regular', Stat: 'Ordered' },
    { CoNum: 'CO-10002', CustNum: 'C-200', OrderDate: '2024-06-20', Type: 'Regular', Stat: 'Shipped' },
  ],
  SLInventory: [
    { Item: 'ITEM-001', Whse: 'MAIN', QtyOnHand: 5000, QtyAllocated: 1200, QtyAvailable: 3800 },
    { Item: 'ITEM-002', Whse: 'MAIN', QtyOnHand: 12000, QtyAllocated: 3000, QtyAvailable: 9000 },
  ],
};

class CSIAdapter extends SourceAdapter {
  /**
   * @param {object} config
   * @param {string} [config.site='MAIN'] - CSI site identifier
   * @param {string} [config.mode='mock'] - 'mock' or 'live'
   * @param {object} [config.idoClient] - IDO client instance
   * @param {object} [config.dbAdapter] - Database adapter for direct SQL
   * @param {object} [config.logger] - Logger instance
   */
  constructor(config = {}) {
    super({ ...config, product: 'csi' });
    this.site = config.site || 'MAIN';
    this.idoClient = config.idoClient || null;
    this.dbAdapter = config.dbAdapter || null;
  }

  /**
   * Connect to the CSI source system.
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.mode === 'mock') {
      this._connected = true;
      this.log.info('CSI adapter connected (mock mode)');
      return;
    }

    if (this.idoClient || this.dbAdapter) {
      if (this.dbAdapter && typeof this.dbAdapter.connect === 'function' && !this.dbAdapter.isConnected) {
        await this.dbAdapter.connect();
      }
      this._connected = true;
      this.log.info('CSI adapter connected');
    } else {
      throw new InforError('CSI adapter requires idoClient or dbAdapter for live mode');
    }
  }

  /**
   * Disconnect from the CSI source system.
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.dbAdapter && typeof this.dbAdapter.disconnect === 'function') {
      await this.dbAdapter.disconnect();
    }
    await super.disconnect();
  }

  /**
   * Read table data from CSI via IDO collection query or direct SQL.
   *
   * @param {string} tableName - IDO collection name (e.g., 'SLItems') or SQL table name
   * @param {object} [opts={}] - Query options
   * @param {string[]} [opts.fields] - Properties/columns to return
   * @param {string} [opts.filter] - Filter expression
   * @param {number} [opts.maxRows] - Maximum rows to return
   * @param {string} [opts.orderBy] - Sort expression
   * @returns {Promise<{ rows: object[], metadata: object }>}
   */
  async readTable(tableName, opts = {}) {
    if (this.mode === 'mock') {
      return this._mockReadTable(tableName, opts);
    }

    // Use IDO client for SL-prefixed collections
    if (this.idoClient && tableName.startsWith('SL')) {
      const properties = opts.fields || null;
      const filter = opts.filter || null;
      const idoOpts = {};
      if (opts.maxRows) idoOpts.recordCap = opts.maxRows;
      if (opts.orderBy) idoOpts.orderBy = opts.orderBy;

      const result = await this.idoClient.queryCollection(tableName, properties, filter, idoOpts);
      return {
        rows: result.items || [],
        metadata: {
          tableName,
          site: this.site,
          rowCount: result.totalCount || (result.items || []).length,
          source: 'ido',
        },
      };
    }

    // Fall back to database for non-IDO tables
    if (this.dbAdapter) {
      const fields = opts.fields ? opts.fields.join(', ') : '*';
      let sql = `SELECT ${fields} FROM ${tableName}`;
      if (opts.filter) sql += ` WHERE ${opts.filter}`;
      if (opts.orderBy) sql += ` ORDER BY ${opts.orderBy}`;
      if (opts.maxRows) sql += ` OFFSET 0 ROWS FETCH NEXT ${opts.maxRows} ROWS ONLY`;

      const result = await this.dbAdapter.query(sql);
      return {
        rows: result.rows,
        metadata: { tableName, site: this.site, rowCount: result.rowCount, source: 'database' },
      };
    }

    throw new InforError('CSI live mode requires idoClient or dbAdapter');
  }

  /**
   * Call an IDO method.
   *
   * @param {string} endpoint - IDO name/method (e.g., 'SLItems/CalculatePrice')
   * @param {object} [params={}] - Method parameters
   * @returns {Promise<object>}
   */
  async callApi(endpoint, params = {}) {
    if (this.mode === 'mock') {
      return { endpoint, params, result: 'mock', mock: true };
    }

    if (!this.idoClient) {
      throw new InforError('callApi() requires idoClient for CSI');
    }

    const [idoName, methodName] = endpoint.split('/');
    if (!idoName || !methodName) {
      throw new InforError(`Invalid CSI endpoint format: "${endpoint}". Expected "IDOName/MethodName"`, { endpoint });
    }

    return this.idoClient.executeMethod(idoName, methodName, params);
  }

  /**
   * Query entities via IDO collection query.
   *
   * @param {string} entityType - IDO collection name (e.g., 'SLItems')
   * @param {string} [filter] - Filter expression
   * @param {object} [opts={}] - Query options
   * @returns {Promise<{ entities: object[], totalCount: number }>}
   */
  async queryEntities(entityType, filter, opts = {}) {
    const result = await this.readTable(entityType, { filter, maxRows: opts.maxRows || opts.top });
    return {
      entities: result.rows,
      totalCount: result.rows.length,
    };
  }

  /**
   * Get CSI/SyteLine system information.
   * Reads version info from SyteLine system IDOs.
   *
   * @returns {Promise<object>} System info
   */
  async getSystemInfo() {
    if (this.mode === 'mock') {
      return {
        product: 'Infor CSI/SyteLine',
        version: '10.12',
        site: this.site,
        database: 'SQL Server',
        modules: ['Inventory', 'Order Entry', 'Purchasing', 'Production', 'Financials', 'Quality', 'APS'],
        timestamp: new Date().toISOString(),
        mock: true,
      };
    }

    // Try to read system info via IDO
    let version = '';
    if (this.idoClient) {
      try {
        const result = await this.idoClient.queryCollection('SLUserNames', null, null, { recordCap: 1 });
        version = result.items?.[0]?.Version || '';
      } catch {
        this.log.warn('Could not read SyteLine version from IDO');
      }
    }

    // Try database fallback
    if (!version && this.dbAdapter) {
      try {
        const result = await this.dbAdapter.query("SELECT TOP 1 Version FROM parms");
        version = result.rows[0]?.Version || '';
      } catch {
        this.log.warn('Could not read SyteLine version from database');
      }
    }

    return {
      product: 'Infor CSI/SyteLine',
      version,
      site: this.site,
      database: 'SQL Server',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check for the CSI adapter.
   *
   * @returns {Promise<{ ok: boolean, latencyMs: number, status: string, product: string }>}
   */
  async healthCheck() {
    const start = Date.now();

    if (this.mode === 'mock') {
      return { ok: true, latencyMs: 1, status: 'mock', product: 'Infor CSI/SyteLine', site: this.site };
    }

    try {
      await this.readTable('SLItems', { maxRows: 1 });
      const latencyMs = Date.now() - start;
      return { ok: true, latencyMs, status: 'connected', product: 'Infor CSI/SyteLine', site: this.site };
    } catch (err) {
      const latencyMs = Date.now() - start;
      return { ok: false, latencyMs, status: 'error', error: err.message, product: 'Infor CSI/SyteLine' };
    }
  }

  // ── Private helpers ───────────────────────────────────────────────

  /**
   * Mock implementation for readTable().
   * @private
   */
  _mockReadTable(tableName, opts) {
    this.log.debug('Mock CSI readTable', { tableName, site: this.site });

    const records = MOCK_TABLE_DATA[tableName] || [];
    let rows = [...records];

    if (opts.maxRows) {
      rows = rows.slice(0, opts.maxRows);
    }

    if (opts.fields) {
      rows = rows.map(row => {
        const filtered = {};
        for (const f of opts.fields) {
          if (f in row) filtered[f] = row[f];
        }
        return filtered;
      });
    }

    return {
      rows,
      metadata: {
        tableName,
        site: this.site,
        rowCount: rows.length,
        source: 'mock',
      },
    };
  }
}

module.exports = CSIAdapter;
