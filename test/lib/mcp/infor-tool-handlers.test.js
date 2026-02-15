/**
 * Tests for MCP Infor Tool Handlers
 */
const { InforToolHandlers } = require('../../../lib/mcp/infor-tool-handlers');
const { INFOR_TOOL_DEFINITIONS } = require('../../../lib/mcp/infor-tools');

describe('InforToolHandlers', () => {
  let handlers;

  beforeEach(() => {
    handlers = new InforToolHandlers({ mode: 'mock' });
  });

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const h = new InforToolHandlers();
      expect(h.mode).toBe('mock');
    });

    it('should accept custom mode', () => {
      const h = new InforToolHandlers({ mode: 'live' });
      expect(h.mode).toBe('live');
    });

    it('should have a logger', () => {
      expect(handlers.logger).toBeDefined();
    });
  });

  describe('handle', () => {
    it('should throw on unknown tool name', async () => {
      await expect(handlers.handle('infor_unknown_tool', {})).rejects.toThrow('Unknown Infor tool');
    });

    it('should route to the correct handler', async () => {
      const result = await handlers.handle('infor_query_bod', { noun: 'SyncItem' });
      expect(result.noun).toBe('SyncItem');
    });

    it('should handle all 15 tools without error', async () => {
      const paramSets = {
        infor_query_bod: { noun: 'SyncItem' },
        infor_execute_m3api: { program: 'CRS610MI', transaction: 'GetBasicData' },
        infor_query_datalake: { query: 'SELECT * FROM MITMAS' },
        infor_get_workflow: { workflowId: 'WF-001' },
        infor_profile_db: { tableName: 'MITMAS' },
        infor_list_connections: {},
        infor_get_bod_schema: { noun: 'SyncItem' },
        infor_list_mi_programs: {},
        infor_query_ido: { idoName: 'SLItems' },
        infor_get_customizations: {},
        infor_run_assessment: { systemType: 'M3' },
        infor_get_complexity_score: { systemType: 'M3' },
        infor_map_field: { sourceSystem: 'M3', sourceTable: 'MITMAS', sourceField: 'MMITNO' },
        infor_get_industry_gaps: { industry: 'manufacturing', sourceSystem: 'M3' },
        infor_migrate_object: { objectType: 'item', sourceSystem: 'M3' },
      };

      for (const [toolName, params] of Object.entries(paramSets)) {
        const result = await handlers.handle(toolName, params);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    });

    it('should have a handler for every tool definition', () => {
      for (const tool of INFOR_TOOL_DEFINITIONS) {
        const handlerName = `_handle_${tool.name}`;
        expect(typeof handlers[handlerName]).toBe('function');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Individual handler shape tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('_handle_infor_query_bod', () => {
    it('should return documents array with noun', async () => {
      const result = await handlers.handle('infor_query_bod', { noun: 'SyncItem', verb: 'Sync' });
      expect(result.noun).toBe('SyncItem');
      expect(result.verb).toBe('Sync');
      expect(result.documents).toBeInstanceOf(Array);
      expect(result.documents.length).toBeGreaterThan(0);
      expect(result.documents[0]).toHaveProperty('bodId');
      expect(result.documents[0]).toHaveProperty('timestamp');
      expect(result.documents[0]).toHaveProperty('dataArea');
      expect(result.totalDocuments).toBeGreaterThan(0);
    });

    it('should default verb to Sync when not provided', async () => {
      const result = await handlers.handle('infor_query_bod', { noun: 'ProcessPO' });
      expect(result.verb).toBe('Sync');
    });
  });

  describe('_handle_infor_execute_m3api', () => {
    it('should return records with program metadata', async () => {
      const result = await handlers.handle('infor_execute_m3api', {
        program: 'CRS610MI', transaction: 'GetBasicData', inputFields: { CUNO: 'CUST001' },
      });
      expect(result.program).toBe('CRS610MI');
      expect(result.transaction).toBe('GetBasicData');
      expect(result.success).toBe(true);
      expect(result.records).toBeInstanceOf(Array);
      expect(result.records.length).toBeGreaterThan(0);
      expect(result.records[0]).toHaveProperty('CUNO');
      expect(result.metadata).toHaveProperty('executionTimeMs');
    });
  });

  describe('_handle_infor_query_datalake', () => {
    it('should return rows and columns', async () => {
      const result = await handlers.handle('infor_query_datalake', {
        query: 'SELECT * FROM MITMAS', dataArea: 'M3', limit: 10,
      });
      expect(result.query).toBe('SELECT * FROM MITMAS');
      expect(result.dataArea).toBe('M3');
      expect(result.columns).toBeInstanceOf(Array);
      expect(result.rows).toBeInstanceOf(Array);
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });
  });

  describe('_handle_infor_get_workflow', () => {
    it('should return workflow with steps', async () => {
      const result = await handlers.handle('infor_get_workflow', { workflowId: 'WF_ORDER' });
      expect(result.workflowId).toBe('WF_ORDER');
      expect(result.steps).toBeInstanceOf(Array);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps[0]).toHaveProperty('stepId');
      expect(result.connectionPoints).toBeInstanceOf(Array);
    });

    it('should include history when requested', async () => {
      const result = await handlers.handle('infor_get_workflow', { workflowId: 'WF-1', includeHistory: true });
      expect(result.history).toBeInstanceOf(Array);
      expect(result.history.length).toBeGreaterThan(0);
    });

    it('should not include history by default', async () => {
      const result = await handlers.handle('infor_get_workflow', { workflowId: 'WF-1' });
      expect(result.history).toBeUndefined();
    });
  });

  describe('_handle_infor_profile_db', () => {
    it('should return table profile with columns and stats', async () => {
      const result = await handlers.handle('infor_profile_db', { tableName: 'MITMAS' });
      expect(result.tableName).toBe('MITMAS');
      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.columns).toBeInstanceOf(Array);
      expect(result.columns[0]).toHaveProperty('name');
      expect(result.columns[0]).toHaveProperty('type');
      expect(result.statistics).toBeDefined();
    });

    it('should exclude statistics when includeStats is false', async () => {
      const result = await handlers.handle('infor_profile_db', { tableName: 'MITMAS', includeStats: false });
      expect(result.statistics).toBeUndefined();
    });
  });

  describe('_handle_infor_list_connections', () => {
    it('should return connections list', async () => {
      const result = await handlers.handle('infor_list_connections', {});
      expect(result.connections).toBeInstanceOf(Array);
      expect(result.totalConnections).toBeGreaterThan(0);
      expect(result.connections[0]).toHaveProperty('id');
      expect(result.connections[0]).toHaveProperty('type');
      expect(result.connections[0]).toHaveProperty('status');
    });

    it('should filter by type', async () => {
      const result = await handlers.handle('infor_list_connections', { type: 'bod' });
      for (const conn of result.connections) {
        expect(conn.type).toBe('bod');
      }
    });

    it('should filter by status', async () => {
      const result = await handlers.handle('infor_list_connections', { status: 'active' });
      for (const conn of result.connections) {
        expect(conn.status).toBe('active');
      }
    });
  });

  describe('_handle_infor_get_bod_schema', () => {
    it('should return schema with ApplicationArea and DataArea', async () => {
      const result = await handlers.handle('infor_get_bod_schema', { noun: 'SyncItem' });
      expect(result.noun).toBe('SyncItem');
      expect(result.schema).toBeDefined();
      expect(result.schema.properties).toHaveProperty('ApplicationArea');
      expect(result.schema.properties).toHaveProperty('DataArea');
      expect(result.namespace).toContain('SyncItem');
    });
  });

  describe('_handle_infor_list_mi_programs', () => {
    it('should return programs list', async () => {
      const result = await handlers.handle('infor_list_mi_programs', {});
      expect(result.programs).toBeInstanceOf(Array);
      expect(result.totalPrograms).toBeGreaterThan(0);
      expect(result.programs[0]).toHaveProperty('program');
      expect(result.programs[0]).toHaveProperty('transactions');
    });

    it('should filter by pattern', async () => {
      const result = await handlers.handle('infor_list_mi_programs', { filter: 'CRS*' });
      for (const prog of result.programs) {
        expect(prog.program).toMatch(/^CRS/);
      }
    });

    it('should filter by category', async () => {
      const result = await handlers.handle('infor_list_mi_programs', { category: 'finance' });
      for (const prog of result.programs) {
        expect(prog.category).toBe('finance');
      }
    });
  });

  describe('_handle_infor_query_ido', () => {
    it('should return records with IDO metadata', async () => {
      const result = await handlers.handle('infor_query_ido', { idoName: 'SLItems' });
      expect(result.idoName).toBe('SLItems');
      expect(result.records).toBeInstanceOf(Array);
      expect(result.records.length).toBeGreaterThan(0);
      expect(result.totalRecords).toBeGreaterThan(0);
      expect(result.properties).toBeInstanceOf(Array);
    });
  });

  describe('_handle_infor_get_customizations', () => {
    it('should return customizations summary and items', async () => {
      const result = await handlers.handle('infor_get_customizations', {});
      expect(result.summary).toBeDefined();
      expect(result.summary.totalCustomizations).toBeGreaterThan(0);
      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should filter by scope', async () => {
      const result = await handlers.handle('infor_get_customizations', { scope: 'forms' });
      for (const item of result.items) {
        expect(item.type).toBe('form');
      }
    });
  });

  describe('_handle_infor_run_assessment', () => {
    it('should return assessment with readiness score', async () => {
      const result = await handlers.handle('infor_run_assessment', { systemType: 'M3' });
      expect(result.systemType).toBe('M3');
      expect(result.overallReadiness).toBeGreaterThan(0);
      expect(result.overallReadiness).toBeLessThanOrEqual(100);
      expect(result.modules).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.assessmentId).toBeDefined();
    });

    it('should use provided modules', async () => {
      const result = await handlers.handle('infor_run_assessment', {
        systemType: 'LN', modules: ['Finance', 'HR'],
      });
      expect(result.modules).toHaveLength(2);
      expect(result.modules[0].name).toBe('Finance');
      expect(result.modules[1].name).toBe('HR');
    });
  });

  describe('_handle_infor_get_complexity_score', () => {
    it('should return complexity score and factors', async () => {
      const result = await handlers.handle('infor_get_complexity_score', { systemType: 'M3' });
      expect(result.systemType).toBe('M3');
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.classification).toBeDefined();
      expect(result.factors).toBeDefined();
      expect(result.breakdown).toBeDefined();
    });

    it('should omit breakdown when includeBreakdown is false', async () => {
      const result = await handlers.handle('infor_get_complexity_score', {
        systemType: 'M3', includeBreakdown: false,
      });
      expect(result.breakdown).toBeUndefined();
    });
  });

  describe('_handle_infor_map_field', () => {
    it('should return field mapping with confidence', async () => {
      const result = await handlers.handle('infor_map_field', {
        sourceSystem: 'M3', sourceTable: 'MITMAS', sourceField: 'MMITNO',
      });
      expect(result.sourceSystem).toBe('M3');
      expect(result.sourceTable).toBe('MITMAS');
      expect(result.sourceField).toBe('MMITNO');
      expect(result.mapping).toBeDefined();
      expect(result.mapping.targetField).toBeDefined();
      expect(result.mapping.confidence).toBeGreaterThan(0);
      expect(result.mapping.confidence).toBeLessThanOrEqual(1);
      expect(result.alternatives).toBeInstanceOf(Array);
    });

    it('should return low confidence for unknown fields', async () => {
      const result = await handlers.handle('infor_map_field', {
        sourceSystem: 'M3', sourceTable: 'CUSTOM', sourceField: 'ZZFIELD',
      });
      expect(result.mapping.confidence).toBeLessThanOrEqual(0.50);
    });
  });

  describe('_handle_infor_get_industry_gaps', () => {
    it('should return gaps with severity', async () => {
      const result = await handlers.handle('infor_get_industry_gaps', {
        industry: 'manufacturing', sourceSystem: 'M3',
      });
      expect(result.industry).toBe('manufacturing');
      expect(result.sourceSystem).toBe('M3');
      expect(result.gaps).toBeInstanceOf(Array);
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.gaps[0]).toHaveProperty('severity');
      expect(result.gaps[0]).toHaveProperty('inforFeature');
      expect(result.gaps[0]).toHaveProperty('sapEquivalent');
      expect(result.summary).toBeDefined();
      expect(result.summary.industryFitScore).toBeGreaterThan(0);
    });
  });

  describe('_handle_infor_migrate_object', () => {
    it('should return analysis by default', async () => {
      const result = await handlers.handle('infor_migrate_object', {
        objectType: 'item', sourceSystem: 'M3',
      });
      expect(result.objectType).toBe('item');
      expect(result.sourceSystem).toBe('M3');
      expect(result.mode).toBe('analyze');
      expect(result.analysis).toBeDefined();
      expect(result.analysis.dataQuality).toBeDefined();
    });

    it('should include transform results in transform mode', async () => {
      const result = await handlers.handle('infor_migrate_object', {
        objectType: 'customer', sourceSystem: 'M3', mode: 'transform',
      });
      expect(result.transform).toBeDefined();
      expect(result.transform.sampleRecord).toBeDefined();
    });

    it('should include validation results in validate mode', async () => {
      const result = await handlers.handle('infor_migrate_object', {
        objectType: 'item', sourceSystem: 'LN', mode: 'validate',
      });
      expect(result.validation).toBeDefined();
      expect(result.validation.errors).toBeInstanceOf(Array);
    });

    it('should include all phases in full mode', async () => {
      const result = await handlers.handle('infor_migrate_object', {
        objectType: 'item', sourceSystem: 'M3', mode: 'full',
      });
      expect(result.analysis).toBeDefined();
      expect(result.transform).toBeDefined();
      expect(result.validation).toBeDefined();
    });
  });
});
