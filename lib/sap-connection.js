/**
 * SAP Connection Manager
 *
 * High-level factory for creating authenticated OData clients
 * from environment variables or config files.
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

    this.log.info(`Connected to ${this.baseUrl} (${this.version})`);
    return this._client;
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

  // ── Private helpers ──────────────────────────────────────────

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
