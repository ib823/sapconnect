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
/**
 * ADT (ABAP Development Tools) REST Client
 *
 * Comprehensive client for /sap/bc/adt/* endpoints that wraps the ADT REST APIs
 * not covered by the OData client. Supports source code operations, transport
 * management, ATC checks, ABAP Unit testing, where-used analysis, and more.
 *
 * Supports mock mode for testing and live mode for real SAP system interaction.
 */

const { ConnectionError, RfcError } = require('../errors');
const Logger = require('../logger');

class AdtError extends RfcError {
  constructor(message, statusCode, details) {
    super(message, details);
    this.name = 'AdtError';
    this.code = 'ERR_ADT';
    this.statusCode = statusCode || 0;
  }
}

class AdtClient {
  /**
   * @param {object} options
   * @param {string} options.baseUrl - SAP system base URL (e.g. https://host:port)
   * @param {string} options.username - SAP username
   * @param {string} options.password - SAP password
   * @param {string} [options.client] - SAP client number (sap-client)
   * @param {number} [options.timeout=30000] - Request timeout in ms
   * @param {string} [options.mode='live'] - 'mock' or 'live'
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || '').replace(/\/+$/, '');
    this.username = options.username || '';
    this.password = options.password || '';
    this.client = options.client || '';
    this.timeout = options.timeout || 30000;
    this.mode = options.mode || 'live';
    this.log = options.logger || new Logger('adt-client', { level: 'warn' });

    this._csrfToken = null;
    this._csrfExpiry = 0;
    this._cookies = [];
  }

  // ── CSRF Token Management ───────────────────────────────────────────

  /**
   * Fetch a CSRF token from ADT discovery endpoint.
   * Caches the token for 25 minutes.
   */
  async _fetchCsrfToken() {
    if (this._csrfToken && Date.now() < this._csrfExpiry) {
      return this._csrfToken;
    }

    const response = await this._request('GET', '/sap/bc/adt/discovery', {
      extraHeaders: { 'X-CSRF-Token': 'Fetch' },
      skipCsrf: true,
    });

    if (response._csrfToken) {
      this._csrfToken = response._csrfToken;
      this._csrfExpiry = Date.now() + 25 * 60 * 1000;
    }

    return this._csrfToken;
  }

  // ── Repository Search ───────────────────────────────────────────────

  /**
   * Search for ABAP objects via ADT quick search.
   * @param {string} query - Search term
   * @param {string} [objectType] - Object type filter (e.g. CLAS, PROG, TABL)
   * @param {number} [maxResults=50] - Maximum results to return
   * @returns {Array<{uri: string, type: string, name: string, packageName: string, description: string}>}
   */
  async searchObjects(query, objectType, maxResults = 50) {
    if (this.mode === 'mock') {
      return this._mockSearchObjects(query, objectType, maxResults);
    }

    let path = `/sap/bc/adt/repository/informationsystem/search?operation=quickSearch&query=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    if (objectType) {
      path += `&objectType=${encodeURIComponent(objectType)}`;
    }

    const result = await this._request('GET', path, {
      accept: 'application/xml',
    });

    return this._parseSearchResults(result.body);
  }

  // ── Source Code Operations ──────────────────────────────────────────

  /**
   * Get source code for an ABAP object.
   * @param {string} objectUri - ADT object URI (e.g. /sap/bc/adt/programs/programs/ZTEST)
   * @returns {string} Source code text
   */
  async getSource(objectUri) {
    if (this.mode === 'mock') {
      return this._mockGetSource(objectUri);
    }

    const result = await this._request('GET', `${objectUri}/source/main`, {
      accept: 'text/plain',
    });

    return result.body;
  }

  /**
   * Write source code to an ABAP object. Requires a lock handle.
   * @param {string} objectUri - ADT object URI
   * @param {string} source - Source code text
   * @param {string} lockHandle - Lock handle from lockObject()
   * @returns {{status: number}}
   */
  async writeSource(objectUri, source, lockHandle) {
    if (this.mode === 'mock') {
      return { status: 200, message: 'Source updated successfully' };
    }

    await this._fetchCsrfToken();

    const result = await this._request('PUT', `${objectUri}/source/main`, {
      body: source,
      contentType: 'text/plain',
      extraHeaders: {
        'X-sap-adt-lockhandle': lockHandle,
      },
    });

    return { status: result.status, message: 'Source updated successfully' };
  }

  // ── Lock / Unlock / Activate ────────────────────────────────────────

  /**
   * Lock an ABAP object for editing.
   * @param {string} objectUri - ADT object URI
   * @returns {{lockHandle: string}}
   */
  async lockObject(objectUri) {
    if (this.mode === 'mock') {
      return { lockHandle: `MOCK_LOCK_${Date.now()}` };
    }

    await this._fetchCsrfToken();

    const result = await this._request('POST', objectUri, {
      extraHeaders: {
        'X-sap-adt-request-method': 'LOCK',
      },
      accept: 'application/xml',
    });

    const lockHandle = this._extractLockHandle(result.body);
    return { lockHandle };
  }

  /**
   * Unlock an ABAP object.
   * @param {string} objectUri - ADT object URI
   * @param {string} lockHandle - Lock handle obtained from lockObject()
   * @returns {{status: number}}
   */
  async unlockObject(objectUri, lockHandle) {
    if (this.mode === 'mock') {
      return { status: 200, message: 'Object unlocked' };
    }

    await this._fetchCsrfToken();

    const result = await this._request('POST', objectUri, {
      extraHeaders: {
        'X-sap-adt-request-method': 'UNLOCK',
        'X-sap-adt-lockhandle': lockHandle,
      },
    });

    return { status: result.status, message: 'Object unlocked' };
  }

  /**
   * Activate an ABAP object.
   * @param {string} objectUri - ADT object URI
   * @returns {{activated: boolean, messages: Array}}
   */
  async activateObject(objectUri) {
    if (this.mode === 'mock') {
      return {
        activated: true,
        messages: [{ severity: 'info', text: 'Object activated successfully' }],
      };
    }

    await this._fetchCsrfToken();

    const activationBody = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<adtcore:objectReferences xmlns:adtcore="http://www.sap.com/adt/core">',
      `  <adtcore:objectReference adtcore:uri="${objectUri}"/>`,
      '</adtcore:objectReferences>',
    ].join('\n');

    const result = await this._request('POST', '/sap/bc/adt/activation', {
      body: activationBody,
      contentType: 'application/xml',
      accept: 'application/xml',
    });

    return this._parseActivationResult(result.body);
  }

  // ── DDIC Operations ─────────────────────────────────────────────────

  /**
   * Get table definition from ADT DDIC services.
   * @param {string} tableName - SAP table name
   * @returns {{name: string, description: string, tableCategory: string, deliveryClass: string, fields: Array}}
   */
  async getTableDefinition(tableName) {
    if (this.mode === 'mock') {
      return this._mockGetTableDefinition(tableName);
    }

    const result = await this._request('GET', `/sap/bc/adt/ddic/tables/${encodeURIComponent(tableName)}`, {
      accept: 'application/xml',
    });

    return this._parseTableDefinition(result.body, tableName);
  }

  /**
   * Get CDS view source code.
   * @param {string} cdsName - CDS view name
   * @returns {string} CDS source code
   */
  async getCdsSource(cdsName) {
    if (this.mode === 'mock') {
      return this._mockGetCdsSource(cdsName);
    }

    const result = await this._request('GET', `/sap/bc/adt/ddic/ddl/sources/${encodeURIComponent(cdsName)}/source/main`, {
      accept: 'text/plain',
    });

    return result.body;
  }

  // ── ATC (ABAP Test Cockpit) ─────────────────────────────────────────

  /**
   * Run ATC checks on a set of objects.
   * 4-step flow: create run, poll for completion, get results, parse findings.
   * @param {Array<string>} objectSet - Array of object URIs to check
   * @param {string} [checkVariant='DEFAULT'] - ATC check variant
   * @returns {{findings: Array<{uri: string, type: string, priority: number, message: string, location: object}>}}
   */
  async runAtcCheck(objectSet, checkVariant = 'DEFAULT') {
    if (this.mode === 'mock') {
      return this._mockRunAtcCheck(objectSet, checkVariant);
    }

    await this._fetchCsrfToken();

    // Step 1: Create ATC run
    const objectRefs = objectSet.map(uri =>
      `<adtcore:objectReference adtcore:uri="${uri}"/>`
    ).join('\n    ');

    const runBody = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<atc:run xmlns:atc="http://www.sap.com/adt/atc" xmlns:adtcore="http://www.sap.com/adt/core"',
      `  maximumVerdicts="100">`,
      `  <atc:objectSets>`,
      `    <atc:objectSet kind="inclusive">`,
      `      ${objectRefs}`,
      `    </atc:objectSet>`,
      `  </atc:objectSets>`,
      `</atc:run>`,
    ].join('\n');

    const createResult = await this._request('POST', '/sap/bc/adt/atc/runs', {
      body: runBody,
      contentType: 'application/xml',
      accept: 'application/xml',
      extraHeaders: {
        'X-sap-adt-checkvariant': checkVariant,
      },
    });

    const runId = this._extractAtcRunId(createResult.body, createResult.headers);

    // Step 2: Poll for completion
    let status = 'running';
    let pollCount = 0;
    const maxPolls = 30;

    while (status === 'running' && pollCount < maxPolls) {
      const pollResult = await this._request('GET', `/sap/bc/adt/atc/runs/${runId}`, {
        accept: 'application/xml',
      });
      status = this._extractAtcStatus(pollResult.body);

      if (status === 'running') {
        await this._sleep(1000);
        pollCount++;
      }
    }

    if (status === 'running') {
      throw new AdtError('ATC check timed out after polling', 408, { runId, pollCount });
    }

    // Step 3: Get results as checkstyle XML
    const resultsResponse = await this._request('GET', `/sap/bc/adt/atc/runs/${runId}/results`, {
      accept: 'application/xml',
    });

    // Step 4: Parse findings from checkstyle XML
    return this._parseAtcResults(resultsResponse.body);
  }

  // ── ABAP Unit Tests ─────────────────────────────────────────────────

  /**
   * Run ABAP Unit tests for an object.
   * @param {string} objectUri - ADT object URI
   * @returns {{testClasses: Array<{name: string, methods: Array<{name: string, status: string, duration: number, alerts: Array}>}>}}
   */
  async runUnitTests(objectUri) {
    if (this.mode === 'mock') {
      return this._mockRunUnitTests(objectUri);
    }

    await this._fetchCsrfToken();

    const testBody = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<aunit:runConfiguration xmlns:aunit="http://www.sap.com/adt/aunit">',
      '  <external>',
      '    <coverage active="false"/>',
      '  </external>',
      '  <options>',
      '    <uriType value="semantic"/>',
      '    <testDeterminationStrategy appendAssignedTestsPreview="true" assignedTests="false" sameProgram="true"/>',
      '    <testRiskCoverage harmless="true" dangerous="true" critical="true"/>',
      '    <testDurationCoverage short="true" medium="true" long="true"/>',
      '  </options>',
      `  <adtcore:objectSets xmlns:adtcore="http://www.sap.com/adt/core">`,
      `    <objectSet kind="inclusive">`,
      `      <adtcore:objectReference adtcore:uri="${objectUri}"/>`,
      `    </objectSet>`,
      `  </adtcore:objectSets>`,
      '</aunit:runConfiguration>',
    ].join('\n');

    const result = await this._request('POST', '/sap/bc/adt/abapunit/testruns', {
      body: testBody,
      contentType: 'application/xml',
      accept: 'application/xml',
    });

    return this._parseUnitTestResults(result.body);
  }

  // ── Transport Management ────────────────────────────────────────────

  /**
   * Get transport requests for a user.
   * @param {string} user - SAP user name
   * @returns {Array<{number: string, owner: string, description: string, status: string, type: string, target: string, tasks: Array}>}
   */
  async getTransportRequests(user) {
    if (this.mode === 'mock') {
      return this._mockGetTransportRequests(user);
    }

    const result = await this._request('GET',
      `/sap/bc/adt/cts/transportrequests?user=${encodeURIComponent(user)}&status=D`, {
        accept: 'application/xml',
      });

    return this._parseTransportRequests(result.body);
  }

  /**
   * Create a new transport request.
   * @param {string} description - Transport description
   * @param {string} [type='K'] - Transport type (K=Workbench, W=Customizing)
   * @returns {{number: string, description: string, type: string}}
   */
  async createTransport(description, type = 'K') {
    if (this.mode === 'mock') {
      return {
        number: `DEVK9${String(Math.floor(Math.random() * 90000) + 10000)}`,
        description,
        type,
      };
    }

    await this._fetchCsrfToken();

    const transportBody = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<tm:root xmlns:tm="http://www.sap.com/cts/adt/tm"',
      '  tm:useraction="newrequest">',
      `  <tm:request tm:desc="${this._escapeXml(description)}"`,
      `    tm:type="${type}"`,
      `    tm:target=""`,
      `    tm:cts_project="">`,
      '    <tm:task tm:desc="" tm:type="S"/>',
      '  </tm:request>',
      '</tm:root>',
    ].join('\n');

    const result = await this._request('POST', '/sap/bc/adt/cts/transportrequests', {
      body: transportBody,
      contentType: 'application/xml',
      accept: 'application/xml',
    });

    return this._parseCreatedTransport(result.body, description, type);
  }

  // ── Where-Used and Enhancements ─────────────────────────────────────

  /**
   * Get where-used list for an ABAP object.
   * @param {string} objectUri - ADT object URI
   * @returns {Array<{uri: string, name: string, type: string, packageName: string}>}
   */
  async getWhereUsed(objectUri) {
    if (this.mode === 'mock') {
      return this._mockGetWhereUsed(objectUri);
    }

    const result = await this._request('GET',
      `/sap/bc/adt/repository/informationsystem/whereused?uri=${encodeURIComponent(objectUri)}`, {
        accept: 'application/xml',
      });

    return this._parseWhereUsedResults(result.body);
  }

  /**
   * Get enhancement implementations for an ABAP object.
   * @param {string} objectUri - ADT object URI
   * @returns {Array<{name: string, type: string, spotName: string, description: string, active: boolean}>}
   */
  async getEnhancements(objectUri) {
    if (this.mode === 'mock') {
      return this._mockGetEnhancements(objectUri);
    }

    const result = await this._request('GET',
      `/sap/bc/adt/enhancements?uri=${encodeURIComponent(objectUri)}`, {
        accept: 'application/xml',
      });

    return this._parseEnhancements(result.body);
  }

  // ── Syntax Check ────────────────────────────────────────────────────

  /**
   * Run syntax check on ABAP source.
   * @param {string} source - ABAP source code
   * @param {string} objectUri - Context object URI
   * @returns {{valid: boolean, messages: Array<{severity: string, line: number, column: number, text: string}>}}
   */
  async getSyntaxCheck(source, objectUri) {
    if (this.mode === 'mock') {
      return this._mockGetSyntaxCheck(source, objectUri);
    }

    await this._fetchCsrfToken();

    const result = await this._request('POST', '/sap/bc/adt/abap/validation/syntax', {
      body: source,
      contentType: 'text/plain',
      accept: 'application/xml',
      extraHeaders: {
        'x-sap-adt-objecturi': objectUri,
      },
    });

    return this._parseSyntaxCheckResult(result.body);
  }

  // ── HTTP Request Helper ─────────────────────────────────────────────

  /**
   * Internal HTTP request handler with CSRF, auth, sap-client, and error wrapping.
   * @param {string} method - HTTP method
   * @param {string} path - URL path (relative to baseUrl)
   * @param {object} [options]
   * @returns {{status: number, body: string, headers: object, _csrfToken: string|null}}
   */
  async _request(method, path, options = {}) {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;

    const headers = {
      'Authorization': `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`,
      'Accept': options.accept || 'application/xml',
      ...options.extraHeaders,
    };

    if (this.client) {
      headers['sap-client'] = this.client;
    }

    if (options.contentType) {
      headers['Content-Type'] = options.contentType;
    }

    // Add CSRF token for write operations
    if (!options.skipCsrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (this._csrfToken) {
        headers['X-CSRF-Token'] = this._csrfToken;
      }
    }

    if (this._cookies.length > 0) {
      headers['Cookie'] = this._cookies.join('; ');
    }

    const fetchOptions = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (options.body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = options.body;
    }

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new ConnectionError(`ADT request timed out after ${this.timeout}ms`, { url, method });
      }
      throw new ConnectionError(`ADT network error: ${err.message}`, { url, method });
    }

    // Capture CSRF token from response
    const csrfToken = response.headers.get('x-csrf-token');

    // Capture cookies
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this._cookies = setCookie.split(',').map(c => c.split(';')[0].trim());
    }

    const body = await response.text();

    if (response.status === 401) {
      throw new AdtError('ADT authentication failed', 401, { url });
    }

    if (response.status === 403) {
      // Could be CSRF failure — clear cached token
      this._csrfToken = null;
      this._csrfExpiry = 0;
      throw new AdtError('ADT access forbidden (possible CSRF token issue)', 403, { url });
    }

    if (response.status === 404) {
      throw new AdtError(`ADT resource not found: ${path}`, 404, { url, path });
    }

    if (!response.ok && response.status !== 200 && response.status !== 201 && response.status !== 204) {
      throw new AdtError(
        `ADT request failed: ${response.status} ${response.statusText}`,
        response.status,
        { url, method, body: body.substring(0, 500) }
      );
    }

    // Collect response headers as plain object
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      status: response.status,
      body,
      headers: responseHeaders,
      _csrfToken: csrfToken,
    };
  }

  // ── XML Parsers ─────────────────────────────────────────────────────

  _parseSearchResults(xml) {
    const results = [];
    const objectPattern = /<objectReference[\s][^>]*>/g;
    let match;
    while ((match = objectPattern.exec(xml)) !== null) {
      const tag = match[0];
      results.push({
        uri: this._extractAttr(tag, 'adtcore:uri') || this._extractAttr(tag, 'uri') || '',
        type: this._extractAttr(tag, 'adtcore:type') || this._extractAttr(tag, 'type') || '',
        name: this._extractAttr(tag, 'adtcore:name') || this._extractAttr(tag, 'name') || '',
        packageName: this._extractAttr(tag, 'adtcore:packageName') || this._extractAttr(tag, 'packageName') || '',
        description: this._extractAttr(tag, 'adtcore:description') || this._extractAttr(tag, 'description') || '',
      });
    }
    return results;
  }

  _extractLockHandle(xml) {
    // Lock handle can be in a header or XML body
    const lockMatch = xml.match(/<LOCK_HANDLE>(.*?)<\/LOCK_HANDLE>/);
    if (lockMatch) return lockMatch[1];

    const handleMatch = xml.match(/lockHandle="([^"]+)"/);
    if (handleMatch) return handleMatch[1];

    // Fallback: the whole body might be the lock handle for simple responses
    const trimmed = (xml || '').trim();
    if (trimmed.length > 0 && trimmed.length < 100 && !trimmed.startsWith('<')) {
      return trimmed;
    }

    return '';
  }

  _parseActivationResult(xml) {
    const messages = [];
    const msgPattern = /<msg:shortText>(.*?)<\/msg:shortText>/g;
    const sevPattern = /<msg:severity>(.*?)<\/msg:severity>/g;

    const texts = [];
    const severities = [];
    let m;
    while ((m = msgPattern.exec(xml)) !== null) texts.push(m[1]);
    while ((m = sevPattern.exec(xml)) !== null) severities.push(m[1]);

    for (let i = 0; i < texts.length; i++) {
      messages.push({
        severity: (severities[i] || 'info').toLowerCase(),
        text: texts[i],
      });
    }

    const hasErrors = messages.some(msg => msg.severity === 'error');

    return {
      activated: !hasErrors,
      messages: messages.length > 0 ? messages : [{ severity: 'info', text: 'Object activated successfully' }],
    };
  }

  _parseTableDefinition(xml, tableName) {
    const fields = [];
    const fieldPattern = /<field[^>]*>([\s\S]*?)<\/field>/g;
    let m;
    while ((m = fieldPattern.exec(xml)) !== null) {
      const fieldXml = m[0];
      fields.push({
        name: this._extractAttr(fieldXml, 'name') || this._extractTagContent(fieldXml, 'name') || '',
        type: this._extractTagContent(fieldXml, 'type') || this._extractAttr(fieldXml, 'type') || '',
        length: parseInt(this._extractTagContent(fieldXml, 'length') || '0', 10),
        decimals: parseInt(this._extractTagContent(fieldXml, 'decimals') || '0', 10),
        isKey: this._extractTagContent(fieldXml, 'isKey') === 'true' || this._extractAttr(fieldXml, 'isKey') === 'true',
        description: this._extractTagContent(fieldXml, 'description') || '',
      });
    }

    return {
      name: tableName,
      description: this._extractTagContent(xml, 'description') || '',
      tableCategory: this._extractTagContent(xml, 'tableCategory') || 'TRANSP',
      deliveryClass: this._extractTagContent(xml, 'deliveryClass') || 'A',
      fields,
    };
  }

  _extractAtcRunId(body, headers) {
    // Run ID may be in Location header or in the response body
    if (headers && headers.location) {
      const locMatch = headers.location.match(/\/runs\/([^/?]+)/);
      if (locMatch) return locMatch[1];
    }

    const idMatch = (body || '').match(/<atc:run[^>]*id="([^"]+)"/);
    if (idMatch) return idMatch[1];

    const workunitsMatch = (body || '').match(/<worklistId>(.*?)<\/worklistId>/);
    if (workunitsMatch) return workunitsMatch[1];

    // Fallback: treat the body as the run ID
    const trimmed = (body || '').trim();
    if (trimmed.length > 0 && trimmed.length < 50 && !trimmed.startsWith('<')) {
      return trimmed;
    }

    return 'unknown';
  }

  _extractAtcStatus(xml) {
    const statusMatch = (xml || '').match(/status="([^"]+)"/);
    if (statusMatch) {
      const s = statusMatch[1].toLowerCase();
      if (s === 'completed' || s === 'done' || s === 'finished') return 'completed';
      if (s === 'running' || s === 'in_progress') return 'running';
      return s;
    }

    // If no status attribute, check for result content which implies completion
    if (xml && (xml.includes('<finding') || xml.includes('<atc:result') || xml.includes('checkstyle'))) {
      return 'completed';
    }

    return 'completed'; // Default to completed for simple responses
  }

  _parseAtcResults(xml) {
    const findings = [];

    // Parse checkstyle format: <file name="..."><error line="..." column="..." severity="..." message="..." source="..."/></file>
    const filePattern = /<file\s+name="([^"]*)"[^>]*>([\s\S]*?)<\/file>/g;
    let fileMatch;
    while ((fileMatch = filePattern.exec(xml)) !== null) {
      const fileUri = fileMatch[1];
      const fileContent = fileMatch[2];

      const errorPattern = /<error\s([^>]*)\/>/g;
      let errorMatch;
      while ((errorMatch = errorPattern.exec(fileContent)) !== null) {
        const attrs = errorMatch[1];
        findings.push({
          uri: fileUri,
          type: this._extractAttrFromString(attrs, 'source') || 'unknown',
          priority: this._severityToPriority(this._extractAttrFromString(attrs, 'severity')),
          message: this._extractAttrFromString(attrs, 'message') || '',
          location: {
            line: parseInt(this._extractAttrFromString(attrs, 'line') || '0', 10),
            column: parseInt(this._extractAttrFromString(attrs, 'column') || '0', 10),
          },
        });
      }
    }

    // Also try ADT native format: <atc:finding ...>
    const findingPattern = /<(?:atc:)?finding([^>]*)(?:\/>|>([\s\S]*?)<\/(?:atc:)?finding>)/g;
    let findingMatch;
    while ((findingMatch = findingPattern.exec(xml)) !== null) {
      const attrs = findingMatch[1];
      const content = findingMatch[2] || '';
      findings.push({
        uri: this._extractAttrFromString(attrs, 'uri') || '',
        type: this._extractAttrFromString(attrs, 'checkId') || this._extractAttrFromString(attrs, 'type') || 'unknown',
        priority: parseInt(this._extractAttrFromString(attrs, 'priority') || '3', 10),
        message: this._extractAttrFromString(attrs, 'message') || this._extractTagContent(content, 'message') || '',
        location: {
          line: parseInt(this._extractAttrFromString(attrs, 'line') || '0', 10),
          column: parseInt(this._extractAttrFromString(attrs, 'column') || '0', 10),
        },
      });
    }

    return { findings };
  }

  _parseUnitTestResults(xml) {
    const testClasses = [];

    const classPattern = /<(?:aunit:)?testClass([^>]*)>([\s\S]*?)<\/(?:aunit:)?testClass>/g;
    let classMatch;
    while ((classMatch = classPattern.exec(xml)) !== null) {
      const classAttrs = classMatch[1];
      const classContent = classMatch[2];
      const className = this._extractAttrFromString(classAttrs, 'name') ||
                        this._extractAttrFromString(classAttrs, 'adtcore:name') || 'Unknown';

      const methods = [];
      const methodPattern = /<(?:aunit:)?testMethod([^>]*)>([\s\S]*?)<\/(?:aunit:)?testMethod>/g;
      let methodMatch;
      while ((methodMatch = methodPattern.exec(classContent)) !== null) {
        const methodAttrs = methodMatch[1];
        const methodContent = methodMatch[2];
        const methodName = this._extractAttrFromString(methodAttrs, 'name') ||
                          this._extractAttrFromString(methodAttrs, 'adtcore:name') || 'Unknown';

        const alerts = [];
        const alertPattern = /<(?:aunit:)?alert([^>]*)>([\s\S]*?)<\/(?:aunit:)?alert>/g;
        let alertMatch;
        while ((alertMatch = alertPattern.exec(methodContent)) !== null) {
          const alertAttrs = alertMatch[1];
          const alertContent = alertMatch[2];
          alerts.push({
            kind: this._extractAttrFromString(alertAttrs, 'kind') || 'failure',
            severity: this._extractAttrFromString(alertAttrs, 'severity') || 'critical',
            title: this._extractTagContent(alertContent, 'title') || '',
            details: this._extractTagContent(alertContent, 'details') || '',
          });
        }

        const status = alerts.length > 0 ? 'failed' : 'passed';
        const durationStr = this._extractAttrFromString(methodAttrs, 'executionTime') ||
                           this._extractAttrFromString(methodAttrs, 'duration') || '0';

        methods.push({
          name: methodName,
          status,
          duration: parseInt(durationStr, 10),
          alerts,
        });
      }

      testClasses.push({ name: className, methods });
    }

    return { testClasses };
  }

  _parseTransportRequests(xml) {
    const transports = [];

    const reqPattern = /<(?:tm:)?request([^>]*)>([\s\S]*?)<\/(?:tm:)?request>/g;
    let reqMatch;
    while ((reqMatch = reqPattern.exec(xml)) !== null) {
      const attrs = reqMatch[1];
      const content = reqMatch[2];

      const tasks = [];
      const taskPattern = /<(?:tm:)?task([^>]*)\/>/g;
      let taskMatch;
      while ((taskMatch = taskPattern.exec(content)) !== null) {
        const taskAttrs = taskMatch[1];
        tasks.push({
          number: this._extractAttrFromString(taskAttrs, 'tm:number') || this._extractAttrFromString(taskAttrs, 'number') || '',
          owner: this._extractAttrFromString(taskAttrs, 'tm:owner') || this._extractAttrFromString(taskAttrs, 'owner') || '',
          description: this._extractAttrFromString(taskAttrs, 'tm:desc') || this._extractAttrFromString(taskAttrs, 'desc') || '',
          status: this._extractAttrFromString(taskAttrs, 'tm:status') || this._extractAttrFromString(taskAttrs, 'status') || 'D',
        });
      }

      transports.push({
        number: this._extractAttrFromString(attrs, 'tm:number') || this._extractAttrFromString(attrs, 'number') || '',
        owner: this._extractAttrFromString(attrs, 'tm:owner') || this._extractAttrFromString(attrs, 'owner') || '',
        description: this._extractAttrFromString(attrs, 'tm:desc') || this._extractAttrFromString(attrs, 'desc') || '',
        status: this._extractAttrFromString(attrs, 'tm:status') || this._extractAttrFromString(attrs, 'status') || 'D',
        type: this._extractAttrFromString(attrs, 'tm:type') || this._extractAttrFromString(attrs, 'type') || 'K',
        target: this._extractAttrFromString(attrs, 'tm:target') || this._extractAttrFromString(attrs, 'target') || '',
        tasks,
      });
    }

    return transports;
  }

  _parseCreatedTransport(xml, description, type) {
    const numMatch = (xml || '').match(/([A-Z]{3}K9\d{5})/);
    const number = numMatch ? numMatch[1] : `DEVK9${String(Math.floor(Math.random() * 90000) + 10000)}`;

    return { number, description, type };
  }

  _parseWhereUsedResults(xml) {
    const results = [];
    const refPattern = /<objectReference[\s][^>]*>/g;
    let m;
    while ((m = refPattern.exec(xml)) !== null) {
      const tag = m[0];
      results.push({
        uri: this._extractAttr(tag, 'adtcore:uri') || this._extractAttr(tag, 'uri') || '',
        name: this._extractAttr(tag, 'adtcore:name') || this._extractAttr(tag, 'name') || '',
        type: this._extractAttr(tag, 'adtcore:type') || this._extractAttr(tag, 'type') || '',
        packageName: this._extractAttr(tag, 'adtcore:packageName') || this._extractAttr(tag, 'packageName') || '',
      });
    }
    return results;
  }

  _parseEnhancements(xml) {
    const enhancements = [];
    const enhPattern = /<enhancement([^>]*)(?:\/>|>([\s\S]*?)<\/enhancement>)/g;
    let m;
    while ((m = enhPattern.exec(xml)) !== null) {
      const attrs = m[1];
      enhancements.push({
        name: this._extractAttrFromString(attrs, 'name') || '',
        type: this._extractAttrFromString(attrs, 'type') || 'ENHC',
        spotName: this._extractAttrFromString(attrs, 'spotName') || this._extractAttrFromString(attrs, 'spot') || '',
        description: this._extractAttrFromString(attrs, 'description') || '',
        active: this._extractAttrFromString(attrs, 'active') !== 'false',
      });
    }
    return enhancements;
  }

  _parseSyntaxCheckResult(xml) {
    const messages = [];

    const errPattern = /<(?:chkrun:)?error([^>]*)(?:\/>|>([\s\S]*?)<\/(?:chkrun:)?error>)/g;
    let m;
    while ((m = errPattern.exec(xml)) !== null) {
      const attrs = m[1];
      messages.push({
        severity: 'error',
        line: parseInt(this._extractAttrFromString(attrs, 'line') || '0', 10),
        column: parseInt(this._extractAttrFromString(attrs, 'column') || '0', 10),
        text: this._extractAttrFromString(attrs, 'message') || this._extractAttrFromString(attrs, 'text') || '',
      });
    }

    const warnPattern = /<(?:chkrun:)?warning([^>]*)(?:\/>|>([\s\S]*?)<\/(?:chkrun:)?warning>)/g;
    while ((m = warnPattern.exec(xml)) !== null) {
      const attrs = m[1];
      messages.push({
        severity: 'warning',
        line: parseInt(this._extractAttrFromString(attrs, 'line') || '0', 10),
        column: parseInt(this._extractAttrFromString(attrs, 'column') || '0', 10),
        text: this._extractAttrFromString(attrs, 'message') || this._extractAttrFromString(attrs, 'text') || '',
      });
    }

    return {
      valid: messages.filter(m => m.severity === 'error').length === 0,
      messages,
    };
  }

  // ── XML Utility Helpers ─────────────────────────────────────────────

  _extractAttr(tag, attrName) {
    const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
    const match = tag.match(regex);
    return match ? match[1] : null;
  }

  _extractAttrFromString(str, attrName) {
    const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
    const match = str.match(regex);
    return match ? match[1] : null;
  }

  _extractTagContent(xml, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>(.*?)<\/${tagName}>`, 'is');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  _escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  _severityToPriority(severity) {
    switch ((severity || '').toLowerCase()) {
      case 'error': return 1;
      case 'warning': return 2;
      case 'info': return 3;
      default: return 3;
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── Mock Implementations ────────────────────────────────────────────

  _mockSearchObjects(query, objectType, maxResults) {
    const allObjects = [
      { uri: '/sap/bc/adt/programs/programs/ZTEST_PROGRAM', type: 'PROG/P', name: 'ZTEST_PROGRAM', packageName: 'ZDEV', description: 'Test Program' },
      { uri: '/sap/bc/adt/oo/classes/ZCL_TEST', type: 'CLAS/OC', name: 'ZCL_TEST', packageName: 'ZDEV', description: 'Test Class' },
      { uri: '/sap/bc/adt/ddic/tables/ZTABLE', type: 'TABL/DT', name: 'ZTABLE', packageName: 'ZDEV', description: 'Test Table' },
      { uri: '/sap/bc/adt/functions/groups/ZFUNC_GROUP', type: 'FUGR/F', name: 'ZFUNC_GROUP', packageName: 'ZDEV', description: 'Test Function Group' },
      { uri: '/sap/bc/adt/programs/includes/ZINCLUDE', type: 'PROG/I', name: 'ZINCLUDE', packageName: 'ZDEV', description: 'Test Include' },
      { uri: '/sap/bc/adt/oo/interfaces/ZIF_TEST', type: 'INTF/OI', name: 'ZIF_TEST', packageName: 'ZDEV', description: 'Test Interface' },
      { uri: '/sap/bc/adt/ddic/domains/ZDOMAIN', type: 'DOMA/DD', name: 'ZDOMAIN', packageName: 'ZDEV', description: 'Test Domain' },
      { uri: '/sap/bc/adt/ddic/dataelements/ZDATA_ELEM', type: 'DTEL/DE', name: 'ZDATA_ELEM', packageName: 'ZDEV', description: 'Test Data Element' },
    ];

    let filtered = allObjects;
    if (query) {
      const q = query.toUpperCase();
      filtered = filtered.filter(o => o.name.includes(q) || o.description.toUpperCase().includes(q));
    }
    if (objectType) {
      filtered = filtered.filter(o => o.type.startsWith(objectType));
    }
    if (filtered.length === 0) {
      // Return at least some results matching the query pattern
      filtered = allObjects;
    }

    return filtered.slice(0, maxResults);
  }

  _mockGetSource(objectUri) {
    const nameMatch = objectUri.match(/\/([^/]+)$/);
    const name = nameMatch ? nameMatch[1] : 'ZPROGRAM';

    return [
      `REPORT ${name}.`,
      '',
      '* Generated mock source for testing',
      'DATA: lv_message TYPE string.',
      '',
      'START-OF-SELECTION.',
      `  lv_message = 'Hello from ${name}'.`,
      '  WRITE: / lv_message.',
      '',
      '* End of program',
    ].join('\n');
  }

  _mockGetTableDefinition(tableName) {
    const definitions = {
      BKPF: {
        name: 'BKPF', description: 'Accounting Document Header',
        tableCategory: 'TRANSP', deliveryClass: 'A',
        fields: [
          { name: 'MANDT', type: 'CLNT', length: 3, decimals: 0, isKey: true, description: 'Client' },
          { name: 'BUKRS', type: 'CHAR', length: 4, decimals: 0, isKey: true, description: 'Company Code' },
          { name: 'BELNR', type: 'CHAR', length: 10, decimals: 0, isKey: true, description: 'Document Number' },
          { name: 'GJAHR', type: 'NUMC', length: 4, decimals: 0, isKey: true, description: 'Fiscal Year' },
          { name: 'BLART', type: 'CHAR', length: 2, decimals: 0, isKey: false, description: 'Document Type' },
          { name: 'BLDAT', type: 'DATS', length: 8, decimals: 0, isKey: false, description: 'Document Date' },
          { name: 'BUDAT', type: 'DATS', length: 8, decimals: 0, isKey: false, description: 'Posting Date' },
          { name: 'MONAT', type: 'NUMC', length: 2, decimals: 0, isKey: false, description: 'Posting Period' },
          { name: 'CPUDT', type: 'DATS', length: 8, decimals: 0, isKey: false, description: 'Entry Date' },
          { name: 'USNAM', type: 'CHAR', length: 12, decimals: 0, isKey: false, description: 'User Name' },
          { name: 'WAERS', type: 'CUKY', length: 5, decimals: 0, isKey: false, description: 'Currency Key' },
          { name: 'BSTAT', type: 'CHAR', length: 1, decimals: 0, isKey: false, description: 'Document Status' },
        ],
      },
      KNA1: {
        name: 'KNA1', description: 'Customer Master General Data',
        tableCategory: 'TRANSP', deliveryClass: 'A',
        fields: [
          { name: 'MANDT', type: 'CLNT', length: 3, decimals: 0, isKey: true, description: 'Client' },
          { name: 'KUNNR', type: 'CHAR', length: 10, decimals: 0, isKey: true, description: 'Customer Number' },
          { name: 'LAND1', type: 'CHAR', length: 3, decimals: 0, isKey: false, description: 'Country Key' },
          { name: 'NAME1', type: 'CHAR', length: 35, decimals: 0, isKey: false, description: 'Name 1' },
          { name: 'NAME2', type: 'CHAR', length: 35, decimals: 0, isKey: false, description: 'Name 2' },
          { name: 'ORT01', type: 'CHAR', length: 35, decimals: 0, isKey: false, description: 'City' },
          { name: 'PSTLZ', type: 'CHAR', length: 10, decimals: 0, isKey: false, description: 'Postal Code' },
          { name: 'STRAS', type: 'CHAR', length: 35, decimals: 0, isKey: false, description: 'Street' },
          { name: 'TELF1', type: 'CHAR', length: 16, decimals: 0, isKey: false, description: 'Telephone 1' },
          { name: 'KTOKD', type: 'CHAR', length: 4, decimals: 0, isKey: false, description: 'Account Group' },
        ],
      },
      MARA: {
        name: 'MARA', description: 'Material Master General Data',
        tableCategory: 'TRANSP', deliveryClass: 'A',
        fields: [
          { name: 'MANDT', type: 'CLNT', length: 3, decimals: 0, isKey: true, description: 'Client' },
          { name: 'MATNR', type: 'CHAR', length: 18, decimals: 0, isKey: true, description: 'Material Number' },
          { name: 'ERSDA', type: 'DATS', length: 8, decimals: 0, isKey: false, description: 'Created On' },
          { name: 'ERNAM', type: 'CHAR', length: 12, decimals: 0, isKey: false, description: 'Created By' },
          { name: 'MTART', type: 'CHAR', length: 4, decimals: 0, isKey: false, description: 'Material Type' },
          { name: 'MBRSH', type: 'CHAR', length: 1, decimals: 0, isKey: false, description: 'Industry Sector' },
          { name: 'MATKL', type: 'CHAR', length: 9, decimals: 0, isKey: false, description: 'Material Group' },
          { name: 'MEINS', type: 'UNIT', length: 3, decimals: 0, isKey: false, description: 'Base Unit of Measure' },
          { name: 'BRGEW', type: 'QUAN', length: 13, decimals: 3, isKey: false, description: 'Gross Weight' },
          { name: 'NTGEW', type: 'QUAN', length: 13, decimals: 3, isKey: false, description: 'Net Weight' },
        ],
      },
    };

    return definitions[tableName] || {
      name: tableName,
      description: `Table ${tableName}`,
      tableCategory: 'TRANSP',
      deliveryClass: 'A',
      fields: [
        { name: 'MANDT', type: 'CLNT', length: 3, decimals: 0, isKey: true, description: 'Client' },
      ],
    };
  }

  _mockGetCdsSource(cdsName) {
    return [
      `@AbapCatalog.sqlViewName: 'ZV_${cdsName.substring(0, 10).toUpperCase()}'`,
      `@AbapCatalog.compiler.compareFilter: true`,
      `@AccessControl.authorizationCheck: #CHECK`,
      `@EndUserText.label: '${cdsName} CDS View'`,
      ``,
      `define view ${cdsName}`,
      `  as select from bkpf`,
      `  association [0..*] to bseg as _Items on _Items.bukrs = bkpf.bukrs`,
      `                                       and _Items.belnr = bkpf.belnr`,
      `                                       and _Items.gjahr = bkpf.gjahr`,
      `{`,
      `  key bukrs as CompanyCode,`,
      `  key belnr as DocumentNumber,`,
      `  key gjahr as FiscalYear,`,
      `      blart as DocumentType,`,
      `      bldat as DocumentDate,`,
      `      budat as PostingDate,`,
      `      waers as CurrencyCode,`,
      `      usnam as UserName,`,
      ``,
      `      _Items`,
      `}`,
    ].join('\n');
  }

  _mockRunAtcCheck(objectSet, checkVariant) {
    return {
      findings: [
        {
          uri: objectSet[0] || '/sap/bc/adt/programs/programs/ZTEST',
          type: 'CHECK_NAMING_CONVENTIONS',
          priority: 2,
          message: 'Variable naming does not follow convention (prefix LV_ for local variables)',
          location: { line: 15, column: 8 },
        },
        {
          uri: objectSet[0] || '/sap/bc/adt/programs/programs/ZTEST',
          type: 'CHECK_PERFORMANCE',
          priority: 1,
          message: 'SELECT * should be avoided for performance reasons',
          location: { line: 32, column: 3 },
        },
        {
          uri: objectSet[0] || '/sap/bc/adt/programs/programs/ZTEST',
          type: 'CHECK_SECURITY',
          priority: 1,
          message: 'Authority check missing before data access',
          location: { line: 45, column: 3 },
        },
        {
          uri: objectSet.length > 1 ? objectSet[1] : objectSet[0] || '/sap/bc/adt/programs/programs/ZTEST',
          type: 'CHECK_OBSOLETE_STATEMENT',
          priority: 3,
          message: 'Statement MOVE is obsolete, use assignment operator instead',
          location: { line: 88, column: 5 },
        },
      ],
    };
  }

  _mockRunUnitTests(objectUri) {
    return {
      testClasses: [
        {
          name: 'LTC_TEST_MAIN',
          methods: [
            { name: 'test_positive_case', status: 'passed', duration: 15, alerts: [] },
            { name: 'test_boundary_value', status: 'passed', duration: 8, alerts: [] },
            {
              name: 'test_error_handling',
              status: 'failed',
              duration: 23,
              alerts: [
                {
                  kind: 'failure',
                  severity: 'critical',
                  title: 'Assert Equals Failed',
                  details: 'Expected: "OK", Actual: "ERROR" [Line 42]',
                },
              ],
            },
          ],
        },
        {
          name: 'LTC_TEST_HELPER',
          methods: [
            { name: 'test_conversion', status: 'passed', duration: 5, alerts: [] },
            { name: 'test_validation', status: 'passed', duration: 12, alerts: [] },
          ],
        },
      ],
    };
  }

  _mockGetTransportRequests(user) {
    return [
      {
        number: 'DEVK900001',
        owner: user || 'DEVELOPER',
        description: 'Feature: New custom report',
        status: 'D',
        type: 'K',
        target: 'QAS',
        tasks: [
          { number: 'DEVK900002', owner: user || 'DEVELOPER', description: 'Development task', status: 'D' },
        ],
      },
      {
        number: 'DEVK900003',
        owner: user || 'DEVELOPER',
        description: 'Fix: Correct posting logic',
        status: 'D',
        type: 'K',
        target: 'QAS',
        tasks: [
          { number: 'DEVK900004', owner: user || 'DEVELOPER', description: 'Bug fix task', status: 'D' },
          { number: 'DEVK900005', owner: 'TESTER', description: 'Test task', status: 'D' },
        ],
      },
      {
        number: 'DEVK900006',
        owner: user || 'DEVELOPER',
        description: 'Customizing: New payment terms',
        status: 'D',
        type: 'W',
        target: 'QAS',
        tasks: [
          { number: 'DEVK900007', owner: user || 'DEVELOPER', description: 'Customizing task', status: 'D' },
        ],
      },
    ];
  }

  _mockGetWhereUsed(objectUri) {
    return [
      { uri: '/sap/bc/adt/programs/programs/ZREPORT_MAIN', name: 'ZREPORT_MAIN', type: 'PROG/P', packageName: 'ZDEV' },
      { uri: '/sap/bc/adt/oo/classes/ZCL_PROCESSOR', name: 'ZCL_PROCESSOR', type: 'CLAS/OC', packageName: 'ZCORE' },
      { uri: '/sap/bc/adt/oo/classes/ZCL_HELPER', name: 'ZCL_HELPER', type: 'CLAS/OC', packageName: 'ZCORE' },
      { uri: '/sap/bc/adt/functions/groups/ZFUNC_UTILS/fmodules/Z_UTIL_CONVERT', name: 'Z_UTIL_CONVERT', type: 'FUNC/FF', packageName: 'ZUTILS' },
    ];
  }

  _mockGetEnhancements(objectUri) {
    return [
      { name: 'ZE_CUSTOM_CHECK', type: 'ENHC', spotName: 'ES_BADI_CHECK', description: 'Custom validation enhancement', active: true },
      { name: 'ZE_FIELD_EXIT', type: 'ENHC', spotName: 'ES_FIELD_MODIFY', description: 'Field modification enhancement', active: true },
      { name: 'ZE_OLD_IMPL', type: 'ENHC', spotName: 'ES_LEGACY', description: 'Legacy enhancement (inactive)', active: false },
    ];
  }

  _mockGetSyntaxCheck(source, objectUri) {
    // Simulate basic checks on the provided source
    const messages = [];

    if (source && source.includes('SELECT *')) {
      messages.push({
        severity: 'warning',
        line: source.substring(0, source.indexOf('SELECT *')).split('\n').length,
        column: 1,
        text: 'Avoid SELECT * for performance reasons',
      });
    }

    if (source && source.includes('MOVE ')) {
      const lineNum = source.substring(0, source.indexOf('MOVE ')).split('\n').length;
      messages.push({
        severity: 'warning',
        line: lineNum,
        column: 1,
        text: 'MOVE statement is obsolete, use assignment operator',
      });
    }

    return {
      valid: messages.filter(m => m.severity === 'error').length === 0,
      messages,
    };
  }
}

module.exports = AdtClient;
