/**
 * Dashboard API
 *
 * REST API for serving forensic extraction results to a dashboard UI.
 * Extends the existing Express pattern from the migration dashboard.
 */

const express = require('express');
const Logger = require('../../lib/logger');

function createDashboardRouter(extractionState) {
  const router = express.Router();
  const log = new Logger('forensic-api');

  router.get('/api/forensic/summary', (req, res) => {
    const report = extractionState.report;
    if (!report) return res.json({ status: 'no_extraction', message: 'No extraction data available' });
    res.json(report._renderSystemOverview());
  });

  router.get('/api/forensic/modules', (req, res) => {
    const report = extractionState.report;
    if (!report) return res.json({ modules: [] });
    res.json(report._renderModuleInventory());
  });

  router.get('/api/forensic/modules/:id', (req, res) => {
    const report = extractionState.report;
    if (!report) return res.status(404).json({ error: 'No data' });
    res.json(report.toModuleReport(req.params.id.toUpperCase()));
  });

  router.get('/api/forensic/processes', (req, res) => {
    const catalog = extractionState.processCatalog;
    if (!catalog) return res.json({ processes: [] });
    res.json(catalog.toJSON());
  });

  router.get('/api/forensic/processes/:id', (req, res) => {
    const catalog = extractionState.processCatalog;
    if (!catalog) return res.status(404).json({ error: 'No data' });
    const proc = catalog.getProcess(req.params.id);
    if (!proc) return res.status(404).json({ error: 'Process not found' });
    res.json(proc);
  });

  router.get('/api/forensic/config/:module', (req, res) => {
    const interps = extractionState.interpretations || [];
    const mod = req.params.module.toUpperCase();
    res.json(interps.filter(i => i.ruleId?.startsWith(mod)));
  });

  router.get('/api/forensic/code', (req, res) => {
    const results = extractionState.results || {};
    res.json(results.CUSTOM_CODE || { stats: { totalCustom: 0 } });
  });

  router.get('/api/forensic/security', (req, res) => {
    const results = extractionState.results || {};
    res.json(results.SECURITY || {});
  });

  router.get('/api/forensic/interfaces', (req, res) => {
    const results = extractionState.results || {};
    res.json(results.INTERFACES || {});
  });

  router.get('/api/forensic/gaps', (req, res) => {
    res.json(extractionState.gapReport || {});
  });

  router.get('/api/forensic/confidence', (req, res) => {
    res.json(extractionState.confidence || { overall: 0, grade: 'F' });
  });

  router.get('/api/forensic/coverage', (req, res) => {
    const coverage = extractionState.coverageTracker;
    if (!coverage) return res.json({ total: 0 });
    res.json(coverage.getSystemReport());
  });

  router.post('/api/forensic/extract', async (req, res) => {
    if (extractionState.running) {
      return res.status(409).json({ error: 'Extraction already in progress' });
    }
    try {
      extractionState.running = true;
      log.info('Extraction triggered via API');
      // The orchestrator will handle the actual extraction
      if (extractionState.onExtract) {
        extractionState.onExtract(req.body || {});
      }
      res.json({ status: 'started', message: 'Extraction initiated' });
    } catch (err) {
      extractionState.running = false;
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/api/forensic/progress', (req, res) => {
    res.json({
      running: extractionState.running || false,
      progress: extractionState.progress || {},
      startedAt: extractionState.startedAt || null,
    });
  });

  return router;
}

module.exports = { createDashboardRouter };
