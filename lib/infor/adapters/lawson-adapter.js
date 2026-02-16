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
 * Lawson Adapter -- Source adapter for Infor Lawson (Landmark)
 *
 * Reads data from Infor Lawson via the Landmark REST API and optional
 * direct database access. Lawson uses a data-area model where each
 * data area represents a logical company/environment. Entities are
 * accessed via Landmark's OData-style REST endpoints.
 *
 * Key Lawson entity types:
 *   Employee        - Employee master
 *   Vendor          - Vendor (supplier) master
 *   Customer        - Customer master
 *   PurchaseOrder   - Purchase order headers
 *   Requisition     - Purchase requisitions
 *   Invoice         - AP/AR invoices
 *   GLAccount       - General ledger accounts
 *   GLTransaction   - General ledger transactions
 *   Project         - Project master
 *   BenefitPlan     - Benefits plan definitions
 *   PayCode         - Payroll codes
 *   Job             - Job master (HR)
 *   Position        - Position master (HR)
 *
 * Supports mock mode for demo/testing without a live Lawson environment.
 */

const Logger = require('../../logger');
const { InforError } = require('../../errors');
const SourceAdapter = require('../source-adapter');

/** @private Mock Lawson entity data */
const MOCK_TABLE_DATA = {
  Employee: [
    { Employee: 'EMP001', FirstName: 'John', LastName: 'Doe', Department: 'IT', Status: 'Active', HireDate: '2019-03-15', Position: 'Software Engineer', PayClass: 'SAL' },
    { Employee: 'EMP002', FirstName: 'Jane', LastName: 'Smith', Department: 'HR', Status: 'Active', HireDate: '2020-06-01', Position: 'HR Manager', PayClass: 'SAL' },
    { Employee: 'EMP003', FirstName: 'Robert', LastName: 'Johnson', Department: 'Finance', Status: 'Active', HireDate: '2018-11-20', Position: 'Controller', PayClass: 'SAL' },
    { Employee: 'EMP004', FirstName: 'Maria', LastName: 'Garcia', Department: 'Operations', Status: 'Active', HireDate: '2021-01-10', Position: 'Ops Manager', PayClass: 'SAL' },
  ],
  Vendor: [
    { Vendor: 'V1000', Name: 'Industrial Supply Co', Status: 'Active', VendorGroup: 'SUPPLY', Currency: 'USD', Country: 'US' },
    { Vendor: 'V2000', Name: 'Office Essentials', Status: 'Active', VendorGroup: 'OFFICE', Currency: 'USD', Country: 'US' },
    { Vendor: 'V3000', Name: 'Global Parts Ltd', Status: 'Active', VendorGroup: 'SUPPLY', Currency: 'EUR', Country: 'DE' },
  ],
  Customer: [
    { Customer: 'C1000', Name: 'Acme Corp', Status: 'Active', CustomerGroup: 'MFGR', Currency: 'USD', Country: 'US' },
    { Customer: 'C2000', Name: 'TechServ Inc', Status: 'Active', CustomerGroup: 'SVC', Currency: 'USD', Country: 'US' },
  ],
  GLAccount: [
    { Account: '1000', Description: 'Cash', AccountType: 'Asset', Status: 'Active', NormalBalance: 'Debit' },
    { Account: '1100', Description: 'Accounts Receivable', AccountType: 'Asset', Status: 'Active', NormalBalance: 'Debit' },
    { Account: '2000', Description: 'Accounts Payable', AccountType: 'Liability', Status: 'Active', NormalBalance: 'Credit' },
    { Account: '3000', Description: 'Retained Earnings', AccountType: 'Equity', Status: 'Active', NormalBalance: 'Credit' },
    { Account: '4000', Description: 'Revenue', AccountType: 'Revenue', Status: 'Active', NormalBalance: 'Credit' },
    { Account: '5000', Description: 'Cost of Goods Sold', AccountType: 'Expense', Status: 'Active', NormalBalance: 'Debit' },
  ],
  PurchaseOrder: [
    { PurchaseOrder: 'PO-10001', Vendor: 'V1000', OrderDate: '2024-06-15', Status: 'Approved', TotalAmount: 15000, Currency: 'USD' },
    { PurchaseOrder: 'PO-10002', Vendor: 'V2000', OrderDate: '2024-06-20', Status: 'Received', TotalAmount: 3200, Currency: 'USD' },
  ],
  Invoice: [
    { Invoice: 'INV-50001', Vendor: 'V1000', InvoiceDate: '2024-06-18', DueDate: '2024-07-18', Amount: 15000, Status: 'Open', Currency: 'USD' },
    { Invoice: 'INV-50002', Vendor: 'V2000', InvoiceDate: '2024-06-22', DueDate: '2024-07-22', Amount: 3200, Status: 'Paid', Currency: 'USD' },
  ],
  BenefitPlan: [
    { PlanCode: 'MED01', Description: 'Medical PPO', PlanType: 'Medical', Status: 'Active', EffectiveDate: '2024-01-01' },
    { PlanCode: 'DEN01', Description: 'Dental Plan', PlanType: 'Dental', Status: 'Active', EffectiveDate: '2024-01-01' },
    { PlanCode: '401K', Description: '401k Retirement', PlanType: 'Retirement', Status: 'Active', EffectiveDate: '2024-01-01' },
  ],
  Job: [
    { Job: 'SWE', Description: 'Software Engineer', JobFamily: 'IT', Grade: 'P3', Status: 'Active' },
    { Job: 'HRM', Description: 'HR Manager', JobFamily: 'HR', Grade: 'M2', Status: 'Active' },
    { Job: 'CTR', Description: 'Controller', JobFamily: 'FIN', Grade: 'M3', Status: 'Active' },
  ],
};

/** @private Lawson module information */
const LAWSON_MODULES = [
  { code: 'HR', name: 'Human Resources', description: 'Core HR, talent, workforce management' },
  { code: 'PR', name: 'Payroll', description: 'Payroll processing, tax filing' },
  { code: 'BN', name: 'Benefits', description: 'Benefits administration' },
  { code: 'AP', name: 'Accounts Payable', description: 'Vendor invoices, payments' },
  { code: 'AR', name: 'Accounts Receivable', description: 'Customer invoices, collections' },
  { code: 'GL', name: 'General Ledger', description: 'Journal entries, financial reporting' },
  { code: 'PO', name: 'Purchasing', description: 'Purchase orders, requisitions' },
  { code: 'IC', name: 'Inventory Control', description: 'Inventory management' },
  { code: 'AM', name: 'Asset Management', description: 'Fixed assets, depreciation' },
  { code: 'PM', name: 'Project Management', description: 'Project accounting, billing' },
];

class LawsonAdapter extends SourceAdapter {
  /**
   * @param {object} config
   * @param {string} [config.dataArea='PROD'] - Lawson data area (company/environment)
   * @param {string} [config.mode='mock'] - 'mock' or 'live'
   * @param {object} [config.landmarkClient] - Landmark REST client instance
   * @param {object} [config.dbAdapter] - Database adapter for direct SQL
   * @param {object} [config.logger] - Logger instance
   */
  constructor(config = {}) {
    super({ ...config, product: 'lawson' });
    this.dataArea = config.dataArea || 'PROD';
    this.landmarkClient = config.landmarkClient || null;
    this.dbAdapter = config.dbAdapter || null;
  }

  /**
   * Connect to the Lawson source system.
   * Validates that at least one connectivity method is available.
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.mode === 'mock') {
      this._connected = true;
      this.log.info('Lawson adapter connected (mock mode)');
      return;
    }

    if (this.landmarkClient) {
      // Landmark client is typically stateless REST; just validate it exists
      this._connected = true;
      this.log.info('Lawson adapter connected via Landmark');
    } else if (this.dbAdapter) {
      if (typeof this.dbAdapter.connect === 'function' && !this.dbAdapter.isConnected) {
        await this.dbAdapter.connect();
      }
      this._connected = true;
      this.log.info('Lawson adapter connected via database');
    } else {
      throw new InforError('Lawson adapter requires either landmarkClient or dbAdapter for live mode');
    }
  }

  /**
   * Disconnect from the Lawson source system.
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.dbAdapter && typeof this.dbAdapter.disconnect === 'function') {
      await this.dbAdapter.disconnect();
    }
    await super.disconnect();
  }

  /**
   * Read table/entity data from Lawson via Landmark REST or direct SQL.
   *
   * Landmark REST is preferred for entity queries. Direct SQL is used as
   * fallback for raw table access when Landmark does not expose the entity.
   *
   * @param {string} tableName - Entity type name (e.g., 'Employee', 'Vendor') or SQL table name
   * @param {object} [opts={}] - Query options
   * @param {string[]} [opts.fields] - Columns/properties to return
   * @param {string} [opts.filter] - Filter expression (OData $filter for Landmark, SQL WHERE for DB)
   * @param {number} [opts.maxRows] - Maximum rows to return
   * @param {string} [opts.orderBy] - Sort expression
   * @param {string} [opts.dataArea] - Override the default data area for this query
   * @returns {Promise<{ rows: object[], metadata: object }>}
   */
  async readTable(tableName, opts = {}) {
    if (this.mode === 'mock') {
      return this._mockReadTable(tableName, opts);
    }

    const dataArea = opts.dataArea || this.dataArea;

    // Prefer Landmark REST for entity queries
    if (this.landmarkClient) {
      const queryOpts = {
        dataArea,
      };
      if (opts.fields) queryOpts.select = opts.fields.join(',');
      if (opts.filter) queryOpts.filter = opts.filter;
      if (opts.maxRows) queryOpts.top = opts.maxRows;
      if (opts.orderBy) queryOpts.orderBy = opts.orderBy;

      const result = await this.landmarkClient.queryEntities(tableName, queryOpts);
      const entities = result.entities || result.value || [];

      return {
        rows: entities,
        metadata: {
          tableName,
          dataArea,
          rowCount: entities.length,
          totalCount: result.totalCount || entities.length,
          source: 'landmark',
        },
      };
    }

    // Fall back to database for direct SQL
    if (this.dbAdapter) {
      const fields = opts.fields ? opts.fields.join(', ') : '*';
      let sql = `SELECT ${fields} FROM ${tableName}`;
      if (opts.filter) sql += ` WHERE ${opts.filter}`;
      if (opts.orderBy) sql += ` ORDER BY ${opts.orderBy}`;
      if (opts.maxRows) sql += ` FETCH FIRST ${opts.maxRows} ROWS ONLY`;

      const result = await this.dbAdapter.query(sql);
      return {
        rows: result.rows,
        metadata: {
          tableName,
          dataArea,
          rowCount: result.rowCount,
          source: 'database',
        },
      };
    }

    throw new InforError('Lawson live mode requires landmarkClient or dbAdapter');
  }

  /**
   * Call a Lawson/Landmark API endpoint or PFI process flow.
   *
   * Supports two endpoint formats:
   *   - REST path:  'api/v2/Employee/EMP001'   (direct Landmark REST call)
   *   - PFI flow:   'pfi/FlowName'             (Process Flow Integrator)
   *
   * @param {string} endpoint - API path or PFI flow reference
   * @param {object} [params={}] - Request parameters
   * @returns {Promise<object>}
   */
  async callApi(endpoint, params = {}) {
    if (this.mode === 'mock') {
      return {
        endpoint,
        params,
        dataArea: this.dataArea,
        result: 'mock',
        mock: true,
      };
    }

    if (!this.landmarkClient) {
      throw new InforError('callApi() requires landmarkClient for Lawson');
    }

    // Route PFI calls
    if (endpoint.startsWith('pfi/')) {
      const flowName = endpoint.substring(4);
      return this.landmarkClient.executePFI(flowName, {
        ...params,
        dataArea: params.dataArea || this.dataArea,
      });
    }

    // Standard REST request
    return this.landmarkClient.request('GET', endpoint, {
      params: { ...params, _da: params.dataArea || this.dataArea },
    });
  }

  /**
   * Query entities via Landmark REST.
   *
   * Provides a higher-level interface that wraps readTable() and
   * returns a normalized entity collection.
   *
   * @param {string} entityType - Entity type name (e.g., 'Employee', 'Vendor')
   * @param {string} [filter] - OData-style $filter expression
   * @param {object} [opts={}] - Query options
   * @param {number} [opts.maxRows] - Maximum entities to return
   * @param {number} [opts.top] - Alias for maxRows
   * @param {string[]} [opts.select] - Properties to select
   * @param {string} [opts.orderBy] - Sort expression
   * @param {string} [opts.dataArea] - Override data area
   * @returns {Promise<{ entities: object[], totalCount: number }>}
   */
  async queryEntities(entityType, filter, opts = {}) {
    const readOpts = {
      filter,
      maxRows: opts.maxRows || opts.top,
      fields: opts.select,
      orderBy: opts.orderBy,
      dataArea: opts.dataArea,
    };

    const result = await this.readTable(entityType, readOpts);
    return {
      entities: result.rows,
      totalCount: result.metadata ? result.metadata.totalCount || result.rows.length : result.rows.length,
    };
  }

  /**
   * Get Lawson system information.
   *
   * In mock mode, returns a representative system profile.
   * In live mode, queries Landmark system endpoints and/or database tables.
   *
   * @returns {Promise<object>} System info with version, modules, data area
   */
  async getSystemInfo() {
    if (this.mode === 'mock') {
      return {
        product: 'Infor Lawson/Landmark',
        dataArea: this.dataArea,
        version: 'v11',
        database: 'Oracle',
        modules: LAWSON_MODULES,
        entityTypes: Object.keys(MOCK_TABLE_DATA),
        timestamp: new Date().toISOString(),
        mock: true,
      };
    }

    let version = '';
    let modules = [];

    // Try Landmark system info endpoint
    if (this.landmarkClient) {
      try {
        const sysInfo = await this.landmarkClient.getSystemInfo();
        version = sysInfo.version || '';
        modules = sysInfo.modules || [];
      } catch {
        this.log.warn('Could not read Lawson system info from Landmark');
      }
    }

    // Try database fallback for version
    if (!version && this.dbAdapter) {
      try {
        const result = await this.dbAdapter.query("SELECT TOP 1 VERSION FROM LAWENV");
        version = result.rows[0]?.VERSION || '';
      } catch {
        this.log.warn('Could not read Lawson version from database');
      }
    }

    // Try to read installed modules from database
    if (modules.length === 0 && this.dbAdapter) {
      try {
        const result = await this.dbAdapter.query("SELECT PRODUCT_LINE, DESCRIPTION, STATUS FROM PRODUCTLINE WHERE STATUS = 'A'");
        modules = result.rows.map(row => ({
          code: row.PRODUCT_LINE,
          name: row.DESCRIPTION,
          status: row.STATUS,
        }));
      } catch {
        this.log.warn('Could not read Lawson modules from database');
      }
    }

    return {
      product: 'Infor Lawson/Landmark',
      dataArea: this.dataArea,
      version,
      modules,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check for the Lawson adapter.
   *
   * Tests connectivity by querying a lightweight entity (Employee with maxRows=1).
   *
   * @returns {Promise<{ ok: boolean, latencyMs: number, status: string, product: string }>}
   */
  async healthCheck() {
    const start = Date.now();

    if (this.mode === 'mock') {
      return {
        ok: true,
        latencyMs: 1,
        status: 'mock',
        product: 'Infor Lawson/Landmark',
        dataArea: this.dataArea,
      };
    }

    try {
      // Try Landmark health check first
      if (this.landmarkClient && typeof this.landmarkClient.healthCheck === 'function') {
        const result = await this.landmarkClient.healthCheck();
        return { ...result, dataArea: this.dataArea };
      }

      // Fall back to a lightweight entity query
      await this.readTable('Employee', { maxRows: 1 });
      const latencyMs = Date.now() - start;
      return {
        ok: true,
        latencyMs,
        status: 'connected',
        product: 'Infor Lawson/Landmark',
        dataArea: this.dataArea,
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      return {
        ok: false,
        latencyMs,
        status: 'error',
        error: err.message,
        product: 'Infor Lawson/Landmark',
      };
    }
  }

  /**
   * Get the list of available Lawson modules.
   *
   * @returns {{ code: string, name: string, description: string }[]}
   */
  static getLawsonModules() {
    return [...LAWSON_MODULES];
  }

  // ── Private helpers ───────────────────────────────────────────────

  /**
   * Mock implementation for readTable().
   * @private
   */
  _mockReadTable(tableName, opts) {
    this.log.debug('Mock Lawson readTable', { tableName, dataArea: this.dataArea });

    const records = MOCK_TABLE_DATA[tableName];
    if (!records) {
      return {
        rows: [],
        metadata: {
          tableName,
          dataArea: this.dataArea,
          rowCount: 0,
          totalCount: 0,
          source: 'mock',
        },
      };
    }

    let rows = [...records];

    if (opts.maxRows) {
      rows = rows.slice(0, opts.maxRows);
    }

    if (opts.fields) {
      rows = rows.map(row => {
        const filtered = {};
        for (const f of opts.fields) {
          if (f in row) filtered[f] = row[f];
        }
        return filtered;
      });
    }

    return {
      rows,
      metadata: {
        tableName,
        dataArea: this.dataArea,
        rowCount: rows.length,
        totalCount: records.length,
        source: 'mock',
      },
    };
  }
}

module.exports = LawsonAdapter;
