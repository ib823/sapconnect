/**
 * Report Generator
 *
 * Generates structured migration reports from dashboard data:
 * - Executive summary (pass/fail, KPIs)
 * - Object-level detail (per-object extract/transform/load stats)
 * - Data quality report (validation findings)
 * - Reconciliation report (source vs target comparison)
 * - Test coverage report (scenarios generated vs executed)
 *
 * Output formats: JSON, Markdown
 */

const Logger = require('../../lib/logger');

class ReportGenerator {
  constructor(options = {}) {
    this.logger = new Logger('report-gen', { level: options.verbose ? 'debug' : 'info' });
  }

  /**
   * Generate a full migration report from run results.
   * @param {object} runResult - { results, stats, timestamp }
   * @param {object} options - { format: 'json'|'markdown', includeDetails: true }
   * @returns {object} Report object
   */
  generate(runResult, options = {}) {
    const format = options.format || 'json';
    const includeDetails = options.includeDetails !== false;

    const report = {
      title: 'S/4HANA Migration Report',
      generatedAt: new Date().toISOString(),
      runTimestamp: runResult.timestamp || new Date().toISOString(),
      executive: this._generateExecutiveSummary(runResult),
      objects: this._generateObjectSummaries(runResult),
      dataQuality: this._generateDataQualityReport(runResult),
      kpis: this._generateKPIs(runResult),
    };

    if (includeDetails) {
      report.objectDetails = this._generateObjectDetails(runResult);
    }

    if (format === 'markdown') {
      return this.toMarkdown(report);
    }

    return report;
  }

  _generateExecutiveSummary(runResult) {
    const { stats } = runResult;
    const totalRecords = runResult.results.reduce((s, r) => {
      return s + (r.phases?.extract?.recordCount || 0);
    }, 0);

    const loadedRecords = runResult.results.reduce((s, r) => {
      return s + (r.phases?.load?.recordCount || 0);
    }, 0);

    return {
      overallStatus: stats.failed > 0 ? 'NEEDS_ATTENTION' : 'ON_TRACK',
      objectsTotal: stats.total,
      objectsCompleted: stats.completed,
      objectsFailed: stats.failed,
      totalRecordsExtracted: totalRecords,
      totalRecordsLoaded: loadedRecords,
      durationMs: stats.totalDurationMs,
      successRate: stats.total > 0
        ? Math.round((stats.completed / stats.total) * 10000) / 100
        : 0,
    };
  }

  _generateObjectSummaries(runResult) {
    return runResult.results.map(r => ({
      objectId: r.objectId,
      name: r.name,
      status: r.status,
      extractCount: r.phases?.extract?.recordCount || 0,
      transformCount: r.phases?.transform?.recordCount || 0,
      loadCount: r.phases?.load?.recordCount || 0,
      validationErrors: r.phases?.validate?.errorCount || 0,
      validationWarnings: r.phases?.validate?.warningCount || 0,
    }));
  }

  _generateObjectDetails(runResult) {
    return runResult.results.map(r => ({
      objectId: r.objectId,
      name: r.name,
      status: r.status,
      phases: r.phases,
      stats: r.stats,
    }));
  }

  _generateDataQualityReport(runResult) {
    let totalErrors = 0;
    let totalWarnings = 0;
    const objectIssues = [];

    for (const r of runResult.results) {
      const errors = r.phases?.validate?.errorCount || 0;
      const warnings = r.phases?.validate?.warningCount || 0;
      totalErrors += errors;
      totalWarnings += warnings;

      if (errors > 0 || warnings > 0) {
        objectIssues.push({
          objectId: r.objectId,
          errors,
          warnings,
          status: r.phases?.validate?.status || 'unknown',
        });
      }
    }

    return {
      totalErrors,
      totalWarnings,
      objectsWithIssues: objectIssues.length,
      issues: objectIssues,
      overallQuality: totalErrors === 0 ? 'GOOD' :
                      totalErrors <= 5 ? 'ACCEPTABLE' : 'NEEDS_REMEDIATION',
    };
  }

  _generateKPIs(runResult) {
    const results = runResult.results;
    const extractTotal = results.reduce((s, r) => s + (r.phases?.extract?.recordCount || 0), 0);
    const loadTotal = results.reduce((s, r) => s + (r.phases?.load?.recordCount || 0), 0);
    const loadSuccess = results.reduce((s, r) => s + (r.phases?.load?.successCount || r.phases?.load?.recordCount || 0), 0);

    return {
      totalMigrationObjects: results.length,
      totalRecords: extractTotal,
      loadSuccessRate: loadTotal > 0 ? Math.round((loadSuccess / loadTotal) * 10000) / 100 : 0,
      avgRecordsPerObject: results.length > 0 ? Math.round(extractTotal / results.length) : 0,
      objectsWithErrors: results.filter(r => r.status === 'error' || r.status === 'validation_failed').length,
      durationMs: runResult.stats.totalDurationMs,
    };
  }

  /**
   * Convert a report to Markdown format
   */
  toMarkdown(report) {
    const lines = [];
    const exec = report.executive;

    lines.push(`# ${report.title}`);
    lines.push(`Generated: ${report.generatedAt}`);
    lines.push('');

    // Executive summary
    lines.push('## Executive Summary');
    lines.push(`- **Status**: ${exec.overallStatus}`);
    lines.push(`- **Objects**: ${exec.objectsCompleted}/${exec.objectsTotal} completed (${exec.successRate}%)`);
    lines.push(`- **Records**: ${exec.totalRecordsExtracted} extracted, ${exec.totalRecordsLoaded} loaded`);
    lines.push(`- **Duration**: ${exec.durationMs}ms`);
    lines.push('');

    // KPIs
    lines.push('## Key Performance Indicators');
    const kpis = report.kpis;
    lines.push(`| KPI | Value |`);
    lines.push(`|-----|-------|`);
    lines.push(`| Migration Objects | ${kpis.totalMigrationObjects} |`);
    lines.push(`| Total Records | ${kpis.totalRecords} |`);
    lines.push(`| Load Success Rate | ${kpis.loadSuccessRate}% |`);
    lines.push(`| Avg Records/Object | ${kpis.avgRecordsPerObject} |`);
    lines.push(`| Objects with Errors | ${kpis.objectsWithErrors} |`);
    lines.push('');

    // Object status
    lines.push('## Migration Objects');
    lines.push('| Object | Status | Extracted | Loaded | Errors |');
    lines.push('|--------|--------|-----------|--------|--------|');
    for (const obj of report.objects) {
      lines.push(`| ${obj.objectId} | ${obj.status} | ${obj.extractCount} | ${obj.loadCount} | ${obj.validationErrors} |`);
    }
    lines.push('');

    // Data quality
    lines.push('## Data Quality');
    const dq = report.dataQuality;
    lines.push(`- **Overall**: ${dq.overallQuality}`);
    lines.push(`- **Errors**: ${dq.totalErrors}, **Warnings**: ${dq.totalWarnings}`);
    if (dq.issues.length > 0) {
      lines.push('');
      lines.push('### Issues');
      for (const issue of dq.issues) {
        lines.push(`- **${issue.objectId}**: ${issue.errors} errors, ${issue.warnings} warnings`);
      }
    }

    return lines.join('\n');
  }
}

module.exports = ReportGenerator;
