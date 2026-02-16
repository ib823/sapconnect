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
 * SEN — Express Server Bootstrap
 *
 * Wires together:
 *  - Security: headers, CORS, rate limiting, audit logging
 *  - Monitoring: health, readiness, metrics, request context
 *  - API: migration dashboard, forensic extraction, process mining
 *  - Error handling: structured JSON responses
 *  - Crash handlers: uncaughtException, unhandledRejection, SIGTERM/SIGINT
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
const { securityHeaders, cors, RateLimiter, AuditLogger, ApiKeyAuth, XsuaaAuth } = require('./lib/security');

// Monitoring
const { HealthCheck, MetricsCollector, RequestContext } = require('./lib/monitoring');

// Error handling
const { errorHandler, notFoundHandler } = require('./lib/middleware/error-handler');

// Migration Dashboard
const DashboardAPI = require('./migration/dashboard/api');
const MigrationObjectRegistry = require('./migration/objects/registry');

// Forensic Dashboard
const { createDashboardRouter } = require('./extraction/report/dashboard-api');

// Process Mining API
const { createProcessMiningRouter } = require('./extraction/process-mining/api');

// Migration Plan API
const { createMigrationPlanRouter } = require('./extraction/migration-plan-api');

// Data Export API
const { createExportRouter } = require('./extraction/export-api');

// Signavio API
const { createSignavioRouter } = require('./extraction/signavio-api');

// Testing API
const { createTestingRouter } = require('./extraction/testing-api');

// Cloud API
const { createCloudRouter } = require('./extraction/cloud-api');

// Extraction registry (for platform summary)
const ExtractorRegistry = require('./extraction/extractor-registry');

// Progress bus (SSE streaming)
const { ProgressBus } = require('./lib/progress-bus');

// Process mining config (for platform summary)
const { getAllProcessIds } = require('./extraction/process-mining/sap-table-config');

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

  // ── Authentication ───────────────────────────────────────────
  const authStrategy = process.env.AUTH_STRATEGY || config.authStrategy || 'apikey';
  let apiKeyAuth = null;
  if (authStrategy === 'xsuaa') {
    const xsuaaAuth = new XsuaaAuth();
    app.use(xsuaaAuth.middleware());
    log.info('Authentication: XSUAA (SAP BTP)');
  } else {
    apiKeyAuth = new ApiKeyAuth({ apiKey: config.apiKey });
    app.use(apiKeyAuth.middleware());
    log.info(`Authentication: API Key (${apiKeyAuth.isEnabled() ? 'enabled' : 'dev mode'})`);
  }

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

  // ── Migration Dashboard API ────────────────────────────────
  const gateway = { mode: config.migrationMode };
  const registry = new MigrationObjectRegistry();

  const dashboard = new DashboardAPI({
    registry,
    gateway,
    verbose: config.logLevel === 'debug',
  });
  dashboard.registerRoutes(app);

  // ── Forensic Dashboard API ─────────────────────────────────
  const forensicState = {
    report: null,
    processCatalog: null,
    interpretations: [],
    results: {},
    gapReport: {},
    confidence: { overall: 0, grade: 'N/A' },
    coverageTracker: null,
    running: false,
    progress: {},
    startedAt: null,
    eventLog: null,
    eventLogs: {},
    latestPlan: null,
    signavio: null,
    testing: null,
    cloud: null,
  };
  app.use(createDashboardRouter(forensicState));

  // ── Process Mining API ─────────────────────────────────────
  app.use(createProcessMiningRouter());

  // ── Migration Plan API ─────────────────────────────────────
  app.use(createMigrationPlanRouter(forensicState));

  // ── Data Export API ────────────────────────────────────────
  app.use(createExportRouter(forensicState));

  // ── Signavio API ─────────────────────────────────────────
  app.use(createSignavioRouter(forensicState));

  // ── Testing API ──────────────────────────────────────────
  app.use(createTestingRouter(forensicState));

  // ── Cloud API ────────────────────────────────────────────
  app.use(createCloudRouter(forensicState));

  // ── Platform Summary ───────────────────────────────────────
  app.get('/api/platform/summary', (_req, res) => {
    const migrationIds = registry.listObjectIds();
    const extractors = ExtractorRegistry.getAll();
    const processIds = getAllProcessIds();

    res.json({
      timestamp: new Date().toISOString(),
      migration: {
        objects: migrationIds.length,
        objectIds: migrationIds,
      },
      forensic: {
        extractors: extractors.length,
        extractorIds: extractors.map((e) => e.id),
      },
      processMining: {
        processes: processIds.length,
        processIds,
      },
    });
  });

  // ── Progress Bus (SSE) ────────────────────────────────────
  const progressBus = new ProgressBus();
  forensicState.progressBus = progressBus;

  // SSE stream endpoint
  app.get('/api/events', (req, res) => {
    const replayCount = req.query.replay ? parseInt(req.query.replay, 10) : 20;
    progressBus.connectSSE(res, { replayCount });
  });

  // Event history (REST fallback for non-SSE clients)
  app.get('/api/events/history', (req, res) => {
    const count = req.query.count ? parseInt(req.query.count, 10) : 50;
    const type = req.query.type || null;
    res.json({
      events: progressBus.getHistory(count, type),
      clients: progressBus.clientCount,
    });
  });

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
  app._forensicState = forensicState;
  app._processMining = true;
  app._apiKeyAuth = apiKeyAuth;
  app._migrationPlan = true;
  app._export = true;
  app._signavio = true;
  app._testing = true;
  app._cloud = true;
  app._progressBus = progressBus;

  return app;
}

/**
 * Install process-level crash handlers for production resilience.
 * @param {object} log — Logger instance
 * @param {http.Server} [server] — HTTP server for graceful shutdown
 */
function installCrashHandlers(log, server) {
  process.on('uncaughtException', (err) => {
    log.error('Uncaught exception — shutting down', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    log.error('Unhandled rejection — shutting down', { reason: message });
    process.exit(1);
  });

  const gracefulShutdown = (signal) => {
    log.info(`Received ${signal} — graceful shutdown`);
    if (server) {
      server.close(() => {
        log.info('HTTP server closed');
        process.exit(0);
      });
      // Force exit after 10s if graceful close stalls
      setTimeout(() => process.exit(0), 10000).unref();
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// ── CLI entrypoint ─────────────────────────────────────────
if (require.main === module) {
  const app = createApp();
  const log = new Logger('server');
  const port = app._config.port === 4004 ? 4005 : app._config.port; // avoid collision with CAP
  const server = app.listen(port, app._config.host, () => {
    console.log(`SEN Migration API running at http://${app._config.host}:${port}`);
    console.log(`  Health:      http://localhost:${port}/health`);
    console.log(`  Ready:       http://localhost:${port}/ready`);
    console.log(`  Metrics:     http://localhost:${port}/metrics`);
    console.log(`  Dashboard:   http://localhost:${port}/api/dashboard/summary`);
    console.log(`  Forensic:    http://localhost:${port}/api/forensic/summary`);
    console.log(`  Mining:      http://localhost:${port}/api/process-mining/processes`);
    console.log(`  Platform:    http://localhost:${port}/api/platform/summary`);
    console.log(`  Mode:        ${app._config.migrationMode}`);
  });
  installCrashHandlers(log, server);
}

module.exports = { createApp, installCrashHandlers };
