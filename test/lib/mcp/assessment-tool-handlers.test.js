/**
 * Tests for MCP Assessment Tool Handlers
 */
const { AssessmentToolHandlers } = require('../../../lib/mcp/assessment-tool-handlers');
const { ASSESSMENT_TOOL_DEFINITIONS } = require('../../../lib/mcp/assessment-tools');

describe('AssessmentToolHandlers', () => {
  let handlers;

  beforeEach(() => {
    handlers = new AssessmentToolHandlers({ mode: 'mock', sessionContext: {} });
  });

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const h = new AssessmentToolHandlers();
      expect(h.mode).toBe('mock');
    });

    it('should accept custom mode', () => {
      const h = new AssessmentToolHandlers({ mode: 'live' });
      expect(h.mode).toBe('live');
    });

    it('should have a logger', () => {
      expect(handlers.logger).toBeDefined();
    });
  });

  describe('handle', () => {
    it('should throw on unknown tool name', async () => {
      await expect(handlers.handle('assessment_unknown', {})).rejects.toThrow('Unknown assessment tool');
    });

    it('should have a handler for every tool definition', () => {
      for (const tool of ASSESSMENT_TOOL_DEFINITIONS) {
        const handlerName = `_handle_${tool.name}`;
        expect(typeof handlers[handlerName]).toBe('function');
      }
    });

    it('should handle all 7 tools without error', async () => {
      const paramSets = {
        assessment_analyze_gaps: {},
        assessment_get_gap_report: {},
        assessment_get_confidence: {},
        assessment_get_human_checklist: {},
        assessment_mine_processes: {},
        assessment_get_process_catalog: {},
        assessment_plan_migration: {},
      };

      for (const [toolName, params] of Object.entries(paramSets)) {
        const result = await handlers.handle(toolName, params);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    });
  });

  describe('assessment_analyze_gaps', () => {
    it('should return gap report with humanDecisionsRequired', async () => {
      const result = await handlers.handle('assessment_analyze_gaps', {});
      expect(result.totalGaps).toBeGreaterThan(0);
      expect(result.criticalGaps).toBeGreaterThan(0);
      expect(result.gapsByCategory).toBeDefined();
      expect(result.topGaps).toBeInstanceOf(Array);
      expect(result.humanDecisionsRequired).toBeInstanceOf(Array);
      expect(result.humanDecisionsRequired.length).toBeGreaterThan(0);
    });

    it('should cache results in session context', async () => {
      const ctx = {};
      const h = new AssessmentToolHandlers({ mode: 'mock', sessionContext: ctx });
      await h.handle('assessment_analyze_gaps', {});
      expect(ctx.lastGapReport).toBeDefined();
    });
  });

  describe('assessment_get_gap_report', () => {
    it('should return unavailable message when no gaps run', async () => {
      const result = await handlers.handle('assessment_get_gap_report', {});
      expect(result.available).toBe(false);
    });

    it('should return cached report after analyze_gaps', async () => {
      await handlers.handle('assessment_analyze_gaps', {});
      const result = await handlers.handle('assessment_get_gap_report', {});
      expect(result.totalGaps).toBeDefined();
    });
  });

  describe('assessment_get_confidence', () => {
    it('should return confidence breakdown', async () => {
      const result = await handlers.handle('assessment_get_confidence', {});
      expect(result.overallConfidence).toBeGreaterThan(0);
      expect(result.overallConfidence).toBeLessThanOrEqual(1);
      expect(result.breakdown).toBeDefined();
      expect(result.riskFactors).toBeInstanceOf(Array);
    });
  });

  describe('assessment_get_human_checklist', () => {
    it('should return checklist items', async () => {
      const result = await handlers.handle('assessment_get_human_checklist', {});
      expect(result.checklist).toBeInstanceOf(Array);
      expect(result.checklist.length).toBeGreaterThan(0);
      expect(result.checklist[0]).toHaveProperty('id');
      expect(result.checklist[0]).toHaveProperty('area');
      expect(result.checklist[0]).toHaveProperty('question');
      expect(result.checklist[0]).toHaveProperty('status');
    });
  });

  describe('assessment_mine_processes', () => {
    it('should return process variants and bottlenecks', async () => {
      const result = await handlers.handle('assessment_mine_processes', { processArea: 'order-to-cash' });
      expect(result.processArea).toBe('order-to-cash');
      expect(result.variants).toBeInstanceOf(Array);
      expect(result.bottlenecks).toBeInstanceOf(Array);
      expect(result.automationOpportunities).toBeInstanceOf(Array);
    });
  });

  describe('assessment_get_process_catalog', () => {
    it('should return process catalog with areas', async () => {
      const result = await handlers.handle('assessment_get_process_catalog', {});
      expect(result.processes).toBeInstanceOf(Array);
      expect(result.processes.length).toBeGreaterThan(0);
      expect(result.processes[0]).toHaveProperty('id');
      expect(result.processes[0]).toHaveProperty('name');
      expect(result.processes[0]).toHaveProperty('area');
    });
  });

  describe('assessment_plan_migration', () => {
    it('should return phased migration plan with humanDecisionsRequired', async () => {
      const result = await handlers.handle('assessment_plan_migration', {});
      expect(result.planId).toBeDefined();
      expect(result.phases).toBeInstanceOf(Array);
      expect(result.phases.length).toBeGreaterThan(0);
      expect(result.totalDurationWeeks).toBeGreaterThan(0);
      expect(result.risks).toBeInstanceOf(Array);
      expect(result.humanDecisionsRequired).toBeInstanceOf(Array);
      expect(result.humanDecisionsRequired.length).toBeGreaterThan(0);
    });

    it('should cache plan in session context', async () => {
      const ctx = {};
      const h = new AssessmentToolHandlers({ mode: 'mock', sessionContext: ctx });
      await h.handle('assessment_plan_migration', {});
      expect(ctx.lastMigrationPlan).toBeDefined();
    });
  });
});
