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
 * Cloud Integration API
 *
 * Express Router providing integration endpoints for SAP cloud services:
 * SuccessFactors, Ariba, Concur, and SAP Analytics Cloud.
 */

'use strict';

const express = require('express');
const Logger = require('../lib/logger');

// ── Mock data ───────────────────────────────────────────────

const MOCK_SF_EMPLOYEES = [
  { userId: 'EMP001', firstName: 'Anna', lastName: 'Mueller', department: 'Finance', status: 'active', hireDate: '2020-03-15' },
  { userId: 'EMP002', firstName: 'Thomas', lastName: 'Schmidt', department: 'IT', status: 'active', hireDate: '2019-07-01' },
  { userId: 'EMP003', firstName: 'Maria', lastName: 'Weber', department: 'HR', status: 'active', hireDate: '2021-01-10' },
];

const MOCK_SF_POSITIONS = [
  { positionId: 'POS001', title: 'Senior Accountant', department: 'Finance', status: 'filled', incumbent: 'EMP001' },
  { positionId: 'POS002', title: 'IT Architect', department: 'IT', status: 'filled', incumbent: 'EMP002' },
  { positionId: 'POS003', title: 'HR Business Partner', department: 'HR', status: 'vacant', incumbent: null },
];

const MOCK_SF_ENTITIES = {
  PerPerson: MOCK_SF_EMPLOYEES,
  Position: MOCK_SF_POSITIONS,
};

const MOCK_ARIBA_POS = [
  { poNumber: 'PO-2025-001', vendor: 'ACME Corp', amount: 45000.00, currency: 'USD', status: 'Approved', createdDate: '2025-11-01' },
  { poNumber: 'PO-2025-002', vendor: 'TechParts GmbH', amount: 12500.00, currency: 'EUR', status: 'Ordered', createdDate: '2025-11-15' },
  { poNumber: 'PO-2025-003', vendor: 'Global Services Ltd', amount: 89000.00, currency: 'USD', status: 'Received', createdDate: '2025-10-20' },
];

const MOCK_ARIBA_CONTRACTS = [
  { contractId: 'CTR-001', title: 'IT Infrastructure Support', vendor: 'TechParts GmbH', value: 250000.00, currency: 'EUR', status: 'Active', startDate: '2025-01-01', endDate: '2026-12-31' },
  { contractId: 'CTR-002', title: 'Office Supplies Agreement', vendor: 'ACME Corp', value: 50000.00, currency: 'USD', status: 'Active', startDate: '2025-06-01', endDate: '2026-05-31' },
];

const MOCK_CONCUR_REPORTS = [
  { reportId: 'EXP-001', employee: 'Anna Mueller', totalAmount: 1250.00, currency: 'EUR', status: 'Approved', submitDate: '2025-11-20', approvedDate: '2025-11-22' },
  { reportId: 'EXP-002', employee: 'Thomas Schmidt', totalAmount: 3400.00, currency: 'USD', status: 'Pending', submitDate: '2025-12-01', approvedDate: null },
  { reportId: 'EXP-003', employee: 'Maria Weber', totalAmount: 890.00, currency: 'EUR', status: 'Approved', submitDate: '2025-11-10', approvedDate: '2025-11-12' },
];

const MOCK_SAC_MODELS = [
  { id: 'mdl-fin-001', name: 'Financial Planning Model', type: 'planning', dimensions: ['Company', 'CostCenter', 'Account', 'Time'], measures: ['Amount', 'Quantity'], lastUpdated: '2025-12-01T10:00:00Z' },
  { id: 'mdl-hr-002', name: 'Workforce Planning Model', type: 'planning', dimensions: ['Department', 'Position', 'Location', 'Time'], measures: ['Headcount', 'FTE', 'Cost'], lastUpdated: '2025-11-20T14:30:00Z' },
  { id: 'mdl-sales-003', name: 'Sales Analytics Model', type: 'analytic', dimensions: ['Region', 'Product', 'Customer', 'Time'], measures: ['Revenue', 'Quantity', 'Margin'], lastUpdated: '2025-12-05T08:45:00Z' },
];

/**
 * Create and return an Express Router for cloud integration endpoints.
 * @param {object} state - Shared forensic state from server.js
 * @returns {express.Router}
 */
function createCloudRouter(state) {
  const router = express.Router();
  const log = new Logger('cloud-api');

  // ── SuccessFactors ──────────────────────────────────────────

  /**
   * GET /api/cloud/sf/entities/:entitySet - Query SF entities
   */
  router.get('/api/cloud/sf/entities/:entitySet', (req, res) => {
    try {
      if (state.cloud && state.cloud.sf) {
        return res.json(state.cloud.sf.query(req.params.entitySet, req.query));
      }
      const entitySet = req.params.entitySet;
      const data = MOCK_SF_ENTITIES[entitySet];
      if (!data) {
        return res.status(404).json({ error: `Entity set not found: ${entitySet}` });
      }
      res.json({ entitySet, results: data, total: data.length });
    } catch (err) {
      log.error('Failed to query SF entities', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/cloud/sf/entities/:entitySet - Create SF entity
   */
  router.post('/api/cloud/sf/entities/:entitySet', (req, res) => {
    try {
      if (state.cloud && state.cloud.sf) {
        return res.json(state.cloud.sf.create(req.params.entitySet, req.body));
      }
      const entitySet = req.params.entitySet;
      log.debug('Mock creating SF entity', { entitySet });
      res.status(201).json({
        entitySet,
        created: true,
        entity: { ...req.body, __metadata: { uri: `/${entitySet}('${Date.now()}')`, type: entitySet } },
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      log.error('Failed to create SF entity', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  // ── Ariba ────────────────────────────────────────────────────

  /**
   * GET /api/cloud/ariba/purchase-orders - Query Ariba purchase orders
   */
  router.get('/api/cloud/ariba/purchase-orders', (_req, res) => {
    try {
      if (state.cloud && state.cloud.ariba) {
        return res.json(state.cloud.ariba.getPurchaseOrders());
      }
      res.json({ purchaseOrders: MOCK_ARIBA_POS, total: MOCK_ARIBA_POS.length });
    } catch (err) {
      log.error('Failed to query Ariba POs', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/cloud/ariba/contracts - Query Ariba contracts
   */
  router.get('/api/cloud/ariba/contracts', (_req, res) => {
    try {
      if (state.cloud && state.cloud.ariba) {
        return res.json(state.cloud.ariba.getContracts());
      }
      res.json({ contracts: MOCK_ARIBA_CONTRACTS, total: MOCK_ARIBA_CONTRACTS.length });
    } catch (err) {
      log.error('Failed to query Ariba contracts', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  // ── Concur ───────────────────────────────────────────────────

  /**
   * GET /api/cloud/concur/expense-reports - Query expense reports
   */
  router.get('/api/cloud/concur/expense-reports', (_req, res) => {
    try {
      if (state.cloud && state.cloud.concur) {
        return res.json(state.cloud.concur.getExpenseReports());
      }
      res.json({ expenseReports: MOCK_CONCUR_REPORTS, total: MOCK_CONCUR_REPORTS.length });
    } catch (err) {
      log.error('Failed to query Concur reports', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/cloud/concur/users - Provision Concur user
   */
  router.post('/api/cloud/concur/users', (req, res) => {
    try {
      if (state.cloud && state.cloud.concur) {
        return res.json(state.cloud.concur.provisionUser(req.body));
      }
      const userData = req.body || {};
      log.debug('Mock provisioning Concur user', { email: userData.email });
      res.status(201).json({
        provisioned: true,
        user: {
          loginId: userData.email || 'user@example.com',
          firstName: userData.firstName || 'New',
          lastName: userData.lastName || 'User',
          status: 'Active',
          provisionedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      log.error('Failed to provision Concur user', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  // ── SAP Analytics Cloud ──────────────────────────────────────

  /**
   * GET /api/cloud/sac/models - List SAC models
   */
  router.get('/api/cloud/sac/models', (_req, res) => {
    try {
      if (state.cloud && state.cloud.sac) {
        return res.json(state.cloud.sac.listModels());
      }
      res.json({ models: MOCK_SAC_MODELS, total: MOCK_SAC_MODELS.length });
    } catch (err) {
      log.error('Failed to list SAC models', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/cloud/sac/models/:id/import - Import data into SAC model
   */
  router.post('/api/cloud/sac/models/:id/import', (req, res) => {
    try {
      if (state.cloud && state.cloud.sac) {
        return res.json(state.cloud.sac.importData(req.params.id, req.body));
      }
      const model = MOCK_SAC_MODELS.find((m) => m.id === req.params.id);
      if (!model) {
        return res.status(404).json({ error: `Model not found: ${req.params.id}` });
      }
      const rows = (req.body && req.body.data) ? req.body.data.length : 0;
      log.debug('Mock importing data to SAC model', { modelId: req.params.id, rows });
      res.json({
        modelId: req.params.id,
        modelName: model.name,
        importStatus: 'completed',
        rowsImported: rows || 100,
        importedAt: new Date().toISOString(),
      });
    } catch (err) {
      log.error('Failed to import data to SAC model', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createCloudRouter };
