const { RateLimiter } = require('../../../lib/security/rate-limiter');

describe('RateLimiter', () => {
  let limiter;

  afterEach(() => {
    if (limiter) limiter.destroy();
  });

  it('allows requests within limit', () => {
    limiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 });
    const result = limiter.check('user1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it('creates middleware function', () => {
    limiter = new RateLimiter({ maxRequests: 5 });
    const mw = limiter.middleware();
    expect(typeof mw).toBe('function');
  });

  it('passes requests within limit', () => {
    limiter = new RateLimiter({ maxRequests: 3, windowMs: 60000 });
    const mw = limiter.middleware();
    const req = { ip: '1.2.3.4' };
    const headers = {};
    const res = {
      set: (k, v) => { headers[k] = v; },
      status: () => res,
      json: vi.fn(),
    };
    const next = vi.fn();

    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(headers['X-RateLimit-Limit']).toBe('3');
    expect(headers['X-RateLimit-Remaining']).toBe('2');
  });

  it('blocks requests exceeding limit', () => {
    limiter = new RateLimiter({ maxRequests: 2, windowMs: 60000 });
    const mw = limiter.middleware();
    const req = { ip: '1.2.3.4' };
    const headers = {};
    const res = {
      set: (k, v) => { headers[k] = v; },
      status: (code) => { res._status = code; return res; },
      json: vi.fn(),
    };
    const next = vi.fn();

    mw(req, res, next);
    mw(req, res, next);
    next.mockClear();
    mw(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Too many requests' }));
  });

  it('resets rate limit for a key', () => {
    limiter = new RateLimiter({ maxRequests: 1, windowMs: 60000 });
    const mw = limiter.middleware();
    const req = { ip: '1.2.3.4' };
    const res = { set: () => {}, status: () => res, json: vi.fn() };
    const next = vi.fn();

    mw(req, res, next);
    limiter.reset('1.2.3.4');

    next.mockClear();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('uses custom key generator', () => {
    limiter = new RateLimiter({
      maxRequests: 1,
      keyGenerator: (req) => req.headers?.['x-api-key'] || 'anon',
    });
    const result = limiter.check('custom-key');
    expect(result.allowed).toBe(true);
  });

  it('cleanup removes expired entries', () => {
    limiter = new RateLimiter({ maxRequests: 100, windowMs: 1 });
    limiter._windows.set('old', [Date.now() - 1000]);
    limiter._cleanup();
    expect(limiter._windows.has('old')).toBe(false);
  });
});
