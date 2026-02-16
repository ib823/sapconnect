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
 * Universal Table Reader
 *
 * Reads SAP tables via RFC_READ_TABLE with automatic fallback,
 * streaming for large tables, field width handling, and WHERE clause safety.
 */

const { RfcError } = require('../errors');
const Logger = require('../logger');

const TABLE_READ_FMS = [
  '/SAPDS/RFC_READ_TABLE',
  'BBP_RFC_READ_TABLE',
  'RFC_READ_TABLE',
];

const MAX_ROW_WIDTH = 512;

class TableReadError extends RfcError {
  constructor(message, details) {
    super(message, details);
    this.name = 'TableReadError';
    this.code = 'ERR_TABLE_READ';
  }
}

class TableReader {
  /**
   * @param {import('./pool')} rfcPool
   * @param {object} [options]
   * @param {number} [options.chunkSize=10000] - Default rows per chunk
   * @param {string} [options.preferredFm] - Override FM selection
   * @param {object} [options.logger]
   */
  constructor(rfcPool, options = {}) {
    this.pool = rfcPool;
    this.chunkSize = options.chunkSize || 10000;
    this.preferredFm = options.preferredFm || null;
    this.log = options.logger || new Logger('table-reader');
    this._resolvedFm = null;
  }

  /**
   * Read a table (all matching rows up to maxRows).
   * @param {string} tableName
   * @param {object} [opts]
   * @param {string[]} [opts.fields] - Fields to select
   * @param {string} [opts.where] - WHERE clause
   * @param {number} [opts.maxRows] - Row limit (0 = all)
   * @param {number} [opts.rowSkip] - Skip first N rows
   * @returns {{ rows: object[], totalRows: number, fields: string[] }}
   */
  async readTable(tableName, opts = {}) {
    const client = await this.pool.acquire();
    try {
      const fm = await this._resolveFm(client);
      const params = this._buildParams(tableName, opts);
      const result = await client.call(fm, params);
      const parsed = this._parseResult(result);
      return parsed;
    } catch (err) {
      if (err instanceof RfcError) throw err;
      throw new TableReadError(`Failed to read table ${tableName}: ${err.message}`, {
        table: tableName,
        original: err.message,
      });
    } finally {
      await this.pool.release(client);
    }
  }

  /**
   * Stream a table in chunks via AsyncGenerator.
   * @param {string} tableName
   * @param {object} [opts]
   * @param {string[]} [opts.fields] - Fields to select
   * @param {string} [opts.where] - WHERE clause
   * @param {number} [opts.chunkSize] - Rows per chunk
   * @yields {{ rows: object[], chunk: number, offset: number }}
   */
  async *streamTable(tableName, opts = {}) {
    const chunkSize = opts.chunkSize || this.chunkSize;
    let offset = 0;
    let chunk = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await this.readTable(tableName, {
        ...opts,
        maxRows: chunkSize,
        rowSkip: offset,
      });

      if (result.rows.length > 0) {
        yield { rows: result.rows, chunk, offset, fields: result.fields };
        offset += result.rows.length;
        chunk++;
      }

      hasMore = result.rows.length === chunkSize;
    }
  }

  /**
   * Get row count for a table.
   * @param {string} tableName
   * @param {object} [opts]
   * @param {string} [opts.where] - WHERE clause
   * @returns {number}
   */
  async getRowCount(tableName, opts = {}) {
    const client = await this.pool.acquire();
    try {
      const fm = await this._resolveFm(client);
      const params = {
        QUERY_TABLE: tableName,
        DELIMITER: '|',
        NO_DATA: 'X',
        OPTIONS: opts.where ? [{ TEXT: opts.where }] : [],
      };
      const result = await client.call(fm, params);
      // Row count from DATA table length or from a separate query
      return (result.DATA || []).length || 0;
    } finally {
      await this.pool.release(client);
    }
  }

  /**
   * Get table metadata from DD03L.
   * @param {string} tableName
   * @returns {{ fields: Array<{ name, type, length, decimals, description }> }}
   */
  async getTableMetadata(tableName) {
    const result = await this.readTable('DD03L', {
      fields: ['FIELDNAME', 'DATATYPE', 'LENG', 'DECIMALS', 'ROLLNAME'],
      where: `TABNAME = '${this._sanitize(tableName)}'`,
    });
    return {
      table: tableName,
      fields: result.rows.map(r => ({
        name: (r.FIELDNAME || '').trim(),
        type: (r.DATATYPE || '').trim(),
        length: parseInt(r.LENG, 10) || 0,
        decimals: parseInt(r.DECIMALS, 10) || 0,
        rollname: (r.ROLLNAME || '').trim(),
      })).filter(f => f.name && !f.name.startsWith('.')),
    };
  }

  _buildParams(tableName, opts) {
    const params = {
      QUERY_TABLE: tableName,
      DELIMITER: '|',
      ROWCOUNT: opts.maxRows || 0,
      ROWSKIPS: opts.rowSkip || 0,
    };

    if (opts.fields && opts.fields.length > 0) {
      params.FIELDS = opts.fields.map(f => ({ FIELDNAME: f }));
    }

    if (opts.where) {
      // Split long WHERE clauses into 72-char lines (RFC_READ_TABLE limit)
      const lines = this._splitWhereClause(opts.where);
      params.OPTIONS = lines.map(text => ({ TEXT: text }));
    } else {
      params.OPTIONS = [];
    }

    return params;
  }

  _parseResult(result) {
    const fieldInfo = (result.FIELDS || []).map(f => ({
      name: (f.FIELDNAME || '').trim(),
      offset: parseInt(f.OFFSET, 10) || 0,
      length: parseInt(f.LENGTH, 10) || 0,
      type: (f.TYPE || '').trim(),
    }));

    const fields = fieldInfo.map(f => f.name);
    const rows = (result.DATA || []).map(row => {
      const wa = row.WA || '';
      const record = {};
      for (const fi of fieldInfo) {
        record[fi.name] = wa.substring(fi.offset, fi.offset + fi.length).trim();
      }
      return record;
    });

    return { rows, fields, totalRows: rows.length };
  }

  _splitWhereClause(where) {
    const maxLen = 72;
    if (where.length <= maxLen) return [where];
    const lines = [];
    let remaining = where;
    while (remaining.length > 0) {
      if (remaining.length <= maxLen) {
        lines.push(remaining);
        break;
      }
      // Try to split at a space near the limit
      let splitAt = remaining.lastIndexOf(' ', maxLen);
      if (splitAt <= 0) splitAt = maxLen;
      lines.push(remaining.substring(0, splitAt));
      remaining = remaining.substring(splitAt).trimStart();
    }
    return lines;
  }

  _sanitize(value) {
    // Prevent injection in WHERE clauses
    return value.replace(/[';\\]/g, '');
  }

  async _resolveFm(client) {
    if (this.preferredFm) return this.preferredFm;
    if (this._resolvedFm) return this._resolvedFm;

    for (const fm of TABLE_READ_FMS) {
      try {
        await client.call(fm, {
          QUERY_TABLE: 'T000',
          DELIMITER: '|',
          ROWCOUNT: 1,
          OPTIONS: [],
        });
        this._resolvedFm = fm;
        this.log.info(`Using table read FM: ${fm}`);
        return fm;
      } catch {
        continue;
      }
    }

    // Default to last option
    this._resolvedFm = TABLE_READ_FMS[TABLE_READ_FMS.length - 1];
    this.log.warn(`No table read FM verified, defaulting to ${this._resolvedFm}`);
    return this._resolvedFm;
  }
}

module.exports = { TableReader, TableReadError };
