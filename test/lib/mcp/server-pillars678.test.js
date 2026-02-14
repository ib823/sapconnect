/**
 * Tests for MCP Server — Pillars 6-8 Tools
 * (Signavio, Testing, SuccessFactors, Ariba, Concur, SAC)
 */
const McpServer = require('../../../lib/mcp/server');

describe('McpServer — Pillars 6-8 Tools', () => {
  let server;

  beforeEach(() => {
    server = new McpServer({ mode: 'mock' });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Tool Listing
  // ─────────────────────────────────────────────────────────────────────────

  describe('tools/list includes Pillar 6-8 tools', () => {
    it('should have 43 total tools (12 + 31)', async () => {
      const result = await server._handleToolsList();
      expect(result.tools).toHaveLength(43);
    });

    it('should include all signavio tools', async () => {
      const result = await server._handleToolsList();
      const names = result.tools.map(t => t.name);
      expect(names).toContain('signavio_list_models');
      expect(names).toContain('signavio_get_model');
      expect(names).toContain('signavio_search_models');
      expect(names).toContain('signavio_get_bpmn');
      expect(names).toContain('signavio_parse_process');
      expect(names).toContain('signavio_map_to_config');
    });

    it('should include all testing tools', async () => {
      const result = await server._handleToolsList();
      const names = result.tools.map(t => t.name);
      expect(names).toContain('test_generate_from_description');
      expect(names).toContain('test_generate_from_config');
      expect(names).toContain('test_generate_from_bpmn');
      expect(names).toContain('test_get_template');
      expect(names).toContain('test_list_templates');
      expect(names).toContain('test_run_suite');
      expect(names).toContain('test_get_report');
    });

    it('should include all sf tools', async () => {
      const result = await server._handleToolsList();
      const names = result.tools.map(t => t.name);
      expect(names).toContain('sf_query_entities');
      expect(names).toContain('sf_get_entity');
      expect(names).toContain('sf_create_entity');
      expect(names).toContain('sf_get_metadata');
      expect(names).toContain('sf_batch_operation');
    });

    it('should include all ariba tools', async () => {
      const result = await server._handleToolsList();
      const names = result.tools.map(t => t.name);
      expect(names).toContain('ariba_get_purchase_orders');
      expect(names).toContain('ariba_get_requisitions');
      expect(names).toContain('ariba_get_contracts');
      expect(names).toContain('ariba_get_report');
    });

    it('should include all concur tools', async () => {
      const result = await server._handleToolsList();
      const names = result.tools.map(t => t.name);
      expect(names).toContain('concur_get_expense_reports');
      expect(names).toContain('concur_get_travel_requests');
      expect(names).toContain('concur_manage_users');
      expect(names).toContain('concur_create_expense_report');
      expect(names).toContain('concur_get_lists');
    });

    it('should include all sac tools', async () => {
      const result = await server._handleToolsList();
      const names = result.tools.map(t => t.name);
      expect(names).toContain('sac_get_models');
      expect(names).toContain('sac_get_stories');
      expect(names).toContain('sac_import_data');
      expect(names).toContain('sac_get_dimensions');
    });

    it('should have inputSchema for every Pillar 6-8 tool', async () => {
      const result = await server._handleToolsList();
      const pillar678 = result.tools.filter(t =>
        t.name.startsWith('signavio_') || t.name.startsWith('test_') ||
        t.name.startsWith('sf_') || t.name.startsWith('ariba_') ||
        t.name.startsWith('concur_') || t.name.startsWith('sac_')
      );
      expect(pillar678).toHaveLength(31);
      for (const tool of pillar678) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.description).toBeDefined();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Signavio Tools (Mock)
  // ─────────────────────────────────────────────────────────────────────────

  describe('Signavio tools (mock)', () => {
    it('signavio_list_models returns models', async () => {
      const result = await server._handleToolsCall('signavio_list_models', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.models).toBeDefined();
      expect(parsed.models.length).toBe(5);
      expect(parsed.totalCount).toBe(5);
      expect(parsed.models[0].id).toBeDefined();
      expect(parsed.models[0].name).toBeDefined();
      expect(parsed.models[0].revisionId).toBeDefined();
    });

    it('signavio_list_models filters by folderId', async () => {
      const result = await server._handleToolsCall('signavio_list_models', { folderId: 'finance' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.models.length).toBe(1);
      expect(parsed.models[0].name).toContain('Record-to-Report');
    });

    it('signavio_get_model returns process model', async () => {
      const result = await server._handleToolsCall('signavio_get_model', { revisionId: 'rev-o2c-v3' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.revisionId).toBe('rev-o2c-v3');
      expect(parsed.elements).toBeDefined();
      expect(parsed.elements.tasks).toBeDefined();
      expect(parsed.elements.tasks.length).toBeGreaterThan(0);
      expect(parsed.elements.gateways).toBeDefined();
      expect(parsed.elements.events).toBeDefined();
      expect(parsed.connections).toBeDefined();
    });

    it('signavio_search_models filters by query', async () => {
      const result = await server._handleToolsCall('signavio_search_models', { query: 'Order' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.results).toBeDefined();
      expect(parsed.results.length).toBeGreaterThan(0);
      expect(parsed.query).toBe('Order');
    });

    it('signavio_search_models returns empty for no match', async () => {
      const result = await server._handleToolsCall('signavio_search_models', { query: 'ZZZZNOTFOUND' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.results).toHaveLength(0);
      expect(parsed.totalCount).toBe(0);
    });

    it('signavio_get_bpmn returns BPMN XML', async () => {
      const result = await server._handleToolsCall('signavio_get_bpmn', { revisionId: 'rev-o2c-v3' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.revisionId).toBe('rev-o2c-v3');
      expect(parsed.format).toBe('BPMN 2.0');
      expect(parsed.xml).toContain('<?xml');
      expect(parsed.xml).toContain('definitions');
      expect(parsed.xml).toContain('process');
    });

    it('signavio_parse_process returns structured flow', async () => {
      const result = await server._handleToolsCall('signavio_parse_process', { bpmnXml: '<mock/>' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.processId).toBeDefined();
      expect(parsed.processName).toBeDefined();
      expect(parsed.startEvents).toBeDefined();
      expect(parsed.endEvents).toBeDefined();
      expect(parsed.tasks).toBeDefined();
      expect(parsed.tasks.length).toBeGreaterThan(0);
      expect(parsed.gateways).toBeDefined();
      expect(parsed.flows).toBeDefined();
      expect(parsed.metrics).toBeDefined();
    });

    it('signavio_map_to_config returns SAP config steps', async () => {
      const result = await server._handleToolsCall('signavio_map_to_config', { bpmnXml: '<mock/>' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.processName).toBeDefined();
      expect(parsed.configSteps).toBeDefined();
      expect(parsed.configSteps.length).toBeGreaterThan(0);
      expect(parsed.configSteps[0].tcode).toBeDefined();
      expect(parsed.configSteps[0].module).toBeDefined();
      expect(parsed.configSteps[0].sapObject).toBeDefined();
      expect(parsed.customizingActivities).toBeDefined();
      expect(parsed.totalSteps).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Testing Tools (Mock)
  // ─────────────────────────────────────────────────────────────────────────

  describe('Testing tools (mock)', () => {
    it('test_generate_from_description returns test cases', async () => {
      const result = await server._handleToolsCall('test_generate_from_description', {
        description: 'Test sales order creation in VA01',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.testCases).toBeDefined();
      expect(parsed.testCases.length).toBe(3);
      expect(parsed.totalGenerated).toBe(3);
      expect(parsed.testCases[0].id).toBeDefined();
      expect(parsed.testCases[0].title).toBeDefined();
      expect(parsed.testCases[0].type).toBeDefined();
      expect(parsed.testCases[0].steps).toBeDefined();
    });

    it('test_generate_from_config returns config-based tests', async () => {
      const result = await server._handleToolsCall('test_generate_from_config', {
        configChanges: [{ table: 'T001', field: 'BUKRS', oldValue: '', newValue: '2000' }],
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.testCases).toBeDefined();
      expect(parsed.testCases.length).toBe(2);
      expect(parsed.totalGenerated).toBe(2);
      expect(parsed.testCases[0].type).toBeDefined();
    });

    it('test_generate_from_bpmn returns test scenarios', async () => {
      const result = await server._handleToolsCall('test_generate_from_bpmn', { bpmnXml: '<mock/>' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.testScenarios).toBeDefined();
      expect(parsed.testScenarios.length).toBe(2);
      expect(parsed.totalScenarios).toBe(2);
      expect(parsed.processCoverage).toBeDefined();
      expect(parsed.testScenarios[0].coveredElements).toBeDefined();
    });

    it('test_get_template returns a template', async () => {
      const result = await server._handleToolsCall('test_get_template', { templateId: 'TPL-FI-001' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.templateId).toBe('TPL-FI-001');
      expect(parsed.name).toBeDefined();
      expect(parsed.module).toBe('FI');
      expect(parsed.steps).toBeDefined();
      expect(parsed.steps.length).toBeGreaterThan(0);
      expect(parsed.steps[0].tcode).toBeDefined();
      expect(parsed.prerequisites).toBeDefined();
    });

    it('test_list_templates returns templates', async () => {
      const result = await server._handleToolsCall('test_list_templates', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.templates).toBeDefined();
      expect(parsed.templates.length).toBe(5);
      expect(parsed.totalCount).toBe(5);
    });

    it('test_list_templates filters by module', async () => {
      const result = await server._handleToolsCall('test_list_templates', { module: 'FI' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.templates.length).toBe(2);
      expect(parsed.templates.every(t => t.module === 'FI')).toBe(true);
    });

    it('test_run_suite returns execution results', async () => {
      const result = await server._handleToolsCall('test_run_suite', {
        testCases: [
          { id: 'TC-1', title: 'Test A' },
          { id: 'TC-2', title: 'Test B' },
        ],
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.suiteId).toBeDefined();
      expect(parsed.status).toBeDefined();
      expect(parsed.results).toBeDefined();
      expect(parsed.results.length).toBe(2);
      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.total).toBe(2);
      expect(parsed.summary.passed).toBeDefined();
      expect(parsed.summary.failed).toBeDefined();
    });

    it('test_get_report returns summary report', async () => {
      const result = await server._handleToolsCall('test_get_report', { format: 'json' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.format).toBe('json');
      expect(parsed.reportId).toBeDefined();
      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.totalCases).toBeDefined();
      expect(parsed.summary.passed).toBeDefined();
      expect(parsed.summary.failed).toBeDefined();
      expect(parsed.summary.passRate).toBeDefined();
      expect(parsed.moduleBreakdown).toBeDefined();
      expect(parsed.failedCases).toBeDefined();
    });

    it('test_get_report defaults to json format', async () => {
      const result = await server._handleToolsCall('test_get_report', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.format).toBe('json');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SuccessFactors Tools (Mock)
  // ─────────────────────────────────────────────────────────────────────────

  describe('SuccessFactors tools (mock)', () => {
    it('sf_query_entities returns entities', async () => {
      const result = await server._handleToolsCall('sf_query_entities', { entitySet: 'EmpEmployment' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.d).toBeDefined();
      expect(parsed.d.results).toBeDefined();
      expect(parsed.d.results.length).toBeGreaterThan(0);
      expect(parsed.entitySet).toBe('EmpEmployment');
      expect(parsed.d.results[0].userId).toBeDefined();
    });

    it('sf_query_entities returns FOCompany entities', async () => {
      const result = await server._handleToolsCall('sf_query_entities', { entitySet: 'FOCompany' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.d.results.length).toBe(2);
      expect(parsed.d.results[0].externalCode).toBeDefined();
    });

    it('sf_get_entity returns single entity', async () => {
      const result = await server._handleToolsCall('sf_get_entity', { entitySet: 'EmpEmployment', key: 'EMP001' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.d).toBeDefined();
      expect(parsed.d.userId).toBe('EMP001');
      expect(parsed.d.firstName).toBeDefined();
      expect(parsed.d.lastName).toBeDefined();
      expect(parsed.d.email).toBeDefined();
    });

    it('sf_create_entity returns created entity', async () => {
      const result = await server._handleToolsCall('sf_create_entity', {
        entitySet: 'EmpEmployment',
        data: { userId: 'EMP-NEW', firstName: 'Test', lastName: 'User' },
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe('created');
      expect(parsed.entitySet).toBe('EmpEmployment');
      expect(parsed.d).toBeDefined();
      expect(parsed.d.__metadata).toBeDefined();
    });

    it('sf_get_metadata returns entity type definitions', async () => {
      const result = await server._handleToolsCall('sf_get_metadata', { entitySet: 'EmpEmployment' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.entityTypes).toBeDefined();
      expect(parsed.entityTypes.length).toBe(1);
      expect(parsed.entityTypes[0].entityType).toBe('EmpEmployment');
      expect(parsed.entityTypes[0].properties).toBeDefined();
      expect(parsed.entityTypes[0].properties.length).toBeGreaterThan(0);
    });

    it('sf_get_metadata returns all entity types when no entitySet specified', async () => {
      const result = await server._handleToolsCall('sf_get_metadata', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.entityTypes.length).toBe(2);
    });

    it('sf_batch_operation returns batch results', async () => {
      const result = await server._handleToolsCall('sf_batch_operation', {
        operations: [
          { method: 'GET', entitySet: 'EmpEmployment' },
          { method: 'POST', entitySet: 'EmpEmployment' },
        ],
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.batchId).toBeDefined();
      expect(parsed.results).toBeDefined();
      expect(parsed.results.length).toBe(2);
      expect(parsed.totalOperations).toBe(2);
      expect(parsed.successCount).toBe(2);
      expect(parsed.failureCount).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Ariba Tools (Mock)
  // ─────────────────────────────────────────────────────────────────────────

  describe('Ariba tools (mock)', () => {
    it('ariba_get_purchase_orders returns POs', async () => {
      const result = await server._handleToolsCall('ariba_get_purchase_orders', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.purchaseOrders).toBeDefined();
      expect(parsed.purchaseOrders.length).toBe(3);
      expect(parsed.totalCount).toBe(3);
      expect(parsed.purchaseOrders[0].poNumber).toBeDefined();
      expect(parsed.purchaseOrders[0].vendor).toBeDefined();
      expect(parsed.purchaseOrders[0].amount).toBeDefined();
    });

    it('ariba_get_purchase_orders filters by status', async () => {
      const result = await server._handleToolsCall('ariba_get_purchase_orders', { status: 'Approved' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.purchaseOrders.length).toBe(2);
      expect(parsed.purchaseOrders.every(po => po.status === 'Approved')).toBe(true);
    });

    it('ariba_get_requisitions returns requisitions', async () => {
      const result = await server._handleToolsCall('ariba_get_requisitions', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.requisitions).toBeDefined();
      expect(parsed.requisitions.length).toBe(3);
      expect(parsed.requisitions[0].reqId).toBeDefined();
      expect(parsed.requisitions[0].title).toBeDefined();
    });

    it('ariba_get_contracts returns contracts', async () => {
      const result = await server._handleToolsCall('ariba_get_contracts', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.contracts).toBeDefined();
      expect(parsed.contracts.length).toBe(3);
      expect(parsed.contracts[0].contractId).toBeDefined();
      expect(parsed.contracts[0].title).toBeDefined();
      expect(parsed.contracts[0].vendor).toBeDefined();
    });

    it('ariba_get_contracts filters by status', async () => {
      const result = await server._handleToolsCall('ariba_get_contracts', { status: 'Active' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.contracts.length).toBe(2);
    });

    it('ariba_get_report returns report data', async () => {
      const result = await server._handleToolsCall('ariba_get_report', { viewId: 'SPEND-001' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.viewId).toBe('SPEND-001');
      expect(parsed.reportTitle).toBeDefined();
      expect(parsed.data).toBeDefined();
      expect(parsed.data.length).toBeGreaterThan(0);
      expect(parsed.totals).toBeDefined();
      expect(parsed.totals.totalSpend).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Concur Tools (Mock)
  // ─────────────────────────────────────────────────────────────────────────

  describe('Concur tools (mock)', () => {
    it('concur_get_expense_reports returns reports', async () => {
      const result = await server._handleToolsCall('concur_get_expense_reports', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.expenseReports).toBeDefined();
      expect(parsed.expenseReports.length).toBe(3);
      expect(parsed.totalCount).toBe(3);
      expect(parsed.expenseReports[0].reportId).toBeDefined();
      expect(parsed.expenseReports[0].name).toBeDefined();
      expect(parsed.expenseReports[0].amount).toBeDefined();
    });

    it('concur_get_expense_reports filters by status', async () => {
      const result = await server._handleToolsCall('concur_get_expense_reports', { status: 'Approved' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.expenseReports.length).toBe(1);
    });

    it('concur_get_travel_requests returns requests', async () => {
      const result = await server._handleToolsCall('concur_get_travel_requests', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.travelRequests).toBeDefined();
      expect(parsed.travelRequests.length).toBe(3);
      expect(parsed.travelRequests[0].requestId).toBeDefined();
      expect(parsed.travelRequests[0].traveler).toBeDefined();
      expect(parsed.travelRequests[0].estimatedCost).toBeDefined();
    });

    it('concur_manage_users list returns users', async () => {
      const result = await server._handleToolsCall('concur_manage_users', { action: 'list' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.action).toBe('list');
      expect(parsed.users).toBeDefined();
      expect(parsed.users.length).toBe(3);
      expect(parsed.totalCount).toBe(3);
    });

    it('concur_manage_users create returns new user', async () => {
      const result = await server._handleToolsCall('concur_manage_users', {
        action: 'create',
        data: { firstName: 'New', lastName: 'User', email: 'new@example.com' },
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.action).toBe('create');
      expect(parsed.status).toBe('created');
      expect(parsed.user).toBeDefined();
    });

    it('concur_manage_users deactivate returns status', async () => {
      const result = await server._handleToolsCall('concur_manage_users', {
        action: 'deactivate',
        userId: 'USR-001',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.action).toBe('deactivate');
      expect(parsed.status).toBe('deactivated');
      expect(parsed.active).toBe(false);
    });

    it('concur_create_expense_report creates new report', async () => {
      const result = await server._handleToolsCall('concur_create_expense_report', {
        name: 'Q1 Client Visit',
        purpose: 'Customer meeting',
        currency: 'EUR',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.reportId).toBeDefined();
      expect(parsed.name).toBe('Q1 Client Visit');
      expect(parsed.purpose).toBe('Customer meeting');
      expect(parsed.currency).toBe('EUR');
      expect(parsed.status).toBe('Draft');
    });

    it('concur_get_lists returns all lists', async () => {
      const result = await server._handleToolsCall('concur_get_lists', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.lists).toBeDefined();
      expect(parsed.lists.length).toBe(3);
      expect(parsed.totalCount).toBe(3);
    });

    it('concur_get_lists returns specific list with items', async () => {
      const result = await server._handleToolsCall('concur_get_lists', { listId: 'LST-001' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.list).toBeDefined();
      expect(parsed.list.listId).toBe('LST-001');
      expect(parsed.items).toBeDefined();
      expect(parsed.items.length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SAC Tools (Mock)
  // ─────────────────────────────────────────────────────────────────────────

  describe('SAC tools (mock)', () => {
    it('sac_get_models returns all models', async () => {
      const result = await server._handleToolsCall('sac_get_models', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.models).toBeDefined();
      expect(parsed.models.length).toBe(3);
      expect(parsed.totalCount).toBe(3);
      expect(parsed.models[0].modelId).toBeDefined();
      expect(parsed.models[0].name).toBeDefined();
      expect(parsed.models[0].type).toBeDefined();
    });

    it('sac_get_models returns single model by ID', async () => {
      const result = await server._handleToolsCall('sac_get_models', { modelId: 'MOD-FIN-001' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.modelId).toBe('MOD-FIN-001');
      expect(parsed.name).toBeDefined();
    });

    it('sac_get_stories returns all stories', async () => {
      const result = await server._handleToolsCall('sac_get_stories', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.stories).toBeDefined();
      expect(parsed.stories.length).toBe(3);
      expect(parsed.totalCount).toBe(3);
      expect(parsed.stories[0].storyId).toBeDefined();
      expect(parsed.stories[0].name).toBeDefined();
    });

    it('sac_get_stories returns single story by ID', async () => {
      const result = await server._handleToolsCall('sac_get_stories', { storyId: 'STR-001' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.storyId).toBe('STR-001');
      expect(parsed.name).toBeDefined();
    });

    it('sac_import_data returns import status', async () => {
      const result = await server._handleToolsCall('sac_import_data', {
        modelId: 'MOD-FIN-001',
        data: [
          { Account: 'A100', Amount: 5000 },
          { Account: 'A200', Amount: 3000 },
        ],
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.modelId).toBe('MOD-FIN-001');
      expect(parsed.importId).toBeDefined();
      expect(parsed.status).toBe('completed');
      expect(parsed.rowsImported).toBe(2);
      expect(parsed.rowsFailed).toBe(0);
    });

    it('sac_get_dimensions returns model dimensions', async () => {
      const result = await server._handleToolsCall('sac_get_dimensions', { modelId: 'MOD-FIN-001' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.modelId).toBe('MOD-FIN-001');
      expect(parsed.dimensions).toBeDefined();
      expect(parsed.dimensions.length).toBeGreaterThan(0);
      expect(parsed.totalDimensions).toBeDefined();
      expect(parsed.dimensions[0].dimensionId).toBeDefined();
      expect(parsed.dimensions[0].type).toBeDefined();
    });

    it('sac_get_dimensions returns specific dimension with members', async () => {
      const result = await server._handleToolsCall('sac_get_dimensions', {
        modelId: 'MOD-FIN-001',
        dimensionId: 'Account',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.modelId).toBe('MOD-FIN-001');
      expect(parsed.dimension).toBeDefined();
      expect(parsed.dimension.dimensionId).toBe('Account');
      expect(parsed.members).toBeDefined();
      expect(parsed.members.length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Response format validation
  // ─────────────────────────────────────────────────────────────────────────

  describe('response format', () => {
    it('all Pillar 6-8 tools return content array with text type', async () => {
      const toolCalls = [
        ['signavio_list_models', {}],
        ['signavio_get_model', { revisionId: 'rev-1' }],
        ['test_list_templates', {}],
        ['test_get_report', {}],
        ['sf_query_entities', { entitySet: 'EmpEmployment' }],
        ['ariba_get_purchase_orders', {}],
        ['concur_get_expense_reports', {}],
        ['sac_get_models', {}],
      ];
      for (const [name, args] of toolCalls) {
        const result = await server._handleToolsCall(name, args);
        expect(result.content).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.content[0].type).toBe('text');
        // Ensure it's valid JSON
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toBeDefined();
      }
    });
  });
});
