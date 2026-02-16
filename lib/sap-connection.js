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
 * SAP Connection Manager
 *
 * High-level factory for creating authenticated OData clients
 * from environment variables or config files. Includes health
 * checks, connection status tracking, and telemetry.
 */

const fs = require('fs');
const path = require('path');
const ODataClient = require('./odata/client');
const {
  BasicAuthProvider,
  OAuth2ClientCredentialsProvider,
  OAuth2SAMLBearerProvider,
} = require('./odata/auth');
const { ConnectionError } = require('./errors');
const Logger = require('./logger');

// ─────────────────────────────────────────────────────────────────────────────
// Connection Status
// ─────────────────────────────────────────────────────────────────────────────

const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTED: 'connected',
  DEGRADED: 'degraded',
};

class SapConnection {
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.baseUrl = options.baseUrl;
    this.authProvider = options.authProvider;
    this.version = options.version || 'v2';
    this.timeout = options.timeout || 30000;
    this.retries = options.retries ?? 3;
    this.log = options.logger || new Logger('sap-connection');
    this._client = null;

    // Connection status tracking
    this._status = CONNECTION_STATUS.DISCONNECTED;
    this._lastPingAt = null;
    this._lastPingLatency = null;

    // Telemetry
    this._telemetry = {
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      latencies: [],
      lastError: null,
      connectedSince: null,
    };
  }

  /** Current connection status */
  get status() {
    return this._status;
  }

  /**
   * Build a SapConnection from environment variables.
   *
   * Required: SAP_BASE_URL
   * Auth (Basic): SAP_USERNAME, SAP_PASSWORD
   * Auth (OAuth2): SAP_TOKEN_URL, SAP_CLIENT_ID, SAP_CLIENT_SECRET
   */
  static fromEnv(options = {}) {
    const baseUrl = process.env.SAP_BASE_URL;
    if (!baseUrl) {
      throw new ConnectionError('SAP_BASE_URL environment variable is required');
    }

    const authProvider = SapConnection._buildAuthFromEnv();

    return new SapConnection({
      name: 'env',
      baseUrl,
      authProvider,
      version: process.env.SAP_ODATA_VERSION || 'v2',
      timeout: parseInt(process.env.SAP_TIMEOUT, 10) || 30000,
      ...options,
    });
  }

  /**
   * Build a SapConnection from a JSON config file.
   *
   * @param {string} configPath - Path to .sapconnect.json
   * @param {string} [connectionName='source'] - Which connection block to use
   */
  static fromConfig(configPath, connectionName = 'source') {
    const absPath = path.resolve(configPath);
    if (!fs.existsSync(absPath)) {
      throw new ConnectionError(`Config file not found: ${absPath}`);
    }

    const config = JSON.parse(fs.readFileSync(absPath, 'utf8'));
    const connConfig = config[connectionName];

    if (!connConfig) {
      throw new ConnectionError(
        `Connection "${connectionName}" not found in ${absPath}. ` +
        `Available: ${Object.keys(config).join(', ')}`
      );
    }

    const authProvider = SapConnection._buildAuthFromConfig(connConfig);

    return new SapConnection({
      name: connectionName,
      baseUrl: connConfig.baseUrl,
      authProvider,
      version: connConfig.odataVersion || 'v2',
      timeout: connConfig.timeout || 30000,
    });
  }

  /**
   * Build multiple SapConnections from prefixed environment variables.
   * Reads SAP_SOURCE_<N>_BASE_URL, SAP_SOURCE_<N>_USERNAME, etc.
   *
   * @returns {Map<string, SapConnection>} Map of system name → connection
   */
  static fromMultiEnv() {
    const connections = new Map();
    const prefix = 'SAP_SOURCE_';

    // Find all unique source system indices
    const indices = new Set();
    for (const key of Object.keys(process.env)) {
      const match = key.match(new RegExp(`^${prefix}(\\d+)_`));
      if (match) {
        indices.add(match[1]);
      }
    }

    for (const idx of indices) {
      const envPrefix = `${prefix}${idx}_`;
      const baseUrl = process.env[`${envPrefix}BASE_URL`];
      if (!baseUrl) continue;

      const name = process.env[`${envPrefix}NAME`] || `source_${idx}`;

      // Build auth from prefixed env vars
      const username = process.env[`${envPrefix}USERNAME`];
      const password = process.env[`${envPrefix}PASSWORD`];
      const tokenUrl = process.env[`${envPrefix}TOKEN_URL`];
      const clientId = process.env[`${envPrefix}CLIENT_ID`];
      const clientSecret = process.env[`${envPrefix}CLIENT_SECRET`];

      let authProvider;
      if (tokenUrl && clientId) {
        authProvider = new OAuth2ClientCredentialsProvider(tokenUrl, clientId, clientSecret, '');
      } else if (username && password) {
        authProvider = new BasicAuthProvider(username, password);
      } else {
        continue; // Skip connections without auth
      }

      connections.set(name, new SapConnection({
        name,
        baseUrl,
        authProvider,
        version: process.env[`${envPrefix}ODATA_VERSION`] || 'v2',
        timeout: parseInt(process.env[`${envPrefix}TIMEOUT`], 10) || 30000,
      }));
    }

    return connections;
  }

  /**
   * Initialize OData client and verify connectivity.
   * @returns {ODataClient}
   */
  async connect() {
    this._client = new ODataClient({
      baseUrl: this.baseUrl,
      authProvider: this.authProvider,
      version: this.version,
      timeout: this.timeout,
      retries: this.retries,
      logger: this.log,
    });

    this._status = CONNECTION_STATUS.CONNECTED;
    this._telemetry.connectedSince = new Date().toISOString();
    this.log.info(`Connected to ${this.baseUrl} (${this.version})`);
    return this._client;
  }

  /**
   * Lightweight health check. Fetches OData service document ($metadata)
   * and updates connection status based on the result.
   *
   * @returns {{ ok: boolean, latencyMs: number, status: string, error?: string }}
   */
  async ping() {
    if (!this._client) {
      await this.connect();
    }

    const start = Date.now();
    this._telemetry.totalRequests++;

    try {
      await this._client.get('/sap/opu/odata/sap/', {});
      const latencyMs = Date.now() - start;

      this._telemetry.successCount++;
      this._recordLatency(latencyMs);
      this._lastPingAt = new Date().toISOString();
      this._lastPingLatency = latencyMs;

      // Determine status based on latency
      if (latencyMs > this.timeout * 0.8) {
        this._status = CONNECTION_STATUS.DEGRADED;
      } else {
        this._status = CONNECTION_STATUS.CONNECTED;
      }

      return { ok: true, latencyMs, status: this._status };
    } catch (err) {
      const latencyMs = Date.now() - start;
      this._telemetry.errorCount++;
      this._telemetry.lastError = { message: err.message, timestamp: new Date().toISOString() };
      this._lastPingAt = new Date().toISOString();
      this._lastPingLatency = latencyMs;

      // Check if degraded vs fully disconnected
      if (this._telemetry.successCount > 0 && this._telemetry.errorCount < 3) {
        this._status = CONNECTION_STATUS.DEGRADED;
      } else {
        this._status = CONNECTION_STATUS.DISCONNECTED;
      }

      return { ok: false, latencyMs, status: this._status, error: err.message };
    }
  }

  /**
   * Test connectivity by fetching a lightweight endpoint.
   * @returns {{ ok: boolean, latencyMs: number, error?: string }}
   */
  async testConnection() {
    if (!this._client) {
      await this.connect();
    }

    const start = Date.now();
    try {
      // Try fetching OData service document — lightweight, always available
      await this._client.get('/sap/opu/odata/sap/', {});
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, error: err.message };
    }
  }

  /**
   * Get the OData client (connect first if needed).
   */
  async getClient() {
    if (!this._client) {
      await this.connect();
    }
    return this._client;
  }

  /**
   * Get connection telemetry snapshot.
   *
   * @returns {{ totalRequests: number, successCount: number, errorCount: number,
   *             errorRate: number, avgLatencyMs: number, p95LatencyMs: number,
   *             p99LatencyMs: number, lastError: object|null, connectedSince: string|null,
   *             status: string, lastPingAt: string|null }}
   */
  getTelemetry() {
    const latencies = this._telemetry.latencies;
    const sorted = [...latencies].sort((a, b) => a - b);

    return {
      name: this.name,
      status: this._status,
      totalRequests: this._telemetry.totalRequests,
      successCount: this._telemetry.successCount,
      errorCount: this._telemetry.errorCount,
      errorRate: this._telemetry.totalRequests > 0
        ? this._telemetry.errorCount / this._telemetry.totalRequests
        : 0,
      avgLatencyMs: sorted.length > 0
        ? Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length)
        : 0,
      p95LatencyMs: sorted.length > 0
        ? sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1]
        : 0,
      p99LatencyMs: sorted.length > 0
        ? sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1]
        : 0,
      lastError: this._telemetry.lastError,
      connectedSince: this._telemetry.connectedSince,
      lastPingAt: this._lastPingAt,
    };
  }

  /**
   * Create an RFC connection pool for direct table reads.
   * Returns null when node-rfc is not installed (Public Cloud mode).
   *
   * RFC params from env: SAP_RFC_ASHOST, SAP_RFC_SYSNR, SAP_RFC_CLIENT,
   * SAP_RFC_USER, SAP_RFC_PASSWD, SAP_RFC_LANG, SAP_RFC_ROUTER
   *
   * @param {object} [options] - Pool options (poolSize, acquireTimeout)
   * @returns {import('./rfc/pool')|null}
   */
  createRfcPool(options = {}) {
    try {
      require('node-rfc');
    } catch {
      this.log.warn('node-rfc not installed — RFC connectivity unavailable (Public Cloud mode)');
      return null;
    }

    const RfcPool = require('./rfc/pool');

    const connectionParams = {
      client: process.env.SAP_RFC_CLIENT || '100',
      user: process.env.SAP_RFC_USER || process.env.SAP_USERNAME,
      passwd: process.env.SAP_RFC_PASSWD || process.env.SAP_PASSWORD,
      lang: process.env.SAP_RFC_LANG || 'EN',
    };

    // Load-balanced connection (message server)
    if (process.env.SAP_RFC_MSHOST) {
      connectionParams.mshost = process.env.SAP_RFC_MSHOST;
      if (process.env.SAP_RFC_MSSERV) connectionParams.msserv = process.env.SAP_RFC_MSSERV;
      if (process.env.SAP_RFC_GROUP) connectionParams.group = process.env.SAP_RFC_GROUP;
      if (process.env.SAP_RFC_R3NAME) connectionParams.r3name = process.env.SAP_RFC_R3NAME;
    } else {
      // Direct connection
      connectionParams.ashost = process.env.SAP_RFC_ASHOST || this.baseUrl?.replace(/^https?:\/\//, '').split(':')[0];
      connectionParams.sysnr = process.env.SAP_RFC_SYSNR || '00';
    }

    // SAP Router
    if (process.env.SAP_RFC_ROUTER) {
      connectionParams.saprouter = process.env.SAP_RFC_ROUTER;
    }

    return new RfcPool(connectionParams, {
      poolSize: options.poolSize || 5,
      acquireTimeout: options.acquireTimeout || 10000,
      callTimeout: this.timeout,
      logger: this.log.child('rfc-pool'),
    });
  }

  // ── Private helpers ──────────────────────────────────────────

  /**
   * Record a latency measurement, keeping at most 1000 samples.
   */
  _recordLatency(ms) {
    this._telemetry.latencies.push(ms);
    if (this._telemetry.latencies.length > 1000) {
      this._telemetry.latencies.shift();
    }
  }

  static _buildAuthFromEnv() {
    // OAuth2 takes precedence if token URL is set
    if (process.env.SAP_TOKEN_URL) {
      return new OAuth2ClientCredentialsProvider(
        process.env.SAP_TOKEN_URL,
        process.env.SAP_CLIENT_ID,
        process.env.SAP_CLIENT_SECRET,
        process.env.SAP_SCOPE || ''
      );
    }

    // SAML bearer
    if (process.env.SAP_SAML_ASSERTION) {
      return new OAuth2SAMLBearerProvider(
        process.env.SAP_TOKEN_URL,
        process.env.SAP_CLIENT_ID,
        process.env.SAP_CLIENT_SECRET,
        process.env.SAP_SAML_ASSERTION
      );
    }

    // Basic auth
    if (process.env.SAP_USERNAME && process.env.SAP_PASSWORD) {
      return new BasicAuthProvider(process.env.SAP_USERNAME, process.env.SAP_PASSWORD);
    }

    throw new ConnectionError(
      'No auth credentials found. Set SAP_USERNAME/SAP_PASSWORD or SAP_TOKEN_URL/SAP_CLIENT_ID/SAP_CLIENT_SECRET'
    );
  }

  static _buildAuthFromConfig(connConfig) {
    const auth = connConfig.auth || {};

    if (auth.type === 'oauth2') {
      return new OAuth2ClientCredentialsProvider(
        auth.tokenUrl,
        auth.clientId,
        auth.clientSecret,
        auth.scope || ''
      );
    }

    if (auth.type === 'saml-bearer') {
      return new OAuth2SAMLBearerProvider(
        auth.tokenUrl,
        auth.clientId,
        auth.clientSecret,
        auth.assertion
      );
    }

    // Default: basic auth
    if (auth.username && auth.password) {
      return new BasicAuthProvider(auth.username, auth.password);
    }

    if (connConfig.username && connConfig.password) {
      return new BasicAuthProvider(connConfig.username, connConfig.password);
    }

    throw new ConnectionError(
      `No auth configuration found for connection. ` +
      `Provide auth.type ('basic', 'oauth2', 'saml-bearer') with credentials.`
    );
  }
}

module.exports = SapConnection;
module.exports.CONNECTION_STATUS = CONNECTION_STATUS;
