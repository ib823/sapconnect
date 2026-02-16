/**
 * Tests for MCP Forensic Tool Handlers
 */
const { ForensicToolHandlers } = require('../../../lib/mcp/forensic-tool-handlers');
const { FORENSIC_TOOL_DEFINITIONS } = require('../../../lib/mcp/forensic-tools');

describe('ForensicToolHandlers', () => {
  let handlers;

  beforeEach(() => {
    handlers = new ForensicToolHandlers({ mode: 'mock', sessionContext: {} });
  });

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const h = new ForensicToolHandlers();
      expect(h.mode).toBe('mock');
    });

    it('should accept custom mode', () => {
      const h = new ForensicToolHandlers({ mode: 'live' });
      expect(h.mode).toBe('live');
    });

    it('should have a logger', () => {
      expect(handlers.logger).toBeDefined();
    });
  });

  describe('handle', () => {
    it('should throw on unknown tool name', async () => {
      await expect(handlers.handle('forensic_unknown', {})).rejects.toThrow('Unknown forensic tool');
    });

    it('should have a handler for every tool definition', () => {
      for (const tool of FORENSIC_TOOL_DEFINITIONS) {
        const handlerName = `_handle_${tool.name}`;
        expect(typeof handlers[handlerName]).toBe('function');
      }
    });

    it('should handle all 7 tools without error', async () => {
      const paramSets = {
        forensic_run_extraction: { modules: ['FI', 'MM'] },
        forensic_run_module: { module: 'FI' },
        forensic_get_progress: {},
        forensic_get_system_info: {},
        forensic_get_results: {},
        forensic_get_archiving_advice: {},
        forensic_get_report: {},
      };

      for (const [toolName, params] of Object.entries(paramSets)) {
        const result = await handlers.handle(toolName, params);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    });
  });

  describe('forensic_run_extraction', () => {
    it('should return extraction summary with modules', async () => {
      const result = await handlers.handle('forensic_run_extraction', { modules: ['FI', 'SD'] });
      expect(result.status).toBe('completed');
      expect(result.extractionId).toBeDefined();
      expect(result.modulesExtracted).toContain('FI');
      expect(result.summary).toBeDefined();
      expect(result.summary.totalObjects).toBeGreaterThan(0);
    });

    it('should cache results in session context', async () => {
      const ctx = {};
      const h = new ForensicToolHandlers({ mode: 'mock', sessionContext: ctx });
      await h.handle('forensic_run_extraction', {});
      expect(ctx.lastForensicResult).toBeDefined();
    });
  });

  describe('forensic_run_module', () => {
    it('should return module-specific objects', async () => {
      const result = await handlers.handle('forensic_run_module', { module: 'FI' });
      expect(result.module).toBe('FI');
      expect(result.status).toBe('completed');
      expect(result.objects).toBeInstanceOf(Array);
      expect(result.objectsFound).toBeGreaterThan(0);
    });

    it('should handle unknown modules gracefully', async () => {
      const result = await handlers.handle('forensic_run_module', { module: 'ZZ' });
      expect(result.module).toBe('ZZ');
      expect(result.objects).toBeInstanceOf(Array);
    });
  });

  describe('forensic_get_system_info', () => {
    it('should return system details', async () => {
      const result = await handlers.handle('forensic_get_system_info', {});
      expect(result.systemId).toBeDefined();
      expect(result.sapVersion).toBeDefined();
      expect(result.databaseType).toBeDefined();
      expect(result.installedComponents).toBeInstanceOf(Array);
    });
  });

  describe('forensic_get_archiving_advice', () => {
    it('should return recommendations with humanDecisionsRequired', async () => {
      const result = await handlers.handle('forensic_get_archiving_advice', {});
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.totalEstimatedSavingsGb).toBeGreaterThan(0);
      expect(result.humanDecisionsRequired).toBeInstanceOf(Array);
      expect(result.humanDecisionsRequired.length).toBeGreaterThan(0);
    });
  });

  describe('forensic_get_report', () => {
    it('should return JSON format by default', async () => {
      const result = await handlers.handle('forensic_get_report', {});
      expect(result.format).toBe('json');
      expect(result.content).toBeDefined();
    });

    it('should return markdown when requested', async () => {
      const result = await handlers.handle('forensic_get_report', { format: 'markdown' });
      expect(result.format).toBe('markdown');
      expect(typeof result.content).toBe('string');
      expect(result.content).toContain('# Forensic Extraction Report');
    });
  });
});
