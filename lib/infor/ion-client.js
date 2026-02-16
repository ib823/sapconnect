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
 * ION API Gateway Client
 *
 * Provides REST access to Infor ION API Gateway for all Infor CloudSuite
 * products. Handles OAuth2 token management via IONOAuth2Provider, BOD
 * (Business Object Document) queries, and generic REST calls with
 * circuit-breaker resilience.
 *
 * BODs follow the Infor/OAGIS standard: each document has a noun (e.g.,
 * "SalesOrder", "Item") and verbs (Get, Process, Sync, etc.).
 *
 * Supports mock mode for demo/testing without an ION API Gateway.
 */

const Logger = require('../logger');
const { IONError, ConnectionError } = require('../errors');
const { ResilientExecutor } = require('../resilience');
const IONOAuth2Provider = require('./auth/ion-oauth2-provider');

/** @private Mock BOD catalog for demo mode */
const MOCK_BOD_CATALOG = [
  { noun: 'SalesOrder', description: 'Sales order document', verbs: ['Get', 'Process', 'Sync', 'Acknowledge'] },
  { noun: 'PurchaseOrder', description: 'Purchase order document', verbs: ['Get', 'Process', 'Sync', 'Acknowledge'] },
  { noun: 'Item', description: 'Item master document', verbs: ['Get', 'Sync', 'Show'] },
  { noun: 'BillOfMaterials', description: 'Bill of materials', verbs: ['Get', 'Sync'] },
  { noun: 'ChartOfAccounts', description: 'Chart of accounts', verbs: ['Get', 'Sync'] },
  { noun: 'Invoice', description: 'Invoice document', verbs: ['Get', 'Process', 'Sync'] },
  { noun: 'InventoryCount', description: 'Inventory count', verbs: ['Get', 'Sync'] },
  { noun: 'JournalEntry', description: 'Journal entry', verbs: ['Get', 'Process', 'Sync'] },
  { noun: 'Shipment', description: 'Shipment document', verbs: ['Get', 'Process', 'Sync'] },
  { noun: 'ReceiveDelivery', description: 'Receive delivery', verbs: ['Get', 'Process'] },
  { noun: 'PersonnelMaster', description: 'Personnel master', verbs: ['Get', 'Sync'] },
  { noun: 'CodeDefinition', description: 'Code definition', verbs: ['Get', 'Sync'] },
  { noun: 'CustomerPartyMaster', description: 'Customer master', verbs: ['Get', 'Sync'] },
  { noun: 'SupplierPartyMaster', description: 'Supplier master', verbs: ['Get', 'Sync'] },
];

class IONClient {
  /**
   * @param {object} config
   * @param {string} config.baseUrl - ION API Gateway base URL
   * @param {string} config.tokenUrl - OAuth2 token endpoint
   * @param {string} config.clientId - OAuth2 client ID
   * @param {string} config.clientSecret - OAuth2 client secret
   * @param {string} [config.tenant] - Infor tenant identifier
   * @param {string} [config.mode='live'] - 'live' or 'mock'
   * @param {number} [config.timeout=30000] - Request timeout in ms
   * @param {object} [config.logger] - Logger instance
   * @param {object} [config.resilience] - ResilientExecutor options
   */
  constructor(config = {}) {
    this.baseUrl = (config.baseUrl || '').replace(/\/+$/, '');
    this.tenant = config.tenant || '';
    this.mode = config.mode || 'live';
    this.timeout = config.timeout || 30000;
    this.log = config.logger || new Logger('ion-client');

    this._authProvider = new IONOAuth2Provider({
      tokenUrl: config.tokenUrl,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      tenant: this.tenant,
      mode: this.mode,
      logger: this.log.child('oauth2'),
    });

    this._executor = new ResilientExecutor({
      retry: {
        maxRetries: 3,
        baseDelayMs: 500,
        maxDelayMs: 10000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ERR_ION'],
        ...(config.resilience?.retry || {}),
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeoutMs: 30000,
        ...(config.resilience?.circuitBreaker || {}),
      },
    });

    this._authenticated = false;
  }

  /**
   * Authenticate with ION API Gateway (OAuth2 client_credentials flow).
   * This is called automatically by request() if not already authenticated.
   * @returns {Promise<boolean>} True if authentication succeeded
   */
  async authenticate() {
    try {
      await this._authProvider.getToken();
      this._authenticated = true;
      this.log.info('ION authentication successful');
      return true;
    } catch (err) {
      this._authenticated = false;
      throw new IONError(`ION authentication failed: ${err.message}`, {
        original: err.message,
      });
    }
  }

  /**
   * Execute an HTTP request against the ION API Gateway.
   *
   * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
   * @param {string} path - API path (relative to baseUrl)
   * @param {object} [opts={}] - Request options
   * @param {object} [opts.body] - Request body (will be JSON-serialized)
   * @param {object} [opts.headers] - Additional headers
   * @param {object} [opts.params] - URL query parameters
   * @param {boolean} [opts.raw=false] - Return raw text instead of parsed JSON
   * @returns {Promise<object|string>} Parsed JSON response or raw text
   */
  async request(method, path, opts = {}) {
    if (this.mode === 'mock') {
      return this._mockRequest(method, path, opts);
    }

    if (!this._authenticated) {
      await this.authenticate();
    }

    return this._executor.execute(async () => {
      const url = this._buildUrl(path, opts.params);
      const authHeaders = await this._authProvider.getHeaders();

      const headers = {
        ...authHeaders,
        Accept: 'application/json',
        ...opts.headers,
      };

      const fetchOptions = {
        method,
        headers,
        signal: AbortSignal.timeout(this.timeout),
      };

      if (opts.body && !['GET', 'HEAD'].includes(method.toUpperCase())) {
        if (typeof opts.body === 'string') {
          fetchOptions.body = opts.body;
        } else {
          fetchOptions.body = JSON.stringify(opts.body);
          if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
          }
        }
      }

      let response;
      try {
        response = await fetch(url, fetchOptions);
      } catch (err) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
          throw new ConnectionError(`ION request timed out after ${this.timeout}ms`, { url, method });
        }
        throw new IONError(`ION request failed: ${err.message}`, { url, method, original: err.message });
      }

      if (response.status === 401) {
        // Token may have expired externally -- invalidate and re-throw
        this._authProvider.invalidate();
        this._authenticated = false;
        throw new IONError('ION authentication expired (401)', { url, method, status: 401 });
      }

      if (response.status === 204) return null;

      const text = await response.text();

      if (!response.ok) {
        let errorBody = text;
        try { errorBody = JSON.parse(text); } catch { /* keep text */ }
        throw new IONError(
          `ION request failed: ${response.status} ${response.statusText}`,
          { url, method, status: response.status, body: errorBody }
        );
      }

      if (opts.raw) return text;

      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    });
  }

  /**
   * Query BOD (Business Object Document) data via ION Data Lake or messaging.
   *
   * @param {string} noun - BOD noun (e.g., 'SalesOrder', 'Item')
   * @param {string} [verb='Get'] - BOD verb (Get, Process, Sync, etc.)
   * @param {object} [filters={}] - Query filters
   * @param {number} [filters.$top] - Max records to return
   * @param {number} [filters.$skip] - Records to skip
   * @param {string} [filters.$filter] - OData-style filter expression
   * @param {string} [filters.$orderby] - Sort expression
   * @param {string} [filters.$select] - Comma-separated field list
   * @returns {Promise<object>} BOD query result
   */
  async queryBOD(noun, verb = 'Get', filters = {}) {
    if (this.mode === 'mock') {
      return this._mockQueryBOD(noun, verb, filters);
    }

    const params = {};
    if (filters.$top !== undefined) params.$top = String(filters.$top);
    if (filters.$skip !== undefined) params.$skip = String(filters.$skip);
    if (filters.$filter) params.$filter = filters.$filter;
    if (filters.$orderby) params.$orderby = filters.$orderby;
    if (filters.$select) params.$select = filters.$select;

    const path = `/${this.tenant}/IONSERVICES/datacatalog/v2/BODs/${noun}`;
    this.log.debug('Querying BOD', { noun, verb, filters: params });

    const result = await this.request('GET', path, { params });
    return result;
  }

  /**
   * Get a specific BOD document by noun and ID.
   *
   * @param {string} noun - BOD noun (e.g., 'SalesOrder')
   * @param {string} id - Document identifier
   * @returns {Promise<object>} BOD document
   */
  async getBODDocument(noun, id) {
    if (this.mode === 'mock') {
      return this._mockGetBODDocument(noun, id);
    }

    const path = `/${this.tenant}/IONSERVICES/datacatalog/v2/BODs/${noun}('${id}')`;
    this.log.debug('Getting BOD document', { noun, id });

    return this.request('GET', path);
  }

  /**
   * List all available BOD nouns in the ION data catalog.
   *
   * @returns {Promise<Array<{ noun: string, description: string, verbs: string[] }>>}
   */
  async listBODs() {
    if (this.mode === 'mock') {
      return [...MOCK_BOD_CATALOG];
    }

    const path = `/${this.tenant}/IONSERVICES/datacatalog/v2/BODs`;
    this.log.debug('Listing available BODs');

    const result = await this.request('GET', path);
    const bods = Array.isArray(result) ? result : (result.value || result.items || []);

    return bods.map(bod => ({
      noun: bod.noun || bod.name || bod.Noun || '',
      description: bod.description || bod.Description || '',
      verbs: bod.verbs || bod.Verbs || [],
    }));
  }

  /**
   * Health check — verifies ION API Gateway connectivity and authentication.
   *
   * @returns {Promise<{ ok: boolean, latencyMs: number, status: string, error?: string }>}
   */
  async healthCheck() {
    const start = Date.now();

    if (this.mode === 'mock') {
      return { ok: true, latencyMs: 1, status: 'mock', product: 'ION API Gateway' };
    }

    try {
      await this.authenticate();
      const latencyMs = Date.now() - start;
      return { ok: true, latencyMs, status: 'connected', product: 'ION API Gateway' };
    } catch (err) {
      const latencyMs = Date.now() - start;
      return { ok: false, latencyMs, status: 'error', error: err.message, product: 'ION API Gateway' };
    }
  }

  /**
   * Get the underlying auth provider (for sharing across clients).
   * @returns {IONOAuth2Provider}
   */
  getAuthProvider() {
    return this._authProvider;
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
   * Build a full URL from path and optional query params.
   * @private
   * @param {string} path
   * @param {object} [params]
   * @returns {string}
   */
  _buildUrl(path, params) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  /**
   * Mock implementation for request().
   * @private
   */
  _mockRequest(method, path, opts) {
    this.log.debug('Mock ION request', { method, path });
    return {
      status: 'ok',
      method,
      path,
      mock: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Mock implementation for queryBOD().
   * @private
   */
  _mockQueryBOD(noun, verb, filters) {
    const top = filters.$top || 10;
    const items = [];
    for (let i = 1; i <= Math.min(top, 5); i++) {
      items.push({
        id: `${noun}-${String(i).padStart(6, '0')}`,
        noun,
        verb,
        status: 'Active',
        description: `Mock ${noun} record ${i}`,
        createdDate: '2024-01-15T10:30:00Z',
        modifiedDate: '2024-06-20T14:22:00Z',
      });
    }
    return {
      value: items,
      totalCount: items.length,
      noun,
      verb,
      mock: true,
    };
  }

  /**
   * Mock implementation for getBODDocument().
   * @private
   */
  _mockGetBODDocument(noun, id) {
    return {
      id,
      noun,
      status: 'Active',
      description: `Mock ${noun} document ${id}`,
      createdDate: '2024-01-15T10:30:00Z',
      modifiedDate: '2024-06-20T14:22:00Z',
      properties: {
        companyCode: '100',
        currency: 'USD',
        totalAmount: 15000.00,
      },
      mock: true,
    };
  }
}

module.exports = IONClient;
