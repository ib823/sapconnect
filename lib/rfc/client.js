/**
 * RFC Client Wrapper
 *
 * Wraps node-rfc Client with retry logic, automatic reconnection,
 * timeout handling, and error mapping to the existing RfcError hierarchy.
 */

const { RfcError } = require('../errors');
const Logger = require('../logger');
const { CircuitBreaker, CircuitBreakerOpenError } = require('../resilience');

class RfcClient {
  /**
   * @param {object} connectionParams - Connection parameters:
   *   Direct: { ashost, sysnr, client, user, passwd, lang? }
   *   Load-balanced: { mshost, msserv?, group, r3name, client, user, passwd, lang? }
   *   SAP Router: { ashost, sysnr, client, user, passwd, saprouter }
   * @param {object} [options]
   * @param {number} [options.timeout=30000] - Per-call timeout in ms
   * @param {number} [options.retries=2] - Retry attempts on transient failures
   * @param {object} [options.logger] - Logger instance
   */
  constructor(connectionParams, options = {}) {
    this.connectionParams = RfcClient._normalizeConnectionParams(connectionParams);
    this.timeout = options.timeout || 30000;
    this.retries = options.retries ?? 2;
    this.log = options.logger || new Logger('rfc-client');
    this._client = null;
    this._connected = false;
    this._statefulSession = false;

    this._circuitBreaker = new CircuitBreaker({
      failureThreshold: options.circuitBreakerThreshold ?? 5,
      resetTimeoutMs: options.circuitBreakerResetMs ?? 30000,
    });
  }

  /**
   * Normalize connection params: detect direct vs load-balanced vs SAP Router.
   * @param {object} params
   * @returns {object} Cleaned params for node-rfc
   */
  static _normalizeConnectionParams(params) {
    const normalized = {};

    // Load-balanced connection (message server)
    if (params.mshost) {
      normalized.mshost = params.mshost;
      if (params.msserv) normalized.msserv = params.msserv;
      if (params.group) normalized.group = params.group;
      if (params.r3name) normalized.r3name = params.r3name;
    } else {
      // Direct connection
      if (params.ashost) normalized.ashost = params.ashost;
      if (params.sysnr !== undefined) normalized.sysnr = String(params.sysnr).padStart(2, '0');
    }

    // SAP Router
    if (params.saprouter) normalized.saprouter = params.saprouter;

    // Auth + client
    if (params.client) normalized.client = String(params.client).padStart(3, '0');
    if (params.user) normalized.user = params.user;
    if (params.passwd) normalized.passwd = params.passwd;
    if (params.lang) normalized.lang = params.lang;

    // SNC (Secure Network Communications)
    if (params.snc_qop) normalized.snc_qop = params.snc_qop;
    if (params.snc_myname) normalized.snc_myname = params.snc_myname;
    if (params.snc_partnername) normalized.snc_partnername = params.snc_partnername;
    if (params.snc_lib) normalized.snc_lib = params.snc_lib;

    return normalized;
  }

  /**
   * Detect connection type from params.
   * @returns {'direct'|'load-balanced'|'router'}
   */
  get connectionType() {
    if (this.connectionParams.mshost) return 'load-balanced';
    if (this.connectionParams.saprouter) return 'router';
    return 'direct';
  }

  getCircuitBreakerStats() {
    return this._circuitBreaker.getStats();
  }

  get isConnected() {
    return this._connected;
  }

  async open() {
    const noderfc = RfcClient._loadNodeRfc();
    this._client = new noderfc.Client(this.connectionParams);
    try {
      await this._client.open();
      this._connected = true;
      this.log.info('RFC connection opened', { host: this.connectionParams.ashost });
    } catch (err) {
      this._connected = false;
      throw new RfcError(`Failed to open RFC connection: ${err.message}`, {
        host: this.connectionParams.ashost,
        original: err.message,
      });
    }
  }

  async close() {
    if (this._client && this._connected) {
      try {
        await this._client.close();
      } catch (err) {
        this.log.warn('Error closing RFC connection', { error: err.message });
      }
    }
    this._connected = false;
    this._client = null;
  }

  /**
   * Call a function module with retry logic.
   * @param {string} functionModule - FM name (e.g., 'RFC_READ_TABLE')
   * @param {object} params - Import/table parameters
   * @returns {object} FM result
   */
  async call(functionModule, params = {}) {
    let lastError;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        if (!this._connected) {
          await this.open();
        }
        const result = await this._circuitBreaker.execute(() => this._callWithTimeout(functionModule, params));
        return result;
      } catch (err) {
        lastError = err;
        if (err instanceof CircuitBreakerOpenError) {
          throw new RfcError(`Circuit breaker open for ${functionModule}: ${err.message}`, {
            functionModule,
            circuitBreaker: true,
          });
        }
        if (err instanceof RfcError) throw err;
        if (this._isTransient(err) && attempt < this.retries) {
          this.log.warn(`RFC call failed (attempt ${attempt + 1}/${this.retries + 1}), retrying...`, {
            fm: functionModule,
            error: err.message,
          });
          this._connected = false;
          await this._sleep(Math.pow(2, attempt) * 500);
          continue;
        }
        throw new RfcError(`RFC call to ${functionModule} failed: ${err.message}`, {
          functionModule,
          attempt: attempt + 1,
          original: err.message,
        });
      }
    }
    throw new RfcError(`RFC call to ${functionModule} failed after ${this.retries + 1} attempts`, {
      functionModule,
      original: lastError?.message,
    });
  }

  async ping() {
    try {
      await this.call('RFC_PING');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Begin a stateful session — the connection stays open for multiple
   * sequential calls (e.g., BAPI chains requiring COMMIT at the end).
   * Use with try/finally to ensure endStatefulSession is always called.
   */
  async beginStatefulSession() {
    if (!this._connected) {
      await this.open();
    }
    this._statefulSession = true;
    this.log.debug('Stateful RFC session started');
  }

  /**
   * End a stateful session. Automatically rolls back if commitOnEnd is false.
   * @param {object} [options]
   * @param {boolean} [options.commit=false] - Whether to COMMIT before ending
   */
  async endStatefulSession(options = {}) {
    if (!this._statefulSession) return;
    try {
      if (options.commit) {
        await this._callWithTimeout('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });
      } else {
        await this._callWithTimeout('BAPI_TRANSACTION_ROLLBACK', {}).catch(() => {});
      }
    } finally {
      this._statefulSession = false;
      this.log.debug('Stateful RFC session ended');
    }
  }

  /**
   * Execute a sequence of BAPI calls within a stateful session.
   * Automatically handles begin/commit/rollback.
   * @param {Function} fn - Async function receiving this client. Call this.call() inside.
   * @returns {*} Result of fn
   */
  async withStatefulSession(fn) {
    await this.beginStatefulSession();
    try {
      const result = await fn(this);
      await this.endStatefulSession({ commit: true });
      return result;
    } catch (err) {
      await this.endStatefulSession({ commit: false });
      throw err;
    }
  }

  get isStateful() {
    return this._statefulSession;
  }

  /**
   * Search for RFC function modules by pattern.
   * @param {string} pattern - Search pattern (e.g., 'BAPI_MATERIAL*')
   * @returns {Array<{FUNCNAME: string, GROUPNAME: string, APPL: string}>}
   */
  async searchFunctionModules(pattern) {
    const result = await this.call('RFC_FUNCTION_SEARCH', {
      FUNCNAME: pattern,
    });
    return (result.FUNCNAME_LIST || []).map(r => ({
      FUNCNAME: (r.FUNCNAME || '').trim(),
      GROUPNAME: (r.GROUPNAME || '').trim(),
      APPL: (r.APPL || '').trim(),
    }));
  }

  /**
   * Get the full interface definition of a function module.
   * @param {string} fmName
   * @returns {{ name, imports, exports, changing, tables, exceptions }}
   */
  async getFunctionInterface(fmName) {
    const result = await this.call('RFC_GET_FUNCTION_INTERFACE', {
      FUNCNAME: fmName,
    });
    return {
      name: fmName,
      imports: (result.PARAMS_IMPORT || []).map(p => ({
        name: (p.PARAMETER || '').trim(),
        type: (p.TABNAME || '').trim(),
        field: (p.FIELDNAME || '').trim(),
        optional: p.OPTIONAL === 'X',
        default: (p.DEFAULT || '').trim(),
      })),
      exports: (result.PARAMS_EXPORT || []).map(p => ({
        name: (p.PARAMETER || '').trim(),
        type: (p.TABNAME || '').trim(),
        field: (p.FIELDNAME || '').trim(),
      })),
      changing: (result.PARAMS_CHANGING || []).map(p => ({
        name: (p.PARAMETER || '').trim(),
        type: (p.TABNAME || '').trim(),
        field: (p.FIELDNAME || '').trim(),
      })),
      tables: (result.PARAMS_TABLES || []).map(p => ({
        name: (p.PARAMETER || '').trim(),
        type: (p.TABNAME || '').trim(),
      })),
      exceptions: (result.EXCEPTION_LIST || []).map(e => ({
        name: (e.EXCEPTION || '').trim(),
        text: (e.TEXT || '').trim(),
      })),
    };
  }

  async _callWithTimeout(fm, params) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new RfcError(`RFC call to ${fm} timed out after ${this.timeout}ms`, {
          functionModule: fm,
          timeout: this.timeout,
        }));
      }, this.timeout);

      this._client.call(fm, params)
        .then(result => { clearTimeout(timer); resolve(result); })
        .catch(err => { clearTimeout(timer); reject(err); });
    });
  }

  _isTransient(err) {
    const msg = (err.message || '').toLowerCase();
    return msg.includes('connection') || msg.includes('timeout') ||
           msg.includes('reset') || msg.includes('broken pipe');
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static _loadNodeRfc() {
    try {
      return require('node-rfc');
    } catch {
      throw new RfcError(
        'node-rfc is not installed. Install it with: npm install node-rfc (requires SAP NW RFC SDK)',
        { hint: 'See https://github.com/SAP/node-rfc for installation instructions' }
      );
    }
  }
}

module.exports = RfcClient;
