/**
 * Request Context & Correlation ID
 *
 * Assigns unique correlation IDs to each request for distributed tracing.
 * Propagates X-Request-ID and X-Correlation-ID headers.
 */

const crypto = require('crypto');

class RequestContext {
  constructor() {
    this._store = new Map();
  }

  /** Generate a unique request ID */
  generateId() {
    return `req-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /** Express middleware */
  middleware() {
    return (req, res, next) => {
      const requestId = req.get('X-Request-ID') || req.get('X-Correlation-ID') || this.generateId();
      req.requestId = requestId;
      res.setHeader('X-Request-ID', requestId);
      res.setHeader('X-Correlation-ID', requestId);
      next();
    };
  }
}

module.exports = { RequestContext };
