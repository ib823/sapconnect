/**
 * Conformance Checker — Token-Based Replay
 *
 * Measures how well observed process executions conform to a reference model.
 * Uses token-based replay (Rozinat & van der Aalst, 2008).
 *
 * Fitness = 0.5 × (1 - missing/consumed) + 0.5 × (1 - remaining/produced)
 *
 * Also provides:
 * - Per-case conformance details
 * - Deviation classification (skip, insert, swap)
 * - Aggregate conformance statistics
 * - Precision estimation (escaping edges)
 */

const Logger = require('../../lib/logger');

class ConformanceChecker {
  /**
   * @param {object} [options]
   * @param {string} [options.logLevel]
   */
  constructor(options = {}) {
    this.log = new Logger('conformance-checker', { level: options.logLevel || 'info' });
  }

  /**
   * Check conformance of an event log against a reference model.
   *
   * @param {import('./event-log').EventLog} eventLog
   * @param {import('./reference-models').ReferenceModel} referenceModel
   * @returns {ConformanceResult}
   */
  check(eventLog, referenceModel) {
    this.log.info(`Checking conformance against "${referenceModel.name}" for ${eventLog.getCaseCount()} cases`);

    // Build adjacency from reference model edges
    const modelEdges = new Set();
    const modelActivities = new Set(referenceModel.activities);
    const modelSuccessors = new Map();
    const modelStartSet = new Set(referenceModel.startActivities);
    const modelEndSet = new Set(referenceModel.endActivities);

    for (const edge of referenceModel.edges) {
      modelEdges.add(`${edge.from}→${edge.to}`);
      if (!modelSuccessors.has(edge.from)) modelSuccessors.set(edge.from, new Set());
      modelSuccessors.get(edge.from).add(edge.to);
    }

    // Replay each trace
    const caseResults = [];
    let totalProduced = 0;
    let totalConsumed = 0;
    let totalMissing = 0;
    let totalRemaining = 0;

    const traces = this._getTraces(eventLog);

    for (const [caseId, trace] of traces) {
      const result = this._replayTrace(
        caseId, trace, modelEdges, modelActivities, modelSuccessors, modelStartSet, modelEndSet
      );
      caseResults.push(result);
      totalProduced += result.produced;
      totalConsumed += result.consumed;
      totalMissing += result.missing;
      totalRemaining += result.remaining;
    }

    // Overall fitness
    const fitness = this._calculateFitness(totalProduced, totalConsumed, totalMissing, totalRemaining);

    // Precision: escaping edges analysis
    const precision = this._calculatePrecision(eventLog, modelSuccessors, modelActivities);

    // Aggregate deviation statistics
    const deviationStats = this._aggregateDeviations(caseResults);

    // Conformance rate (% of cases that are fully conformant)
    const fullyConformant = caseResults.filter(c => c.fitness === 1.0).length;
    const conformanceRate = caseResults.length > 0
      ? Math.round((fullyConformant / caseResults.length) * 10000) / 100
      : 100;

    return new ConformanceResult({
      fitness: Math.round(fitness * 10000) / 10000,
      precision: Math.round(precision * 10000) / 10000,
      conformanceRate,
      fullyConformantCases: fullyConformant,
      totalCases: caseResults.length,
      counters: { produced: totalProduced, consumed: totalConsumed, missing: totalMissing, remaining: totalRemaining },
      caseResults: caseResults.slice(0, 100), // Limit detail output
      deviationStats,
      referenceModelName: referenceModel.name,
    });
  }

  /**
   * Replay a single trace against the reference model.
   */
  _replayTrace(caseId, trace, modelEdges, modelActivities, modelSuccessors, modelStartSet, modelEndSet) {
    const events = trace.events || [];
    const activities = events.map(e => e.activity);

    let produced = 0;
    let consumed = 0;
    let missing = 0;
    let remaining = 0;
    const deviations = [];

    // Token position tracks where we are in the model
    let currentPositions = new Set(); // Activities whose tokens are available

    // Process each event
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const isFirst = i === 0;
      const prevActivity = i > 0 ? activities[i - 1] : null;

      if (isFirst) {
        // First activity: check if it's a valid start
        if (modelStartSet.has(activity)) {
          produced++;
          consumed++;
          currentPositions.add(activity);
        } else if (modelActivities.has(activity)) {
          // Activity exists in model but not as start — missing token
          missing++;
          consumed++;
          produced++;
          currentPositions.add(activity);
          deviations.push({
            type: 'unexpected_start',
            index: i,
            activity,
            expected: Array.from(modelStartSet),
          });
        } else {
          // Activity not in model at all — log move
          missing++;
          consumed++;
          produced++;
          deviations.push({
            type: 'insert',
            index: i,
            activity,
            description: `Activity "${activity}" not in reference model`,
          });
        }
      } else {
        // Subsequent activities
        const edgeKey = `${prevActivity}→${activity}`;

        if (modelEdges.has(edgeKey)) {
          // Valid transition — synchronous move
          produced++;
          consumed++;
          currentPositions.add(activity);
        } else if (modelActivities.has(activity)) {
          // Activity exists but transition is invalid
          // Check if we skipped intermediate steps
          const skipped = this._findSkippedPath(prevActivity, activity, modelSuccessors);

          if (skipped) {
            // Model move: skip intermediate activities
            for (const skippedActivity of skipped) {
              produced++;
              remaining++;
              deviations.push({
                type: 'skip',
                index: i,
                skippedActivity,
                description: `Skipped "${skippedActivity}" between "${prevActivity}" and "${activity}"`,
              });
            }
            produced++;
            consumed++;
            currentPositions.add(activity);
          } else {
            // No valid path — missing token
            missing++;
            consumed++;
            produced++;
            currentPositions.add(activity);
            deviations.push({
              type: 'invalid_transition',
              index: i,
              from: prevActivity,
              to: activity,
              description: `No valid path from "${prevActivity}" to "${activity}"`,
            });
          }
        } else {
          // Activity not in model — log move (insertion)
          missing++;
          consumed++;
          produced++;
          deviations.push({
            type: 'insert',
            index: i,
            activity,
            description: `Activity "${activity}" not in reference model`,
          });
        }
      }
    }

    // Check if we ended at a valid end activity
    const lastActivity = activities[activities.length - 1];
    if (activities.length > 0 && !modelEndSet.has(lastActivity)) {
      if (modelActivities.has(lastActivity)) {
        // Find path to end
        for (const endAct of modelEndSet) {
          const pathToEnd = this._findSkippedPath(lastActivity, endAct, modelSuccessors);
          if (pathToEnd) {
            for (const skippedAct of pathToEnd) {
              produced++;
              remaining++;
            }
            break;
          }
        }
        remaining++;
        deviations.push({
          type: 'premature_end',
          activity: lastActivity,
          expectedEndActivities: Array.from(modelEndSet),
        });
      }
    }

    // Calculate per-case fitness
    const fitness = this._calculateFitness(produced, consumed, missing, remaining);

    return {
      caseId,
      fitness: Math.round(fitness * 10000) / 10000,
      isConformant: deviations.length === 0,
      produced,
      consumed,
      missing,
      remaining,
      deviations,
      deviationCount: deviations.length,
      traceLength: activities.length,
    };
  }

  /**
   * Find intermediate activities skipped between 'from' and 'to'.
   * BFS with max depth to avoid infinite loops.
   */
  _findSkippedPath(from, to, modelSuccessors, maxDepth = 5) {
    if (!from || !to) return null;

    const queue = [{ activity: from, path: [] }];
    const visited = new Set([from]);

    while (queue.length > 0) {
      const { activity, path } = queue.shift();
      if (path.length >= maxDepth) continue;

      const successors = modelSuccessors.get(activity);
      if (!successors) continue;

      for (const next of successors) {
        if (next === to) return path; // Found path, return skipped activities
        if (!visited.has(next)) {
          visited.add(next);
          queue.push({ activity: next, path: [...path, next] });
        }
      }
    }

    return null; // No path found
  }

  /**
   * Fitness = 0.5 × (1 - missing/consumed) + 0.5 × (1 - remaining/produced)
   */
  _calculateFitness(produced, consumed, missing, remaining) {
    const missingPart = consumed > 0 ? (1 - missing / consumed) : 1;
    const remainingPart = produced > 0 ? (1 - remaining / produced) : 1;
    return 0.5 * missingPart + 0.5 * remainingPart;
  }

  /**
   * Precision: proportion of model behavior that was actually observed.
   * Uses escaping edges analysis.
   */
  _calculatePrecision(eventLog, modelSuccessors, modelActivities) {
    const traces = this._getTraces(eventLog);
    let totalEnabled = 0;
    let totalEscaping = 0;

    // For each state (activity) reached during replay, count:
    // - How many transitions the model allows (enabled)
    // - How many of those were never observed in the log (escaping)
    const observedTransitions = new Set();

    for (const [, trace] of traces) {
      const events = trace.events || [];
      for (let i = 0; i < events.length - 1; i++) {
        observedTransitions.add(`${events[i].activity}→${events[i + 1].activity}`);
      }
    }

    for (const [activity, successors] of modelSuccessors) {
      for (const successor of successors) {
        totalEnabled++;
        const key = `${activity}→${successor}`;
        if (!observedTransitions.has(key)) {
          totalEscaping++;
        }
      }
    }

    return totalEnabled > 0 ? 1 - (totalEscaping / totalEnabled) : 1;
  }

  /**
   * Aggregate deviation statistics across all cases.
   */
  _aggregateDeviations(caseResults) {
    const deviationTypes = new Map();
    const deviationActivities = new Map();
    let totalDeviations = 0;

    for (const result of caseResults) {
      for (const dev of result.deviations) {
        totalDeviations++;

        // Count by type
        deviationTypes.set(dev.type, (deviationTypes.get(dev.type) || 0) + 1);

        // Count by activity
        const act = dev.activity || dev.skippedActivity || dev.to || 'unknown';
        deviationActivities.set(act, (deviationActivities.get(act) || 0) + 1);
      }
    }

    return {
      totalDeviations,
      casesWithDeviations: caseResults.filter(c => c.deviations.length > 0).length,
      byType: Object.fromEntries(
        Array.from(deviationTypes.entries()).sort((a, b) => b[1] - a[1])
      ),
      byActivity: Array.from(deviationActivities.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([activity, count]) => ({ activity, count })),
      avgDeviationsPerCase: caseResults.length > 0
        ? Math.round((totalDeviations / caseResults.length) * 100) / 100
        : 0,
    };
  }

  _getTraces(eventLog) {
    const traces = eventLog.traces || eventLog._traces;
    return traces instanceof Map ? traces : new Map(Object.entries(traces || {}));
  }
}

/**
 * ConformanceResult
 */
class ConformanceResult {
  constructor({ fitness, precision, conformanceRate, fullyConformantCases, totalCases, counters, caseResults, deviationStats, referenceModelName }) {
    this.fitness = fitness;
    this.precision = precision;
    this.conformanceRate = conformanceRate;
    this.fullyConformantCases = fullyConformantCases;
    this.totalCases = totalCases;
    this.counters = counters;
    this.caseResults = caseResults;
    this.deviationStats = deviationStats;
    this.referenceModelName = referenceModelName;
  }

  getSummary() {
    return {
      referenceModel: this.referenceModelName,
      fitness: this.fitness,
      precision: this.precision,
      conformanceRate: this.conformanceRate,
      fullyConformantCases: this.fullyConformantCases,
      totalCases: this.totalCases,
      totalDeviations: this.deviationStats.totalDeviations,
      topDeviationType: Object.keys(this.deviationStats.byType)[0] || 'none',
    };
  }

  toJSON() {
    return {
      summary: this.getSummary(),
      fitness: this.fitness,
      precision: this.precision,
      counters: this.counters,
      deviationStats: this.deviationStats,
      caseResults: this.caseResults,
    };
  }
}

module.exports = { ConformanceChecker, ConformanceResult };
