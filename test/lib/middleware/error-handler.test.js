/**
 * Tests for lib/middleware/error-handler.js
 *
 * Covers notFoundHandler and errorHandler middleware factory.
 * Verifies HTTP status mapping, structured JSON responses,
 * stack trace visibility, audit logging, and detail propagation.
 */

const { errorHandler, notFoundHandler } = require('../../../lib/middleware/error-handler');
const {
  SapConnectError,
  ConnectionError,
  AuthenticationError,
  ODataError,
  RfcError,
  RuleValidationError,
  TransformError,
  MigrationObjectError,
} = require('../../../lib/errors');

// ── Helpers ──────────────────────────────────────────────────

function createMockReq(overrides = {}) {
  return {
    method: 'GET',
    path: '/test',
    ip: '127.0.0.1',
    requestId: 'req-123',
    user: null,
    ...overrides,
  };
}

function createMockRes() {
  const res = {
    _status: null,
    _json: null,
    status: vi.fn(function (code) {
      res._status = code;
      return res;
    }),
    json: vi.fn(function (body) {
      res._json = body;
      return res;
    }),
    get: vi.fn(),
  };
  return res;
}

// ── Tests ────────────────────────────────────────────────────

describe('lib/middleware/error-handler', () => {
  // ── notFoundHandler ────────────────────────────────────────

  describe('notFoundHandler', () => {
    it('should return 404 with correct JSON shape', () => {
      const req = createMockReq({ method: 'GET', path: '/missing' });
      const res = createMockRes();

      notFoundHandler(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledTimes(1);

      const body = res._json;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Cannot GET /missing');
      expect(body.status).toBe(404);
      expect(body.timestamp).toBeDefined();
      expect(typeof body.timestamp).toBe('string');
    });

    it('should include requestId from the request object', () => {
      const req = createMockReq({ requestId: 'abc-def-789' });
      const res = createMockRes();

      notFoundHandler(req, res, vi.fn());

      expect(res._json.requestId).toBe('abc-def-789');
    });

    it('should set requestId to null when not present on req', () => {
      const req = createMockReq();
      delete req.requestId;
      const res = createMockRes();

      notFoundHandler(req, res, vi.fn());

      expect(res._json.requestId).toBeNull();
    });

    it('should reflect the HTTP method in the message', () => {
      const req = createMockReq({ method: 'POST', path: '/data' });
      const res = createMockRes();

      notFoundHandler(req, res, vi.fn());

      expect(res._json.message).toBe('Cannot POST /data');
    });
  });

  // ── errorHandler ───────────────────────────────────────────

  describe('errorHandler', () => {
    let originalNodeEnv;

    beforeEach(() => {
      originalNodeEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should return 500 for a generic Error', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new Error('Something broke');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res._json.code).toBe('ERR_INTERNAL');
      expect(res._json.status).toBe(500);
    });

    it('should map SapConnectError with ERR_VALIDATION to 400', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new SapConnectError('Bad input', 'ERR_VALIDATION');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res._json.code).toBe('ERR_VALIDATION');
    });

    it('should map ConnectionError to 502', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new ConnectionError('Cannot reach SAP');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res._json.code).toBe('ERR_CONNECTION');
      expect(res._json.error).toBe('ConnectionError');
    });

    it('should map AuthenticationError to 401', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new AuthenticationError('Invalid credentials');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res._json.code).toBe('ERR_AUTH');
      expect(res._json.error).toBe('AuthenticationError');
    });

    it('should map ODataError to 502', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new ODataError('OData failure', 500, {});
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res._json.code).toBe('ERR_ODATA');
    });

    it('should map RfcError to 502', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new RfcError('RFC call failed');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res._json.code).toBe('ERR_RFC');
    });

    it('should map RuleValidationError to 400', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new RuleValidationError('Rule check failed');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res._json.code).toBe('ERR_RULE_VALIDATION');
    });

    it('should map TransformError to 500', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new TransformError('Transform broke');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res._json.code).toBe('ERR_TRANSFORM');
    });

    it('should map MigrationObjectError to 500', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new MigrationObjectError('Object failed');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res._json.code).toBe('ERR_MIGRATION_OBJECT');
    });

    it('should include stack trace when includeStack is true', () => {
      const handler = errorHandler({ includeStack: true });
      const err = new Error('Traceable error');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res._json.stack).toBeDefined();
      expect(Array.isArray(res._json.stack)).toBe(true);
      expect(res._json.stack.length).toBeGreaterThan(0);
      expect(res._json.stack[0]).toContain('Traceable error');
    });

    it('should hide stack trace when includeStack is false', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new Error('Hidden stack');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res._json.stack).toBeUndefined();
    });

    it('should auto-detect includeStack from NODE_ENV=production (hidden)', () => {
      process.env.NODE_ENV = 'production';
      const handler = errorHandler({}); // no explicit includeStack
      const err = new Error('Prod error');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res._json.stack).toBeUndefined();
    });

    it('should auto-detect includeStack from NODE_ENV=development (shown)', () => {
      process.env.NODE_ENV = 'development';
      const handler = errorHandler({}); // no explicit includeStack
      const err = new Error('Dev error');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res._json.stack).toBeDefined();
    });

    it('should hide error message for 500 status when stack is hidden', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new Error('Sensitive internal detail');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res._json.message).toBe('Internal server error');
      expect(res._json.message).not.toContain('Sensitive');
    });

    it('should show original message for 500 when includeStack is true', () => {
      const handler = errorHandler({ includeStack: true });
      const err = new Error('Debug detail visible');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res._json.message).toBe('Debug detail visible');
    });

    it('should show original message for non-500 errors even when stack is hidden', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new SapConnectError('Validation failed', 'ERR_VALIDATION');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res._json.message).toBe('Validation failed');
    });

    it('should include err.details when present and non-empty', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new SapConnectError('Validation error', 'ERR_VALIDATION', {
        field: 'name',
        reason: 'required',
      });
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res._json.details).toEqual({ field: 'name', reason: 'required' });
    });

    it('should omit details when err.details is empty', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new SapConnectError('No details', 'ERR_VALIDATION', {});
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res._json.details).toBeUndefined();
    });

    it('should log to auditLogger when provided', () => {
      const auditLogger = { log: vi.fn() };
      const handler = errorHandler({ auditLogger, includeStack: false });
      const err = new ConnectionError('SAP down', { host: 'sap.local' });
      const req = createMockReq({ ip: '10.0.0.1', user: { id: 'user-42' } });
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(auditLogger.log).toHaveBeenCalledTimes(1);
      expect(auditLogger.log).toHaveBeenCalledWith(
        'api.error',
        expect.objectContaining({
          actor: 'user-42',
          ip: '10.0.0.1',
          resource: 'GET /test',
          action: 'GET',
          outcome: 'error',
          metadata: expect.objectContaining({
            statusCode: 502,
            errorCode: 'ERR_CONNECTION',
            errorMessage: 'SAP down',
          }),
        })
      );
    });

    it('should use req.ip as actor when no user is present', () => {
      const auditLogger = { log: vi.fn() };
      const handler = errorHandler({ auditLogger, includeStack: false });
      const err = new Error('Oops');
      const req = createMockReq({ ip: '192.168.1.1', user: null });
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      const callArgs = auditLogger.log.mock.calls[0][1];
      expect(callArgs.actor).toBe('192.168.1.1');
    });

    it('should not call auditLogger when none is provided', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new Error('No audit');
      const req = createMockReq();
      const res = createMockRes();

      // Should not throw
      expect(() => handler(err, req, res, vi.fn())).not.toThrow();
    });

    it('should include requestId in the response', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new Error('Test');
      const req = createMockReq({ requestId: 'trace-456' });
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res._json.requestId).toBe('trace-456');
    });

    it('should set the correct error name in the response', () => {
      const handler = errorHandler({ includeStack: false });

      // Generic Error
      const err1 = new Error('generic');
      const res1 = createMockRes();
      handler(err1, createMockReq(), res1, vi.fn());
      expect(res1._json.error).toBe('Error');

      // SapConnectError subclass
      const err2 = new ConnectionError('conn fail');
      const res2 = createMockRes();
      handler(err2, createMockReq(), res2, vi.fn());
      expect(res2._json.error).toBe('ConnectionError');

      // AuthenticationError
      const err3 = new AuthenticationError('auth fail');
      const res3 = createMockRes();
      handler(err3, createMockReq(), res3, vi.fn());
      expect(res3._json.error).toBe('AuthenticationError');
    });

    it('should include a timestamp in ISO format', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new Error('Timestamped');
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      expect(res._json.timestamp).toBeDefined();
      // Verify it parses as a valid date
      const parsed = new Date(res._json.timestamp);
      expect(parsed.getTime()).not.toBeNaN();
    });

    it('should respect statusCode set directly on the error object', () => {
      const handler = errorHandler({ includeStack: false });
      const err = new Error('Teapot');
      err.statusCode = 418;
      const req = createMockReq();
      const res = createMockRes();

      handler(err, req, res, vi.fn());

      // Generic errors use statusCode if set (not a SapConnectError, so no code mapping)
      expect(res.status).toHaveBeenCalledWith(418);
    });
  });
});
