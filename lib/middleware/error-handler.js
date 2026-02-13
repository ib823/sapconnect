/**
 * Express Error Handling Middleware
 *
 * Catches unhandled errors and returns structured JSON responses.
 * Integrates with AuditLogger for error tracking.
 * Prevents leaking stack traces in production.
 */

const Logger = require('../logger');
const { SapConnectError } = require('../errors');

const log = new Logger('error-handler');

/**
 * Not-found handler — place before the error handler.
 */
function notFoundHandler(req, res, _next) {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    status: 404,
    timestamp: new Date().toISOString(),
    requestId: req.requestId || null,
  });
}

/**
 * Central error handler — must have 4 parameters for Express to recognize it.
 * @param {object} [options]
 * @param {object} [options.auditLogger] - AuditLogger instance
 * @param {boolean} [options.includeStack] - Include stack traces (auto-detected from NODE_ENV)
 */
function errorHandler(options = {}) {
  const includeStack = options.includeStack ?? (process.env.NODE_ENV !== 'production');
  const auditLogger = options.auditLogger || null;

  // eslint-disable-next-line no-unused-vars
  return (err, req, res, _next) => {
    // Determine status code
    let status = err.statusCode || err.status || 500;
    if (err instanceof SapConnectError) {
      status = _mapErrorCodeToStatus(err.code);
    }

    // Build response
    const response = {
      error: err.name || 'InternalServerError',
      message: status >= 500 && !includeStack ? 'Internal server error' : err.message,
      code: err.code || 'ERR_INTERNAL',
      status,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || null,
    };

    if (err.details && Object.keys(err.details).length > 0) {
      response.details = err.details;
    }

    if (includeStack && err.stack) {
      response.stack = err.stack.split('\n').map(l => l.trim());
    }

    // Log
    if (status >= 500) {
      log.error(`${req.method} ${req.path} -> ${status}`, { error: err.message, stack: err.stack });
    } else {
      log.warn(`${req.method} ${req.path} -> ${status}`, { error: err.message });
    }

    // Audit
    if (auditLogger) {
      auditLogger.log('api.error', {
        actor: req.user?.id || req.ip || 'anonymous',
        ip: req.ip,
        resource: `${req.method} ${req.path}`,
        action: req.method,
        outcome: 'error',
        metadata: {
          statusCode: status,
          errorCode: err.code,
          errorMessage: err.message,
        },
      });
    }

    res.status(status).json(response);
  };
}

function _mapErrorCodeToStatus(code) {
  const map = {
    ERR_VALIDATION: 400,
    ERR_RULE_VALIDATION: 400,
    ERR_AUTH: 401,
    ERR_CONNECTION: 502,
    ERR_ODATA: 502,
    ERR_RFC: 502,
    ERR_TABLE_READ: 502,
    ERR_FUNCTION_CALL: 502,
    ERR_EXTRACTION: 500,
    ERR_TRANSFORM: 500,
    ERR_MIGRATION_OBJECT: 500,
  };
  return map[code] || 500;
}

module.exports = { errorHandler, notFoundHandler };
