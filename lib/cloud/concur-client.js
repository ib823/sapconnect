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
 * SAP Concur REST V4 + SCIM 2.0 Client
 *
 * Provides access to Concur Expense, Travel Request, User (SCIM),
 * and List management APIs.
 *
 * Uses OAuth 2.0 client_credentials with company JWT.
 */

const Logger = require('../logger');
const { ConcurError } = require('../errors');

// ── Helper: generate UUID-style IDs ──────────────────────────────────

let _uuidCounter = 0;
function _uuid(prefix) {
  _uuidCounter++;
  const hex = _uuidCounter.toString(16).padStart(4, '0');
  return `${prefix || 'a'}0e${hex}f1-2b3c-4d5e-8f6a-7b8c9d0e1f2${hex.slice(-1)}`;
}

// ── Mock Data ────────────────────────────────────────────────────────

const MOCK_EXPENSE_REPORTS = [
  {
    id: 'a0e0001-2b3c-4d5e-8f6a-7b8c9d0e1f20',
    name: 'Q3 Client Meetings',
    purpose: 'Client engagement travel and meals',
    status: 'SUBMITTED', currency: 'USD', total: 3245.80,
    owner: { id: 'a0e1001-2b3c-4d5e-8f6a-7b8c9d0e1f20', name: 'John Doe' },
    createdDate: '2024-09-01', submitDate: '2024-09-05',
    entries: [
      { id: 'e001', expenseType: 'Airfare', amount: 1250.00, currency: 'USD', date: '2024-08-28', vendor: 'Delta Airlines', description: 'NYC to Chicago roundtrip' },
      { id: 'e002', expenseType: 'Hotel', amount: 1495.80, currency: 'USD', date: '2024-08-28', vendor: 'Hilton Chicago', description: '3 nights' },
      { id: 'e003', expenseType: 'Meals', amount: 500.00, currency: 'USD', date: '2024-08-29', vendor: 'Various', description: 'Client dinner and working lunches' },
    ],
  },
  {
    id: 'a0e0002-2b3c-4d5e-8f6a-7b8c9d0e1f20',
    name: 'Berlin Office Visit',
    purpose: 'Engineering team onsite collaboration',
    status: 'APPROVED', currency: 'EUR', total: 4820.50,
    owner: { id: 'a0e1003-2b3c-4d5e-8f6a-7b8c9d0e1f20', name: 'Boris Mueller' },
    createdDate: '2024-08-20', submitDate: '2024-08-22',
    entries: [
      { id: 'e004', expenseType: 'Airfare', amount: 1800.00, currency: 'EUR', date: '2024-08-15', vendor: 'Lufthansa', description: 'SFO to Berlin roundtrip' },
      { id: 'e005', expenseType: 'Hotel', amount: 2200.50, currency: 'EUR', date: '2024-08-15', vendor: 'Adlon Kempinski', description: '5 nights' },
      { id: 'e006', expenseType: 'Ground Transport', amount: 820.00, currency: 'EUR', date: '2024-08-16', vendor: 'Sixt', description: 'Car rental 5 days' },
    ],
  },
  {
    id: 'a0e0003-2b3c-4d5e-8f6a-7b8c9d0e1f20',
    name: 'September Office Supplies',
    purpose: 'Monthly office supply reimbursement',
    status: 'PAID', currency: 'USD', total: 342.15,
    owner: { id: 'a0e1005-2b3c-4d5e-8f6a-7b8c9d0e1f20', name: 'Raj Patel' },
    createdDate: '2024-09-10', submitDate: '2024-09-10',
    entries: [
      { id: 'e007', expenseType: 'Office Supplies', amount: 342.15, currency: 'USD', date: '2024-09-08', vendor: 'Amazon', description: 'Keyboards, cables, pens' },
    ],
  },
  {
    id: 'a0e0004-2b3c-4d5e-8f6a-7b8c9d0e1f20',
    name: 'Annual Conference',
    purpose: 'SAP TechEd attendance',
    status: 'DRAFT', currency: 'USD', total: 5100.00,
    owner: { id: 'a0e1004-2b3c-4d5e-8f6a-7b8c9d0e1f20', name: 'Catherine Wilson' },
    createdDate: '2024-09-15', submitDate: null,
    entries: [
      { id: 'e008', expenseType: 'Conference Fee', amount: 2500.00, currency: 'USD', date: '2024-10-15', vendor: 'SAP', description: 'TechEd registration' },
      { id: 'e009', expenseType: 'Airfare', amount: 1600.00, currency: 'USD', date: '2024-10-14', vendor: 'United Airlines', description: 'SF to Las Vegas roundtrip' },
      { id: 'e010', expenseType: 'Hotel', amount: 1000.00, currency: 'USD', date: '2024-10-14', vendor: 'Venetian', description: '3 nights' },
    ],
  },
  {
    id: 'a0e0005-2b3c-4d5e-8f6a-7b8c9d0e1f20',
    name: 'Training Materials',
    purpose: 'Team skill development books and courses',
    status: 'RECALLED', currency: 'INR', total: 45000.00,
    owner: { id: 'a0e1005-2b3c-4d5e-8f6a-7b8c9d0e1f20', name: 'Raj Patel' },
    createdDate: '2024-09-12', submitDate: '2024-09-12',
    entries: [
      { id: 'e011', expenseType: 'Training', amount: 35000.00, currency: 'INR', date: '2024-09-10', vendor: 'Udemy Business', description: 'Annual team subscription' },
      { id: 'e012', expenseType: 'Books', amount: 10000.00, currency: 'INR', date: '2024-09-10', vendor: 'Amazon India', description: 'Technical reference books' },
    ],
  },
];

const MOCK_TRAVEL_REQUESTS = [
  {
    id: 'a0e2001-2b3c-4d5e-8f6a-7b8c9d0e1f20',
    name: 'Customer Visit - Chicago',
    purpose: 'Quarterly business review with ACME client',
    status: 'APPROVED', estimatedCost: 4500.00, currency: 'USD',
    traveler: { id: 'a0e1001-2b3c-4d5e-8f6a-7b8c9d0e1f20', name: 'John Doe' },
    startDate: '2024-10-01', endDate: '2024-10-03', destination: 'Chicago, IL',
    createdDate: '2024-09-15',
  },
  {
    id: 'a0e2002-2b3c-4d5e-8f6a-7b8c9d0e1f20',
    name: 'Engineering Summit - Berlin',
    purpose: 'Annual engineering team summit',
    status: 'PENDING', estimatedCost: 8200.00, currency: 'EUR',
    traveler: { id: 'a0e1003-2b3c-4d5e-8f6a-7b8c9d0e1f20', name: 'Boris Mueller' },
    startDate: '2024-11-10', endDate: '2024-11-15', destination: 'Berlin, Germany',
    createdDate: '2024-09-18',
  },
  {
    id: 'a0e2003-2b3c-4d5e-8f6a-7b8c9d0e1f20',
    name: 'Sales Kickoff - Las Vegas',
    purpose: 'Annual sales team kickoff event',
    status: 'REJECTED', estimatedCost: 6800.00, currency: 'USD',
    traveler: { id: 'a0e1004-2b3c-4d5e-8f6a-7b8c9d0e1f20', name: 'Catherine Wilson' },
    startDate: '2024-12-05', endDate: '2024-12-08', destination: 'Las Vegas, NV',
    createdDate: '2024-09-20',
  },
];

const MOCK_USERS = [
  { id: 'a0e1001-2b3c-4d5e-8f6a-7b8c9d0e1f20', schemas: ['urn:ietf:params:scim:schemas:core:2.0:User', 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'], userName: 'jdoe@acme.com', name: { givenName: 'John', familyName: 'Doe' }, emails: [{ value: 'john.doe@acme.com', type: 'work', primary: true }], active: true, employeeNumber: 'EMP001' },
  { id: 'a0e1002-2b3c-4d5e-8f6a-7b8c9d0e1f20', schemas: ['urn:ietf:params:scim:schemas:core:2.0:User', 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'], userName: 'asmith@acme.com', name: { givenName: 'Alice', familyName: 'Smith' }, emails: [{ value: 'alice.smith@acme.com', type: 'work', primary: true }], active: true, employeeNumber: 'EMP002' },
  { id: 'a0e1003-2b3c-4d5e-8f6a-7b8c9d0e1f20', schemas: ['urn:ietf:params:scim:schemas:core:2.0:User', 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'], userName: 'bmueller@global-inc.com', name: { givenName: 'Boris', familyName: 'Mueller' }, emails: [{ value: 'boris.mueller@global-inc.com', type: 'work', primary: true }], active: true, employeeNumber: 'EMP003' },
  { id: 'a0e1004-2b3c-4d5e-8f6a-7b8c9d0e1f20', schemas: ['urn:ietf:params:scim:schemas:core:2.0:User', 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'], userName: 'cwilson@global-inc.com', name: { givenName: 'Catherine', familyName: 'Wilson' }, emails: [{ value: 'catherine.wilson@global-inc.com', type: 'work', primary: true }], active: true, employeeNumber: 'EMP004' },
  { id: 'a0e1005-2b3c-4d5e-8f6a-7b8c9d0e1f20', schemas: ['urn:ietf:params:scim:schemas:core:2.0:User', 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'], userName: 'rpatel@techsolutions.in', name: { givenName: 'Raj', familyName: 'Patel' }, emails: [{ value: 'raj.patel@techsolutions.in', type: 'work', primary: true }], active: true, employeeNumber: 'EMP005' },
  { id: 'a0e1006-2b3c-4d5e-8f6a-7b8c9d0e1f20', schemas: ['urn:ietf:params:scim:schemas:core:2.0:User', 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'], userName: 'mchen@acme.com', name: { givenName: 'Ming', familyName: 'Chen' }, emails: [{ value: 'ming.chen@acme.com', type: 'work', primary: true }], active: true, employeeNumber: 'EMP006' },
  { id: 'a0e1007-2b3c-4d5e-8f6a-7b8c9d0e1f20', schemas: ['urn:ietf:params:scim:schemas:core:2.0:User', 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'], userName: 'lgarcia@global-inc.com', name: { givenName: 'Laura', familyName: 'Garcia' }, emails: [{ value: 'laura.garcia@global-inc.com', type: 'work', primary: true }], active: true, employeeNumber: 'EMP007' },
  { id: 'a0e1008-2b3c-4d5e-8f6a-7b8c9d0e1f20', schemas: ['urn:ietf:params:scim:schemas:core:2.0:User', 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'], userName: 'tkumar@techsolutions.in', name: { givenName: 'Tara', familyName: 'Kumar' }, emails: [{ value: 'tara.kumar@techsolutions.in', type: 'work', primary: true }], active: true, employeeNumber: 'EMP008' },
  { id: 'a0e1009-2b3c-4d5e-8f6a-7b8c9d0e1f20', schemas: ['urn:ietf:params:scim:schemas:core:2.0:User', 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'], userName: 'dkim@acme.com', name: { givenName: 'David', familyName: 'Kim' }, emails: [{ value: 'david.kim@acme.com', type: 'work', primary: true }], active: false, employeeNumber: 'EMP009' },
  { id: 'a0e1010-2b3c-4d5e-8f6a-7b8c9d0e1f20', schemas: ['urn:ietf:params:scim:schemas:core:2.0:User', 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'], userName: 'sjohnson@global-inc.com', name: { givenName: 'Sarah', familyName: 'Johnson' }, emails: [{ value: 'sarah.johnson@global-inc.com', type: 'work', primary: true }], active: true, employeeNumber: 'EMP010' },
];

const MOCK_LISTS = [
  {
    id: 'a0e3001-2b3c-4d5e-8f6a-7b8c9d0e1f20',
    name: 'Expense Type',
    category: 'ExpenseType',
    items: [
      { id: 'li001', code: 'AIRFARE', value: 'Airfare', isActive: true },
      { id: 'li002', code: 'HOTEL', value: 'Hotel', isActive: true },
      { id: 'li003', code: 'MEALS', value: 'Meals & Entertainment', isActive: true },
      { id: 'li004', code: 'GROUND', value: 'Ground Transportation', isActive: true },
      { id: 'li005', code: 'CONF', value: 'Conference & Training', isActive: true },
      { id: 'li006', code: 'OFFICE', value: 'Office Supplies', isActive: true },
    ],
  },
  {
    id: 'a0e3002-2b3c-4d5e-8f6a-7b8c9d0e1f20',
    name: 'Department',
    category: 'Department',
    items: [
      { id: 'li007', code: 'HR', value: 'Human Resources', isActive: true },
      { id: 'li008', code: 'FIN', value: 'Finance', isActive: true },
      { id: 'li009', code: 'IT', value: 'Information Technology', isActive: true },
      { id: 'li010', code: 'SALES', value: 'Sales', isActive: true },
    ],
  },
  {
    id: 'a0e3003-2b3c-4d5e-8f6a-7b8c9d0e1f20',
    name: 'Cost Center',
    category: 'CostCenter',
    items: [
      { id: 'li011', code: 'CC1000', value: 'Corporate', isActive: true },
      { id: 'li012', code: 'CC2000', value: 'Engineering', isActive: true },
      { id: 'li013', code: 'CC3000', value: 'Sales & Marketing', isActive: true },
      { id: 'li014', code: 'CC4000', value: 'Research', isActive: true },
    ],
  },
];

// ── ConcurClient ─────────────────────────────────────────────────────

class ConcurClient {
  /**
   * @param {object} options
   * @param {string} options.baseUrl - Concur API base URL
   * @param {string} options.clientId - OAuth client ID
   * @param {string} options.clientSecret - OAuth client secret
   * @param {string} options.companyId - Concur company UUID
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   */
  constructor(options = {}) {
    if (!options.companyId && options.mode === 'live') {
      throw new ConcurError('companyId is required', { field: 'companyId' });
    }

    this.baseUrl = (options.baseUrl || 'https://mock-concur-api.concursolutions.com').replace(/\/+$/, '');
    this.clientId = options.clientId || null;
    this.clientSecret = options.clientSecret || null;
    this.companyId = options.companyId || 'a0e9999-mock-company-uuid';
    this.mode = options.mode || 'mock';

    this._authenticated = false;
    this._accessToken = null;
    this._tokenExpiry = 0;

    // Deep-copy mock data so mutations don't leak between instances
    this._mockUsers = JSON.parse(JSON.stringify(MOCK_USERS));
    this._mockReports = JSON.parse(JSON.stringify(MOCK_EXPENSE_REPORTS));
    this._mockTravelRequests = JSON.parse(JSON.stringify(MOCK_TRAVEL_REQUESTS));
    this._mockLists = JSON.parse(JSON.stringify(MOCK_LISTS));

    this.log = new Logger('concur-client');
    this.log.info(`Concur client initialized in ${this.mode} mode`, { companyId: this.companyId });
  }

  /**
   * Authenticate via OAuth 2.0 client_credentials with company JWT
   */
  async authenticate() {
    this.log.info('Authenticating to Concur');

    if (this.mode === 'mock') {
      this._authenticated = true;
      this._accessToken = 'mock-concur-token-' + Date.now();
      this._tokenExpiry = Date.now() + 3600000;
      this.log.info('Mock authentication successful');
      return { authenticated: true, mode: 'mock' };
    }

    try {
      const tokenUrl = `${this.baseUrl}/oauth2/v0/token`;
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new ConcurError(`OAuth token request failed: ${response.status}`, { status: response.status });
      }

      const tokenData = await response.json();
      this._accessToken = tokenData.access_token;
      this._tokenExpiry = Date.now() + (tokenData.expires_in || 3600) * 1000;
      this._authenticated = true;
      return { authenticated: true, mode: 'live' };
    } catch (err) {
      if (err instanceof ConcurError) throw err;
      throw new ConcurError(`Authentication failed: ${err.message}`, { cause: err.message });
    }
  }

  // ── Expense Reports ────────────────────────────────────────────────

  /**
   * Get expense reports
   */
  async getExpenseReports(params = {}) {
    this._ensureAuthenticated();
    this.log.debug('GET expense reports', params);

    if (this.mode === 'mock') {
      return this._paginate(this._mockReports.map(({ entries, ...r }) => r), params);
    }

    return this._liveRequest('GET', '/expensereports/v4/reports', params);
  }

  /**
   * Get a single expense report with entries
   */
  async getExpenseReport(reportId) {
    this._ensureAuthenticated();
    this.log.debug(`GET expense report ${reportId}`);

    if (this.mode === 'mock') {
      const report = this._mockReports.find((r) => r.id === reportId);
      if (!report) {
        throw new ConcurError(`Expense report not found: ${reportId}`, { reportId, statusCode: 404 });
      }
      return report;
    }

    return this._liveRequest('GET', `/expensereports/v4/reports/${reportId}`);
  }

  /**
   * Get expense entries for a report
   */
  async getExpenseEntries(reportId) {
    this._ensureAuthenticated();
    this.log.debug(`GET expense entries for report ${reportId}`);

    if (this.mode === 'mock') {
      const report = this._mockReports.find((r) => r.id === reportId);
      if (!report) {
        throw new ConcurError(`Expense report not found: ${reportId}`, { reportId, statusCode: 404 });
      }
      return { entries: report.entries || [] };
    }

    return this._liveRequest('GET', `/expensereports/v4/reports/${reportId}/entries`);
  }

  /**
   * Create a new expense report
   * @param {object} data - { name, purpose, currency, entries? }
   */
  async createExpenseReport(data) {
    this._ensureAuthenticated();

    if (!data || !data.name) {
      throw new ConcurError('Report name is required', { field: 'name' });
    }

    this.log.debug('POST expense report', { name: data.name });

    if (this.mode === 'mock') {
      const newReport = {
        id: _uuid('r'),
        name: data.name,
        purpose: data.purpose || '',
        status: 'DRAFT',
        currency: data.currency || 'USD',
        total: (data.entries || []).reduce((sum, e) => sum + (e.amount || 0), 0),
        owner: { id: this._mockUsers[0].id, name: `${this._mockUsers[0].name.givenName} ${this._mockUsers[0].name.familyName}` },
        createdDate: new Date().toISOString().split('T')[0],
        submitDate: null,
        entries: data.entries || [],
      };
      this._mockReports.push(newReport);
      return newReport;
    }

    return this._liveRequest('POST', '/expensereports/v4/reports', {}, data);
  }

  // ── Travel Requests ────────────────────────────────────────────────

  /**
   * Get travel requests
   */
  async getTravelRequests(params = {}) {
    this._ensureAuthenticated();
    this.log.debug('GET travel requests', params);

    if (this.mode === 'mock') {
      return this._paginate(this._mockTravelRequests, params);
    }

    return this._liveRequest('GET', '/travelrequest/v4/requests', params);
  }

  /**
   * Get single travel request
   */
  async getTravelRequest(requestId) {
    this._ensureAuthenticated();
    this.log.debug(`GET travel request ${requestId}`);

    if (this.mode === 'mock') {
      const request = this._mockTravelRequests.find((r) => r.id === requestId);
      if (!request) {
        throw new ConcurError(`Travel request not found: ${requestId}`, { requestId, statusCode: 404 });
      }
      return request;
    }

    return this._liveRequest('GET', `/travelrequest/v4/requests/${requestId}`);
  }

  // ── SCIM 2.0 Users ────────────────────────────────────────────────

  /**
   * Get users (SCIM 2.0)
   */
  async getUsers(params = {}) {
    this._ensureAuthenticated();
    this.log.debug('GET users (SCIM)', params);

    if (this.mode === 'mock') {
      return this._paginate(this._mockUsers, params);
    }

    return this._liveRequest('GET', '/Users', params);
  }

  /**
   * Create a user (SCIM 2.0 provisioning)
   * @param {object} data - SCIM user resource
   */
  async createUser(data) {
    this._ensureAuthenticated();

    if (!data || !data.userName) {
      throw new ConcurError('userName is required for user creation', { field: 'userName' });
    }

    this.log.debug('POST user (SCIM)', { userName: data.userName });

    if (this.mode === 'mock') {
      const newUser = {
        id: _uuid('u'),
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User', 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'],
        userName: data.userName,
        name: data.name || { givenName: 'New', familyName: 'User' },
        emails: data.emails || [{ value: data.userName, type: 'work', primary: true }],
        active: data.active !== undefined ? data.active : true,
        employeeNumber: data.employeeNumber || 'NEW' + Date.now(),
      };
      this._mockUsers.push(newUser);
      return newUser;
    }

    return this._liveRequest('POST', '/Users', {}, data);
  }

  /**
   * Update a user (SCIM PATCH)
   * @param {string} userId - User UUID
   * @param {object} data - Fields to update
   */
  async updateUser(userId, data) {
    this._ensureAuthenticated();
    this.log.debug(`PATCH user ${userId}`, { fields: Object.keys(data) });

    if (this.mode === 'mock') {
      const user = this._mockUsers.find((u) => u.id === userId);
      if (!user) {
        throw new ConcurError(`User not found: ${userId}`, { userId, statusCode: 404 });
      }

      // Apply SCIM-style partial update
      if (data.name) user.name = { ...user.name, ...data.name };
      if (data.emails) user.emails = data.emails;
      if (data.active !== undefined) user.active = data.active;
      if (data.userName) user.userName = data.userName;

      return user;
    }

    return this._liveRequest('PATCH', `/Users/${userId}`, {}, data);
  }

  /**
   * Deactivate a user
   * @param {string} userId - User UUID
   */
  async deactivateUser(userId) {
    this._ensureAuthenticated();
    this.log.debug(`Deactivate user ${userId}`);

    return this.updateUser(userId, { active: false });
  }

  // ── List Management ────────────────────────────────────────────────

  /**
   * Get all lists
   */
  async getLists() {
    this._ensureAuthenticated();
    this.log.debug('GET lists');

    if (this.mode === 'mock') {
      return { lists: this._mockLists.map(({ items, ...l }) => l) };
    }

    return this._liveRequest('GET', '/list/v4/lists');
  }

  /**
   * Get items for a list
   * @param {string} listId - List UUID
   */
  async getListItems(listId) {
    this._ensureAuthenticated();
    this.log.debug(`GET list items for ${listId}`);

    if (this.mode === 'mock') {
      const list = this._mockLists.find((l) => l.id === listId);
      if (!list) {
        throw new ConcurError(`List not found: ${listId}`, { listId, statusCode: 404 });
      }
      return { listId, items: list.items };
    }

    return this._liveRequest('GET', `/list/v4/lists/${listId}/items`);
  }

  /**
   * Create a new list item
   * @param {string} listId
   * @param {object} data - { code, value }
   */
  async createListItem(listId, data) {
    this._ensureAuthenticated();

    if (!data || !data.code || !data.value) {
      throw new ConcurError('List item code and value are required', { fields: ['code', 'value'] });
    }

    this.log.debug(`POST list item to ${listId}`, { code: data.code });

    if (this.mode === 'mock') {
      const list = this._mockLists.find((l) => l.id === listId);
      if (!list) {
        throw new ConcurError(`List not found: ${listId}`, { listId, statusCode: 404 });
      }
      const newItem = {
        id: 'li' + String(list.items.length + 100).padStart(3, '0'),
        code: data.code,
        value: data.value,
        isActive: true,
      };
      list.items.push(newItem);
      return newItem;
    }

    return this._liveRequest('POST', `/list/v4/lists/${listId}/items`, {}, data);
  }

  // ── Private helpers ────────────────────────────────────────────────

  _ensureAuthenticated() {
    if (!this._authenticated) {
      throw new ConcurError('Not authenticated. Call authenticate() first.');
    }
  }

  _paginate(data, params) {
    const offset = Number(params.offset || 0);
    const limit = Number(params.limit || 25);
    const total = data.length;

    const results = data.slice(offset, offset + limit);

    return {
      items: results,
      totalCount: total,
      offset,
      limit,
      hasMore: offset + limit < total,
    };
  }

  async _liveRequest(method, path, params = {}, body = null) {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const headers = {
      'Authorization': `Bearer ${this._accessToken}`,
      'Accept': 'application/json',
      'concur-correlationid': 'req-' + Date.now(),
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
      throw new ConcurError(`Request failed: ${response.status} ${response.statusText}`, {
        status: response.status,
        url: url.toString(),
        body: errorText,
      });
    }

    if (response.status === 204) return null;

    return response.json();
  }
}

module.exports = ConcurClient;
