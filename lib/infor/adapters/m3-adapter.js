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
 * M3 Adapter -- Source adapter for Infor M3
 *
 * Reads data from Infor M3 via the M3 MI Programs API and optional
 * direct database access. M3 uses 6-character table names and 2-character
 * field name prefixes (e.g., ITNO for Item Number, WHLO for Warehouse,
 * CONO for Company).
 *
 * Key M3 tables:
 *   MITMAS - Item master
 *   OCUSMA - Customer master
 *   CIDMAS - Supplier master
 *   OOLINE - Customer order lines
 *   MPLINE - Purchase order lines
 *   MITBAL - Item balance (inventory)
 *   FSLEDG - General ledger
 *   CMNFCN - Company function
 *   CMNDIV - Company division
 *
 * Table-to-MI-Program mapping enables readTable() to execute the appropriate
 * MI transaction transparently.
 */

const Logger = require('../../logger');
const { InforError } = require('../../errors');
const SourceAdapter = require('../source-adapter');

/** @private Table-to-MI-Program mapping */
const TABLE_PROGRAM_MAP = {
  MITMAS: { program: 'MMS200', transaction: 'LstByNam', keyField: 'ITNO' },
  OCUSMA: { program: 'CRS610', transaction: 'LstByName', keyField: 'CUNO' },
  CIDMAS: { program: 'CRS620', transaction: 'LstByName', keyField: 'SUNO' },
  OOLINE: { program: 'OIS100', transaction: 'LstLines', keyField: 'ORNO' },
  MPLINE: { program: 'PPS200', transaction: 'LstLines', keyField: 'PUNO' },
  MITBAL: { program: 'MMS200', transaction: 'LstByNam', keyField: 'ITNO' },
  FSLEDG: { program: 'GLS200', transaction: 'LstVoucher', keyField: 'VONO' },
  CMNFCN: { program: 'CMNFCN', transaction: 'GetBasicData', keyField: 'CONO' },
};

/** @private M3 field prefix explanations */
const FIELD_PREFIXES = {
  IT: 'Item',
  WH: 'Warehouse',
  CO: 'Company/Customer Order',
  CU: 'Customer',
  SU: 'Supplier',
  OR: 'Order',
  PU: 'Purchase',
  DI: 'Division',
  FA: 'Facility',
  ST: 'Status',
  RG: 'Registration',
  LM: 'Last Modified',
  TX: 'Text',
  VO: 'Voucher',
  AC: 'Account',
  YE: 'Year',
  PE: 'Period',
};

/** @private Mock M3 table data */
const MOCK_TABLE_DATA = {
  MITMAS: [
    { ITNO: 'A001', ITDS: 'Widget Alpha', ITTY: '001', STAT: '20', UNMS: 'EA', FUDS: 'Standard widget A' },
    { ITNO: 'A002', ITDS: 'Widget Beta', ITTY: '001', STAT: '20', UNMS: 'EA', FUDS: 'Standard widget B' },
    { ITNO: 'B001', ITDS: 'Gear Assembly', ITTY: '002', STAT: '20', UNMS: 'PC', FUDS: 'Drive gear assembly' },
    { ITNO: 'B002', ITDS: 'Motor Housing', ITTY: '002', STAT: '20', UNMS: 'PC', FUDS: 'Motor housing unit' },
  ],
  OCUSMA: [
    { CUNO: 'CUST001', CUNM: 'Acme Corp', STAT: '20', CUTP: '0', CUA1: '100 Main St' },
    { CUNO: 'CUST002', CUNM: 'Global Ltd', STAT: '20', CUTP: '0', CUA1: '200 Oak Ave' },
  ],
  CIDMAS: [
    { SUNO: 'SUPP001', SUNM: 'Parts Plus', STAT: '20', SUTY: '0' },
    { SUNO: 'SUPP002', SUNM: 'Metal Works', STAT: '20', SUTY: '0' },
  ],
  CMNFCN: [
    { CONO: '100', CONM: 'M3 Main Company', DIVI: 'AAA', CCUR: 'USD' },
  ],
};

class M3Adapter extends SourceAdapter {
  /**
   * @param {object} config
   * @param {string} [config.company='100'] - M3 company number (CONO)
   * @param {string} [config.division] - M3 division (DIVI)
   * @param {string} [config.mode='mock'] - 'mock' or 'live'
   * @param {object} [config.m3Client] - M3 API client instance
   * @param {object} [config.dbAdapter] - Database adapter for direct SQL
   * @param {object} [config.logger] - Logger instance
   */
  constructor(config = {}) {
    super({ ...config, product: 'm3' });
    this.company = config.company || '100';
    this.division = config.division || '';
    this.m3Client = config.m3Client || null;
    this.dbAdapter = config.dbAdapter || null;
  }

  /**
   * Connect to the M3 source system.
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.mode === 'mock') {
      this._connected = true;
      this.log.info('M3 adapter connected (mock mode)');
      return;
    }

    if (this.m3Client || this.dbAdapter) {
      if (this.dbAdapter && typeof this.dbAdapter.connect === 'function' && !this.dbAdapter.isConnected) {
        await this.dbAdapter.connect();
      }
      this._connected = true;
      this.log.info('M3 adapter connected');
    } else {
      throw new InforError('M3 adapter requires m3Client or dbAdapter for live mode');
    }
  }

  /**
   * Disconnect from the M3 source system.
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.dbAdapter && typeof this.dbAdapter.disconnect === 'function') {
      await this.dbAdapter.disconnect();
    }
    await super.disconnect();
  }

  /**
   * Explain what an M3 field prefix means.
   * @param {string} fieldName - M3 field name (e.g., 'ITNO')
   * @returns {string} Human-readable prefix description
   */
  static getFieldPrefix(fieldName) {
    const prefix = (fieldName || '').substring(0, 2).toUpperCase();
    return FIELD_PREFIXES[prefix] || 'Unknown';
  }

  /**
   * Get the MI Program mapping for an M3 table.
   * @param {string} tableName - M3 table name
   * @returns {{ program: string, transaction: string, keyField: string }|null}
   */
  static getTableMapping(tableName) {
    return TABLE_PROGRAM_MAP[tableName.toUpperCase()] || null;
  }

  /**
   * Read table data from M3 via MI Program or direct database access.
   *
   * @param {string} tableName - M3 table name (e.g., 'MITMAS', 'OCUSMA')
   * @param {object} [opts={}] - Query options
   * @param {string[]} [opts.fields] - Fields to return
   * @param {string} [opts.filter] - Filter expression
   * @param {number} [opts.maxRows] - Maximum rows to return
   * @param {string} [opts.orderBy] - Sort expression
   * @returns {Promise<{ rows: object[], metadata: object }>}
   */
  async readTable(tableName, opts = {}) {
    if (this.mode === 'mock') {
      return this._mockReadTable(tableName, opts);
    }

    // Prefer database for table reads when available
    if (this.dbAdapter) {
      const fields = opts.fields ? opts.fields.join(', ') : '*';
      let sql = `SELECT ${fields} FROM ${tableName}`;
      const conditions = [];
      if (opts.filter) conditions.push(opts.filter);
      // Always filter by company
      conditions.push(`CONO = '${this.company}'`);
      sql += ` WHERE ${conditions.join(' AND ')}`;
      if (opts.orderBy) sql += ` ORDER BY ${opts.orderBy}`;
      if (opts.maxRows) sql += ` FETCH FIRST ${opts.maxRows} ROWS ONLY`;

      const result = await this.dbAdapter.query(sql);
      return {
        rows: result.rows,
        metadata: { tableName, company: this.company, rowCount: result.rowCount, source: 'database' },
      };
    }

    // Fall back to M3 API
    if (!this.m3Client) {
      throw new InforError('M3 live mode requires m3Client or dbAdapter');
    }

    const mapping = TABLE_PROGRAM_MAP[tableName.toUpperCase()];
    if (!mapping) {
      throw new InforError(`No MI Program mapping for table: ${tableName}. Known tables: ${Object.keys(TABLE_PROGRAM_MAP).join(', ')}`, { tableName });
    }

    const params = { CONO: this.company };
    if (this.division) params.DIVI = this.division;

    const result = await this.m3Client.execute(mapping.program, mapping.transaction, params);

    // Convert MIRecord NameValue pairs to flat objects
    const rows = (result.records || []).map(record => {
      if (record.NameValue) {
        const row = {};
        for (const nv of record.NameValue) {
          row[nv.Name] = nv.Value;
        }
        return row;
      }
      return record;
    });

    return {
      rows: opts.maxRows ? rows.slice(0, opts.maxRows) : rows,
      metadata: {
        tableName,
        company: this.company,
        program: mapping.program,
        transaction: mapping.transaction,
        rowCount: rows.length,
        source: 'mi-program',
      },
    };
  }

  /**
   * Call an M3 MI Program.
   *
   * @param {string} endpoint - Program/Transaction (e.g., 'MMS200/GetItm')
   * @param {object} [params={}] - Input parameters
   * @returns {Promise<object>}
   */
  async callApi(endpoint, params = {}) {
    if (this.mode === 'mock') {
      const [program, transaction] = endpoint.split('/');
      return { program, transaction, params, result: 'mock', mock: true };
    }

    if (!this.m3Client) {
      throw new InforError('callApi() requires m3Client for M3');
    }

    const [program, transaction] = endpoint.split('/');
    if (!program || !transaction) {
      throw new InforError(`Invalid M3 endpoint format: "${endpoint}". Expected "Program/Transaction"`, { endpoint });
    }

    return this.m3Client.execute(program, transaction, params);
  }

  /**
   * Query entities using MI Programs.
   *
   * @param {string} entityType - Entity type mapped to M3 table (e.g., 'MITMAS')
   * @param {string} [filter] - Filter expression
   * @param {object} [opts={}] - Query options
   * @returns {Promise<{ entities: object[], totalCount: number }>}
   */
  async queryEntities(entityType, filter, opts = {}) {
    const result = await this.readTable(entityType, { filter, maxRows: opts.maxRows || opts.top });
    return {
      entities: result.rows,
      totalCount: result.rows.length,
    };
  }

  /**
   * Get M3 system information via MRS001 MI Program or CMNFCN table.
   *
   * @returns {Promise<object>} System info with version, modules, company data
   */
  async getSystemInfo() {
    if (this.mode === 'mock') {
      return {
        product: 'Infor M3',
        company: this.company,
        companyName: 'M3 Main Company',
        division: this.division || 'AAA',
        currency: 'USD',
        version: '13.4',
        database: 'DB2',
        modules: ['MMS', 'OIS', 'PPS', 'GLS', 'CRS', 'MWS', 'APS', 'MNS'],
        fieldPrefixes: FIELD_PREFIXES,
        tableMappings: Object.keys(TABLE_PROGRAM_MAP),
        timestamp: new Date().toISOString(),
        mock: true,
      };
    }

    let companyInfo = {};

    // Try MI Program first
    if (this.m3Client) {
      try {
        const result = await this.m3Client.execute('MRS001', 'GetSystemData', { CONO: this.company });
        companyInfo = result.records?.[0] || {};
      } catch {
        this.log.warn('MRS001 not available, falling back to CMNFCN table');
      }
    }

    // Fallback to CMNFCN table
    if (Object.keys(companyInfo).length === 0) {
      try {
        const tableResult = await this.readTable('CMNFCN', { maxRows: 1 });
        companyInfo = tableResult.rows[0] || {};
      } catch {
        this.log.warn('CMNFCN table not accessible');
      }
    }

    return {
      product: 'Infor M3',
      company: this.company,
      companyName: companyInfo.CONM || companyInfo.CompanyName || '',
      division: this.division || companyInfo.DIVI || '',
      currency: companyInfo.CCUR || companyInfo.Currency || '',
      fieldPrefixes: FIELD_PREFIXES,
      tableMappings: Object.keys(TABLE_PROGRAM_MAP),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check for the M3 adapter.
   *
   * @returns {Promise<{ ok: boolean, latencyMs: number, status: string, product: string }>}
   */
  async healthCheck() {
    const start = Date.now();

    if (this.mode === 'mock') {
      return { ok: true, latencyMs: 1, status: 'mock', product: 'Infor M3', company: this.company };
    }

    try {
      if (this.m3Client) {
        const result = await this.m3Client.healthCheck();
        return { ...result, company: this.company };
      }
      // Fallback to DB health check
      await this.readTable('MITMAS', { maxRows: 1 });
      const latencyMs = Date.now() - start;
      return { ok: true, latencyMs, status: 'connected', product: 'Infor M3', company: this.company };
    } catch (err) {
      const latencyMs = Date.now() - start;
      return { ok: false, latencyMs, status: 'error', error: err.message, product: 'Infor M3' };
    }
  }

  // ── Private helpers ───────────────────────────────────────────────

  /**
   * Mock implementation for readTable().
   * @private
   */
  _mockReadTable(tableName, opts) {
    this.log.debug('Mock M3 readTable', { tableName, company: this.company });

    const rows = MOCK_TABLE_DATA[tableName.toUpperCase()] || [];
    let result = [...rows];

    if (opts.maxRows) {
      result = result.slice(0, opts.maxRows);
    }

    if (opts.fields) {
      result = result.map(row => {
        const filtered = {};
        for (const f of opts.fields) {
          if (f in row) filtered[f] = row[f];
        }
        return filtered;
      });
    }

    return {
      rows: result,
      metadata: {
        tableName,
        company: this.company,
        rowCount: result.length,
        source: 'mock',
      },
    };
  }
}

module.exports = M3Adapter;
