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
 * CSI IDO REST Client for Infor SyteLine (CloudSuite Industrial)
 *
 * IDOs (Intelligent Data Objects) are the primary data access layer in
 * Infor SyteLine/CSI. Each IDO represents a business entity (e.g.,
 * SLItems, SLCustomers, SLSalesOrders) and exposes properties, collections,
 * and methods through a REST or SOAP interface.
 *
 * This client handles:
 *   - Collection queries with property selection and filtering
 *   - Property retrieval for individual IDO instances
 *   - Method execution on IDO objects
 *   - IDO metadata discovery
 *
 * Supports mock mode for demo/testing without a live SyteLine environment.
 */

const Logger = require('../logger');
const { IDOError, AuthenticationError } = require('../errors');
const { ResilientExecutor } = require('../resilience');

/** @private Mock IDO collections with realistic data */
const MOCK_COLLECTIONS = {
  SLItems: [
    { Item: 'ITEM-001', Description: 'Steel Bolt M10', UM: 'EA', Status: 'Active', ProductCode: 'HW', ABCCode: 'A', LotTracked: false, SerialTracked: false },
    { Item: 'ITEM-002', Description: 'Copper Pipe 2in', UM: 'FT', Status: 'Active', ProductCode: 'PL', ABCCode: 'A', LotTracked: false, SerialTracked: false },
    { Item: 'ITEM-003', Description: 'Aluminum Sheet 4x8', UM: 'EA', Status: 'Active', ProductCode: 'RAW', ABCCode: 'B', LotTracked: true, SerialTracked: false },
  ],
  SLCustomers: [
    { CustNum: 'C-100', Name: 'Acme Manufacturing', CurrCode: 'USD', CreditLimit: 100000, CreditHold: false, Status: 'Active' },
    { CustNum: 'C-200', Name: 'Global Industries', CurrCode: 'EUR', CreditLimit: 250000, CreditHold: false, Status: 'Active' },
  ],
  SLVendors: [
    { VendNum: 'V-100', VendName: 'Steel Supplier Co', CurrCode: 'USD', VendType: 'Material', Status: 'Active' },
    { VendNum: 'V-200', VendName: 'Copper World Ltd', CurrCode: 'GBP', VendType: 'Material', Status: 'Active' },
  ],
  SLSalesOrders: [
    { CoNum: 'CO-10001', CustNum: 'C-100', OrderDate: '2024-06-15', Type: 'Regular', Stat: 'Ordered' },
    { CoNum: 'CO-10002', CustNum: 'C-200', OrderDate: '2024-06-20', Type: 'Regular', Stat: 'Shipped' },
  ],
  SLPurchaseOrders: [
    { PoNum: 'PO-20001', VendNum: 'V-100', OrderDate: '2024-05-10', Type: 'Regular', Stat: 'Released' },
    { PoNum: 'PO-20002', VendNum: 'V-200', OrderDate: '2024-06-01', Type: 'Blanket', Stat: 'Open' },
  ],
  SLInventory: [
    { Item: 'ITEM-001', Whse: 'MAIN', QtyOnHand: 5000, QtyAllocated: 1200, QtyAvailable: 3800 },
    { Item: 'ITEM-002', Whse: 'MAIN', QtyOnHand: 12000, QtyAllocated: 3000, QtyAvailable: 9000 },
  ],
  SLBOMs: [
    { Item: 'ASM-001', Revision: 'A', Component: 'ITEM-001', Qty: 4, UM: 'EA', ScrapFact: 0.02 },
    { Item: 'ASM-001', Revision: 'A', Component: 'ITEM-002', Qty: 2, UM: 'FT', ScrapFact: 0.05 },
  ],
  SLChartOfAccounts: [
    { Acct: '110000', Description: 'Cash', Type: 'Asset', AcctGroup: 'Current Assets' },
    { Acct: '200000', Description: 'Accounts Payable', Type: 'Liability', AcctGroup: 'Current Liabilities' },
    { Acct: '400000', Description: 'Revenue', Type: 'Revenue', AcctGroup: 'Sales' },
  ],
};

/** @private Mock IDO catalog */
const MOCK_IDO_CATALOG = [
  { name: 'SLItems', description: 'Item Master' },
  { name: 'SLCustomers', description: 'Customer Master' },
  { name: 'SLVendors', description: 'Vendor Master' },
  { name: 'SLSalesOrders', description: 'Sales Orders' },
  { name: 'SLPurchaseOrders', description: 'Purchase Orders' },
  { name: 'SLInventory', description: 'Inventory Balances' },
  { name: 'SLBOMs', description: 'Bills of Material' },
  { name: 'SLRoutings', description: 'Routings' },
  { name: 'SLJobs', description: 'Production Jobs' },
  { name: 'SLChartOfAccounts', description: 'Chart of Accounts' },
  { name: 'SLJournals', description: 'Journal Entries' },
  { name: 'SLUserNames', description: 'User Names' },
];

class IDOClient {
  /**
   * @param {object} config
   * @param {string} config.baseUrl - SyteLine IDO REST base URL (e.g., https://host/IDORequestService)
   * @param {object} config.auth - Auth provider with getHeaders() method
   * @param {string} [config.configId] - SyteLine configuration identifier
   * @param {string} [config.mode='live'] - 'live' or 'mock'
   * @param {number} [config.timeout=30000] - Request timeout in ms
   * @param {object} [config.logger] - Logger instance
   * @param {object} [config.resilience] - ResilientExecutor options
   */
  constructor(config = {}) {
    this.baseUrl = (config.baseUrl || '').replace(/\/+$/, '');
    this.auth = config.auth || config.authProvider || null;
    this.configId = config.configId || '';
    this.mode = config.mode || 'live';
    this.timeout = config.timeout || 30000;
    this.log = config.logger || new Logger('ido-client');

    /** @private Session token for SyteLine */
    this._sessionToken = null;

    this._executor = new ResilientExecutor({
      retry: {
        maxRetries: 3,
        baseDelayMs: 300,
        maxDelayMs: 8000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ERR_IDO'],
        ...(config.resilience?.retry || {}),
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeoutMs: 30000,
        ...(config.resilience?.circuitBreaker || {}),
      },
    });
  }

  /**
   * Query a collection of IDO records.
   *
   * @param {string} idoName - IDO name (e.g., 'SLItems', 'SLCustomers')
   * @param {string|string[]} [properties] - Property names to return (string csv or array, null for all)
   * @param {string} [filter] - Filter expression (SyteLine filter syntax)
   * @param {object} [opts={}] - Additional query options
   * @param {number} [opts.recordCap] - Max records to return
   * @param {string} [opts.orderBy] - Sort expression
   * @param {boolean} [opts.distinct=false] - Return distinct records
   * @returns {Promise<{ items: object[], totalCount: number, idoName: string }>}
   */
  async queryCollection(idoName, properties, filter, opts = {}) {
    if (this.mode === 'mock') {
      return this._mockQueryCollection(idoName, properties, filter, opts);
    }

    return this._executor.execute(async () => {
      const path = `/IDORequestService/ido/load/${idoName}`;
      const params = new URLSearchParams();

      // Handle properties as string or array
      if (properties) {
        const propList = Array.isArray(properties) ? properties.join(',') : properties;
        params.set('properties', propList);
      }
      if (filter) {
        params.set('filter', filter);
      }
      if (opts.recordCap !== undefined) {
        params.set('recordCap', String(opts.recordCap));
      }
      if (opts.orderBy) {
        params.set('orderBy', opts.orderBy);
      }
      if (opts.distinct) {
        params.set('distinct', 'true');
      }

      const url = `${this.baseUrl}${path}?${params.toString()}`;
      const response = await this._fetch('GET', url);

      const items = this._parseIDOResponse(response);

      return {
        items,
        totalCount: response?.TotalCount || response?.totalCount || items.length,
        idoName,
      };
    });
  }

  /**
   * Get a specific property value from an IDO.
   *
   * @param {string} idoName - IDO name
   * @param {string} propertyName - Property to retrieve
   * @returns {Promise<{ idoName: string, propertyName: string, value: *, schema: object }>}
   */
  async getProperty(idoName, propertyName) {
    if (this.mode === 'mock') {
      return this._mockGetProperty(idoName, propertyName);
    }

    return this._executor.execute(async () => {
      const url = `${this.baseUrl}/IDORequestService/ido/property/${idoName}/${propertyName}`;
      const response = await this._fetch('GET', url);

      return {
        idoName,
        propertyName,
        value: response?.Value !== undefined ? response.Value : (response?.value !== undefined ? response.value : response),
        schema: {
          type: response?.DataType || response?.dataType || 'string',
          length: response?.Length || response?.length || 0,
          isKey: response?.IsKey === true || response?.isKey === true,
        },
      };
    });
  }

  /**
   * Execute a method on an IDO.
   *
   * @param {string} idoName - IDO name
   * @param {string} methodName - Method to execute
   * @param {object} [params={}] - Method parameters
   * @returns {Promise<object>} Method execution result
   */
  async executeMethod(idoName, methodName, params = {}) {
    if (this.mode === 'mock') {
      return this._mockExecuteMethod(idoName, methodName, params);
    }

    return this._executor.execute(async () => {
      const url = `${this.baseUrl}/IDORequestService/ido/method/${idoName}/${methodName}`;
      const body = {
        MethodName: methodName,
        Parameters: Object.entries(params).map(([name, value]) => ({
          Name: name,
          Value: value !== null && value !== undefined ? String(value) : '',
        })),
      };

      const response = await this._fetch('POST', url, body);

      return {
        idoName,
        methodName,
        success: response?.Success !== false && response?.success !== false,
        returnValue: response?.ReturnValue ?? response?.returnValue ?? null,
        outputParams: response?.Parameters || response?.parameters || {},
        message: response?.Message || response?.message || '',
      };
    });
  }

  /**
   * List all available IDOs in the SyteLine configuration.
   *
   * @returns {Promise<Array<{ name: string, description: string }>>}
   */
  async listIDOs() {
    if (this.mode === 'mock') {
      return [...MOCK_IDO_CATALOG];
    }

    return this._executor.execute(async () => {
      const url = `${this.baseUrl}/IDORequestService/ido/metadata/idos`;
      const response = await this._fetch('GET', url);

      const idos = Array.isArray(response) ? response : (response?.value || response?.items || response?.IDOs || []);

      return idos.map(ido => ({
        name: ido.Name || ido.name || ido.IDOName || '',
        description: ido.Description || ido.description || '',
      }));
    });
  }

  /**
   * Health check -- verifies SyteLine IDO connectivity.
   *
   * @returns {Promise<{ ok: boolean, latencyMs: number, status: string, error?: string }>}
   */
  async healthCheck() {
    const start = Date.now();

    if (this.mode === 'mock') {
      return { ok: true, latencyMs: 1, status: 'mock', product: 'Infor CSI/SyteLine' };
    }

    try {
      await this.listIDOs();
      const latencyMs = Date.now() - start;
      return { ok: true, latencyMs, status: 'connected', product: 'Infor CSI/SyteLine' };
    } catch (err) {
      const latencyMs = Date.now() - start;
      return { ok: false, latencyMs, status: 'error', error: err.message, product: 'Infor CSI/SyteLine' };
    }
  }

  /**
   * Get circuit breaker stats for monitoring.
   * @returns {object}
   */
  getCircuitBreakerStats() {
    return this._executor.circuitBreaker.getStats();
  }

  // ── Private helpers ───────────────────────────────────────────────

  /**
   * Execute an HTTP request with authentication and session management.
   * @private
   * @param {string} method - HTTP method
   * @param {string} url - Full URL
   * @param {object} [body] - Request body
   * @returns {Promise<object>} Parsed response
   */
  async _fetch(method, url, body) {
    const authHeaders = this.auth ? await this.auth.getHeaders() : {};
    const headers = {
      ...authHeaders,
      Accept: 'application/json',
    };

    if (this._sessionToken) {
      headers['X-Infor-SessionId'] = this._sessionToken;
    }
    if (this.configId) {
      headers['X-Infor-ConfigId'] = this.configId;
    }

    const fetchOptions = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (body && !['GET', 'HEAD'].includes(method)) {
      fetchOptions.body = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new IDOError(`IDO request timed out after ${this.timeout}ms`, { url, method });
      }
      throw new IDOError(`IDO request failed: ${err.message}`, { url, method, original: err.message });
    }

    if (response.status === 401) {
      this._sessionToken = null;
      throw new AuthenticationError('IDO authentication failed (401)', { url, status: 401 });
    }

    // Capture session token from response headers for session affinity
    const sessionHeader = response.headers.get('x-infor-sessionid');
    if (sessionHeader) {
      this._sessionToken = sessionHeader;
    }

    if (response.status === 204) return null;

    const text = await response.text();

    if (!response.ok) {
      let errorBody = text;
      try { errorBody = JSON.parse(text); } catch { /* keep text */ }

      const errorMessage = typeof errorBody === 'object'
        ? (errorBody.Message || errorBody.message || errorBody.ErrorMessage || response.statusText)
        : response.statusText;

      throw new IDOError(
        `IDO request failed: ${errorMessage}`,
        { url, method, status: response.status, body: errorBody }
      );
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  /**
   * Parse IDO collection response into an array of row objects.
   * Handles both PropertyValues array format and direct property format.
   * @private
   * @param {object} response - Raw API response
   * @returns {object[]}
   */
  _parseIDOResponse(response) {
    if (!response) return [];

    // IDO REST API returns Items array or direct array
    const items = response.Items || response.items || response.value || response;
    if (!Array.isArray(items)) return [items];

    return items.map(item => {
      // IDO items may have PropertyValues array or direct properties
      if (item.PropertyValues) {
        const row = {};
        for (const pv of item.PropertyValues) {
          row[pv.Name || pv.name] = pv.Value !== undefined ? pv.Value : pv.value;
        }
        return row;
      }
      return item;
    });
  }

  /**
   * Mock implementation for queryCollection().
   * @private
   */
  _mockQueryCollection(idoName, properties, filter, opts) {
    this.log.debug('Mock IDO query', { idoName, properties, filter });

    const records = MOCK_COLLECTIONS[idoName];
    if (!records) {
      // Return empty collection rather than throw for unknown IDOs
      return { items: [], totalCount: 0, idoName, mock: true };
    }

    let items = [...records];

    // Apply recordCap
    if (opts.recordCap) {
      items = items.slice(0, opts.recordCap);
    }

    // Apply property filtering
    if (properties) {
      const propList = Array.isArray(properties) ? properties : properties.split(',').map(p => p.trim());
      items = items.map(row => {
        const filtered = {};
        for (const p of propList) {
          if (p in row) filtered[p] = row[p];
        }
        return filtered;
      });
    }

    return { items, totalCount: records.length, idoName, mock: true };
  }

  /**
   * Mock implementation for getProperty().
   * @private
   */
  _mockGetProperty(idoName, propertyName) {
    const collection = MOCK_COLLECTIONS[idoName];
    if (collection && collection.length > 0 && propertyName in collection[0]) {
      return {
        idoName,
        propertyName,
        value: collection[0][propertyName],
        schema: {
          type: typeof collection[0][propertyName] === 'number' ? 'decimal' : 'string',
          length: 50,
          isKey: propertyName.toLowerCase().includes('num') || propertyName.toLowerCase() === 'item' || propertyName.toLowerCase() === 'acct',
        },
        mock: true,
      };
    }

    return {
      idoName,
      propertyName,
      value: `mock_${propertyName}_value`,
      schema: { type: 'string', length: 50, isKey: false },
      mock: true,
    };
  }

  /**
   * Mock implementation for executeMethod().
   * @private
   */
  _mockExecuteMethod(idoName, methodName, params) {
    this.log.debug('Mock IDO method execution', { idoName, methodName, params });

    return {
      idoName,
      methodName,
      success: true,
      returnValue: 0,
      outputParams: {},
      message: `Mock execution of ${idoName}.${methodName} completed`,
      mock: true,
    };
  }
}

module.exports = IDOClient;
