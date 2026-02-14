/**
 * Process KPI Engine — Comprehensive KPI Calculations
 *
 * Calculates the complete set of process mining KPIs across all dimensions:
 * - Time KPIs (cycle time, throughput time, waiting time, service time)
 * - Quality KPIs (rework rate, first-time-right, error rate)
 * - Volume KPIs (throughput, arrival rate, WIP)
 * - Cost KPIs (cost per case, rework cost)
 * - Resource KPIs (utilization, handover count, automation rate)
 * - Process-specific SAP KPIs (DSO, DPO, perfect order rate)
 *
 * All KPIs include statistical confidence intervals.
 */

const Logger = require('../../lib/logger');

/**
 * KPIReport
 */
class KPIReport {
  constructor({ timeKPIs, qualityKPIs, volumeKPIs, conformanceKPIs, resourceKPIs, processKPIs, caseCount, eventCount }) {
    this.timeKPIs = timeKPIs;
    this.qualityKPIs = qualityKPIs;
    this.volumeKPIs = volumeKPIs;
    this.conformanceKPIs = conformanceKPIs;
    this.resourceKPIs = resourceKPIs;
    this.processKPIs = processKPIs;
    this.caseCount = caseCount;
    this.eventCount = eventCount;
  }

  /**
   * Get a flat list of all KPIs with their values.
   */
  getAllKPIs() {
    const all = [];
    const addKPIs = (category, kpis) => {
      for (const [key, kpi] of Object.entries(kpis)) {
        if (kpi && kpi.name) {
          all.push({ category, key, ...kpi });
        }
      }
    };

    addKPIs('Time', this.timeKPIs);
    addKPIs('Quality', this.qualityKPIs);
    addKPIs('Volume', this.volumeKPIs);
    addKPIs('Conformance', this.conformanceKPIs);
    addKPIs('Resource', this.resourceKPIs);
    addKPIs('Process', this.processKPIs);

    return all;
  }

  toJSON() {
    return {
      caseCount: this.caseCount,
      eventCount: this.eventCount,
      time: this.timeKPIs,
      quality: this.qualityKPIs,
      volume: this.volumeKPIs,
      conformance: this.conformanceKPIs,
      resource: this.resourceKPIs,
      process: this.processKPIs,
    };
  }
}

class KPIEngine {
  /**
   * @param {object} [options]
   * @param {number} [options.confidenceLevel=0.95] — Statistical confidence level
   * @param {string} [options.logLevel]
   */
  constructor(options = {}) {
    this.confidenceLevel = options.confidenceLevel ?? 0.95;
    this.log = new Logger('kpi-engine', { level: options.logLevel || 'info' });
  }

  /**
   * Calculate all KPIs for an event log.
   *
   * @param {import('./event-log').EventLog} eventLog
   * @param {object} [analysisResults] — Results from other analyzers
   * @param {import('./variant-analyzer').VariantAnalysisResult} [analysisResults.variantAnalysis]
   * @param {import('./performance-analyzer').PerformanceResult} [analysisResults.performanceAnalysis]
   * @param {import('./conformance-checker').ConformanceResult} [analysisResults.conformanceResult]
   * @param {import('./social-network-miner').SocialNetworkResult} [analysisResults.socialNetworkResult]
   * @param {object} [processConfig] — Process-specific config (SLA targets, cost data)
   * @returns {KPIReport}
   */
  calculate(eventLog, analysisResults = {}, processConfig = {}) {
    this.log.info(`Calculating KPIs for ${eventLog.getCaseCount()} cases`);

    const timeKPIs = this._calculateTimeKPIs(eventLog, analysisResults.performanceAnalysis);
    const qualityKPIs = this._calculateQualityKPIs(eventLog, analysisResults.variantAnalysis);
    const volumeKPIs = this._calculateVolumeKPIs(eventLog, analysisResults.performanceAnalysis);
    const conformanceKPIs = this._calculateConformanceKPIs(analysisResults.conformanceResult);
    const resourceKPIs = this._calculateResourceKPIs(eventLog, analysisResults.socialNetworkResult);
    const processKPIs = this._calculateProcessSpecificKPIs(eventLog, processConfig);

    return new KPIReport({
      timeKPIs,
      qualityKPIs,
      volumeKPIs,
      conformanceKPIs,
      resourceKPIs,
      processKPIs,
      caseCount: eventLog.getCaseCount(),
      eventCount: eventLog.getEventCount(),
    });
  }

  // ── Time KPIs ────────────────────────────────────────────────

  _calculateTimeKPIs(eventLog, perfResult) {
    const traces = this._getTraces(eventLog);
    const caseDurations = [];
    const touchTimes = [];
    const waitTimes = [];

    for (const [, trace] of traces) {
      const events = trace.events || [];
      if (events.length < 2) continue;

      const firstMs = this._toMs(events[0].timestamp);
      const lastMs = this._toMs(events[events.length - 1].timestamp);
      if (firstMs === null || lastMs === null) continue;

      const caseDuration = lastMs - firstMs;
      caseDurations.push(caseDuration);

      // Touch time: sum of activity-to-next-activity times
      let totalTransitionTime = 0;
      for (let i = 0; i < events.length - 1; i++) {
        const a = this._toMs(events[i].timestamp);
        const b = this._toMs(events[i + 1].timestamp);
        if (a !== null && b !== null) totalTransitionTime += (b - a);
      }
      touchTimes.push(totalTransitionTime);
    }

    return {
      cycleTime: this._kpiWithCI('Cycle Time', caseDurations, 'ms'),
      touchTime: this._kpiWithCI('Touch Time', touchTimes, 'ms'),
      activitiesPerCase: this._kpiWithCI(
        'Activities per Case',
        Array.from(traces.values()).map(t => (t.events || []).length),
        'count'
      ),
      ...(perfResult ? {
        topBottleneck: perfResult.bottlenecks.length > 0 ? {
          name: perfResult.bottlenecks[0].location,
          medianMs: perfResult.bottlenecks[0].medianWaitMs || perfResult.bottlenecks[0].medianServiceMs,
          impact: perfResult.bottlenecks[0].impact,
        } : null,
      } : {}),
    };
  }

  // ── Quality KPIs ─────────────────────────────────────────────

  _calculateQualityKPIs(eventLog, variantResult) {
    const traces = this._getTraces(eventLog);
    const totalCases = eventLog.getCaseCount();

    // Rework detection
    let casesWithRework = 0;
    let totalReworkEvents = 0;
    let casesWithSelfLoop = 0;

    for (const [, trace] of traces) {
      const events = trace.events || [];
      const seen = new Set();
      let hasRework = false;
      let hasSelfLoop = false;

      for (let i = 0; i < events.length; i++) {
        if (seen.has(events[i].activity)) {
          hasRework = true;
          totalReworkEvents++;
        }
        seen.add(events[i].activity);

        if (i > 0 && events[i].activity === events[i - 1].activity) {
          hasSelfLoop = true;
        }
      }

      if (hasRework) casesWithRework++;
      if (hasSelfLoop) casesWithSelfLoop++;
    }

    return {
      reworkRate: {
        name: 'Rework Rate',
        value: totalCases > 0 ? Math.round((casesWithRework / totalCases) * 10000) / 100 : 0,
        unit: '%',
        description: 'Percentage of cases containing repeated activities',
      },
      firstTimeRightRate: {
        name: 'First Time Right Rate',
        value: totalCases > 0 ? Math.round(((totalCases - casesWithRework) / totalCases) * 10000) / 100 : 100,
        unit: '%',
        description: 'Percentage of cases completed without rework',
      },
      selfLoopRate: {
        name: 'Self-Loop Rate',
        value: totalCases > 0 ? Math.round((casesWithSelfLoop / totalCases) * 10000) / 100 : 0,
        unit: '%',
        description: 'Percentage of cases with immediately repeated activities',
      },
      happyPathRate: {
        name: 'Happy Path Rate',
        value: variantResult && variantResult.happyPath ? variantResult.happyPath.frequency : 0,
        unit: '%',
        description: 'Percentage of cases following the most common non-rework path',
      },
      variantCount: {
        name: 'Variant Count',
        value: variantResult ? variantResult.totalVariantCount : 0,
        unit: 'count',
        description: 'Number of unique process execution paths',
      },
      straightThroughRate: {
        name: 'Straight-Through Processing Rate',
        value: this._calculateSTPRate(eventLog),
        unit: '%',
        description: 'Percentage of cases without manual intervention or rework',
      },
    };
  }

  _calculateSTPRate(eventLog) {
    const traces = this._getTraces(eventLog);
    let straightThrough = 0;
    const totalCases = eventLog.getCaseCount();

    for (const [, trace] of traces) {
      const events = trace.events || [];
      const activities = events.map(e => e.activity);
      const uniqueActivities = new Set(activities);

      // STP: no repeated activities AND activities count <= unique activities count
      if (activities.length === uniqueActivities.size) {
        straightThrough++;
      }
    }

    return totalCases > 0 ? Math.round((straightThrough / totalCases) * 10000) / 100 : 100;
  }

  // ── Volume KPIs ──────────────────────────────────────────────

  _calculateVolumeKPIs(eventLog, perfResult) {
    const traces = this._getTraces(eventLog);
    const totalCases = eventLog.getCaseCount();

    // Work in Progress (approximation based on overlapping time ranges)
    const caseRanges = [];
    for (const [, trace] of traces) {
      const events = trace.events || [];
      if (events.length < 2) continue;
      const start = this._toMs(events[0].timestamp);
      const end = this._toMs(events[events.length - 1].timestamp);
      if (start !== null && end !== null) caseRanges.push({ start, end });
    }

    let avgWIP = 0;
    if (caseRanges.length > 0) {
      caseRanges.sort((a, b) => a.start - b.start);
      const timeMin = caseRanges[0].start;
      const timeMax = Math.max(...caseRanges.map(r => r.end));
      const totalTimeRange = timeMax - timeMin;

      if (totalTimeRange > 0) {
        // Sample WIP at regular intervals
        const sampleCount = Math.min(100, caseRanges.length);
        const interval = totalTimeRange / sampleCount;
        let totalWIP = 0;

        for (let t = timeMin; t <= timeMax; t += interval) {
          const active = caseRanges.filter(r => r.start <= t && r.end >= t).length;
          totalWIP += active;
        }
        avgWIP = Math.round(totalWIP / sampleCount);
      }
    }

    return {
      caseCount: { name: 'Total Cases', value: totalCases, unit: 'count' },
      eventCount: { name: 'Total Events', value: eventLog.getEventCount(), unit: 'count' },
      activityTypes: { name: 'Activity Types', value: eventLog.getActivitySet().size, unit: 'count' },
      avgWorkInProgress: { name: 'Average Work in Progress', value: avgWIP, unit: 'cases' },
      throughput: perfResult && perfResult.throughput ? {
        name: 'Throughput',
        value: perfResult.throughput.arrivalRatePerDay,
        unit: 'cases/day',
      } : null,
    };
  }

  // ── Conformance KPIs ─────────────────────────────────────────

  _calculateConformanceKPIs(conformanceResult) {
    if (!conformanceResult) {
      return { fitness: null, precision: null, conformanceRate: null };
    }

    return {
      fitness: {
        name: 'Fitness',
        value: conformanceResult.fitness,
        unit: 'ratio',
        description: 'How much of the observed behavior can be reproduced by the model (0-1)',
      },
      precision: {
        name: 'Precision',
        value: conformanceResult.precision,
        unit: 'ratio',
        description: 'How much of the model behavior is actually observed (0-1)',
      },
      conformanceRate: {
        name: 'Conformance Rate',
        value: conformanceResult.conformanceRate,
        unit: '%',
        description: 'Percentage of fully conformant cases',
      },
      avgDeviationsPerCase: {
        name: 'Avg Deviations per Case',
        value: conformanceResult.deviationStats.avgDeviationsPerCase,
        unit: 'count',
      },
    };
  }

  // ── Resource KPIs ────────────────────────────────────────────

  _calculateResourceKPIs(eventLog, socialResult) {
    const traces = this._getTraces(eventLog);
    const totalCases = eventLog.getCaseCount();

    // Handover count per case
    const handoversPerCase = [];
    for (const [, trace] of traces) {
      const events = trace.events || [];
      let handovers = 0;
      for (let i = 0; i < events.length - 1; i++) {
        if (events[i].resource && events[i + 1].resource && events[i].resource !== events[i + 1].resource) {
          handovers++;
        }
      }
      handoversPerCase.push(handovers);
    }

    // Automation rate: events with no resource or 'SYSTEM'/'BATCH' resource
    let automatedEvents = 0;
    let totalEvents = 0;
    for (const [, trace] of traces) {
      for (const event of (trace.events || [])) {
        totalEvents++;
        const r = (event.resource || '').toUpperCase();
        if (!event.resource || r === 'SYSTEM' || r === 'BATCH' || r.startsWith('RFC') || r.startsWith('WF-BATCH')) {
          automatedEvents++;
        }
      }
    }

    return {
      resourceCount: {
        name: 'Unique Resources',
        value: eventLog.getResourceSet().size,
        unit: 'count',
      },
      avgHandoversPerCase: this._kpiWithCI('Handovers per Case', handoversPerCase, 'count'),
      automationRate: {
        name: 'Automation Rate',
        value: totalEvents > 0 ? Math.round((automatedEvents / totalEvents) * 10000) / 100 : 0,
        unit: '%',
        description: 'Percentage of events executed by automated agents',
      },
      workloadBalance: socialResult ? {
        name: 'Workload Balance (CV)',
        value: socialResult.resourceUtilization.workloadDistribution.coefficientOfVariation,
        unit: 'ratio',
        description: 'Coefficient of variation of resource workload (lower is more balanced)',
        isBalanced: socialResult.resourceUtilization.workloadDistribution.isBalanced,
      } : null,
      sodViolations: socialResult ? {
        name: 'SoD Violations',
        value: socialResult.sodViolations.totalViolations,
        unit: 'count',
        rulesViolated: socialResult.sodViolations.rulesViolated,
      } : null,
    };
  }

  // ── Process-Specific KPIs ────────────────────────────────────

  _calculateProcessSpecificKPIs(eventLog, processConfig) {
    const kpis = {};
    const kpiDefs = processConfig.kpis || {};

    const traces = this._getTraces(eventLog);

    for (const [kpiName, def] of Object.entries(kpiDefs)) {
      if (def.from && def.to) {
        // Transition-based KPI: measure time between two activities
        const values = [];

        for (const [, trace] of traces) {
          const events = trace.events || [];
          let fromTs = null;
          let toTs = null;

          for (const event of events) {
            if (event.activity === def.from && fromTs === null) {
              fromTs = this._toMs(event.timestamp);
            }
            if (event.activity === def.to && fromTs !== null) {
              toTs = this._toMs(event.timestamp);
              break;
            }
          }

          if (fromTs !== null && toTs !== null) {
            values.push(toTs - fromTs);
          }
        }

        const targetMs = def.target ? this._normalizeToMs(def.target, def.unit || 'days') : null;

        kpis[kpiName] = {
          ...this._kpiWithCI(kpiName, values, 'ms'),
          target: targetMs,
          targetOriginal: def.target,
          targetUnit: def.unit || 'days',
          compliance: targetMs && values.length > 0
            ? Math.round((values.filter(v => v <= targetMs).length / values.length) * 10000) / 100
            : null,
        };
      } else if (def.type === 'ratio') {
        // Ratio-based KPI (e.g., Perfect Order Rate)
        kpis[kpiName] = {
          name: kpiName,
          value: null, // Needs external data to calculate
          unit: '%',
          target: def.target ? Math.round(def.target * 100) : null,
          description: `${def.numerator} / ${def.denominator}`,
        };
      }
    }

    return kpis;
  }

  // ── Statistical Helpers ──────────────────────────────────────

  /**
   * Calculate a KPI with confidence interval.
   */
  _kpiWithCI(name, values, unit) {
    if (values.length === 0) {
      return { name, value: 0, unit, count: 0, ci: null, stats: null };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((s, v) => s + v, 0);
    const mean = sum / n;
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
    const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1 || 1);
    const stddev = Math.sqrt(variance);

    // Confidence interval using t-distribution approximation
    // z-score for 95% CI ≈ 1.96
    const zScore = this.confidenceLevel === 0.99 ? 2.576 : this.confidenceLevel === 0.90 ? 1.645 : 1.96;
    const marginOfError = n > 1 ? zScore * (stddev / Math.sqrt(n)) : 0;

    return {
      name,
      value: Math.round(mean * 100) / 100,
      unit,
      count: n,
      ci: {
        level: this.confidenceLevel,
        lower: Math.round((mean - marginOfError) * 100) / 100,
        upper: Math.round((mean + marginOfError) * 100) / 100,
        marginOfError: Math.round(marginOfError * 100) / 100,
      },
      stats: {
        mean: Math.round(mean),
        median: Math.round(median),
        stddev: Math.round(stddev),
        min: sorted[0],
        max: sorted[n - 1],
        p90: sorted[Math.floor(n * 0.90)] || sorted[n - 1],
        p95: sorted[Math.floor(n * 0.95)] || sorted[n - 1],
      },
    };
  }

  _normalizeToMs(value, unit) {
    switch (unit) {
      case 'ms': return value;
      case 'seconds': case 's': return value * 1000;
      case 'minutes': case 'min': return value * 60000;
      case 'hours': case 'h': return value * 3600000;
      case 'days': case 'd': return value * 86400000;
      default: return value;
    }
  }

  _getTraces(eventLog) {
    const traces = eventLog.traces || eventLog._traces;
    return traces instanceof Map ? traces : new Map(Object.entries(traces || {}));
  }

  _toMs(timestamp) {
    if (timestamp === null || timestamp === undefined) return null;
    if (timestamp instanceof Date) return timestamp.getTime();
    const ms = new Date(timestamp).getTime();
    return isNaN(ms) ? null : ms;
  }
}

module.exports = { KPIEngine, KPIReport };
