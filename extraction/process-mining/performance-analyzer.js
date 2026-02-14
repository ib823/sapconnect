/**
 * Performance Analyzer — Bottleneck Detection & Timing Analysis
 *
 * Calculates case durations, activity durations, transition times,
 * identifies bottlenecks, measures throughput, and checks SLA compliance.
 */

const Logger = require('../../lib/logger');

class PerformanceAnalyzer {
  /**
   * @param {object} [options]
   * @param {string} [options.logLevel]
   */
  constructor(options = {}) {
    this.log = new Logger('performance-analyzer', { level: options.logLevel || 'info' });
  }

  /**
   * Run full performance analysis on an event log.
   *
   * @param {import('./event-log').EventLog} eventLog
   * @param {object} [slaTargets] — { 'activity1 → activity2': { target: ms, severity: 'critical'|'warning' } }
   * @returns {PerformanceResult}
   */
  analyze(eventLog, slaTargets = {}) {
    this.log.info(`Analyzing performance for ${eventLog.getCaseCount()} cases`);

    const caseDurations = this._calculateCaseDurations(eventLog);
    const activityStats = this._calculateActivityStats(eventLog);
    const transitionStats = this._calculateTransitionStats(eventLog);
    const bottlenecks = this._detectBottlenecks(transitionStats, activityStats);
    const throughput = this._calculateThroughput(eventLog);
    const slaCompliance = this._checkSLACompliance(transitionStats, caseDurations, slaTargets);
    const trends = this._analyzeTrends(eventLog);

    return new PerformanceResult({
      caseDurations,
      activityStats,
      transitionStats,
      bottlenecks,
      throughput,
      slaCompliance,
      trends,
      caseCount: eventLog.getCaseCount(),
      eventCount: eventLog.getEventCount(),
    });
  }

  // ── Case Durations ───────────────────────────────────────────

  _calculateCaseDurations(eventLog) {
    const durations = [];
    const traces = this._getTraces(eventLog);

    for (const [caseId, trace] of traces) {
      const events = trace.events || [];
      if (events.length < 1) continue;

      const first = this._toMs(events[0].timestamp);
      const last = this._toMs(events[events.length - 1].timestamp);
      if (first === null || last === null) continue;

      durations.push({
        caseId,
        durationMs: last - first,
        startTime: events[0].timestamp,
        endTime: events[events.length - 1].timestamp,
        eventCount: events.length,
      });
    }

    const durationValues = durations.map(d => d.durationMs);
    const stats = this._computeStats(durationValues);

    return {
      cases: durations,
      stats,
      outliers: this._detectOutliers(durations, stats),
    };
  }

  // ── Activity Statistics ──────────────────────────────────────

  _calculateActivityStats(eventLog) {
    const activityTimes = new Map(); // activity → { serviceTimes[], frequencies }
    const traces = this._getTraces(eventLog);

    for (const [, trace] of traces) {
      const events = trace.events || [];
      for (let i = 0; i < events.length; i++) {
        const activity = events[i].activity;
        if (!activityTimes.has(activity)) {
          activityTimes.set(activity, { serviceTimes: [], count: 0, resources: new Set() });
        }
        const entry = activityTimes.get(activity);
        entry.count++;

        if (events[i].resource) entry.resources.add(events[i].resource);

        // Service time: time from this event to the next event in the same case
        if (i < events.length - 1) {
          const current = this._toMs(events[i].timestamp);
          const next = this._toMs(events[i + 1].timestamp);
          if (current !== null && next !== null) {
            entry.serviceTimes.push(next - current);
          }
        }
      }
    }

    const result = {};
    for (const [activity, data] of activityTimes) {
      result[activity] = {
        count: data.count,
        resourceCount: data.resources.size,
        serviceTimeStats: this._computeStats(data.serviceTimes),
      };
    }

    return result;
  }

  // ── Transition Statistics ────────────────────────────────────

  _calculateTransitionStats(eventLog) {
    const transitions = new Map(); // 'A → B' → { waitTimes[], count }
    const traces = this._getTraces(eventLog);

    for (const [, trace] of traces) {
      const events = trace.events || [];
      for (let i = 0; i < events.length - 1; i++) {
        const from = events[i].activity;
        const to = events[i + 1].activity;
        const key = `${from} → ${to}`;

        if (!transitions.has(key)) {
          transitions.set(key, { from, to, waitTimes: [], count: 0 });
        }

        const entry = transitions.get(key);
        entry.count++;

        const fromTs = this._toMs(events[i].timestamp);
        const toTs = this._toMs(events[i + 1].timestamp);
        if (fromTs !== null && toTs !== null) {
          entry.waitTimes.push(toTs - fromTs);
        }
      }
    }

    const result = {};
    for (const [key, data] of transitions) {
      result[key] = {
        from: data.from,
        to: data.to,
        count: data.count,
        waitTimeStats: this._computeStats(data.waitTimes),
      };
    }

    return result;
  }

  // ── Bottleneck Detection ─────────────────────────────────────

  /**
   * Identify bottlenecks: transitions or activities with the highest average wait/service times.
   */
  _detectBottlenecks(transitionStats, activityStats) {
    const bottlenecks = [];

    // Transition bottlenecks (longest average wait between activities)
    const transitionEntries = Object.entries(transitionStats)
      .filter(([, s]) => s.waitTimeStats.count > 0)
      .sort((a, b) => b[1].waitTimeStats.median - a[1].waitTimeStats.median);

    for (const [key, stats] of transitionEntries.slice(0, 10)) {
      bottlenecks.push({
        type: 'transition',
        location: key,
        from: stats.from,
        to: stats.to,
        medianWaitMs: stats.waitTimeStats.median,
        meanWaitMs: stats.waitTimeStats.mean,
        p90WaitMs: stats.waitTimeStats.p90,
        frequency: stats.count,
        impact: stats.waitTimeStats.median * stats.count, // total time wasted
      });
    }

    // Activity bottlenecks (longest average service time)
    const activityEntries = Object.entries(activityStats)
      .filter(([, s]) => s.serviceTimeStats.count > 0)
      .sort((a, b) => b[1].serviceTimeStats.median - a[1].serviceTimeStats.median);

    for (const [activity, stats] of activityEntries.slice(0, 10)) {
      bottlenecks.push({
        type: 'activity',
        location: activity,
        medianServiceMs: stats.serviceTimeStats.median,
        meanServiceMs: stats.serviceTimeStats.mean,
        p90ServiceMs: stats.serviceTimeStats.p90,
        frequency: stats.count,
        impact: stats.serviceTimeStats.median * stats.count,
      });
    }

    // Sort by total impact (time × frequency)
    bottlenecks.sort((a, b) => b.impact - a.impact);

    return bottlenecks;
  }

  // ── Throughput ───────────────────────────────────────────────

  _calculateThroughput(eventLog) {
    const traces = this._getTraces(eventLog);
    const caseStarts = [];

    for (const [, trace] of traces) {
      const events = trace.events || [];
      if (events.length > 0) {
        const ts = this._toMs(events[0].timestamp);
        if (ts !== null) caseStarts.push(ts);
      }
    }

    if (caseStarts.length < 2) {
      return { casesPerDay: 0, casesPerWeek: 0, casesPerMonth: 0, totalCases: caseStarts.length, timeRangeMs: 0, arrivalRatePerDay: 0 };
    }

    caseStarts.sort((a, b) => a - b);
    const timeRangeMs = caseStarts[caseStarts.length - 1] - caseStarts[0];
    const timeRangeDays = timeRangeMs / (1000 * 60 * 60 * 24);

    // Count by period
    const byDay = new Map();
    const byWeek = new Map();
    const byMonth = new Map();

    for (const ts of caseStarts) {
      const d = new Date(ts);
      const dayKey = d.toISOString().slice(0, 10);
      const weekKey = `${d.getFullYear()}-W${String(Math.ceil(d.getDate() / 7)).padStart(2, '0')}`;
      const monthKey = d.toISOString().slice(0, 7);

      byDay.set(dayKey, (byDay.get(dayKey) || 0) + 1);
      byWeek.set(weekKey, (byWeek.get(weekKey) || 0) + 1);
      byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + 1);
    }

    const dailyValues = Array.from(byDay.values());
    const weeklyValues = Array.from(byWeek.values());
    const monthlyValues = Array.from(byMonth.values());

    return {
      totalCases: caseStarts.length,
      timeRangeMs,
      timeRangeDays: Math.round(timeRangeDays),
      casesPerDay: this._computeStats(dailyValues),
      casesPerWeek: this._computeStats(weeklyValues),
      casesPerMonth: this._computeStats(monthlyValues),
      arrivalRatePerDay: timeRangeDays > 0 ? Math.round((caseStarts.length / timeRangeDays) * 100) / 100 : 0,
    };
  }

  // ── SLA Compliance ───────────────────────────────────────────

  _checkSLACompliance(transitionStats, caseDurations, slaTargets) {
    const results = [];

    for (const [key, target] of Object.entries(slaTargets)) {
      const transition = transitionStats[key];
      if (!transition) {
        results.push({
          sla: key,
          target: target.target,
          targetUnit: target.unit || 'ms',
          severity: target.severity || 'warning',
          status: 'no_data',
          measured: null,
          complianceRate: null,
        });
        continue;
      }

      const targetMs = this._normalizeToMs(target.target, target.unit);
      const breaches = transition.waitTimeStats.count > 0
        ? transition.waitTimes
          ? transition.waitTimes.filter(t => t > targetMs).length
          : 0
        : 0;

      // Estimate from stats if raw data unavailable
      const totalTransitions = transition.count;
      const complianceRate = totalTransitions > 0
        ? Math.round(((totalTransitions - breaches) / totalTransitions) * 10000) / 100
        : 100;

      results.push({
        sla: key,
        target: target.target,
        targetMs,
        targetUnit: target.unit || 'ms',
        severity: target.severity || 'warning',
        status: complianceRate >= 95 ? 'met' : complianceRate >= 80 ? 'at_risk' : 'breached',
        measured: {
          mean: transition.waitTimeStats.mean,
          median: transition.waitTimeStats.median,
          p90: transition.waitTimeStats.p90,
        },
        complianceRate,
        breachCount: breaches,
        totalCount: totalTransitions,
      });
    }

    // Also check overall case duration SLA if provided
    if (slaTargets['__case_duration__']) {
      const target = slaTargets['__case_duration__'];
      const targetMs = this._normalizeToMs(target.target, target.unit);
      const breaches = caseDurations.cases.filter(c => c.durationMs > targetMs).length;
      const total = caseDurations.cases.length;

      results.push({
        sla: 'Case Duration',
        target: target.target,
        targetMs,
        targetUnit: target.unit || 'ms',
        severity: target.severity || 'critical',
        status: total > 0 && ((total - breaches) / total) >= 0.95 ? 'met' : 'breached',
        measured: caseDurations.stats,
        complianceRate: total > 0 ? Math.round(((total - breaches) / total) * 10000) / 100 : 100,
        breachCount: breaches,
        totalCount: total,
      });
    }

    return results;
  }

  _normalizeToMs(value, unit) {
    switch (unit) {
      case 'ms': return value;
      case 'seconds': case 's': return value * 1000;
      case 'minutes': case 'min': return value * 60000;
      case 'hours': case 'h': return value * 3600000;
      case 'days': case 'd': return value * 86400000;
      default: return value; // assume ms
    }
  }

  // ── Trend Analysis ───────────────────────────────────────────

  _analyzeTrends(eventLog) {
    const traces = this._getTraces(eventLog);
    const monthlyData = new Map(); // 'YYYY-MM' → { caseCount, totalDuration, completedCases }

    for (const [, trace] of traces) {
      const events = trace.events || [];
      if (events.length < 1) continue;

      const firstTs = this._toMs(events[0].timestamp);
      if (firstTs === null) continue;

      const d = new Date(firstTs);
      const monthKey = d.toISOString().slice(0, 7);

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { caseCount: 0, durations: [] });
      }

      const entry = monthlyData.get(monthKey);
      entry.caseCount++;

      if (events.length >= 2) {
        const lastTs = this._toMs(events[events.length - 1].timestamp);
        if (lastTs !== null) {
          entry.durations.push(lastTs - firstTs);
        }
      }
    }

    const sortedMonths = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    const periods = sortedMonths.map(([month, data]) => ({
      period: month,
      caseCount: data.caseCount,
      avgDurationMs: data.durations.length > 0
        ? Math.round(data.durations.reduce((s, v) => s + v, 0) / data.durations.length)
        : 0,
      medianDurationMs: data.durations.length > 0
        ? this._computeStats(data.durations).median
        : 0,
    }));

    // Calculate trend direction
    let trend = 'stable';
    if (periods.length >= 3) {
      const recent = periods.slice(-3).map(p => p.avgDurationMs);
      const earlier = periods.slice(0, 3).map(p => p.avgDurationMs);
      const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
      const earlierAvg = earlier.reduce((s, v) => s + v, 0) / earlier.length;

      if (earlierAvg > 0) {
        const change = (recentAvg - earlierAvg) / earlierAvg;
        if (change > 0.1) trend = 'degrading';
        else if (change < -0.1) trend = 'improving';
      }
    }

    return { periods, trend, periodCount: periods.length };
  }

  // ── Helpers ──────────────────────────────────────────────────

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

  _computeStats(values) {
    if (values.length === 0) {
      return { count: 0, mean: 0, median: 0, min: 0, max: 0, stddev: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((s, v) => s + v, 0);
    const mean = sum / n;
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
    const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n;

    return {
      count: n,
      mean: Math.round(mean),
      median: Math.round(median),
      min: sorted[0],
      max: sorted[n - 1],
      stddev: Math.round(Math.sqrt(variance)),
      p75: sorted[Math.floor(n * 0.75)] || sorted[n - 1],
      p90: sorted[Math.floor(n * 0.90)] || sorted[n - 1],
      p95: sorted[Math.floor(n * 0.95)] || sorted[n - 1],
      p99: sorted[Math.floor(n * 0.99)] || sorted[n - 1],
    };
  }

  _detectOutliers(cases, stats) {
    if (stats.count < 4) return [];

    // IQR-based outlier detection
    const q1 = stats.p75 !== undefined ? stats.median - (stats.p75 - stats.median) : stats.mean - stats.stddev;
    const q3 = stats.p75;
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return cases
      .filter(c => c.durationMs < lowerBound || c.durationMs > upperBound)
      .map(c => ({
        caseId: c.caseId,
        durationMs: c.durationMs,
        direction: c.durationMs > upperBound ? 'slow' : 'fast',
        deviationFromMedian: Math.round(((c.durationMs - stats.median) / (stats.median || 1)) * 100),
      }));
  }
}

/**
 * PerformanceResult
 */
class PerformanceResult {
  constructor({ caseDurations, activityStats, transitionStats, bottlenecks, throughput, slaCompliance, trends, caseCount, eventCount }) {
    this.caseDurations = caseDurations;
    this.activityStats = activityStats;
    this.transitionStats = transitionStats;
    this.bottlenecks = bottlenecks;
    this.throughput = throughput;
    this.slaCompliance = slaCompliance;
    this.trends = trends;
    this.caseCount = caseCount;
    this.eventCount = eventCount;
  }

  getSummary() {
    return {
      caseCount: this.caseCount,
      eventCount: this.eventCount,
      avgCaseDurationMs: this.caseDurations.stats.mean,
      medianCaseDurationMs: this.caseDurations.stats.median,
      p90CaseDurationMs: this.caseDurations.stats.p90,
      topBottleneck: this.bottlenecks.length > 0 ? this.bottlenecks[0].location : null,
      topBottleneckMedianMs: this.bottlenecks.length > 0
        ? (this.bottlenecks[0].medianWaitMs || this.bottlenecks[0].medianServiceMs)
        : 0,
      throughputPerDay: this.throughput.arrivalRatePerDay,
      slaBreaches: this.slaCompliance.filter(s => s.status === 'breached').length,
      trend: this.trends.trend,
      outlierCount: this.caseDurations.outliers.length,
    };
  }

  toJSON() {
    return {
      summary: this.getSummary(),
      caseDurations: {
        stats: this.caseDurations.stats,
        outlierCount: this.caseDurations.outliers.length,
        outliers: this.caseDurations.outliers.slice(0, 20),
      },
      activityStats: this.activityStats,
      transitionStats: this.transitionStats,
      bottlenecks: this.bottlenecks.slice(0, 20),
      throughput: this.throughput,
      slaCompliance: this.slaCompliance,
      trends: this.trends,
    };
  }
}

module.exports = { PerformanceAnalyzer, PerformanceResult };
