/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Rate Limiter
 *
 * In-memory sliding window rate limiter.
 * No external dependencies required.
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs ?? 60000; // 1 minute
    this.maxRequests = options.maxRequests ?? 100; // 100 req/min
    this.maxKeys = options.maxKeys ?? 10000;
    this.keyGenerator = options.keyGenerator || ((req) => req.ip || 'unknown');

    if (!Number.isInteger(this.windowMs) || this.windowMs <= 0) {
      throw new Error('windowMs must be a positive integer');
    }
    if (!Number.isInteger(this.maxRequests) || this.maxRequests <= 0) {
      throw new Error('maxRequests must be a positive integer');
    }
    if (!Number.isInteger(this.maxKeys) || this.maxKeys <= 0) {
      throw new Error('maxKeys must be a positive integer');
    }

    this._windows = new Map();
    this._cleanupInterval = setInterval(() => this._cleanup(), this.windowMs);
    if (this._cleanupInterval.unref) this._cleanupInterval.unref();
  }

  /** Express middleware */
  middleware() {
    return (req, res, next) => {
      const key = this._normalizeKey(this.keyGenerator(req));
      const now = Date.now();
      const windowStart = now - this.windowMs;

      if (!this._windows.has(key)) {
        this._ensureCapacity();
        this._windows.set(key, []);
      }

      const timestamps = this._windows.get(key).filter((t) => t > windowStart);
      this._windows.set(key, timestamps);

      if (timestamps.length >= this.maxRequests) {
        const resetAtMs = timestamps[0] + this.windowMs;
        const retryAfter = Math.max(0, Math.ceil((resetAtMs - now) / 1000));
        res.set('Retry-After', String(retryAfter));
        res.set('X-RateLimit-Limit', String(this.maxRequests));
        res.set('X-RateLimit-Remaining', '0');
        res.set('X-RateLimit-Reset', String(Math.ceil(resetAtMs / 1000)));
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
    const normalizedKey = this._normalizeKey(key);
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = (this._windows.get(normalizedKey) || []).filter((t) => t > windowStart);
    return {
      allowed: timestamps.length < this.maxRequests,
      remaining: Math.max(0, this.maxRequests - timestamps.length),
      resetAt: timestamps.length > 0 ? timestamps[0] + this.windowMs : now + this.windowMs,
    };
  }

  reset(key) {
    this._windows.delete(this._normalizeKey(key));
  }

  _normalizeKey(rawKey) {
    if (typeof rawKey === 'string') {
      const normalized = rawKey.trim();
      return normalized || 'unknown';
    }
    if (rawKey === null || rawKey === undefined) return 'unknown';
    return String(rawKey);
  }

  _ensureCapacity() {
    if (this._windows.size < this.maxKeys) return;

    // Evict the window with the oldest recent activity first.
    let keyToEvict;
    let oldestTs = Number.POSITIVE_INFINITY;

    for (const [existingKey, timestamps] of this._windows.entries()) {
      const latestTs = timestamps[timestamps.length - 1] || 0;
      if (latestTs < oldestTs) {
        oldestTs = latestTs;
        keyToEvict = existingKey;
      }
    }

    if (keyToEvict !== undefined) {
      this._windows.delete(keyToEvict);
    }
  }

  _cleanup() {
    const windowStart = Date.now() - this.windowMs;
    for (const [key, timestamps] of this._windows) {
      const valid = timestamps.filter((t) => t > windowStart);
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
