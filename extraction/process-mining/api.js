/**
 * Process Mining REST API
 *
 * Express Router exposing the process mining engine to HTTP clients.
 * Follows the same pattern as extraction/report/dashboard-api.js.
 *
 * Endpoints:
 *   GET  /api/process-mining/processes              — list all 7 SAP processes
 *   GET  /api/process-mining/processes/:id           — get process config
 *   GET  /api/process-mining/processes/:id/reference-model — get reference model
 *   POST /api/process-mining/analyze                 — full analysis
 *   POST /api/process-mining/discover                — heuristic mining
 *   POST /api/process-mining/conformance             — conformance checking
 *   POST /api/process-mining/performance             — performance analysis
 *   POST /api/process-mining/variants                — variant analysis
 *   POST /api/process-mining/social-network          — social network mining
 *   POST /api/process-mining/kpis                    — KPI calculation
 *   GET  /api/process-mining/demo/:processId         — demo analysis
 */

'use strict';

const express = require('express');
const Logger = require('../../lib/logger');

const { ProcessIntelligenceEngine } = require('./process-intelligence-engine');
const { EventLog, Event, Trace } = require('./event-log');
const { HeuristicMiner } = require('./heuristic-miner');
const { ConformanceChecker } = require('./conformance-checker');
const { PerformanceAnalyzer } = require('./performance-analyzer');
const { VariantAnalyzer } = require('./variant-analyzer');
const { SocialNetworkMiner } = require('./social-network-miner');
const { KPIEngine } = require('./kpi-engine');
const { getAllProcessIds, getProcessConfig } = require('./sap-table-config');
const { getReferenceModel } = require('./reference-models');

/**
 * Create and return an Express Router for process mining endpoints.
 * @returns {express.Router}
 */
function createProcessMiningRouter() {
  const router = express.Router();
  const log = new Logger('process-mining-api');

  // ── GET /api/process-mining/processes ──────────────────────────

  router.get('/api/process-mining/processes', (_req, res) => {
    const ids = getAllProcessIds();
    const processes = ids.map((id) => {
      const config = getProcessConfig(id);
      return { id, name: config.name, description: config.description };
    });
    res.json({ processes });
  });

  // ── GET /api/process-mining/processes/:id ──────────────────────

  router.get('/api/process-mining/processes/:id', (req, res) => {
    const config = getProcessConfig(req.params.id.toUpperCase());
    if (!config) {
      return res.status(404).json({ error: `Process '${req.params.id}' not found` });
    }
    res.json({
      id: config.id,
      name: config.name,
      description: config.description,
      tables: Object.keys(config.tables),
      caseId: config.caseId,
    });
  });

  // ── GET /api/process-mining/processes/:id/reference-model ─────

  router.get('/api/process-mining/processes/:id/reference-model', (req, res) => {
    const model = getReferenceModel(req.params.id.toUpperCase());
    if (!model) {
      return res.status(404).json({ error: `Reference model for '${req.params.id}' not found` });
    }
    res.json(model.toJSON());
  });

  // ── POST /api/process-mining/analyze ──────────────────────────

  router.post('/api/process-mining/analyze', async (req, res) => {
    try {
      const eventLog = _reconstructEventLog(req.body);
      const engine = new ProcessIntelligenceEngine();
      const report = await engine.analyze(eventLog, req.body.options || {});
      res.json(report.toJSON());
    } catch (err) {
      log.error(`Analyze failed: ${err.message}`);
      res.status(400).json({ error: err.message });
    }
  });

  // ── POST /api/process-mining/discover ─────────────────────────

  router.post('/api/process-mining/discover', (req, res) => {
    try {
      const eventLog = _reconstructEventLog(req.body);
      const miner = new HeuristicMiner(req.body.options || {});
      const model = miner.mine(eventLog);
      res.json(model.toJSON());
    } catch (err) {
      log.error(`Discover failed: ${err.message}`);
      res.status(400).json({ error: err.message });
    }
  });

  // ── POST /api/process-mining/conformance ──────────────────────

  router.post('/api/process-mining/conformance', (req, res) => {
    try {
      const eventLog = _reconstructEventLog(req.body);
      const opts = req.body.options || {};
      const processId = opts.processId;
      const referenceModel = processId ? getReferenceModel(processId) : null;
      if (!referenceModel) {
        return res.status(400).json({ error: 'options.processId required for conformance checking' });
      }
      const checker = new ConformanceChecker(opts);
      const result = checker.check(eventLog, referenceModel);
      res.json(result.toJSON());
    } catch (err) {
      log.error(`Conformance failed: ${err.message}`);
      res.status(400).json({ error: err.message });
    }
  });

  // ── POST /api/process-mining/performance ──────────────────────

  router.post('/api/process-mining/performance', (req, res) => {
    try {
      const eventLog = _reconstructEventLog(req.body);
      const analyzer = new PerformanceAnalyzer(req.body.options || {});
      const result = analyzer.analyze(eventLog);
      res.json(result.toJSON());
    } catch (err) {
      log.error(`Performance failed: ${err.message}`);
      res.status(400).json({ error: err.message });
    }
  });

  // ── POST /api/process-mining/variants ─────────────────────────

  router.post('/api/process-mining/variants', (req, res) => {
    try {
      const eventLog = _reconstructEventLog(req.body);
      const analyzer = new VariantAnalyzer(req.body.options || {});
      const result = analyzer.analyze(eventLog);
      res.json(result.toJSON());
    } catch (err) {
      log.error(`Variants failed: ${err.message}`);
      res.status(400).json({ error: err.message });
    }
  });

  // ── POST /api/process-mining/social-network ───────────────────

  router.post('/api/process-mining/social-network', (req, res) => {
    try {
      const eventLog = _reconstructEventLog(req.body);
      const miner = new SocialNetworkMiner(req.body.options || {});
      const result = miner.analyze(eventLog);
      res.json(result.toJSON());
    } catch (err) {
      log.error(`Social network failed: ${err.message}`);
      res.status(400).json({ error: err.message });
    }
  });

  // ── POST /api/process-mining/kpis ─────────────────────────────

  router.post('/api/process-mining/kpis', (req, res) => {
    try {
      const eventLog = _reconstructEventLog(req.body);
      const engine = new KPIEngine(req.body.options || {});
      const result = engine.calculate(eventLog, req.body.options || {});
      res.json(result.toJSON());
    } catch (err) {
      log.error(`KPIs failed: ${err.message}`);
      res.status(400).json({ error: err.message });
    }
  });

  // ── GET /api/process-mining/demo/:processId ───────────────────

  router.get('/api/process-mining/demo/:processId', async (req, res) => {
    try {
      const processId = req.params.processId.toUpperCase();
      const config = getProcessConfig(processId);
      if (!config) {
        return res.status(404).json({ error: `Process '${req.params.processId}' not found` });
      }

      const eventLog = _generateDemoEventLog(processId, config);
      const engine = new ProcessIntelligenceEngine();
      const report = await engine.analyze(eventLog, { processId });
      res.json({
        processId,
        processName: config.name,
        eventLog: { cases: eventLog.getCaseCount(), events: eventLog.getEventCount() },
        analysis: report.toJSON(),
      });
    } catch (err) {
      log.error(`Demo failed: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Reconstruct an EventLog from a POST payload.
 * Expects { events: [{ caseId, activity, timestamp, resource? }], options?: {} }
 */
function _reconstructEventLog(body) {
  if (!body || !Array.isArray(body.events) || body.events.length === 0) {
    throw new Error('Request body must include a non-empty "events" array');
  }

  const eventLog = new EventLog('api-upload');
  for (const raw of body.events) {
    if (!raw.caseId || !raw.activity || !raw.timestamp) {
      throw new Error('Each event requires caseId, activity, and timestamp');
    }
    const event = new Event({
      activity: raw.activity,
      timestamp: raw.timestamp,
      resource: raw.resource || undefined,
    });
    eventLog.addEvent(raw.caseId, event);
  }
  return eventLog;
}

/**
 * Generate a synthetic demo event log for a given SAP process.
 * Creates realistic traces with typical activities.
 */
function _generateDemoEventLog(processId, config) {
  const log = new EventLog(`demo-${processId}`);
  const activities = _getDemoActivities(processId);
  const resources = ['USER_A', 'USER_B', 'USER_C', 'SYSTEM', 'MANAGER'];
  const caseCount = 20;

  for (let i = 1; i <= caseCount; i++) {
    const caseId = `${processId}-DEMO-${String(i).padStart(4, '0')}`;
    const baseTime = new Date('2024-01-15T08:00:00Z').getTime();

    for (let j = 0; j < activities.length; j++) {
      // Skip some activities randomly for variation (but always include first and last)
      if (j > 0 && j < activities.length - 1 && i % 5 === 0 && j % 3 === 0) continue;

      const timestamp = new Date(baseTime + (i * 86400000) + (j * 3600000) + Math.random() * 1800000);
      const resource = resources[(i + j) % resources.length];

      log.addEvent(caseId, new Event({
        activity: activities[j],
        timestamp,
        resource,
      }));
    }

    // Add rework loop for some cases
    if (i % 4 === 0 && activities.length > 2) {
      const reworkTime = new Date(baseTime + (i * 86400000) + (activities.length * 3600000) + 1800000);
      log.addEvent(caseId, new Event({
        activity: activities[1],
        timestamp: reworkTime,
        resource: resources[i % resources.length],
      }));
    }
  }

  return log;
}

/**
 * Return representative activities for each SAP process type.
 */
function _getDemoActivities(processId) {
  const activityMap = {
    O2C: [
      'Create Sales Order', 'Approve Sales Order', 'Create Delivery',
      'Pick Materials', 'Goods Issue', 'Create Invoice', 'Post Accounting',
      'Receive Payment',
    ],
    P2P: [
      'Create Purchase Requisition', 'Approve Requisition', 'Create Purchase Order',
      'Send PO to Vendor', 'Receive Goods', 'Post Goods Receipt',
      'Receive Invoice', 'Verify Invoice', 'Post Payment',
    ],
    R2R: [
      'Post Journal Entry', 'Review Entry', 'Approve Entry',
      'Run Validation', 'Period Close', 'Generate Report',
    ],
    A2R: [
      'Acquire Asset', 'Capitalize Asset', 'Post Depreciation',
      'Revalue Asset', 'Transfer Asset', 'Retire Asset',
    ],
    H2R: [
      'Create Position', 'Post Job Opening', 'Screen Candidates',
      'Schedule Interview', 'Make Offer', 'Onboard Employee',
      'Assign Role', 'Complete Training',
    ],
    P2M: [
      'Create Production Order', 'Release Order', 'Issue Materials',
      'Start Production', 'Report Operations', 'Goods Receipt',
      'Technical Completion',
    ],
    M2S: [
      'Create Maintenance Notification', 'Create Maintenance Order',
      'Plan Maintenance', 'Schedule Resources', 'Execute Maintenance',
      'Confirm Operations', 'Technical Close',
    ],
  };
  return activityMap[processId] || ['Start', 'Process', 'Complete'];
}

module.exports = { createProcessMiningRouter };
