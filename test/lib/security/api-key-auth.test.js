/**
 * Tests for API Key Authentication Middleware
 */
const { ApiKeyAuth } = require('../../../lib/security/api-key-auth');

describe('ApiKeyAuth', () => {
  let mockReq;
  let mockRes;
  let nextFn;

  beforeEach(() => {
    mockReq = {
      path: '/api/dashboard/summary',
      headers: {},
      query: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFn = vi.fn();
  });

  describe('constructor', () => {
    it('should accept apiKey from options', () => {
      const auth = new ApiKeyAuth({ apiKey: 'test-key' });
      expect(auth.isEnabled()).toBe(true);
    });

    it('should default to disabled when no key provided', () => {
      const auth = new ApiKeyAuth();
      expect(auth.isEnabled()).toBe(false);
    });

    it('should treat empty string as disabled', () => {
      const auth = new ApiKeyAuth({ apiKey: '' });
      expect(auth.isEnabled()).toBe(false);
    });
  });

  describe('isEnabled()', () => {
    it('should return true when API key is set', () => {
      const auth = new ApiKeyAuth({ apiKey: 'my-secret' });
      expect(auth.isEnabled()).toBe(true);
    });

    it('should return false when API key is null', () => {
      const auth = new ApiKeyAuth({ apiKey: null });
      expect(auth.isEnabled()).toBe(false);
    });
  });

  describe('middleware — disabled mode', () => {
    it('should pass through all requests when disabled', () => {
      const auth = new ApiKeyAuth();
      const mw = auth.middleware();
      mw(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should pass through even without API key header', () => {
      const auth = new ApiKeyAuth();
      const mw = auth.middleware();
      mockReq.path = '/api/audit';
      mw(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });
  });

  describe('middleware — enabled mode', () => {
    let auth;
    let mw;

    beforeEach(() => {
      auth = new ApiKeyAuth({ apiKey: 'valid-key-123' });
      mw = auth.middleware();
    });

    it('should return 401 when no API key provided', () => {
      mw(mockReq, mockRes, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'API key required' });
      expect(nextFn).not.toHaveBeenCalled();
    });

    it('should return 403 when invalid API key provided via header', () => {
      mockReq.headers['x-api-key'] = 'wrong-key';
      mw(mockReq, mockRes, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid API key' });
      expect(nextFn).not.toHaveBeenCalled();
    });

    it('should pass through with valid API key in header', () => {
      mockReq.headers['x-api-key'] = 'valid-key-123';
      mw(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalled();
      expect(mockReq.user).toEqual({ type: 'api-key', authenticated: true });
    });

    it('should accept API key from query parameter', () => {
      mockReq.query.apiKey = 'valid-key-123';
      mw(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalled();
      expect(mockReq.user).toEqual({ type: 'api-key', authenticated: true });
    });

    it('should return 403 for invalid query parameter key', () => {
      mockReq.query.apiKey = 'nope';
      mw(mockReq, mockRes, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('exempt paths', () => {
    let auth;
    let mw;

    beforeEach(() => {
      auth = new ApiKeyAuth({ apiKey: 'secret' });
      mw = auth.middleware();
    });

    it('should exempt /health', () => {
      mockReq.path = '/health';
      mw(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });

    it('should exempt /ready', () => {
      mockReq.path = '/ready';
      mw(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });

    it('should exempt /metrics', () => {
      mockReq.path = '/metrics';
      mw(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });

    it('should NOT exempt /api/info', () => {
      mockReq.path = '/api/info';
      mw(mockReq, mockRes, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('non-API paths', () => {
    it('should pass through non-/api/ paths even when enabled', () => {
      const auth = new ApiKeyAuth({ apiKey: 'secret' });
      const mw = auth.middleware();
      mockReq.path = '/some-static-page';
      mw(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });
  });

  describe('environment variable fallback', () => {
    const originalEnv = process.env.API_KEY;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.API_KEY = originalEnv;
      } else {
        delete process.env.API_KEY;
      }
    });

    it('should read API_KEY from environment when not in options', () => {
      process.env.API_KEY = 'env-key';
      const auth = new ApiKeyAuth();
      expect(auth.isEnabled()).toBe(true);

      const mw = auth.middleware();
      mockReq.headers['x-api-key'] = 'env-key';
      mw(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });
  });
});
