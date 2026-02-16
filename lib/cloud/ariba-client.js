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
 * SAP Ariba API Client
 *
 * Provides access to Ariba procurement APIs including purchase orders,
 * requisitions, invoices, contracts, sourcing, and supplier management.
 *
 * Uses OAuth 2.0 client_credentials + apiKey header.
 */

const Logger = require('../logger');
const { AribaError } = require('../errors');

// ── Mock Data ────────────────────────────────────────────────────────

const MOCK_PURCHASE_ORDERS = [
  {
    id: 'PO-2024-001', poNumber: '4500001001', status: 'Ordered',
    vendor: { id: 'SUP001', name: 'Office Supplies Co.' },
    amount: 15750.00, currency: 'USD', createdDate: '2024-08-15',
    items: [
      { lineNumber: 1, description: 'Laptops', quantity: 10, unitPrice: 1200.00, amount: 12000.00 },
      { lineNumber: 2, description: 'Monitors', quantity: 15, unitPrice: 250.00, amount: 3750.00 },
    ],
  },
  {
    id: 'PO-2024-002', poNumber: '4500001002', status: 'Received',
    vendor: { id: 'SUP003', name: 'Tech Hardware Ltd.' },
    amount: 42300.00, currency: 'USD', createdDate: '2024-07-22',
    items: [
      { lineNumber: 1, description: 'Servers', quantity: 3, unitPrice: 12000.00, amount: 36000.00 },
      { lineNumber: 2, description: 'Network switches', quantity: 6, unitPrice: 1050.00, amount: 6300.00 },
    ],
  },
  {
    id: 'PO-2024-003', poNumber: '4500001003', status: 'Draft',
    vendor: { id: 'SUP005', name: 'Furniture Depot' },
    amount: 8900.00, currency: 'EUR', createdDate: '2024-09-10',
    items: [
      { lineNumber: 1, description: 'Standing desks', quantity: 5, unitPrice: 1100.00, amount: 5500.00 },
      { lineNumber: 2, description: 'Ergonomic chairs', quantity: 10, unitPrice: 340.00, amount: 3400.00 },
    ],
  },
  {
    id: 'PO-2024-004', poNumber: '4500001004', status: 'Approved',
    vendor: { id: 'SUP007', name: 'Cloud Services Inc.' },
    amount: 120000.00, currency: 'USD', createdDate: '2024-06-01',
    items: [
      { lineNumber: 1, description: 'Annual cloud subscription', quantity: 1, unitPrice: 120000.00, amount: 120000.00 },
    ],
  },
  {
    id: 'PO-2024-005', poNumber: '4500001005', status: 'Invoiced',
    vendor: { id: 'SUP002', name: 'Global Consulting Group' },
    amount: 75000.00, currency: 'USD', createdDate: '2024-05-15',
    items: [
      { lineNumber: 1, description: 'SAP implementation consulting', quantity: 500, unitPrice: 150.00, amount: 75000.00 },
    ],
  },
];

const MOCK_REQUISITIONS = [
  {
    id: 'REQ-2024-001', requisitionNumber: 'PR0000001', status: 'Approved',
    requester: { id: 'EMP001', name: 'John Doe' },
    approver: { id: 'EMP002', name: 'Alice Smith' },
    amount: 5600.00, currency: 'USD', createdDate: '2024-09-01',
    items: [
      { lineNumber: 1, description: 'Development licenses', quantity: 10, unitPrice: 560.00 },
    ],
  },
  {
    id: 'REQ-2024-002', requisitionNumber: 'PR0000002', status: 'Pending',
    requester: { id: 'EMP003', name: 'Boris Mueller' },
    approver: null,
    amount: 18200.00, currency: 'EUR', createdDate: '2024-09-12',
    items: [
      { lineNumber: 1, description: 'Training program', quantity: 5, unitPrice: 2400.00 },
      { lineNumber: 2, description: 'Certification exams', quantity: 10, unitPrice: 620.00 },
    ],
  },
  {
    id: 'REQ-2024-003', requisitionNumber: 'PR0000003', status: 'Rejected',
    requester: { id: 'EMP004', name: 'Catherine Wilson' },
    approver: { id: 'EMP001', name: 'John Doe' },
    amount: 95000.00, currency: 'USD', createdDate: '2024-08-25',
    items: [
      { lineNumber: 1, description: 'Office renovation', quantity: 1, unitPrice: 95000.00 },
    ],
  },
];

const MOCK_INVOICES = [
  {
    id: 'INV-2024-001', invoiceNumber: 'INV90001', status: 'Pending',
    vendor: { id: 'SUP001', name: 'Office Supplies Co.' },
    purchaseOrder: 'PO-2024-001', amount: 15750.00, currency: 'USD',
    invoiceDate: '2024-09-05', dueDate: '2024-10-05',
  },
  {
    id: 'INV-2024-002', invoiceNumber: 'INV90002', status: 'Approved',
    vendor: { id: 'SUP002', name: 'Global Consulting Group' },
    purchaseOrder: 'PO-2024-005', amount: 37500.00, currency: 'USD',
    invoiceDate: '2024-08-15', dueDate: '2024-09-15',
  },
  {
    id: 'INV-2024-003', invoiceNumber: 'INV90003', status: 'Paid',
    vendor: { id: 'SUP003', name: 'Tech Hardware Ltd.' },
    purchaseOrder: 'PO-2024-002', amount: 42300.00, currency: 'USD',
    invoiceDate: '2024-08-01', dueDate: '2024-09-01',
  },
];

const MOCK_RECEIPTS = [
  {
    id: 'REC-2024-001', receiptNumber: 'GR0001', purchaseOrder: 'PO-2024-002',
    vendor: { id: 'SUP003', name: 'Tech Hardware Ltd.' },
    receivedDate: '2024-08-10', status: 'Complete',
    items: [
      { lineNumber: 1, description: 'Servers', quantityReceived: 3 },
      { lineNumber: 2, description: 'Network switches', quantityReceived: 6 },
    ],
  },
  {
    id: 'REC-2024-002', receiptNumber: 'GR0002', purchaseOrder: 'PO-2024-005',
    vendor: { id: 'SUP002', name: 'Global Consulting Group' },
    receivedDate: '2024-08-20', status: 'Partial',
    items: [
      { lineNumber: 1, description: 'SAP implementation consulting (Phase 1)', quantityReceived: 250 },
    ],
  },
];

const MOCK_SOURCING_PROJECTS = [
  {
    id: 'SP-2024-001', title: 'IT Infrastructure Renewal', status: 'Open',
    category: 'IT Hardware', owner: { id: 'EMP003', name: 'Boris Mueller' },
    startDate: '2024-07-01', endDate: '2024-12-31',
    estimatedValue: 500000.00, currency: 'USD',
    invitedSuppliers: ['SUP003', 'SUP007', 'SUP009'],
  },
  {
    id: 'SP-2024-002', title: 'Office Supplies Annual Agreement', status: 'Awarded',
    category: 'Office Supplies', owner: { id: 'EMP005', name: 'Raj Patel' },
    startDate: '2024-01-15', endDate: '2024-06-30',
    estimatedValue: 200000.00, currency: 'USD',
    invitedSuppliers: ['SUP001', 'SUP004', 'SUP006'],
  },
];

const MOCK_CONTRACTS = [
  {
    id: 'CON-2024-001', contractNumber: 'CW000001', title: 'Cloud Services Master Agreement',
    supplier: { id: 'SUP007', name: 'Cloud Services Inc.' },
    status: 'Active', startDate: '2024-01-01', endDate: '2026-12-31',
    totalValue: 360000.00, currency: 'USD', autoRenew: true,
    terms: { paymentTerms: 'Net 30', warrantyPeriod: '12 months' },
  },
  {
    id: 'CON-2024-002', contractNumber: 'CW000002', title: 'Consulting Framework Agreement',
    supplier: { id: 'SUP002', name: 'Global Consulting Group' },
    status: 'Active', startDate: '2024-03-01', endDate: '2025-02-28',
    totalValue: 150000.00, currency: 'USD', autoRenew: false,
    terms: { paymentTerms: 'Net 45', warrantyPeriod: 'N/A' },
  },
];

const MOCK_SUPPLIERS = [
  { id: 'SUP001', name: 'Office Supplies Co.', category: 'Office Supplies', country: 'US', city: 'Chicago', qualificationStatus: 'Qualified', registrationDate: '2020-03-15' },
  { id: 'SUP002', name: 'Global Consulting Group', category: 'Professional Services', country: 'US', city: 'New York', qualificationStatus: 'Qualified', registrationDate: '2019-08-22' },
  { id: 'SUP003', name: 'Tech Hardware Ltd.', category: 'IT Hardware', country: 'US', city: 'San Jose', qualificationStatus: 'Qualified', registrationDate: '2021-01-10' },
  { id: 'SUP004', name: 'Stationery Plus GmbH', category: 'Office Supplies', country: 'DE', city: 'Munich', qualificationStatus: 'Pending', registrationDate: '2024-02-20' },
  { id: 'SUP005', name: 'Furniture Depot', category: 'Furniture', country: 'US', city: 'Dallas', qualificationStatus: 'Qualified', registrationDate: '2022-05-11' },
  { id: 'SUP006', name: 'PrintWorld India', category: 'Office Supplies', country: 'IN', city: 'Delhi', qualificationStatus: 'Qualified', registrationDate: '2023-07-03' },
  { id: 'SUP007', name: 'Cloud Services Inc.', category: 'IT Services', country: 'US', city: 'Seattle', qualificationStatus: 'Qualified', registrationDate: '2018-11-28' },
  { id: 'SUP008', name: 'Logistics Express', category: 'Logistics', country: 'DE', city: 'Hamburg', qualificationStatus: 'Under Review', registrationDate: '2024-06-01' },
  { id: 'SUP009', name: 'DataCenter Solutions', category: 'IT Hardware', country: 'US', city: 'Austin', qualificationStatus: 'Qualified', registrationDate: '2020-09-14' },
  { id: 'SUP010', name: 'Green Energy Corp', category: 'Utilities', country: 'US', city: 'Portland', qualificationStatus: 'Pending', registrationDate: '2024-08-10' },
];

// ── AribaClient ──────────────────────────────────────────────────────

class AribaClient {
  /**
   * @param {object} options
   * @param {string} options.baseUrl - Ariba API base URL
   * @param {string} options.realm - Ariba realm
   * @param {string} [options.clientId] - OAuth client ID
   * @param {string} [options.clientSecret] - OAuth client secret
   * @param {string} [options.apiKey] - Ariba API key
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   */
  constructor(options = {}) {
    if (!options.realm && options.mode === 'live') {
      throw new AribaError('realm is required', { field: 'realm' });
    }

    this.baseUrl = (options.baseUrl || 'https://mock-ariba-api.ariba.com').replace(/\/+$/, '');
    this.realm = options.realm || 'MOCK_REALM';
    this.clientId = options.clientId || null;
    this.clientSecret = options.clientSecret || null;
    this.apiKey = options.apiKey || null;
    this.mode = options.mode || 'mock';

    this._authenticated = false;
    this._accessToken = null;
    this._tokenExpiry = 0;
    this._requestCount = 0;

    this.log = new Logger('ariba-client');
    this.log.info(`Ariba client initialized in ${this.mode} mode`, { realm: this.realm });
  }

  /**
   * Authenticate via OAuth 2.0 client_credentials
   */
  async authenticate() {
    this.log.info('Authenticating to Ariba');

    if (this.mode === 'mock') {
      this._authenticated = true;
      this._accessToken = 'mock-ariba-token-' + Date.now();
      this._tokenExpiry = Date.now() + 3600000;
      this.log.info('Mock authentication successful');
      return { authenticated: true, mode: 'mock', realm: this.realm };
    }

    try {
      const tokenUrl = `${this.baseUrl}/oauth/token`;
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
        },
        body: params.toString(),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new AribaError(`OAuth token request failed: ${response.status}`, { status: response.status });
      }

      const tokenData = await response.json();
      this._accessToken = tokenData.access_token;
      this._tokenExpiry = Date.now() + (tokenData.expires_in || 3600) * 1000;
      this._authenticated = true;
      return { authenticated: true, mode: 'live', realm: this.realm };
    } catch (err) {
      if (err instanceof AribaError) throw err;
      throw new AribaError(`Authentication failed: ${err.message}`, { cause: err.message });
    }
  }

  /**
   * Get purchase requisitions
   */
  async getRequisitions(params = {}) {
    this._ensureAuthenticated();
    this._trackRequest();
    this.log.debug('GET requisitions', params);

    if (this.mode === 'mock') {
      return this._paginate(MOCK_REQUISITIONS, params);
    }

    return this._liveRequest('GET', '/api/procurement/requisitions', params);
  }

  /**
   * Get purchase orders
   */
  async getPurchaseOrders(params = {}) {
    this._ensureAuthenticated();
    this._trackRequest();
    this.log.debug('GET purchase orders', params);

    if (this.mode === 'mock') {
      return this._paginate(MOCK_PURCHASE_ORDERS, params);
    }

    return this._liveRequest('GET', '/api/procurement/purchaseOrders', params);
  }

  /**
   * Get invoices
   */
  async getInvoices(params = {}) {
    this._ensureAuthenticated();
    this._trackRequest();
    this.log.debug('GET invoices', params);

    if (this.mode === 'mock') {
      return this._paginate(MOCK_INVOICES, params);
    }

    return this._liveRequest('GET', '/api/procurement/invoices', params);
  }

  /**
   * Get receipts (goods receipts)
   */
  async getReceipts(params = {}) {
    this._ensureAuthenticated();
    this._trackRequest();
    this.log.debug('GET receipts', params);

    if (this.mode === 'mock') {
      return this._paginate(MOCK_RECEIPTS, params);
    }

    return this._liveRequest('GET', '/api/procurement/receipts', params);
  }

  /**
   * Get sourcing projects
   */
  async getSourcingProjects(params = {}) {
    this._ensureAuthenticated();
    this._trackRequest();
    this.log.debug('GET sourcing projects', params);

    if (this.mode === 'mock') {
      return this._paginate(MOCK_SOURCING_PROJECTS, params);
    }

    return this._liveRequest('GET', '/api/sourcing/projects', params);
  }

  /**
   * Get contracts
   */
  async getContracts(params = {}) {
    this._ensureAuthenticated();
    this._trackRequest();
    this.log.debug('GET contracts', params);

    if (this.mode === 'mock') {
      return this._paginate(MOCK_CONTRACTS, params);
    }

    return this._liveRequest('GET', '/api/contracts/workspaces', params);
  }

  /**
   * Get suppliers
   */
  async getSuppliers(params = {}) {
    this._ensureAuthenticated();
    this._trackRequest();
    this.log.debug('GET suppliers', params);

    if (this.mode === 'mock') {
      let data = [...MOCK_SUPPLIERS];
      if (params.search) {
        const term = params.search.toLowerCase();
        data = data.filter((s) =>
          s.name.toLowerCase().includes(term) ||
          s.category.toLowerCase().includes(term) ||
          s.country.toLowerCase().includes(term)
        );
      }
      return this._paginate(data, params);
    }

    return this._liveRequest('GET', '/api/suppliers', params);
  }

  /**
   * Get operational/analytical report
   * @param {string} viewId - Report view ID
   * @param {object} [filters] - Report filters
   */
  async getReport(viewId, filters = {}) {
    this._ensureAuthenticated();
    this._trackRequest();
    this.log.debug(`GET report ${viewId}`, filters);

    if (this.mode === 'mock') {
      return {
        viewId,
        filters,
        generatedAt: new Date().toISOString(),
        records: [
          { category: 'IT Hardware', totalSpend: 542300.00, poCount: 12, supplierCount: 3 },
          { category: 'Professional Services', totalSpend: 225000.00, poCount: 5, supplierCount: 2 },
          { category: 'Office Supplies', totalSpend: 87500.00, poCount: 22, supplierCount: 4 },
        ],
        summary: { totalRecords: 3, totalSpend: 854800.00 },
      };
    }

    return this._liveRequest('GET', `/api/analytics/reports/${viewId}`, filters);
  }

  /**
   * Create (onboard) a new supplier
   * @param {object} data - Supplier data
   */
  async createSupplier(data) {
    this._ensureAuthenticated();
    this._trackRequest();

    if (!data || !data.name) {
      throw new AribaError('Supplier name is required', { field: 'name' });
    }

    this.log.debug('POST supplier', { name: data.name });

    if (this.mode === 'mock') {
      const newSupplier = {
        id: 'SUP' + String(MOCK_SUPPLIERS.length + 1).padStart(3, '0'),
        qualificationStatus: 'Pending',
        registrationDate: new Date().toISOString().split('T')[0],
        ...data,
      };
      return { data: newSupplier, status: 'created' };
    }

    return this._liveRequest('POST', '/api/suppliers', {}, data);
  }

  /**
   * Approve or reject a procurement document
   * @param {string} docType - 'requisition' | 'invoice' | 'purchaseOrder'
   * @param {string} docId - Document ID
   * @param {string} action - 'approve' | 'reject'
   */
  async approveDocument(docType, docId, action) {
    this._ensureAuthenticated();
    this._trackRequest();

    const validTypes = ['requisition', 'invoice', 'purchaseOrder'];
    if (!validTypes.includes(docType)) {
      throw new AribaError(`Invalid document type: ${docType}. Must be one of: ${validTypes.join(', ')}`, { docType });
    }

    const validActions = ['approve', 'reject'];
    if (!validActions.includes(action)) {
      throw new AribaError(`Invalid action: ${action}. Must be one of: ${validActions.join(', ')}`, { action });
    }

    this.log.debug(`${action} ${docType} ${docId}`);

    if (this.mode === 'mock') {
      const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
      return {
        docType,
        docId,
        action,
        previousStatus: 'Pending',
        newStatus,
        timestamp: new Date().toISOString(),
      };
    }

    return this._liveRequest('POST', `/api/procurement/${docType}s/${docId}/${action}`);
  }

  // ── Private helpers ────────────────────────────────────────────────

  _ensureAuthenticated() {
    if (!this._authenticated) {
      throw new AribaError('Not authenticated. Call authenticate() first.');
    }
  }

  _trackRequest() {
    this._requestCount++;
    this.log.debug(`Request count: ${this._requestCount}`);
  }

  getRequestCount() {
    return this._requestCount;
  }

  _paginate(data, params) {
    const skip = Number(params.$skip || params.skip || 0);
    const top = Number(params.$top || params.top || 0);
    const total = data.length;

    let results = data.slice(skip);
    if (top > 0) {
      results = results.slice(0, top);
    }

    return {
      results,
      totalCount: total,
      offset: skip,
      limit: top || total,
    };
  }

  async _liveRequest(method, path, params = {}, body = null) {
    const url = new URL(this.baseUrl + path);
    url.searchParams.set('realm', this.realm);

    for (const [k, v] of Object.entries(params)) {
      if (k !== 'search') {
        url.searchParams.set(k, v);
      }
    }

    const headers = {
      'Authorization': `Bearer ${this._accessToken}`,
      'apiKey': this.apiKey,
      'Accept': 'application/json',
    };

    const fetchOptions = {
      method,
      headers,
      signal: AbortSignal.timeout(30000),
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new AribaError(`Request failed: ${response.status} ${response.statusText}`, {
        status: response.status,
        url: url.toString(),
        body: errorText,
      });
    }

    if (response.status === 204) return null;

    return response.json();
  }
}

module.exports = AribaClient;
