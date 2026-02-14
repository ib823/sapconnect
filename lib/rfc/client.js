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
   * @param {object} connectionParams - { ashost, sysnr, client, user, passwd, lang?, router? }
   * @param {object} [options]
   * @param {number} [options.timeout=30000] - Per-call timeout in ms
   * @param {number} [options.retries=2] - Retry attempts on transient failures
   * @param {object} [options.logger] - Logger instance
   */
  constructor(connectionParams, options = {}) {
    this.connectionParams = connectionParams;
    this.timeout = options.timeout || 30000;
    this.retries = options.retries ?? 2;
    this.log = options.logger || new Logger('rfc-client');
    this._client = null;
    this._connected = false;

    this._circuitBreaker = new CircuitBreaker({
      failureThreshold: options.circuitBreakerThreshold ?? 5,
      resetTimeoutMs: options.circuitBreakerResetMs ?? 30000,
    });
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
