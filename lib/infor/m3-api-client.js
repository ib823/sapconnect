'use strict';

/**
 * M3 MI Programs REST Client
 *
 * Provides access to Infor M3 via the MI (Machine Interface) Programs
 * REST API. M3 MI Programs expose ERP transactions as REST endpoints
 * following the pattern: /m3api-rest/execute/{Program}/{Transaction}
 *
 * Each program (e.g., MMS200, OIS100) exposes transactions (e.g., GetItm,
 * LstByNam) that accept and return field-value pairs using M3's 2-character
 * field prefix convention (e.g., ITNO, WHLO, CONO).
 *
 * Supports mock mode for demo/testing without a live M3 environment.
 */

const Logger = require('../logger');
const { M3ApiError, AuthenticationError } = require('../errors');
const { ResilientExecutor } = require('../resilience');

/** @private Mock program catalog */
const MOCK_PROGRAMS = [
  { program: 'MMS200', description: 'Item Master', transactions: ['GetItm', 'LstByNam', 'AddItm', 'UpdItm', 'DltItm'] },
  { program: 'MMS005', description: 'Warehouse', transactions: ['GetWarehouse', 'LstWarehouses'] },
  { program: 'OIS100', description: 'Customer Order', transactions: ['AddHead', 'AddLine', 'GetHead', 'LstLines'] },
  { program: 'OIS300', description: 'Sales Statistics', transactions: ['LstInvHead', 'GetInvHead'] },
  { program: 'CRS610', description: 'Customer Master', transactions: ['GetBasicData', 'LstByName', 'AddCustomer'] },
  { program: 'CRS620', description: 'Supplier Master', transactions: ['GetBasicData', 'LstByName'] },
  { program: 'PPS200', description: 'Purchase Order', transactions: ['GetHead', 'LstLines', 'AddHead'] },
  { program: 'GLS200', description: 'General Ledger', transactions: ['LstVoucher', 'GetVoucher'] },
  { program: 'MRS001', description: 'M3 System Information', transactions: ['GetSystemData', 'LstInstallations'] },
  { program: 'CMS100', description: 'Custom Fields', transactions: ['LstFields', 'GetFields'] },
  { program: 'MNS150', description: 'User Master', transactions: ['GetUserData', 'LstUsers'] },
  { program: 'CMNFCN', description: 'Company Function', transactions: ['GetBasicData'] },
];

class M3ApiClient {
  /**
   * @param {object} config
   * @param {string} config.baseUrl - M3 API base URL (e.g., https://m3host:port or ION gateway URL)
   * @param {object} config.auth - Auth provider with getHeaders() method (IONOAuth2Provider or BasicProvider)
   * @param {string} [config.mode='live'] - 'live' or 'mock'
   * @param {number} [config.timeout=30000] - Request timeout in ms
   * @param {string} [config.company] - Default M3 company number (CONO)
   * @param {string} [config.division] - Default M3 division (DIVI)
   * @param {string} [config.tenant] - Infor tenant identifier
   * @param {object} [config.logger] - Logger instance
   * @param {object} [config.resilience] - ResilientExecutor options
   */
  constructor(config = {}) {
    this.baseUrl = (config.baseUrl || '').replace(/\/+$/, '');
    this.auth = config.auth || config.authProvider || null;
    this.mode = config.mode || 'live';
    this.timeout = config.timeout || 30000;
    this.company = config.company || '';
    this.division = config.division || '';
    this.tenant = config.tenant || '';
    this.log = config.logger || new Logger('m3-api-client');

    this._executor = new ResilientExecutor({
      retry: {
        maxRetries: 3,
        baseDelayMs: 300,
        maxDelayMs: 8000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ERR_M3_API'],
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
   * Execute an M3 MI Program transaction.
   *
   * @param {string} program - MI Program name (e.g., 'MMS200', 'OIS100')
   * @param {string} transaction - Transaction name (e.g., 'GetItm', 'LstByNam')
   * @param {object} [params={}] - Input field-value pairs (e.g., { ITNO: 'A001', CONO: '100' })
   * @returns {Promise<object>} Transaction result with MIRecord array
   */
  async execute(program, transaction, params = {}) {
    if (this.mode === 'mock') {
      return this._mockExecute(program, transaction, params);
    }

    return this._executor.execute(async () => {
      // Inject default company/division if not provided
      const inputParams = { ...params };
      if (this.company && !inputParams.CONO) {
        inputParams.CONO = this.company;
      }
      if (this.division && !inputParams.DIVI) {
        inputParams.DIVI = this.division;
      }

      const path = this._buildApiPath(program, transaction);
      const queryParams = new URLSearchParams();

      for (const [key, value] of Object.entries(inputParams)) {
        if (value !== undefined && value !== null) {
          queryParams.set(key, String(value));
        }
      }

      const queryString = queryParams.toString();
      const url = queryString ? `${this.baseUrl}${path}?${queryString}` : `${this.baseUrl}${path}`;

      const authHeaders = this.auth ? await this.auth.getHeaders() : {};
      const headers = {
        ...authHeaders,
        Accept: 'application/json',
      };

      this.log.debug('M3 API call', { program, transaction, params: inputParams });

      let response;
      try {
        response = await fetch(url, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(this.timeout),
        });
      } catch (err) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
          throw new M3ApiError(`M3 API call timed out after ${this.timeout}ms`, {
            program, transaction, timeout: this.timeout,
          });
        }
        throw new M3ApiError(`M3 API call failed: ${err.message}`, {
          program, transaction, original: err.message,
        });
      }

      if (response.status === 401) {
        throw new AuthenticationError('M3 API authentication failed (401)', {
          program, transaction, status: 401,
        });
      }

      const text = await response.text();

      if (!response.ok) {
        let errorBody = text;
        try { errorBody = JSON.parse(text); } catch { /* keep text */ }

        // M3 API returns specific error codes in the response
        const errorMessage = typeof errorBody === 'object'
          ? (errorBody.Message || errorBody.message || errorBody.ErrorMessage || response.statusText)
          : response.statusText;

        throw new M3ApiError(
          `M3 ${program}/${transaction} failed: ${errorMessage}`,
          { program, transaction, status: response.status, body: errorBody }
        );
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new M3ApiError('M3 API response is not valid JSON', {
          program, transaction, responseText: text.substring(0, 500),
        });
      }

      // Check for M3 transaction-level failures
      if (data.nrOfFailedTransactions > 0) {
        const firstError = (data.results || data.MIRecord || [])[0];
        const errorMsg = firstError?.errorMessage || firstError?.ErrorMessage || 'Unknown M3 transaction error';
        throw new M3ApiError(`M3 transaction failed: ${errorMsg}`, {
          program, transaction, results: data.results,
        });
      }

      // M3 API returns results in MIRecord array
      return {
        program,
        transaction,
        records: data.MIRecord || data.results || data.value || [],
        metadata: {
          program,
          transaction,
          recordCount: (data.MIRecord || data.results || data.value || []).length,
          nrOfRecords: data.nrOfRecords || data.Metadata?.nrOfRecords || 0,
        },
      };
    });
  }

  /**
   * List all available MI Programs.
   *
   * @returns {Promise<Array<{ program: string, description: string }>>}
   */
  async listPrograms() {
    if (this.mode === 'mock') {
      return MOCK_PROGRAMS.map(p => ({ program: p.program, description: p.description }));
    }

    const path = this.tenant
      ? `/${this.tenant}/M3/m3api-rest/v2/metadata/programs`
      : '/m3api-rest/v2/metadata/programs';

    const authHeaders = this.auth ? await this.auth.getHeaders() : {};

    let response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: { ...authHeaders, Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeout),
      });
    } catch (err) {
      throw new M3ApiError(`Failed to list M3 programs: ${err.message}`, { original: err.message });
    }

    if (!response.ok) {
      throw new M3ApiError(`Failed to list M3 programs: ${response.status}`, { status: response.status });
    }

    const data = await response.json();
    const programs = data.MIProgram || data.programs || data.value || [];

    return programs.map(p => ({
      program: p.Program || p.program || p.name || '',
      description: p.Description || p.description || '',
    }));
  }

  /**
   * Discover available transactions for a given MI Program.
   *
   * @param {string} program - MI Program name (e.g., 'MMS200')
   * @returns {Promise<Array<{ transaction: string, description: string }>>}
   */
  async discoverTransactions(program) {
    if (this.mode === 'mock') {
      const mock = MOCK_PROGRAMS.find(p => p.program === program);
      if (!mock) {
        return [];
      }
      return mock.transactions.map(t => ({ transaction: t, description: `${program} ${t}` }));
    }

    const path = this.tenant
      ? `/${this.tenant}/M3/m3api-rest/v2/metadata/programs/${program}/transactions`
      : `/m3api-rest/v2/metadata/programs/${program}/transactions`;

    const authHeaders = this.auth ? await this.auth.getHeaders() : {};

    let response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: { ...authHeaders, Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeout),
      });
    } catch (err) {
      throw new M3ApiError(`Failed to discover transactions for ${program}: ${err.message}`, {
        program, original: err.message,
      });
    }

    if (!response.ok) {
      throw new M3ApiError(`Failed to discover transactions for ${program}: ${response.status}`, {
        program, status: response.status,
      });
    }

    const data = await response.json();
    const transactions = data.MITransaction || data.transactions || data.value || [];

    return transactions.map(t => ({
      transaction: t.Transaction || t.transaction || t.name || '',
      description: t.Description || t.description || '',
    }));
  }

  /**
   * Get the field definitions for a specific program transaction.
   *
   * @param {string} program - MI Program name (e.g., 'MMS200')
   * @param {string} transaction - Transaction name (e.g., 'GetItm')
   * @returns {Promise<{ input: Array, output: Array }>}
   */
  async getFields(program, transaction) {
    if (this.mode === 'mock') {
      return this._mockGetFields(program, transaction);
    }

    const path = this.tenant
      ? `/${this.tenant}/M3/m3api-rest/v2/metadata/programs/${program}/transactions/${transaction}/fields`
      : `/m3api-rest/v2/metadata/programs/${program}/transactions/${transaction}/fields`;

    const authHeaders = this.auth ? await this.auth.getHeaders() : {};

    let response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: { ...authHeaders, Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeout),
      });
    } catch (err) {
      throw new M3ApiError(`Failed to get fields for ${program}/${transaction}: ${err.message}`, {
        program, transaction, original: err.message,
      });
    }

    if (!response.ok) {
      throw new M3ApiError(`Failed to get fields for ${program}/${transaction}: ${response.status}`, {
        program, transaction, status: response.status,
      });
    }

    const data = await response.json();
    const fields = data.MIField || data.fields || data.value || [];

    const input = [];
    const output = [];

    for (const field of fields) {
      const fieldInfo = {
        name: field.Name || field.name || field.Field || '',
        description: field.Description || field.description || '',
        length: field.Length || field.length || 0,
        type: field.Type || field.type || 'A',
        mandatory: field.Mandatory === true || field.mandatory === true || field.Mandatory === 'true',
      };

      const direction = (field.Direction || field.direction || '').toLowerCase();
      if (direction === 'in' || direction === 'input' || direction === 'both') {
        input.push(fieldInfo);
      }
      if (direction === 'out' || direction === 'output' || direction === 'both') {
        output.push(fieldInfo);
      }
      if (!direction) {
        input.push(fieldInfo);
        output.push(fieldInfo);
      }
    }

    return { input, output };
  }

  /**
   * Health check -- verifies M3 API connectivity.
   *
   * @returns {Promise<{ ok: boolean, latencyMs: number, status: string, error?: string }>}
   */
  async healthCheck() {
    const start = Date.now();

    if (this.mode === 'mock') {
      return { ok: true, latencyMs: 1, status: 'mock', product: 'Infor M3' };
    }

    try {
      await this.listPrograms();
      const latencyMs = Date.now() - start;
      return { ok: true, latencyMs, status: 'connected', product: 'Infor M3' };
    } catch (err) {
      const latencyMs = Date.now() - start;
      return { ok: false, latencyMs, status: 'error', error: err.message, product: 'Infor M3' };
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
   * Build M3 API path for a program/transaction pair.
   * @private
   */
  _buildApiPath(program, transaction) {
    if (this.tenant) {
      return `/${this.tenant}/M3/m3api-rest/execute/${program}/${transaction}`;
    }
    return `/m3api-rest/execute/${program}/${transaction}`;
  }

  /**
   * Mock implementation for execute().
   * @private
   */
  _mockExecute(program, transaction, params) {
    this.log.debug('Mock M3 API call', { program, transaction, params });

    const isListTransaction = transaction.startsWith('Lst') || transaction.startsWith('List')
      || transaction.startsWith('Sel') || transaction.startsWith('Search');

    const records = [];
    const count = isListTransaction ? 5 : 1;

    for (let i = 0; i < count; i++) {
      const record = {
        NameValue: [
          { Name: 'CONO', Value: params.CONO || this.company || '100' },
          { Name: 'DIVI', Value: params.DIVI || this.division || 'AAA' },
          { Name: 'STAT', Value: '20' },
          { Name: 'RGDT', Value: '20240115' },
        ],
      };

      // Add program-specific mock fields
      if (program === 'MMS200') {
        record.NameValue.push(
          { Name: 'ITNO', Value: params.ITNO || `ITEM${String(i + 1).padStart(4, '0')}` },
          { Name: 'ITDS', Value: `Mock Item ${i + 1}` },
          { Name: 'ITTY', Value: '001' },
          { Name: 'UNMS', Value: 'EA' }
        );
      } else if (program === 'CRS610') {
        record.NameValue.push(
          { Name: 'CUNO', Value: params.CUNO || `CUST${String(i + 1).padStart(4, '0')}` },
          { Name: 'CUNM', Value: `Mock Customer ${i + 1}` },
          { Name: 'CUA1', Value: '123 Main Street' }
        );
      } else if (program === 'OIS100') {
        record.NameValue.push(
          { Name: 'ORNO', Value: params.ORNO || `ORD${String(i + 1).padStart(7, '0')}` },
          { Name: 'ORTP', Value: 'SO1' },
          { Name: 'ORST', Value: '33' }
        );
      } else {
        record.NameValue.push(
          { Name: 'ID', Value: String(i + 1) },
          { Name: 'DESC', Value: `Mock ${program} record ${i + 1}` }
        );
      }

      records.push(record);
    }

    return {
      program,
      transaction,
      records,
      metadata: {
        program,
        transaction,
        recordCount: records.length,
        nrOfRecords: records.length,
      },
      mock: true,
    };
  }

  /**
   * Mock implementation for getFields().
   * @private
   */
  _mockGetFields(program, transaction) {
    const commonFields = [
      { name: 'CONO', description: 'Company', length: 3, type: 'N', mandatory: true },
      { name: 'DIVI', description: 'Division', length: 3, type: 'A', mandatory: false },
    ];

    let specificFields = [];
    if (program === 'MMS200') {
      specificFields = [
        { name: 'ITNO', description: 'Item number', length: 15, type: 'A', mandatory: true },
        { name: 'ITDS', description: 'Item description', length: 30, type: 'A', mandatory: false },
        { name: 'ITTY', description: 'Item type', length: 3, type: 'A', mandatory: false },
        { name: 'UNMS', description: 'Unit of measure', length: 3, type: 'A', mandatory: false },
        { name: 'STAT', description: 'Status', length: 2, type: 'A', mandatory: false },
      ];
    } else if (program === 'CRS610') {
      specificFields = [
        { name: 'CUNO', description: 'Customer number', length: 10, type: 'A', mandatory: true },
        { name: 'CUNM', description: 'Customer name', length: 36, type: 'A', mandatory: false },
        { name: 'CUA1', description: 'Address line 1', length: 36, type: 'A', mandatory: false },
      ];
    } else {
      specificFields = [
        { name: 'ID', description: 'Identifier', length: 15, type: 'A', mandatory: true },
        { name: 'DESC', description: 'Description', length: 40, type: 'A', mandatory: false },
      ];
    }

    return {
      input: [...commonFields, ...specificFields],
      output: [...commonFields, ...specificFields],
    };
  }
}

module.exports = M3ApiClient;
