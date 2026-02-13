const { HealthCheck } = require('../../../lib/monitoring/health');

describe('HealthCheck', () => {
  let health;

  beforeEach(() => { health = new HealthCheck({ version: '1.0.0-test' }); });

  describe('liveness', () => {
    it('returns up status', async () => {
      const result = await health.liveness();
      expect(result.status).toBe('up');
      expect(result.version).toBe('1.0.0-test');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.pid).toBe(process.pid);
      expect(result.memory.rss).toBeGreaterThan(0);
      expect(result.memory.heapUsed).toBeGreaterThan(0);
    });
  });

  describe('readiness', () => {
    it('returns up with no checks', async () => {
      const result = await health.readiness();
      expect(result.status).toBe('up');
      expect(result.checks).toEqual({});
    });

    it('returns up when all checks pass', async () => {
      health.register('db', async () => ({ status: 'up' }));
      health.register('cache', async () => ({ status: 'up' }));
      const result = await health.readiness();
      expect(result.status).toBe('up');
      expect(result.checks.db.status).toBe('up');
      expect(result.checks.cache.status).toBe('up');
    });

    it('returns degraded when a check fails', async () => {
      health.register('db', async () => ({ status: 'up' }));
      health.register('sap', async () => ({ status: 'down', error: 'Connection refused' }));
      const result = await health.readiness();
      expect(result.status).toBe('degraded');
      expect(result.checks.sap.status).toBe('down');
    });

    it('handles check timeout', async () => {
      health.register('slow', () => new Promise(() => {})); // never resolves
      const result = await health.readiness();
      expect(result.status).toBe('degraded');
      expect(result.checks.slow.status).toBe('down');
      expect(result.checks.slow.error).toContain('Timeout');
    }, 10000);

    it('handles check exception', async () => {
      health.register('broken', async () => { throw new Error('Check failed'); });
      const result = await health.readiness();
      expect(result.status).toBe('degraded');
      expect(result.checks.broken.error).toBe('Check failed');
    });
  });

  describe('registerRoutes', () => {
    it('registers /health and /ready routes', () => {
      const routes = [];
      const router = { get: (path, handler) => routes.push({ path, handler }) };
      health.registerRoutes(router);
      expect(routes).toHaveLength(2);
      expect(routes[0].path).toBe('/health');
      expect(routes[1].path).toBe('/ready');
    });
  });
});
