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
 * API Key Authentication Middleware
 *
 * Lightweight auth for /api/* routes.
 * When API_KEY is configured: requires X-API-Key header or apiKey query param.
 * When not configured: passthrough (dev mode).
 * Exempt paths: /health, /ready, /metrics
 */

'use strict';

const EXEMPT_PATHS = new Set(['/health', '/ready', '/metrics']);

class ApiKeyAuth {
  /**
   * @param {object} [options]
   * @param {string} [options.apiKey] - API key value; falls back to process.env.API_KEY
   */
  constructor(options = {}) {
    this._apiKey = options.apiKey || process.env.API_KEY || null;
  }

  isEnabled() {
    return this._apiKey !== null && this._apiKey !== '';
  }

  middleware() {
    return (req, res, next) => {
      if (!this.isEnabled()) return next();
      if (EXEMPT_PATHS.has(req.path)) return next();
      if (!req.path.startsWith('/api/')) return next();

      const provided = req.headers['x-api-key'] || req.query.apiKey;

      if (!provided) {
        return res.status(401).json({ error: 'API key required' });
      }

      if (provided !== this._apiKey) {
        return res.status(403).json({ error: 'Invalid API key' });
      }

      req.user = { type: 'api-key', authenticated: true };
      next();
    };
  }
}

module.exports = { ApiKeyAuth };
