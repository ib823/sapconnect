/**
 * Testing API
 *
 * Express Router providing test generation, template management,
 * test execution, and reporting endpoints for SAP migration testing.
 */

'use strict';

const express = require('express');
const Logger = require('../lib/logger');

// ── Mock data ───────────────────────────────────────────────

const MOCK_TEMPLATES = [
  {
    id: 'tpl-fi-smoke-001',
    name: 'FI Posting Smoke Test',
    module: 'FI',
    type: 'smoke',
    description: 'Verify basic FI document posting in S/4HANA',
    variables: ['companyCode', 'fiscalYear', 'currency'],
    steps: [
      { action: 'Post GL document via FB01', expected: 'Document number assigned' },
      { action: 'Display document via FB03', expected: 'Document displayed correctly' },
    ],
  },
  {
    id: 'tpl-sd-smoke-002',
    name: 'SD Order Creation Smoke Test',
    module: 'SD',
    type: 'smoke',
    description: 'Verify sales order creation end-to-end',
    variables: ['salesOrg', 'distributionChannel', 'division', 'customer'],
    steps: [
      { action: 'Create sales order via VA01', expected: 'Order number assigned' },
      { action: 'Check availability', expected: 'Stock confirmed' },
    ],
  },
  {
    id: 'tpl-mm-regression-003',
    name: 'MM Purchase Order Regression',
    module: 'MM',
    type: 'regression',
    description: 'Regression test for PO creation and goods receipt',
    variables: ['plant', 'vendor', 'material'],
    steps: [
      { action: 'Create PO via ME21N', expected: 'PO number assigned' },
      { action: 'Goods receipt via MIGO', expected: 'Material document created' },
      { action: 'Invoice verification via MIRO', expected: 'Invoice posted' },
    ],
  },
  {
    id: 'tpl-fi-integration-004',
    name: 'FI-CO Integration Test',
    module: 'FI',
    type: 'integration',
    description: 'Verify FI postings flow to CO correctly',
    variables: ['companyCode', 'costCenter', 'glAccount'],
    steps: [
      { action: 'Post expense to cost center', expected: 'CO document created' },
      { action: 'Check cost center report via KSB1', expected: 'Posting visible' },
    ],
  },
  {
    id: 'tpl-hr-smoke-005',
    name: 'HR Master Data Smoke Test',
    module: 'HR',
    type: 'smoke',
    description: 'Verify employee master data maintenance',
    variables: ['personnelNumber', 'companyCode', 'personnelArea'],
    steps: [
      { action: 'Display employee via PA20', expected: 'Infotypes displayed' },
      { action: 'Maintain infotype 0001 via PA30', expected: 'Record saved' },
    ],
  },
];

const MOCK_REPORT = {
  generatedAt: new Date().toISOString(),
  summary: { total: 12, passed: 10, failed: 1, skipped: 1, passRate: 83.3 },
  modules: {
    FI: { total: 4, passed: 4, failed: 0 },
    SD: { total: 3, passed: 2, failed: 1 },
    MM: { total: 3, passed: 3, failed: 0 },
    HR: { total: 2, passed: 1, failed: 0, skipped: 1 },
  },
};

/**
 * Create and return an Express Router for testing endpoints.
 * @param {object} state - Shared forensic state from server.js
 * @returns {express.Router}
 */
function createTestingRouter(state) {
  const router = express.Router();
  const log = new Logger('testing-api');

  /**
   * POST /api/testing/generate - Generate test cases
   */
  router.post('/api/testing/generate', (req, res) => {
    try {
      const { type, input } = req.body || {};
      if (state.testing) {
        return res.json(state.testing.generate(type, input));
      }
      log.debug('Generating mock test cases', { type });
      const testCases = [
        {
          id: 'tc-001',
          name: `${type || 'description'}-based test 1`,
          type: type || 'description',
          priority: 'high',
          steps: [
            { action: 'Navigate to transaction', expected: 'Screen displayed' },
            { action: 'Enter test data', expected: 'Data accepted' },
            { action: 'Execute and verify', expected: 'Success message' },
          ],
        },
        {
          id: 'tc-002',
          name: `${type || 'description'}-based test 2`,
          type: type || 'description',
          priority: 'medium',
          steps: [
            { action: 'Open related report', expected: 'Report loads' },
            { action: 'Verify data consistency', expected: 'Data matches' },
          ],
        },
        {
          id: 'tc-003',
          name: `${type || 'description'}-based test 3`,
          type: type || 'description',
          priority: 'low',
          steps: [
            { action: 'Test error handling', expected: 'Error message displayed' },
            { action: 'Verify rollback', expected: 'No data persisted' },
          ],
        },
      ];
      res.json({ testCases, generatedAt: new Date().toISOString() });
    } catch (err) {
      log.error('Failed to generate test cases', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/testing/templates - List test templates
   */
  router.get('/api/testing/templates', (req, res) => {
    try {
      if (state.testing) {
        return res.json(state.testing.listTemplates(req.query));
      }
      let filtered = MOCK_TEMPLATES;
      if (req.query.module) {
        filtered = filtered.filter((t) => t.module === req.query.module);
      }
      if (req.query.type) {
        filtered = filtered.filter((t) => t.type === req.query.type);
      }
      res.json({ templates: filtered, total: filtered.length });
    } catch (err) {
      log.error('Failed to list templates', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/testing/templates/:id - Get template by ID
   */
  router.get('/api/testing/templates/:id', (req, res) => {
    try {
      if (state.testing) {
        return res.json(state.testing.getTemplate(req.params.id));
      }
      const template = MOCK_TEMPLATES.find((t) => t.id === req.params.id);
      if (!template) {
        return res.status(404).json({ error: `Template not found: ${req.params.id}` });
      }
      res.json(template);
    } catch (err) {
      log.error('Failed to get template', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/testing/templates/:id/instantiate - Fill template with variables
   */
  router.post('/api/testing/templates/:id/instantiate', (req, res) => {
    try {
      if (state.testing) {
        return res.json(state.testing.instantiate(req.params.id, req.body.variables));
      }
      const template = MOCK_TEMPLATES.find((t) => t.id === req.params.id);
      if (!template) {
        return res.status(404).json({ error: `Template not found: ${req.params.id}` });
      }
      const variables = req.body.variables || {};
      const instantiated = {
        ...template,
        instantiatedAt: new Date().toISOString(),
        resolvedVariables: variables,
        steps: template.steps.map((s) => {
          let action = s.action;
          for (const [key, value] of Object.entries(variables)) {
            action = action.replace(`{${key}}`, value);
          }
          return { ...s, action };
        }),
      };
      res.json(instantiated);
    } catch (err) {
      log.error('Failed to instantiate template', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/testing/execute - Run test suite (mock)
   */
  router.post('/api/testing/execute', (req, res) => {
    try {
      const { testCases } = req.body || {};
      if (state.testing) {
        return res.json(state.testing.execute(testCases));
      }
      const cases = testCases || [];
      const results = cases.map((tc, i) => ({
        testId: tc.id || `tc-${i + 1}`,
        name: tc.name || `Test ${i + 1}`,
        status: i === 0 ? 'passed' : i === cases.length - 1 ? 'failed' : 'passed',
        durationMs: Math.floor(Math.random() * 5000) + 500,
        executedAt: new Date().toISOString(),
      }));
      const passed = results.filter((r) => r.status === 'passed').length;
      const failed = results.filter((r) => r.status === 'failed').length;
      res.json({
        summary: { total: results.length, passed, failed },
        results,
        executedAt: new Date().toISOString(),
      });
    } catch (err) {
      log.error('Failed to execute tests', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/testing/report - Get latest test report
   */
  router.get('/api/testing/report', (_req, res) => {
    try {
      if (state.testing) {
        return res.json(state.testing.getReport());
      }
      res.json(MOCK_REPORT);
    } catch (err) {
      log.error('Failed to get test report', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createTestingRouter };
