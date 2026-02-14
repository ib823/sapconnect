/**
 * Social Network Miner — Organizational Mining
 *
 * Analyzes resource behavior from event logs:
 * - Handover of work (who passes work to whom)
 * - Working together (shared cases)
 * - Resource utilization (workload distribution)
 * - Segregation of duties violations
 * - Activity-resource matrix
 */

const Logger = require('../../lib/logger');

class SocialNetworkMiner {
  /**
   * @param {object} [options]
   * @param {string} [options.logLevel]
   */
  constructor(options = {}) {
    this.log = new Logger('social-network-miner', { level: options.logLevel || 'info' });
  }

  /**
   * Run full organizational analysis.
   *
   * @param {import('./event-log').EventLog} eventLog
   * @param {object} [options]
   * @param {Array<{activities: string[]}>} [options.sodRules] — Segregation of duties rules
   * @returns {SocialNetworkResult}
   */
  analyze(eventLog, options = {}) {
    this.log.info(`Mining social network from ${eventLog.getCaseCount()} cases`);

    const handoverMatrix = this._buildHandoverMatrix(eventLog);
    const workingTogether = this._buildWorkingTogetherMatrix(eventLog);
    const resourceUtilization = this._analyzeUtilization(eventLog);
    const activityResourceMatrix = this._buildActivityResourceMatrix(eventLog);
    const sodViolations = this._checkSegregationOfDuties(eventLog, options.sodRules || []);
    const centralityMetrics = this._calculateCentrality(handoverMatrix);

    return new SocialNetworkResult({
      handoverMatrix,
      workingTogether,
      resourceUtilization,
      activityResourceMatrix,
      sodViolations,
      centralityMetrics,
      resourceCount: eventLog.getResourceSet().size,
      caseCount: eventLog.getCaseCount(),
    });
  }

  // ── Handover of Work ─────────────────────────────────────────

  /**
   * Build handover of work matrix: resource A completes an activity,
   * resource B performs the next activity → A handed over to B.
   */
  _buildHandoverMatrix(eventLog) {
    const matrix = new Map(); // resourceA → Map<resourceB, count>
    const traces = this._getTraces(eventLog);

    for (const [, trace] of traces) {
      const events = trace.events || [];
      for (let i = 0; i < events.length - 1; i++) {
        const from = events[i].resource;
        const to = events[i + 1].resource;
        if (!from || !to) continue;
        if (from === to) continue; // Same resource — not a handover

        if (!matrix.has(from)) matrix.set(from, new Map());
        const row = matrix.get(from);
        row.set(to, (row.get(to) || 0) + 1);
      }
    }

    // Convert to serializable format
    const entries = [];
    for (const [from, targets] of matrix) {
      for (const [to, count] of targets) {
        entries.push({ from, to, count });
      }
    }

    return {
      entries: entries.sort((a, b) => b.count - a.count),
      topHandovers: entries.slice(0, 20),
      totalHandovers: entries.reduce((s, e) => s + e.count, 0),
      uniquePairs: entries.length,
    };
  }

  // ── Working Together ─────────────────────────────────────────

  /**
   * Working together metric: how often two resources work on the same case.
   */
  _buildWorkingTogetherMatrix(eventLog) {
    const caseResources = new Map(); // caseId → Set<resource>
    const traces = this._getTraces(eventLog);

    for (const [caseId, trace] of traces) {
      const resources = new Set();
      for (const event of (trace.events || [])) {
        if (event.resource) resources.add(event.resource);
      }
      if (resources.size >= 2) {
        caseResources.set(caseId, resources);
      }
    }

    // Build co-occurrence matrix
    const pairs = new Map();

    for (const [, resources] of caseResources) {
      const list = Array.from(resources);
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const key = [list[i], list[j]].sort().join('|');
          pairs.set(key, (pairs.get(key) || 0) + 1);
        }
      }
    }

    const entries = Array.from(pairs.entries())
      .map(([key, count]) => {
        const [a, b] = key.split('|');
        return { resourceA: a, resourceB: b, sharedCases: count };
      })
      .sort((a, b) => b.sharedCases - a.sharedCases);

    return {
      entries: entries.slice(0, 50),
      totalPairs: entries.length,
      casesWithMultipleResources: caseResources.size,
    };
  }

  // ── Resource Utilization ─────────────────────────────────────

  _analyzeUtilization(eventLog) {
    const resources = new Map(); // resource → { activities, cases, events, timeRange }
    const traces = this._getTraces(eventLog);

    for (const [caseId, trace] of traces) {
      for (const event of (trace.events || [])) {
        if (!event.resource) continue;

        if (!resources.has(event.resource)) {
          resources.set(event.resource, {
            activities: new Map(),
            cases: new Set(),
            eventCount: 0,
            timestamps: [],
          });
        }

        const r = resources.get(event.resource);
        r.cases.add(caseId);
        r.eventCount++;
        r.activities.set(event.activity, (r.activities.get(event.activity) || 0) + 1);
        if (event.timestamp) r.timestamps.push(event.timestamp);
      }
    }

    const result = [];
    for (const [resource, data] of resources) {
      const topActivities = Array.from(data.activities.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([activity, count]) => ({ activity, count }));

      result.push({
        resource,
        caseCount: data.cases.size,
        eventCount: data.eventCount,
        uniqueActivities: data.activities.size,
        topActivities,
        avgEventsPerCase: data.cases.size > 0 ? Math.round((data.eventCount / data.cases.size) * 100) / 100 : 0,
      });
    }

    result.sort((a, b) => b.eventCount - a.eventCount);

    // Calculate workload distribution statistics
    const eventCounts = result.map(r => r.eventCount);
    const mean = eventCounts.length > 0 ? eventCounts.reduce((s, v) => s + v, 0) / eventCounts.length : 0;
    const variance = eventCounts.length > 0 ? eventCounts.reduce((s, v) => s + (v - mean) ** 2, 0) / eventCounts.length : 0;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0; // Coefficient of variation

    return {
      resources: result,
      totalResources: result.length,
      workloadDistribution: {
        mean: Math.round(mean),
        stddev: Math.round(Math.sqrt(variance)),
        coefficientOfVariation: Math.round(cv * 100) / 100,
        isBalanced: cv < 0.5, // CV < 0.5 indicates relatively balanced workload
      },
    };
  }

  // ── Activity-Resource Matrix ─────────────────────────────────

  _buildActivityResourceMatrix(eventLog) {
    const matrix = new Map(); // activity → Map<resource, count>
    const traces = this._getTraces(eventLog);

    for (const [, trace] of traces) {
      for (const event of (trace.events || [])) {
        if (!event.resource) continue;
        if (!matrix.has(event.activity)) matrix.set(event.activity, new Map());
        const row = matrix.get(event.activity);
        row.set(event.resource, (row.get(event.resource) || 0) + 1);
      }
    }

    const entries = [];
    for (const [activity, resourceMap] of matrix) {
      const resourceEntries = Array.from(resourceMap.entries())
        .sort((a, b) => b[1] - a[1]);

      entries.push({
        activity,
        totalExecutions: resourceEntries.reduce((s, [, c]) => s + c, 0),
        resourceCount: resourceEntries.length,
        primaryResource: resourceEntries[0] ? resourceEntries[0][0] : null,
        primaryResourceShare: resourceEntries[0] && resourceEntries.reduce((s, [, c]) => s + c, 0) > 0
          ? Math.round((resourceEntries[0][1] / resourceEntries.reduce((s, [, c]) => s + c, 0)) * 100)
          : 0,
        resources: resourceEntries.slice(0, 5).map(([resource, count]) => ({ resource, count })),
      });
    }

    return entries.sort((a, b) => b.totalExecutions - a.totalExecutions);
  }

  // ── Segregation of Duties ────────────────────────────────────

  /**
   * Check for SoD violations: cases where the same resource performed
   * activities that should be done by different people.
   *
   * @param {EventLog} eventLog
   * @param {Array<{activities: string[], name: string}>} rules
   */
  _checkSegregationOfDuties(eventLog, rules) {
    if (rules.length === 0) {
      // Default SoD rules common in SAP
      rules = [
        { name: 'Create PO / Approve PO', activities: ['Create Purchase Order', 'Approve Purchase Order'] },
        { name: 'Create PR / Approve PR', activities: ['Create Purchase Requisition', 'Approve Purchase Requisition'] },
        { name: 'Create Invoice / Approve Payment', activities: ['Create Invoice', 'Payment Run'] },
        { name: 'Goods Receipt / Invoice Receipt', activities: ['Goods Receipt', 'Invoice Receipt'] },
        { name: 'Create JE / Approve JE', activities: ['Create Journal Entry', 'Approve Journal Entry'] },
        { name: 'Create Asset / Retire Asset', activities: ['Create Asset Master', 'Retire Asset'] },
      ];
    }

    const violations = [];
    const traces = this._getTraces(eventLog);

    for (const rule of rules) {
      const ruleActivities = new Set(rule.activities);
      let violationCount = 0;
      const violatingCases = [];

      for (const [caseId, trace] of traces) {
        // Map: activity → Set<resources> for this case
        const activityResources = new Map();

        for (const event of (trace.events || [])) {
          if (!event.resource || !ruleActivities.has(event.activity)) continue;
          if (!activityResources.has(event.activity)) activityResources.set(event.activity, new Set());
          activityResources.get(event.activity).add(event.resource);
        }

        // Check if same resource performed multiple conflicting activities
        if (activityResources.size >= 2) {
          const allResources = Array.from(activityResources.values());
          for (let i = 0; i < allResources.length; i++) {
            for (let j = i + 1; j < allResources.length; j++) {
              const overlap = [...allResources[i]].filter(r => allResources[j].has(r));
              if (overlap.length > 0) {
                violationCount++;
                if (violatingCases.length < 10) {
                  violatingCases.push({ caseId, resources: overlap });
                }
              }
            }
          }
        }
      }

      violations.push({
        rule: rule.name,
        activities: rule.activities,
        violationCount,
        violatingCases,
        status: violationCount === 0 ? 'compliant' : 'violation',
      });
    }

    return {
      rules: violations,
      totalViolations: violations.reduce((s, v) => s + v.violationCount, 0),
      rulesChecked: violations.length,
      rulesViolated: violations.filter(v => v.violationCount > 0).length,
    };
  }

  // ── Centrality Metrics ───────────────────────────────────────

  /**
   * Calculate basic centrality metrics for the handover network.
   */
  _calculateCentrality(handoverMatrix) {
    const inDegree = new Map();
    const outDegree = new Map();
    const totalIn = new Map();
    const totalOut = new Map();

    for (const entry of handoverMatrix.entries) {
      outDegree.set(entry.from, (outDegree.get(entry.from) || 0) + 1);
      inDegree.set(entry.to, (inDegree.get(entry.to) || 0) + 1);
      totalOut.set(entry.from, (totalOut.get(entry.from) || 0) + entry.count);
      totalIn.set(entry.to, (totalIn.get(entry.to) || 0) + entry.count);
    }

    const allResources = new Set([...inDegree.keys(), ...outDegree.keys()]);
    const results = [];

    for (const resource of allResources) {
      const inD = inDegree.get(resource) || 0;
      const outD = outDegree.get(resource) || 0;
      const inVol = totalIn.get(resource) || 0;
      const outVol = totalOut.get(resource) || 0;

      results.push({
        resource,
        inDegree: inD,
        outDegree: outD,
        totalDegree: inD + outD,
        inVolume: inVol,
        outVolume: outVol,
        totalVolume: inVol + outVol,
        // Betweenness proxy: resources with both high in and out are central
        centralityScore: Math.round(Math.sqrt(inVol * outVol) * 100) / 100,
      });
    }

    return results.sort((a, b) => b.centralityScore - a.centralityScore);
  }

  _getTraces(eventLog) {
    const traces = eventLog.traces || eventLog._traces;
    return traces instanceof Map ? traces : new Map(Object.entries(traces || {}));
  }
}

/**
 * SocialNetworkResult
 */
class SocialNetworkResult {
  constructor({ handoverMatrix, workingTogether, resourceUtilization, activityResourceMatrix, sodViolations, centralityMetrics, resourceCount, caseCount }) {
    this.handoverMatrix = handoverMatrix;
    this.workingTogether = workingTogether;
    this.resourceUtilization = resourceUtilization;
    this.activityResourceMatrix = activityResourceMatrix;
    this.sodViolations = sodViolations;
    this.centralityMetrics = centralityMetrics;
    this.resourceCount = resourceCount;
    this.caseCount = caseCount;
  }

  getSummary() {
    return {
      resourceCount: this.resourceCount,
      caseCount: this.caseCount,
      totalHandovers: this.handoverMatrix.totalHandovers,
      uniqueHandoverPairs: this.handoverMatrix.uniquePairs,
      casesWithMultipleResources: this.workingTogether.casesWithMultipleResources,
      workloadBalanced: this.resourceUtilization.workloadDistribution.isBalanced,
      sodViolations: this.sodViolations.totalViolations,
      sodRulesViolated: this.sodViolations.rulesViolated,
      mostCentralResource: this.centralityMetrics.length > 0 ? this.centralityMetrics[0].resource : null,
    };
  }

  toJSON() {
    return {
      summary: this.getSummary(),
      handoverMatrix: this.handoverMatrix,
      workingTogether: this.workingTogether,
      resourceUtilization: this.resourceUtilization,
      activityResourceMatrix: this.activityResourceMatrix,
      sodViolations: this.sodViolations,
      centralityMetrics: this.centralityMetrics,
    };
  }
}

module.exports = { SocialNetworkMiner, SocialNetworkResult };
