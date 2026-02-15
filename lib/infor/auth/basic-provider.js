'use strict';

/**
 * Basic Authentication Provider
 *
 * Provides HTTP Basic authentication for legacy/on-premise Infor APIs
 * (LN, Lawson, SyteLine) that do not use ION API Gateway. Encodes
 * username:password as a Base64 Authorization header.
 */

const Logger = require('../../logger');
const { AuthenticationError } = require('../../errors');

class InforBasicAuthProvider {
  /**
   * @param {object} config
   * @param {string} config.username - Username for Basic auth
   * @param {string} config.password - Password for Basic auth
   * @param {string} [config.mode='live'] - 'live' or 'mock'
   * @param {object} [config.logger] - Logger instance
   */
  constructor(config = {}) {
    this.username = config.username || '';
    this.password = config.password || '';
    this.mode = config.mode || 'live';
    this.log = config.logger || new Logger('infor-basic-auth');
  }

  /**
   * Validate that credentials are non-empty.
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    if (this.mode === 'mock') {
      return { valid: true, errors };
    }

    if (!this.username || typeof this.username !== 'string' || this.username.trim().length === 0) {
      errors.push('Username is required and must be a non-empty string');
    }

    if (!this.password || typeof this.password !== 'string' || this.password.trim().length === 0) {
      errors.push('Password is required and must be a non-empty string');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get the Base64-encoded Authorization header value.
   * @returns {string} The full header value: "Basic <base64>"
   * @throws {AuthenticationError} If credentials are empty
   */
  getAuthHeader() {
    if (this.mode === 'mock') {
      return 'Basic bW9jay11c2VyOm1vY2stcGFzcw=='; // mock-user:mock-pass
    }

    const validation = this.validate();
    if (!validation.valid) {
      throw new AuthenticationError(
        `Invalid Basic auth credentials: ${validation.errors.join('; ')}`,
        { errors: validation.errors }
      );
    }

    const encoded = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    return `Basic ${encoded}`;
  }

  /**
   * Get authorization headers suitable for HTTP requests.
   * @returns {Promise<object>} Headers object with Authorization header
   */
  async getHeaders() {
    return { Authorization: this.getAuthHeader() };
  }

  /**
   * Get HTTPS agent (null for basic auth — no mTLS).
   * @returns {null}
   */
  getAgent() {
    return null;
  }
}

module.exports = InforBasicAuthProvider;
