/**
 * SAP Connect — Express Server Bootstrap
 *
 * Wires together:
 *  - Security: headers, CORS, rate limiting, audit logging
 *  - Monitoring: health, readiness, metrics, request context
 *  - API: migration dashboard, run controls
 *  - Error handling: structured JSON responses
 *
 * This server runs alongside the CAP server. CAP handles the
 * OData/Fiori endpoints; this handles the migration REST API,
 * health probes, and metrics.
 *
 * Usage:
 *   node server.js                         # Start on PORT (default 4005)
 *   PORT=8080 node server.js               # Custom port
 *   MIGRATION_MODE=live node server.js     # Live SAP mode
 */

const express = require('express');
const { loadConfig, validateConfig } = require('./lib/config');
const Logger = require('./lib/logger');

// Security
const { securityHeaders, cors, RateLimiter, AuditLogger } = require('./lib/security');

// Monitoring
const { HealthCheck, MetricsCollector, RequestContext } = require('./lib/monitoring');

// Error handling
const { errorHandler, notFoundHandler } = require('./lib/middleware/error-handler');

// Dashboard
const DashboardAPI = require('./migration/dashboard/api');
const MigrationObjectRegistry = require('./migration/objects/registry');

/**
 * Create and configure the Express app.
 * Exported for testing — call `createApp()` then `app.listen()`.
 */
function createApp(configOverrides = {}) {
  const config = loadConfig(configOverrides);
  const log = new Logger('server', { level: config.logLevel, format: config.logFormat });

  // Validate
  const validation = validateConfig(config, config.migrationMode);
  if (!validation.valid) {
    for (const err of validation.errors) {
      log.warn(`Config warning: ${err}`);
    }
  }

  const app = express();

  // ── Trust proxy (for rate limiter IP detection behind LB) ──
  if (config.trustProxy) {
    app.set('trust proxy', true);
  }

  // ── Request parsing ────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false }));

  // ── Security middleware ────────────────────────────────────
  app.use(securityHeaders());
  app.use(cors({ origins: config.corsOrigins }));

  const rateLimiter = new RateLimiter({
    windowMs: config.rateLimitWindowMs,
    maxRequests: config.rateLimitMax,
  });
  app.use(rateLimiter.middleware());

  const auditLogger = new AuditLogger({ store: 'memory' });
  app.use(auditLogger.middleware());

  // ── Monitoring middleware ──────────────────────────────────
  const requestContext = new RequestContext();
  app.use(requestContext.middleware());

  const metrics = new MetricsCollector({ prefix: config.metricsPrefix });
  app.use(metrics.middleware());

  const health = new HealthCheck({
    version: config.appVersion,
    name: config.appName,
  });

  // Register built-in health checks
  health.register('migration-registry', async () => {
    try {
      const registry = new MigrationObjectRegistry();
      const ids = registry.listObjectIds();
      return { status: 'up', details: { objectCount: ids.length } };
    } catch {
      return { status: 'down', details: { error: 'Registry unavailable' } };
    }
  });

  // ── Health + Metrics routes ────────────────────────────────
  health.registerRoutes(app);
  metrics.registerRoutes(app);

  // ── Audit query endpoint ───────────────────────────────────
  app.get('/api/audit', (req, res) => {
    const filters = {
      event: req.query.event,
      actor: req.query.actor,
      since: req.query.since,
      until: req.query.until,
      outcome: req.query.outcome,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 100,
      offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
    };
    res.json(auditLogger.query(filters));
  });

  app.get('/api/audit/stats', (_req, res) => {
    res.json(auditLogger.getStats());
  });

  // ── Dashboard API ──────────────────────────────────────────
  const gateway = { mode: config.migrationMode };
  const registry = new MigrationObjectRegistry();

  const dashboard = new DashboardAPI({
    registry,
    gateway,
    verbose: config.logLevel === 'debug',
  });
  dashboard.registerRoutes(app);

  // ── Info endpoint ──────────────────────────────────────────
  app.get('/api/info', (_req, res) => {
    res.json({
      name: config.appName,
      version: config.appVersion,
      environment: config.nodeEnv,
      migrationMode: config.migrationMode,
      migrationObjects: registry.listObjectIds().length,
      uptime: Math.floor((Date.now() - health.startTime) / 1000),
    });
  });

  // ── Error handling ─────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler({ auditLogger, includeStack: !config.isProduction }));

  // Attach references for testing
  app._config = config;
  app._health = health;
  app._metrics = metrics;
  app._auditLogger = auditLogger;
  app._rateLimiter = rateLimiter;
  app._dashboard = dashboard;

  return app;
}

// ── CLI entrypoint ─────────────────────────────────────────
if (require.main === module) {
  const app = createApp();
  const port = app._config.port === 4004 ? 4005 : app._config.port; // avoid collision with CAP
  app.listen(port, app._config.host, () => {
    console.log(`SAP Connect Migration API running at http://${app._config.host}:${port}`);
    console.log(`  Health:    http://localhost:${port}/health`);
    console.log(`  Ready:     http://localhost:${port}/ready`);
    console.log(`  Metrics:   http://localhost:${port}/metrics`);
    console.log(`  Dashboard: http://localhost:${port}/api/dashboard/summary`);
    console.log(`  Mode:      ${app._config.migrationMode}`);
  });
}

module.exports = { createApp };
