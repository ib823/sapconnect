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
/**
 * Assessment Report Generator
 *
 * Formats the analysis results for terminal or markdown display.
 * Produces executive summary, object inventory, findings detail,
 * risk matrix, and remediation roadmap.
 */

class AssessmentReport {
  constructor(analysis, scanResult, options = {}) {
    this.analysis = analysis;
    this.scan = scanResult;
    this.clientName = options.clientName || 'SAP Client';
    this.systemId = options.systemId || 'ECC';
    this.interfaceData = options.interfaceData || null;
    this.atcData = options.atcData || null;
    this.usageData = options.usageData || null;
  }

  /**
   * Format report for terminal output
   */
  toTerminal() {
    const lines = [];
    const w = 70;
    const { summary, severityCounts, categoryCounts, findings, riskMatrix } = this.analysis;

    // Header
    lines.push('');
    lines.push('='.repeat(w));
    lines.push('  S/4HANA Migration Readiness Assessment');
    lines.push('='.repeat(w));
    lines.push(`  Client:    ${this.clientName}`);
    lines.push(`  System:    ${this.systemId}`);
    lines.push(`  Date:      ${new Date().toISOString().split('T')[0]}`);
    lines.push('='.repeat(w));
    lines.push('');

    // Executive Summary
    lines.push('-'.repeat(w));
    lines.push('  EXECUTIVE SUMMARY');
    lines.push('-'.repeat(w));
    lines.push('');
    lines.push(`  Readiness Score:   ${summary.readinessScore}% (Grade: ${summary.readinessGrade})`);
    lines.push(`  ${this._scoreBar(summary.readinessScore)}`);
    lines.push('');
    lines.push(`  Total Objects:     ${summary.totalObjects}`);
    lines.push(`  Objects Scanned:   ${summary.objectsScanned}`);
    lines.push(`  Total Findings:    ${summary.totalFindings}`);
    lines.push(`  Remediation:       ${summary.effortEstimate.level} (${summary.effortEstimate.range})`);
    lines.push(`  Rules Checked:     ${this.analysis.rulesChecked}`);
    lines.push('');

    // Severity Breakdown
    lines.push('-'.repeat(w));
    lines.push('  FINDINGS BY SEVERITY');
    lines.push('-'.repeat(w));
    lines.push('');
    lines.push(`  [!!] Critical:  ${severityCounts.critical}  ${this._bar(severityCounts.critical, summary.totalFindings)}`);
    lines.push(`  [!]  High:      ${severityCounts.high}  ${this._bar(severityCounts.high, summary.totalFindings)}`);
    lines.push(`  [~]  Medium:    ${severityCounts.medium}  ${this._bar(severityCounts.medium, summary.totalFindings)}`);
    lines.push(`  [.]  Low:       ${severityCounts.low}  ${this._bar(severityCounts.low, summary.totalFindings)}`);
    lines.push('');

    // Category Breakdown
    lines.push('-'.repeat(w));
    lines.push('  FINDINGS BY CATEGORY');
    lines.push('-'.repeat(w));
    lines.push('');
    const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    for (const [cat, count] of sortedCats) {
      lines.push(`  ${cat.padEnd(35)} ${String(count).padStart(3)}  ${this._bar(count, summary.totalFindings)}`);
    }
    lines.push('');

    // Risk Matrix
    lines.push('-'.repeat(w));
    lines.push('  RISK MATRIX');
    lines.push('-'.repeat(w));
    lines.push('');
    if (riskMatrix.critical.length > 0) {
      lines.push('  CRITICAL (must fix before migration):');
      for (const obj of riskMatrix.critical) {
        lines.push(`    - ${obj.name} (${obj.type}, ${obj.lines} lines, ${obj.findings} findings)`);
      }
      lines.push('');
    }
    if (riskMatrix.high.length > 0) {
      lines.push('  HIGH (likely breaks at runtime):');
      for (const obj of riskMatrix.high) {
        lines.push(`    - ${obj.name} (${obj.type}, ${obj.lines} lines, ${obj.findings} findings)`);
      }
      lines.push('');
    }
    if (riskMatrix.medium.length > 0) {
      lines.push('  MEDIUM (deprecated, should remediate):');
      for (const obj of riskMatrix.medium) {
        lines.push(`    - ${obj.name} (${obj.type}, ${obj.lines} lines, ${obj.findings} findings)`);
      }
      lines.push('');
    }
    if (riskMatrix.clean.length > 0) {
      lines.push(`  CLEAN (${riskMatrix.clean.length} objects with no findings)`);
      lines.push('');
    }

    // Top Findings Detail
    lines.push('-'.repeat(w));
    lines.push('  TOP FINDINGS (Critical & High)');
    lines.push('-'.repeat(w));
    lines.push('');
    const topFindings = findings.filter((f) => f.severity === 'critical' || f.severity === 'high');
    if (topFindings.length === 0) {
      lines.push('  No critical or high findings. System is well-positioned for migration.');
    } else {
      for (const f of topFindings) {
        const sevTag = f.severity === 'critical' ? '[!!]' : '[! ]';
        lines.push(`  ${sevTag} ${f.ruleId}: ${f.title}`);
        lines.push(`      Object:  ${f.object} (${f.objectType})`);
        lines.push(`      Hits:    ${f.matchCount} occurrence(s)`);
        lines.push(`      Action:  ${f.remediation}`);
        if (f.matches.length > 0 && f.matches[0].line > 0) {
          const sample = f.matches[0];
          lines.push(`      Line ${sample.line}: ${sample.content.substring(0, 60)}`);
        }
        lines.push('');
      }
    }

    // Interface Inventory (optional)
    if (this.interfaceData) {
      lines.push('-'.repeat(w));
      lines.push('  INTERFACE INVENTORY');
      lines.push('-'.repeat(w));
      lines.push('');
      const iSummary = this.interfaceData.summary;
      lines.push(`  RFC Destinations:     ${iSummary.totalRfcDestinations} (${iSummary.activeRfcDestinations} active)`);
      lines.push(`  IDoc Flows:           ${iSummary.totalIdocFlows}`);
      lines.push(`  Web Services:         ${iSummary.totalWebServices}`);
      lines.push(`  Batch Jobs:           ${iSummary.totalBatchJobs}`);
      lines.push(`  Daily IDoc Volume:    ${iSummary.estimatedDailyIdocVolume.toLocaleString()}`);
      lines.push(`  Interface Complexity: ${iSummary.interfaceComplexity}`);
      lines.push('');

      lines.push('  Top IDoc Flows by Volume:');
      const topIdocs = [...this.interfaceData.idocTypes]
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);
      for (const idoc of topIdocs) {
        lines.push(`    ${idoc.messageType.padEnd(15)} ${idoc.direction.padEnd(10)} ${String(idoc.volume).padStart(6)}/day  ${idoc.description}`);
      }
      lines.push('');
    }

    // ATC Findings (optional)
    if (this.atcData) {
      lines.push('-'.repeat(w));
      lines.push('  ATC S/4HANA READINESS CHECK');
      lines.push('-'.repeat(w));
      lines.push('');
      const aSummary = this.atcData.summary;
      lines.push(`  Check Variant:        ${aSummary.checkVariant}`);
      lines.push(`  Objects Checked:      ${aSummary.objectsChecked}`);
      lines.push(`  Objects with Findings:${String(aSummary.objectsWithFindings).padStart(2)}`);
      lines.push(`  Total Findings:       ${aSummary.totalFindings}`);
      lines.push(`    Priority 1 (Error): ${aSummary.byPriority[1]}`);
      lines.push(`    Priority 2 (Warn):  ${aSummary.byPriority[2]}`);
      lines.push(`    Priority 3 (Info):  ${aSummary.byPriority[3]}`);
      lines.push('');
    }

    // Usage Analysis (optional)
    if (this.usageData) {
      lines.push('-'.repeat(w));
      lines.push('  USAGE ANALYSIS');
      lines.push('-'.repeat(w));
      lines.push('');
      const uSummary = this.usageData.summary;
      lines.push(`  Total Objects:        ${uSummary.totalObjects}`);
      lines.push(`  Active (in use):      ${uSummary.activeObjects}`);
      lines.push(`  Low Usage:            ${uSummary.lowUsageObjects}`);
      lines.push(`  Dead Code:            ${uSummary.deadCodeObjects} (${uSummary.deadCodePercentage}%)`);
      lines.push('');
      if (this.usageData.deadCode.length > 0) {
        lines.push('  Potential Dead Code:');
        for (const dead of this.usageData.deadCode.slice(0, 10)) {
          lines.push(`    - ${dead.object}: ${dead.reason}`);
        }
        if (this.usageData.deadCode.length > 10) {
          lines.push(`    ... and ${this.usageData.deadCode.length - 10} more`);
        }
        lines.push('');
      }
    }

    // Remediation Roadmap
    lines.push('-'.repeat(w));
    lines.push('  REMEDIATION ROADMAP');
    lines.push('-'.repeat(w));
    lines.push('');
    lines.push('  Phase 1 - Critical Fixes (before migration):');
    const critFindings = findings.filter((f) => f.severity === 'critical');
    if (critFindings.length > 0) {
      const critObjects = [...new Set(critFindings.map((f) => f.object))];
      for (const obj of critObjects) {
        const objFindings = critFindings.filter((f) => f.object === obj);
        lines.push(`    ${obj}: ${objFindings.map((f) => f.title).join(', ')}`);
      }
    } else {
      lines.push('    No critical fixes required.');
    }
    lines.push('');
    lines.push('  Phase 2 - High Priority (during migration):');
    const highFindings = findings.filter((f) => f.severity === 'high');
    if (highFindings.length > 0) {
      const highObjects = [...new Set(highFindings.map((f) => f.object))];
      for (const obj of highObjects) {
        const objFindings = highFindings.filter((f) => f.object === obj);
        lines.push(`    ${obj}: ${objFindings.map((f) => f.title).join(', ')}`);
      }
    } else {
      lines.push('    No high-priority remediations.');
    }
    lines.push('');
    lines.push('  Phase 3 - Clean-up (post-migration):');
    const medLowFindings = findings.filter((f) => f.severity === 'medium' || f.severity === 'low');
    lines.push(`    ${medLowFindings.length} medium/low findings to address opportunistically.`);
    lines.push('');

    lines.push('='.repeat(w));
    lines.push(`  Assessment generated by SEN Migration Tool`);
    lines.push('='.repeat(w));

    return lines.join('\n');
  }

  /**
   * Format report for markdown output
   */
  toMarkdown() {
    const lines = [];
    const { summary, severityCounts, categoryCounts, findings, riskMatrix, objectSummary } = this.analysis;

    lines.push('# S/4HANA Migration Readiness Assessment');
    lines.push('');
    lines.push(`| Field | Value |`);
    lines.push(`| --- | --- |`);
    lines.push(`| Client | ${this.clientName} |`);
    lines.push(`| System | ${this.systemId} |`);
    lines.push(`| Date | ${new Date().toISOString().split('T')[0]} |`);
    lines.push(`| Readiness Score | **${summary.readinessScore}%** (Grade: **${summary.readinessGrade}**) |`);
    lines.push(`| Total Objects | ${summary.totalObjects} |`);
    lines.push(`| Objects Scanned | ${summary.objectsScanned} |`);
    lines.push(`| Total Findings | ${summary.totalFindings} |`);
    lines.push(`| Remediation Effort | ${summary.effortEstimate.level} (${summary.effortEstimate.range}) |`);
    lines.push(`| Rules Checked | ${this.analysis.rulesChecked} |`);
    lines.push('');

    // Severity
    lines.push('## Findings by Severity');
    lines.push('');
    lines.push('| Severity | Count |');
    lines.push('| --- | --- |');
    lines.push(`| Critical | ${severityCounts.critical} |`);
    lines.push(`| High | ${severityCounts.high} |`);
    lines.push(`| Medium | ${severityCounts.medium} |`);
    lines.push(`| Low | ${severityCounts.low} |`);
    lines.push('');

    // Category
    lines.push('## Findings by Category');
    lines.push('');
    lines.push('| Category | Count |');
    lines.push('| --- | --- |');
    const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    for (const [cat, count] of sortedCats) {
      lines.push(`| ${cat} | ${count} |`);
    }
    lines.push('');

    // Object Risk Summary
    lines.push('## Object Risk Summary');
    lines.push('');
    lines.push('| Object | Type | Lines | Findings | Max Severity |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const obj of objectSummary) {
      const sevIcon = { critical: '!!', high: '!', medium: '~', low: '.', none: '-' };
      lines.push(`| ${obj.name} | ${obj.type} | ${obj.lines} | ${obj.findingCount} | ${sevIcon[obj.maxSeverity] || '-'} ${obj.maxSeverity} |`);
    }
    lines.push('');

    // Detailed Findings
    lines.push('## Detailed Findings');
    lines.push('');
    for (const f of findings) {
      const sevEmoji = { critical: '**CRITICAL**', high: '**HIGH**', medium: 'MEDIUM', low: 'LOW' };
      lines.push(`### ${f.ruleId}: ${f.title}`);
      lines.push('');
      lines.push(`- **Severity:** ${sevEmoji[f.severity] || f.severity}`);
      lines.push(`- **Category:** ${f.category}`);
      lines.push(`- **Object:** ${f.object} (${f.objectType})`);
      lines.push(`- **Occurrences:** ${f.matchCount}`);
      lines.push(`- **Description:** ${f.description}`);
      lines.push(`- **Remediation:** ${f.remediation}`);
      lines.push('');
      if (f.matches.length > 0 && f.matches[0].line > 0) {
        lines.push('```abap');
        for (const m of f.matches.slice(0, 5)) {
          lines.push(`Line ${m.line}: ${m.content}`);
        }
        if (f.matches.length > 5) {
          lines.push(`... and ${f.matches.length - 5} more`);
        }
        lines.push('```');
        lines.push('');
      }
    }

    // Interface Inventory (optional)
    if (this.interfaceData) {
      lines.push('## Interface Inventory');
      lines.push('');
      const iSummary = this.interfaceData.summary;
      lines.push('| Metric | Value |');
      lines.push('| --- | --- |');
      lines.push(`| RFC Destinations | ${iSummary.totalRfcDestinations} (${iSummary.activeRfcDestinations} active) |`);
      lines.push(`| IDoc Flows | ${iSummary.totalIdocFlows} |`);
      lines.push(`| Web Services | ${iSummary.totalWebServices} |`);
      lines.push(`| Batch Jobs | ${iSummary.totalBatchJobs} |`);
      lines.push(`| Daily IDoc Volume | ${iSummary.estimatedDailyIdocVolume.toLocaleString()} |`);
      lines.push(`| Interface Complexity | **${iSummary.interfaceComplexity}** |`);
      lines.push('');
    }

    // ATC Findings (optional)
    if (this.atcData) {
      lines.push('## ATC S/4HANA Readiness Check');
      lines.push('');
      const aSummary = this.atcData.summary;
      lines.push(`- **Check Variant:** ${aSummary.checkVariant}`);
      lines.push(`- **Objects Checked:** ${aSummary.objectsChecked}`);
      lines.push(`- **Total Findings:** ${aSummary.totalFindings}`);
      lines.push(`- Priority 1 (Error): ${aSummary.byPriority[1]}`);
      lines.push(`- Priority 2 (Warning): ${aSummary.byPriority[2]}`);
      lines.push(`- Priority 3 (Info): ${aSummary.byPriority[3]}`);
      lines.push('');
    }

    // Usage Analysis (optional)
    if (this.usageData) {
      lines.push('## Usage Analysis');
      lines.push('');
      const uSummary = this.usageData.summary;
      lines.push('| Metric | Value |');
      lines.push('| --- | --- |');
      lines.push(`| Total Objects | ${uSummary.totalObjects} |`);
      lines.push(`| Active | ${uSummary.activeObjects} |`);
      lines.push(`| Low Usage | ${uSummary.lowUsageObjects} |`);
      lines.push(`| Dead Code | ${uSummary.deadCodeObjects} (${uSummary.deadCodePercentage}%) |`);
      lines.push('');
    }

    // Remediation Roadmap
    lines.push('## Remediation Roadmap');
    lines.push('');
    lines.push('### Phase 1 - Critical Fixes (before migration)');
    lines.push('');
    const critFindings = findings.filter((f) => f.severity === 'critical');
    if (critFindings.length > 0) {
      const critObjects = [...new Set(critFindings.map((f) => f.object))];
      for (const obj of critObjects) {
        const objFindings = critFindings.filter((f) => f.object === obj);
        lines.push(`- **${obj}**: ${objFindings.map((f) => f.title).join(', ')}`);
      }
    } else {
      lines.push('No critical fixes required.');
    }
    lines.push('');
    lines.push('### Phase 2 - High Priority (during migration)');
    lines.push('');
    const highFindings = findings.filter((f) => f.severity === 'high');
    if (highFindings.length > 0) {
      const highObjects = [...new Set(highFindings.map((f) => f.object))];
      for (const obj of highObjects) {
        const objFindings = highFindings.filter((f) => f.object === obj);
        lines.push(`- **${obj}**: ${objFindings.map((f) => f.title).join(', ')}`);
      }
    } else {
      lines.push('No high-priority remediations.');
    }
    lines.push('');
    lines.push('### Phase 3 - Clean-up (post-migration)');
    lines.push('');
    const medLowFindings = findings.filter((f) => f.severity === 'medium' || f.severity === 'low');
    lines.push(`${medLowFindings.length} medium/low findings to address opportunistically.`);
    lines.push('');

    lines.push('---');
    lines.push('*Assessment generated by SEN Migration Tool*');

    return lines.join('\n');
  }

  /**
   * Visual progress bar for terminal
   */
  _scoreBar(score) {
    const filled = Math.round(score / 5);
    const empty = 20 - filled;
    let color = '';
    if (score >= 75) color = 'GREEN';
    else if (score >= 50) color = 'YELLOW';
    else color = 'RED';
    return `  [${'#'.repeat(filled)}${'.'.repeat(empty)}] ${color}`;
  }

  /**
   * Simple bar chart for terminal
   */
  _bar(value, total) {
    if (total === 0) return '';
    const width = 20;
    const filled = Math.round((value / total) * width);
    return `[${'#'.repeat(filled)}${'.'.repeat(width - filled)}]`;
  }
}

module.exports = AssessmentReport;
