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
 * Security Module - Central Export
 */

const { InputValidator, ValidationError, SCHEMAS } = require('./input-validator');
const { RateLimiter } = require('./rate-limiter');
const { AuditLogger, AUDIT_EVENTS } = require('./audit-logger');
const { securityHeaders, cors } = require('./helmet');
const { ApiKeyAuth } = require('./api-key-auth');
const { XsuaaAuth } = require('./xsuaa-auth');

module.exports = {
  InputValidator,
  ValidationError,
  SCHEMAS,
  RateLimiter,
  AuditLogger,
  AUDIT_EVENTS,
  securityHeaders,
  cors,
  ApiKeyAuth,
  XsuaaAuth,
};
