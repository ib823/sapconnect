/**
 * Tests for lib/resilience.js — RetryPolicy, CircuitBreaker, ResilientExecutor
 */

const {
  RetryPolicy,
  CircuitBreaker,
  CircuitBreakerOpenError,
  ResilientExecutor,
  CB_STATES,
} = require('../../lib/resilience');

// ── RetryPolicy ──────────────────────────────────────────────────

describe('RetryPolicy', () => {
  it('should return result on first success', async () => {
    const policy = new RetryPolicy({ maxRetries: 3 });
    const result = await policy.execute(() => 'ok');
    expect(result).toBe('ok');
  });

  it('should retry on failure and succeed', async () => {
    const policy = new RetryPolicy({ maxRetries: 3, baseDelayMs: 1, maxDelayMs: 5 });
    let attempts = 0;
    const result = await policy.execute(() => {
      attempts++;
      if (attempts < 3) throw new Error('transient');
      return 'recovered';
    });
    expect(result).toBe('recovered');
    expect(attempts).toBe(3);
  });

  it('should throw after exhausting retries', async () => {
    const policy = new RetryPolicy({ maxRetries: 2, baseDelayMs: 1, maxDelayMs: 5 });
    await expect(
      policy.execute(() => { throw new Error('permanent'); })
    ).rejects.toThrow('permanent');
  });

  it('should respect retryableErrors — string match on code', async () => {
    const policy = new RetryPolicy({
      maxRetries: 3,
      baseDelayMs: 1,
      retryableErrors: ['ECONNRESET'],
    });
    let attempts = 0;
    const result = await policy.execute(() => {
      attempts++;
      if (attempts < 2) {
        const err = new Error('reset');
        err.code = 'ECONNRESET';
        throw err;
      }
      return 'ok';
    });
    expect(result).toBe('ok');
    expect(attempts).toBe(2);
  });

  it('should not retry non-retryable errors', async () => {
    const policy = new RetryPolicy({
      maxRetries: 3,
      baseDelayMs: 1,
      retryableErrors: ['ECONNRESET'],
    });
    let attempts = 0;
    await expect(
      policy.execute(() => {
        attempts++;
        throw new Error('not retryable');
      })
    ).rejects.toThrow('not retryable');
    expect(attempts).toBe(1);
  });

  it('should respect retryableErrors — string match on message', async () => {
    const policy = new RetryPolicy({
      maxRetries: 3,
      baseDelayMs: 1,
      retryableErrors: ['timeout'],
    });
    let attempts = 0;
    const result = await policy.execute(() => {
      attempts++;
      if (attempts < 2) throw new Error('connection timeout');
      return 'ok';
    });
    expect(result).toBe('ok');
  });

  it('should respect retryableErrors — class match', async () => {
    const policy = new RetryPolicy({
      maxRetries: 3,
      baseDelayMs: 1,
      retryableErrors: [TypeError],
    });
    let attempts = 0;
    const result = await policy.execute(() => {
      attempts++;
      if (attempts < 2) throw new TypeError('type issue');
      return 'ok';
    });
    expect(result).toBe('ok');
  });

  it('should apply exponential backoff with jitter', () => {
    const policy = new RetryPolicy({ baseDelayMs: 100, maxDelayMs: 5000 });
    // attempt 0: base * 2^0 = 100 → ±25% → [75, 125]
    const d0 = policy._calculateDelay(0);
    expect(d0).toBeGreaterThanOrEqual(75);
    expect(d0).toBeLessThanOrEqual(125);

    // attempt 2: base * 2^2 = 400 → ±25% → [300, 500]
    const d2 = policy._calculateDelay(2);
    expect(d2).toBeGreaterThanOrEqual(300);
    expect(d2).toBeLessThanOrEqual(500);
  });

  it('should cap delay at maxDelayMs', () => {
    const policy = new RetryPolicy({ baseDelayMs: 1000, maxDelayMs: 2000 });
    // attempt 5: base * 2^5 = 32000, capped to 2000 → ±25% → [1500, 2500]
    const d = policy._calculateDelay(5);
    expect(d).toBeLessThanOrEqual(2500);
  });

  it('should work with async functions', async () => {
    const policy = new RetryPolicy({ maxRetries: 2, baseDelayMs: 1 });
    let attempts = 0;
    const result = await policy.execute(async () => {
      attempts++;
      if (attempts < 2) throw new Error('async fail');
      return 'async ok';
    });
    expect(result).toBe('async ok');
  });
});

// ── CircuitBreaker ───────────────────────────────────────────────

describe('CircuitBreaker', () => {
  it('should start in closed state', () => {
    const cb = new CircuitBreaker();
    expect(cb.getState()).toBe(CB_STATES.CLOSED);
  });

  it('should pass through calls when closed', async () => {
    const cb = new CircuitBreaker();
    const result = await cb.execute(() => 'ok');
    expect(result).toBe('ok');
    expect(cb.getStats().successCount).toBe(1);
  });

  it('should open after failureThreshold failures', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(() => { throw new Error('fail'); })).rejects.toThrow('fail');
    }
    expect(cb.getState()).toBe(CB_STATES.OPEN);
  });

  it('should reject calls immediately when open', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 60000 });
    await expect(cb.execute(() => { throw new Error('fail'); })).rejects.toThrow('fail');
    expect(cb.getState()).toBe(CB_STATES.OPEN);

    await expect(cb.execute(() => 'ok')).rejects.toThrow(CircuitBreakerOpenError);
  });

  it('should transition to half-open after resetTimeout', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 10 });
    await expect(cb.execute(() => { throw new Error('fail'); })).rejects.toThrow();
    expect(cb.getState()).toBe(CB_STATES.OPEN);

    // Wait for reset timeout
    await new Promise((r) => setTimeout(r, 15));

    const result = await cb.execute(() => 'recovered');
    expect(result).toBe('recovered');
    expect(cb.getState()).toBe(CB_STATES.CLOSED);
  });

  it('should re-open on failure in half-open state', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 10, halfOpenMax: 1 });
    await expect(cb.execute(() => { throw new Error('fail'); })).rejects.toThrow();

    await new Promise((r) => setTimeout(r, 15));
    // Half-open trial fails
    await expect(cb.execute(() => { throw new Error('still fail'); })).rejects.toThrow('still fail');
    expect(cb.getState()).toBe(CB_STATES.OPEN);
  });

  it('should limit half-open attempts', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 60000, halfOpenMax: 1 });
    await expect(cb.execute(() => { throw new Error('fail'); })).rejects.toThrow();
    expect(cb.getState()).toBe(CB_STATES.OPEN);

    // Manually set lastFailureTime far in the past to trigger half-open
    cb._lastFailureTime = Date.now() - 120000;

    // First half-open attempt fails → back to open
    await expect(cb.execute(() => { throw new Error('still fail'); })).rejects.toThrow('still fail');
    expect(cb.getState()).toBe(CB_STATES.OPEN);

    // Now still open with recent failure, should throw CircuitBreakerOpenError
    await expect(cb.execute(() => 'ok')).rejects.toThrow(CircuitBreakerOpenError);
  });

  it('should invoke onStateChange callback', async () => {
    const transitions = [];
    const cb = new CircuitBreaker({
      failureThreshold: 2,
      onStateChange: (from, to) => transitions.push({ from, to }),
    });
    await expect(cb.execute(() => { throw new Error('f1'); })).rejects.toThrow();
    await expect(cb.execute(() => { throw new Error('f2'); })).rejects.toThrow();
    expect(transitions).toEqual([{ from: 'closed', to: 'open' }]);
  });

  it('should reset to closed state', async () => {
    const transitions = [];
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      onStateChange: (from, to) => transitions.push({ from, to }),
    });
    await expect(cb.execute(() => { throw new Error('fail'); })).rejects.toThrow();
    expect(cb.getState()).toBe(CB_STATES.OPEN);

    cb.reset();
    expect(cb.getState()).toBe(CB_STATES.CLOSED);
    expect(cb.getStats().failureCount).toBe(0);
    expect(transitions.some((t) => t.to === 'closed')).toBe(true);
  });

  it('should reset failure count on success in closed state', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    await expect(cb.execute(() => { throw new Error('f'); })).rejects.toThrow();
    await expect(cb.execute(() => { throw new Error('f'); })).rejects.toThrow();
    // 2 failures, one success resets
    await cb.execute(() => 'ok');
    expect(cb.getStats().failureCount).toBe(0);
  });

  it('should expose CircuitBreakerOpenError with code', () => {
    const err = new CircuitBreakerOpenError('test');
    expect(err.name).toBe('CircuitBreakerOpenError');
    expect(err.code).toBe('CIRCUIT_OPEN');
    expect(err instanceof Error).toBe(true);
  });
});

// ── ResilientExecutor ────────────────────────────────────────────

describe('ResilientExecutor', () => {
  it('should combine retry + circuit breaker', async () => {
    const executor = new ResilientExecutor({
      retry: { maxRetries: 2, baseDelayMs: 1 },
      circuitBreaker: { failureThreshold: 10 },
    });
    let attempts = 0;
    const result = await executor.execute(() => {
      attempts++;
      if (attempts < 2) throw new Error('transient');
      return 'ok';
    });
    expect(result).toBe('ok');
  });

  it('should trip circuit breaker after repeated failures', async () => {
    const executor = new ResilientExecutor({
      retry: { maxRetries: 0, baseDelayMs: 1 },
      circuitBreaker: { failureThreshold: 2, resetTimeoutMs: 60000 },
    });
    // Two failures to trip the breaker (maxRetries=0 means no retries)
    await expect(executor.execute(() => { throw new Error('f1'); })).rejects.toThrow('f1');
    await expect(executor.execute(() => { throw new Error('f2'); })).rejects.toThrow('f2');
    // Now circuit is open
    await expect(executor.execute(() => 'ok')).rejects.toThrow(CircuitBreakerOpenError);
  });

  it('should create SAP-tuned executor via factory', () => {
    const executor = ResilientExecutor.forSapApi();
    expect(executor.retryPolicy.maxRetries).toBe(3);
    expect(executor.retryPolicy.baseDelayMs).toBe(500);
    expect(executor.circuitBreaker.failureThreshold).toBe(5);
  });

  it('should accept overrides in factory', () => {
    const executor = ResilientExecutor.forSapApi({
      retry: { maxRetries: 5 },
      circuitBreaker: { failureThreshold: 10 },
    });
    expect(executor.retryPolicy.maxRetries).toBe(5);
    expect(executor.circuitBreaker.failureThreshold).toBe(10);
  });
});
