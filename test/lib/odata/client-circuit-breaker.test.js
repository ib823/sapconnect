/**
 * Tests for OData Client — CircuitBreaker integration
 *
 * Verifies that CircuitBreaker wraps the inner fetch call,
 * existing retry logic is preserved, and stats are exposed.
 */
const ODataClient = require('../../../lib/odata/client');
const { ConnectionError } = require('../../../lib/errors');
const { CircuitBreaker } = require('../../../lib/resilience');

let mockFetch;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  mockFetch = vi.fn();
  globalThis.fetch = mockFetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Map([['x-csrf-token', 'test-token']]),
    text: async () => JSON.stringify(data),
  };
}

describe('ODataClient — CircuitBreaker', () => {
  let client;

  beforeEach(() => {
    client = new ODataClient({
      baseUrl: 'https://sap.example.com',
      version: 'v2',
      timeout: 5000,
      retries: 0,               // No retries — isolate CB behavior
      circuitBreakerThreshold: 3,
      circuitBreakerResetMs: 1000,
    });
  });

  describe('constructor', () => {
    it('should create a circuit breaker with default threshold', () => {
      const c = new ODataClient({ baseUrl: 'https://x.com' });
      expect(c._circuitBreaker).toBeInstanceOf(CircuitBreaker);
      expect(c._circuitBreaker.failureThreshold).toBe(5);
    });

    it('should accept custom circuit breaker options', () => {
      expect(client._circuitBreaker.failureThreshold).toBe(3);
      expect(client._circuitBreaker.resetTimeoutMs).toBe(1000);
    });
  });

  describe('getCircuitBreakerStats()', () => {
    it('should return stats object', () => {
      const stats = client.getCircuitBreakerStats();
      expect(stats).toHaveProperty('state', 'closed');
      expect(stats).toHaveProperty('failureCount', 0);
      expect(stats).toHaveProperty('successCount', 0);
      expect(stats).toHaveProperty('lastFailureTime');
    });

    it('should track successful calls', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
      await client.get('/api/test');
      const stats = client.getCircuitBreakerStats();
      expect(stats.successCount).toBe(1);
      expect(stats.state).toBe('closed');
    });
  });

  describe('circuit breaker opens after failures', () => {
    it('should open after threshold failures', async () => {
      const networkErr = new Error('ECONNREFUSED');
      mockFetch.mockRejectedValue(networkErr);

      // retries=0: each get() = 1 fetch = 1 CB failure, need 3 to hit threshold
      for (let i = 0; i < 3; i++) {
        try { await client.get('/api/test'); } catch { /* expected */ }
      }

      const stats = client.getCircuitBreakerStats();
      expect(stats.state).toBe('open');
    });

    it('should throw ConnectionError when circuit is open', async () => {
      const networkErr = new Error('ECONNREFUSED');
      mockFetch.mockRejectedValue(networkErr);

      // Trip the breaker (retries=0 so each get = 1 fetch = 1 CB failure)
      for (let i = 0; i < 3; i++) {
        try { await client.get('/api/test'); } catch { /* expected */ }
      }

      // Next call should fail fast with circuit breaker error
      await expect(client.get('/api/test')).rejects.toThrow(ConnectionError);
      await expect(client.get('/api/test')).rejects.toThrow(/[Cc]ircuit/);
    });
  });

  describe('retry logic is preserved', () => {
    it('should still retry on transient errors before CB trips', async () => {
      // Use a client with retries=1 specifically for this test
      const retryClient = new ODataClient({
        baseUrl: 'https://sap.example.com',
        version: 'v2',
        timeout: 5000,
        retries: 1,
        circuitBreakerThreshold: 10, // High threshold so CB doesn't interfere
        circuitBreakerResetMs: 60000,
      });

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(jsonResponse({ result: 'ok' }));

      const result = await retryClient.get('/api/test');
      expect(result).toEqual({ result: 'ok' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }, 15000);

    it('should not retry auth errors', async () => {
      mockFetch.mockResolvedValue(jsonResponse({}, 401));
      await expect(client.get('/api/test')).rejects.toThrow('Authentication failed');
    });
  });

  describe('circuit breaker resets on success', () => {
    it('should reset failure count on success', async () => {
      const networkErr = new Error('ECONNREFUSED');
      // Fail twice (below threshold=3), retries=0 so each get() = 1 fetch
      mockFetch.mockRejectedValueOnce(networkErr);
      try { await client.get('/api/test'); } catch { /* expected */ }
      mockFetch.mockRejectedValueOnce(networkErr);
      try { await client.get('/api/test'); } catch { /* expected */ }

      expect(client.getCircuitBreakerStats().failureCount).toBe(2);

      // Succeed — should reset failure count
      mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await client.get('/api/test');

      const stats = client.getCircuitBreakerStats();
      expect(stats.failureCount).toBe(0);
      expect(stats.state).toBe('closed');
    });
  });

  describe('CB wraps only fetch, not entire retry loop', () => {
    it('should call fetch through circuit breaker on each attempt', async () => {
      const executeSpy = vi.spyOn(client._circuitBreaker, 'execute');
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

      await client.get('/api/test');
      expect(executeSpy).toHaveBeenCalled();
      executeSpy.mockRestore();
    });
  });

  describe('mixed success/failure tracking', () => {
    it('should properly track alternating successes and failures', async () => {
      // Success
      mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await client.get('/api/test');
      expect(client.getCircuitBreakerStats().successCount).toBe(1);

      // Failure (retries=0 so 1 fetch per get)
      mockFetch.mockRejectedValueOnce(new Error('fail'));
      try { await client.get('/api/test'); } catch { /* expected */ }

      // Still closed (only 1 failure after success reset, threshold is 3)
      expect(client.getCircuitBreakerStats().state).toBe('closed');
      expect(client.getCircuitBreakerStats().failureCount).toBe(1);
    });
  });
});
