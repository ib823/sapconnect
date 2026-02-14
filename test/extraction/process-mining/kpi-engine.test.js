'use strict';

const { KPIEngine, KPIReport } = require('../../../extraction/process-mining/kpi-engine');
const { Event, Trace, EventLog } = require('../../../extraction/process-mining/event-log');

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildEventLog(cases) {
  const log = new EventLog('kpi-test');
  for (const { caseId, events } of cases) {
    const trace = new Trace(caseId);
    for (const ev of events) {
      trace.addEvent(new Event(ev));
    }
    log.addTrace(trace);
  }
  return log;
}

function makeTime(baseMs, offsetMs) {
  return new Date(baseMs + offsetMs).toISOString();
}

/** Build a standard O2C-style event log with known durations. */
function buildStandardLog() {
  const base = new Date('2025-01-01T00:00:00Z').getTime();
  const HOUR = 3600000;
  const DAY = 86400000;

  return buildEventLog([
    {
      caseId: 'C1',
      events: [
        { activity: 'Create Order', timestamp: makeTime(base, 0), resource: 'UserA' },
        { activity: 'Approve', timestamp: makeTime(base, 2 * HOUR), resource: 'UserB' },
        { activity: 'Ship', timestamp: makeTime(base, 1 * DAY), resource: 'UserC' },
        { activity: 'Invoice', timestamp: makeTime(base, 2 * DAY), resource: 'UserA' },
        { activity: 'Payment', timestamp: makeTime(base, 5 * DAY), resource: 'SYSTEM' },
      ],
    },
    {
      caseId: 'C2',
      events: [
        { activity: 'Create Order', timestamp: makeTime(base, 1 * HOUR), resource: 'UserA' },
        { activity: 'Approve', timestamp: makeTime(base, 4 * HOUR), resource: 'UserB' },
        { activity: 'Approve', timestamp: makeTime(base, 8 * HOUR), resource: 'UserB' }, // rework
        { activity: 'Ship', timestamp: makeTime(base, 1.5 * DAY), resource: 'UserC' },
        { activity: 'Invoice', timestamp: makeTime(base, 2.5 * DAY), resource: 'UserA' },
        { activity: 'Payment', timestamp: makeTime(base, 6 * DAY), resource: 'SYSTEM' },
      ],
    },
    {
      caseId: 'C3',
      events: [
        { activity: 'Create Order', timestamp: makeTime(base, 2 * HOUR), resource: 'UserA' },
        { activity: 'Approve', timestamp: makeTime(base, 5 * HOUR), resource: 'UserC' },
        { activity: 'Ship', timestamp: makeTime(base, 2 * DAY), resource: 'UserC' },
        { activity: 'Invoice', timestamp: makeTime(base, 3 * DAY), resource: 'UserB' },
        { activity: 'Payment', timestamp: makeTime(base, 7 * DAY), resource: 'BATCH' },
      ],
    },
    {
      caseId: 'C4',
      events: [
        { activity: 'Create Order', timestamp: makeTime(base, 3 * HOUR), resource: 'UserA' },
        { activity: 'Approve', timestamp: makeTime(base, 6 * HOUR), resource: 'UserB' },
        { activity: 'Ship', timestamp: makeTime(base, 1 * DAY), resource: 'UserC' },
        { activity: 'Ship', timestamp: makeTime(base, 1.5 * DAY), resource: 'UserC' }, // self-loop rework
        { activity: 'Invoice', timestamp: makeTime(base, 2 * DAY), resource: 'UserA' },
        { activity: 'Payment', timestamp: makeTime(base, 4 * DAY), resource: 'RFC_USER' },
      ],
    },
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('KPIEngine', () => {
  let engine;
  let log;

  beforeEach(() => {
    engine = new KPIEngine({ logLevel: 'error' });
    log = buildStandardLog();
  });

  // ── 1. Time KPIs ────────────────────────────────────────────────────────

  describe('Time KPIs', () => {
    it('calculates cycle time from case durations with confidence interval', () => {
      const report = engine.calculate(log);
      const cycleTime = report.timeKPIs.cycleTime;

      expect(cycleTime.name).toBe('Cycle Time');
      expect(cycleTime.unit).toBe('ms');
      expect(cycleTime.value).toBeGreaterThan(0);
      expect(cycleTime.count).toBe(4);
      expect(cycleTime.ci).toBeDefined();
      expect(cycleTime.ci.lower).toBeLessThanOrEqual(cycleTime.value);
      expect(cycleTime.ci.upper).toBeGreaterThanOrEqual(cycleTime.value);
    });

    it('calculates touch time (non-waiting time)', () => {
      const report = engine.calculate(log);
      const touchTime = report.timeKPIs.touchTime;

      expect(touchTime.name).toBe('Touch Time');
      expect(touchTime.unit).toBe('ms');
      expect(touchTime.value).toBeGreaterThan(0);
      // Touch time should equal cycle time when computed as sum of all inter-event durations
      // (for these traces, transition-sum == first-to-last)
      expect(touchTime.count).toBe(4);
    });

    it('calculates activities per case', () => {
      const report = engine.calculate(log);
      const apc = report.timeKPIs.activitiesPerCase;

      expect(apc.name).toBe('Activities per Case');
      expect(apc.unit).toBe('count');
      // C1: 5, C2: 6, C3: 5, C4: 6 => avg 5.5
      expect(apc.value).toBe(5.5);
      expect(apc.count).toBe(4);
    });
  });

  // ── 2. Quality KPIs ────────────────────────────────────────────────────

  describe('Quality KPIs', () => {
    it('calculates rework rate', () => {
      const report = engine.calculate(log);
      const rr = report.qualityKPIs.reworkRate;

      expect(rr.name).toBe('Rework Rate');
      expect(rr.unit).toBe('%');
      // C2 has rework (Approve repeated), C4 has rework (Ship repeated) = 2/4 = 50%
      expect(rr.value).toBe(50);
    });

    it('calculates first-time-right rate as complement of rework rate', () => {
      const report = engine.calculate(log);
      const ftr = report.qualityKPIs.firstTimeRightRate;

      expect(ftr.name).toBe('First Time Right Rate');
      expect(ftr.unit).toBe('%');
      expect(ftr.value).toBe(50); // 100 - 50
    });

    it('calculates happy path rate from variant analysis', () => {
      const happyFreq = 45.5;
      const report = engine.calculate(log, {
        variantAnalysis: {
          happyPath: { frequency: happyFreq },
          totalVariantCount: 3,
        },
      });

      expect(report.qualityKPIs.happyPathRate.value).toBe(happyFreq);
    });

    it('returns 0 happy path rate when no variant analysis is provided', () => {
      const report = engine.calculate(log);
      expect(report.qualityKPIs.happyPathRate.value).toBe(0);
    });

    it('reports variant count from variant analysis', () => {
      const report = engine.calculate(log, {
        variantAnalysis: {
          happyPath: null,
          totalVariantCount: 7,
        },
      });
      expect(report.qualityKPIs.variantCount.value).toBe(7);
    });

    it('calculates straight-through processing rate', () => {
      const report = engine.calculate(log);
      const stp = report.qualityKPIs.straightThroughRate;

      expect(stp.name).toBe('Straight-Through Processing Rate');
      expect(stp.unit).toBe('%');
      // C1 and C3 have no repeated activities = 2/4 = 50%
      expect(stp.value).toBe(50);
    });
  });

  // ── 3. Volume KPIs ─────────────────────────────────────────────────────

  describe('Volume KPIs', () => {
    it('returns case count and event count', () => {
      const report = engine.calculate(log);

      expect(report.volumeKPIs.caseCount.value).toBe(4);
      expect(report.volumeKPIs.caseCount.unit).toBe('count');
      expect(report.volumeKPIs.eventCount.value).toBe(22);
      expect(report.volumeKPIs.eventCount.unit).toBe('count');
    });

    it('counts activity types', () => {
      const report = engine.calculate(log);
      expect(report.volumeKPIs.activityTypes.value).toBe(5);
    });

    it('estimates work in progress via sampling', () => {
      const report = engine.calculate(log);
      const wip = report.volumeKPIs.avgWorkInProgress;

      expect(wip.name).toBe('Average Work in Progress');
      expect(wip.unit).toBe('cases');
      expect(typeof wip.value).toBe('number');
      expect(wip.value).toBeGreaterThanOrEqual(0);
    });

    it('includes throughput when performance analysis is provided', () => {
      const report = engine.calculate(log, {
        performanceAnalysis: {
          bottlenecks: [],
          throughput: { arrivalRatePerDay: 12.5 },
        },
      });
      expect(report.volumeKPIs.throughput).not.toBeNull();
      expect(report.volumeKPIs.throughput.value).toBe(12.5);
      expect(report.volumeKPIs.throughput.unit).toBe('cases/day');
    });

    it('throughput is null when no performance data provided', () => {
      const report = engine.calculate(log);
      expect(report.volumeKPIs.throughput).toBeNull();
    });
  });

  // ── 4. Conformance KPIs ────────────────────────────────────────────────

  describe('Conformance KPIs', () => {
    it('extracts fitness and precision from conformance result', () => {
      const conformanceResult = {
        fitness: 0.87,
        precision: 0.92,
        conformanceRate: 65,
        deviationStats: {
          avgDeviationsPerCase: 1.3,
        },
      };
      const report = engine.calculate(log, { conformanceResult });

      expect(report.conformanceKPIs.fitness.value).toBe(0.87);
      expect(report.conformanceKPIs.fitness.unit).toBe('ratio');
      expect(report.conformanceKPIs.precision.value).toBe(0.92);
      expect(report.conformanceKPIs.conformanceRate.value).toBe(65);
      expect(report.conformanceKPIs.avgDeviationsPerCase.value).toBe(1.3);
    });

    it('returns nulls when no conformance result is provided', () => {
      const report = engine.calculate(log);
      expect(report.conformanceKPIs.fitness).toBeNull();
      expect(report.conformanceKPIs.precision).toBeNull();
      expect(report.conformanceKPIs.conformanceRate).toBeNull();
    });
  });

  // ── 5. Resource KPIs ───────────────────────────────────────────────────

  describe('Resource KPIs', () => {
    it('counts unique resources', () => {
      const report = engine.calculate(log);
      // UserA, UserB, UserC, SYSTEM, BATCH, RFC_USER = 6
      expect(report.resourceKPIs.resourceCount.value).toBe(6);
    });

    it('calculates handovers per case', () => {
      const report = engine.calculate(log);
      const ho = report.resourceKPIs.avgHandoversPerCase;

      expect(ho.name).toBe('Handovers per Case');
      expect(ho.unit).toBe('count');
      expect(ho.value).toBeGreaterThan(0);
      expect(ho.count).toBe(4);
    });

    it('calculates automation rate from SYSTEM/BATCH/RFC resources', () => {
      const report = engine.calculate(log);
      const ar = report.resourceKPIs.automationRate;

      expect(ar.name).toBe('Automation Rate');
      expect(ar.unit).toBe('%');
      // SYSTEM in C1, SYSTEM in C2, BATCH in C3, RFC_USER in C4 = 4/22
      expect(ar.value).toBeGreaterThan(0);
      expect(ar.value).toBeLessThan(100);
    });

    it('reports SoD violations from social network result', () => {
      const report = engine.calculate(log, {
        socialNetworkResult: {
          resourceUtilization: {
            workloadDistribution: { coefficientOfVariation: 0.4, isBalanced: false },
          },
          sodViolations: { totalViolations: 3, rulesViolated: 2 },
        },
      });

      expect(report.resourceKPIs.sodViolations.value).toBe(3);
      expect(report.resourceKPIs.sodViolations.rulesViolated).toBe(2);
      expect(report.resourceKPIs.workloadBalance.value).toBe(0.4);
      expect(report.resourceKPIs.workloadBalance.isBalanced).toBe(false);
    });

    it('SoD violations and workload balance are null without social data', () => {
      const report = engine.calculate(log);
      expect(report.resourceKPIs.sodViolations).toBeNull();
      expect(report.resourceKPIs.workloadBalance).toBeNull();
    });
  });

  // ── 6. Process-Specific KPIs ───────────────────────────────────────────

  describe('Process-specific KPIs', () => {
    it('computes transition-based KPIs from processConfig', () => {
      const processConfig = {
        kpis: {
          'Order to Ship': {
            from: 'Create Order',
            to: 'Ship',
            target: 2,
            unit: 'days',
          },
        },
      };

      const report = engine.calculate(log, {}, processConfig);
      const kpi = report.processKPIs['Order to Ship'];

      expect(kpi).toBeDefined();
      expect(kpi.name).toBe('Order to Ship');
      expect(kpi.unit).toBe('ms');
      expect(kpi.value).toBeGreaterThan(0);
      expect(kpi.target).toBe(2 * 86400000);
      expect(kpi.targetOriginal).toBe(2);
      expect(kpi.targetUnit).toBe('days');
      expect(typeof kpi.compliance).toBe('number');
    });

    it('handles ratio-type KPIs', () => {
      const processConfig = {
        kpis: {
          'Perfect Order Rate': {
            type: 'ratio',
            numerator: 'perfect_orders',
            denominator: 'total_orders',
            target: 0.95,
          },
        },
      };

      const report = engine.calculate(log, {}, processConfig);
      const kpi = report.processKPIs['Perfect Order Rate'];

      expect(kpi.name).toBe('Perfect Order Rate');
      expect(kpi.unit).toBe('%');
      expect(kpi.target).toBe(95);
    });

    it('returns empty processKPIs when no config provided', () => {
      const report = engine.calculate(log);
      expect(Object.keys(report.processKPIs).length).toBe(0);
    });
  });

  // ── 7. Confidence Intervals ────────────────────────────────────────────

  describe('Confidence intervals', () => {
    it('has correct structure with lower, upper, level', () => {
      const report = engine.calculate(log);
      const ci = report.timeKPIs.cycleTime.ci;

      expect(ci).toHaveProperty('lower');
      expect(ci).toHaveProperty('upper');
      expect(ci).toHaveProperty('level');
      expect(ci).toHaveProperty('marginOfError');
      expect(ci.level).toBe(0.95);
      expect(typeof ci.lower).toBe('number');
      expect(typeof ci.upper).toBe('number');
    });

    it('respects custom confidence level', () => {
      const engine99 = new KPIEngine({ confidenceLevel: 0.99, logLevel: 'error' });
      const report = engine99.calculate(log);
      expect(report.timeKPIs.cycleTime.ci.level).toBe(0.99);
      // 99% CI should be wider than 95% CI
      const report95 = engine.calculate(log);
      expect(report.timeKPIs.cycleTime.ci.marginOfError)
        .toBeGreaterThanOrEqual(report95.timeKPIs.cycleTime.ci.marginOfError);
    });
  });

  // ── 8. Statistical Rigor ───────────────────────────────────────────────

  describe('Statistical rigor', () => {
    it('calculates correct mean/stddev for known data', () => {
      // Build a log with known durations: 1h, 2h, 3h, 4h
      const base = new Date('2025-01-01T00:00:00Z').getTime();
      const HOUR = 3600000;
      const knownLog = buildEventLog([
        {
          caseId: 'K1',
          events: [
            { activity: 'A', timestamp: makeTime(base, 0), resource: 'U' },
            { activity: 'B', timestamp: makeTime(base, 1 * HOUR), resource: 'U' },
          ],
        },
        {
          caseId: 'K2',
          events: [
            { activity: 'A', timestamp: makeTime(base, 0), resource: 'U' },
            { activity: 'B', timestamp: makeTime(base, 2 * HOUR), resource: 'U' },
          ],
        },
        {
          caseId: 'K3',
          events: [
            { activity: 'A', timestamp: makeTime(base, 0), resource: 'U' },
            { activity: 'B', timestamp: makeTime(base, 3 * HOUR), resource: 'U' },
          ],
        },
        {
          caseId: 'K4',
          events: [
            { activity: 'A', timestamp: makeTime(base, 0), resource: 'U' },
            { activity: 'B', timestamp: makeTime(base, 4 * HOUR), resource: 'U' },
          ],
        },
      ]);

      const report = engine.calculate(knownLog);
      const ct = report.timeKPIs.cycleTime;

      // Mean of [1h, 2h, 3h, 4h] = 2.5h = 9,000,000 ms
      expect(ct.stats.mean).toBe(9000000);
      // Median of [1h, 2h, 3h, 4h] = (2h + 3h)/2 = 2.5h = 9,000,000 ms
      expect(ct.stats.median).toBe(9000000);
      // Min = 1h, Max = 4h
      expect(ct.stats.min).toBe(1 * HOUR);
      expect(ct.stats.max).toBe(4 * HOUR);
      // Sample stddev of [1,2,3,4] hours: sqrt(((−1.5)²+(−0.5)²+(0.5)²+(1.5)²)/3) = sqrt(5/3) ≈ 1.29h
      expect(ct.stats.stddev).toBeGreaterThan(4000000);
      expect(ct.stats.stddev).toBeLessThan(5000000);
    });
  });

  // ── 9. KPIReport Methods ──────────────────────────────────────────────

  describe('KPIReport', () => {
    it('getAllKPIs() returns flat list with category, key, name, value', () => {
      const report = engine.calculate(log);
      const allKPIs = report.getAllKPIs();

      expect(Array.isArray(allKPIs)).toBe(true);
      expect(allKPIs.length).toBeGreaterThan(0);

      for (const kpi of allKPIs) {
        expect(kpi).toHaveProperty('category');
        expect(kpi).toHaveProperty('key');
        expect(kpi).toHaveProperty('name');
        expect(kpi).toHaveProperty('value');
        expect(typeof kpi.category).toBe('string');
        expect(typeof kpi.key).toBe('string');
        expect(typeof kpi.name).toBe('string');
      }

      // Should have Time, Quality, Volume categories at minimum
      const categories = new Set(allKPIs.map(k => k.category));
      expect(categories.has('Time')).toBe(true);
      expect(categories.has('Quality')).toBe(true);
      expect(categories.has('Volume')).toBe(true);
    });

    it('toJSON() has time, quality, volume, conformance, resource, process sections', () => {
      const report = engine.calculate(log);
      const json = report.toJSON();

      expect(json).toHaveProperty('time');
      expect(json).toHaveProperty('quality');
      expect(json).toHaveProperty('volume');
      expect(json).toHaveProperty('conformance');
      expect(json).toHaveProperty('resource');
      expect(json).toHaveProperty('process');
      expect(json).toHaveProperty('caseCount');
      expect(json).toHaveProperty('eventCount');
      expect(json.caseCount).toBe(4);
      expect(json.eventCount).toBe(22);
    });

    it('toJSON() output is fully JSON-serializable', () => {
      const report = engine.calculate(log);
      const json = report.toJSON();
      const str = JSON.stringify(json);
      expect(() => JSON.parse(str)).not.toThrow();
    });
  });

  // ── 10. Empty Event Log ────────────────────────────────────────────────

  describe('Empty event log', () => {
    it('returns zeros/defaults gracefully', () => {
      const emptyLog = new EventLog('empty');
      const report = engine.calculate(emptyLog);

      expect(report.timeKPIs.cycleTime.value).toBe(0);
      expect(report.timeKPIs.cycleTime.ci).toBeNull();
      expect(report.timeKPIs.touchTime.value).toBe(0);
      expect(report.qualityKPIs.reworkRate.value).toBe(0);
      expect(report.qualityKPIs.firstTimeRightRate.value).toBe(100);
      expect(report.volumeKPIs.caseCount.value).toBe(0);
      expect(report.volumeKPIs.eventCount.value).toBe(0);
    });
  });

  // ── 11. No Analysis Results ────────────────────────────────────────────

  describe('No analysis results', () => {
    it('works with just eventLog (no variant/perf/conformance)', () => {
      const report = engine.calculate(log);

      // All top-level sections should exist
      expect(report.timeKPIs).toBeDefined();
      expect(report.qualityKPIs).toBeDefined();
      expect(report.volumeKPIs).toBeDefined();
      expect(report.conformanceKPIs).toBeDefined();
      expect(report.resourceKPIs).toBeDefined();
      expect(report.processKPIs).toBeDefined();

      // Conformance should gracefully be null
      expect(report.conformanceKPIs.fitness).toBeNull();

      // Quality should still calculate rework from the log itself
      expect(typeof report.qualityKPIs.reworkRate.value).toBe('number');
    });
  });

  // ── 12. Self-loop detection ────────────────────────────────────────────

  describe('Self-loop rate', () => {
    it('detects cases with immediately repeated activities', () => {
      const report = engine.calculate(log);
      const slr = report.qualityKPIs.selfLoopRate;

      expect(slr.name).toBe('Self-Loop Rate');
      // C2 has Approve->Approve and C4 has Ship->Ship self-loops = 2/4 = 50%
      expect(slr.value).toBe(50);
    });
  });

  // ── 13. KPIReport constructor stores counts ───────────────────────────

  describe('KPIReport stores caseCount and eventCount', () => {
    it('passes through caseCount and eventCount from the engine', () => {
      const report = engine.calculate(log);
      expect(report.caseCount).toBe(4);
      expect(report.eventCount).toBe(22);
    });
  });

  // ── 14. Single-event traces are skipped for time KPIs ─────────────────

  describe('Single-event traces', () => {
    it('excludes single-event traces from duration calculations', () => {
      const base = new Date('2025-01-01T00:00:00Z').getTime();
      const singleLog = buildEventLog([
        {
          caseId: 'S1',
          events: [
            { activity: 'Start', timestamp: makeTime(base, 0), resource: 'U' },
          ],
        },
        {
          caseId: 'S2',
          events: [
            { activity: 'Start', timestamp: makeTime(base, 0), resource: 'U' },
            { activity: 'End', timestamp: makeTime(base, 3600000), resource: 'U' },
          ],
        },
      ]);

      const report = engine.calculate(singleLog);
      // Only S2 should contribute to cycle time (count = 1)
      expect(report.timeKPIs.cycleTime.count).toBe(1);
      expect(report.timeKPIs.cycleTime.value).toBe(3600000);
    });
  });

  // ── 15. Top bottleneck from performance analysis ──────────────────────

  describe('Top bottleneck', () => {
    it('extracts top bottleneck from performance result', () => {
      const report = engine.calculate(log, {
        performanceAnalysis: {
          bottlenecks: [
            { location: 'Approve -> Ship', medianWaitMs: 45000, impact: 'high' },
            { location: 'Ship -> Invoice', medianWaitMs: 12000, impact: 'medium' },
          ],
          throughput: null,
        },
      });

      expect(report.timeKPIs.topBottleneck).toBeDefined();
      expect(report.timeKPIs.topBottleneck.name).toBe('Approve -> Ship');
      expect(report.timeKPIs.topBottleneck.medianMs).toBe(45000);
      expect(report.timeKPIs.topBottleneck.impact).toBe('high');
    });

    it('topBottleneck is null when bottleneck list is empty', () => {
      const report = engine.calculate(log, {
        performanceAnalysis: {
          bottlenecks: [],
          throughput: null,
        },
      });

      expect(report.timeKPIs.topBottleneck).toBeNull();
    });
  });

  // ── 16. KPIEngine constructor defaults ─────────────────────────────────

  describe('Constructor defaults', () => {
    it('defaults confidence level to 0.95', () => {
      const e = new KPIEngine();
      expect(e.confidenceLevel).toBe(0.95);
    });

    it('accepts custom confidence level', () => {
      const e = new KPIEngine({ confidenceLevel: 0.90 });
      expect(e.confidenceLevel).toBe(0.90);
    });
  });

  // ── 17. KPIReport getAllKPIs includes resource category ────────────────

  describe('getAllKPIs resource category', () => {
    it('includes resource category KPIs in flat list', () => {
      const report = engine.calculate(log);
      const allKPIs = report.getAllKPIs();
      const resourceKPIs = allKPIs.filter(k => k.category === 'Resource');
      expect(resourceKPIs.length).toBeGreaterThanOrEqual(2);
    });
  });
});
