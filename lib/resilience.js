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
 * Resilience Module — Retry, Circuit Breaker, Resilient Executor
 *
 * Provides fault-tolerance primitives for SAP API calls:
 *   - RetryPolicy: exponential backoff with jitter
 *   - CircuitBreaker: fail-fast when downstream is unhealthy
 *   - ResilientExecutor: combines both for production use
 */

'use strict';

const Logger = require('./logger');

// ─────────────────────────────────────────────────────────────────────────────
// RetryPolicy
// ─────────────────────────────────────────────────────────────────────────────

class RetryPolicy {
  /**
   * @param {object} [options]
   * @param {number} [options.maxRetries=3]
   * @param {number} [options.baseDelayMs=200]
   * @param {number} [options.maxDelayMs=5000]
   * @param {Array<string|Function>} [options.retryableErrors] — error codes or error classes to retry
   * @param {string} [options.logLevel]
   */
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 200;
    this.maxDelayMs = options.maxDelayMs ?? 5000;
    this.retryableErrors = options.retryableErrors || [];
    this.log = new Logger('retry-policy', { level: options.logLevel || 'warn' });
  }

  /**
   * Execute fn with retry logic. Returns the result or throws after exhausting retries.
   * @param {Function} fn — async or sync function to execute
   * @returns {Promise<*>}
   */
  async execute(fn) {
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt === this.maxRetries) break;
        if (!this._isRetryable(err)) break;

        const delay = this._calculateDelay(attempt);
        this.log.info(`Retry ${attempt + 1}/${this.maxRetries} after ${delay}ms: ${err.message}`);
        await this._sleep(delay);
      }
    }
    throw lastError;
  }

  /** @private */
  _isRetryable(err) {
    if (this.retryableErrors.length === 0) return true;
    return this.retryableErrors.some((matcher) => {
      if (typeof matcher === 'string') {
        return err.code === matcher || err.message?.includes(matcher);
      }
      if (typeof matcher === 'function') {
        return err instanceof matcher;
      }
      return false;
    });
  }

  /** @private — exponential backoff with ±25% jitter */
  _calculateDelay(attempt) {
    const exponential = this.baseDelayMs * Math.pow(2, attempt);
    const capped = Math.min(exponential, this.maxDelayMs);
    const jitter = capped * (0.75 + Math.random() * 0.5); // ±25%
    return Math.round(jitter);
  }

  /** @private */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CircuitBreaker
// ─────────────────────────────────────────────────────────────────────────────

const CB_STATES = { CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half-open' };

class CircuitBreakerOpenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
    this.code = 'CIRCUIT_OPEN';
  }
}

class CircuitBreaker {
  /**
   * @param {object} [options]
   * @param {number} [options.failureThreshold=5]
   * @param {number} [options.resetTimeoutMs=30000]
   * @param {number} [options.halfOpenMax=1]
   * @param {Function} [options.onStateChange] — callback(fromState, toState)
   * @param {string} [options.logLevel]
   */
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    this.halfOpenMax = options.halfOpenMax ?? 1;
    this.onStateChange = options.onStateChange || null;
    this.log = new Logger('circuit-breaker', { level: options.logLevel || 'warn' });

    this._state = CB_STATES.CLOSED;
    this._failureCount = 0;
    this._successCount = 0;
    this._lastFailureTime = null;
    this._halfOpenAttempts = 0;
  }

  getState() {
    return this._state;
  }

  getStats() {
    return {
      state: this._state,
      failureCount: this._failureCount,
      successCount: this._successCount,
      lastFailureTime: this._lastFailureTime,
    };
  }

  reset() {
    const from = this._state;
    this._state = CB_STATES.CLOSED;
    this._failureCount = 0;
    this._successCount = 0;
    this._lastFailureTime = null;
    this._halfOpenAttempts = 0;
    if (from !== CB_STATES.CLOSED && this.onStateChange) {
      this.onStateChange(from, CB_STATES.CLOSED);
    }
  }

  /**
   * Execute fn through the circuit breaker.
   * @param {Function} fn
   * @returns {Promise<*>}
   */
  async execute(fn) {
    if (this._state === CB_STATES.OPEN) {
      if (this._shouldAttemptReset()) {
        this._transitionTo(CB_STATES.HALF_OPEN);
      } else {
        throw new CircuitBreakerOpenError(`Circuit breaker is open (${this._failureCount} failures)`);
      }
    }

    if (this._state === CB_STATES.HALF_OPEN) {
      if (this._halfOpenAttempts >= this.halfOpenMax) {
        throw new CircuitBreakerOpenError('Circuit breaker is half-open, max attempts reached');
      }
      this._halfOpenAttempts++;
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }

  /** @private */
  _shouldAttemptReset() {
    if (!this._lastFailureTime) return true;
    return Date.now() - this._lastFailureTime >= this.resetTimeoutMs;
  }

  /** @private */
  _onSuccess() {
    this._successCount++;
    if (this._state === CB_STATES.HALF_OPEN) {
      this._transitionTo(CB_STATES.CLOSED);
      this._failureCount = 0;
      this._halfOpenAttempts = 0;
    } else {
      this._failureCount = 0;
    }
  }

  /** @private */
  _onFailure() {
    this._failureCount++;
    this._lastFailureTime = Date.now();
    if (this._state === CB_STATES.HALF_OPEN) {
      this._transitionTo(CB_STATES.OPEN);
      this._halfOpenAttempts = 0;
    } else if (this._failureCount >= this.failureThreshold) {
      this._transitionTo(CB_STATES.OPEN);
    }
  }

  /** @private */
  _transitionTo(newState) {
    if (this._state === newState) return;
    const from = this._state;
    this._state = newState;
    this.log.info(`Circuit breaker: ${from} → ${newState}`);
    if (this.onStateChange) this.onStateChange(from, newState);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ResilientExecutor
// ─────────────────────────────────────────────────────────────────────────────

class ResilientExecutor {
  /**
   * @param {object} [options]
   * @param {object} [options.retry] — RetryPolicy options
   * @param {object} [options.circuitBreaker] — CircuitBreaker options
   */
  constructor(options = {}) {
    this.retryPolicy = new RetryPolicy(options.retry || {});
    this.circuitBreaker = new CircuitBreaker(options.circuitBreaker || {});
  }

  /**
   * Execute fn through circuit breaker wrapping retry policy.
   * @param {Function} fn
   * @returns {Promise<*>}
   */
  async execute(fn) {
    return this.circuitBreaker.execute(() => this.retryPolicy.execute(fn));
  }

  /**
   * Factory: create a ResilientExecutor with SAP-tuned defaults.
   * @param {object} [overrides]
   * @returns {ResilientExecutor}
   */
  static forSapApi(overrides = {}) {
    return new ResilientExecutor({
      retry: {
        maxRetries: 3,
        baseDelayMs: 500,
        maxDelayMs: 10000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'RFC_COMMUNICATION_FAILURE'],
        ...overrides.retry,
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeoutMs: 30000,
        halfOpenMax: 1,
        ...overrides.circuitBreaker,
      },
    });
  }
}

module.exports = {
  RetryPolicy,
  CircuitBreaker,
  CircuitBreakerOpenError,
  ResilientExecutor,
  CB_STATES,
};
