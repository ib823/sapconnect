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
 * OData Authentication Providers
 *
 * Each provider implements getHeaders() -> { headers } and optionally
 * getAgent() -> https.Agent for mTLS.
 */

const https = require('https');
const fs = require('fs');

class BasicAuthProvider {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  async getHeaders() {
    const encoded = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }

  getAgent() {
    return null;
  }
}

class OAuth2ClientCredentialsProvider {
  constructor(tokenUrl, clientId, clientSecret, scope) {
    this.tokenUrl = tokenUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scope = scope || '';
    this._token = null;
    this._expiresAt = 0;
  }

  async getHeaders() {
    if (!this._token || Date.now() >= this._expiresAt) {
      await this._fetchToken();
    }
    return { Authorization: `Bearer ${this._token}` };
  }

  getAgent() {
    return null;
  }

  async _fetchToken() {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
    if (this.scope) body.set('scope', this.scope);

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`OAuth2 token request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this._token = data.access_token;
    // Expire 60 seconds early to avoid edge cases
    this._expiresAt = Date.now() + (data.expires_in - 60) * 1000;
  }
}

class OAuth2SAMLBearerProvider {
  constructor(tokenUrl, clientId, clientSecret, assertion) {
    this.tokenUrl = tokenUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.assertion = assertion;
    this._token = null;
    this._expiresAt = 0;
  }

  async getHeaders() {
    if (!this._token || Date.now() >= this._expiresAt) {
      await this._fetchToken();
    }
    return { Authorization: `Bearer ${this._token}` };
  }

  getAgent() {
    return null;
  }

  async _fetchToken() {
    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer',
      assertion: this.assertion,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`SAML Bearer token request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this._token = data.access_token;
    this._expiresAt = Date.now() + (data.expires_in - 60) * 1000;
  }
}

class X509CertificateProvider {
  constructor(certPath, keyPath) {
    this.certPath = certPath;
    this.keyPath = keyPath;
    this._agent = null;
  }

  async getHeaders() {
    return {};
  }

  getAgent() {
    if (!this._agent) {
      this._agent = new https.Agent({
        cert: fs.readFileSync(this.certPath),
        key: fs.readFileSync(this.keyPath),
        rejectUnauthorized: true,
      });
    }
    return this._agent;
  }
}

module.exports = {
  BasicAuthProvider,
  OAuth2ClientCredentialsProvider,
  OAuth2SAMLBearerProvider,
  X509CertificateProvider,
};
