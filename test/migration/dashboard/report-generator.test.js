const ReportGenerator = require('../../../migration/dashboard/report-generator');

describe('ReportGenerator', () => {
  let gen;
  const mockRunResult = {
    timestamp: '2024-06-01T00:00:00.000Z',
    results: [
      {
        objectId: 'GL_BALANCE', name: 'GL Balance', status: 'completed',
        phases: {
          extract: { recordCount: 30, records: [] },
          transform: { recordCount: 30, records: [] },
          validate: { status: 'passed', errorCount: 0, warningCount: 0 },
          load: { recordCount: 30, successCount: 30 },
        },
        stats: { durationMs: 100 },
      },
      {
        objectId: 'BUSINESS_PARTNER', name: 'Business Partner', status: 'completed_with_errors',
        phases: {
          extract: { recordCount: 80, records: [] },
          transform: { recordCount: 75, records: [] },
          validate: { status: 'warnings', errorCount: 0, warningCount: 3 },
          load: { recordCount: 75, successCount: 74 },
        },
        stats: { durationMs: 200 },
      },
      {
        objectId: 'MATERIAL_MASTER', name: 'Material Master', status: 'completed',
        phases: {
          extract: { recordCount: 150, records: [] },
          transform: { recordCount: 150, records: [] },
          validate: { status: 'errors', errorCount: 2, warningCount: 1 },
          load: { recordCount: 148, successCount: 148 },
        },
        stats: { durationMs: 300 },
      },
    ],
    stats: { total: 3, completed: 2, failed: 1, totalDurationMs: 600 },
  };

  beforeEach(() => { gen = new ReportGenerator(); });

  // ── generate (JSON) ────────────────────────────────────────

  describe('generate', () => {
    it('returns report with all sections', () => {
      const report = gen.generate(mockRunResult);
      expect(report.title).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.executive).toBeDefined();
      expect(report.objects).toBeDefined();
      expect(report.dataQuality).toBeDefined();
      expect(report.kpis).toBeDefined();
    });

    it('includes object details by default', () => {
      const report = gen.generate(mockRunResult);
      expect(report.objectDetails).toBeDefined();
      expect(report.objectDetails).toHaveLength(3);
    });

    it('excludes details when includeDetails: false', () => {
      const report = gen.generate(mockRunResult, { includeDetails: false });
      expect(report.objectDetails).toBeUndefined();
    });
  });

  // ── Executive Summary ──────────────────────────────────────

  describe('executive summary', () => {
    it('reports correct status', () => {
      const report = gen.generate(mockRunResult);
      expect(report.executive.overallStatus).toBe('NEEDS_ATTENTION');
      expect(report.executive.objectsTotal).toBe(3);
      expect(report.executive.objectsCompleted).toBe(2);
      expect(report.executive.objectsFailed).toBe(1);
    });

    it('calculates success rate', () => {
      const report = gen.generate(mockRunResult);
      expect(report.executive.successRate).toBeCloseTo(66.67, 0);
    });

    it('reports total records', () => {
      const report = gen.generate(mockRunResult);
      expect(report.executive.totalRecordsExtracted).toBe(260);
      expect(report.executive.totalRecordsLoaded).toBe(253);
    });
  });

  // ── Object Summaries ──────────────────────────────────────

  describe('object summaries', () => {
    it('returns one entry per object', () => {
      const report = gen.generate(mockRunResult);
      expect(report.objects).toHaveLength(3);
    });

    it('each has extract/transform/load counts', () => {
      const report = gen.generate(mockRunResult);
      const gl = report.objects.find(o => o.objectId === 'GL_BALANCE');
      expect(gl.extractCount).toBe(30);
      expect(gl.transformCount).toBe(30);
      expect(gl.loadCount).toBe(30);
    });
  });

  // ── Data Quality ───────────────────────────────────────────

  describe('data quality', () => {
    it('reports total errors and warnings', () => {
      const report = gen.generate(mockRunResult);
      expect(report.dataQuality.totalErrors).toBe(2);
      expect(report.dataQuality.totalWarnings).toBe(4);
    });

    it('identifies objects with issues', () => {
      const report = gen.generate(mockRunResult);
      expect(report.dataQuality.objectsWithIssues).toBe(2);
    });

    it('classifies overall quality', () => {
      const report = gen.generate(mockRunResult);
      expect(report.dataQuality.overallQuality).toBe('ACCEPTABLE');
    });
  });

  // ── KPIs ───────────────────────────────────────────────────

  describe('KPIs', () => {
    it('calculates avg records per object', () => {
      const report = gen.generate(mockRunResult);
      expect(report.kpis.avgRecordsPerObject).toBe(87); // 260/3 rounded
    });

    it('includes total objects and duration', () => {
      const report = gen.generate(mockRunResult);
      expect(report.kpis.totalMigrationObjects).toBe(3);
      expect(report.kpis.durationMs).toBe(600);
    });
  });

  // ── Markdown output ────────────────────────────────────────

  describe('toMarkdown', () => {
    it('generates markdown string', () => {
      const md = gen.generate(mockRunResult, { format: 'markdown' });
      expect(typeof md).toBe('string');
      expect(md).toContain('# S/4HANA Migration Report');
      expect(md).toContain('## Executive Summary');
      expect(md).toContain('GL_BALANCE');
      expect(md).toContain('## Data Quality');
    });

    it('includes KPI table', () => {
      const md = gen.generate(mockRunResult, { format: 'markdown' });
      expect(md).toContain('| KPI | Value |');
      expect(md).toContain('Migration Objects');
    });
  });

  // ── Edge cases ─────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty results', () => {
      const report = gen.generate({ results: [], stats: { total: 0, completed: 0, failed: 0, totalDurationMs: 0 } });
      expect(report.executive.successRate).toBe(0);
      expect(report.objects).toHaveLength(0);
      expect(report.kpis.avgRecordsPerObject).toBe(0);
    });

    it('handles missing phases', () => {
      const report = gen.generate({
        results: [{ objectId: 'X', name: 'X', status: 'error' }],
        stats: { total: 1, completed: 0, failed: 1, totalDurationMs: 10 },
      });
      expect(report.objects[0].extractCount).toBe(0);
    });
  });
});
