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
 * SAP Analytics Cloud (SAC) REST API Client
 *
 * Provides access to SAC models, stories, data import/export,
 * dimensions, master data, and planning version management.
 *
 * Uses OAuth 2.0 (SAML bearer or client_credentials).
 */

const Logger = require('../logger');
const { SACError } = require('../errors');

// ── Mock Data ────────────────────────────────────────────────────────

const MOCK_MODELS = [
  {
    id: 'MDL_FIN_001',
    name: 'Financial Planning',
    description: 'Corporate financial planning and analysis model',
    category: 'Planning',
    createdDate: '2023-01-15',
    lastModified: '2024-09-01',
    dimensions: [
      { id: 'DIM_COMPANY', name: 'Company', type: 'Generic', memberCount: 3 },
      { id: 'DIM_REGION', name: 'Region', type: 'Generic', memberCount: 4 },
      { id: 'DIM_PRODUCT', name: 'Product', type: 'Generic', memberCount: 5 },
      { id: 'DIM_TIME', name: 'Time', type: 'Time', memberCount: 12 },
      { id: 'DIM_ACCOUNT_FIN', name: 'Account', type: 'Account', memberCount: 6 },
    ],
    measures: [
      { id: 'MSR_REVENUE', name: 'Revenue', type: 'Amount', currency: 'USD' },
      { id: 'MSR_COST', name: 'Cost', type: 'Amount', currency: 'USD' },
      { id: 'MSR_PROFIT', name: 'Profit', type: 'Amount', currency: 'USD' },
      { id: 'MSR_MARGIN', name: 'Margin %', type: 'Percentage' },
    ],
  },
  {
    id: 'MDL_HR_001',
    name: 'HR Analytics',
    description: 'Workforce analytics and headcount tracking model',
    category: 'Analytics',
    createdDate: '2023-03-20',
    lastModified: '2024-08-15',
    dimensions: [
      { id: 'DIM_DEPARTMENT', name: 'Department', type: 'Generic', memberCount: 5 },
      { id: 'DIM_LOCATION', name: 'Location', type: 'Generic', memberCount: 4 },
      { id: 'DIM_TIME_HR', name: 'Time', type: 'Time', memberCount: 12 },
      { id: 'DIM_ACCOUNT_HR', name: 'Account', type: 'Account', memberCount: 4 },
    ],
    measures: [
      { id: 'MSR_HEADCOUNT', name: 'Headcount', type: 'Count' },
      { id: 'MSR_TURNOVER', name: 'Turnover Rate', type: 'Percentage' },
      { id: 'MSR_LABOR_COST', name: 'Labor Cost', type: 'Amount', currency: 'USD' },
      { id: 'MSR_AVG_TENURE', name: 'Avg Tenure (months)', type: 'Count' },
    ],
  },
  {
    id: 'MDL_SALES_001',
    name: 'Sales Performance',
    description: 'Sales pipeline and performance tracking model',
    category: 'Analytics',
    createdDate: '2023-06-10',
    lastModified: '2024-09-05',
    dimensions: [
      { id: 'DIM_PRODUCT_SALES', name: 'Product', type: 'Generic', memberCount: 6 },
      { id: 'DIM_CUSTOMER', name: 'Customer', type: 'Generic', memberCount: 8 },
      { id: 'DIM_REGION_SALES', name: 'Region', type: 'Generic', memberCount: 4 },
      { id: 'DIM_TIME_SALES', name: 'Time', type: 'Time', memberCount: 12 },
      { id: 'DIM_ACCOUNT_SALES', name: 'Account', type: 'Account', memberCount: 5 },
    ],
    measures: [
      { id: 'MSR_SALES_REVENUE', name: 'Revenue', type: 'Amount', currency: 'USD' },
      { id: 'MSR_QUANTITY', name: 'Quantity', type: 'Count' },
      { id: 'MSR_GROSS_MARGIN', name: 'Gross Margin', type: 'Percentage' },
      { id: 'MSR_DISCOUNT', name: 'Discount %', type: 'Percentage' },
    ],
  },
];

const MOCK_STORIES = [
  {
    id: 'STR_001', name: 'Financial Overview', description: 'Executive financial dashboard',
    createdBy: 'admin', createdDate: '2023-02-01', lastModified: '2024-09-01',
    modelId: 'MDL_FIN_001', pageCount: 4,
    widgets: [
      { id: 'w001', type: 'Chart', chartType: 'Bar', title: 'Revenue by Region', dimensionId: 'DIM_REGION', measureId: 'MSR_REVENUE' },
      { id: 'w002', type: 'Chart', chartType: 'Line', title: 'Revenue Trend', dimensionId: 'DIM_TIME', measureId: 'MSR_REVENUE' },
      { id: 'w003', type: 'Table', title: 'P&L Summary', dimensions: ['DIM_ACCOUNT_FIN', 'DIM_TIME'], measures: ['MSR_REVENUE', 'MSR_COST', 'MSR_PROFIT'] },
      { id: 'w004', type: 'KPI', title: 'Total Profit', measureId: 'MSR_PROFIT' },
    ],
  },
  {
    id: 'STR_002', name: 'HR Dashboard', description: 'Workforce overview and analytics',
    createdBy: 'hr_admin', createdDate: '2023-04-15', lastModified: '2024-08-20',
    modelId: 'MDL_HR_001', pageCount: 3,
    widgets: [
      { id: 'w005', type: 'Chart', chartType: 'Donut', title: 'Headcount by Department', dimensionId: 'DIM_DEPARTMENT', measureId: 'MSR_HEADCOUNT' },
      { id: 'w006', type: 'KPI', title: 'Overall Turnover Rate', measureId: 'MSR_TURNOVER' },
      { id: 'w007', type: 'Table', title: 'Workforce by Location', dimensions: ['DIM_LOCATION'], measures: ['MSR_HEADCOUNT', 'MSR_LABOR_COST'] },
    ],
  },
  {
    id: 'STR_003', name: 'Sales Report', description: 'Sales pipeline and performance report',
    createdBy: 'sales_mgr', createdDate: '2023-07-01', lastModified: '2024-09-05',
    modelId: 'MDL_SALES_001', pageCount: 5,
    widgets: [
      { id: 'w008', type: 'Chart', chartType: 'Bar', title: 'Revenue by Product', dimensionId: 'DIM_PRODUCT_SALES', measureId: 'MSR_SALES_REVENUE' },
      { id: 'w009', type: 'Chart', chartType: 'Scatter', title: 'Revenue vs Margin', measureId: 'MSR_SALES_REVENUE' },
    ],
  },
  {
    id: 'STR_004', name: 'Cost Analysis', description: 'Detailed cost breakdown and analysis',
    createdBy: 'finance_mgr', createdDate: '2023-09-10', lastModified: '2024-08-25',
    modelId: 'MDL_FIN_001', pageCount: 3,
    widgets: [
      { id: 'w010', type: 'Chart', chartType: 'Waterfall', title: 'Cost Breakdown', dimensionId: 'DIM_ACCOUNT_FIN', measureId: 'MSR_COST' },
      { id: 'w011', type: 'Table', title: 'Cost by Company', dimensions: ['DIM_COMPANY'], measures: ['MSR_COST', 'MSR_MARGIN'] },
    ],
  },
  {
    id: 'STR_005', name: 'Budget vs Actual', description: 'Budget comparison and variance analysis',
    createdBy: 'admin', createdDate: '2024-01-05', lastModified: '2024-09-10',
    modelId: 'MDL_FIN_001', pageCount: 4,
    widgets: [
      { id: 'w012', type: 'Chart', chartType: 'Combo', title: 'Budget vs Actual Revenue', dimensionId: 'DIM_TIME', measureId: 'MSR_REVENUE' },
      { id: 'w013', type: 'KPI', title: 'Budget Variance', measureId: 'MSR_PROFIT' },
    ],
  },
];

const MOCK_DIMENSION_DATA = {
  DIM_COMPANY: [
    { id: 'ACME', description: 'ACME Corp', parentId: null },
    { id: 'GLOB', description: 'Global Inc', parentId: null },
    { id: 'TECH', description: 'Tech Solutions', parentId: null },
  ],
  DIM_REGION: [
    { id: 'NA', description: 'North America', parentId: null },
    { id: 'EMEA', description: 'Europe, Middle East, Africa', parentId: null },
    { id: 'APAC', description: 'Asia Pacific', parentId: null },
    { id: 'LATAM', description: 'Latin America', parentId: null },
  ],
  DIM_PRODUCT: [
    { id: 'PROD_SW', description: 'Software', parentId: null },
    { id: 'PROD_HW', description: 'Hardware', parentId: null },
    { id: 'PROD_SVC', description: 'Services', parentId: null },
    { id: 'PROD_LIC', description: 'Licenses', parentId: null },
    { id: 'PROD_SUP', description: 'Support', parentId: null },
  ],
  DIM_DEPARTMENT: [
    { id: 'DEP_HR', description: 'Human Resources', parentId: null },
    { id: 'DEP_FIN', description: 'Finance', parentId: null },
    { id: 'DEP_IT', description: 'Information Technology', parentId: null },
    { id: 'DEP_SALES', description: 'Sales', parentId: null },
    { id: 'DEP_OPS', description: 'Operations', parentId: null },
  ],
  DIM_LOCATION: [
    { id: 'LOC_NY', description: 'New York', parentId: 'NA' },
    { id: 'LOC_SF', description: 'San Francisco', parentId: 'NA' },
    { id: 'LOC_BER', description: 'Berlin', parentId: 'EMEA' },
    { id: 'LOC_MUM', description: 'Mumbai', parentId: 'APAC' },
  ],
  DIM_CUSTOMER: [
    { id: 'CUST_001', description: 'Enterprise Client A', parentId: null },
    { id: 'CUST_002', description: 'Enterprise Client B', parentId: null },
    { id: 'CUST_003', description: 'Mid-Market Client C', parentId: null },
    { id: 'CUST_004', description: 'Mid-Market Client D', parentId: null },
    { id: 'CUST_005', description: 'SMB Client E', parentId: null },
    { id: 'CUST_006', description: 'SMB Client F', parentId: null },
    { id: 'CUST_007', description: 'Government Agency G', parentId: null },
    { id: 'CUST_008', description: 'Education Institution H', parentId: null },
  ],
  DIM_PRODUCT_SALES: [
    { id: 'PS_ERP', description: 'ERP Suite', parentId: null },
    { id: 'PS_CRM', description: 'CRM Platform', parentId: null },
    { id: 'PS_HCM', description: 'HCM Cloud', parentId: null },
    { id: 'PS_SCM', description: 'Supply Chain', parentId: null },
    { id: 'PS_ANA', description: 'Analytics', parentId: null },
    { id: 'PS_INT', description: 'Integration Platform', parentId: null },
  ],
  DIM_REGION_SALES: [
    { id: 'RS_NA', description: 'North America', parentId: null },
    { id: 'RS_EMEA', description: 'EMEA', parentId: null },
    { id: 'RS_APAC', description: 'Asia Pacific', parentId: null },
    { id: 'RS_LATAM', description: 'Latin America', parentId: null },
  ],
};

const MOCK_VERSIONS = {
  MDL_FIN_001: [
    { id: 'VER_ACTUAL', name: 'Actual', category: 'Actual', status: 'Published', lastModified: '2024-09-01' },
    { id: 'VER_BUDGET', name: 'Budget', category: 'Budget', status: 'Published', lastModified: '2024-01-15' },
    { id: 'VER_FORECAST', name: 'Forecast', category: 'Forecast', status: 'Draft', lastModified: '2024-09-10' },
  ],
  MDL_HR_001: [
    { id: 'VER_HR_ACTUAL', name: 'Actual', category: 'Actual', status: 'Published', lastModified: '2024-08-15' },
    { id: 'VER_HR_PLAN', name: 'Headcount Plan', category: 'Budget', status: 'Draft', lastModified: '2024-07-20' },
  ],
  MDL_SALES_001: [
    { id: 'VER_SALES_ACTUAL', name: 'Actual', category: 'Actual', status: 'Published', lastModified: '2024-09-05' },
    { id: 'VER_SALES_TARGET', name: 'Sales Target', category: 'Budget', status: 'Published', lastModified: '2024-01-10' },
  ],
};

const MOCK_IMPORT_JOBS = {};
let _jobCounter = 0;

// ── SACClient ────────────────────────────────────────────────────────

class SACClient {
  /**
   * @param {object} options
   * @param {string} options.baseUrl - SAC tenant URL
   * @param {string} options.tenantId - SAC tenant ID
   * @param {string} [options.clientId] - OAuth client ID
   * @param {string} [options.clientSecret] - OAuth client secret
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   */
  constructor(options = {}) {
    if (!options.tenantId && options.mode === 'live') {
      throw new SACError('tenantId is required', { field: 'tenantId' });
    }

    this.baseUrl = (options.baseUrl || 'https://mock-sac-tenant.sapanalytics.cloud').replace(/\/+$/, '');
    this.tenantId = options.tenantId || 'MOCK_TENANT';
    this.clientId = options.clientId || null;
    this.clientSecret = options.clientSecret || null;
    this.mode = options.mode || 'mock';

    this._authenticated = false;
    this._accessToken = null;
    this._tokenExpiry = 0;

    // Deep-copy mock versions so mutations don't leak
    this._mockVersions = JSON.parse(JSON.stringify(MOCK_VERSIONS));
    this._mockImportJobs = {};

    this.log = new Logger('sac-client');
    this.log.info(`SAC client initialized in ${this.mode} mode`, { tenantId: this.tenantId });
  }

  /**
   * Authenticate via OAuth 2.0
   */
  async authenticate() {
    this.log.info('Authenticating to SAC');

    if (this.mode === 'mock') {
      this._authenticated = true;
      this._accessToken = 'mock-sac-token-' + Date.now();
      this._tokenExpiry = Date.now() + 3600000;
      this.log.info('Mock authentication successful');
      return { authenticated: true, mode: 'mock' };
    }

    try {
      const tokenUrl = `${this.baseUrl}/oauth/token`;
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
        throw new SACError(`OAuth token request failed: ${response.status}`, { status: response.status });
      }

      const tokenData = await response.json();
      this._accessToken = tokenData.access_token;
      this._tokenExpiry = Date.now() + (tokenData.expires_in || 3600) * 1000;
      this._authenticated = true;
      return { authenticated: true, mode: 'live' };
    } catch (err) {
      if (err instanceof SACError) throw err;
      throw new SACError(`Authentication failed: ${err.message}`, { cause: err.message });
    }
  }

  // ── Models ─────────────────────────────────────────────────────────

  /**
   * Get all available models
   */
  async getModels() {
    this._ensureAuthenticated();
    this.log.debug('GET models');

    if (this.mode === 'mock') {
      return {
        models: MOCK_MODELS.map(({ dimensions, measures, ...m }) => m),
      };
    }

    return this._liveRequest('GET', '/api/v1/dataexport/providers');
  }

  /**
   * Get a single model with full definition
   */
  async getModel(modelId) {
    this._ensureAuthenticated();
    this.log.debug(`GET model ${modelId}`);

    if (this.mode === 'mock') {
      const model = MOCK_MODELS.find((m) => m.id === modelId);
      if (!model) {
        throw new SACError(`Model not found: ${modelId}`, { modelId, statusCode: 404 });
      }
      return model;
    }

    return this._liveRequest('GET', `/api/v1/dataexport/providers/${modelId}`);
  }

  /**
   * Get data from a model with optional dimension filters
   * @param {string} modelId
   * @param {object} [params] - Dimension filters, e.g. { Company: 'ACME', Region: 'NA' }
   */
  async getModelData(modelId, params = {}) {
    this._ensureAuthenticated();
    this.log.debug(`GET model data ${modelId}`, params);

    if (this.mode === 'mock') {
      const model = MOCK_MODELS.find((m) => m.id === modelId);
      if (!model) {
        throw new SACError(`Model not found: ${modelId}`, { modelId, statusCode: 404 });
      }

      // Generate sample data rows
      const rows = this._generateMockModelData(model, params);
      return {
        modelId,
        rowCount: rows.length,
        columns: [
          ...model.dimensions.map((d) => d.name),
          ...model.measures.map((m) => m.name),
        ],
        data: rows,
      };
    }

    return this._liveRequest('GET', `/api/v1/dataexport/providers/${modelId}/data`, params);
  }

  // ── Data Import ────────────────────────────────────────────────────

  /**
   * Import data into a model
   * @param {string} modelId
   * @param {object} data - Import payload with rows
   * @returns {{ jobId: string, status: string }}
   */
  async importData(modelId, data) {
    this._ensureAuthenticated();
    this.log.debug(`POST data import to model ${modelId}`);

    if (this.mode === 'mock') {
      const model = MOCK_MODELS.find((m) => m.id === modelId);
      if (!model) {
        throw new SACError(`Model not found: ${modelId}`, { modelId, statusCode: 404 });
      }

      _jobCounter++;
      const jobId = `JOB_${String(_jobCounter).padStart(4, '0')}`;
      this._mockImportJobs[jobId] = {
        jobId,
        modelId,
        status: 'COMPLETED',
        rowsProcessed: (data.rows || []).length,
        rowsAccepted: (data.rows || []).length,
        rowsRejected: 0,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      return { jobId, status: 'RUNNING' };
    }

    return this._liveRequest('POST', `/api/v1/dataimport/${modelId}`, {}, data);
  }

  /**
   * Get import job status
   */
  async getImportJobStatus(jobId) {
    this._ensureAuthenticated();
    this.log.debug(`GET import job status ${jobId}`);

    if (this.mode === 'mock') {
      const job = this._mockImportJobs[jobId];
      if (!job) {
        throw new SACError(`Import job not found: ${jobId}`, { jobId, statusCode: 404 });
      }
      return job;
    }

    return this._liveRequest('GET', `/api/v1/dataimport/jobs/${jobId}`);
  }

  // ── Stories ────────────────────────────────────────────────────────

  /**
   * Get all stories
   */
  async getStories() {
    this._ensureAuthenticated();
    this.log.debug('GET stories');

    if (this.mode === 'mock') {
      return {
        stories: MOCK_STORIES.map(({ widgets, ...s }) => s),
      };
    }

    return this._liveRequest('GET', '/api/v1/stories');
  }

  /**
   * Get single story details
   */
  async getStory(storyId) {
    this._ensureAuthenticated();
    this.log.debug(`GET story ${storyId}`);

    if (this.mode === 'mock') {
      const story = MOCK_STORIES.find((s) => s.id === storyId);
      if (!story) {
        throw new SACError(`Story not found: ${storyId}`, { storyId, statusCode: 404 });
      }
      return story;
    }

    return this._liveRequest('GET', `/api/v1/stories/${storyId}`);
  }

  /**
   * Get widget definitions for a story
   */
  async getStoryWidgets(storyId) {
    this._ensureAuthenticated();
    this.log.debug(`GET story widgets ${storyId}`);

    if (this.mode === 'mock') {
      const story = MOCK_STORIES.find((s) => s.id === storyId);
      if (!story) {
        throw new SACError(`Story not found: ${storyId}`, { storyId, statusCode: 404 });
      }
      return { storyId, widgets: story.widgets };
    }

    return this._liveRequest('GET', `/api/v1/stories/${storyId}/widgets`);
  }

  // ── Dimensions & Master Data ───────────────────────────────────────

  /**
   * Get dimensions for a model
   */
  async getDimensions(modelId) {
    this._ensureAuthenticated();
    this.log.debug(`GET dimensions for model ${modelId}`);

    if (this.mode === 'mock') {
      const model = MOCK_MODELS.find((m) => m.id === modelId);
      if (!model) {
        throw new SACError(`Model not found: ${modelId}`, { modelId, statusCode: 404 });
      }
      return { modelId, dimensions: model.dimensions };
    }

    return this._liveRequest('GET', `/api/v1/dataexport/providers/${modelId}/dimensions`);
  }

  /**
   * Get master data for a dimension
   */
  async getMasterData(modelId, dimensionId) {
    this._ensureAuthenticated();
    this.log.debug(`GET master data for ${modelId}/${dimensionId}`);

    if (this.mode === 'mock') {
      const model = MOCK_MODELS.find((m) => m.id === modelId);
      if (!model) {
        throw new SACError(`Model not found: ${modelId}`, { modelId, statusCode: 404 });
      }

      const dim = model.dimensions.find((d) => d.id === dimensionId);
      if (!dim) {
        throw new SACError(`Dimension not found: ${dimensionId} in model ${modelId}`, { modelId, dimensionId, statusCode: 404 });
      }

      const members = MOCK_DIMENSION_DATA[dimensionId] || [];
      return { modelId, dimensionId, dimensionName: dim.name, members };
    }

    return this._liveRequest('GET', `/api/v1/dataexport/providers/${modelId}/dimensions/${dimensionId}/members`);
  }

  // ── Planning Versions ──────────────────────────────────────────────

  /**
   * Get planning versions for a model
   */
  async getVersions(modelId) {
    this._ensureAuthenticated();
    this.log.debug(`GET versions for model ${modelId}`);

    if (this.mode === 'mock') {
      const versions = this._mockVersions[modelId];
      if (!versions) {
        throw new SACError(`Model not found or no versions: ${modelId}`, { modelId, statusCode: 404 });
      }
      return { modelId, versions };
    }

    return this._liveRequest('GET', `/api/v1/dataexport/providers/${modelId}/versions`);
  }

  /**
   * Publish a planning version
   */
  async publishVersion(modelId, versionId) {
    this._ensureAuthenticated();
    this.log.debug(`POST publish version ${versionId} for model ${modelId}`);

    if (this.mode === 'mock') {
      const versions = this._mockVersions[modelId];
      if (!versions) {
        throw new SACError(`Model not found: ${modelId}`, { modelId, statusCode: 404 });
      }

      const version = versions.find((v) => v.id === versionId);
      if (!version) {
        throw new SACError(`Version not found: ${versionId} in model ${modelId}`, { modelId, versionId, statusCode: 404 });
      }

      version.status = 'Published';
      version.lastModified = new Date().toISOString().split('T')[0];
      return { modelId, versionId, status: 'Published', publishedAt: new Date().toISOString() };
    }

    return this._liveRequest('POST', `/api/v1/dataexport/providers/${modelId}/versions/${versionId}/publish`);
  }

  // ── Private helpers ────────────────────────────────────────────────

  _ensureAuthenticated() {
    if (!this._authenticated) {
      throw new SACError('Not authenticated. Call authenticate() first.');
    }
  }

  _generateMockModelData(model, filters) {
    // Generate a few representative data rows
    const rows = [];
    const dimValues = {};

    for (const dim of model.dimensions) {
      const members = MOCK_DIMENSION_DATA[dim.id];
      if (members && members.length > 0) {
        dimValues[dim.name] = members.map((m) => m.id);
      } else {
        dimValues[dim.name] = [dim.type === 'Time' ? '2024-Q3' : 'ALL'];
      }
    }

    // Generate up to 5 sample rows
    const firstDim = model.dimensions[0];
    const firstMembers = dimValues[firstDim.name] || ['ALL'];

    for (let i = 0; i < Math.min(firstMembers.length, 5); i++) {
      const row = {};
      for (const dim of model.dimensions) {
        const vals = dimValues[dim.name] || ['ALL'];
        row[dim.name] = vals[i % vals.length];
      }
      for (const measure of model.measures) {
        if (measure.type === 'Percentage') {
          row[measure.name] = Math.round(Math.random() * 50 + 10);
        } else if (measure.type === 'Count') {
          row[measure.name] = Math.floor(Math.random() * 500 + 50);
        } else {
          row[measure.name] = Math.round(Math.random() * 1000000 + 100000);
        }
      }
      rows.push(row);
    }

    return rows;
  }

  async _liveRequest(method, path, params = {}, body = null) {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const headers = {
      'Authorization': `Bearer ${this._accessToken}`,
      'Accept': 'application/json',
      'x-sap-sac-custom-auth': 'true',
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
      throw new SACError(`Request failed: ${response.status} ${response.statusText}`, {
        status: response.status,
        url: url.toString(),
        body: errorText,
      });
    }

    if (response.status === 204) return null;

    return response.json();
  }
}

module.exports = SACClient;
