'use strict';

/**
 * LN Adapter -- Source adapter for Infor LN (Baan)
 *
 * Reads data from Infor LN via ION API Gateway or direct database access.
 * LN uses company-suffixed table naming: the base table name (e.g., tcibd001
 * for item master) is suffixed with the 3-digit company number (e.g.,
 * tcibd001100 for company 100).
 *
 * Key LN tables:
 *   tcibd001 - Item general data
 *   tcibd002 - Item additional data
 *   tccom100 - Business partners
 *   tccom130 - Addresses
 *   tcemm030 - Installed software components
 *   tccom000 - Company data
 *   tdsls400 - Sales order headers
 *   tdsls401 - Sales order lines
 *   tdpur400 - Purchase order headers
 *   tdpur401 - Purchase order lines
 *   tfgld100 - General ledger transactions
 *   tfgld010 - Chart of accounts
 *
 * Supports mock mode for demo/testing without a live LN environment.
 */

const Logger = require('../../logger');
const { InforError } = require('../../errors');
const SourceAdapter = require('../source-adapter');

/** @private Mock LN tables with realistic data */
const MOCK_TABLES = {
  tcibd001: [
    { ITEM: 'ITEM-001', DSCA: 'Steel Plate 4mm', CITG: '01', CSIG: 'A', CUNI: 'KG', STAP: 1 },
    { ITEM: 'ITEM-002', DSCA: 'Copper Wire 2mm', CITG: '02', CSIG: 'A', CUNI: 'M', STAP: 1 },
    { ITEM: 'ITEM-003', DSCA: 'Aluminum Sheet 3mm', CITG: '01', CSIG: 'B', CUNI: 'KG', STAP: 1 },
    { ITEM: 'ITEM-004', DSCA: 'Brass Fitting 1in', CITG: '03', CSIG: 'A', CUNI: 'EA', STAP: 1 },
  ],
  tccom100: [
    { BESSION: 1, BESSION_DESC: 'Sales', BESSION_STATUS: 'Active' },
    { BESSION: 2, BESSION_DESC: 'Purchase', BESSION_STATUS: 'Active' },
    { BESSION: 3, BESSION_DESC: 'Manufacturing', BESSION_STATUS: 'Active' },
  ],
  tccom130: [
    { CAESSION: 'CUST-001', NAME: 'Acme Manufacturing', CTRY: 'US', CITY: 'Chicago' },
    { CAESSION: 'CUST-002', NAME: 'Global Industries', CTRY: 'DE', CITY: 'Munich' },
    { CAESSION: 'VEND-001', NAME: 'Steel Works Inc', CTRY: 'US', CITY: 'Pittsburgh' },
  ],
  tcemm030: [
    { CPAC: 'tc', CMOD: 'Common', VERS: '10.7.0', STAT: 'Active' },
    { CPAC: 'td', CMOD: 'Distribution', VERS: '10.7.0', STAT: 'Active' },
    { CPAC: 'ti', CMOD: 'Manufacturing', VERS: '10.7.0', STAT: 'Active' },
    { CPAC: 'tf', CMOD: 'Finance', VERS: '10.7.0', STAT: 'Active' },
    { CPAC: 'tp', CMOD: 'Project', VERS: '10.7.0', STAT: 'Active' },
  ],
  tccom000: [
    { COMP: '100', DSCA: 'Main Company', CCUR: 'USD', CTRY: 'US' },
  ],
};

class LNAdapter extends SourceAdapter {
  /**
   * @param {object} config
   * @param {string} [config.company='100'] - LN company number (used for table suffixes)
   * @param {string} [config.mode='mock'] - 'mock' or 'live'
   * @param {object} [config.ionClient] - ION client for BOD/API access
   * @param {object} [config.dbAdapter] - Database adapter for direct SQL
   * @param {object} [config.logger] - Logger instance
   */
  constructor(config = {}) {
    super({ ...config, product: 'ln' });
    this.company = config.company || '100';
    this.ionClient = config.ionClient || null;
    this.dbAdapter = config.dbAdapter || null;
  }

  /**
   * Connect to the LN source system.
   * Validates that at least one connectivity method is available.
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.mode === 'mock') {
      this._connected = true;
      this.log.info('LN adapter connected (mock mode)');
      return;
    }

    if (this.dbAdapter) {
      if (typeof this.dbAdapter.connect === 'function' && !this.dbAdapter.isConnected) {
        await this.dbAdapter.connect();
      }
      this._connected = true;
      this.log.info('LN adapter connected via database');
    } else if (this.ionClient) {
      this._connected = true;
      this.log.info('LN adapter connected via ION');
    } else {
      throw new InforError('LN adapter requires either ionClient or dbAdapter for live mode');
    }
  }

  /**
   * Disconnect from the LN source system.
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.dbAdapter && typeof this.dbAdapter.disconnect === 'function') {
      await this.dbAdapter.disconnect();
    }
    await super.disconnect();
  }

  /**
   * Get the company-suffixed table name for LN.
   * LN tables are suffixed with the 3-digit company number.
   * Example: tcibd001 + company 100 = tcibd001100
   *
   * @param {string} tableName - Base table name (without company suffix)
   * @returns {string} Company-suffixed table name
   */
  getCompanyTable(tableName) {
    const companySuffix = this.company.padStart(3, '0');
    return `${tableName}${companySuffix}`;
  }

  /**
   * Read table data from LN. Uses dbAdapter for direct SQL or ION for BOD queries.
   *
   * @param {string} tableName - Base table name (without company suffix)
   * @param {object} [opts={}] - Query options
   * @param {string[]} [opts.fields] - Columns to return
   * @param {string} [opts.filter] - SQL WHERE clause or BOD filter
   * @param {number} [opts.maxRows] - Maximum rows to return
   * @param {number} [opts.offset] - Row offset for pagination
   * @param {string} [opts.orderBy] - Sort expression
   * @returns {Promise<{ rows: object[], metadata: object }>}
   */
  async readTable(tableName, opts = {}) {
    if (this.mode === 'mock') {
      return this._mockReadTable(tableName, opts);
    }

    const fullTableName = this.getCompanyTable(tableName);

    if (this.dbAdapter) {
      const fields = opts.fields ? opts.fields.join(', ') : '*';
      let sql = `SELECT ${fields} FROM ${fullTableName}`;
      if (opts.filter) sql += ` WHERE ${opts.filter}`;
      if (opts.orderBy) sql += ` ORDER BY ${opts.orderBy}`;
      if (opts.maxRows) sql += ` FETCH FIRST ${opts.maxRows} ROWS ONLY`;

      const result = await this.dbAdapter.query(sql);
      return {
        rows: result.rows,
        metadata: {
          tableName: fullTableName,
          baseTable: tableName,
          company: this.company,
          rowCount: result.rowCount,
          source: 'database',
        },
      };
    }

    if (this.ionClient) {
      // Use ION BOD query as fallback
      const bodResult = await this.ionClient.queryBOD(tableName, 'Get', {
        $top: opts.maxRows,
        $filter: opts.filter,
      });
      const rows = bodResult.value || [];
      return {
        rows,
        metadata: {
          tableName,
          company: this.company,
          rowCount: rows.length,
          source: 'ion',
        },
      };
    }

    throw new InforError('LN live mode requires either ionClient or dbAdapter');
  }

  /**
   * Call an LN API endpoint via ION.
   *
   * @param {string} endpoint - API path or BOD noun
   * @param {object} [params={}] - API parameters
   * @returns {Promise<object>}
   */
  async callApi(endpoint, params = {}) {
    if (this.mode === 'mock') {
      return { endpoint, params, result: 'mock', mock: true };
    }

    if (!this.ionClient) {
      throw new InforError('callApi() requires ionClient for LN');
    }

    return this.ionClient.request('GET', endpoint, { params });
  }

  /**
   * Query entities via ION BOD.
   *
   * @param {string} entityType - BOD noun (e.g., 'SalesOrder', 'Item')
   * @param {string} [filter] - Filter expression
   * @param {object} [opts={}] - Query options
   * @returns {Promise<{ entities: object[], totalCount: number }>}
   */
  async queryEntities(entityType, filter, opts = {}) {
    if (this.mode === 'mock') {
      return {
        entities: [{ id: `${entityType}-001`, type: entityType, status: 'Active' }],
        totalCount: 1,
        mock: true,
      };
    }

    if (!this.ionClient) {
      throw new InforError('queryEntities() requires ionClient for LN');
    }

    const result = await this.ionClient.queryBOD(entityType, 'Get', {
      $filter: filter,
      $top: opts.maxRows || opts.top,
    });

    return {
      entities: result.value || [],
      totalCount: result.totalCount || (result.value || []).length,
    };
  }

  /**
   * Get LN system information by reading system tables.
   *
   * @returns {Promise<object>} System info with version, modules, company data
   */
  async getSystemInfo() {
    if (this.mode === 'mock') {
      return {
        product: 'Infor LN',
        version: '10.7',
        company: this.company,
        companyName: 'Main Company',
        currency: 'USD',
        country: 'US',
        database: 'Oracle',
        modules: [
          { code: 'tc', name: 'Common', version: '10.7.0' },
          { code: 'td', name: 'Distribution', version: '10.7.0' },
          { code: 'ti', name: 'Manufacturing', version: '10.7.0' },
          { code: 'tf', name: 'Finance', version: '10.7.0' },
          { code: 'tp', name: 'Project', version: '10.7.0' },
        ],
        timestamp: new Date().toISOString(),
        mock: true,
      };
    }

    // Read system info from LN tables
    const modules = await this.readTable('tcemm030', { maxRows: 50 });
    const company = await this.readTable('tccom000', { filter: `COMP = '${this.company}'`, maxRows: 1 });

    const companyData = company.rows[0] || {};

    return {
      product: 'Infor LN',
      company: this.company,
      companyName: companyData.DSCA || '',
      currency: companyData.CCUR || '',
      country: companyData.CTRY || '',
      modules: modules.rows.map(m => ({
        code: m.CPAC,
        name: m.CMOD,
        version: m.VERS,
        status: m.STAT,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check for the LN adapter.
   *
   * @returns {Promise<{ ok: boolean, latencyMs: number, status: string, product: string }>}
   */
  async healthCheck() {
    const start = Date.now();

    if (this.mode === 'mock') {
      return { ok: true, latencyMs: 1, status: 'mock', product: 'Infor LN', company: this.company };
    }

    try {
      await this.readTable('tcibd001', { maxRows: 1 });
      const latencyMs = Date.now() - start;
      return { ok: true, latencyMs, status: 'connected', product: 'Infor LN', company: this.company };
    } catch (err) {
      const latencyMs = Date.now() - start;
      return { ok: false, latencyMs, status: 'error', error: err.message, product: 'Infor LN' };
    }
  }

  // ── Private helpers ───────────────────────────────────────────────

  /**
   * Mock implementation for readTable().
   * @private
   */
  _mockReadTable(tableName, opts) {
    this.log.debug('Mock LN readTable', { tableName, company: this.company });

    const records = MOCK_TABLES[tableName];
    if (!records) {
      return {
        rows: [],
        metadata: { tableName: this.getCompanyTable(tableName), baseTable: tableName, company: this.company, rowCount: 0, source: 'mock' },
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
        tableName: this.getCompanyTable(tableName),
        baseTable: tableName,
        company: this.company,
        rowCount: rows.length,
        source: 'mock',
      },
    };
  }
}

module.exports = LNAdapter;
