'use strict';

/**
 * Generic SQL Database Adapter for Infor ERP Database Profiling
 *
 * Provides read-only SQL access to Infor ERP databases (LN on Oracle/DB2,
 * M3 on DB2/SQL Server, CSI on SQL Server, Lawson on Oracle/SQL Server).
 *
 * ALWAYS enforces read-only operation by rejecting any non-SELECT statements.
 * This adapter is used for database profiling during competitive displacement
 * migrations -- table structure discovery, row counts, column statistics,
 * and data sampling.
 *
 * In mock mode, returns synthetic data without an actual database connection.
 * Database drivers (mssql, oracledb, ibm_db, pg) are loaded dynamically and
 * gracefully degrade when unavailable.
 */

const Logger = require('../logger');
const { InforDbError } = require('../errors');
const { ResilientExecutor } = require('../resilience');

/** @private Forbidden SQL keywords (write operations) */
const WRITE_KEYWORDS = /^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|MERGE|EXEC|EXECUTE|GRANT|REVOKE|CALL)\b/i;

/** @private Driver-specific table listing queries */
const TABLE_LIST_QUERIES = {
  sqlserver: "SELECT TABLE_SCHEMA + '.' + TABLE_NAME AS TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_SCHEMA, TABLE_NAME",
  oracle: "SELECT OWNER || '.' || TABLE_NAME AS TABLE_NAME FROM ALL_TABLES WHERE OWNER NOT IN ('SYS','SYSTEM','OUTLN','DBSNMP') ORDER BY OWNER, TABLE_NAME",
  db2: "SELECT TABSCHEMA || '.' || TABNAME AS TABLE_NAME FROM SYSCAT.TABLES WHERE TYPE = 'T' AND TABSCHEMA NOT LIKE 'SYS%' ORDER BY TABSCHEMA, TABNAME",
  postgres: "SELECT table_schema || '.' || table_name AS TABLE_NAME FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY table_schema, table_name",
};

/** @private Driver-specific column metadata queries */
const COLUMN_QUERIES = {
  sqlserver: (tableName) => `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH AS MAX_LENGTH, IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}' ORDER BY ORDINAL_POSITION`,
  oracle: (tableName) => `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH AS MAX_LENGTH, NULLABLE AS IS_NULLABLE, DATA_DEFAULT AS COLUMN_DEFAULT FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = '${tableName.toUpperCase()}' ORDER BY COLUMN_ID`,
  db2: (tableName) => `SELECT COLNAME AS COLUMN_NAME, TYPENAME AS DATA_TYPE, LENGTH AS MAX_LENGTH, NULLS AS IS_NULLABLE, DEFAULT AS COLUMN_DEFAULT FROM SYSCAT.COLUMNS WHERE TABNAME = '${tableName.toUpperCase()}' ORDER BY COLNO`,
  postgres: (tableName) => `SELECT column_name AS COLUMN_NAME, data_type AS DATA_TYPE, character_maximum_length AS MAX_LENGTH, is_nullable AS IS_NULLABLE, column_default AS COLUMN_DEFAULT FROM information_schema.columns WHERE table_name = '${tableName}' ORDER BY ordinal_position`,
};

/** @private Driver-specific row count queries */
const COUNT_QUERIES = {
  sqlserver: (tableName) => `SELECT COUNT_BIG(*) AS cnt FROM ${tableName}`,
  oracle: (tableName) => `SELECT COUNT(*) AS cnt FROM ${tableName}`,
  db2: (tableName) => `SELECT COUNT(*) AS cnt FROM ${tableName}`,
  postgres: (tableName) => `SELECT COUNT(*) AS cnt FROM ${tableName}`,
};

/** @private Driver-specific top-N queries */
const TOP_N_QUERIES = {
  sqlserver: (tableName, n) => `SELECT TOP ${n} * FROM ${tableName}`,
  oracle: (tableName, n) => `SELECT * FROM ${tableName} WHERE ROWNUM <= ${n}`,
  db2: (tableName, n) => `SELECT * FROM ${tableName} FETCH FIRST ${n} ROWS ONLY`,
  postgres: (tableName, n) => `SELECT * FROM ${tableName} LIMIT ${n}`,
};

/** @private Mock table catalog */
const MOCK_TABLES = [
  'ITEM_MASTER', 'CUSTOMER_MASTER', 'VENDOR_MASTER',
  'PURCHASE_ORDER_HEADER', 'PURCHASE_ORDER_LINE',
  'SALES_ORDER_HEADER', 'SALES_ORDER_LINE',
  'GL_ACCOUNT', 'GL_JOURNAL', 'GL_BALANCE',
  'INVENTORY_LOCATION', 'INVENTORY_TRANSACTION',
  'BOM_HEADER', 'BOM_COMPONENT',
];

class InforDbAdapter {
  /**
   * @param {object} config
   * @param {string} config.type - Database type: 'oracle', 'sqlserver', 'db2', 'postgres'
   * @param {string} [config.connectionString] - Full connection string (driver-specific)
   * @param {string} [config.host] - Database host
   * @param {number} [config.port] - Database port
   * @param {string} [config.database] - Database name / SID
   * @param {string} [config.username] - Database username
   * @param {string} [config.password] - Database password
   * @param {boolean} [config.readOnly=true] - Enforce read-only mode (always true)
   * @param {string} [config.mode='live'] - 'live' or 'mock'
   * @param {object} [config.logger] - Logger instance
   * @param {object} [config.resilience] - ResilientExecutor options
   */
  constructor(config = {}) {
    this.type = (config.type || config.driver || 'sqlserver').toLowerCase();
    this.connectionString = config.connectionString || '';
    this.host = config.host || '';
    this.port = config.port || 0;
    this.database = config.database || '';
    this.username = config.username || '';
    this.password = config.password || '';
    this.readOnly = true; // Always enforced regardless of config
    this.mode = config.mode || 'live';
    this.log = config.logger || new Logger('infor-db');

    /** @private Native database connection pool */
    this._pool = null;
    this._connected = false;

    this._executor = new ResilientExecutor({
      retry: {
        maxRetries: 2,
        baseDelayMs: 500,
        maxDelayMs: 5000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ERR_INFOR_DB'],
        ...(config.resilience?.retry || {}),
      },
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeoutMs: 60000,
        ...(config.resilience?.circuitBreaker || {}),
      },
    });
  }

  /**
   * Execute a read-only SQL query.
   *
   * @param {string} sql - SQL SELECT statement
   * @param {object|Array} [params] - Query parameters (parameterized query)
   * @returns {Promise<{ rows: object[], rowCount: number }>}
   * @throws {InforDbError} If SQL is not a SELECT statement
   */
  async query(sql, params) {
    // ALWAYS enforce read-only: reject any write operations
    if (WRITE_KEYWORDS.test(sql)) {
      throw new InforDbError('Only SELECT statements are allowed (read-only mode)', {
        sql: sql.substring(0, 100),
        type: this.type,
      });
    }

    if (this.mode === 'mock') {
      return this._mockQuery(sql, params);
    }

    if (!this._connected || !this._pool) {
      throw new InforDbError('Database connection not established. Call connect() first.', {
        type: this.type,
      });
    }

    return this._executor.execute(async () => {
      let result;
      try {
        result = await this._executeQuery(sql, params);
      } catch (err) {
        throw new InforDbError(`SQL query failed: ${err.message}`, {
          sql: sql.substring(0, 200),
          type: this.type,
          original: err.message,
        });
      }

      const rows = result.recordset || result.rows || result || [];
      return { rows: Array.isArray(rows) ? rows : [], rowCount: Array.isArray(rows) ? rows.length : 0 };
    });
  }

  /**
   * Profile a database table -- returns column metadata, row count, sample data.
   *
   * @param {string} tableName - Fully qualified table name
   * @returns {Promise<object>} Table profile with columns, rowCount, sampleRows
   */
  async profileTable(tableName) {
    if (this.mode === 'mock') {
      return this._mockProfileTable(tableName);
    }

    // Get row count
    const countSql = (COUNT_QUERIES[this.type] || COUNT_QUERIES.sqlserver)(tableName);
    const countResult = await this.query(countSql);
    const rowCount = countResult.rows[0]?.cnt || countResult.rows[0]?.CNT || 0;

    // Get column metadata
    const shortName = tableName.includes('.') ? tableName.split('.').pop() : tableName;
    const columnSql = (COLUMN_QUERIES[this.type] || COLUMN_QUERIES.sqlserver)(shortName);
    let columns = [];
    try {
      const columnResult = await this.query(columnSql);
      columns = columnResult.rows.map(col => ({
        name: col.COLUMN_NAME || col.column_name,
        type: col.DATA_TYPE || col.data_type,
        maxLength: col.MAX_LENGTH || col.max_length || null,
        nullable: (col.IS_NULLABLE || col.is_nullable || '').toString().toUpperCase() !== 'NO',
        defaultValue: col.COLUMN_DEFAULT || col.column_default || null,
      }));
    } catch {
      this.log.warn('Could not retrieve column metadata', { tableName });
    }

    // Get sample rows
    const sampleSql = (TOP_N_QUERIES[this.type] || TOP_N_QUERIES.sqlserver)(tableName, 5);
    let sampleRows = [];
    try {
      const sampleResult = await this.query(sampleSql);
      sampleRows = sampleResult.rows;
    } catch {
      this.log.warn('Could not retrieve sample rows', { tableName });
    }

    return {
      tableName,
      rowCount: Number(rowCount),
      columns,
      sampleRows,
      databaseType: this.type,
    };
  }

  /**
   * Get the row count for a table.
   *
   * @param {string} tableName - Fully qualified table name
   * @returns {Promise<number>} Row count
   */
  async getTableRowCount(tableName) {
    if (this.mode === 'mock') {
      return 1500;
    }

    const sql = (COUNT_QUERIES[this.type] || COUNT_QUERIES.sqlserver)(tableName);
    const result = await this.query(sql);
    return Number(result.rows[0]?.cnt || result.rows[0]?.CNT || 0);
  }

  /**
   * Get column statistics for a specific column.
   *
   * @param {string} tableName - Fully qualified table name
   * @param {string} columnName - Column name
   * @returns {Promise<object>} Column statistics (min, max, distinctCount, nullCount, sampleValues)
   */
  async getColumnStats(tableName, columnName) {
    if (this.mode === 'mock') {
      return this._mockColumnStats(tableName, columnName);
    }

    const statsSql = `SELECT MIN(${columnName}) AS min_val, MAX(${columnName}) AS max_val, COUNT(DISTINCT ${columnName}) AS distinct_count, SUM(CASE WHEN ${columnName} IS NULL THEN 1 ELSE 0 END) AS null_count, COUNT(*) AS total_count FROM ${tableName}`;

    const result = await this.query(statsSql);
    const stats = result.rows[0] || {};

    // Get sample distinct values
    const sampleSql = (TOP_N_QUERIES[this.type] || TOP_N_QUERIES.sqlserver)(
      `(SELECT DISTINCT ${columnName} FROM ${tableName})`, 10
    );
    let sampleValues = [];
    try {
      const sampleResult = await this.query(sampleSql);
      sampleValues = sampleResult.rows.map(r => r[columnName] || r[Object.keys(r)[0]]);
    } catch {
      // Some databases may not support subquery in TOP/LIMIT; fallback
      this.log.debug('Could not retrieve sample distinct values', { tableName, columnName });
    }

    return {
      tableName,
      columnName,
      min: stats.min_val || stats.MIN_VAL,
      max: stats.max_val || stats.MAX_VAL,
      distinctCount: Number(stats.distinct_count || stats.DISTINCT_COUNT || 0),
      nullCount: Number(stats.null_count || stats.NULL_COUNT || 0),
      totalCount: Number(stats.total_count || stats.TOTAL_COUNT || 0),
      sampleValues,
    };
  }

  /**
   * List all user tables in the database.
   *
   * @returns {Promise<string[]>} Array of table names
   */
  async listTables() {
    if (this.mode === 'mock') {
      return [...MOCK_TABLES];
    }

    const sql = TABLE_LIST_QUERIES[this.type] || TABLE_LIST_QUERIES.sqlserver;
    const result = await this.query(sql);
    return result.rows.map(r => r.TABLE_NAME || r.table_name || Object.values(r)[0]);
  }

  /**
   * Health check for the database connection.
   *
   * @returns {Promise<{ ok: boolean, latencyMs: number, status: string, error?: string }>}
   */
  async healthCheck() {
    const start = Date.now();

    if (this.mode === 'mock') {
      return { ok: true, latencyMs: 1, status: 'mock', product: 'Infor DB', databaseType: this.type };
    }

    try {
      await this.query('SELECT 1 AS health');
      const latencyMs = Date.now() - start;
      return { ok: true, latencyMs, status: 'connected', product: 'Infor DB', databaseType: this.type };
    } catch (err) {
      const latencyMs = Date.now() - start;
      return { ok: false, latencyMs, status: 'error', error: err.message, product: 'Infor DB', databaseType: this.type };
    }
  }

  /**
   * Connect to the database. Dynamically loads the appropriate driver.
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.mode === 'mock') {
      this._connected = true;
      this.log.info('Mock database connection established', { type: this.type });
      return;
    }

    try {
      this._pool = await this._createPool();
      this._connected = true;
      this.log.info('Database connection established', { type: this.type, host: this.host, database: this.database });
    } catch (err) {
      throw new InforDbError(`Failed to connect to database: ${err.message}`, {
        type: this.type,
        host: this.host,
        database: this.database,
        original: err.message,
      });
    }
  }

  /**
   * Disconnect from the database.
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this._pool) {
      try {
        if (typeof this._pool.close === 'function') {
          await this._pool.close();
        } else if (typeof this._pool.end === 'function') {
          await this._pool.end();
        }
      } catch (err) {
        this.log.warn('Error closing database connection', { error: err.message });
      }
    }
    this._pool = null;
    this._connected = false;
    this.log.info('Database connection closed', { type: this.type });
  }

  /**
   * Get circuit breaker stats for monitoring.
   * @returns {object}
   */
  getCircuitBreakerStats() {
    return this._executor.circuitBreaker.getStats();
  }

  /** @returns {boolean} */
  get isConnected() {
    return this._connected;
  }

  // ── Private helpers ───────────────────────────────────────────────

  /**
   * Create a database connection pool based on the configured driver type.
   * @private
   */
  async _createPool() {
    switch (this.type) {
      case 'sqlserver': {
        const mssql = InforDbAdapter._loadDriver('mssql');
        const pool = new mssql.ConnectionPool({
          server: this.host,
          port: this.port || 1433,
          database: this.database,
          user: this.username,
          password: this.password,
          options: { encrypt: false, trustServerCertificate: true },
          connectionTimeout: 15000,
          requestTimeout: 30000,
        });
        await pool.connect();
        return pool;
      }
      case 'oracle': {
        const oracledb = InforDbAdapter._loadDriver('oracledb');
        return oracledb.createPool({
          user: this.username,
          password: this.password,
          connectString: this.connectionString || `${this.host}:${this.port || 1521}/${this.database}`,
          poolMin: 1,
          poolMax: 5,
        });
      }
      case 'db2': {
        const ibmdb = InforDbAdapter._loadDriver('ibm_db');
        const connStr = this.connectionString ||
          `DATABASE=${this.database};HOSTNAME=${this.host};PORT=${this.port || 50000};PROTOCOL=TCPIP;UID=${this.username};PWD=${this.password}`;
        return new Promise((resolve, reject) => {
          ibmdb.open(connStr, (err, conn) => {
            if (err) reject(err);
            else resolve(conn);
          });
        });
      }
      case 'postgres': {
        const { Pool } = InforDbAdapter._loadDriver('pg');
        const pool = new Pool({
          host: this.host,
          port: this.port || 5432,
          database: this.database,
          user: this.username,
          password: this.password,
        });
        // Test the connection
        const client = await pool.connect();
        client.release();
        return pool;
      }
      default:
        throw new InforDbError(`Unsupported database type: ${this.type}`, { type: this.type });
    }
  }

  /**
   * Execute a query using the appropriate driver API.
   * @private
   */
  async _executeQuery(sql, params) {
    switch (this.type) {
      case 'sqlserver': {
        const request = this._pool.request();
        if (params && typeof params === 'object') {
          for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
          }
        }
        return request.query(sql);
      }
      case 'oracle': {
        const conn = await this._pool.getConnection();
        try {
          const result = await conn.execute(sql, params || {}, { outFormat: 2 /* oracledb.OUT_FORMAT_OBJECT */ });
          return { rows: result.rows || [] };
        } finally {
          await conn.close();
        }
      }
      case 'db2': {
        return new Promise((resolve, reject) => {
          this._pool.query(sql, params || [], (err, rows) => {
            if (err) reject(err);
            else resolve({ rows: rows || [] });
          });
        });
      }
      case 'postgres': {
        const result = await this._pool.query(sql, params ? Object.values(params) : undefined);
        return { rows: result.rows || [] };
      }
      default:
        throw new InforDbError(`Unsupported database type: ${this.type}`, { type: this.type });
    }
  }

  /**
   * Dynamically load a database driver, with a clear error message if missing.
   * @private
   * @param {string} driverName
   * @returns {object}
   */
  static _loadDriver(driverName) {
    try {
      return require(driverName);
    } catch {
      throw new InforDbError(
        `Database driver '${driverName}' is not installed. Install it with: npm install ${driverName}`,
        { driver: driverName }
      );
    }
  }

  /**
   * Mock implementation for query().
   * @private
   */
  _mockQuery(sql, params) {
    this.log.debug('Mock SQL query', { sql: sql.substring(0, 100) });

    // Parse COUNT queries
    const countMatch = sql.match(/SELECT\s+COUNT\S*\s*\(\s*\*?\s*\)/i);
    if (countMatch) {
      return { rows: [{ cnt: 1500 }], rowCount: 1 };
    }

    // Parse MIN/MAX/COUNT (column stats)
    const statsMatch = sql.match(/SELECT\s+MIN\s*\(/i);
    if (statsMatch) {
      return {
        rows: [{
          min_val: '100',
          max_val: '9999',
          distinct_count: 850,
          null_count: 12,
          total_count: 1500,
        }],
        rowCount: 1,
      };
    }

    // Parse DISTINCT queries
    if (sql.match(/SELECT\s+DISTINCT/i)) {
      return {
        rows: [
          { value: 'Value_A' },
          { value: 'Value_B' },
          { value: 'Value_C' },
        ],
        rowCount: 3,
      };
    }

    // Default: return generic sample rows
    return {
      rows: [
        { COL1: 'value1', COL2: 100, COL3: '2024-01-15', STATUS: 'Active' },
        { COL1: 'value2', COL2: 200, COL3: '2024-02-20', STATUS: 'Active' },
        { COL1: 'value3', COL2: 300, COL3: '2024-03-25', STATUS: 'Inactive' },
      ],
      rowCount: 3,
    };
  }

  /**
   * Mock implementation for profileTable().
   * @private
   */
  _mockProfileTable(tableName) {
    return {
      tableName,
      rowCount: 1500,
      columns: [
        { name: 'ID', type: 'INT', maxLength: null, nullable: false, defaultValue: null },
        { name: 'NAME', type: 'VARCHAR', maxLength: 100, nullable: false, defaultValue: null },
        { name: 'STATUS', type: 'VARCHAR', maxLength: 20, nullable: true, defaultValue: "'Active'" },
        { name: 'AMOUNT', type: 'DECIMAL', maxLength: null, nullable: true, defaultValue: '0' },
        { name: 'CREATED_DATE', type: 'DATETIME', maxLength: null, nullable: true, defaultValue: null },
      ],
      sampleRows: [
        { ID: 1, NAME: 'Sample Record 1', STATUS: 'Active', AMOUNT: 1500.00, CREATED_DATE: '2024-01-15' },
        { ID: 2, NAME: 'Sample Record 2', STATUS: 'Active', AMOUNT: 2800.50, CREATED_DATE: '2024-02-20' },
      ],
      databaseType: this.type,
      mock: true,
    };
  }

  /**
   * Mock implementation for getColumnStats().
   * @private
   */
  _mockColumnStats(tableName, columnName) {
    return {
      tableName,
      columnName,
      min: '100',
      max: '9999',
      distinctCount: 850,
      nullCount: 12,
      totalCount: 1500,
      sampleValues: ['Value_A', 'Value_B', 'Value_C', 'Value_D', 'Value_E'],
      mock: true,
    };
  }
}

module.exports = InforDbAdapter;
