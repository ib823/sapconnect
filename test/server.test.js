/**
 * Tests for server.js — createApp factory
 *
 * Verifies Express app creation, route registration, security headers,
 * health/readiness/metrics endpoints, dashboard, audit, info, 404 handling,
 * and internal reference objects.
 *
 * Uses a lightweight HTTP helper to issue requests against the Express app
 * without requiring external test utilities like supertest.
 */

const http = require('http');
const { createApp, installCrashHandlers } = require('../server');
const { HealthCheck } = require('../lib/monitoring/health');
const { MetricsCollector } = require('../lib/monitoring/metrics');
const { AuditLogger } = require('../lib/security/audit-logger');
const { ApiKeyAuth } = require('../lib/security/api-key-auth');

// ── HTTP test helper ─────────────────────────────────────────

/**
 * Create a one-shot HTTP request against an Express app.
 * Returns { status, headers, body } where body is parsed JSON
 * or the raw string if JSON parsing fails.
 */
function request(app) {
  return {
    get: (path) =>
      new Promise((resolve, reject) => {
        const server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => {
          const port = server.address().port;
          const req = http.get(
            `http://127.0.0.1:${port}${path}`,
            (res) => {
              let data = '';
              res.on('data', (chunk) => (data += chunk));
              res.on('end', () => {
                server.close();
                let body;
                try {
                  body = JSON.parse(data);
                } catch {
                  body = data;
                }
                resolve({
                  status: res.statusCode,
                  headers: res.headers,
                  body,
                });
              });
            }
          );
          req.on('error', (e) => {
            server.close();
            reject(e);
          });
        });
      }),
  };
}

// ── Tests ────────────────────────────────────────────────────

describe('server.js — createApp', () => {
  let app;

  beforeEach(() => {
    app = createApp({ NODE_ENV: 'test', LOG_LEVEL: 'error' });
  });

  // ── App creation ───────────────────────────────────────────

  describe('app creation', () => {
    it('should return a function (Express app)', () => {
      expect(typeof app).toBe('function');
      // Express apps have .use, .get, .listen
      expect(typeof app.use).toBe('function');
      expect(typeof app.get).toBe('function');
      expect(typeof app.listen).toBe('function');
    });

    it('should attach _config with loaded configuration', () => {
      expect(app._config).toBeDefined();
      expect(app._config.nodeEnv).toBe('test');
      expect(app._config.logLevel).toBe('error');
      expect(typeof app._config.port).toBe('number');
    });

    it('should apply config overrides passed to createApp', () => {
      const custom = createApp({
        NODE_ENV: 'test',
        LOG_LEVEL: 'debug',
        APP_NAME: 'custom-app',
        APP_VERSION: '2.5.0',
        METRICS_PREFIX: 'custom',
      });

      expect(custom._config.logLevel).toBe('debug');
      expect(custom._config.appName).toBe('custom-app');
      expect(custom._config.appVersion).toBe('2.5.0');
      expect(custom._config.metricsPrefix).toBe('custom');
    });

    it('should attach _health as a HealthCheck instance', () => {
      expect(app._health).toBeDefined();
      expect(app._health).toBeInstanceOf(HealthCheck);
    });

    it('should attach _metrics as a MetricsCollector instance', () => {
      expect(app._metrics).toBeDefined();
      expect(app._metrics).toBeInstanceOf(MetricsCollector);
    });

    it('should attach _auditLogger as an AuditLogger instance', () => {
      expect(app._auditLogger).toBeDefined();
      expect(app._auditLogger).toBeInstanceOf(AuditLogger);
    });

    it('should attach _rateLimiter reference', () => {
      expect(app._rateLimiter).toBeDefined();
      expect(typeof app._rateLimiter.middleware).toBe('function');
    });

    it('should attach _dashboard reference', () => {
      expect(app._dashboard).toBeDefined();
      expect(typeof app._dashboard.getSummary).toBe('function');
    });
  });

  // ── GET /health ────────────────────────────────────────────

  describe('GET /health', () => {
    it('should return 200 with status up', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('up');
      expect(res.body.timestamp).toBeDefined();
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.version).toBeDefined();
      expect(res.body.name).toBeDefined();
      expect(typeof res.body.pid).toBe('number');
      expect(res.body.memory).toBeDefined();
      expect(typeof res.body.memory.rss).toBe('number');
    });
  });

  // ── GET /ready ─────────────────────────────────────────────

  describe('GET /ready', () => {
    it('should return 200 or 503 with readiness checks', async () => {
      const res = await request(app).get('/ready');

      // May be 200 (all up) or 503 (degraded) depending on checks
      expect([200, 503]).toContain(res.status);
      expect(res.body.status).toBeDefined();
      expect(['up', 'degraded']).toContain(res.body.status);
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.checks).toBeDefined();
      expect(typeof res.body.checks).toBe('object');
    });
  });

  // ── GET /metrics ───────────────────────────────────────────

  describe('GET /metrics', () => {
    it('should return Prometheus text format by default', async () => {
      const res = await request(app).get('/metrics');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      // Prometheus format is a string, not JSON
      expect(typeof res.body).toBe('string');
    });
  });

  // ── GET /api/info ──────────────────────────────────────────

  describe('GET /api/info', () => {
    it('should return app info with expected fields', async () => {
      const res = await request(app).get('/api/info');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(app._config.appName);
      expect(res.body.version).toBe(app._config.appVersion);
      expect(res.body.environment).toBe('test');
      expect(res.body.migrationMode).toBe(app._config.migrationMode);
      expect(typeof res.body.migrationObjects).toBe('number');
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  // ── GET /api/dashboard/summary ─────────────────────────────

  describe('GET /api/dashboard/summary', () => {
    it('should return a dashboard summary object', async () => {
      const res = await request(app).get('/api/dashboard/summary');

      expect(res.status).toBe(200);
      expect(res.body.timestamp).toBeDefined();
      expect(typeof res.body.totalObjects).toBe('number');
      expect(typeof res.body.totalRules).toBe('number');
      // lastRun may be null on fresh app
      expect(res.body).toHaveProperty('lastRun');
      expect(res.body).toHaveProperty('rulesBreakdown');
      expect(res.body).toHaveProperty('runHistory');
    });
  });

  // ── GET /api/audit ─────────────────────────────────────────

  describe('GET /api/audit', () => {
    it('should return audit log entries', async () => {
      const res = await request(app).get('/api/audit');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('entries');
      expect(Array.isArray(res.body.entries)).toBe(true);
      expect(typeof res.body.total).toBe('number');
    });
  });

  // ── GET /api/audit/stats ───────────────────────────────────

  describe('GET /api/audit/stats', () => {
    it('should return audit statistics', async () => {
      const res = await request(app).get('/api/audit/stats');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalEntries');
      expect(res.body).toHaveProperty('byEvent');
      expect(res.body).toHaveProperty('byOutcome');
      expect(res.body).toHaveProperty('byActor');
      expect(typeof res.body.totalEntries).toBe('number');
    });
  });

  // ── 404 handler ────────────────────────────────────────────

  describe('GET /nonexistent', () => {
    it('should return 404 with structured JSON error', async () => {
      const res = await request(app).get('/this-path-does-not-exist');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
      expect(res.body.status).toBe(404);
      expect(res.body.message).toContain('Cannot GET');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  // ── Security headers ──────────────────────────────────────

  describe('security headers', () => {
    it('should set X-Content-Type-Options header', async () => {
      const res = await request(app).get('/health');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-Frame-Options header', async () => {
      const res = await request(app).get('/health');

      // helmet sets SAMEORIGIN by default
      expect(res.headers['x-frame-options']).toBeDefined();
    });

    it('should not expose X-Powered-By header', async () => {
      const res = await request(app).get('/health');

      // Express default is to set this, security middleware should remove it
      // or helmet disables it
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  // ── CORS ───────────────────────────────────────────────────

  describe('CORS', () => {
    it('should include access-control-allow-origin in response', async () => {
      const res = await request(app).get('/health');

      // With CORS_ORIGINS='*' (the default), the header should be set
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  // ── Forensic API routes ──────────────────────────────────

  describe('GET /api/forensic/summary', () => {
    it('should return forensic summary (no extraction data)', async () => {
      const res = await request(app).get('/api/forensic/summary');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('no_extraction');
    });
  });

  describe('GET /api/forensic/modules', () => {
    it('should return forensic modules (empty when no data)', async () => {
      const res = await request(app).get('/api/forensic/modules');
      expect(res.status).toBe(200);
      expect(res.body.modules).toEqual([]);
    });
  });

  describe('GET /api/forensic/progress', () => {
    it('should return forensic progress state', async () => {
      const res = await request(app).get('/api/forensic/progress');
      expect(res.status).toBe(200);
      expect(res.body.running).toBe(false);
    });
  });

  // ── Process Mining API routes ──────────────────────────────

  describe('GET /api/process-mining/processes', () => {
    it('should return process list through server', async () => {
      const res = await request(app).get('/api/process-mining/processes');
      expect(res.status).toBe(200);
      expect(res.body.processes).toBeDefined();
      expect(res.body.processes.length).toBe(7);
    });
  });

  // ── Platform Summary ──────────────────────────────────────

  describe('GET /api/platform/summary', () => {
    it('should return unified platform summary', async () => {
      const res = await request(app).get('/api/platform/summary');
      expect(res.status).toBe(200);
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.migration).toBeDefined();
      expect(typeof res.body.migration.objects).toBe('number');
      expect(Array.isArray(res.body.migration.objectIds)).toBe(true);
      expect(res.body.forensic).toBeDefined();
      expect(typeof res.body.forensic.extractors).toBe('number');
      expect(res.body.processMining).toBeDefined();
      expect(res.body.processMining.processes).toBe(7);
    });
  });

  // ── Test references ───────────────────────────────────────

  describe('test references', () => {
    it('should attach _forensicState reference', () => {
      expect(app._forensicState).toBeDefined();
      expect(app._forensicState.running).toBe(false);
    });

    it('should attach _processMining reference', () => {
      expect(app._processMining).toBe(true);
    });

    it('should attach _apiKeyAuth reference', () => {
      expect(app._apiKeyAuth).toBeDefined();
      expect(app._apiKeyAuth).toBeInstanceOf(ApiKeyAuth);
      expect(app._apiKeyAuth.isEnabled()).toBe(false); // no API_KEY in test
    });

    it('should attach _migrationPlan reference', () => {
      expect(app._migrationPlan).toBe(true);
    });

    it('should attach _export reference', () => {
      expect(app._export).toBe(true);
    });

    it('should attach _signavio reference', () => {
      expect(app._signavio).toBe(true);
    });

    it('should attach _testing reference', () => {
      expect(app._testing).toBe(true);
    });

    it('should attach _cloud reference', () => {
      expect(app._cloud).toBe(true);
    });

    it('should have signavio, testing, cloud in forensicState', () => {
      expect(app._forensicState).toHaveProperty('signavio', null);
      expect(app._forensicState).toHaveProperty('testing', null);
      expect(app._forensicState).toHaveProperty('cloud', null);
    });

    it('should have expanded forensicState with eventLog and latestPlan', () => {
      expect(app._forensicState).toHaveProperty('eventLog', null);
      expect(app._forensicState).toHaveProperty('eventLogs');
      expect(app._forensicState).toHaveProperty('latestPlan', null);
    });
  });

  // ── API Key Auth ──────────────────────────────────────────

  describe('API key auth integration', () => {
    it('should create app with API key auth enabled', () => {
      const securedApp = createApp({ NODE_ENV: 'test', LOG_LEVEL: 'error', API_KEY: 'test-secret' });
      expect(securedApp._apiKeyAuth.isEnabled()).toBe(true);
    });
  });

  // ── Migration Plan endpoints ──────────────────────────────

  describe('GET /api/migration/plan/latest', () => {
    it('should return 404 when no plan exists', async () => {
      const res = await request(app).get('/api/migration/plan/latest');
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });

  // ── Export endpoints ──────────────────────────────────────

  describe('GET /api/export/forensic/json', () => {
    it('should return 404 when no report', async () => {
      const res = await request(app).get('/api/export/forensic/json');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/export/event-log/csv', () => {
    it('should return 404 when no event log', async () => {
      const res = await request(app).get('/api/export/event-log/csv');
      expect(res.status).toBe(404);
    });
  });

  // ── Pillar 6-8 endpoints ──────────────────────────────────

  describe('Pillar 6-8 endpoints respond', () => {
    it('GET /api/signavio/models should return 200', async () => {
      const res = await request(app).get('/api/signavio/models');
      expect(res.status).toBe(200);
      expect(res.body.models).toBeDefined();
    });

    it('GET /api/testing/templates should return 200', async () => {
      const res = await request(app).get('/api/testing/templates');
      expect(res.status).toBe(200);
      expect(res.body.templates).toBeDefined();
    });

    it('GET /api/cloud/sac/models should return 200', async () => {
      const res = await request(app).get('/api/cloud/sac/models');
      expect(res.status).toBe(200);
      expect(res.body.models).toBeDefined();
    });
  });

  // ── Crash handlers ────────────────────────────────────────

  describe('installCrashHandlers', () => {
    it('should be a function', () => {
      expect(typeof installCrashHandlers).toBe('function');
    });
  });

  // ── Integration: multiple endpoints in sequence ────────────

  describe('sequential requests', () => {
    it('should serve different endpoints correctly', async () => {
      const health = await request(app).get('/health');
      expect(health.status).toBe(200);
      expect(health.body.status).toBe('up');

      const info = await request(app).get('/api/info');
      expect(info.status).toBe(200);
      expect(info.body.name).toBeDefined();

      const notFound = await request(app).get('/nope');
      expect(notFound.status).toBe(404);
    });
  });
});
