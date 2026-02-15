'use strict';

/**
 * Lawson Landmark REST Client
 *
 * Provides access to Infor Lawson via the Landmark Technology Platform
 * REST API. Landmark exposes Lawson business entities through a RESTful
 * interface supporting CRUD operations, entity queries, and PFI
 * (Process Flow Integrator) reads.
 *
 * Entity types follow Lawson's data model: Employee, Vendor, Customer,
 * GLAccount, PurchaseOrder, etc. Each entity type supports filtered queries,
 * individual record retrieval, and metadata discovery.
 *
 * Supports mock mode for demo/testing without a live Lawson environment.
 */

const Logger = require('../logger');
const { LandmarkError, AuthenticationError } = require('../errors');
const { ResilientExecutor } = require('../resilience');

/** @private Mock entity types and data */
const MOCK_ENTITY_TYPES = [
  { name: 'Employee', dataArea: 'HR', description: 'Employee master', keyField: 'Employee' },
  { name: 'Vendor', dataArea: 'AP', description: 'Vendor master', keyField: 'Vendor' },
  { name: 'Customer', dataArea: 'AR', description: 'Customer master', keyField: 'Customer' },
  { name: 'GLAccount', dataArea: 'GL', description: 'General Ledger account', keyField: 'AccountingUnit' },
  { name: 'PurchaseOrder', dataArea: 'PO', description: 'Purchase order', keyField: 'PONumber' },
  { name: 'Requisition', dataArea: 'RQ', description: 'Requisition', keyField: 'ReqNumber' },
  { name: 'APInvoice', dataArea: 'AP', description: 'AP Invoice', keyField: 'InvoiceNumber' },
  { name: 'ARInvoice', dataArea: 'AR', description: 'AR Invoice', keyField: 'InvoiceNumber' },
];

const MOCK_ENTITIES = {
  Employee: [
    { Employee: 'EMP001', FirstName: 'John', LastName: 'Doe', Department: 'IT', Status: 'Active', HireDate: '2018-03-15' },
    { Employee: 'EMP002', FirstName: 'Jane', LastName: 'Smith', Department: 'HR', Status: 'Active', HireDate: '2019-07-01' },
    { Employee: 'EMP003', FirstName: 'Bob', LastName: 'Wilson', Department: 'FIN', Status: 'Active', HireDate: '2020-01-10' },
  ],
  Vendor: [
    { Vendor: 'V1000', Name: 'Industrial Supply Co', Status: 'Active', PaymentTerms: 'NET30', Currency: 'USD' },
    { Vendor: 'V2000', Name: 'Office Essentials', Status: 'Active', PaymentTerms: 'NET60', Currency: 'USD' },
  ],
  Customer: [
    { Customer: 'C1000', Name: 'Acme Corp', Status: 'Active', CreditLimit: 100000, Currency: 'USD' },
    { Customer: 'C2000', Name: 'Global Trading', Status: 'Active', CreditLimit: 250000, Currency: 'EUR' },
  ],
  GLAccount: [
    { AccountingUnit: '1000', Account: '110000', Description: 'Cash', AccountType: 'Asset' },
    { AccountingUnit: '1000', Account: '200000', Description: 'Accounts Payable', AccountType: 'Liability' },
    { AccountingUnit: '1000', Account: '400000', Description: 'Revenue', AccountType: 'Revenue' },
  ],
};

/** @private Mock PFI definitions */
const MOCK_PFI = {
  AP200: {
    ProcessId: 'PFI_AP200',
    Name: 'AP200',
    Description: 'AP Invoice Processing',
    Status: 'Active',
    LastRun: '2024-06-15T10:30:00Z',
    Steps: [
      { stepId: 1, name: 'Validate Invoice', type: 'Validation', status: 'Active' },
      { stepId: 2, name: 'Match PO', type: 'Matching', status: 'Active' },
      { stepId: 3, name: 'Post', type: 'Posting', status: 'Active' },
    ],
    Parameters: { DataArea: 'PROD', CompanyNumber: '100' },
  },
};

class LandmarkClient {
  /**
   * @param {object} config
   * @param {string} config.baseUrl - Lawson Landmark REST base URL
   * @param {object} config.auth - Auth provider with getHeaders() method
   * @param {string} [config.dataArea] - Default Lawson data area
   * @param {string} [config.mode='live'] - 'live' or 'mock'
   * @param {number} [config.timeout=30000] - Request timeout in ms
   * @param {string} [config.tenant] - Infor tenant identifier
   * @param {object} [config.logger] - Logger instance
   * @param {object} [config.resilience] - ResilientExecutor options
   */
  constructor(config = {}) {
    this.baseUrl = (config.baseUrl || '').replace(/\/+$/, '');
    this.auth = config.auth || config.authProvider || null;
    this.dataArea = config.dataArea || '';
    this.mode = config.mode || 'live';
    this.timeout = config.timeout || 30000;
    this.tenant = config.tenant || '';
    this.log = config.logger || new Logger('landmark-client');

    this._executor = new ResilientExecutor({
      retry: {
        maxRetries: 3,
        baseDelayMs: 300,
        maxDelayMs: 8000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ERR_LANDMARK'],
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
   * Query entities of a given type with optional filtering.
   *
   * @param {string} entityType - Entity type name (e.g., 'Employee', 'Vendor')
   * @param {string} [filter] - OData-style filter expression
   * @param {object} [opts={}] - Additional query options
   * @param {number} [opts.top] - Max records to return
   * @param {number} [opts.skip] - Records to skip
   * @param {string} [opts.orderBy] - Sort expression
   * @param {string} [opts.select] - Comma-separated field list
   * @param {string} [opts.dataArea] - Override default data area
   * @returns {Promise<{ entities: object[], totalCount: number, entityType: string }>}
   */
  async queryEntities(entityType, filter, opts = {}) {
    if (this.mode === 'mock') {
      return this._mockQueryEntities(entityType, filter, opts);
    }

    return this._executor.execute(async () => {
      const dataArea = opts.dataArea || this.dataArea;
      const basePath = dataArea
        ? `/data/erp/${dataArea}/${entityType}`
        : `/data/erp/${entityType}`;

      const params = new URLSearchParams();
      if (filter) params.set('$filter', filter);
      if (opts.top !== undefined) params.set('$top', String(opts.top));
      if (opts.skip !== undefined) params.set('$skip', String(opts.skip));
      if (opts.orderBy) params.set('$orderby', opts.orderBy);
      if (opts.select) params.set('$select', opts.select);

      const queryString = params.toString();
      const url = queryString
        ? `${this.baseUrl}${basePath}?${queryString}`
        : `${this.baseUrl}${basePath}`;

      this.log.debug('Landmark entity query', { entityType, filter, opts });

      const response = await this._fetch('GET', url);
      const entities = this._parseEntities(response);

      return {
        entities,
        totalCount: response?.['@odata.count'] || response?.totalCount || entities.length,
        entityType,
      };
    });
  }

  /**
   * Get a specific entity by type and key.
   *
   * @param {string} entityType - Entity type name
   * @param {string} id - Entity key value
   * @param {object} [opts={}] - Options
   * @param {string} [opts.dataArea] - Override default data area
   * @returns {Promise<object>} Entity data
   */
  async getEntity(entityType, id, opts = {}) {
    if (this.mode === 'mock') {
      return this._mockGetEntity(entityType, id);
    }

    return this._executor.execute(async () => {
      const dataArea = opts.dataArea || this.dataArea;
      const basePath = dataArea
        ? `/data/erp/${dataArea}/${entityType}('${id}')`
        : `/data/erp/${entityType}('${id}')`;

      const url = `${this.baseUrl}${basePath}`;
      this.log.debug('Landmark get entity', { entityType, id });

      return this._fetch('GET', url);
    });
  }

  /**
   * List all available entity types in the Landmark service.
   *
   * @returns {Promise<Array<{ name: string, dataArea: string, description: string }>>}
   */
  async listEntityTypes() {
    if (this.mode === 'mock') {
      return MOCK_ENTITY_TYPES.map(et => ({
        name: et.name,
        dataArea: et.dataArea,
        description: et.description,
      }));
    }

    return this._executor.execute(async () => {
      const path = '/data/erp/metadata/entityTypes';
      const url = `${this.baseUrl}${path}`;

      const response = await this._fetch('GET', url);
      const types = Array.isArray(response) ? response : (response?.value || response?.items || []);

      return types.map(et => ({
        name: et.Name || et.name || '',
        dataArea: et.DataArea || et.dataArea || '',
        description: et.Description || et.description || '',
      }));
    });
  }

  /**
   * Read a PFI (Process Flow Integrator) definition.
   *
   * @param {string} pfiName - PFI process name
   * @returns {Promise<object>} PFI definition with steps, parameters, etc.
   */
  async readPFI(pfiName) {
    if (this.mode === 'mock') {
      return this._mockReadPFI(pfiName);
    }

    return this._executor.execute(async () => {
      const path = `/data/erp/PFProcess?$filter=Name eq '${pfiName}'`;
      const url = `${this.baseUrl}${path}`;

      this.log.debug('Landmark read PFI', { pfiName });

      const response = await this._fetch('GET', url);
      const entities = this._parseEntities(response);

      if (entities.length === 0) {
        throw new LandmarkError(`PFI not found: ${pfiName}`, { pfiName });
      }

      const pfi = entities[0];
      return {
        name: pfiName,
        definition: pfi,
        steps: pfi.Steps || pfi.steps || [],
        parameters: pfi.Parameters || pfi.parameters || {},
        status: pfi.Status || pfi.status || 'unknown',
      };
    });
  }

  /**
   * Health check -- verifies Lawson Landmark connectivity.
   *
   * @returns {Promise<{ ok: boolean, latencyMs: number, status: string, error?: string }>}
   */
  async healthCheck() {
    const start = Date.now();

    if (this.mode === 'mock') {
      return { ok: true, latencyMs: 1, status: 'mock', product: 'Infor Lawson/Landmark' };
    }

    try {
      await this.listEntityTypes();
      const latencyMs = Date.now() - start;
      return { ok: true, latencyMs, status: 'connected', product: 'Infor Lawson/Landmark' };
    } catch (err) {
      const latencyMs = Date.now() - start;
      return { ok: false, latencyMs, status: 'error', error: err.message, product: 'Infor Lawson/Landmark' };
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
   * Execute an HTTP request with authentication.
   * @private
   */
  async _fetch(method, url, body) {
    const authHeaders = this.auth ? await this.auth.getHeaders() : {};
    const headers = {
      ...authHeaders,
      Accept: 'application/json',
    };

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
        throw new LandmarkError(`Landmark request timed out after ${this.timeout}ms`, { url, method });
      }
      throw new LandmarkError(`Landmark request failed: ${err.message}`, { url, method, original: err.message });
    }

    if (response.status === 401) {
      throw new AuthenticationError('Landmark authentication failed (401)', { url, status: 401 });
    }

    if (response.status === 204) return null;

    const text = await response.text();

    if (!response.ok) {
      let errorBody = text;
      try { errorBody = JSON.parse(text); } catch { /* keep text */ }

      const errorMessage = typeof errorBody === 'object'
        ? (errorBody.Message || errorBody.message || errorBody.error?.message || response.statusText)
        : response.statusText;

      throw new LandmarkError(
        `Landmark request failed: ${errorMessage}`,
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
   * Parse Landmark entity response into an array.
   * @private
   */
  _parseEntities(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.value && Array.isArray(response.value)) return response.value;
    if (response.d && response.d.results) return response.d.results;
    if (response.d) return [response.d];
    return [response];
  }

  /**
   * Mock implementation for queryEntities().
   * @private
   */
  _mockQueryEntities(entityType, filter, opts) {
    this.log.debug('Mock Landmark entity query', { entityType, filter });

    const records = MOCK_ENTITIES[entityType];
    if (!records) {
      return { entities: [], totalCount: 0, entityType, mock: true };
    }

    let entities = [...records];

    // Apply pagination
    if (opts.skip) {
      entities = entities.slice(opts.skip);
    }
    if (opts.top) {
      entities = entities.slice(0, opts.top);
    }

    // Apply field selection
    if (opts.select) {
      const fields = opts.select.split(',').map(f => f.trim());
      entities = entities.map(row => {
        const filtered = {};
        for (const f of fields) {
          if (f in row) filtered[f] = row[f];
        }
        return filtered;
      });
    }

    return { entities, totalCount: records.length, entityType, mock: true };
  }

  /**
   * Mock implementation for getEntity().
   * @private
   */
  _mockGetEntity(entityType, key) {
    const records = MOCK_ENTITIES[entityType];
    if (!records) {
      throw new LandmarkError(`Entity type not found: ${entityType}`, { entityType });
    }

    const typeDef = MOCK_ENTITY_TYPES.find(t => t.name === entityType);
    const keyField = typeDef?.keyField || Object.keys(records[0])[0];

    const entity = records.find(r => r[keyField] === key);
    if (!entity) {
      throw new LandmarkError(`Entity not found: ${entityType}('${key}')`, { entityType, key });
    }

    return { ...entity, mock: true };
  }

  /**
   * Mock implementation for readPFI().
   * @private
   */
  _mockReadPFI(pfiName) {
    const pfi = MOCK_PFI[pfiName];

    if (pfi) {
      return {
        name: pfiName,
        definition: pfi,
        steps: pfi.Steps,
        parameters: pfi.Parameters,
        status: pfi.Status,
        mock: true,
      };
    }

    // Generic mock for unknown PFIs
    return {
      name: pfiName,
      definition: {
        ProcessId: `PFI_${pfiName}`,
        Name: pfiName,
        Description: `Mock PFI: ${pfiName}`,
        Status: 'Active',
        LastRun: '2024-06-15T10:30:00Z',
      },
      steps: [
        { stepId: 1, name: 'Initialize', type: 'Start', status: 'Completed' },
        { stepId: 2, name: 'Process', type: 'Processing', status: 'Completed' },
        { stepId: 3, name: 'Finalize', type: 'End', status: 'Completed' },
      ],
      parameters: { DataArea: 'PROD' },
      status: 'Active',
      mock: true,
    };
  }
}

module.exports = LandmarkClient;
