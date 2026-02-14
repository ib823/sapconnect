/**
 * Process Intelligence Engine — Unified Orchestrator
 *
 * Runs the complete process mining pipeline over an event log:
 *   1. Variant Analysis — discover all process variants, happy path, rework
 *   2. Process Discovery — mine a process model (Heuristic Miner)
 *   3. Conformance Checking — fitness & precision vs reference model
 *   4. Performance Analysis — bottlenecks, cycle times, SLA compliance
 *   5. Organizational Mining — handover, SoD, resource utilization
 *   6. KPI Calculation — 30+ KPIs with confidence intervals
 *
 * Returns a single ProcessIntelligenceReport with evidence chains linking
 * every insight back to the originating SAP table/document/field.
 */

'use strict';

const Logger = require('../../lib/logger');

const { HeuristicMiner } = require('./heuristic-miner');
const { VariantAnalyzer } = require('./variant-analyzer');
const { PerformanceAnalyzer } = require('./performance-analyzer');
const { ConformanceChecker } = require('./conformance-checker');
const { SocialNetworkMiner } = require('./social-network-miner');
const { KPIEngine } = require('./kpi-engine');
const { getReferenceModel } = require('./reference-models');
const { getProcessConfig } = require('./sap-table-config');

// ─────────────────────────────────────────────────────────────────────────────
// ProcessIntelligenceReport
// ─────────────────────────────────────────────────────────────────────────────

class ProcessIntelligenceReport {
  constructor({ processId, referenceModelName, eventLogSummary, phases, recommendations, executiveSummary, errors, duration, timestamp }) {
    this.processId = processId;
    this.referenceModelName = referenceModelName;
    this.eventLogSummary = eventLogSummary;
    this.phases = phases;
    this.recommendations = recommendations;
    this.executiveSummary = executiveSummary;
    this.errors = errors;
    this.duration = duration;
    this.timestamp = timestamp;
  }

  /**
   * Get a compact summary for dashboards.
   */
  getSummary() {
    return {
      processId: this.processId,
      referenceModel: this.referenceModelName,
      cases: this.eventLogSummary?.caseCount,
      events: this.eventLogSummary?.eventCount,
      variantCount: this.phases.variantAnalysis?.totalVariants,
      fitness: this.phases.conformance?.fitness,
      precision: this.phases.conformance?.precision,
      conformanceRate: this.phases.conformance?.conformanceRate,
      bottleneckCount: this.phases.performance?.bottlenecks?.length || 0,
      sodViolations: this.phases.socialNetwork?.sodViolations?.totalViolations || 0,
      recommendationCount: this.recommendations.length,
      highSeverityCount: this.recommendations.filter(r => r.severity === 'high').length,
      errors: this.errors.length,
      duration: this.duration,
    };
  }

  /**
   * Get only the high-severity recommendations.
   */
  getCriticalFindings() {
    return this.recommendations.filter(r => r.severity === 'high');
  }

  /**
   * Get the analysis for a specific phase.
   */
  getPhase(name) {
    return this.phases[name] || null;
  }

  /**
   * List completed phase names.
   */
  getCompletedPhases() {
    return Object.keys(this.phases);
  }

  toJSON() {
    return {
      summary: this.getSummary(),
      executiveSummary: this.executiveSummary,
      recommendations: this.recommendations,
      phases: {
        variantAnalysis: this.phases.variantAnalysis?.toJSON?.() || this.phases.variantAnalysis,
        processModel: this.phases.processModel?.toJSON?.() || this.phases.processModel,
        conformance: this.phases.conformance?.toJSON?.() || this.phases.conformance,
        performance: this.phases.performance?.toJSON?.() || this.phases.performance,
        socialNetwork: this.phases.socialNetwork?.toJSON?.() || this.phases.socialNetwork,
        kpis: this.phases.kpis?.toJSON?.() || this.phases.kpis,
      },
      errors: this.errors,
      duration: this.duration,
      timestamp: this.timestamp,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProcessIntelligenceEngine
// ─────────────────────────────────────────────────────────────────────────────

class ProcessIntelligenceEngine {
  /**
   * @param {object} [options]
   * @param {number} [options.dependencyThreshold] — Heuristic miner threshold
   * @param {number} [options.clusterThreshold] — Variant clustering threshold
   * @param {number} [options.confidenceLevel] — KPI confidence level
   * @param {Array<{activities:string[], name:string}>} [options.sodRules] — Segregation of duties rules
   * @param {string} [options.logLevel]
   */
  constructor(options = {}) {
    this.options = options;
    this.log = new Logger('process-intelligence-engine', { level: options.logLevel || 'info' });

    // Initialize all components
    this.heuristicMiner = new HeuristicMiner({
      dependencyThreshold: options.dependencyThreshold,
      logLevel: options.logLevel,
    });
    this.variantAnalyzer = new VariantAnalyzer({
      clusterThreshold: options.clusterThreshold,
      logLevel: options.logLevel,
    });
    this.performanceAnalyzer = new PerformanceAnalyzer({
      logLevel: options.logLevel,
    });
    this.conformanceChecker = new ConformanceChecker({
      logLevel: options.logLevel,
    });
    this.socialNetworkMiner = new SocialNetworkMiner({
      logLevel: options.logLevel,
    });
    this.kpiEngine = new KPIEngine({
      confidenceLevel: options.confidenceLevel,
      logLevel: options.logLevel,
    });
  }

  /**
   * Run the full process intelligence pipeline.
   *
   * @param {import('./event-log').EventLog} eventLog — The event log to analyze
   * @param {object} [options]
   * @param {string} [options.processId] — SAP process ID (e.g. 'O2C') for reference model + SLA targets
   * @param {import('./reference-models').ReferenceModel} [options.referenceModel] — Custom reference model (overrides processId)
   * @param {object} [options.slaTargets] — Custom SLA targets (overrides process config)
   * @param {Array<{activities:string[], name:string}>} [options.sodRules] — Segregation of duties rules
   * @param {string[]} [options.skip] — Analysis phases to skip (e.g. ['conformance', 'social'])
   * @param {function} [options.onProgress] — Progress callback (phase, result)
   * @returns {Promise<ProcessIntelligenceReport>}
   */
  async analyze(eventLog, options = {}) {
    const startTime = Date.now();
    const skip = new Set(options.skip || []);

    this.log.info(`Starting process intelligence analysis: ${eventLog.getCaseCount()} cases, ${eventLog.getEventCount()} events`);

    // Resolve reference model and process config
    const referenceModel = options.referenceModel || this._resolveReferenceModel(options.processId);
    const processConfig = options.processId ? getProcessConfig(options.processId) : null;
    const slaTargets = options.slaTargets || (referenceModel ? referenceModel.slaTargets : {});
    const sodRules = options.sodRules || this.options.sodRules || [];

    const phases = {};
    const errors = [];

    // Phase 1: Variant Analysis
    if (!skip.has('variants')) {
      try {
        const phaseStart = Date.now();
        phases.variantAnalysis = this.variantAnalyzer.analyze(eventLog);
        phases.variantAnalysis._duration = Date.now() - phaseStart;
        this.log.info(`Variant analysis complete: ${phases.variantAnalysis.totalVariants} variants found`);
        if (options.onProgress) options.onProgress('variants', phases.variantAnalysis);
      } catch (err) {
        this.log.error(`Variant analysis failed: ${err.message}`);
        errors.push({ phase: 'variants', error: err.message });
      }
    }

    // Phase 2: Process Discovery
    if (!skip.has('discovery')) {
      try {
        const phaseStart = Date.now();
        phases.processModel = this.heuristicMiner.mine(eventLog);
        phases.processModel._duration = Date.now() - phaseStart;
        this.log.info(`Process discovery complete: ${phases.processModel.activities.length} activities, ${phases.processModel.edges.length} edges`);
        if (options.onProgress) options.onProgress('discovery', phases.processModel);
      } catch (err) {
        this.log.error(`Process discovery failed: ${err.message}`);
        errors.push({ phase: 'discovery', error: err.message });
      }
    }

    // Phase 3: Conformance Checking
    if (!skip.has('conformance') && referenceModel) {
      try {
        const phaseStart = Date.now();
        phases.conformance = this.conformanceChecker.check(eventLog, referenceModel);
        phases.conformance._duration = Date.now() - phaseStart;
        this.log.info(`Conformance check complete: fitness=${phases.conformance.fitness}, precision=${phases.conformance.precision}`);
        if (options.onProgress) options.onProgress('conformance', phases.conformance);
      } catch (err) {
        this.log.error(`Conformance check failed: ${err.message}`);
        errors.push({ phase: 'conformance', error: err.message });
      }
    }

    // Phase 4: Performance Analysis
    if (!skip.has('performance')) {
      try {
        const phaseStart = Date.now();
        phases.performance = this.performanceAnalyzer.analyze(eventLog, slaTargets);
        phases.performance._duration = Date.now() - phaseStart;
        this.log.info(`Performance analysis complete: ${phases.performance.bottlenecks?.length || 0} bottlenecks`);
        if (options.onProgress) options.onProgress('performance', phases.performance);
      } catch (err) {
        this.log.error(`Performance analysis failed: ${err.message}`);
        errors.push({ phase: 'performance', error: err.message });
      }
    }

    // Phase 5: Social Network / Organizational Mining
    if (!skip.has('social')) {
      try {
        const phaseStart = Date.now();
        phases.socialNetwork = this.socialNetworkMiner.analyze(eventLog, { sodRules });
        phases.socialNetwork._duration = Date.now() - phaseStart;
        this.log.info(`Social network mining complete: ${phases.socialNetwork.resourceCount} resources`);
        if (options.onProgress) options.onProgress('social', phases.socialNetwork);
      } catch (err) {
        this.log.error(`Social network mining failed: ${err.message}`);
        errors.push({ phase: 'social', error: err.message });
      }
    }

    // Phase 6: KPI Calculation (depends on other phases)
    if (!skip.has('kpis')) {
      try {
        const phaseStart = Date.now();
        phases.kpis = this.kpiEngine.calculate(eventLog, {
          variantAnalysis: phases.variantAnalysis,
          performanceAnalysis: phases.performance,
          conformanceResult: phases.conformance,
          socialNetworkResult: phases.socialNetwork,
        }, processConfig || {});
        phases.kpis._duration = Date.now() - phaseStart;
        this.log.info('KPI calculation complete');
        if (options.onProgress) options.onProgress('kpis', phases.kpis);
      } catch (err) {
        this.log.error(`KPI calculation failed: ${err.message}`);
        errors.push({ phase: 'kpis', error: err.message });
      }
    }

    const totalDuration = Date.now() - startTime;
    this.log.info(`Process intelligence analysis complete in ${totalDuration}ms`);

    // Build recommendations
    const recommendations = this._generateRecommendations(phases);

    // Build executive summary
    const executiveSummary = this._buildExecutiveSummary(eventLog, phases, options.processId);

    return new ProcessIntelligenceReport({
      processId: options.processId || null,
      referenceModelName: referenceModel ? referenceModel.name : null,
      eventLogSummary: eventLog.getSummary(),
      phases,
      recommendations,
      executiveSummary,
      errors,
      duration: totalDuration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Run analysis on a specific process type with standard configuration.
   *
   * @param {import('./event-log').EventLog} eventLog
   * @param {string} processId — SAP process ID (e.g. 'O2C', 'P2P')
   * @returns {Promise<ProcessIntelligenceReport>}
   */
  async analyzeProcess(eventLog, processId) {
    return this.analyze(eventLog, { processId });
  }

  // ── Internal helpers ─────────────────────────────────────────

  _resolveReferenceModel(processId) {
    if (!processId) return null;
    try {
      return getReferenceModel(processId);
    } catch {
      this.log.warn(`No reference model found for process "${processId}"`);
      return null;
    }
  }

  /**
   * Generate actionable recommendations based on all analysis phases.
   */
  _generateRecommendations(phases) {
    const recommendations = [];

    // Variant-based recommendations
    if (phases.variantAnalysis) {
      const va = phases.variantAnalysis;
      if (va.totalVariants > 20) {
        recommendations.push({
          category: 'standardization',
          severity: va.totalVariants > 50 ? 'high' : 'medium',
          title: 'High process variation detected',
          description: `${va.totalVariants} unique variants found. The top variant covers only ${va.variants?.[0]?.frequency ? Math.round((va.variants[0].frequency / va.totalCases) * 100) : '?'}% of cases. Consider standardizing the process.`,
          evidence: `${va.totalVariants} variants across ${va.totalCases} cases`,
        });
      }

      if (va.rework && va.rework.reworkRate > 0.15) {
        recommendations.push({
          category: 'quality',
          severity: va.rework.reworkRate > 0.3 ? 'high' : 'medium',
          title: 'Significant rework detected',
          description: `${Math.round(va.rework.reworkRate * 100)}% of cases contain rework (repeated activities). Top rework activities: ${(va.rework.topReworkActivities || []).slice(0, 3).map(a => a.activity).join(', ')}.`,
          evidence: `Rework rate: ${Math.round(va.rework.reworkRate * 100)}%`,
        });
      }
    }

    // Conformance-based recommendations
    if (phases.conformance) {
      const conf = phases.conformance;
      if (conf.fitness < 0.8) {
        recommendations.push({
          category: 'compliance',
          severity: 'high',
          title: 'Low process fitness',
          description: `Process fitness is ${conf.fitness} (target: ≥0.90). ${conf.deviationStats.totalDeviations} deviations detected across ${conf.deviationStats.casesWithDeviations} cases. Top deviation type: ${Object.keys(conf.deviationStats.byType)[0] || 'none'}.`,
          evidence: `Fitness: ${conf.fitness}, Deviations: ${conf.deviationStats.totalDeviations}`,
        });
      }
      if (conf.conformanceRate < 50) {
        recommendations.push({
          category: 'compliance',
          severity: 'high',
          title: 'Majority of cases non-conformant',
          description: `Only ${conf.conformanceRate}% of cases are fully conformant with the reference model.`,
          evidence: `${conf.fullyConformantCases}/${conf.totalCases} conformant`,
        });
      }
    }

    // Performance-based recommendations
    if (phases.performance) {
      const perf = phases.performance;
      if (perf.bottlenecks && perf.bottlenecks.length > 0) {
        const top = perf.bottlenecks[0];
        recommendations.push({
          category: 'efficiency',
          severity: 'medium',
          title: 'Bottleneck identified',
          description: `Top bottleneck: "${top.from || top.activity}" → "${top.to || ''}". Median wait time: ${this._formatDuration(top.medianDuration || top.median)}. Impact score: ${top.impact}.`,
          evidence: `Bottleneck impact: ${top.impact}`,
        });
      }
      if (perf.slaCompliance) {
        const breached = (perf.slaCompliance.results || perf.slaCompliance || []).filter?.(s => s.status === 'breached');
        if (breached && breached.length > 0) {
          recommendations.push({
            category: 'sla',
            severity: 'high',
            title: 'SLA breaches detected',
            description: `${breached.length} SLA target(s) breached. Immediate attention required.`,
            evidence: breached.map(b => b.name || b.transition).join(', '),
          });
        }
      }
    }

    // Social/organizational recommendations
    if (phases.socialNetwork) {
      const sn = phases.socialNetwork;
      if (sn.sodViolations && sn.sodViolations.totalViolations > 0) {
        recommendations.push({
          category: 'compliance',
          severity: 'high',
          title: 'Segregation of duties violations',
          description: `${sn.sodViolations.totalViolations} SoD violations found across ${sn.sodViolations.rulesViolated} rules. This is an audit risk.`,
          evidence: `${sn.sodViolations.totalViolations} violations in ${sn.sodViolations.rulesViolated}/${sn.sodViolations.rulesChecked} rules`,
        });
      }
      if (sn.resourceUtilization && !sn.resourceUtilization.workloadDistribution.isBalanced) {
        recommendations.push({
          category: 'resource',
          severity: 'medium',
          title: 'Unbalanced workload distribution',
          description: `Workload coefficient of variation: ${sn.resourceUtilization.workloadDistribution.coefficientOfVariation}. Work is not evenly distributed across resources.`,
          evidence: `CV: ${sn.resourceUtilization.workloadDistribution.coefficientOfVariation}`,
        });
      }
    }

    // Sort by severity
    const severityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2));

    return recommendations;
  }

  /**
   * Build a one-page executive summary of the analysis.
   */
  _buildExecutiveSummary(eventLog, phases, processId) {
    const summary = {
      process: processId || 'Custom',
      scope: {
        cases: eventLog.getCaseCount(),
        events: eventLog.getEventCount(),
        activities: eventLog.getActivitySet().size,
        resources: eventLog.getResourceSet().size,
        timeRange: eventLog.getTimeRange(),
      },
      findings: {},
    };

    if (phases.variantAnalysis) {
      summary.findings.variants = {
        total: phases.variantAnalysis.totalVariants,
        happyPathCoverage: phases.variantAnalysis.happyPath
          ? Math.round((phases.variantAnalysis.happyPath.frequency / phases.variantAnalysis.totalCases) * 100)
          : null,
        reworkRate: phases.variantAnalysis.rework
          ? Math.round(phases.variantAnalysis.rework.reworkRate * 100)
          : null,
      };
    }

    if (phases.processModel) {
      summary.findings.discoveredModel = {
        activities: phases.processModel.activities.length,
        edges: phases.processModel.edges.length,
        loops: (phases.processModel.loopsL1?.length || 0) + (phases.processModel.loopsL2?.length || 0),
      };
    }

    if (phases.conformance) {
      summary.findings.conformance = {
        fitness: phases.conformance.fitness,
        precision: phases.conformance.precision,
        conformanceRate: phases.conformance.conformanceRate,
      };
    }

    if (phases.performance) {
      summary.findings.performance = {
        bottleneckCount: phases.performance.bottlenecks?.length || 0,
        topBottleneck: phases.performance.bottlenecks?.[0]?.from || null,
      };

      if (phases.performance.caseDurations) {
        summary.findings.performance.medianCycletime = phases.performance.caseDurations.median;
        summary.findings.performance.p90Cycletime = phases.performance.caseDurations.p90;
      }
    }

    if (phases.socialNetwork) {
      summary.findings.organization = {
        resourceCount: phases.socialNetwork.resourceCount,
        workloadBalanced: phases.socialNetwork.resourceUtilization?.workloadDistribution?.isBalanced,
        sodViolations: phases.socialNetwork.sodViolations?.totalViolations || 0,
        mostCentralResource: phases.socialNetwork.centralityMetrics?.[0]?.resource || null,
      };
    }

    if (phases.kpis) {
      summary.findings.kpiHighlights = phases.kpis.getHighlights?.() || {};
    }

    return summary;
  }

  _formatDuration(ms) {
    if (!ms && ms !== 0) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}min`;
    if (ms < 86400000) return `${(ms / 3600000).toFixed(1)}h`;
    return `${(ms / 86400000).toFixed(1)}d`;
  }
}

module.exports = { ProcessIntelligenceEngine, ProcessIntelligenceReport };
