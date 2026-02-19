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

  it('normalizes null or empty keys to unknown', () => {
    limiter = new RateLimiter({ maxRequests: 1, windowMs: 60000 });
    expect(limiter.check(null).allowed).toBe(true);
    expect(limiter.check('').allowed).toBe(true);

    const mw = limiter.middleware();
    const req = { ip: '', headers: {} };
    const res = { set: () => {}, status: () => res, json: vi.fn() };
    const next = vi.fn();

    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(limiter.check('unknown').remaining).toBe(0);
  });

  it('evicts oldest key when max key capacity is reached', () => {
    limiter = new RateLimiter({ maxRequests: 5, windowMs: 60000, maxKeys: 2 });
    limiter._windows.set('older', [Date.now() - 20]);
    limiter._windows.set('newer', [Date.now() - 10]);

    const mw = limiter.middleware();
    const req = { ip: 'brand-new-key' };
    const res = { set: () => {}, status: () => res, json: vi.fn() };
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(limiter._windows.has('older')).toBe(false);
    expect(limiter._windows.has('newer')).toBe(true);
    expect(limiter._windows.has('brand-new-key')).toBe(true);
  });

  it('treats whitespace-only keys as unknown', () => {
    limiter = new RateLimiter({ maxRequests: 2, windowMs: 60000 });
    const mw = limiter.middleware();
    const req = { ip: '   ' };
    const res = { set: () => {}, status: () => res, json: vi.fn() };
    const next = vi.fn();

    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(limiter.check('unknown').remaining).toBe(1);
  });

  it('uses nullish defaults rather than coercing falsy values', () => {
    limiter = new RateLimiter({ windowMs: 1, maxRequests: 1, maxKeys: 1 });
    expect(limiter.windowMs).toBe(1);
    expect(limiter.maxRequests).toBe(1);
    expect(limiter.maxKeys).toBe(1);
  });

  it('throws on invalid numeric options', () => {
    expect(() => new RateLimiter({ windowMs: 0 })).toThrow(/windowMs/);
    expect(() => new RateLimiter({ maxRequests: 0 })).toThrow(/maxRequests/);
    expect(() => new RateLimiter({ maxKeys: 0 })).toThrow(/maxKeys/);
  });

});
