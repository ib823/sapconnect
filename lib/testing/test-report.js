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
'use strict';

/**
 * Test Result Reporting
 *
 * Collects test execution results and generates reports in multiple formats:
 * JSON, Markdown, HTML, and CSV. Includes failure analysis with AI-suggested
 * fixes and report comparison for regression tracking.
 */

const Logger = require('../logger');

/** Failure category patterns for keyword-based classification */
const FAILURE_CATEGORIES = {
  authorization: ['authorization', 'auth', 'permission', 'no authority', 'not authorized', 'forbidden', 'access denied', 'role', 'profile'],
  data_missing: ['not found', 'does not exist', 'no data', 'missing', 'empty', 'null', 'undefined', 'no entry', 'not maintained'],
  config_error: ['config', 'configuration', 'customizing', 'setting', 'parameter', 'not configured', 'invalid setting', 'table entry'],
  timing: ['timeout', 'timed out', 'lock', 'locked', 'enqueue', 'deadlock', 'busy', 'wait', 'slow', 'connection'],
};

/** Suggested fixes by failure category */
const SUGGESTED_FIXES = {
  authorization: 'Check user role assignments (SU01) and authorization profiles. Run SU53 to identify missing authorization objects. Consider adding the required authorization via PFCG.',
  data_missing: 'Verify test data exists in the system. Check master data maintenance (e.g., material, vendor, customer records). Ensure dependent objects are created before running test.',
  config_error: 'Review customizing settings in SPRO. Check configuration transport has been imported to test system. Verify table entries exist for the relevant configuration tables.',
  timing: 'Check system load and background job queues (SM37). Verify no locks exist on the object (SM12). Consider increasing timeout values or retrying the operation.',
  unknown: 'Review the error message and SAP transaction logs (SLG1/ST22). Check system status via SM51. Contact basis team if system-level issues are suspected.',
};

class TestReport {
  /**
   * @param {object} [options]
   * @param {string} [options.name] - Report name
   * @param {string} [options.timestamp] - Report timestamp (ISO)
   */
  constructor(options = {}) {
    this.name = options.name || 'SAP Test Report';
    this.timestamp = options.timestamp || new Date().toISOString();
    this.results = [];
    this.log = new Logger('test-report');
  }

  /**
   * Add a test result
   * @param {object} testCase - Test case object with id, name, module, etc.
   * @param {object} outcome - { status: 'pass'|'fail'|'skip'|'error', duration: number, message?: string, details?: object }
   */
  addResult(testCase, outcome) {
    this.results.push({
      testCase: {
        id: testCase.id,
        name: testCase.name,
        module: testCase.module,
        type: testCase.type,
        priority: testCase.priority,
      },
      outcome: {
        status: outcome.status,
        duration: outcome.duration || 0,
        message: outcome.message || '',
        details: outcome.details || {},
      },
      recordedAt: new Date().toISOString(),
    });
  }

  /**
   * Get summary statistics
   * @returns {{ total: number, passed: number, failed: number, skipped: number, errors: number, duration: number, passRate: number }}
   */
  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.outcome.status === 'pass').length;
    const failed = this.results.filter(r => r.outcome.status === 'fail').length;
    const skipped = this.results.filter(r => r.outcome.status === 'skip').length;
    const errors = this.results.filter(r => r.outcome.status === 'error').length;
    const duration = this.results.reduce((sum, r) => sum + (r.outcome.duration || 0), 0);
    const denominator = total - skipped;
    const passRate = denominator > 0 ? Math.round((passed / denominator) * 10000) / 100 : 0;

    return { total, passed, failed, skipped, errors, duration, passRate };
  }

  /**
   * Get results grouped by module
   * @returns {object} - { FI: { total, passed, failed, skipped, errors }, MM: { ... }, ... }
   */
  getByModule() {
    const byModule = {};

    for (const result of this.results) {
      const mod = result.testCase.module || 'UNKNOWN';
      if (!byModule[mod]) {
        byModule[mod] = { total: 0, passed: 0, failed: 0, skipped: 0, errors: 0 };
      }
      byModule[mod].total++;
      if (result.outcome.status === 'pass') byModule[mod].passed++;
      else if (result.outcome.status === 'fail') byModule[mod].failed++;
      else if (result.outcome.status === 'skip') byModule[mod].skipped++;
      else if (result.outcome.status === 'error') byModule[mod].errors++;
    }

    return byModule;
  }

  /**
   * Analyze failures and suggest fixes
   * @returns {object[]} - Array of { testCase, category, message, suggestedFix }
   */
  getFailureAnalysis() {
    const failures = this.results.filter(r => r.outcome.status === 'fail' || r.outcome.status === 'error');

    return failures.map(result => {
      const message = (result.outcome.message || '').toLowerCase();
      let category = 'unknown';

      for (const [cat, keywords] of Object.entries(FAILURE_CATEGORIES)) {
        for (const kw of keywords) {
          if (message.includes(kw)) {
            category = cat;
            break;
          }
        }
        if (category !== 'unknown') break;
      }

      return {
        testCase: result.testCase,
        category,
        message: result.outcome.message || 'No error message provided',
        suggestedFix: SUGGESTED_FIXES[category],
      };
    });
  }

  /**
   * Export as JSON object
   * @returns {object}
   */
  toJSON() {
    return {
      name: this.name,
      timestamp: this.timestamp,
      summary: this.getSummary(),
      byModule: this.getByModule(),
      results: this.results,
      failureAnalysis: this.getFailureAnalysis(),
    };
  }

  /**
   * Export as Markdown
   * @returns {string}
   */
  toMarkdown() {
    const summary = this.getSummary();
    const byModule = this.getByModule();
    const failures = this.getFailureAnalysis();

    let md = `# ${this.name}\n\n`;
    md += `**Generated:** ${this.timestamp}\n\n`;

    // Summary table
    md += `## Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Tests | ${summary.total} |\n`;
    md += `| Passed | ${summary.passed} |\n`;
    md += `| Failed | ${summary.failed} |\n`;
    md += `| Skipped | ${summary.skipped} |\n`;
    md += `| Errors | ${summary.errors} |\n`;
    md += `| Pass Rate | ${summary.passRate}% |\n`;
    md += `| Total Duration | ${summary.duration}ms |\n\n`;

    // Module breakdown
    md += `## Results by Module\n\n`;
    md += `| Module | Total | Passed | Failed | Skipped | Errors |\n`;
    md += `|--------|-------|--------|--------|---------|--------|\n`;
    for (const [mod, stats] of Object.entries(byModule)) {
      md += `| ${mod} | ${stats.total} | ${stats.passed} | ${stats.failed} | ${stats.skipped} | ${stats.errors} |\n`;
    }
    md += `\n`;

    // Detailed results
    md += `## Detailed Results\n\n`;
    md += `| ID | Name | Module | Status | Duration |\n`;
    md += `|----|------|--------|--------|----------|\n`;
    for (const r of this.results) {
      const statusIcon = r.outcome.status === 'pass' ? 'PASS' : r.outcome.status === 'fail' ? 'FAIL' : r.outcome.status.toUpperCase();
      md += `| ${r.testCase.id} | ${r.testCase.name} | ${r.testCase.module} | ${statusIcon} | ${r.outcome.duration}ms |\n`;
    }
    md += `\n`;

    // Failures
    if (failures.length > 0) {
      md += `## Failure Analysis\n\n`;
      for (const f of failures) {
        md += `### ${f.testCase.id}: ${f.testCase.name}\n\n`;
        md += `- **Category:** ${f.category}\n`;
        md += `- **Message:** ${f.message}\n`;
        md += `- **Suggested Fix:** ${f.suggestedFix}\n\n`;
      }
    }

    return md;
  }

  /**
   * Export as HTML
   * @returns {string}
   */
  toHtml() {
    const summary = this.getSummary();
    const byModule = this.getByModule();
    const failures = this.getFailureAnalysis();

    let html = `<!DOCTYPE html>\n<html>\n<head>\n<title>${this.name}</title>\n`;
    html += `<style>\n`;
    html += `  body { font-family: Arial, sans-serif; margin: 20px; color: #333; }\n`;
    html += `  h1 { color: #1a5276; }\n`;
    html += `  h2 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 8px; }\n`;
    html += `  table { border-collapse: collapse; width: 100%; margin: 16px 0; }\n`;
    html += `  th { background-color: #2c3e50; color: white; padding: 10px; text-align: left; }\n`;
    html += `  td { padding: 8px 10px; border-bottom: 1px solid #ddd; }\n`;
    html += `  tr:nth-child(even) { background-color: #f9f9f9; }\n`;
    html += `  .pass { color: #27ae60; font-weight: bold; }\n`;
    html += `  .fail { color: #e74c3c; font-weight: bold; }\n`;
    html += `  .skip { color: #f39c12; font-weight: bold; }\n`;
    html += `  .error { color: #c0392b; font-weight: bold; }\n`;
    html += `  .summary-card { display: inline-block; padding: 16px; margin: 8px; border-radius: 8px; background: #ecf0f1; min-width: 120px; text-align: center; }\n`;
    html += `  .summary-card .value { font-size: 28px; font-weight: bold; }\n`;
    html += `  .summary-card .label { font-size: 12px; color: #7f8c8d; }\n`;
    html += `  .failure-box { background: #fdf2f2; border-left: 4px solid #e74c3c; padding: 12px; margin: 12px 0; }\n`;
    html += `</style>\n</head>\n<body>\n`;

    html += `<h1>${this.name}</h1>\n`;
    html += `<p><strong>Generated:</strong> ${this.timestamp}</p>\n`;

    // Summary cards
    html += `<h2>Summary</h2>\n`;
    html += `<div>\n`;
    html += `  <div class="summary-card"><div class="value">${summary.total}</div><div class="label">Total</div></div>\n`;
    html += `  <div class="summary-card"><div class="value pass">${summary.passed}</div><div class="label">Passed</div></div>\n`;
    html += `  <div class="summary-card"><div class="value fail">${summary.failed}</div><div class="label">Failed</div></div>\n`;
    html += `  <div class="summary-card"><div class="value skip">${summary.skipped}</div><div class="label">Skipped</div></div>\n`;
    html += `  <div class="summary-card"><div class="value">${summary.passRate}%</div><div class="label">Pass Rate</div></div>\n`;
    html += `</div>\n`;

    // Module breakdown
    html += `<h2>Results by Module</h2>\n`;
    html += `<table><tr><th>Module</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Errors</th></tr>\n`;
    for (const [mod, stats] of Object.entries(byModule)) {
      html += `<tr><td>${mod}</td><td>${stats.total}</td><td class="pass">${stats.passed}</td><td class="fail">${stats.failed}</td><td class="skip">${stats.skipped}</td><td class="error">${stats.errors}</td></tr>\n`;
    }
    html += `</table>\n`;

    // Detailed results
    html += `<h2>Detailed Results</h2>\n`;
    html += `<table><tr><th>ID</th><th>Name</th><th>Module</th><th>Status</th><th>Duration</th><th>Message</th></tr>\n`;
    for (const r of this.results) {
      const statusClass = r.outcome.status;
      html += `<tr><td>${r.testCase.id}</td><td>${r.testCase.name}</td><td>${r.testCase.module}</td><td class="${statusClass}">${r.outcome.status.toUpperCase()}</td><td>${r.outcome.duration}ms</td><td>${r.outcome.message || ''}</td></tr>\n`;
    }
    html += `</table>\n`;

    // Failures
    if (failures.length > 0) {
      html += `<h2>Failure Analysis</h2>\n`;
      for (const f of failures) {
        html += `<div class="failure-box">\n`;
        html += `  <strong>${f.testCase.id}: ${f.testCase.name}</strong><br/>\n`;
        html += `  <em>Category:</em> ${f.category}<br/>\n`;
        html += `  <em>Message:</em> ${f.message}<br/>\n`;
        html += `  <em>Suggested Fix:</em> ${f.suggestedFix}\n`;
        html += `</div>\n`;
      }
    }

    html += `</body>\n</html>`;
    return html;
  }

  /**
   * Export as CSV
   * @returns {string}
   */
  toCsv() {
    let csv = 'id,name,module,status,duration,message\n';

    for (const r of this.results) {
      const message = (r.outcome.message || '').replace(/"/g, '""');
      const name = (r.testCase.name || '').replace(/"/g, '""');
      csv += `"${r.testCase.id}","${name}","${r.testCase.module}","${r.outcome.status}",${r.outcome.duration},"${message}"\n`;
    }

    return csv;
  }

  /**
   * Compare with a previous report to identify regressions and fixes
   * @param {TestReport} previousReport
   * @returns {{ newFailures: object[], fixed: object[], regressions: object[], unchanged: object[], summary: object }}
   */
  compare(previousReport) {
    const prevMap = {};
    for (const r of previousReport.results) {
      prevMap[r.testCase.id] = r;
    }

    const currMap = {};
    for (const r of this.results) {
      currMap[r.testCase.id] = r;
    }

    const newFailures = [];
    const fixed = [];
    const regressions = [];
    const unchanged = [];

    // Check current results against previous
    for (const r of this.results) {
      const prev = prevMap[r.testCase.id];

      if (!prev) {
        // New test, only report if it failed
        if (r.outcome.status === 'fail' || r.outcome.status === 'error') {
          newFailures.push(r);
        }
        continue;
      }

      const prevPassed = prev.outcome.status === 'pass';
      const currPassed = r.outcome.status === 'pass';

      if (prevPassed && !currPassed) {
        regressions.push(r);
      } else if (!prevPassed && currPassed) {
        fixed.push(r);
      } else {
        unchanged.push(r);
      }
    }

    const prevSummary = previousReport.getSummary();
    const currSummary = this.getSummary();

    return {
      newFailures,
      fixed,
      regressions,
      unchanged,
      summary: {
        previousPassRate: prevSummary.passRate,
        currentPassRate: currSummary.passRate,
        passRateDelta: Math.round((currSummary.passRate - prevSummary.passRate) * 100) / 100,
        newFailureCount: newFailures.length,
        fixedCount: fixed.length,
        regressionCount: regressions.length,
      },
    };
  }
}

module.exports = { TestReport };
