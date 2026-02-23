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
 * Security Headers Middleware
 *
 * Sets security-related HTTP headers without requiring the helmet package.
 * Implements OWASP recommended headers.
 */

function securityHeaders(options = {}) {
  const config = {
    contentSecurityPolicy: options.contentSecurityPolicy !== false,
    xContentTypeOptions: options.xContentTypeOptions !== false,
    xFrameOptions: options.xFrameOptions !== false,
    xXssProtection: options.xXssProtection !== false,
    strictTransportSecurity: options.strictTransportSecurity !== false,
    referrerPolicy: options.referrerPolicy || 'strict-origin-when-cross-origin',
    permissionsPolicy: options.permissionsPolicy !== false,
  };

  return (_req, res, next) => {
    if (config.xContentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    if (config.xFrameOptions) {
      res.setHeader('X-Frame-Options', 'DENY');
    }
    if (config.xXssProtection) {
      res.setHeader('X-XSS-Protection', '0');
    }
    if (config.strictTransportSecurity) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    if (config.referrerPolicy) {
      res.setHeader('Referrer-Policy', config.referrerPolicy);
    }
    if (config.contentSecurityPolicy) {
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
    }
    if (config.permissionsPolicy) {
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }
    // Remove server header
    res.removeHeader('X-Powered-By');

    next();
  };
}

/**
 * CORS middleware
 *
 * When origins includes '*', credentials are NOT sent (per the CORS spec,
 * wildcard + credentials is invalid and browsers reject it).
 * Use an explicit origin allowlist via ALLOWED_ORIGINS env var for
 * credentialed cross-origin requests.
 */
function cors(options = {}) {
  const allowedOrigins = options.origins || ['*'];
  const allowedMethods = options.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  const allowedHeaders = options.headers || ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID', 'X-API-Key'];
  const maxAge = options.maxAge || 86400;
  const isWildcard = allowedOrigins.length === 1 && allowedOrigins[0] === '*';

  return (req, res, next) => {
    const origin = req.get('Origin');

    if (isWildcard) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      // Do NOT set credentials header with wildcard — browsers reject this combo
    } else if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    res.setHeader('Access-Control-Max-Age', String(maxAge));

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
}

module.exports = { securityHeaders, cors };
