/**
 * Scoring Report Generator
 *
 * Produces structured migration complexity reports from scoring results.
 * Supports JSON and Markdown output formats for different consumers:
 * - JSON for programmatic consumption (dashboards, APIs)
 * - Markdown for human review (executive summaries, project documents)
 */

const Logger = require('../logger');
const { SapConnectError } = require('../errors');

const log = new Logger('scoring:report');

class ScoringReport {
  /**
   * Generate a comprehensive scoring report.
   *
   * @param {Object} scoreResult - Output from ComplexityScorer.score()
   * @param {Object} assessmentData - Original assessment input data
   * @param {Object} [options] - Report options
   * @param {string} [options.projectName] - Project name for report header
   * @param {string} [options.clientName] - Client name
   * @param {string} [options.assessmentDate] - Date of assessment
   * @returns {ScoringReport} Report instance with toJSON() and toMarkdown()
   */
  static generate(scoreResult, assessmentData, options = {}) {
    if (!scoreResult || typeof scoreResult.overallScore !== 'number') {
      throw new SapConnectError(
        'Valid score result is required to generate report',
        'ERR_SCORING_REPORT'
      );
    }

    log.info('Generating scoring report', {
      score: scoreResult.overallScore,
      project: options.projectName,
    });

    const report = new ScoringReport();
    report.projectName = options.projectName || 'SAP Migration Assessment';
    report.clientName = options.clientName || 'Unknown Client';
    report.assessmentDate = options.assessmentDate || new Date().toISOString().split('T')[0];
    report.overallScore = scoreResult.overallScore;
    report.complexityLevel = scoreResult.timeline.label;
    report.estimatedTimeline = scoreResult.timeline.months;
    report.dimensionBreakdown = ScoringReport._buildDimensionBreakdown(scoreResult.dimensions);
    report.riskFactors = scoreResult.riskFactors;
    report.recommendations = ScoringReport._buildRecommendations(scoreResult, assessmentData);
    report.executiveSummary = ScoringReport._buildExecutiveSummary(report);

    return report;
  }

  /**
   * Return structured JSON representation.
   */
  toJSON() {
    return {
      projectName: this.projectName,
      clientName: this.clientName,
      assessmentDate: this.assessmentDate,
      overallScore: this.overallScore,
      complexityLevel: this.complexityLevel,
      estimatedTimeline: this.estimatedTimeline,
      dimensionBreakdown: this.dimensionBreakdown,
      riskFactors: this.riskFactors,
      recommendations: this.recommendations,
      executiveSummary: this.executiveSummary,
    };
  }

  /**
   * Render report as Markdown for human consumption.
   */
  toMarkdown() {
    const lines = [];

    lines.push(`# Migration Complexity Report`);
    lines.push('');
    lines.push(`**Project:** ${this.projectName}`);
    lines.push(`**Client:** ${this.clientName}`);
    lines.push(`**Date:** ${this.assessmentDate}`);
    lines.push('');

    // Executive Summary
    lines.push('## Executive Summary');
    lines.push('');
    lines.push(this.executiveSummary);
    lines.push('');

    // Overall Score
    lines.push('## Overall Score');
    lines.push('');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Score | **${this.overallScore}/10** |`);
    lines.push(`| Complexity Level | ${this.complexityLevel} |`);
    lines.push(`| Estimated Timeline | ${this.estimatedTimeline} months |`);
    lines.push('');

    // Dimension Breakdown
    lines.push('## Dimension Breakdown');
    lines.push('');
    lines.push('| Dimension | Weight | Score | Weighted |');
    lines.push('|-----------|--------|-------|----------|');
    for (const dim of this.dimensionBreakdown) {
      lines.push(
        `| ${dim.label} | ${(dim.weight * 100).toFixed(0)}% | ${dim.rawScore}/10 | ${dim.weightedScore.toFixed(2)} |`
      );
    }
    lines.push('');

    // Risk Factors
    if (this.riskFactors.length > 0) {
      lines.push('## Risk Factors');
      lines.push('');
      for (const risk of this.riskFactors) {
        lines.push(`### ${risk.label} (Score: ${risk.score}/10)`);
        lines.push('');
        lines.push(`**Risk:** ${risk.risk}`);
        lines.push('');
        lines.push(`**Recommendation:** ${risk.recommendation}`);
        lines.push('');
      }
    }

    // Recommendations
    if (this.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      for (let i = 0; i < this.recommendations.length; i++) {
        const rec = this.recommendations[i];
        lines.push(`${i + 1}. **${rec.title}**: ${rec.description}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  // ── Private static helpers ─────────────────────────────────────────

  static _buildDimensionBreakdown(dimensions) {
    return Object.entries(dimensions).map(([key, dim]) => ({
      dimension: key,
      label: dim.label,
      weight: dim.weight,
      rawScore: dim.rawScore,
      weightedScore: dim.weightedScore,
    }));
  }

  static _buildRecommendations(scoreResult, assessmentData) {
    const recs = [];

    if (scoreResult.overallScore >= 7) {
      recs.push({
        title: 'Phased Migration Approach',
        description: 'Given the high complexity score, adopt a phased migration strategy with incremental go-lives to reduce risk.',
      });
    }

    if (scoreResult.overallScore >= 4) {
      recs.push({
        title: 'Dedicated Data Cleansing Workstream',
        description: 'Establish a dedicated team for data cleansing and validation well before cutover.',
      });
    }

    if (assessmentData.customizationCount > 200) {
      recs.push({
        title: 'Custom Code Remediation Sprint',
        description: `${assessmentData.customizationCount} custom objects detected. Run ABAP Test Cockpit (ATC) and Custom Code Migration Worklist to identify remediation needs.`,
      });
    }

    if (assessmentData.interfaceCount > 50) {
      recs.push({
        title: 'Integration Architecture Review',
        description: `${assessmentData.interfaceCount} interfaces identified. Redesign integration landscape using SAP Integration Suite (CPI).`,
      });
    }

    if (assessmentData.processVariantCount > 100) {
      recs.push({
        title: 'Process Harmonization',
        description: `${assessmentData.processVariantCount} process variants detected. Conduct fit-to-standard workshops to reduce variant count before migration.`,
      });
    }

    if (assessmentData.sodViolationCount > 20) {
      recs.push({
        title: 'Security Role Redesign',
        description: `${assessmentData.sodViolationCount} SOD violations found. Redesign authorization roles using SAP IAG before go-live.`,
      });
    }

    if (assessmentData.batchJobCount > 200) {
      recs.push({
        title: 'Batch Job Optimization',
        description: `${assessmentData.batchJobCount} batch jobs detected. Review for consolidation and migration to SAP Job Scheduling Service.`,
      });
    }

    // Always add testing recommendation
    recs.push({
      title: 'Comprehensive Test Strategy',
      description: 'Implement automated regression testing for all critical business processes with SAP Cloud ALM.',
    });

    return recs;
  }

  static _buildExecutiveSummary(report) {
    const riskCount = report.riskFactors.length;
    const riskSuffix = riskCount > 0
      ? ` ${riskCount} high-risk area${riskCount > 1 ? 's' : ''} identified requiring focused attention.`
      : ' No high-risk areas identified.';

    return (
      `This assessment evaluates the migration complexity for ${report.clientName}. ` +
      `The overall complexity score is ${report.overallScore}/10, classified as "${report.complexityLevel}". ` +
      `The estimated migration timeline is ${report.estimatedTimeline} months.` +
      riskSuffix
    );
  }
}

module.exports = ScoringReport;
