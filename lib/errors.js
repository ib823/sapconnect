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
 * Error Hierarchy for the SEN Platform
 *
 * Base: SapConnectError with code, details, timestamp
 * Subclasses for each failure domain.
 */

class SapConnectError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = 'SapConnectError';
    this.code = code || 'ERR_SAPCONNECT';
    this.details = details || {};
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

class ConnectionError extends SapConnectError {
  constructor(message, details) {
    super(message, 'ERR_CONNECTION', details);
    this.name = 'ConnectionError';
  }
}

class AuthenticationError extends SapConnectError {
  constructor(message, details) {
    super(message, 'ERR_AUTH', details);
    this.name = 'AuthenticationError';
  }
}

class ODataError extends SapConnectError {
  constructor(message, statusCode, response, details) {
    super(message, 'ERR_ODATA', details);
    this.name = 'ODataError';
    this.statusCode = statusCode;
    this.response = response;
  }

  toJSON() {
    return { ...super.toJSON(), statusCode: this.statusCode, response: this.response };
  }
}

class RfcError extends SapConnectError {
  constructor(message, details) {
    super(message, 'ERR_RFC', details);
    this.name = 'RfcError';
  }
}

class TableReadError extends RfcError {
  constructor(message, details) {
    super(message, details);
    this.name = 'TableReadError';
    this.code = 'ERR_TABLE_READ';
  }
}

class FunctionCallError extends RfcError {
  constructor(message, details) {
    super(message, details);
    this.name = 'FunctionCallError';
    this.code = 'ERR_FUNCTION_CALL';
  }
}

class ExtractionError extends SapConnectError {
  constructor(message, details) {
    super(message, 'ERR_EXTRACTION', details);
    this.name = 'ExtractionError';
  }
}

class RuleValidationError extends SapConnectError {
  constructor(message, details) {
    super(message, 'ERR_RULE_VALIDATION', details);
    this.name = 'RuleValidationError';
  }
}

class TransformError extends SapConnectError {
  constructor(message, details) {
    super(message, 'ERR_TRANSFORM', details);
    this.name = 'TransformError';
  }
}

class MigrationObjectError extends SapConnectError {
  constructor(message, details) {
    super(message, 'ERR_MIGRATION_OBJECT', details);
    this.name = 'MigrationObjectError';
  }
}

class SignavioError extends SapConnectError {
  constructor(message, details) {
    super(message, 'ERR_SIGNAVIO', details);
    this.name = 'SignavioError';
  }
}

class TestingError extends SapConnectError {
  constructor(message, details) {
    super(message, 'ERR_TESTING', details);
    this.name = 'TestingError';
  }
}

class CloudModuleError extends SapConnectError {
  constructor(message, details) {
    super(message, 'ERR_CLOUD_MODULE', details);
    this.name = 'CloudModuleError';
  }
}

class SuccessFactorsError extends CloudModuleError {
  constructor(message, details) {
    super(message, details);
    this.name = 'SuccessFactorsError';
    this.code = 'ERR_SUCCESSFACTORS';
  }
}

class AribaError extends CloudModuleError {
  constructor(message, details) {
    super(message, details);
    this.name = 'AribaError';
    this.code = 'ERR_ARIBA';
  }
}

class ConcurError extends CloudModuleError {
  constructor(message, details) {
    super(message, details);
    this.name = 'ConcurError';
    this.code = 'ERR_CONCUR';
  }
}

class SACError extends CloudModuleError {
  constructor(message, details) {
    super(message, details);
    this.name = 'SACError';
    this.code = 'ERR_SAC';
  }
}

// ── Infor Errors ─────────────────────────────────────────────────────

class InforError extends SapConnectError {
  constructor(message, details) {
    super(message, 'ERR_INFOR', details);
    this.name = 'InforError';
  }
}

class IONError extends InforError {
  constructor(message, details) {
    super(message, details);
    this.name = 'IONError';
    this.code = 'ERR_ION';
  }
}

class M3ApiError extends InforError {
  constructor(message, details) {
    super(message, details);
    this.name = 'M3ApiError';
    this.code = 'ERR_M3_API';
  }
}

class IDOError extends InforError {
  constructor(message, details) {
    super(message, details);
    this.name = 'IDOError';
    this.code = 'ERR_IDO';
  }
}

class LandmarkError extends InforError {
  constructor(message, details) {
    super(message, details);
    this.name = 'LandmarkError';
    this.code = 'ERR_LANDMARK';
  }
}

class InforDbError extends InforError {
  constructor(message, details) {
    super(message, details);
    this.name = 'InforDbError';
    this.code = 'ERR_INFOR_DB';
  }
}

class CanonicalMappingError extends SapConnectError {
  constructor(message, details) {
    super(message, 'ERR_CANONICAL_MAPPING', details);
    this.name = 'CanonicalMappingError';
  }
}

module.exports = {
  SapConnectError,
  ConnectionError,
  AuthenticationError,
  ODataError,
  RfcError,
  TableReadError,
  FunctionCallError,
  ExtractionError,
  RuleValidationError,
  TransformError,
  MigrationObjectError,
  SignavioError,
  TestingError,
  CloudModuleError,
  SuccessFactorsError,
  AribaError,
  ConcurError,
  SACError,
  InforError,
  IONError,
  M3ApiError,
  IDOError,
  LandmarkError,
  InforDbError,
  CanonicalMappingError,
};
