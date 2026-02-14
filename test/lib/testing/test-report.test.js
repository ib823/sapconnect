/**
 * Tests for TestReport — Test Result Reporting
 */

const { TestReport } = require('../../../lib/testing');

describe('TestReport', () => {
  // ── Constructor ──────────────────────────────────────────────────────
  describe('Constructor', () => {
    it('should create with default name and timestamp', () => {
      const report = new TestReport();
      expect(report.name).toBe('SAP Test Report');
      expect(report.timestamp).toBeTruthy();
      expect(report.results).toEqual([]);
    });

    it('should accept custom options', () => {
      const report = new TestReport({ name: 'FI Regression Suite', timestamp: '2026-01-15T10:00:00Z' });
      expect(report.name).toBe('FI Regression Suite');
      expect(report.timestamp).toBe('2026-01-15T10:00:00Z');
    });
  });

  // ── addResult ────────────────────────────────────────────────────────
  describe('addResult', () => {
    it('should add a pass result', () => {
      const report = new TestReport();
      report.addResult(
        { id: 'TC-FI-001', name: 'GL Posting', module: 'FI', type: 'e2e', priority: 'critical' },
        { status: 'pass', duration: 1200 }
      );
      expect(report.results.length).toBe(1);
      expect(report.results[0].outcome.status).toBe('pass');
      expect(report.results[0].outcome.duration).toBe(1200);
    });

    it('should add a fail result with message', () => {
      const report = new TestReport();
      report.addResult(
        { id: 'TC-FI-002', name: 'Document Reversal', module: 'FI', type: 'e2e', priority: 'high' },
        { status: 'fail', duration: 800, message: 'No authorization for transaction FB08' }
      );
      expect(report.results.length).toBe(1);
      expect(report.results[0].outcome.status).toBe('fail');
      expect(report.results[0].outcome.message).toContain('authorization');
    });

    it('should add multiple results', () => {
      const report = new TestReport();
      report.addResult(
        { id: 'TC-FI-001', name: 'Test 1', module: 'FI', type: 'e2e', priority: 'critical' },
        { status: 'pass', duration: 500 }
      );
      report.addResult(
        { id: 'TC-MM-001', name: 'Test 2', module: 'MM', type: 'e2e', priority: 'high' },
        { status: 'fail', duration: 300, message: 'PO not found' }
      );
      report.addResult(
        { id: 'TC-SD-001', name: 'Test 3', module: 'SD', type: 'smoke', priority: 'medium' },
        { status: 'skip', duration: 0, message: 'Skipped due to dependency' }
      );
      expect(report.results.length).toBe(3);
    });
  });

  // ── getSummary ───────────────────────────────────────────────────────
  describe('getSummary', () => {
    let report;

    beforeEach(() => {
      report = new TestReport();
      report.addResult({ id: 'TC-1', name: 'T1', module: 'FI', type: 'e2e', priority: 'critical' }, { status: 'pass', duration: 500 });
      report.addResult({ id: 'TC-2', name: 'T2', module: 'FI', type: 'e2e', priority: 'high' }, { status: 'pass', duration: 300 });
      report.addResult({ id: 'TC-3', name: 'T3', module: 'MM', type: 'e2e', priority: 'high' }, { status: 'fail', duration: 200, message: 'Error' });
      report.addResult({ id: 'TC-4', name: 'T4', module: 'SD', type: 'smoke', priority: 'medium' }, { status: 'skip', duration: 0 });
      report.addResult({ id: 'TC-5', name: 'T5', module: 'HR', type: 'e2e', priority: 'low' }, { status: 'error', duration: 100, message: 'Timeout' });
    });

    it('should count totals correctly', () => {
      const summary = report.getSummary();
      expect(summary.total).toBe(5);
      expect(summary.passed).toBe(2);
      expect(summary.failed).toBe(1);
      expect(summary.skipped).toBe(1);
      expect(summary.errors).toBe(1);
    });

    it('should calculate pass rate excluding skipped', () => {
      const summary = report.getSummary();
      // Pass rate: 2 / (5 - 1 skipped) = 2/4 = 50%
      expect(summary.passRate).toBe(50);
    });

    it('should track total duration', () => {
      const summary = report.getSummary();
      expect(summary.duration).toBe(500 + 300 + 200 + 0 + 100);
    });

    it('should handle empty report', () => {
      const emptyReport = new TestReport();
      const summary = emptyReport.getSummary();
      expect(summary.total).toBe(0);
      expect(summary.passRate).toBe(0);
      expect(summary.duration).toBe(0);
    });
  });

  // ── getByModule ──────────────────────────────────────────────────────
  describe('getByModule', () => {
    it('should group results by module', () => {
      const report = new TestReport();
      report.addResult({ id: 'TC-1', name: 'T1', module: 'FI' }, { status: 'pass', duration: 100 });
      report.addResult({ id: 'TC-2', name: 'T2', module: 'FI' }, { status: 'fail', duration: 100 });
      report.addResult({ id: 'TC-3', name: 'T3', module: 'MM' }, { status: 'pass', duration: 100 });

      const byModule = report.getByModule();
      expect(byModule.FI.total).toBe(2);
      expect(byModule.FI.passed).toBe(1);
      expect(byModule.FI.failed).toBe(1);
      expect(byModule.MM.total).toBe(1);
      expect(byModule.MM.passed).toBe(1);
    });

    it('should handle multiple modules', () => {
      const report = new TestReport();
      report.addResult({ id: 'TC-1', name: 'T1', module: 'FI' }, { status: 'pass', duration: 100 });
      report.addResult({ id: 'TC-2', name: 'T2', module: 'MM' }, { status: 'pass', duration: 100 });
      report.addResult({ id: 'TC-3', name: 'T3', module: 'SD' }, { status: 'pass', duration: 100 });
      report.addResult({ id: 'TC-4', name: 'T4', module: 'HR' }, { status: 'fail', duration: 100 });

      const byModule = report.getByModule();
      expect(Object.keys(byModule).length).toBe(4);
    });

    it('should return empty object for empty report', () => {
      const report = new TestReport();
      const byModule = report.getByModule();
      expect(Object.keys(byModule).length).toBe(0);
    });
  });

  // ── getFailureAnalysis ───────────────────────────────────────────────
  describe('getFailureAnalysis', () => {
    it('should categorize failures by keyword analysis', () => {
      const report = new TestReport();
      report.addResult(
        { id: 'TC-1', name: 'Auth Test', module: 'FI' },
        { status: 'fail', duration: 100, message: 'No authorization for object S_TCODE' }
      );
      report.addResult(
        { id: 'TC-2', name: 'Data Test', module: 'MM' },
        { status: 'fail', duration: 100, message: 'Material not found in system' }
      );
      report.addResult(
        { id: 'TC-3', name: 'Config Test', module: 'SD' },
        { status: 'error', duration: 100, message: 'Invalid configuration setting in customizing table' }
      );

      const analysis = report.getFailureAnalysis();
      expect(analysis.length).toBe(3);
      expect(analysis[0].category).toBe('authorization');
      expect(analysis[1].category).toBe('data_missing');
      expect(analysis[2].category).toBe('config_error');
    });

    it('should provide suggested fixes for each failure', () => {
      const report = new TestReport();
      report.addResult(
        { id: 'TC-1', name: 'Timeout Test', module: 'FI' },
        { status: 'fail', duration: 30000, message: 'Connection timed out waiting for response' }
      );

      const analysis = report.getFailureAnalysis();
      expect(analysis.length).toBe(1);
      expect(analysis[0].category).toBe('timing');
      expect(analysis[0].suggestedFix).toBeTruthy();
      expect(analysis[0].suggestedFix.length).toBeGreaterThan(0);
    });

    it('should return empty array when no failures', () => {
      const report = new TestReport();
      report.addResult(
        { id: 'TC-1', name: 'Pass Test', module: 'FI' },
        { status: 'pass', duration: 100 }
      );
      const analysis = report.getFailureAnalysis();
      expect(analysis).toEqual([]);
    });
  });

  // ── toJSON ───────────────────────────────────────────────────────────
  describe('toJSON', () => {
    it('should return a valid JSON-serializable object', () => {
      const report = new TestReport({ name: 'JSON Test Report' });
      report.addResult(
        { id: 'TC-1', name: 'Test', module: 'FI', type: 'e2e', priority: 'high' },
        { status: 'pass', duration: 100 }
      );

      const json = report.toJSON();
      expect(json.name).toBe('JSON Test Report');
      expect(json.summary).toBeDefined();
      expect(json.summary.total).toBe(1);
      expect(json.byModule).toBeDefined();
      expect(json.results).toBeDefined();
      expect(json.failureAnalysis).toBeDefined();

      // Verify it serializes without error
      const serialized = JSON.stringify(json);
      expect(serialized).toBeTruthy();
      const parsed = JSON.parse(serialized);
      expect(parsed.name).toBe('JSON Test Report');
    });
  });

  // ── toMarkdown ───────────────────────────────────────────────────────
  describe('toMarkdown', () => {
    it('should return a markdown string', () => {
      const report = new TestReport({ name: 'Markdown Report' });
      report.addResult(
        { id: 'TC-FI-001', name: 'GL Post', module: 'FI', type: 'e2e', priority: 'critical' },
        { status: 'pass', duration: 500 }
      );
      report.addResult(
        { id: 'TC-MM-001', name: 'PO Create', module: 'MM', type: 'e2e', priority: 'high' },
        { status: 'fail', duration: 300, message: 'Missing vendor' }
      );

      const md = report.toMarkdown();
      expect(typeof md).toBe('string');
      expect(md).toContain('# Markdown Report');
      expect(md).toContain('TC-FI-001');
      expect(md).toContain('TC-MM-001');
    });

    it('should include summary table', () => {
      const report = new TestReport();
      report.addResult(
        { id: 'TC-1', name: 'T1', module: 'FI' },
        { status: 'pass', duration: 100 }
      );

      const md = report.toMarkdown();
      expect(md).toContain('## Summary');
      expect(md).toContain('Total Tests');
      expect(md).toContain('Pass Rate');
      expect(md).toContain('| Metric | Value |');
    });
  });

  // ── toHtml ───────────────────────────────────────────────────────────
  describe('toHtml', () => {
    it('should return valid HTML string', () => {
      const report = new TestReport({ name: 'HTML Report' });
      report.addResult(
        { id: 'TC-1', name: 'T1', module: 'FI', type: 'e2e', priority: 'critical' },
        { status: 'pass', duration: 100 }
      );

      const html = report.toHtml();
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
      expect(html).toContain('HTML Report');
    });

    it('should include style tags', () => {
      const report = new TestReport();
      report.addResult(
        { id: 'TC-1', name: 'T1', module: 'FI' },
        { status: 'fail', duration: 100, message: 'Error' }
      );

      const html = report.toHtml();
      expect(html).toContain('<style>');
      expect(html).toContain('.pass');
      expect(html).toContain('.fail');
    });
  });

  // ── toCsv ────────────────────────────────────────────────────────────
  describe('toCsv', () => {
    it('should return CSV with header row', () => {
      const report = new TestReport();
      report.addResult(
        { id: 'TC-1', name: 'Test One', module: 'FI', type: 'e2e', priority: 'critical' },
        { status: 'pass', duration: 100 }
      );

      const csv = report.toCsv();
      const lines = csv.trim().split('\n');
      expect(lines[0]).toBe('id,name,module,status,duration,message');
    });

    it('should have one data row per result', () => {
      const report = new TestReport();
      report.addResult(
        { id: 'TC-1', name: 'T1', module: 'FI' },
        { status: 'pass', duration: 100 }
      );
      report.addResult(
        { id: 'TC-2', name: 'T2', module: 'MM' },
        { status: 'fail', duration: 200, message: 'Some error' }
      );
      report.addResult(
        { id: 'TC-3', name: 'T3', module: 'SD' },
        { status: 'skip', duration: 0 }
      );

      const csv = report.toCsv();
      const lines = csv.trim().split('\n');
      expect(lines.length).toBe(4); // header + 3 data rows
      expect(lines[1]).toContain('TC-1');
      expect(lines[2]).toContain('TC-2');
      expect(lines[3]).toContain('TC-3');
    });
  });

  // ── compare ──────────────────────────────────────────────────────────
  describe('compare', () => {
    it('should identify new failures', () => {
      const previous = new TestReport();
      previous.addResult({ id: 'TC-1', name: 'T1', module: 'FI' }, { status: 'pass', duration: 100 });

      const current = new TestReport();
      current.addResult({ id: 'TC-1', name: 'T1', module: 'FI' }, { status: 'pass', duration: 100 });
      current.addResult({ id: 'TC-2', name: 'T2', module: 'MM' }, { status: 'fail', duration: 200, message: 'New error' });

      const diff = current.compare(previous);
      expect(diff.newFailures.length).toBe(1);
      expect(diff.newFailures[0].testCase.id).toBe('TC-2');
    });

    it('should identify fixed tests', () => {
      const previous = new TestReport();
      previous.addResult({ id: 'TC-1', name: 'T1', module: 'FI' }, { status: 'fail', duration: 100, message: 'Was broken' });

      const current = new TestReport();
      current.addResult({ id: 'TC-1', name: 'T1', module: 'FI' }, { status: 'pass', duration: 100 });

      const diff = current.compare(previous);
      expect(diff.fixed.length).toBe(1);
      expect(diff.fixed[0].testCase.id).toBe('TC-1');
    });

    it('should identify regressions', () => {
      const previous = new TestReport();
      previous.addResult({ id: 'TC-1', name: 'T1', module: 'FI' }, { status: 'pass', duration: 100 });
      previous.addResult({ id: 'TC-2', name: 'T2', module: 'MM' }, { status: 'pass', duration: 100 });

      const current = new TestReport();
      current.addResult({ id: 'TC-1', name: 'T1', module: 'FI' }, { status: 'pass', duration: 100 });
      current.addResult({ id: 'TC-2', name: 'T2', module: 'MM' }, { status: 'fail', duration: 200, message: 'Regression' });

      const diff = current.compare(previous);
      expect(diff.regressions.length).toBe(1);
      expect(diff.regressions[0].testCase.id).toBe('TC-2');
      expect(diff.summary.regressionCount).toBe(1);
      expect(diff.summary.passRateDelta).toBeLessThan(0);
    });
  });
});
