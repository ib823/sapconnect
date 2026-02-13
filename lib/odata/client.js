/**
 * OData HTTP Client
 *
 * Core CRUD operations, CSRF token management, batch support,
 * auto-pagination, and retry with exponential backoff.
 */

const { ODataError, ConnectionError, AuthenticationError } = require('../errors');
const Logger = require('../logger');
const { BatchBuilder, parseV2BatchResponse, parseV4BatchResponse } = require('./batch');

class ODataClient {
  /**
   * @param {object} options
   * @param {string} options.baseUrl - SAP system base URL (e.g. https://host:port)
   * @param {object} options.authProvider - Auth provider with getHeaders()/getAgent()
   * @param {string} [options.version='v2'] - OData version ('v2' or 'v4')
   * @param {number} [options.timeout=30000] - Request timeout in ms
   * @param {number} [options.retries=3] - Max retry attempts
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || '').replace(/\/+$/, '');
    this.authProvider = options.authProvider;
    this.version = options.version || 'v2';
    this.timeout = options.timeout || 30000;
    this.retries = options.retries ?? 3;
    this.log = options.logger || new Logger('odata-client', { level: 'warn' });

    this._csrfToken = null;
    this._csrfExpiry = 0;
    this._cookies = [];
  }

  /**
   * GET request — returns parsed JSON
   */
  async get(path, params = {}) {
    const url = this._buildUrl(path, params);
    return this._executeWithRetry('GET', url);
  }

  /**
   * GET with auto-pagination — follows $skiptoken / @odata.nextLink
   */
  async getAll(path, params = {}) {
    const allResults = [];
    let url = this._buildUrl(path, params);

    while (url) {
      const data = await this._executeWithRetry('GET', url);
      const results = this._extractResults(data);
      allResults.push(...results);

      // V4: @odata.nextLink, V2: __next
      const nextLink = data['@odata.nextLink'] || (data.d && data.d.__next);
      if (nextLink) {
        url = nextLink.startsWith('http') ? nextLink : `${this.baseUrl}${nextLink}`;
      } else {
        url = null;
      }
    }

    return allResults;
  }

  /**
   * POST request — creates entity, fetches CSRF token first
   */
  async post(path, body) {
    const url = this._buildUrl(path);
    await this._ensureCsrfToken(path);
    return this._executeWithRetry('POST', url, body);
  }

  /**
   * PATCH request — updates entity
   */
  async patch(path, body) {
    const url = this._buildUrl(path);
    await this._ensureCsrfToken(path);
    return this._executeWithRetry('PATCH', url, body);
  }

  /**
   * DELETE request
   */
  async delete(path) {
    const url = this._buildUrl(path);
    await this._ensureCsrfToken(path);
    return this._executeWithRetry('DELETE', url);
  }

  /**
   * Execute a $batch request
   * @param {BatchBuilder} batchBuilder
   */
  async batch(batchBuilder) {
    const servicePath = this._guessServicePath(batchBuilder);
    const batchUrl = `${this.baseUrl}${servicePath}/$batch`;
    await this._ensureCsrfToken(servicePath);

    const { headers: batchHeaders, body, boundary } = batchBuilder.build();

    const headers = {
      ...batchHeaders,
      'X-CSRF-Token': this._csrfToken,
    };

    const responseText = await this._execute('POST', batchUrl, body, headers, true);

    if (batchBuilder.version === 'v4') {
      return parseV4BatchResponse(responseText);
    }
    return parseV2BatchResponse(responseText, boundary);
  }

  /**
   * Fetch and parse $metadata for a service
   */
  async getMetadata(servicePath) {
    const url = `${this.baseUrl}${servicePath}/$metadata`;
    const text = await this._execute('GET', url, null, { Accept: 'application/xml' }, true);
    return text;
  }

  // ── Private helpers ─────────────────────────────────────────────

  _buildUrl(path, params = {}) {
    const base = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const url = new URL(base);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    if (this.version === 'v4' && !url.searchParams.has('$format')) {
      url.searchParams.set('$format', 'json');
    }
    return url.toString();
  }

  _extractResults(data) {
    // V4 format
    if (data.value && Array.isArray(data.value)) return data.value;
    // V2 format
    if (data.d && data.d.results && Array.isArray(data.d.results)) return data.d.results;
    if (data.d) return [data.d];
    return Array.isArray(data) ? data : [data];
  }

  async _ensureCsrfToken(servicePath) {
    if (this._csrfToken && Date.now() < this._csrfExpiry) return;

    const url = `${this.baseUrl}${servicePath}`;
    const authHeaders = this.authProvider ? await this.authProvider.getHeaders() : {};
    const agent = this.authProvider ? this.authProvider.getAgent() : null;

    const fetchOptions = {
      method: 'HEAD',
      headers: {
        ...authHeaders,
        'X-CSRF-Token': 'Fetch',
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    if (agent) {
      fetchOptions.dispatcher = agent;
    }

    try {
      const response = await fetch(url, fetchOptions);
      this._csrfToken = response.headers.get('x-csrf-token') || 'unused';

      // Capture cookies for session affinity
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        this._cookies = setCookie.split(',').map((c) => c.split(';')[0].trim());
      }

      // Cache for 25 minutes (SAP default session is 30 min)
      this._csrfExpiry = Date.now() + 25 * 60 * 1000;
    } catch (err) {
      this.log.warn('CSRF token fetch failed, using placeholder', { error: err.message });
      this._csrfToken = 'unused';
      this._csrfExpiry = Date.now() + 5 * 60 * 1000;
    }
  }

  async _executeWithRetry(method, url, body) {
    let lastError;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        return await this._execute(method, url, body);
      } catch (err) {
        lastError = err;
        if (err instanceof AuthenticationError) throw err; // Don't retry auth failures
        if (err.statusCode === 403 && err.message.includes('CSRF')) {
          // CSRF token expired — refetch and retry
          this._csrfToken = null;
          this._csrfExpiry = 0;
          const pathMatch = url.match(new RegExp(`^${this.baseUrl}(/[^?]*)`));
          if (pathMatch) await this._ensureCsrfToken(pathMatch[1]);
          continue;
        }
        if (attempt < this.retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          const jitter = Math.random() * 500;
          this.log.debug(`Retry ${attempt + 1}/${this.retries} after ${delay}ms`, { method, url });
          await new Promise((r) => setTimeout(r, delay + jitter));
        }
      }
    }
    throw lastError;
  }

  async _execute(method, url, body, extraHeaders = {}, rawResponse = false) {
    const authHeaders = this.authProvider ? await this.authProvider.getHeaders() : {};
    const agent = this.authProvider ? this.authProvider.getAgent() : null;

    const headers = {
      ...authHeaders,
      ...extraHeaders,
      Accept: extraHeaders.Accept || 'application/json',
    };

    if (this._csrfToken && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      headers['X-CSRF-Token'] = this._csrfToken;
    }

    if (this._cookies.length > 0) {
      headers['Cookie'] = this._cookies.join('; ');
    }

    const fetchOptions = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
      if (typeof body === 'string') {
        fetchOptions.body = body;
      } else {
        fetchOptions.body = JSON.stringify(body);
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }
    }

    if (agent) {
      fetchOptions.dispatcher = agent;
    }

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new ConnectionError(`Request timed out after ${this.timeout}ms`, { url, method });
      }
      throw new ConnectionError(`Network error: ${err.message}`, { url, method });
    }

    if (response.status === 401) {
      throw new AuthenticationError('Authentication failed', { url, status: 401 });
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const err = new ODataError('Rate limited', 429, null, { url, retryAfter });
      throw err;
    }

    if (response.status === 204) return null; // No content

    const text = await response.text();

    if (!response.ok) {
      let errorBody = text;
      try { errorBody = JSON.parse(text); } catch { /* keep text */ }
      throw new ODataError(
        `OData request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorBody,
        { url, method }
      );
    }

    if (rawResponse) return text;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  _guessServicePath(batchBuilder) {
    // Extract service path from first operation URL
    if (batchBuilder._operations.length > 0) {
      const firstPath = batchBuilder._operations[0].path;
      const parts = firstPath.split('/');
      // Typically /sap/opu/odata/sap/SERVICE_NAME/EntitySet
      if (parts.length >= 6) {
        return parts.slice(0, 6).join('/');
      }
    }
    return '/sap/opu/odata/sap';
  }
}

module.exports = ODataClient;
