const { securityHeaders, cors } = require('../../../lib/security/helmet');

describe('securityHeaders', () => {
  it('sets all security headers', () => {
    const mw = securityHeaders();
    const headers = {};
    const res = {
      setHeader: (k, v) => { headers[k] = v; },
      removeHeader: vi.fn(),
    };
    const next = vi.fn();

    mw({}, res, next);
    expect(next).toHaveBeenCalled();
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Strict-Transport-Security']).toContain('max-age=');
    expect(headers['Referrer-Policy']).toBeDefined();
    expect(headers['Content-Security-Policy']).toContain("default-src");
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By');
  });

  it('respects disabled options', () => {
    const mw = securityHeaders({ contentSecurityPolicy: false, strictTransportSecurity: false });
    const headers = {};
    const res = {
      setHeader: (k, v) => { headers[k] = v; },
      removeHeader: vi.fn(),
    };
    mw({}, res, vi.fn());
    expect(headers['Content-Security-Policy']).toBeUndefined();
    expect(headers['Strict-Transport-Security']).toBeUndefined();
  });
});

describe('cors', () => {
  it('sets CORS headers for wildcard', () => {
    const mw = cors();
    const headers = {};
    const res = {
      setHeader: (k, v) => { headers[k] = v; },
      status: () => res,
      end: vi.fn(),
    };
    const next = vi.fn();

    mw({ get: () => 'http://example.com', method: 'GET' }, res, next);
    expect(next).toHaveBeenCalled();
    expect(headers['Access-Control-Allow-Origin']).toBe('*');
    expect(headers['Access-Control-Allow-Methods']).toContain('GET');
  });

  it('handles OPTIONS preflight', () => {
    const mw = cors();
    const headers = {};
    const res = {
      setHeader: (k, v) => { headers[k] = v; },
      status: (code) => { res._status = code; return res; },
      end: vi.fn(),
    };

    mw({ get: () => 'http://example.com', method: 'OPTIONS' }, res, vi.fn());
    expect(res._status).toBe(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('restricts to allowed origins', () => {
    const mw = cors({ origins: ['http://allowed.com'] });
    const headers = {};
    const res = {
      setHeader: (k, v) => { headers[k] = v; },
      status: () => res,
      end: vi.fn(),
    };
    const next = vi.fn();

    mw({ get: () => 'http://notallowed.com', method: 'GET' }, res, next);
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
  });
});
