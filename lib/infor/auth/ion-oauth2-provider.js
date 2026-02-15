'use strict';

/**
 * ION OAuth2 Service Account Provider
 *
 * Implements the OAuth2 client_credentials flow for Infor ION API Gateway.
 * Manages token lifecycle with automatic caching and refresh, using a
 * 60-second buffer before expiry to prevent edge-case failures.
 *
 * In mock mode, returns a synthetic bearer token without making network calls.
 */

const Logger = require('../../logger');
const { IONError, AuthenticationError } = require('../../errors');

class IONOAuth2Provider {
  /**
   * @param {object} config
   * @param {string} config.tokenUrl - ION token endpoint (e.g., https://mingle-ionapi.inforcloudsuite.com/.../connect/token)
   * @param {string} config.clientId - OAuth2 client ID from ION API file
   * @param {string} config.clientSecret - OAuth2 client secret
   * @param {string} [config.scope] - Optional scope (e.g., '' for default)
   * @param {string} [config.tenant] - Infor tenant identifier
   * @param {string} [config.mode='live'] - 'live' or 'mock'
   * @param {object} [config.logger] - Logger instance
   */
  constructor(config = {}) {
    this.tokenUrl = config.tokenUrl;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.scope = config.scope || '';
    this.tenant = config.tenant || '';
    this.mode = config.mode || 'live';
    this.log = config.logger || new Logger('ion-oauth2');

    /** @private */
    this._accessToken = null;
    /** @private */
    this._expiresAt = 0;
    /** @private Token refresh buffer in ms (60 seconds) */
    this._expiryBufferMs = 60 * 1000;
  }

  /**
   * Get a valid access token. Returns cached token if still valid,
   * otherwise fetches a new one.
   * @returns {Promise<string>} Bearer access token
   */
  async getToken() {
    if (this._accessToken && !this.isTokenExpired()) {
      return this._accessToken;
    }
    return this.refreshToken();
  }

  /**
   * Force-refresh the access token regardless of cached state.
   * @returns {Promise<string>} New bearer access token
   */
  async refreshToken() {
    if (this.mode === 'mock') {
      this._accessToken = `mock-ion-token-${Date.now()}`;
      this._expiresAt = Date.now() + 3600 * 1000;
      this.log.debug('Mock ION OAuth2 token generated');
      return this._accessToken;
    }

    if (!this.tokenUrl || !this.clientId || !this.clientSecret) {
      throw new AuthenticationError('ION OAuth2 credentials incomplete: tokenUrl, clientId, and clientSecret are required', {
        hasTokenUrl: !!this.tokenUrl,
        hasClientId: !!this.clientId,
        hasClientSecret: !!this.clientSecret,
      });
    }

    this.log.debug('Fetching ION OAuth2 token', { tokenUrl: this.tokenUrl, clientId: this.clientId });

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
    if (this.scope) {
      body.set('scope', this.scope);
    }

    let response;
    try {
      response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: body.toString(),
        signal: AbortSignal.timeout(30000),
      });
    } catch (err) {
      throw new IONError(`ION OAuth2 token request failed: ${err.message}`, {
        tokenUrl: this.tokenUrl,
        original: err.message,
      });
    }

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.text();
      } catch {
        errorBody = 'Unable to read error response';
      }
      throw new AuthenticationError(
        `ION OAuth2 token request failed: ${response.status} ${response.statusText}`,
        { tokenUrl: this.tokenUrl, status: response.status, body: errorBody }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new IONError('ION OAuth2 token response is not valid JSON', {
        tokenUrl: this.tokenUrl,
        original: err.message,
      });
    }

    if (!data.access_token) {
      throw new IONError('ION OAuth2 token response missing access_token', {
        tokenUrl: this.tokenUrl,
        responseKeys: Object.keys(data),
      });
    }

    this._accessToken = data.access_token;
    const expiresInMs = (data.expires_in || 3600) * 1000;
    this._expiresAt = Date.now() + expiresInMs - this._expiryBufferMs;

    this.log.info('ION OAuth2 token acquired', {
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    });

    return this._accessToken;
  }

  /**
   * Check whether the cached token is expired (with 60-second buffer).
   * @returns {boolean} True if token is expired or not yet acquired
   */
  isTokenExpired() {
    if (!this._accessToken) return true;
    return Date.now() >= this._expiresAt;
  }

  /**
   * Get authorization headers suitable for HTTP requests.
   * @returns {Promise<object>} Headers object with Authorization header
   */
  async getHeaders() {
    const token = await this.getToken();
    const headers = { Authorization: `Bearer ${token}` };
    if (this.tenant) {
      headers['X-Infor-TenantId'] = this.tenant;
    }
    return headers;
  }

  /**
   * Get HTTPS agent (null for ION cloud — no mTLS needed).
   * @returns {null}
   */
  getAgent() {
    return null;
  }

  /**
   * Clear cached token state.
   */
  invalidate() {
    this._accessToken = null;
    this._expiresAt = 0;
    this.log.debug('ION OAuth2 token cache invalidated');
  }
}

module.exports = IONOAuth2Provider;
