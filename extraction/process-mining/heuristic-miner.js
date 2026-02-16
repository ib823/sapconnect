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
 * Heuristic Miner — Process Discovery Algorithm
 *
 * Discovers a process model from an event log using frequency-based
 * dependency measures. Handles noise, short loops, and parallel activities.
 *
 * Based on: Weijters et al. (2003) "Workflow Mining: Discovering Process Models
 * from Event Logs" — the industry standard for real-world SAP event logs.
 *
 * Output: A dependency net (causal net / heuristics net) that can be rendered
 * as a process map or converted to BPMN/Petri net.
 */

const Logger = require('../../lib/logger');

/**
 * ProcessModel — Output of the Heuristic Miner
 *
 * Represents a discovered process as a dependency net with
 * activities, edges, gateways, and loop information.
 */
class ProcessModel {
  constructor({ activities, edges, startActivities, endActivities, loopsL1, loopsL2, gateways, dfMatrix, depMatrix, caseCount, eventCount }) {
    this.activities = activities;
    this.edges = edges;
    this.startActivities = startActivities;
    this.endActivities = endActivities;
    this.loopsL1 = loopsL1 || [];
    this.loopsL2 = loopsL2 || [];
    this.gateways = gateways || [];
    this.dfMatrix = dfMatrix;
    this.depMatrix = depMatrix;
    this.caseCount = caseCount;
    this.eventCount = eventCount;
  }

  /** Get all successor activities for a given activity */
  getSuccessors(activity) {
    return this.edges.filter(e => e.source === activity).map(e => e.target);
  }

  /** Get all predecessor activities for a given activity */
  getPredecessors(activity) {
    return this.edges.filter(e => e.target === activity).map(e => e.source);
  }

  /** Check if a transition exists in the model */
  hasTransition(from, to) {
    return this.edges.some(e => e.source === from && e.target === to);
  }

  /** Get edge details for a specific transition */
  getEdge(from, to) {
    return this.edges.find(e => e.source === from && e.target === to) || null;
  }

  /** Activities with length-1 loops (self-repetition) */
  getSelfLoopActivities() {
    return this.loopsL1.map(l => l.activity);
  }

  /** Get all AND-split gateways */
  getAndSplits() {
    return this.gateways.filter(g => g.type === 'and' && g.gatewayType === 'split');
  }

  /** Get all XOR-split gateways (decision points) */
  getXorSplits() {
    return this.gateways.filter(g => g.type === 'xor' && g.gatewayType === 'split');
  }

  /** Get the directly-follows count between two activities */
  getDirectlyFollowsCount(a, b) {
    const row = this.dfMatrix.get(a);
    return row ? (row.get(b) || 0) : 0;
  }

  /** Get the dependency measure between two activities */
  getDependencyMeasure(a, b) {
    const row = this.depMatrix.get(a);
    return row ? (row.get(b) || 0) : 0;
  }

  /** Convert to serializable JSON */
  toJSON() {
    return {
      activities: this.activities,
      edges: this.edges,
      startActivities: this.startActivities,
      endActivities: this.endActivities,
      loopsL1: this.loopsL1,
      loopsL2: this.loopsL2,
      gateways: this.gateways,
      stats: {
        activityCount: this.activities.length,
        edgeCount: this.edges.length,
        gatewayCount: this.gateways.length,
        loopCount: this.loopsL1.length + this.loopsL2.length,
        caseCount: this.caseCount,
        eventCount: this.eventCount,
      },
    };
  }

  /** Generate a human-readable process description */
  toText() {
    const lines = [];
    lines.push(`Process Model: ${this.activities.length} activities, ${this.edges.length} edges`);
    lines.push(`Cases: ${this.caseCount}, Events: ${this.eventCount}`);
    lines.push('');
    lines.push('Start Activities:');
    for (const s of this.startActivities) {
      lines.push(`  → ${s.activity} (${s.count} cases)`);
    }
    lines.push('');
    lines.push('Edges (dependency):');
    for (const e of this.edges.sort((a, b) => b.frequency - a.frequency)) {
      lines.push(`  ${e.source} → ${e.target} [freq=${e.frequency}, dep=${e.dependency}]`);
    }
    if (this.loopsL1.length > 0) {
      lines.push('');
      lines.push('Self-loops:');
      for (const l of this.loopsL1) {
        lines.push(`  ↻ ${l.activity} [freq=${l.frequency}]`);
      }
    }
    if (this.loopsL2.length > 0) {
      lines.push('');
      lines.push('Length-2 loops:');
      for (const l of this.loopsL2) {
        lines.push(`  ↻ ${l.activities[0]} ↔ ${l.activities[1]} [freq=${l.frequency}]`);
      }
    }
    if (this.gateways.length > 0) {
      lines.push('');
      lines.push('Gateways:');
      for (const g of this.gateways) {
        lines.push(`  ${g.type.toUpperCase()}-${g.gatewayType}: ${g.activity} → [${g.branches.join(', ')}]`);
      }
    }
    lines.push('');
    lines.push('End Activities:');
    for (const e of this.endActivities) {
      lines.push(`  ${e.activity} → ■ (${e.count} cases)`);
    }
    return lines.join('\n');
  }
}

class HeuristicMiner {
  /**
   * @param {object} [options]
   * @param {number} [options.dependencyThreshold=0.5] — Minimum dependency measure to keep an edge (0-1)
   * @param {number} [options.andThreshold=0.1] — Threshold for detecting AND splits/joins
   * @param {number} [options.loopLengthOneThreshold=0.5] — Threshold for length-1 loops (a→a)
   * @param {number} [options.loopLengthTwoThreshold=0.5] — Threshold for length-2 loops (a→b→a)
   * @param {number} [options.relativeTobestThreshold=0.05] — Keep edge if within this ratio of the best edge
   * @param {number} [options.minFrequency=1] — Minimum directly-follows count to consider
   * @param {string} [options.logLevel]
   */
  constructor(options = {}) {
    this.dependencyThreshold = options.dependencyThreshold ?? 0.5;
    this.andThreshold = options.andThreshold ?? 0.1;
    this.loopLengthOneThreshold = options.loopLengthOneThreshold ?? 0.5;
    this.loopLengthTwoThreshold = options.loopLengthTwoThreshold ?? 0.5;
    this.relativeToBestThreshold = options.relativeToBestThreshold ?? 0.05;
    this.minFrequency = options.minFrequency ?? 1;
    this.log = new Logger('heuristic-miner', { level: options.logLevel || 'info' });
  }

  /**
   * Discover a process model from an event log.
   *
   * @param {import('./event-log').EventLog} eventLog
   * @returns {ProcessModel}
   */
  mine(eventLog) {
    this.log.info(`Mining process model from ${eventLog.getCaseCount()} cases, ${eventLog.getEventCount()} events`);

    // Step 1: Build directly-follows frequency matrix
    const dfMatrix = this._buildDirectlyFollowsMatrix(eventLog);

    // Step 2: Compute dependency measures
    const depMatrix = this._computeDependencyMeasures(dfMatrix);

    // Step 3: Detect length-1 loops (a→a)
    const loopsL1 = this._detectLoopsLength1(dfMatrix);

    // Step 4: Detect length-2 loops (a→b→a)
    const loopsL2 = this._detectLoopsLength2(eventLog, dfMatrix);

    // Step 5: Apply thresholds and build dependency net
    const edges = this._buildDependencyNet(depMatrix, dfMatrix);

    // Step 6: Detect start and end activities
    const startActivities = this._getStartActivities(eventLog);
    const endActivities = this._getEndActivities(eventLog);

    // Step 7: Detect AND/XOR splits and joins
    const gateways = this._detectGateways(edges, dfMatrix, eventLog);

    // Step 8: Build the process model
    const activities = Array.from(eventLog.getActivitySet());
    const model = new ProcessModel({
      activities,
      edges,
      startActivities,
      endActivities,
      loopsL1,
      loopsL2,
      gateways,
      dfMatrix,
      depMatrix,
      caseCount: eventLog.getCaseCount(),
      eventCount: eventLog.getEventCount(),
    });

    this.log.info(`Discovered model: ${activities.length} activities, ${edges.length} edges, ${gateways.length} gateways`);
    return model;
  }

  // ── Step 1: Directly-Follows Matrix ──────────────────────────

  _buildDirectlyFollowsMatrix(eventLog) {
    const matrix = new Map();

    const ensureActivity = (a) => {
      if (!matrix.has(a)) matrix.set(a, new Map());
    };

    const traces = eventLog.traces || eventLog._traces;
    const traceMap = traces instanceof Map ? traces : new Map(Object.entries(traces || {}));

    for (const [, trace] of traceMap) {
      const events = trace.events || [];
      for (let i = 0; i < events.length - 1; i++) {
        const a = events[i].activity;
        const b = events[i + 1].activity;
        ensureActivity(a);
        ensureActivity(b);
        const row = matrix.get(a);
        row.set(b, (row.get(b) || 0) + 1);
      }
    }

    return matrix;
  }

  // ── Step 2: Dependency Measures ──────────────────────────────

  /**
   * Dependency measure: |a→b| = (|a>b| - |b>a|) / (|a>b| + |b>a| + 1)
   * Range: -1 to +1. Positive means a likely causes b.
   */
  _computeDependencyMeasures(dfMatrix) {
    const depMatrix = new Map();
    const allActivities = new Set(dfMatrix.keys());
    for (const [, targets] of dfMatrix) {
      for (const target of targets.keys()) allActivities.add(target);
    }

    for (const a of allActivities) {
      depMatrix.set(a, new Map());
      for (const b of allActivities) {
        const ab = this._getDF(dfMatrix, a, b);
        const ba = this._getDF(dfMatrix, b, a);

        let dep;
        if (a === b) {
          // Self-loop dependency: |a→a| / (|a→a| + 1)
          dep = ab / (ab + 1);
        } else {
          dep = (ab - ba) / (ab + ba + 1);
        }

        depMatrix.get(a).set(b, dep);
      }
    }

    return depMatrix;
  }

  _getDF(dfMatrix, a, b) {
    const row = dfMatrix.get(a);
    return row ? (row.get(b) || 0) : 0;
  }

  // ── Step 3: Length-1 Loops ───────────────────────────────────

  _detectLoopsLength1(dfMatrix) {
    const loops = [];

    for (const [a, targets] of dfMatrix) {
      const selfCount = targets.get(a) || 0;
      if (selfCount > 0) {
        const dep = selfCount / (selfCount + 1);
        if (dep >= this.loopLengthOneThreshold) {
          loops.push({ activity: a, frequency: selfCount, dependency: Math.round(dep * 1000) / 1000 });
        }
      }
    }

    return loops;
  }

  // ── Step 4: Length-2 Loops ───────────────────────────────────

  _detectLoopsLength2(eventLog, dfMatrix) {
    // Count a→b→a patterns
    const l2Count = new Map();

    const traces = eventLog.traces || eventLog._traces;
    const traceMap = traces instanceof Map ? traces : new Map(Object.entries(traces || {}));

    for (const [, trace] of traceMap) {
      const events = trace.events || [];
      for (let i = 0; i < events.length - 2; i++) {
        const a = events[i].activity;
        const b = events[i + 1].activity;
        const c = events[i + 2].activity;
        if (a === c && a !== b) {
          const key = `${a}|${b}`;
          l2Count.set(key, (l2Count.get(key) || 0) + 1);
        }
      }
    }

    const loops = [];
    for (const [key, count] of l2Count) {
      const [a, b] = key.split('|');
      const ab = this._getDF(dfMatrix, a, b);
      const ba = this._getDF(dfMatrix, b, a);
      // Length-2 loop dependency: (|a→b→a| + |b→a→b|) / (|a→b→a| + |b→a→b| + 1)
      const reverseKey = `${b}|${a}`;
      const reverseCount = l2Count.get(reverseKey) || 0;
      const dep = (count + reverseCount) / (count + reverseCount + 1);
      if (dep >= this.loopLengthTwoThreshold) {
        loops.push({
          activities: [a, b],
          frequency: count,
          reverseFrequency: reverseCount,
          dependency: Math.round(dep * 1000) / 1000,
        });
      }
    }

    return loops;
  }

  // ── Step 5: Build Dependency Net ─────────────────────────────

  _buildDependencyNet(depMatrix, dfMatrix) {
    const edges = [];

    for (const [a, targets] of depMatrix) {
      // Find the best dependency for each source activity
      let bestDep = -1;
      for (const [b, dep] of targets) {
        if (a === b) continue; // Skip self-loops (handled separately)
        if (dep > bestDep) bestDep = dep;
      }

      for (const [b, dep] of targets) {
        if (a === b) continue;
        const freq = this._getDF(dfMatrix, a, b);

        if (freq < this.minFrequency) continue;

        // Keep edge if:
        // 1. Above absolute threshold, OR
        // 2. Within relative-to-best threshold
        const aboveThreshold = dep >= this.dependencyThreshold;
        const relativeToBest = bestDep > 0 && (bestDep - dep) <= this.relativeToBestThreshold;

        if (aboveThreshold || relativeToBest) {
          edges.push({
            source: a,
            target: b,
            frequency: freq,
            dependency: Math.round(dep * 1000) / 1000,
          });
        }
      }
    }

    return edges;
  }

  // ── Step 6: Start/End Activities ─────────────────────────────

  _getStartActivities(eventLog) {
    const starts = new Map();
    const traces = eventLog.traces || eventLog._traces;
    const traceMap = traces instanceof Map ? traces : new Map(Object.entries(traces || {}));

    for (const [, trace] of traceMap) {
      const events = trace.events || [];
      if (events.length > 0) {
        const first = events[0].activity;
        starts.set(first, (starts.get(first) || 0) + 1);
      }
    }

    return Array.from(starts.entries())
      .map(([activity, count]) => ({ activity, count }))
      .sort((a, b) => b.count - a.count);
  }

  _getEndActivities(eventLog) {
    const ends = new Map();
    const traces = eventLog.traces || eventLog._traces;
    const traceMap = traces instanceof Map ? traces : new Map(Object.entries(traces || {}));

    for (const [, trace] of traceMap) {
      const events = trace.events || [];
      if (events.length > 0) {
        const last = events[events.length - 1].activity;
        ends.set(last, (ends.get(last) || 0) + 1);
      }
    }

    return Array.from(ends.entries())
      .map(([activity, count]) => ({ activity, count }))
      .sort((a, b) => b.count - a.count);
  }

  // ── Step 7: Gateway Detection ────────────────────────────────

  /**
   * Detect AND/XOR splits and joins.
   *
   * AND split: Activity a is followed by both b and c, and b||c appear frequently together
   * XOR split: Activity a is followed by either b or c, but rarely both
   *
   * Measure: |b→c| + |c→b| / (|a→b| + |a→c|)
   * High → AND (parallel), Low → XOR (choice)
   */
  _detectGateways(edges, dfMatrix, eventLog) {
    const gateways = [];

    // Group edges by source (splits) and target (joins)
    const outgoing = new Map();
    const incoming = new Map();

    for (const edge of edges) {
      if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
      outgoing.get(edge.source).push(edge);

      if (!incoming.has(edge.target)) incoming.set(edge.target, []);
      incoming.get(edge.target).push(edge);
    }

    // Detect splits
    for (const [activity, outs] of outgoing) {
      if (outs.length < 2) continue;

      const targets = outs.map(e => e.target);
      const type = this._classifyGateway(targets, dfMatrix, eventLog);

      gateways.push({
        type: type,
        gatewayType: 'split',
        activity,
        branches: targets,
        branchFrequencies: outs.map(e => ({ target: e.target, frequency: e.frequency })),
      });
    }

    // Detect joins
    for (const [activity, ins] of incoming) {
      if (ins.length < 2) continue;

      const sources = ins.map(e => e.source);
      const type = this._classifyGateway(sources, dfMatrix, eventLog);

      gateways.push({
        type: type,
        gatewayType: 'join',
        activity,
        branches: sources,
        branchFrequencies: ins.map(e => ({ source: e.source, frequency: e.frequency })),
      });
    }

    return gateways;
  }

  _classifyGateway(activities, dfMatrix, eventLog) {
    if (activities.length < 2) return 'sequence';

    // Check co-occurrence: do activities appear together in the same cases?
    const traces = eventLog.traces || eventLog._traces;
    const traceMap = traces instanceof Map ? traces : new Map(Object.entries(traces || {}));

    let bothCount = 0;
    let eitherCount = 0;

    for (const [, trace] of traceMap) {
      const traceActivities = new Set((trace.events || []).map(e => e.activity));
      const present = activities.filter(a => traceActivities.has(a));

      if (present.length >= 2) bothCount++;
      if (present.length >= 1) eitherCount++;
    }

    if (eitherCount === 0) return 'xor';

    const coOccurrenceRate = bothCount / eitherCount;

    // High co-occurrence → AND (parallel), low → XOR (choice)
    if (coOccurrenceRate > (1 - this.andThreshold)) return 'and';
    if (coOccurrenceRate < this.andThreshold) return 'xor';
    return 'or'; // Mixed — inclusive OR
  }
}

module.exports = { HeuristicMiner, ProcessModel };
