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

const Logger = require('../logger');
const { SignavioError } = require('../errors');

/**
 * Signavio REST API Client
 *
 * Provides access to SAP Signavio Process Manager for BPMN model retrieval,
 * search, glossary access, and model CRUD operations.
 *
 * Supports 'mock' mode for testing and 'live' mode for real Signavio interaction.
 */

// ── Mock Data ────────────────────────────────────────────────────────

const MOCK_MODELS = [
  {
    id: 'model-o2c-001',
    name: 'Order-to-Cash (O2C)',
    description: 'End-to-end order-to-cash process including sales order creation, delivery, billing, and payment receipt.',
    revisionId: 'rev-o2c-001',
    folderId: 'folder-main-001',
    lastModified: '2025-11-15T10:30:00Z',
    author: 'sap.architect@example.com',
  },
  {
    id: 'model-p2p-002',
    name: 'Procure-to-Pay (P2P)',
    description: 'Procurement process from purchase requisition through goods receipt and invoice verification to payment.',
    revisionId: 'rev-p2p-002',
    folderId: 'folder-main-001',
    lastModified: '2025-11-14T08:45:00Z',
    author: 'process.owner@example.com',
  },
  {
    id: 'model-r2r-003',
    name: 'Record-to-Report (R2R)',
    description: 'Financial close process covering journal entries, period-end closing, consolidation, and financial reporting.',
    revisionId: 'rev-r2r-003',
    folderId: 'folder-finance-002',
    lastModified: '2025-11-13T14:20:00Z',
    author: 'fi.lead@example.com',
  },
  {
    id: 'model-h2r-004',
    name: 'Hire-to-Retire (H2R)',
    description: 'Employee lifecycle from recruitment and onboarding through payroll processing to offboarding.',
    revisionId: 'rev-h2r-004',
    folderId: 'folder-hr-003',
    lastModified: '2025-11-12T16:00:00Z',
    author: 'hr.manager@example.com',
  },
  {
    id: 'model-i2p-005',
    name: 'Invoice-to-Pay (I2P)',
    description: 'Accounts payable process from invoice receipt and validation through approval workflow to payment execution.',
    revisionId: 'rev-i2p-005',
    folderId: 'folder-finance-002',
    lastModified: '2025-11-11T09:15:00Z',
    author: 'ap.specialist@example.com',
  },
];

const MOCK_GLOSSARY = [
  {
    id: 'glossary-001',
    name: 'Company Code',
    description: 'The smallest organizational unit for which a complete self-contained set of accounts can be drawn up in SAP FI.',
    category: 'Organization',
    sapReference: 'BUKRS',
  },
  {
    id: 'glossary-002',
    name: 'Sales Organization',
    description: 'Organizational unit responsible for the sale and distribution of goods and services.',
    category: 'Organization',
    sapReference: 'VKORG',
  },
  {
    id: 'glossary-003',
    name: 'Material Master',
    description: 'Central source of material-specific data used across logistics, procurement, and manufacturing.',
    category: 'Master Data',
    sapReference: 'MARA',
  },
  {
    id: 'glossary-004',
    name: 'Purchase Order',
    description: 'A formal request to a vendor to supply goods or services under specified conditions.',
    category: 'Transaction',
    sapReference: 'EKKO/EKPO',
  },
  {
    id: 'glossary-005',
    name: 'Transport Request',
    description: 'A container for change objects that records and transports customizing and development changes across SAP systems.',
    category: 'Technical',
    sapReference: 'E070/E071',
  },
];

const MOCK_PROCESS_JSON = {
  modelId: 'model-o2c-001',
  name: 'Order-to-Cash (O2C)',
  revision: 'rev-o2c-001',
  elements: {
    tasks: [
      { id: 'task-1', name: 'Create Sales Order', type: 'userTask', lane: 'Sales' },
      { id: 'task-2', name: 'Check Availability (RFC)', type: 'serviceTask', lane: 'Sales' },
      { id: 'task-3', name: 'Create Delivery', type: 'userTask', lane: 'Logistics' },
      { id: 'task-4', name: 'Post Goods Issue (BAPI)', type: 'serviceTask', lane: 'Logistics' },
      { id: 'task-5', name: 'Create Invoice', type: 'userTask', lane: 'Billing' },
    ],
    gateways: [
      { id: 'gw-1', name: 'Credit Check', type: 'exclusiveGateway' },
    ],
    events: [
      { id: 'evt-start', name: 'Order Received', type: 'startEvent' },
      { id: 'evt-end', name: 'Payment Received', type: 'endEvent' },
    ],
    flows: [
      { id: 'flow-1', sourceRef: 'evt-start', targetRef: 'task-1' },
      { id: 'flow-2', sourceRef: 'task-1', targetRef: 'gw-1' },
      { id: 'flow-3', sourceRef: 'gw-1', targetRef: 'task-2', name: 'Credit OK' },
      { id: 'flow-4', sourceRef: 'gw-1', targetRef: 'evt-end', name: 'Credit Rejected' },
      { id: 'flow-5', sourceRef: 'task-2', targetRef: 'task-3' },
      { id: 'flow-6', sourceRef: 'task-3', targetRef: 'task-4' },
      { id: 'flow-7', sourceRef: 'task-4', targetRef: 'task-5' },
      { id: 'flow-8', sourceRef: 'task-5', targetRef: 'evt-end' },
    ],
  },
};

const MOCK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">' +
  '<rect x="50" y="50" width="120" height="60" fill="#fff" stroke="#000"/>' +
  '<text x="110" y="85" text-anchor="middle">Create Sales Order</text>' +
  '</svg>';

const MOCK_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  id="Definitions_1"
                  targetNamespace="http://example.com/signavio">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="Order-to-Cash" processRef="Process_O2C"/>
  </bpmn:collaboration>
  <bpmn:process id="Process_O2C" name="Order-to-Cash Process" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_Sales" name="Sales">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CreateSO</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CheckAvail</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Credit</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Logistics" name="Logistics">
        <bpmn:flowNodeRef>Task_Delivery</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_GoodsIssue</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Billing" name="Billing">
        <bpmn:flowNodeRef>Task_Invoice</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_1</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" name="Order Received"/>
    <bpmn:userTask id="Task_CreateSO" name="Create Sales Order (VA01)"/>
    <bpmn:exclusiveGateway id="Gateway_Credit" name="Credit Check"/>
    <bpmn:serviceTask id="Task_CheckAvail" name="Check Availability (RFC)"/>
    <bpmn:userTask id="Task_Delivery" name="Create Delivery"/>
    <bpmn:serviceTask id="Task_GoodsIssue" name="Post Goods Issue (BAPI)"/>
    <bpmn:userTask id="Task_Invoice" name="Create Invoice"/>
    <bpmn:endEvent id="EndEvent_1" name="Payment Received"/>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_CreateSO"/>
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_CreateSO" targetRef="Gateway_Credit"/>
    <bpmn:sequenceFlow id="Flow_3" name="Credit OK" sourceRef="Gateway_Credit" targetRef="Task_CheckAvail"/>
    <bpmn:sequenceFlow id="Flow_4" name="Credit Rejected" sourceRef="Gateway_Credit" targetRef="EndEvent_1"/>
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_CheckAvail" targetRef="Task_Delivery"/>
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_Delivery" targetRef="Task_GoodsIssue"/>
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Task_GoodsIssue" targetRef="Task_Invoice"/>
    <bpmn:sequenceFlow id="Flow_8" sourceRef="Task_Invoice" targetRef="EndEvent_1"/>
  </bpmn:process>
</bpmn:definitions>`;

class SignavioClient {
  /**
   * @param {object} options
   * @param {string} options.baseUrl - Signavio base URL (e.g. https://editor.signavio.com)
   * @param {string} [options.tenantId] - Signavio tenant ID
   * @param {string} [options.username] - Signavio username (email)
   * @param {string} [options.password] - Signavio password
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   * @param {number} [options.timeout=30000] - Request timeout in ms
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    if (options.mode === 'live' && !options.baseUrl) {
      throw new SignavioError('baseUrl is required for live mode', {
        parameter: 'baseUrl',
      });
    }

    this.baseUrl = (options.baseUrl || 'https://editor.signavio.com').replace(/\/+$/, '');
    this.tenantId = options.tenantId || '';
    this.username = options.username || '';
    this.password = options.password || '';
    this.mode = options.mode || 'mock';
    this.timeout = options.timeout || 30000;
    this.log = options.logger || new Logger('signavio-client', { level: 'warn' });

    this._token = null;
    this._sessionId = null;
    this._authExpiry = 0;
  }

  // ── Authentication ──────────────────────────────────────────────────

  /**
   * Authenticate with the Signavio API.
   * POST /p/login with name=&password=&tokenonly=true
   * Stores the JWT token and JSESSIONID for subsequent requests.
   */
  async authenticate() {
    if (this.mode === 'mock') {
      this._token = 'mock-signavio-jwt-token-' + Date.now();
      this._sessionId = 'mock-jsessionid-' + Date.now();
      this._authExpiry = Date.now() + 30 * 60 * 1000;
      this.log.info('Mock authentication successful');
      return { token: this._token, sessionId: this._sessionId };
    }

    try {
      const response = await this._request('POST', '/p/login', {
        formData: {
          name: this.username,
          password: this.password,
          tokenonly: 'true',
        },
        skipAuth: true,
      });

      this._token = response.body || response;
      if (response.sessionId) {
        this._sessionId = response.sessionId;
      }
      this._authExpiry = Date.now() + 30 * 60 * 1000;
      this.log.info('Signavio authentication successful');
      return { token: this._token, sessionId: this._sessionId };
    } catch (err) {
      if (err instanceof SignavioError) throw err;
      throw new SignavioError(`Authentication failed: ${err.message}`, {
        username: this.username,
        original: err.message,
      });
    }
  }

  // ── Model Operations ────────────────────────────────────────────────

  /**
   * Get a process model by revision ID.
   * GET /p/revision/{revisionId}/json
   * @param {string} revisionId - The revision ID of the model
   * @returns {object} Process model JSON
   */
  async getModel(revisionId) {
    if (!revisionId) {
      throw new SignavioError('revisionId is required', { parameter: 'revisionId' });
    }

    if (this.mode === 'mock') {
      const model = MOCK_MODELS.find(m => m.revisionId === revisionId);
      if (!model) {
        throw new SignavioError(`Model not found for revision: ${revisionId}`, {
          revisionId,
          code: 'NOT_FOUND',
        });
      }
      return { ...MOCK_PROCESS_JSON, modelId: model.id, name: model.name, revision: revisionId };
    }

    const response = await this._request('GET', `/p/revision/${encodeURIComponent(revisionId)}/json`);
    return typeof response === 'string' ? JSON.parse(response) : response;
  }

  /**
   * Get SVG rendering of a process model.
   * GET /p/revision/{revisionId}/svg
   * @param {string} revisionId - The revision ID of the model
   * @returns {string} SVG XML string
   */
  async getModelSvg(revisionId) {
    if (!revisionId) {
      throw new SignavioError('revisionId is required', { parameter: 'revisionId' });
    }

    if (this.mode === 'mock') {
      const model = MOCK_MODELS.find(m => m.revisionId === revisionId);
      if (!model) {
        throw new SignavioError(`Model SVG not found for revision: ${revisionId}`, {
          revisionId,
          code: 'NOT_FOUND',
        });
      }
      return MOCK_SVG;
    }

    return this._request('GET', `/p/revision/${encodeURIComponent(revisionId)}/svg`, {
      accept: 'image/svg+xml',
      raw: true,
    });
  }

  /**
   * List models in a folder.
   * GET /p/directory/{folderId}
   * @param {string} [folderId] - Folder ID (root if not specified)
   * @returns {Array<object>} Array of model objects
   */
  async listModels(folderId) {
    if (this.mode === 'mock') {
      if (folderId) {
        const filtered = MOCK_MODELS.filter(m => m.folderId === folderId);
        return filtered;
      }
      return [...MOCK_MODELS];
    }

    const path = folderId
      ? `/p/directory/${encodeURIComponent(folderId)}`
      : '/p/directory';
    const response = await this._request('GET', path);
    return Array.isArray(response) ? response : (response.models || response.entries || []);
  }

  /**
   * Search for models by query string.
   * GET /p/model?q={query}
   * @param {string} query - Search query
   * @returns {Array<object>} Matching model objects
   */
  async searchModels(query) {
    if (!query) {
      throw new SignavioError('query is required for search', { parameter: 'query' });
    }

    if (this.mode === 'mock') {
      const q = query.toLowerCase();
      return MOCK_MODELS.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    }

    const response = await this._request('GET', `/p/model?q=${encodeURIComponent(query)}`);
    return Array.isArray(response) ? response : (response.models || response.results || []);
  }

  /**
   * Get the process glossary / dictionary.
   * GET /p/glossary
   * @returns {Array<object>} Glossary entries
   */
  async getDictionary() {
    if (this.mode === 'mock') {
      return [...MOCK_GLOSSARY];
    }

    const response = await this._request('GET', '/p/glossary');
    return Array.isArray(response) ? response : (response.entries || []);
  }

  /**
   * Get a single glossary / dictionary entry.
   * GET /p/glossary/{entryId}
   * @param {string} entryId - The glossary entry ID
   * @returns {object} Glossary entry
   */
  async getDictionaryEntry(entryId) {
    if (!entryId) {
      throw new SignavioError('entryId is required', { parameter: 'entryId' });
    }

    if (this.mode === 'mock') {
      const entry = MOCK_GLOSSARY.find(e => e.id === entryId);
      if (!entry) {
        throw new SignavioError(`Glossary entry not found: ${entryId}`, {
          entryId,
          code: 'NOT_FOUND',
        });
      }
      return { ...entry };
    }

    return this._request('GET', `/p/glossary/${encodeURIComponent(entryId)}`);
  }

  /**
   * Get BPMN 2.0 XML for a process model.
   * GET /p/revision/{revisionId}/bpmn2_0_xml
   * @param {string} revisionId - The revision ID
   * @returns {string} BPMN 2.0 XML string
   */
  async getModelBpmn(revisionId) {
    if (!revisionId) {
      throw new SignavioError('revisionId is required', { parameter: 'revisionId' });
    }

    if (this.mode === 'mock') {
      return MOCK_BPMN_XML;
    }

    return this._request('GET', `/p/revision/${encodeURIComponent(revisionId)}/bpmn2_0_xml`, {
      accept: 'application/xml',
      raw: true,
    });
  }

  /**
   * Create a new process model in a folder.
   * POST /p/model
   * @param {string} folderId - Target folder ID
   * @param {string} name - Model name
   * @param {string} [bpmnXml] - Optional BPMN 2.0 XML content
   * @returns {object} Created model object
   */
  async createModel(folderId, name, bpmnXml) {
    if (!folderId) {
      throw new SignavioError('folderId is required', { parameter: 'folderId' });
    }
    if (!name) {
      throw new SignavioError('name is required', { parameter: 'name' });
    }

    if (this.mode === 'mock') {
      const newId = 'model-new-' + Date.now();
      const newRevisionId = 'rev-new-' + Date.now();
      return {
        id: newId,
        name,
        description: '',
        revisionId: newRevisionId,
        folderId,
        lastModified: new Date().toISOString(),
        author: this.username || 'mock-user@example.com',
      };
    }

    const body = { name, folderId };
    if (bpmnXml) {
      body.bpmnXml = bpmnXml;
    }

    return this._request('POST', '/p/model', { body });
  }

  /**
   * Update an existing process model.
   * PUT /p/model/{modelId}
   * @param {string} modelId - The model ID to update
   * @param {string} bpmnXml - Updated BPMN 2.0 XML content
   * @returns {object} Updated model object
   */
  async updateModel(modelId, bpmnXml) {
    if (!modelId) {
      throw new SignavioError('modelId is required', { parameter: 'modelId' });
    }
    if (!bpmnXml) {
      throw new SignavioError('bpmnXml is required', { parameter: 'bpmnXml' });
    }

    if (this.mode === 'mock') {
      const model = MOCK_MODELS.find(m => m.id === modelId);
      return {
        id: modelId,
        name: model ? model.name : 'Updated Model',
        revisionId: 'rev-updated-' + Date.now(),
        lastModified: new Date().toISOString(),
        updated: true,
      };
    }

    return this._request('PUT', `/p/model/${encodeURIComponent(modelId)}`, {
      body: { bpmnXml },
    });
  }

  // ── Internal HTTP Helper ────────────────────────────────────────────

  /**
   * Internal request method handling auth headers, auto-reauth on 401,
   * and error wrapping.
   * @param {string} method - HTTP method
   * @param {string} path - URL path relative to baseUrl
   * @param {object} [options]
   * @returns {*} Parsed response
   */
  async _request(method, path, options = {}) {
    await this._ensureAuth(options.skipAuth);

    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const headers = {};

    if (!options.skipAuth && this._token) {
      headers['x-signavio-id'] = this._token;
    }
    if (!options.skipAuth && this._sessionId) {
      headers['Cookie'] = `JSESSIONID=${this._sessionId}`;
    }
    if (this.tenantId) {
      headers['x-signavio-tenant'] = this.tenantId;
    }

    headers['Accept'] = options.accept || 'application/json';

    let body;
    if (options.formData) {
      const parts = [];
      for (const [key, value] of Object.entries(options.formData)) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
      body = parts.join('&');
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (options.body) {
      body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      headers['Content-Type'] = options.contentType || 'application/json';
    }

    const fetchOptions = {
      method,
      headers,
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = body;
    }

    // Use AbortSignal.timeout if available
    if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
      fetchOptions.signal = AbortSignal.timeout(this.timeout);
    }

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new SignavioError(`Request timed out after ${this.timeout}ms`, {
          url, method, timeout: this.timeout,
        });
      }
      throw new SignavioError(`Network error: ${err.message}`, { url, method });
    }

    // Auto-reauth on 401
    if (response.status === 401 && !options.skipAuth && !options._isRetry) {
      this.log.info('Received 401, attempting re-authentication');
      this._token = null;
      this._sessionId = null;
      this._authExpiry = 0;
      await this.authenticate();
      return this._request(method, path, { ...options, _isRetry: true });
    }

    // Extract session ID from cookies
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const sessionMatch = setCookie.match(/JSESSIONID=([^;]+)/);
      if (sessionMatch) {
        this._sessionId = sessionMatch[1];
      }
    }

    const text = await response.text();

    if (!response.ok) {
      throw new SignavioError(
        `Signavio API error: ${response.status} ${response.statusText}`,
        {
          url,
          method,
          statusCode: response.status,
          body: text.substring(0, 500),
        }
      );
    }

    if (options.raw) {
      return text;
    }

    try {
      const parsed = JSON.parse(text);
      if (setCookie) {
        parsed.sessionId = this._sessionId;
      }
      return parsed;
    } catch {
      return { body: text, sessionId: this._sessionId };
    }
  }

  /**
   * Ensure we have a valid auth token. Auto-authenticates if expired.
   * @param {boolean} skip - Whether to skip auth check
   */
  async _ensureAuth(skip) {
    if (skip) return;
    if (this._token && Date.now() < this._authExpiry) return;

    // Only auto-authenticate if we have credentials
    if (this.username && this.password) {
      await this.authenticate();
    }
  }

  // ── Static Accessors for Mock Data ──────────────────────────────────

  static get MOCK_MODELS() {
    return MOCK_MODELS;
  }

  static get MOCK_GLOSSARY() {
    return MOCK_GLOSSARY;
  }

  static get MOCK_PROCESS_JSON() {
    return MOCK_PROCESS_JSON;
  }

  static get MOCK_BPMN_XML() {
    return MOCK_BPMN_XML;
  }
}

module.exports = SignavioClient;
