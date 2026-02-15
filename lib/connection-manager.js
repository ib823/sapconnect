/**
 * Connection Manager — Multi-source SAP connection orchestration.
 *
 * Manages named SAP connections (source, target, sandbox) with:
 *   - Profile-based configuration (JSON/env)
 *   - Aggregate health monitoring
 *   - Connection pooling and lifecycle
 *   - Coordinated operations across connections
 *
 * Usage:
 *   const mgr = new ConnectionManager();
 *   mgr.addProfile('source', { baseUrl: '...', auth: { ... } });
 *   mgr.addProfile('target', { baseUrl: '...', auth: { ... } });
 *   await mgr.connectAll();
 *   const sourceClient = mgr.get('source').getClient();
 */

const SapConnection = require('./sap-connection');
const { CONNECTION_STATUS } = require('./sap-connection');
const { ConnectionError } = require('./errors');
const Logger = require('./logger');

class ConnectionManager {
  constructor(options = {}) {
    this._connections = new Map();
    this._profiles = new Map();
    this._log = options.logger || new Logger('connection-manager');
  }

  /**
   * Add a connection profile.
   * @param {string} name — Profile name (e.g. 'source', 'target', 'sandbox')
   * @param {object} config — Connection config { baseUrl, auth, version, timeout, ... }
   */
  addProfile(name, config) {
    this._profiles.set(name, { ...config, name });
    this._log.debug(`Profile added: ${name}`);
  }

  /**
   * Load profiles from a config object.
   * @param {object} profiles — { source: { ... }, target: { ... } }
   */
  loadProfiles(profiles) {
    for (const [name, config] of Object.entries(profiles)) {
      this.addProfile(name, config);
    }
  }

  /**
   * Load profiles from environment variables.
   * Reads SAP_CONN_{NAME}_{PROP} pattern.
   * e.g. SAP_CONN_SOURCE_BASE_URL, SAP_CONN_SOURCE_USERNAME
   */
  loadFromEnv() {
    const PREFIX = 'SAP_CONN_';
    const envProfiles = {};

    for (const [key, value] of Object.entries(process.env)) {
      if (!key.startsWith(PREFIX)) continue;
      const rest = key.slice(PREFIX.length);
      const underscoreIdx = rest.indexOf('_');
      if (underscoreIdx === -1) continue;

      const name = rest.slice(0, underscoreIdx).toLowerCase();
      const prop = rest.slice(underscoreIdx + 1).toLowerCase();

      if (!envProfiles[name]) envProfiles[name] = {};

      // Map env var names to config properties
      const propMap = {
        base_url: 'baseUrl',
        username: 'username',
        password: 'password',
        version: 'version',
        timeout: 'timeout',
        client: 'sapClient',
        token_url: 'tokenUrl',
        client_id: 'clientId',
        client_secret: 'clientSecret',
      };

      const mappedProp = propMap[prop] || prop;
      envProfiles[name][mappedProp] = value;
    }

    for (const [name, config] of Object.entries(envProfiles)) {
      // Build auth config from flat properties
      if (config.tokenUrl) {
        config.auth = {
          type: 'oauth2',
          tokenUrl: config.tokenUrl,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
        };
      } else if (config.username) {
        config.auth = {
          type: 'basic',
          username: config.username,
          password: config.password,
        };
      }
      this.addProfile(name, config);
    }

    return Object.keys(envProfiles);
  }

  /**
   * Get or create a connection by name.
   * @param {string} name
   * @returns {SapConnection}
   */
  get(name) {
    if (this._connections.has(name)) {
      return this._connections.get(name);
    }

    const profile = this._profiles.get(name);
    if (!profile) {
      throw new ConnectionError(`No connection profile found for '${name}'`);
    }

    // Build auth provider from profile config
    const authProvider = SapConnection._buildAuthFromConfig(profile);
    const conn = new SapConnection({
      name,
      baseUrl: profile.baseUrl,
      authProvider,
      version: profile.version || 'v2',
      timeout: profile.timeout ? parseInt(profile.timeout, 10) : 30000,
    });
    this._connections.set(name, conn);
    return conn;
  }

  /**
   * Check if a named connection exists.
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this._profiles.has(name);
  }

  /**
   * List all profile names.
   * @returns {string[]}
   */
  listProfiles() {
    return Array.from(this._profiles.keys());
  }

  /**
   * Connect all profiled connections.
   * @returns {Map<string, {status: string, error?: string}>}
   */
  async connectAll() {
    const results = new Map();

    for (const name of this._profiles.keys()) {
      try {
        const conn = this.get(name);
        await conn.connect();
        results.set(name, { status: 'connected' });
        this._log.info(`Connected: ${name}`);
      } catch (err) {
        results.set(name, { status: 'error', error: err.message });
        this._log.warn(`Connection failed: ${name} — ${err.message}`);
      }
    }

    return results;
  }

  /**
   * Ping all connections and return health status.
   * @returns {object} — { overall, connections: { name: { status, latencyMs, ... } } }
   */
  async healthCheck() {
    const connections = {};
    let healthyCount = 0;
    let totalCount = 0;

    for (const name of this._profiles.keys()) {
      totalCount++;
      try {
        const conn = this.get(name);
        const pingResult = await conn.ping();
        connections[name] = {
          status: conn.status,
          latencyMs: pingResult.latencyMs,
          lastPingAt: new Date().toISOString(),
        };
        if (conn.status === CONNECTION_STATUS.CONNECTED) healthyCount++;
      } catch (err) {
        connections[name] = {
          status: CONNECTION_STATUS.DISCONNECTED,
          error: err.message,
          lastPingAt: new Date().toISOString(),
        };
      }
    }

    let overall;
    if (totalCount === 0) overall = 'no_connections';
    else if (healthyCount === totalCount) overall = 'healthy';
    else if (healthyCount > 0) overall = 'degraded';
    else overall = 'down';

    return { overall, connections, healthy: healthyCount, total: totalCount };
  }

  /**
   * Get aggregate telemetry across all connections.
   * @returns {object}
   */
  getTelemetry() {
    const telemetry = {};
    for (const [name, conn] of this._connections) {
      telemetry[name] = conn.getTelemetry();
    }
    return telemetry;
  }

  /**
   * Disconnect all connections.
   */
  async disconnectAll() {
    for (const [name, conn] of this._connections) {
      try {
        if (conn.disconnect) await conn.disconnect();
        this._log.debug(`Disconnected: ${name}`);
      } catch {
        // Best-effort disconnect
      }
    }
    this._connections.clear();
  }

  /**
   * Number of active connections.
   */
  get size() {
    return this._connections.size;
  }

  /**
   * Number of registered profiles.
   */
  get profileCount() {
    return this._profiles.size;
  }
}

module.exports = { ConnectionManager };
