/**
 * Tests for RFC Client — CircuitBreaker integration
 *
 * Verifies that CircuitBreaker wraps _callWithTimeout,
 * CircuitBreakerOpenError maps to RfcError, and stats are exposed.
 */
const RfcClient = require('../../../lib/rfc/client');
const { RfcError } = require('../../../lib/errors');
const { CircuitBreaker, CircuitBreakerOpenError } = require('../../../lib/resilience');

describe('RfcClient — CircuitBreaker', () => {
  const connParams = { ashost: '10.0.0.1', sysnr: '00', client: '100', user: 'TEST', passwd: 'pass' };
  let client;
  let mockNodeRfcClient;

  beforeEach(() => {
    mockNodeRfcClient = {
      open: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      call: vi.fn().mockResolvedValue({}),
    };

    vi.spyOn(RfcClient, '_loadNodeRfc').mockReturnValue({
      Client: vi.fn().mockImplementation(() => mockNodeRfcClient),
    });

    client = new RfcClient(connParams, {
      timeout: 5000,
      retries: 1,
      circuitBreakerThreshold: 3,
      circuitBreakerResetMs: 1000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a circuit breaker instance', () => {
      expect(client._circuitBreaker).toBeInstanceOf(CircuitBreaker);
    });

    it('should use default threshold of 5', () => {
      const c = new RfcClient(connParams);
      expect(c._circuitBreaker.failureThreshold).toBe(5);
    });

    it('should accept custom threshold', () => {
      expect(client._circuitBreaker.failureThreshold).toBe(3);
    });
  });

  describe('getCircuitBreakerStats()', () => {
    it('should return initial stats', () => {
      const stats = client.getCircuitBreakerStats();
      expect(stats.state).toBe('closed');
      expect(stats.failureCount).toBe(0);
      expect(stats.successCount).toBe(0);
    });

    it('should track successful calls', async () => {
      mockNodeRfcClient.call.mockResolvedValue({ ET_DATA: [] });
      await client.call('BAPI_TEST', {});
      const stats = client.getCircuitBreakerStats();
      expect(stats.successCount).toBe(1);
    });
  });

  describe('circuit breaker wraps _callWithTimeout', () => {
    it('should call through circuit breaker', async () => {
      const executeSpy = vi.spyOn(client._circuitBreaker, 'execute');
      mockNodeRfcClient.call.mockResolvedValue({ OK: true });

      await client.call('RFC_PING');
      expect(executeSpy).toHaveBeenCalled();
      executeSpy.mockRestore();
    });
  });

  describe('CircuitBreakerOpenError → RfcError', () => {
    it('should convert CircuitBreakerOpenError to RfcError', async () => {
      // Force the circuit breaker open
      vi.spyOn(client._circuitBreaker, 'execute').mockRejectedValue(
        new CircuitBreakerOpenError('Circuit breaker is open')
      );

      await expect(client.call('BAPI_TEST')).rejects.toThrow(RfcError);
      await expect(client.call('BAPI_TEST')).rejects.toThrow(/[Cc]ircuit breaker open/);
    });

    it('should include function module name in RfcError', async () => {
      vi.spyOn(client._circuitBreaker, 'execute').mockRejectedValue(
        new CircuitBreakerOpenError('Circuit is open')
      );

      try {
        await client.call('MY_FUNC');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(RfcError);
        expect(err.message).toContain('MY_FUNC');
        expect(err.details.circuitBreaker).toBe(true);
      }
    });
  });

  describe('circuit breaker trips after failures', () => {
    it('should open after threshold transient failures', async () => {
      // Make the RFC call fail with a non-transient error that gets wrapped as RfcError
      // We need the inner call to fail without being a RfcError instance
      // so the CB registers the failure before the error is rethrown
      mockNodeRfcClient.call.mockImplementation(() => {
        throw new Error('timeout: connection timed out');
      });

      // Each call attempt uses CB. With retries=1, two CB.execute calls per client.call
      for (let i = 0; i < 3; i++) {
        try { await client.call('BAPI_TEST'); } catch { /* expected */ }
      }

      const stats = client.getCircuitBreakerStats();
      expect(stats.state).toBe('open');
    });
  });

  describe('retry logic preserved', () => {
    it('should still retry on transient errors', async () => {
      mockNodeRfcClient.call
        .mockRejectedValueOnce(new Error('Connection reset'))
        .mockResolvedValueOnce({ OK: true });

      const result = await client.call('BAPI_TEST');
      expect(result).toEqual({ OK: true });
    });
  });

  describe('success resets failure count', () => {
    it('should reset after a successful call', async () => {
      mockNodeRfcClient.call.mockRejectedValueOnce(new Error('timeout'));
      try { await client.call('BAPI_TEST'); } catch { /* expected */ }

      mockNodeRfcClient.call.mockResolvedValue({ OK: true });
      await client.call('BAPI_TEST');

      expect(client.getCircuitBreakerStats().failureCount).toBe(0);
    });
  });
});
