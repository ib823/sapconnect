/**
 * Integration Tests for Universal MCP Bridge Tools
 *
 * Tests that all 50 new tools (forensic, assessment, migration, greenfield,
 * connection, cloud, config) are properly wired into the MCP server and
 * callable via handleMessage().
 */
const McpServer = require('../../../lib/mcp/server');

describe('McpServer — Universal Bridge Integration', () => {
  let server;

  beforeEach(() => {
    server = new McpServer({ mode: 'mock' });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Tool Registration
  // ─────────────────────────────────────────────────────────────────────────

  describe('tool registration', () => {
    it('should list 108 total tools (43 SAP + 15 Infor + 50 universal)', async () => {
      const result = await server.handleMessage({ id: 1, method: 'tools/list' });
      expect(result.result.tools).toHaveLength(108);
    });

    it('should include all forensic tools', async () => {
      const result = await server.handleMessage({ id: 1, method: 'tools/list' });
      const names = result.result.tools.map(t => t.name);
      expect(names).toContain('forensic_run_extraction');
      expect(names).toContain('forensic_run_module');
      expect(names).toContain('forensic_get_progress');
      expect(names).toContain('forensic_get_system_info');
      expect(names).toContain('forensic_get_results');
      expect(names).toContain('forensic_get_archiving_advice');
      expect(names).toContain('forensic_get_report');
    });

    it('should include all assessment tools', async () => {
      const result = await server.handleMessage({ id: 1, method: 'tools/list' });
      const names = result.result.tools.map(t => t.name);
      expect(names).toContain('assessment_analyze_gaps');
      expect(names).toContain('assessment_get_gap_report');
      expect(names).toContain('assessment_get_confidence');
      expect(names).toContain('assessment_get_human_checklist');
      expect(names).toContain('assessment_mine_processes');
      expect(names).toContain('assessment_get_process_catalog');
      expect(names).toContain('assessment_plan_migration');
    });

    it('should include all migration tools', async () => {
      const result = await server.handleMessage({ id: 1, method: 'tools/list' });
      const names = result.result.tools.map(t => t.name);
      expect(names).toContain('migration_list_objects');
      expect(names).toContain('migration_get_object');
      expect(names).toContain('migration_run_object');
      expect(names).toContain('migration_run_all');
      expect(names).toContain('migration_get_dependency_graph');
      expect(names).toContain('migration_get_execution_order');
      expect(names).toContain('migration_reconcile');
      expect(names).toContain('migration_get_stats');
    });

    it('should include all greenfield tools', async () => {
      const result = await server.handleMessage({ id: 1, method: 'tools/list' });
      const names = result.result.tools.map(t => t.name);
      expect(names).toContain('greenfield_generate_bdc');
      expect(names).toContain('greenfield_execute_bdc');
      expect(names).toContain('greenfield_list_bdc_templates');
      expect(names).toContain('greenfield_list_config_templates');
      expect(names).toContain('greenfield_get_config_template');
      expect(names).toContain('greenfield_list_bapis');
      expect(names).toContain('greenfield_get_bapi_signature');
      expect(names).toContain('greenfield_discover_enhancements');
      expect(names).toContain('greenfield_list_sm30_tables');
      expect(names).toContain('greenfield_generate_sm30');
    });

    it('should include all connection tools', async () => {
      const result = await server.handleMessage({ id: 1, method: 'tools/list' });
      const names = result.result.tools.map(t => t.name);
      expect(names).toContain('connection_test');
      expect(names).toContain('connection_status');
      expect(names).toContain('connection_setup_validate');
      expect(names).toContain('connection_check_rfc');
      expect(names).toContain('connection_check_odata');
      expect(names).toContain('connection_check_authorizations');
    });

    it('should include all cloud tools', async () => {
      const result = await server.handleMessage({ id: 1, method: 'tools/list' });
      const names = result.result.tools.map(t => t.name);
      expect(names).toContain('cloud_alm_sync_project');
      expect(names).toContain('cloud_alm_sync_task');
      expect(names).toContain('cloud_alm_push_status');
      expect(names).toContain('cloud_alm_create_issue');
      expect(names).toContain('cloud_provision_btp');
      expect(names).toContain('cloud_discover_apis');
      expect(names).toContain('cloud_get_provisioning_status');
    });

    it('should include all config tools', async () => {
      const result = await server.handleMessage({ id: 1, method: 'tools/list' });
      const names = result.result.tools.map(t => t.name);
      expect(names).toContain('config_read_source');
      expect(names).toContain('config_write_target');
      expect(names).toContain('config_safety_check');
      expect(names).toContain('config_request_approval');
      expect(names).toContain('config_get_audit_trail');
    });

    it('should still include existing SAP and Infor tools', async () => {
      const result = await server.handleMessage({ id: 1, method: 'tools/list' });
      const names = result.result.tools.map(t => t.name);
      // SAP ADT tools
      expect(names).toContain('searchObject');
      expect(names).toContain('getSource');
      expect(names).toContain('writeSource');
      expect(names).toContain('getTableStructure');
      // Infor tools
      expect(names).toContain('infor_query_bod');
      expect(names).toContain('infor_execute_m3api');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Tool Calls via handleMessage — one per domain
  // ─────────────────────────────────────────────────────────────────────────

  describe('tool calls via handleMessage', () => {
    it('should call forensic_get_system_info', async () => {
      const result = await server.handleMessage({
        id: 10, method: 'tools/call',
        params: { name: 'forensic_get_system_info', arguments: {} },
      });
      expect(result.result).toBeDefined();
      expect(result.result.content).toBeInstanceOf(Array);
      const data = JSON.parse(result.result.content[0].text);
      expect(data.systemId).toBeDefined();
      expect(data.sapVersion).toBeDefined();
    });

    it('should call assessment_get_confidence', async () => {
      const result = await server.handleMessage({
        id: 11, method: 'tools/call',
        params: { name: 'assessment_get_confidence', arguments: {} },
      });
      const data = JSON.parse(result.result.content[0].text);
      expect(data.overallConfidence).toBeGreaterThan(0);
      expect(data.breakdown).toBeDefined();
    });

    it('should call migration_list_objects', async () => {
      const result = await server.handleMessage({
        id: 12, method: 'tools/call',
        params: { name: 'migration_list_objects', arguments: {} },
      });
      const data = JSON.parse(result.result.content[0].text);
      expect(data.objects).toBeInstanceOf(Array);
      expect(data.objects.length).toBeGreaterThan(0);
    });

    it('should call greenfield_list_bdc_templates', async () => {
      const result = await server.handleMessage({
        id: 13, method: 'tools/call',
        params: { name: 'greenfield_list_bdc_templates', arguments: {} },
      });
      const data = JSON.parse(result.result.content[0].text);
      expect(data.templates).toBeInstanceOf(Array);
      expect(data.templates.length).toBeGreaterThan(0);
    });

    it('should call connection_check_rfc', async () => {
      const result = await server.handleMessage({
        id: 14, method: 'tools/call',
        params: { name: 'connection_check_rfc', arguments: {} },
      });
      const data = JSON.parse(result.result.content[0].text);
      expect(data.available).toBe(true);
    });

    it('should call cloud_discover_apis', async () => {
      const result = await server.handleMessage({
        id: 15, method: 'tools/call',
        params: { name: 'cloud_discover_apis', arguments: {} },
      });
      const data = JSON.parse(result.result.content[0].text);
      expect(data.apis).toBeInstanceOf(Array);
      expect(data.totalApis).toBeGreaterThan(0);
    });

    it('should call config_read_source', async () => {
      const result = await server.handleMessage({
        id: 16, method: 'tools/call',
        params: { name: 'config_read_source', arguments: { configType: 'company-codes' } },
      });
      const data = JSON.parse(result.result.content[0].text);
      expect(data.configType).toBe('company-codes');
      expect(data.entries).toBeInstanceOf(Array);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Backward Compatibility — existing tools still work
  // ─────────────────────────────────────────────────────────────────────────

  describe('backward compatibility', () => {
    it('should still handle searchObject', async () => {
      const result = await server.handleMessage({
        id: 20, method: 'tools/call',
        params: { name: 'searchObject', arguments: { query: 'Z_TEST*' } },
      });
      expect(result.result).toBeDefined();
      expect(result.result.content).toBeInstanceOf(Array);
    });

    it('should still handle infor_query_bod', async () => {
      const result = await server.handleMessage({
        id: 21, method: 'tools/call',
        params: { name: 'infor_query_bod', arguments: { noun: 'SyncItem' } },
      });
      expect(result.result).toBeDefined();
      const data = JSON.parse(result.result.content[0].text);
      expect(data.noun).toBe('SyncItem');
    });

    it('should return error for unknown tool', async () => {
      const result = await server.handleMessage({
        id: 22, method: 'tools/call',
        params: { name: 'totally_unknown_tool', arguments: {} },
      });
      expect(result.error).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Session Context Sharing
  // ─────────────────────────────────────────────────────────────────────────

  describe('session context', () => {
    it('should share context between handler domains', async () => {
      // Run forensic extraction
      await server.handleMessage({
        id: 30, method: 'tools/call',
        params: { name: 'forensic_run_extraction', arguments: { modules: ['FI'] } },
      });

      // Check that progress reflects the completed extraction
      const progressResult = await server.handleMessage({
        id: 31, method: 'tools/call',
        params: { name: 'forensic_get_progress', arguments: {} },
      });
      const progress = JSON.parse(progressResult.result.content[0].text);
      expect(progress.status).toBe('completed');
    });
  });
});
