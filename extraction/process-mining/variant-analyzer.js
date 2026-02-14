/**
 * Variant Analyzer — Complete Process Variant Analysis
 *
 * Discovers all process variants, calculates frequency and duration statistics,
 * identifies the happy path, detects rework, clusters similar variants,
 * and identifies root cause indicators for deviations.
 *
 * A variant is a unique sequence of activities observed in one or more cases.
 */

const Logger = require('../../lib/logger');

/**
 * VariantAnalysisResult — Output of the Variant Analyzer
 */
class VariantAnalysisResult {
  constructor({ variants, totalVariantCount, totalCaseCount, happyPath, rework, clusters, deviations, rootCauses }) {
    this.variants = variants;
    this.totalVariantCount = totalVariantCount;
    this.totalCaseCount = totalCaseCount;
    this.happyPath = happyPath;
    this.rework = rework;
    this.clusters = clusters;
    this.deviations = deviations;
    this.rootCauses = rootCauses;
  }

  /** Summary statistics */
  getSummary() {
    return {
      totalVariants: this.totalVariantCount,
      totalCases: this.totalCaseCount,
      happyPathRate: this.happyPath ? this.happyPath.frequency : 0,
      reworkRate: this.rework.reworkRate,
      firstTimeRightRate: this.rework.firstTimeRightRate,
      clusterCount: this.clusters.length,
      top5VariantsCoverage: this.variants.slice(0, 5).reduce((s, v) => s + v.frequency, 0),
      top10VariantsCoverage: this.variants.slice(0, 10).reduce((s, v) => s + v.frequency, 0),
    };
  }

  toJSON() {
    return {
      summary: this.getSummary(),
      happyPath: this.happyPath,
      rework: this.rework,
      variants: this.variants.map(v => ({
        rank: v.rank,
        activities: v.activities,
        caseCount: v.caseCount,
        frequency: v.frequency,
        hasRework: v.hasRework,
        durationStats: v.durationStats,
      })),
      clusters: this.clusters,
      deviations: this.deviations,
      rootCauses: this.rootCauses,
    };
  }
}

class VariantAnalyzer {
  /**
   * @param {object} [options]
   * @param {number} [options.maxVariants=100] — Max variants to return in detailed analysis
   * @param {number} [options.clusterThreshold=0.3] — Edit distance ratio threshold for clustering (0-1)
   * @param {string} [options.logLevel]
   */
  constructor(options = {}) {
    this.maxVariants = options.maxVariants ?? 100;
    this.clusterThreshold = options.clusterThreshold ?? 0.3;
    this.log = new Logger('variant-analyzer', { level: options.logLevel || 'info' });
  }

  /**
   * Run full variant analysis on an event log.
   *
   * @param {import('./event-log').EventLog} eventLog
   * @returns {VariantAnalysisResult}
   */
  analyze(eventLog) {
    this.log.info(`Analyzing variants for ${eventLog.getCaseCount()} cases`);

    // Step 1: Extract all variants
    const variants = this._extractVariants(eventLog);

    // Step 2: Calculate duration statistics per variant
    this._calculateDurationStats(variants, eventLog);

    // Step 3: Identify happy path
    const happyPath = this._identifyHappyPath(variants);

    // Step 4: Detect rework patterns
    const rework = this._detectRework(eventLog);

    // Step 5: Cluster similar variants
    const clusters = this._clusterVariants(variants);

    // Step 6: Analyze deviations from happy path
    const deviations = this._analyzeDeviations(variants, happyPath);

    // Step 7: Root cause indicators
    const rootCauses = this._identifyRootCauses(eventLog, variants);

    return new VariantAnalysisResult({
      variants: variants.slice(0, this.maxVariants),
      totalVariantCount: variants.length,
      totalCaseCount: eventLog.getCaseCount(),
      happyPath,
      rework,
      clusters,
      deviations,
      rootCauses,
    });
  }

  // ── Step 1: Variant Extraction ───────────────────────────────

  _extractVariants(eventLog) {
    const variantMap = new Map();

    const traces = eventLog.traces || eventLog._traces;
    const traceMap = traces instanceof Map ? traces : new Map(Object.entries(traces || {}));

    for (const [caseId, trace] of traceMap) {
      const activities = (trace.events || []).map(e => e.activity);
      const key = activities.join(' → ');

      if (!variantMap.has(key)) {
        variantMap.set(key, {
          variantKey: key,
          activities,
          activityCount: activities.length,
          caseIds: [],
          caseCount: 0,
          frequency: 0, // percentage, set below
          durations: [], // populated in step 2
          durationStats: null,
          hasRework: this._hasRework(activities),
          reworkActivities: this._getReworkActivities(activities),
          uniqueActivities: new Set(activities).size,
        });
      }

      const variant = variantMap.get(key);
      variant.caseIds.push(caseId);
      variant.caseCount++;
    }

    const totalCases = eventLog.getCaseCount();
    const variants = Array.from(variantMap.values())
      .map(v => {
        v.frequency = totalCases > 0 ? Math.round((v.caseCount / totalCases) * 10000) / 100 : 0;
        return v;
      })
      .sort((a, b) => b.caseCount - a.caseCount);

    // Assign rank
    variants.forEach((v, i) => { v.rank = i + 1; });

    this.log.info(`Found ${variants.length} unique variants`);
    return variants;
  }

  _hasRework(activities) {
    const seen = new Set();
    for (const a of activities) {
      if (seen.has(a)) return true;
      seen.add(a);
    }
    return false;
  }

  _getReworkActivities(activities) {
    const counts = new Map();
    for (const a of activities) {
      counts.set(a, (counts.get(a) || 0) + 1);
    }
    return Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([activity, count]) => ({ activity, occurrences: count }));
  }

  // ── Step 2: Duration Statistics ──────────────────────────────

  _calculateDurationStats(variants, eventLog) {
    const traces = eventLog.traces || eventLog._traces;
    const traceMap = traces instanceof Map ? traces : new Map(Object.entries(traces || {}));

    for (const variant of variants) {
      const durations = [];

      for (const caseId of variant.caseIds) {
        const trace = traceMap.get(caseId);
        if (!trace) continue;
        const events = trace.events || [];
        if (events.length < 2) continue;

        const first = events[0].timestamp;
        const last = events[events.length - 1].timestamp;
        if (first && last) {
          const durationMs = new Date(last).getTime() - new Date(first).getTime();
          if (durationMs >= 0) durations.push(durationMs);
        }
      }

      variant.durations = durations;
      variant.durationStats = this._computeStats(durations);
    }
  }

  _computeStats(values) {
    if (values.length === 0) {
      return { count: 0, mean: 0, median: 0, min: 0, max: 0, stddev: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((s, v) => s + v, 0);
    const mean = sum / n;

    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

    const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    const stddev = Math.sqrt(variance);

    return {
      count: n,
      mean: Math.round(mean),
      median: Math.round(median),
      min: sorted[0],
      max: sorted[n - 1],
      stddev: Math.round(stddev),
      p75: sorted[Math.floor(n * 0.75)] || sorted[n - 1],
      p90: sorted[Math.floor(n * 0.90)] || sorted[n - 1],
      p95: sorted[Math.floor(n * 0.95)] || sorted[n - 1],
      p99: sorted[Math.floor(n * 0.99)] || sorted[n - 1],
    };
  }

  // ── Step 3: Happy Path ───────────────────────────────────────

  _identifyHappyPath(variants) {
    if (variants.length === 0) return null;

    // Happy path = most frequent variant without rework
    const noRework = variants.filter(v => !v.hasRework);
    const happyVariant = noRework.length > 0 ? noRework[0] : variants[0];

    return {
      variantKey: happyVariant.variantKey,
      activities: happyVariant.activities,
      caseCount: happyVariant.caseCount,
      frequency: happyVariant.frequency,
      durationStats: happyVariant.durationStats,
      isReworkFree: !happyVariant.hasRework,
    };
  }

  // ── Step 4: Rework Detection ─────────────────────────────────

  _detectRework(eventLog) {
    const traces = eventLog.traces || eventLog._traces;
    const traceMap = traces instanceof Map ? traces : new Map(Object.entries(traces || {}));

    let casesWithRework = 0;
    let totalReworkEvents = 0;
    const reworkByActivity = new Map();

    for (const [, trace] of traceMap) {
      const events = trace.events || [];
      const seen = new Map();
      let caseHasRework = false;

      for (const event of events) {
        const count = (seen.get(event.activity) || 0) + 1;
        seen.set(event.activity, count);

        if (count > 1) {
          caseHasRework = true;
          totalReworkEvents++;
          reworkByActivity.set(event.activity, (reworkByActivity.get(event.activity) || 0) + 1);
        }
      }

      if (caseHasRework) casesWithRework++;
    }

    const totalCases = eventLog.getCaseCount();

    return {
      casesWithRework,
      reworkRate: totalCases > 0 ? Math.round((casesWithRework / totalCases) * 10000) / 100 : 0,
      totalReworkEvents,
      reworkByActivity: Array.from(reworkByActivity.entries())
        .map(([activity, count]) => ({ activity, reworkCount: count }))
        .sort((a, b) => b.reworkCount - a.reworkCount),
      firstTimeRightRate: totalCases > 0
        ? Math.round(((totalCases - casesWithRework) / totalCases) * 10000) / 100
        : 100,
    };
  }

  // ── Step 5: Variant Clustering ───────────────────────────────

  /**
   * Cluster similar variants using normalized Levenshtein edit distance.
   */
  _clusterVariants(variants) {
    if (variants.length <= 1) {
      return variants.length === 1
        ? [{ clusterId: 0, variants: [variants[0].variantKey], representativeVariant: variants[0].variantKey, totalCases: variants[0].caseCount }]
        : [];
    }

    const assigned = new Set();
    const clusters = [];

    for (let i = 0; i < Math.min(variants.length, this.maxVariants); i++) {
      if (assigned.has(i)) continue;

      const cluster = {
        clusterId: clusters.length,
        variants: [variants[i].variantKey],
        representativeVariant: variants[i].variantKey,
        totalCases: variants[i].caseCount,
        memberDetails: [{ rank: variants[i].rank, caseCount: variants[i].caseCount }],
      };
      assigned.add(i);

      for (let j = i + 1; j < Math.min(variants.length, this.maxVariants); j++) {
        if (assigned.has(j)) continue;

        const distance = this._normalizedEditDistance(
          variants[i].activities,
          variants[j].activities
        );

        if (distance <= this.clusterThreshold) {
          cluster.variants.push(variants[j].variantKey);
          cluster.totalCases += variants[j].caseCount;
          cluster.memberDetails.push({ rank: variants[j].rank, caseCount: variants[j].caseCount });
          assigned.add(j);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Normalized Levenshtein edit distance between two activity sequences.
   * Returns value between 0 (identical) and 1 (completely different).
   */
  _normalizedEditDistance(seq1, seq2) {
    const m = seq1.length;
    const n = seq2.length;
    if (m === 0 && n === 0) return 0;
    if (m === 0 || n === 0) return 1;

    // Build DP table
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = seq1[i - 1] === seq2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,       // deletion
          dp[i][j - 1] + 1,       // insertion
          dp[i - 1][j - 1] + cost  // substitution
        );
      }
    }

    return dp[m][n] / Math.max(m, n);
  }

  // ── Step 6: Deviation Analysis ───────────────────────────────

  _analyzeDeviations(variants, happyPath) {
    if (!happyPath || variants.length <= 1) return { deviationCount: 0, deviations: [] };

    const happyActivities = new Set(happyPath.activities);
    const happySequence = happyPath.activities;
    const deviations = [];

    for (const variant of variants) {
      if (variant.variantKey === happyPath.variantKey) continue;

      const deviation = {
        variantRank: variant.rank,
        caseCount: variant.caseCount,
        frequency: variant.frequency,
        editDistance: this._normalizedEditDistance(happySequence, variant.activities),
        skippedActivities: [],
        insertedActivities: [],
        reorderedActivities: [],
      };

      // Find skipped activities (in happy path but not in variant)
      for (const a of happySequence) {
        if (!variant.activities.includes(a)) {
          deviation.skippedActivities.push(a);
        }
      }

      // Find inserted activities (in variant but not in happy path)
      for (const a of variant.activities) {
        if (!happyActivities.has(a)) {
          deviation.insertedActivities.push(a);
        }
      }

      // Classify deviation type
      if (deviation.skippedActivities.length > 0 && deviation.insertedActivities.length > 0) {
        deviation.type = 'substitution';
      } else if (deviation.skippedActivities.length > 0) {
        deviation.type = 'skip';
      } else if (deviation.insertedActivities.length > 0) {
        deviation.type = 'insertion';
      } else {
        deviation.type = 'reorder';
      }

      deviations.push(deviation);
    }

    return {
      deviationCount: deviations.length,
      conformantRate: variants.length > 0
        ? Math.round(((variants[0].caseCount) / variants.reduce((s, v) => s + v.caseCount, 0)) * 10000) / 100
        : 0,
      deviations: deviations.sort((a, b) => b.caseCount - a.caseCount),
    };
  }

  // ── Step 7: Root Cause Indicators ────────────────────────────

  /**
   * Identify case-level attributes that correlate with specific variants.
   * Uses lift-based ranking (inspired by Celonis root cause analysis).
   */
  _identifyRootCauses(eventLog, variants) {
    const traces = eventLog.traces || eventLog._traces;
    const traceMap = traces instanceof Map ? traces : new Map(Object.entries(traces || {}));

    // Collect all case-level attributes
    const attributeValues = new Map(); // attrKey → Map<value, Set<caseId>>

    for (const [caseId, trace] of traceMap) {
      const attrs = trace.attributes || new Map();
      const attrMap = attrs instanceof Map ? attrs : new Map(Object.entries(attrs || {}));

      for (const [key, value] of attrMap) {
        if (!attributeValues.has(key)) attributeValues.set(key, new Map());
        const valueMap = attributeValues.get(key);
        if (!valueMap.has(value)) valueMap.set(value, new Set());
        valueMap.get(value).add(caseId);
      }

      // Also check first event attributes (often contains process-specific data)
      const events = trace.events || [];
      if (events.length > 0) {
        const firstEvent = events[0];
        const eventAttrs = firstEvent.attributes || new Map();
        const eventAttrMap = eventAttrs instanceof Map ? eventAttrs : new Map(Object.entries(eventAttrs || {}));

        for (const [key, value] of eventAttrMap) {
          const attrKey = `event:${key}`;
          if (!attributeValues.has(attrKey)) attributeValues.set(attrKey, new Map());
          const valueMap = attributeValues.get(attrKey);
          if (!valueMap.has(value)) valueMap.set(value, new Set());
          valueMap.get(value).add(caseId);
        }
      }
    }

    if (attributeValues.size === 0 || variants.length < 2) {
      return [];
    }

    // Calculate lift for top variants
    const totalCases = eventLog.getCaseCount();
    const rootCauses = [];

    for (const variant of variants.slice(0, 10)) {
      const variantCaseSet = new Set(variant.caseIds);
      const variantRate = variant.caseCount / totalCases;

      for (const [attrKey, valueMap] of attributeValues) {
        for (const [attrValue, casesWithValue] of valueMap) {
          // Lift = P(variant | attribute=value) / P(variant)
          const casesInBoth = [...casesWithValue].filter(c => variantCaseSet.has(c)).length;
          const conditionalRate = casesInBoth / casesWithValue.size;
          const lift = variantRate > 0 ? conditionalRate / variantRate : 0;

          // Only report significant lifts (>1.5 or <0.5)
          if (lift > 1.5 && casesInBoth >= 2) {
            rootCauses.push({
              variantRank: variant.rank,
              attribute: attrKey,
              value: attrValue,
              lift: Math.round(lift * 100) / 100,
              support: casesInBoth,
              confidence: Math.round(conditionalRate * 10000) / 100,
              direction: 'positive', // This attribute value increases variant likelihood
            });
          } else if (lift < 0.5 && lift > 0 && casesWithValue.size >= 5) {
            rootCauses.push({
              variantRank: variant.rank,
              attribute: attrKey,
              value: attrValue,
              lift: Math.round(lift * 100) / 100,
              support: casesInBoth,
              confidence: Math.round(conditionalRate * 10000) / 100,
              direction: 'negative', // This attribute value decreases variant likelihood
            });
          }
        }
      }
    }

    return rootCauses.sort((a, b) => b.lift - a.lift);
  }
}

module.exports = { VariantAnalyzer, VariantAnalysisResult };
