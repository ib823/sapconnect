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
 * Data Export API
 *
 * Express Router providing downloadable exports of forensic reports,
 * event logs, and migration plans using existing serialization methods.
 */

'use strict';

const express = require('express');
const Logger = require('../lib/logger');

/**
 * Create and return an Express Router for export endpoints.
 * @param {object} forensicState - Shared forensic state from server.js
 * @returns {express.Router}
 */
function createExportRouter(forensicState) {
  const router = express.Router();
  const log = new Logger('export-api');

  /**
   * GET /api/export/forensic/json — Download forensic report as JSON
   */
  router.get('/api/export/forensic/json', (_req, res) => {
    const report = forensicState.report;
    if (!report) return res.status(404).json({ error: 'No forensic report available' });

    const json = typeof report.toJSON === 'function' ? report.toJSON() : report;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="forensic-report.json"');
    res.json(json);
  });

  /**
   * GET /api/export/forensic/markdown — Download forensic report as Markdown
   */
  router.get('/api/export/forensic/markdown', (_req, res) => {
    const report = forensicState.report;
    if (!report) return res.status(404).json({ error: 'No forensic report available' });
    if (typeof report.toMarkdown !== 'function') {
      return res.status(404).json({ error: 'Report does not support Markdown export' });
    }

    const md = report.toMarkdown();
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename="forensic-report.md"');
    res.send(md);
  });

  /**
   * GET /api/export/event-log/csv — Download event log as CSV
   */
  router.get('/api/export/event-log/csv', (_req, res) => {
    const eventLog = _getEventLog(forensicState);
    if (!eventLog) return res.status(404).json({ error: 'No event log available' });

    const csv = eventLog.toCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="event-log.csv"');
    res.send(csv);
  });

  /**
   * GET /api/export/event-log/xes — Download event log as XES (XML)
   */
  router.get('/api/export/event-log/xes', (_req, res) => {
    const eventLog = _getEventLog(forensicState);
    if (!eventLog) return res.status(404).json({ error: 'No event log available' });

    const xes = eventLog.toXES();
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="event-log.xes"');
    res.send(xes);
  });

  /**
   * GET /api/export/event-log/json — Download event log as JSON
   */
  router.get('/api/export/event-log/json', (_req, res) => {
    const eventLog = _getEventLog(forensicState);
    if (!eventLog) return res.status(404).json({ error: 'No event log available' });

    const json = eventLog.toJSON();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="event-log.json"');
    res.json(json);
  });

  /**
   * GET /api/export/migration/plan/json — Download latest migration plan as JSON
   */
  router.get('/api/export/migration/plan/json', (_req, res) => {
    if (!forensicState.latestPlan) {
      return res.status(404).json({ error: 'No migration plan available' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="migration-plan.json"');
    res.json(forensicState.latestPlan);
  });

  return router;
}

/**
 * Get the current event log from forensic state.
 * Checks eventLog directly, then first entry in eventLogs map.
 */
function _getEventLog(state) {
  if (state.eventLog) return state.eventLog;
  if (state.eventLogs) {
    const keys = Object.keys(state.eventLogs);
    if (keys.length > 0) return state.eventLogs[keys[0]];
  }
  return null;
}

module.exports = { createExportRouter };
