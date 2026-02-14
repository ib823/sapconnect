/**
 * Migration Plan API
 *
 * Express Router for generating and retrieving migration plans
 * from forensic extraction results via MigrationBridge.
 */

'use strict';

const express = require('express');
const Logger = require('../lib/logger');
const MigrationBridge = require('./migration-bridge');

/**
 * Create and return an Express Router for migration plan endpoints.
 * @param {object} forensicState - Shared forensic state from server.js
 * @returns {express.Router}
 */
function createMigrationPlanRouter(forensicState) {
  const router = express.Router();
  const log = new Logger('migration-plan-api');

  /**
   * POST /api/migration/plan — Generate a migration plan
   * Body: { forensicResult?, options? }
   * Falls back to forensicState.report when no body forensicResult provided.
   */
  router.post('/api/migration/plan', (req, res) => {
    try {
      const forensicResult = req.body.forensicResult || _buildForensicResult(forensicState);
      if (!forensicResult) {
        return res.status(400).json({ error: 'No forensic data available. Run extraction first or provide forensicResult in body.' });
      }

      const bridge = new MigrationBridge();
      const plan = bridge.plan(forensicResult, req.body.options || {});

      forensicState.latestPlan = plan;
      log.info(`Migration plan generated: ${plan.scope.totalObjects} objects`);

      res.json(plan);
    } catch (err) {
      log.error(`Plan generation failed: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/migration/plan/latest — Retrieve the last generated plan
   */
  router.get('/api/migration/plan/latest', (_req, res) => {
    if (!forensicState.latestPlan) {
      return res.status(404).json({ error: 'No migration plan available. POST /api/migration/plan first.' });
    }
    res.json(forensicState.latestPlan);
  });

  return router;
}

/**
 * Build a minimal forensic result object from the shared state.
 */
function _buildForensicResult(state) {
  if (!state.report) return null;
  const reportJson = typeof state.report.toJSON === 'function' ? state.report.toJSON() : state.report;
  return {
    results: state.results || {},
    confidence: state.confidence || {},
    gapReport: state.gapReport || {},
    humanValidation: reportJson.humanValidation || [],
  };
}

module.exports = { createMigrationPlanRouter };
