/**
 * Error Hierarchy for the SAP Connect Platform
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
};
