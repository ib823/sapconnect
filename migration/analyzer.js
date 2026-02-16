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
const { checkSource, severityWeight, getAllRules } = require('./rules');
const Logger = require('../lib/logger');

/**
 * S/4HANA Compatibility Analyzer
 *
 * Applies simplification rules against scanned custom code,
 * categorizes findings by severity, calculates readiness score,
 * and estimates remediation effort.
 */
class Analyzer {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.logger = new Logger('analyzer', { level: options.logLevel || 'info' });
  }

  _log(msg) {
    this.logger.info(msg);
  }

  /**
   * Analyze scanned objects for S/4HANA compatibility
   * @param {object} scanResult - Output from Scanner.scan()
   * @returns {object} Full analysis result
   */
  analyze(scanResult) {
    this._log('Starting compatibility analysis...');

    const { objects, sources, stats: scanStats } = scanResult;
    const findings = [];
    const objectSummary = [];

    // Check each source against all rules
    for (const [objectName, sourceInfo] of Object.entries(sources)) {
      const sourceFindings = checkSource(sourceInfo.source, objectName);

      if (sourceFindings.length > 0) {
        for (const finding of sourceFindings) {
          findings.push({
            object: objectName,
            objectType: sourceInfo.type,
            ruleId: finding.rule.id,
            category: finding.rule.category,
            severity: finding.rule.severity,
            title: finding.rule.title,
            description: finding.rule.description,
            remediation: finding.rule.remediation,
            matches: finding.matches,
            matchCount: finding.matches.length,
          });
        }
      }

      objectSummary.push({
        name: objectName,
        type: sourceInfo.type,
        lines: sourceInfo.lines,
        findingCount: sourceFindings.length,
        maxSeverity: this._maxSeverity(sourceFindings),
      });
    }

    // Also check objects without source (by name pattern)
    for (const obj of objects) {
      if (!sources[obj.name]) {
        const nameFindings = checkSource('', obj.name);
        if (nameFindings.length > 0) {
          for (const finding of nameFindings) {
            findings.push({
              object: obj.name,
              objectType: obj.type,
              ruleId: finding.rule.id,
              category: finding.rule.category,
              severity: finding.rule.severity,
              title: finding.rule.title,
              description: finding.rule.description,
              remediation: finding.rule.remediation,
              matches: finding.matches,
              matchCount: finding.matches.length,
            });
          }
        }
      }
    }

    // Calculate statistics
    const severityCounts = this._countBySeverity(findings);
    const categoryCounts = this._countByCategory(findings);
    const readinessScore = this._calculateReadiness(findings, objects.length);
    const effortEstimate = this._estimateEffort(findings);
    const riskMatrix = this._buildRiskMatrix(objectSummary, findings);

    this._log(`Analysis complete: ${findings.length} findings, readiness ${readinessScore}%`);

    return {
      summary: {
        totalObjects: objects.length,
        objectsScanned: Object.keys(sources).length,
        totalFindings: findings.length,
        readinessScore,
        readinessGrade: this._readinessGrade(readinessScore),
        effortEstimate,
      },
      severityCounts,
      categoryCounts,
      findings: this._sortFindings(findings),
      objectSummary: objectSummary.sort((a, b) => {
        const sevOrder = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
        return (sevOrder[a.maxSeverity] || 4) - (sevOrder[b.maxSeverity] || 4);
      }),
      riskMatrix,
      rulesChecked: getAllRules().length,
    };
  }

  /**
   * Get highest severity from a list of findings
   */
  _maxSeverity(findings) {
    if (!findings || findings.length === 0) return 'none';
    const order = ['critical', 'high', 'medium', 'low'];
    for (const sev of order) {
      if (findings.some((f) => f.rule.severity === sev)) return sev;
    }
    return 'none';
  }

  /**
   * Count findings by severity
   */
  _countBySeverity(findings) {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const f of findings) {
      counts[f.severity] = (counts[f.severity] || 0) + 1;
    }
    return counts;
  }

  /**
   * Count findings by category
   */
  _countByCategory(findings) {
    const counts = {};
    for (const f of findings) {
      counts[f.category] = (counts[f.category] || 0) + 1;
    }
    return counts;
  }

  /**
   * Calculate readiness score (0-100)
   *
   * Score = 100 - penalty
   * Penalty based on weighted findings relative to total object count.
   * Critical findings have 10x the weight of low findings.
   */
  _calculateReadiness(findings, totalObjects) {
    if (totalObjects === 0) return 100;

    let totalPenalty = 0;
    for (const f of findings) {
      totalPenalty += severityWeight(f.severity);
    }

    // Normalize: max reasonable penalty = 5 points per object
    const maxPenalty = totalObjects * 5;
    const normalizedPenalty = Math.min(totalPenalty / maxPenalty, 1) * 100;

    return Math.max(0, Math.round(100 - normalizedPenalty));
  }

  /**
   * Convert score to letter grade
   */
  _readinessGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * Estimate remediation effort
   */
  _estimateEffort(findings) {
    const effortPerSeverity = { critical: 5, high: 3, medium: 1, low: 0.5 };
    let totalDays = 0;

    for (const f of findings) {
      totalDays += effortPerSeverity[f.severity] || 1;
    }

    if (totalDays <= 5) return { days: totalDays, level: 'Low', range: '1-5 days' };
    if (totalDays <= 20) return { days: totalDays, level: 'Medium', range: '1-4 weeks' };
    if (totalDays <= 60) return { days: totalDays, level: 'High', range: '1-3 months' };
    return { days: totalDays, level: 'Very High', range: '3+ months' };
  }

  /**
   * Build risk matrix: objects grouped by severity
   */
  _buildRiskMatrix(objectSummary, findings) {
    const matrix = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      clean: [],
    };

    for (const obj of objectSummary) {
      const objFindings = findings.filter((f) => f.object === obj.name);
      const entry = {
        name: obj.name,
        type: obj.type,
        lines: obj.lines,
        findings: objFindings.length,
      };

      if (obj.maxSeverity === 'none') {
        matrix.clean.push(entry);
      } else {
        matrix[obj.maxSeverity].push(entry);
      }
    }

    return matrix;
  }

  /**
   * Enrich analysis with interface, ATC, and usage data.
   * Adjusts readiness score based on interface complexity and ATC severity.
   */
  enrichAnalysis(analysis, { interfaceData, atcData, usageData } = {}) {
    if (interfaceData) {
      // Interface complexity penalty: High=-5, Very High=-10
      const complexityPenalty = {
        'Very High': 10,
        'High': 5,
        'Medium': 2,
        'Low': 0,
      };
      const penalty = complexityPenalty[interfaceData.summary.interfaceComplexity] || 0;
      analysis.summary.readinessScore = Math.max(0, analysis.summary.readinessScore - penalty);
      analysis.summary.readinessGrade = this._readinessGrade(analysis.summary.readinessScore);
      analysis.interfaceSummary = interfaceData.summary;
    }

    if (atcData) {
      // ATC priority 1 findings further reduce score
      const p1Count = atcData.summary.byPriority[1] || 0;
      const atcPenalty = Math.min(p1Count * 2, 15); // cap at 15
      analysis.summary.readinessScore = Math.max(0, analysis.summary.readinessScore - atcPenalty);
      analysis.summary.readinessGrade = this._readinessGrade(analysis.summary.readinessScore);
      analysis.atcSummary = atcData.summary;
    }

    if (usageData) {
      analysis.usageSummary = usageData.summary;
    }
  }

  /**
   * Sort findings: critical first, then by object name
   */
  _sortFindings(findings) {
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return findings.sort((a, b) => {
      const sevDiff = (sevOrder[a.severity] || 4) - (sevOrder[b.severity] || 4);
      if (sevDiff !== 0) return sevDiff;
      return a.object.localeCompare(b.object);
    });
  }
}

module.exports = Analyzer;
