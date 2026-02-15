const { XsuaaAuth, SCOPE_MAP } = require('../../../lib/security/xsuaa-auth');

// ─────────────────────────────────────────────────────────────────────────────
// Mock passport and xssec
// ─────────────────────────────────────────────────────────────────────────────

class MockJWTStrategy {
  constructor(credentials) {
    this.credentials = credentials;
    this.name = 'JWT';
  }
}

function createMockPassport(authenticateResult) {
  const passport = {
    use: vi.fn(),
    authenticate: vi.fn().mockReturnValue((req, res, next) => {
      const { err, user, info } = authenticateResult;
      const callback = passport.authenticate.mock.calls[0]?.[2];
      if (callback) callback(err, user, info);
    }),
  };
  return passport;
}

// ─────────────────────────────────────────────────────────────────────────────
// XsuaaAuth
// ─────────────────────────────────────────────────────────────────────────────

describe('XsuaaAuth', () => {
  let originalLoadPassport;
  let originalLoadXssec;
  let originalLoadXsenv;

  beforeEach(() => {
    originalLoadPassport = XsuaaAuth._loadPassport;
    originalLoadXssec = XsuaaAuth._loadXssec;
    originalLoadXsenv = XsuaaAuth._loadXsenv;
  });

  afterEach(() => {
    XsuaaAuth._loadPassport = originalLoadPassport;
    XsuaaAuth._loadXssec = originalLoadXssec;
    XsuaaAuth._loadXsenv = originalLoadXsenv;
  });

  describe('constructor', () => {
    it('should create with explicit credentials', () => {
      const auth = new XsuaaAuth({ credentials: { clientid: 'test' } });
      expect(auth.isEnabled()).toBe(true);
    });

    it('should always report as enabled', () => {
      const auth = new XsuaaAuth();
      expect(auth.isEnabled()).toBe(true);
    });
  });

  describe('middleware', () => {
    it('should bypass exempt paths', () => {
      const auth = new XsuaaAuth({ credentials: { clientid: 'test' } });
      const mw = auth.middleware();
      const req = { path: '/health' };
      const res = {};
      const next = vi.fn();

      mw(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should bypass non-api paths', () => {
      const auth = new XsuaaAuth({ credentials: { clientid: 'test' } });
      const mw = auth.middleware();
      const req = { path: '/dashboard' };
      const res = {};
      const next = vi.fn();

      mw(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should authenticate api paths with valid JWT', () => {
      const mockUser = {
        id: 'user@example.com',
        email: 'user@example.com',
        checkScope: vi.fn((scope) => scope === '$XSAPPNAME.Read'),
      };

      const mockPassport = createMockPassport({ err: null, user: mockUser, info: null });

      XsuaaAuth._loadPassport = () => mockPassport;
      XsuaaAuth._loadXssec = () => ({ JWTStrategy: MockJWTStrategy });

      const auth = new XsuaaAuth({ credentials: { clientid: 'test', clientsecret: 'sec' } });
      const mw = auth.middleware();

      const req = { path: '/api/migration/plan' };
      const res = {};
      const next = vi.fn();

      mw(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.type).toBe('xsuaa');
      expect(req.user.authenticated).toBe(true);
      expect(req.user.id).toBe('user@example.com');
      expect(req.user.scopes).toContain('read');
      expect(req.authInfo).toBe(mockUser);
    });

    it('should reject unauthenticated requests with 401', () => {
      const mockPassport = createMockPassport({ err: null, user: null, info: { message: 'No token' } });

      XsuaaAuth._loadPassport = () => mockPassport;
      XsuaaAuth._loadXssec = () => ({ JWTStrategy: MockJWTStrategy });

      const auth = new XsuaaAuth({ credentials: { clientid: 'test' } });
      const mw = auth.middleware();

      const req = { path: '/api/data' };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      mw(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Unauthorized' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 on authentication error', () => {
      const mockPassport = createMockPassport({ err: new Error('Token expired'), user: null, info: null });

      XsuaaAuth._loadPassport = () => mockPassport;
      XsuaaAuth._loadXssec = () => ({ JWTStrategy: MockJWTStrategy });

      const auth = new XsuaaAuth({ credentials: { clientid: 'test' } });
      const mw = auth.middleware();

      const req = { path: '/api/data' };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      mw(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('requireScope', () => {
    it('should allow request with matching scope', () => {
      const auth = new XsuaaAuth({ credentials: { clientid: 'test' } });
      const mw = auth.requireScope('write');

      const req = { user: { authenticated: true, scopes: ['read', 'write'] } };
      const res = {};
      const next = vi.fn();

      mw(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should deny request without matching scope', () => {
      const auth = new XsuaaAuth({ credentials: { clientid: 'test' } });
      const mw = auth.requireScope('admin');

      const req = { user: { authenticated: true, scopes: ['read'] } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      mw(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny unauthenticated request', () => {
      const auth = new XsuaaAuth({ credentials: { clientid: 'test' } });
      const mw = auth.requireScope('read');

      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      mw(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('scope mapping', () => {
    it('should map XSUAA scopes to internal names', () => {
      expect(SCOPE_MAP.Read).toBe('read');
      expect(SCOPE_MAP.Write).toBe('write');
      expect(SCOPE_MAP.Admin).toBe('admin');
    });

    it('should extract multiple scopes from security context', () => {
      const auth = new XsuaaAuth({ credentials: { clientid: 'test' } });
      const context = {
        checkScope: vi.fn((scope) => {
          return scope === '$XSAPPNAME.Read' || scope === '$XSAPPNAME.Write';
        }),
      };

      const scopes = auth._mapScopes(context);
      expect(scopes).toContain('read');
      expect(scopes).toContain('write');
      expect(scopes).not.toContain('admin');
    });

    it('should handle scope check errors gracefully', () => {
      const auth = new XsuaaAuth({ credentials: { clientid: 'test' } });
      const context = {
        checkScope: vi.fn(() => { throw new Error('Scope error'); }),
      };

      const scopes = auth._mapScopes(context);
      expect(scopes).toEqual([]);
    });
  });

  describe('credential loading', () => {
    it('should use explicit credentials', () => {
      const creds = { clientid: 'test', clientsecret: 'sec' };
      const auth = new XsuaaAuth({ credentials: creds });
      expect(auth._getCredentials()).toBe(creds);
    });

    it('should try XSUAA_CREDENTIALS env var', () => {
      const origEnv = process.env.XSUAA_CREDENTIALS;
      process.env.XSUAA_CREDENTIALS = '{"clientid":"env-cid","clientsecret":"env-sec"}';
      XsuaaAuth._loadXsenv = () => { throw new Error('not available'); };

      try {
        const auth = new XsuaaAuth();
        const creds = auth._getCredentials();
        expect(creds.clientid).toBe('env-cid');
      } finally {
        if (origEnv) process.env.XSUAA_CREDENTIALS = origEnv;
        else delete process.env.XSUAA_CREDENTIALS;
      }
    });

    it('should throw when no credentials found', () => {
      delete process.env.XSUAA_CREDENTIALS;
      XsuaaAuth._loadXsenv = () => { throw new Error('not available'); };

      const auth = new XsuaaAuth();
      expect(() => auth._getCredentials()).toThrow('XSUAA credentials not found');
    });
  });
});
