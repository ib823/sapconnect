/**
 * Migration Dashboard API
 *
 * Express-based REST API that exposes migration status,
 * object progress, rule findings, reconciliation results,
 * and test scenario status to the web dashboard.
 *
 * Endpoints:
 *   GET /api/dashboard/summary       — Overall migration status
 *   GET /api/dashboard/objects        — All migration objects with status
 *   GET /api/dashboard/objects/:id    — Single object detail
 *   GET /api/dashboard/rules          — Rule analysis summary
 *   GET /api/dashboard/reconciliation — Reconciliation report
 *   GET /api/dashboard/tests          — Test scenario status
 *   POST /api/dashboard/run           — Trigger migration run
 *   POST /api/dashboard/run/:id       — Trigger single object run
 */

const Logger = require('../../lib/logger');

class DashboardAPI {
  constructor(options = {}) {
    this.logger = new Logger('dashboard-api', { level: options.verbose ? 'debug' : 'info' });
    this.registry = options.registry || null;
    this.ruleRegistry = options.ruleRegistry || null;
    this.reconciliationEngine = options.reconciliationEngine || null;
    this.testEngine = options.testEngine || null;
    this.gateway = options.gateway || { mode: 'mock' };
    this._lastRun = null;
    this._runHistory = [];
  }

  /**
   * Get overall migration dashboard summary
   */
  getSummary() {
    const objectIds = this.registry ? this.registry.listObjectIds() : [];
    const rules = this.ruleRegistry ? this.ruleRegistry.getAll() : [];

    const summary = {
      timestamp: new Date().toISOString(),
      totalObjects: objectIds.length,
      totalRules: rules.length,
      lastRun: this._lastRun ? {
        timestamp: this._lastRun.timestamp,
        status: this._lastRun.stats.failed > 0 ? 'FAILED' : 'COMPLETED',
        objectsRun: this._lastRun.stats.total,
        objectsCompleted: this._lastRun.stats.completed,
        objectsFailed: this._lastRun.stats.failed,
        durationMs: this._lastRun.stats.totalDurationMs,
      } : null,
      rulesBreakdown: this._getRulesBreakdown(rules),
      runHistory: this._runHistory.slice(-10).map(r => ({
        timestamp: r.timestamp,
        status: r.stats.failed > 0 ? 'FAILED' : 'COMPLETED',
        objectsRun: r.stats.total,
        durationMs: r.stats.totalDurationMs,
      })),
    };

    return summary;
  }

  /**
   * Get all migration objects with current status
   */
  getObjects() {
    if (!this.registry) return [];

    const objects = this.registry.listObjectIds().map(id => {
      const obj = this.registry.getObject(id, this.gateway);
      const lastResult = this._getLastObjectResult(id);

      return {
        objectId: id,
        name: obj.name,
        fieldMappings: obj.getFieldMappings().length,
        status: lastResult ? lastResult.status : 'not_run',
        lastRun: lastResult ? {
          status: lastResult.status,
          extractCount: lastResult.phases?.extract?.recordCount || 0,
          transformCount: lastResult.phases?.transform?.recordCount || 0,
          loadCount: lastResult.phases?.load?.recordCount || 0,
          errors: lastResult.phases?.validate?.errorCount || 0,
        } : null,
      };
    });

    return objects;
  }

  /**
   * Get detail for a single migration object
   */
  getObjectDetail(objectId) {
    if (!this.registry) return null;

    try {
      const obj = this.registry.getObject(objectId, this.gateway);
      const lastResult = this._getLastObjectResult(objectId);

      return {
        objectId: obj.objectId,
        name: obj.name,
        fieldMappings: obj.getFieldMappings(),
        qualityChecks: obj.getQualityChecks(),
        lastResult,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get rule analysis breakdown
   */
  getRulesAnalysis() {
    if (!this.ruleRegistry) return { total: 0, bySeverity: {}, byCategory: {} };

    const rules = this.ruleRegistry.getAll();
    const bySeverity = {};
    const byCategory = {};

    for (const rule of rules) {
      bySeverity[rule.severity] = (bySeverity[rule.severity] || 0) + 1;
      const cat = rule.category.split(' – ')[0] || rule.category;
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    return {
      total: rules.length,
      bySeverity,
      byCategory,
      rules: rules.map(r => ({
        id: r.id,
        title: r.title,
        severity: r.severity,
        category: r.category,
      })),
    };
  }

  /**
   * Get reconciliation summary from last run
   */
  getReconciliation() {
    if (!this._lastRun || !this.reconciliationEngine) {
      return { status: 'no_data', reports: [] };
    }

    return this.reconciliationEngine.reconcileAll(this._lastRun.results);
  }

  /**
   * Get test scenario status
   */
  getTestScenarios() {
    if (!this._lastRun || !this.testEngine) {
      return { status: 'no_data', scenarios: {}, stats: {} };
    }

    return this.testEngine.generateFromMigrationResults(this._lastRun.results);
  }

  /**
   * Trigger a full migration run
   */
  async runAll() {
    if (!this.registry) {
      return { error: 'No registry configured' };
    }

    this.logger.info('Starting full migration run...');
    const result = await this.registry.runAll(this.gateway);
    result.timestamp = new Date().toISOString();
    this._lastRun = result;
    this._runHistory.push(result);
    this.logger.info(`Migration run complete: ${result.stats.completed}/${result.stats.total} objects`);

    return {
      status: result.stats.failed > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
      stats: result.stats,
      timestamp: result.timestamp,
    };
  }

  /**
   * Run a single migration object
   */
  async runObject(objectId) {
    if (!this.registry) {
      return { error: 'No registry configured' };
    }

    try {
      const obj = this.registry.createObject(objectId, this.gateway);
      this.logger.info(`Running ${obj.name} (${obj.objectId})...`);
      const result = await obj.run();
      return {
        status: result.status,
        objectId: result.objectId,
        phases: result.phases,
        stats: result.stats,
      };
    } catch (e) {
      return { error: e.message, objectId };
    }
  }

  /**
   * Register Express routes on a router
   */
  registerRoutes(router) {
    router.get('/api/dashboard/summary', (_req, res) => {
      res.json(this.getSummary());
    });

    router.get('/api/dashboard/objects', (_req, res) => {
      res.json(this.getObjects());
    });

    router.get('/api/dashboard/objects/:id', (req, res) => {
      const detail = this.getObjectDetail(req.params.id);
      if (!detail) return res.status(404).json({ error: 'Object not found' });
      res.json(detail);
    });

    router.get('/api/dashboard/rules', (_req, res) => {
      res.json(this.getRulesAnalysis());
    });

    router.get('/api/dashboard/reconciliation', (_req, res) => {
      res.json(this.getReconciliation());
    });

    router.get('/api/dashboard/tests', (_req, res) => {
      res.json(this.getTestScenarios());
    });

    router.post('/api/dashboard/run', async (_req, res) => {
      const result = await this.runAll();
      res.json(result);
    });

    router.post('/api/dashboard/run/:id', async (req, res) => {
      const result = await this.runObject(req.params.id);
      if (result.error) return res.status(400).json(result);
      res.json(result);
    });

    return router;
  }

  // ── Helpers ──────────────────────────────────────────────────

  _getRulesBreakdown(rules) {
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const r of rules) {
      if (breakdown[r.severity] !== undefined) breakdown[r.severity]++;
    }
    return breakdown;
  }

  _getLastObjectResult(objectId) {
    if (!this._lastRun) return null;
    return this._lastRun.results.find(r => r.objectId === objectId) || null;
  }
}

module.exports = DashboardAPI;
