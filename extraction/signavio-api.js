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
 * Signavio Process Model API
 *
 * Express Router providing Signavio process model integration endpoints
 * for listing, searching, exporting BPMN, and parsing configuration steps.
 */

'use strict';

const express = require('express');
const Logger = require('../lib/logger');

// ── Mock data ───────────────────────────────────────────────

const MOCK_MODELS = [
  {
    id: 'mod-o2c-001',
    name: 'Order-to-Cash (O2C)',
    description: 'End-to-end order processing from sales order to payment receipt',
    revisionId: 'rev-o2c-001',
    lastModified: '2025-12-10T14:30:00Z',
    author: 'process.admin@example.com',
  },
  {
    id: 'mod-p2p-002',
    name: 'Procure-to-Pay (P2P)',
    description: 'Procurement lifecycle from purchase requisition to invoice payment',
    revisionId: 'rev-p2p-002',
    lastModified: '2025-11-28T09:15:00Z',
    author: 'process.admin@example.com',
  },
  {
    id: 'mod-r2r-003',
    name: 'Record-to-Report (R2R)',
    description: 'Financial close and reporting process',
    revisionId: 'rev-r2r-003',
    lastModified: '2025-11-15T16:45:00Z',
    author: 'fi.lead@example.com',
  },
  {
    id: 'mod-hire-004',
    name: 'Hire-to-Retire (H2R)',
    description: 'Employee lifecycle from recruitment to separation',
    revisionId: 'rev-hire-004',
    lastModified: '2025-10-22T11:00:00Z',
    author: 'hr.lead@example.com',
  },
  {
    id: 'mod-plan-005',
    name: 'Plan-to-Produce (P2M)',
    description: 'Production planning and manufacturing execution',
    revisionId: 'rev-plan-005',
    lastModified: '2025-10-05T08:30:00Z',
    author: 'pp.lead@example.com',
  },
];

const MOCK_DICTIONARY = [
  { term: 'Sales Order', definition: 'A document confirming the sale of goods or services to a customer', domain: 'SD' },
  { term: 'Purchase Requisition', definition: 'An internal request to procure goods or services', domain: 'MM' },
  { term: 'General Ledger', definition: 'The central repository for accounting data in SAP', domain: 'FI' },
  { term: 'Cost Center', definition: 'An organizational unit for tracking costs within controlling', domain: 'CO' },
  { term: 'Material Master', definition: 'Central record containing all material-related data', domain: 'MM' },
];

const MOCK_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="Start_1" name="Order Received"/>
    <bpmn:task id="Task_1" name="Create Sales Order"/>
    <bpmn:task id="Task_2" name="Check Availability"/>
    <bpmn:task id="Task_3" name="Deliver Goods"/>
    <bpmn:task id="Task_4" name="Create Invoice"/>
    <bpmn:endEvent id="End_1" name="Payment Received"/>
  </bpmn:process>
</bpmn:definitions>`;

/**
 * Create and return an Express Router for Signavio endpoints.
 * @param {object} state - Shared forensic state from server.js
 * @returns {express.Router}
 */
function createSignavioRouter(state) {
  const router = express.Router();
  const log = new Logger('signavio-api');

  /**
   * GET /api/signavio/models - List all process models
   */
  router.get('/api/signavio/models', (_req, res) => {
    try {
      if (state.signavio) {
        return res.json(state.signavio.listModels());
      }
      log.debug('Returning mock Signavio models');
      res.json({ models: MOCK_MODELS, total: MOCK_MODELS.length });
    } catch (err) {
      log.error('Failed to list Signavio models', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/signavio/models/:id - Get model by revision ID
   */
  router.get('/api/signavio/models/:id', (req, res) => {
    try {
      if (state.signavio) {
        return res.json(state.signavio.getModel(req.params.id));
      }
      const model = MOCK_MODELS.find((m) => m.revisionId === req.params.id || m.id === req.params.id);
      if (!model) {
        return res.status(404).json({ error: `Model not found: ${req.params.id}` });
      }
      res.json(model);
    } catch (err) {
      log.error('Failed to get Signavio model', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/signavio/models/:id/bpmn - Export model as BPMN XML
   */
  router.get('/api/signavio/models/:id/bpmn', (req, res) => {
    try {
      if (state.signavio) {
        return res.json(state.signavio.exportBpmn(req.params.id));
      }
      const model = MOCK_MODELS.find((m) => m.revisionId === req.params.id || m.id === req.params.id);
      if (!model) {
        return res.status(404).json({ error: `Model not found: ${req.params.id}` });
      }
      res.json({ modelId: model.id, revisionId: model.revisionId, bpmn: MOCK_BPMN });
    } catch (err) {
      log.error('Failed to export BPMN', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/signavio/models/:id/parse - Parse BPMN into configuration steps
   */
  router.post('/api/signavio/models/:id/parse', (req, res) => {
    try {
      if (state.signavio) {
        return res.json(state.signavio.parseBpmn(req.params.id, req.body.bpmnXml));
      }
      const model = MOCK_MODELS.find((m) => m.revisionId === req.params.id || m.id === req.params.id);
      if (!model) {
        return res.status(404).json({ error: `Model not found: ${req.params.id}` });
      }
      res.json({
        modelId: model.id,
        configSteps: [
          { step: 1, activity: 'Create Sales Order', tcode: 'VA01', module: 'SD', type: 'transaction' },
          { step: 2, activity: 'Check Availability', tcode: 'CO09', module: 'SD', type: 'check' },
          { step: 3, activity: 'Deliver Goods', tcode: 'VL01N', module: 'LE', type: 'transaction' },
          { step: 4, activity: 'Create Invoice', tcode: 'VF01', module: 'SD', type: 'transaction' },
        ],
        complexity: {
          totalSteps: 4,
          transactions: 3,
          checks: 1,
          modules: ['SD', 'LE'],
          estimatedEffortHours: 24,
        },
      });
    } catch (err) {
      log.error('Failed to parse BPMN', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/signavio/search?q= - Search models by name/description
   */
  router.get('/api/signavio/search', (req, res) => {
    try {
      const query = (req.query.q || '').toLowerCase();
      if (state.signavio) {
        return res.json(state.signavio.search(query));
      }
      const results = MOCK_MODELS.filter(
        (m) => m.name.toLowerCase().includes(query) || m.description.toLowerCase().includes(query)
      );
      res.json({ query: req.query.q || '', results, total: results.length });
    } catch (err) {
      log.error('Failed to search Signavio models', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/signavio/dictionary - Get process glossary
   */
  router.get('/api/signavio/dictionary', (_req, res) => {
    try {
      if (state.signavio) {
        return res.json(state.signavio.getDictionary());
      }
      res.json({ entries: MOCK_DICTIONARY, total: MOCK_DICTIONARY.length });
    } catch (err) {
      log.error('Failed to get Signavio dictionary', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createSignavioRouter };
