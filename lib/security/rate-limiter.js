/**
 * Rate Limiter
 *
 * In-memory sliding window rate limiter.
 * No external dependencies required.
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000;      // 1 minute
    this.maxRequests = options.maxRequests || 100;    // 100 req/min
    this.keyGenerator = options.keyGenerator || ((req) => req.ip || 'unknown');
    this._windows = new Map();
    this._cleanupInterval = setInterval(() => this._cleanup(), this.windowMs);
    if (this._cleanupInterval.unref) this._cleanupInterval.unref();
  }

  /** Express middleware */
  middleware() {
    return (req, res, next) => {
      const key = this.keyGenerator(req);
      const now = Date.now();
      const windowStart = now - this.windowMs;

      if (!this._windows.has(key)) {
        this._windows.set(key, []);
      }

      const timestamps = this._windows.get(key).filter(t => t > windowStart);
      this._windows.set(key, timestamps);

      if (timestamps.length >= this.maxRequests) {
        const retryAfter = Math.ceil((timestamps[0] + this.windowMs - now) / 1000);
        res.set('Retry-After', String(retryAfter));
        res.set('X-RateLimit-Limit', String(this.maxRequests));
        res.set('X-RateLimit-Remaining', '0');
        res.set('X-RateLimit-Reset', String(Math.ceil((timestamps[0] + this.windowMs) / 1000)));
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter,
        });
      }

      timestamps.push(now);
      res.set('X-RateLimit-Limit', String(this.maxRequests));
      res.set('X-RateLimit-Remaining', String(this.maxRequests - timestamps.length));
      next();
    };
  }

  check(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = (this._windows.get(key) || []).filter(t => t > windowStart);
    return {
      allowed: timestamps.length < this.maxRequests,
      remaining: Math.max(0, this.maxRequests - timestamps.length),
      resetAt: timestamps.length > 0 ? timestamps[0] + this.windowMs : now + this.windowMs,
    };
  }

  reset(key) {
    this._windows.delete(key);
  }

  _cleanup() {
    const windowStart = Date.now() - this.windowMs;
    for (const [key, timestamps] of this._windows) {
      const valid = timestamps.filter(t => t > windowStart);
      if (valid.length === 0) {
        this._windows.delete(key);
      } else {
        this._windows.set(key, valid);
      }
    }
  }

  destroy() {
    clearInterval(this._cleanupInterval);
    this._windows.clear();
  }
}

module.exports = { RateLimiter };
