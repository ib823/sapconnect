/**
 * Tests for ConformanceChecker and ConformanceResult
 */

const { ConformanceChecker, ConformanceResult } = require('../../../extraction/process-mining/conformance-checker');
const { ReferenceModel } = require('../../../extraction/process-mining/reference-models');
const { Event, Trace, EventLog } = require('../../../extraction/process-mining/event-log');

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASE = new Date('2025-01-01T00:00:00Z').getTime();
const HOUR = 3_600_000;

/**
 * Build a simple linear reference model: A -> B -> C -> D -> E
 */
function buildLinearModel() {
  return new ReferenceModel({
    id: 'TEST',
    name: 'Test Linear Model',
    activities: ['A', 'B', 'C', 'D', 'E'],
    edges: [
      { from: 'A', to: 'B', type: 'sequence' },
      { from: 'B', to: 'C', type: 'sequence' },
      { from: 'C', to: 'D', type: 'sequence' },
      { from: 'D', to: 'E', type: 'sequence' },
    ],
    startActivities: ['A'],
    endActivities: ['E'],
    slaTargets: {},
    criticalTransitions: [],
  });
}

/**
 * Build a branching model: A -> B -> C -> E, with B -> D -> E as alternative
 */
function buildBranchingModel() {
  return new ReferenceModel({
    id: 'BRANCH',
    name: 'Test Branching Model',
    activities: ['A', 'B', 'C', 'D', 'E'],
    edges: [
      { from: 'A', to: 'B', type: 'sequence' },
      { from: 'B', to: 'C', type: 'sequence' },
      { from: 'B', to: 'D', type: 'choice' },
      { from: 'C', to: 'E', type: 'sequence' },
      { from: 'D', to: 'E', type: 'sequence' },
    ],
    startActivities: ['A'],
    endActivities: ['E'],
    slaTargets: {},
    criticalTransitions: [],
  });
}

/**
 * Build an event log from an array of trace descriptions.
 * @param {Array<{ caseId: string, activities: string[] }>} traces
 * @returns {EventLog}
 */
function buildLog(traces) {
  const log = new EventLog('TestLog');
  for (const t of traces) {
    const trace = new Trace(t.caseId);
    t.activities.forEach((activity, i) => {
      trace.addEvent(new Event({
        activity,
        timestamp: new Date(BASE + i * HOUR),
      }));
    });
    log.addTrace(trace);
  }
  return log;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ConformanceChecker', () => {
  let checker;

  beforeEach(() => {
    checker = new ConformanceChecker({ logLevel: 'silent' });
  });

  // 1
  describe('perfectly conformant trace', () => {
    it('returns fitness 1.0 and no deviations for a trace matching the model', () => {
      const model = buildLinearModel();
      const log = buildLog([{ caseId: 'C1', activities: ['A', 'B', 'C', 'D', 'E'] }]);

      const result = checker.check(log, model);

      expect(result.fitness).toBe(1);
      expect(result.caseResults[0].fitness).toBe(1);
      expect(result.caseResults[0].deviations.length).toBe(0);
      expect(result.caseResults[0].isConformant).toBe(true);
    });
  });

  // 2
  describe('trace with skip', () => {
    it('detects skipped activities and reports fitness < 1', () => {
      const model = buildLinearModel();
      // Skip B and C: A -> D -> E (model has A->B->C->D->E)
      // A is valid start. A->D has no direct edge, BFS from A finds B,C as skipped path
      const log = buildLog([{ caseId: 'C1', activities: ['A', 'D', 'E'] }]);

      const result = checker.check(log, model);

      expect(result.fitness).toBeLessThan(1);
      const skipDevs = result.caseResults[0].deviations.filter(d => d.type === 'skip');
      expect(skipDevs.length).toBeGreaterThan(0);
      // Skipped B and C
      const skippedActivities = skipDevs.map(d => d.skippedActivity);
      expect(skippedActivities).toContain('B');
      expect(skippedActivities).toContain('C');
    });
  });

  // 3
  describe('trace with insert', () => {
    it('detects activities not in model as insertions', () => {
      const model = buildLinearModel();
      // Insert X which is not in the model: A -> B -> X -> C -> D -> E
      const log = buildLog([{ caseId: 'C1', activities: ['A', 'B', 'X', 'C', 'D', 'E'] }]);

      const result = checker.check(log, model);

      expect(result.fitness).toBeLessThan(1);
      const insertDevs = result.caseResults[0].deviations.filter(d => d.type === 'insert');
      expect(insertDevs.length).toBeGreaterThanOrEqual(1);
      expect(insertDevs[0].activity).toBe('X');
    });
  });

  // 4
  describe('invalid transition', () => {
    it('detects transition not in model edges and no BFS path', () => {
      const model = buildLinearModel();
      // E -> A is not in model (reversed), but both exist
      // Use a case that starts correctly then makes an invalid jump
      // A -> B -> E -> D (E has no successor to D in model; E is end; D is valid activity)
      const log = buildLog([{ caseId: 'C1', activities: ['A', 'B', 'E', 'D'] }]);

      const result = checker.check(log, model);

      // B->E: BFS from B finds C,D,E as path so skips C,D
      // E->D: E has no successors in model, so invalid_transition
      const invalidDevs = result.caseResults[0].deviations.filter(d => d.type === 'invalid_transition');
      expect(invalidDevs.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 5
  describe('unexpected start', () => {
    it('detects when first activity is not in model start activities', () => {
      const model = buildLinearModel(); // start = ['A']
      const log = buildLog([{ caseId: 'C1', activities: ['C', 'D', 'E'] }]);

      const result = checker.check(log, model);

      const startDevs = result.caseResults[0].deviations.filter(d => d.type === 'unexpected_start');
      expect(startDevs.length).toBe(1);
      expect(startDevs[0].activity).toBe('C');
      expect(startDevs[0].expected).toContain('A');
    });
  });

  // 6
  describe('premature end', () => {
    it('detects when last activity is not in model end activities', () => {
      const model = buildLinearModel(); // end = ['E']
      const log = buildLog([{ caseId: 'C1', activities: ['A', 'B', 'C'] }]);

      const result = checker.check(log, model);

      const endDevs = result.caseResults[0].deviations.filter(d => d.type === 'premature_end');
      expect(endDevs.length).toBe(1);
      expect(endDevs[0].activity).toBe('C');
      expect(endDevs[0].expectedEndActivities).toContain('E');
    });
  });

  // 7
  describe('overall fitness formula', () => {
    it('calculates fitness as 0.5*(1-missing/consumed)+0.5*(1-remaining/produced)', () => {
      const model = buildLinearModel();
      // A perfectly conformant trace: all tokens consumed, none missing, none remaining
      const log = buildLog([{ caseId: 'C1', activities: ['A', 'B', 'C', 'D', 'E'] }]);

      const result = checker.check(log, model);

      const c = result.counters;
      const expectedFitness = 0.5 * (1 - c.missing / c.consumed) + 0.5 * (1 - c.remaining / c.produced);
      expect(result.fitness).toBeCloseTo(expectedFitness, 3);
    });

    it('produces lower fitness for non-conformant traces', () => {
      const model = buildLinearModel();
      // Skip B,C,D: A -> E (skips 3 activities)
      const log = buildLog([{ caseId: 'C1', activities: ['A', 'E'] }]);

      const result = checker.check(log, model);
      expect(result.fitness).toBeLessThan(1);
      expect(result.fitness).toBeGreaterThan(0);

      const c = result.counters;
      const expectedFitness = 0.5 * (1 - c.missing / c.consumed) + 0.5 * (1 - c.remaining / c.produced);
      expect(result.fitness).toBeCloseTo(expectedFitness, 3);
    });
  });

  // 8
  describe('precision (escaping edges)', () => {
    it('calculates precision as 1 - escaping/total_enabled', () => {
      const model = buildBranchingModel();
      // Both branches used: A->B->C->E and A->B->D->E
      const log = buildLog([
        { caseId: 'C1', activities: ['A', 'B', 'C', 'E'] },
        { caseId: 'C2', activities: ['A', 'B', 'D', 'E'] },
      ]);

      const result = checker.check(log, model);

      // Model has 5 edges: A->B, B->C, B->D, C->E, D->E
      // Observed: A->B, B->C, C->E, B->D, D->E => all 5 edges observed
      // precision = 1 - 0/5 = 1.0
      expect(result.precision).toBe(1);
    });

    it('reports lower precision when not all model edges are observed', () => {
      const model = buildBranchingModel();
      // Only one branch used: A->B->C->E (B->D and D->E not observed)
      const log = buildLog([
        { caseId: 'C1', activities: ['A', 'B', 'C', 'E'] },
      ]);

      const result = checker.check(log, model);

      // 5 model edges, 3 observed => 2 escaping => precision = 1 - 2/5 = 0.6
      expect(result.precision).toBe(0.6);
    });
  });

  // 9
  describe('conformance rate', () => {
    it('reports correct percentage of fully conformant cases', () => {
      const model = buildLinearModel();
      const log = buildLog([
        { caseId: 'C1', activities: ['A', 'B', 'C', 'D', 'E'] }, // conformant
        { caseId: 'C2', activities: ['A', 'B', 'C', 'D', 'E'] }, // conformant
        { caseId: 'C3', activities: ['A', 'D', 'E'] },           // non-conformant (skip B,C)
        { caseId: 'C4', activities: ['A', 'B', 'X', 'D', 'E'] }, // non-conformant (insert X)
      ]);

      const result = checker.check(log, model);

      expect(result.fullyConformantCases).toBe(2);
      expect(result.totalCases).toBe(4);
      expect(result.conformanceRate).toBe(50);
    });
  });

  // 10
  describe('multiple cases mixed', () => {
    it('computes correct aggregate stats with mixed conformant and non-conformant cases', () => {
      const model = buildLinearModel();
      const log = buildLog([
        { caseId: 'C1', activities: ['A', 'B', 'C', 'D', 'E'] },       // perfect
        { caseId: 'C2', activities: ['A', 'B', 'C', 'D', 'E'] },       // perfect
        { caseId: 'C3', activities: ['A', 'C', 'D', 'E'] },            // skip B
        { caseId: 'C4', activities: ['A', 'B', 'C', 'D', 'E', 'X'] },  // insert X
        { caseId: 'C5', activities: ['B', 'C', 'D', 'E'] },            // unexpected start
      ]);

      const result = checker.check(log, model);

      expect(result.totalCases).toBe(5);
      expect(result.fullyConformantCases).toBe(2);
      expect(result.fitness).toBeLessThan(1);
      expect(result.fitness).toBeGreaterThan(0);
      expect(result.deviationStats.totalDeviations).toBeGreaterThan(0);
      expect(result.deviationStats.casesWithDeviations).toBe(3);
    });
  });

  // 11
  describe('deviation aggregation', () => {
    it('correctly aggregates deviations by type and by activity', () => {
      const model = buildLinearModel();
      const log = buildLog([
        { caseId: 'C1', activities: ['A', 'D', 'E'] },                // skip B,C
        { caseId: 'C2', activities: ['A', 'B', 'X', 'C', 'D', 'E'] }, // insert X
        { caseId: 'C3', activities: ['C', 'D', 'E'] },                // unexpected start
      ]);

      const result = checker.check(log, model);
      const stats = result.deviationStats;

      expect(stats.byType).toBeDefined();
      expect(typeof stats.byType).toBe('object');
      // We expect skip, insert, and unexpected_start types
      const expectedTypes = ['skip', 'insert', 'unexpected_start'];
      for (const t of expectedTypes) {
        expect(stats.byType[t]).toBeGreaterThanOrEqual(1);
      }

      expect(stats.byActivity).toBeDefined();
      expect(Array.isArray(stats.byActivity)).toBe(true);
      expect(stats.byActivity.length).toBeGreaterThan(0);
      // Each entry has { activity, count }
      for (const entry of stats.byActivity) {
        expect(entry).toHaveProperty('activity');
        expect(entry).toHaveProperty('count');
        expect(entry.count).toBeGreaterThan(0);
      }
    });
  });

  // 12
  describe('ConformanceResult.getSummary()', () => {
    it('returns an object with fitness, precision, and conformanceRate', () => {
      const model = buildLinearModel();
      const log = buildLog([
        { caseId: 'C1', activities: ['A', 'B', 'C', 'D', 'E'] },
      ]);

      const result = checker.check(log, model);
      const summary = result.getSummary();

      expect(summary).toHaveProperty('referenceModel', 'Test Linear Model');
      expect(summary).toHaveProperty('fitness');
      expect(summary).toHaveProperty('precision');
      expect(summary).toHaveProperty('conformanceRate');
      expect(summary).toHaveProperty('fullyConformantCases');
      expect(summary).toHaveProperty('totalCases');
      expect(summary).toHaveProperty('totalDeviations');
      expect(summary).toHaveProperty('topDeviationType');
    });
  });

  // 13
  describe('ConformanceResult.toJSON()', () => {
    it('serializes to a JSON-compatible object', () => {
      const model = buildLinearModel();
      const log = buildLog([
        { caseId: 'C1', activities: ['A', 'B', 'C', 'D', 'E'] },
        { caseId: 'C2', activities: ['A', 'D', 'E'] },
      ]);

      const result = checker.check(log, model);
      const json = result.toJSON();

      expect(json).toHaveProperty('summary');
      expect(json).toHaveProperty('fitness');
      expect(json).toHaveProperty('precision');
      expect(json).toHaveProperty('counters');
      expect(json).toHaveProperty('deviationStats');
      expect(json).toHaveProperty('caseResults');

      // Round-trip through JSON.stringify
      const str = JSON.stringify(json);
      const parsed = JSON.parse(str);
      expect(parsed.fitness).toBe(result.fitness);
      expect(parsed.precision).toBe(result.precision);
    });
  });

  // 14
  describe('empty event log', () => {
    it('handles gracefully with zero cases', () => {
      const model = buildLinearModel();
      const log = new EventLog('Empty');

      const result = checker.check(log, model);

      expect(result.totalCases).toBe(0);
      expect(result.fitness).toBe(1); // No violations when no data
      expect(result.conformanceRate).toBe(100);
      expect(result.deviationStats.totalDeviations).toBe(0);
    });
  });

  // 15
  describe('BFS path finding', () => {
    it('_findSkippedPath finds intermediate activities between from and to', () => {
      const model = buildLinearModel();
      // Build successors map manually as the checker does internally
      const modelSuccessors = new Map();
      for (const edge of model.edges) {
        if (!modelSuccessors.has(edge.from)) modelSuccessors.set(edge.from, new Set());
        modelSuccessors.get(edge.from).add(edge.to);
      }

      // A -> B -> C -> D -> E
      // Path from A to D should skip B and C
      const skipped = checker._findSkippedPath('A', 'D', modelSuccessors);
      expect(skipped).toEqual(['B', 'C']);
    });

    it('returns null when no path exists', () => {
      const modelSuccessors = new Map();
      modelSuccessors.set('A', new Set(['B']));
      modelSuccessors.set('B', new Set(['C']));
      // No path from C to A

      const skipped = checker._findSkippedPath('C', 'A', modelSuccessors);
      expect(skipped).toBeNull();
    });

    it('respects maxDepth limit', () => {
      // Build a long chain: N0 -> N1 -> N2 -> ... -> N10
      const modelSuccessors = new Map();
      for (let i = 0; i < 10; i++) {
        modelSuccessors.set(`N${i}`, new Set([`N${i + 1}`]));
      }

      // Default maxDepth=5, path from N0 to N7 has 6 intermediates: too deep
      const skipped = checker._findSkippedPath('N0', 'N7', modelSuccessors, 5);
      expect(skipped).toBeNull();

      // Path from N0 to N3 has 2 intermediates: within depth
      const skippedShort = checker._findSkippedPath('N0', 'N3', modelSuccessors, 5);
      expect(skippedShort).toEqual(['N1', 'N2']);
    });
  });

  // 16
  describe('fitness boundary values', () => {
    it('fitness is exactly 1.0 for a perfect trace', () => {
      const model = buildLinearModel();
      const log = buildLog([{ caseId: 'C1', activities: ['A', 'B', 'C', 'D', 'E'] }]);
      const result = checker.check(log, model);

      expect(result.caseResults[0].fitness).toBe(1);
      expect(result.caseResults[0].missing).toBe(0);
      expect(result.caseResults[0].remaining).toBe(0);
    });
  });

  // 17
  describe('multiple deviations in single trace', () => {
    it('tracks all deviations when a trace has skip, insert, and premature end', () => {
      const model = buildLinearModel();
      // A -> X -> D (skip B,C; insert X; premature end at D instead of E)
      const log = buildLog([{ caseId: 'C1', activities: ['A', 'X', 'D'] }]);

      const result = checker.check(log, model);
      const deviations = result.caseResults[0].deviations;
      const types = new Set(deviations.map(d => d.type));

      expect(types.has('insert')).toBe(true);
      expect(deviations.length).toBeGreaterThanOrEqual(2);
      expect(result.caseResults[0].fitness).toBeLessThan(1);
    });
  });

  // 18
  describe('conformance with branching model', () => {
    it('accepts both branches as conformant', () => {
      const model = buildBranchingModel();
      const log = buildLog([
        { caseId: 'C1', activities: ['A', 'B', 'C', 'E'] },
        { caseId: 'C2', activities: ['A', 'B', 'D', 'E'] },
      ]);

      const result = checker.check(log, model);

      expect(result.caseResults[0].isConformant).toBe(true);
      expect(result.caseResults[1].isConformant).toBe(true);
      expect(result.conformanceRate).toBe(100);
      expect(result.fitness).toBe(1);
    });
  });

  // 19
  describe('top deviation type in summary', () => {
    it('reports the most frequent deviation type in getSummary', () => {
      const model = buildLinearModel();
      const log = buildLog([
        { caseId: 'C1', activities: ['A', 'B', 'X', 'C', 'D', 'E'] }, // insert X
        { caseId: 'C2', activities: ['A', 'B', 'Y', 'C', 'D', 'E'] }, // insert Y
        { caseId: 'C3', activities: ['A', 'D', 'E'] },                 // skip B,C
      ]);

      const result = checker.check(log, model);
      const summary = result.getSummary();

      // The topDeviationType should be either 'insert' or 'skip' depending on counts
      expect(['insert', 'skip', 'premature_end']).toContain(summary.topDeviationType);
    });
  });

  // 20
  describe('avg deviations per case', () => {
    it('calculates the average deviations per case correctly', () => {
      const model = buildLinearModel();
      const log = buildLog([
        { caseId: 'C1', activities: ['A', 'B', 'C', 'D', 'E'] }, // 0 deviations
        { caseId: 'C2', activities: ['A', 'B', 'C', 'D', 'E'] }, // 0 deviations
        { caseId: 'C3', activities: ['A', 'B', 'X', 'C', 'D', 'E'] }, // 1 deviation (insert)
      ]);

      const result = checker.check(log, model);

      expect(result.deviationStats.avgDeviationsPerCase).toBeGreaterThan(0);
      // total deviations >= 1, cases = 3
      expect(result.deviationStats.avgDeviationsPerCase).toBeLessThanOrEqual(1);
    });
  });
});
