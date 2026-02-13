const { RequestContext } = require('../../../lib/monitoring/request-context');

describe('RequestContext', () => {
  let ctx;

  beforeEach(() => { ctx = new RequestContext(); });

  it('generates unique IDs', () => {
    const id1 = ctx.generateId();
    const id2 = ctx.generateId();
    expect(id1).toMatch(/^req-/);
    expect(id2).toMatch(/^req-/);
    expect(id1).not.toBe(id2);
  });

  it('middleware sets request ID', () => {
    const mw = ctx.middleware();
    const headers = {};
    const req = { get: () => undefined };
    const res = { setHeader: (k, v) => { headers[k] = v; } };
    const next = vi.fn();

    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.requestId).toMatch(/^req-/);
    expect(headers['X-Request-ID']).toBe(req.requestId);
    expect(headers['X-Correlation-ID']).toBe(req.requestId);
  });

  it('middleware preserves existing X-Request-ID', () => {
    const mw = ctx.middleware();
    const headers = {};
    const req = { get: (name) => name === 'X-Request-ID' ? 'existing-id' : undefined };
    const res = { setHeader: (k, v) => { headers[k] = v; } };

    mw(req, res, vi.fn());
    expect(req.requestId).toBe('existing-id');
  });
});
