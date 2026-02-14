const { HeuristicMiner, ProcessModel } = require('../../../extraction/process-mining/heuristic-miner');
const { Event, Trace, EventLog } = require('../../../extraction/process-mining/event-log');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build an EventLog from a compact case definition.
 * Each case is { id, activities: [{ name, ts }] }.
 */
function buildLog(cases) {
  const log = new EventLog('TestLog');
  for (const c of cases) {
    const trace = new Trace(c.id);
    for (const act of c.activities) {
      trace.addEvent(new Event({ activity: act.name, timestamp: act.ts }));
    }
    log.addTrace(trace);
  }
  return log;
}

/**
 * Shorthand: create N identical sequential traces A->B->C with 1-hour steps.
 */
function buildSequentialLog(activities, caseCount, baseDate = '2024-01-15T09:00:00Z') {
  const cases = [];
  for (let i = 0; i < caseCount; i++) {
    const base = new Date(baseDate).getTime() + i * 86400000; // 1 day apart per case
    cases.push({
      id: `CASE-${String(i + 1).padStart(3, '0')}`,
      activities: activities.map((name, idx) => ({
        name,
        ts: new Date(base + idx * 3600000).toISOString(),
      })),
    });
  }
  return buildLog(cases);
}

// SAP P2P activity names used throughout
const CREATE_PO  = 'Create Purchase Order';
const APPROVE_PO = 'Approve Purchase Order';
const GR         = 'Goods Receipt';
const IR         = 'Invoice Receipt';
const PAYMENT    = 'Payment Run';

describe('HeuristicMiner', () => {
  // ────────────────────────────────────────────────────────────────────────
  // 1. Basic discovery — sequential process A->B->C
  // ────────────────────────────────────────────────────────────────────────
  describe('basic discovery of a sequential process', () => {
    it('should discover activities, edges, and start/end from a simple A->B->C log', () => {
      const log = buildSequentialLog([CREATE_PO, APPROVE_PO, GR], 10);
      const miner = new HeuristicMiner();
      const model = miner.mine(log);

      expect(model).toBeInstanceOf(ProcessModel);
      expect(model.activities).toContain(CREATE_PO);
      expect(model.activities).toContain(APPROVE_PO);
      expect(model.activities).toContain(GR);
      expect(model.activities.length).toBe(3);

      expect(model.hasTransition(CREATE_PO, APPROVE_PO)).toBe(true);
      expect(model.hasTransition(APPROVE_PO, GR)).toBe(true);
      // No reverse edges in a purely sequential log
      expect(model.hasTransition(GR, CREATE_PO)).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. Dependency measure calculation
  // ────────────────────────────────────────────────────────────────────────
  describe('dependency measure', () => {
    it('should compute dependency as (|a>b| - |b>a|) / (|a>b| + |b>a| + 1)', () => {
      // Build a log where A->B occurs 10 times and B->A occurs 2 times
      const cases = [];
      // 10 cases: A->B
      for (let i = 0; i < 10; i++) {
        cases.push({
          id: `FWD-${i}`,
          activities: [
            { name: 'A', ts: new Date(`2024-01-15T0${i}:00:00Z`).toISOString() },
            { name: 'B', ts: new Date(`2024-01-15T0${i}:30:00Z`).toISOString() },
          ],
        });
      }
      // 2 cases: B->A
      for (let i = 0; i < 2; i++) {
        cases.push({
          id: `REV-${i}`,
          activities: [
            { name: 'B', ts: new Date(`2024-01-16T0${i}:00:00Z`).toISOString() },
            { name: 'A', ts: new Date(`2024-01-16T0${i}:30:00Z`).toISOString() },
          ],
        });
      }

      const log = buildLog(cases);
      const miner = new HeuristicMiner({ dependencyThreshold: 0 });
      const model = miner.mine(log);

      // dep(A->B) = (10-2)/(10+2+1) = 8/13 ~= 0.615
      const dep = model.getDependencyMeasure('A', 'B');
      expect(dep).toBeCloseTo(8 / 13, 3);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3. Threshold filtering — high threshold excludes weak edges
  // ────────────────────────────────────────────────────────────────────────
  describe('threshold filtering', () => {
    it('should exclude weak edges when dependencyThreshold is high', () => {
      // A->B strong (10 cases), A->C weak (1 case with some B->A noise)
      const cases = [];
      for (let i = 0; i < 10; i++) {
        cases.push({
          id: `STRONG-${i}`,
          activities: [
            { name: 'A', ts: new Date(1705300000000 + i * 86400000).toISOString() },
            { name: 'B', ts: new Date(1705300000000 + i * 86400000 + 3600000).toISOString() },
          ],
        });
      }
      // Weak edge: A->C only once
      cases.push({
        id: 'WEAK-1',
        activities: [
          { name: 'A', ts: '2024-02-01T09:00:00Z' },
          { name: 'C', ts: '2024-02-01T10:00:00Z' },
        ],
      });
      // Add C->A noise to lower dependency
      for (let i = 0; i < 4; i++) {
        cases.push({
          id: `NOISE-${i}`,
          activities: [
            { name: 'C', ts: new Date(1706000000000 + i * 86400000).toISOString() },
            { name: 'A', ts: new Date(1706000000000 + i * 86400000 + 3600000).toISOString() },
          ],
        });
      }

      const miner = new HeuristicMiner({ dependencyThreshold: 0.8, relativeToBestThreshold: 0 });
      const model = miner.mine(buildLog(cases));

      // A->B has dep ~= (10-0)/(10+0+1) = 0.909 — above threshold
      expect(model.hasTransition('A', 'B')).toBe(true);
      // A->C has dep = (1-4)/(1+4+1) = -0.5 — below threshold
      expect(model.hasTransition('A', 'C')).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 4. L1 loop detection (self-loop: A->A)
  // ────────────────────────────────────────────────────────────────────────
  describe('L1 loop detection', () => {
    it('should detect self-loop when an activity repeats consecutively', () => {
      const cases = [];
      for (let i = 0; i < 5; i++) {
        cases.push({
          id: `LOOP-${i}`,
          activities: [
            { name: 'Start',      ts: new Date(1705300000000 + i * 86400000).toISOString() },
            { name: 'Review',     ts: new Date(1705300000000 + i * 86400000 + 3600000).toISOString() },
            { name: 'Review',     ts: new Date(1705300000000 + i * 86400000 + 7200000).toISOString() },
            { name: 'Review',     ts: new Date(1705300000000 + i * 86400000 + 10800000).toISOString() },
            { name: 'Complete',   ts: new Date(1705300000000 + i * 86400000 + 14400000).toISOString() },
          ],
        });
      }

      const miner = new HeuristicMiner({ loopLengthOneThreshold: 0.5 });
      const model = miner.mine(buildLog(cases));

      expect(model.loopsL1.length).toBeGreaterThan(0);
      expect(model.getSelfLoopActivities()).toContain('Review');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 5. L2 loop detection (A->B->A)
  // ────────────────────────────────────────────────────────────────────────
  describe('L2 loop detection', () => {
    it('should detect two-step loops A->B->A', () => {
      const cases = [];
      for (let i = 0; i < 8; i++) {
        cases.push({
          id: `L2-${i}`,
          activities: [
            { name: 'Submit',  ts: new Date(1705300000000 + i * 86400000).toISOString() },
            { name: 'Review',  ts: new Date(1705300000000 + i * 86400000 + 3600000).toISOString() },
            { name: 'Rework',  ts: new Date(1705300000000 + i * 86400000 + 7200000).toISOString() },
            { name: 'Review',  ts: new Date(1705300000000 + i * 86400000 + 10800000).toISOString() },
            { name: 'Approve', ts: new Date(1705300000000 + i * 86400000 + 14400000).toISOString() },
          ],
        });
      }

      const miner = new HeuristicMiner({ loopLengthTwoThreshold: 0.5 });
      const model = miner.mine(buildLog(cases));

      expect(model.loopsL2.length).toBeGreaterThan(0);
      const loop = model.loopsL2.find(
        l => l.activities.includes('Review') && l.activities.includes('Rework')
      );
      expect(loop).toBeDefined();
      expect(loop.frequency).toBeGreaterThan(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 6. Parallel activities — AND gateway detection
  // ────────────────────────────────────────────────────────────────────────
  describe('parallel activities', () => {
    it('should detect a gateway when an activity branches to multiple successors', () => {
      const cases = [];
      // Half the cases: PO -> GR -> IR -> Payment
      for (let i = 0; i < 10; i++) {
        cases.push({
          id: `PAR-A-${i}`,
          activities: [
            { name: CREATE_PO, ts: new Date(1705300000000 + i * 86400000).toISOString() },
            { name: GR,        ts: new Date(1705300000000 + i * 86400000 + 3600000).toISOString() },
            { name: IR,        ts: new Date(1705300000000 + i * 86400000 + 7200000).toISOString() },
            { name: PAYMENT,   ts: new Date(1705300000000 + i * 86400000 + 10800000).toISOString() },
          ],
        });
      }
      // Other half: PO -> IR -> GR -> Payment
      for (let i = 0; i < 10; i++) {
        cases.push({
          id: `PAR-B-${i}`,
          activities: [
            { name: CREATE_PO, ts: new Date(1706000000000 + i * 86400000).toISOString() },
            { name: IR,        ts: new Date(1706000000000 + i * 86400000 + 3600000).toISOString() },
            { name: GR,        ts: new Date(1706000000000 + i * 86400000 + 7200000).toISOString() },
            { name: PAYMENT,   ts: new Date(1706000000000 + i * 86400000 + 10800000).toISOString() },
          ],
        });
      }

      const miner = new HeuristicMiner({ dependencyThreshold: 0.1 });
      const model = miner.mine(buildLog(cases));

      expect(model.gateways.length).toBeGreaterThan(0);
      const split = model.gateways.find(
        g => g.gatewayType === 'split' && g.activity === CREATE_PO
      );
      expect(split).toBeDefined();
      expect(split.branches).toContain(GR);
      expect(split.branches).toContain(IR);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 7. Start and end activities
  // ────────────────────────────────────────────────────────────────────────
  describe('start/end activities', () => {
    it('should correctly identify start and end activities', () => {
      const log = buildSequentialLog([CREATE_PO, APPROVE_PO, GR, IR, PAYMENT], 5);
      const miner = new HeuristicMiner();
      const model = miner.mine(log);

      expect(model.startActivities.length).toBe(1);
      expect(model.startActivities[0].activity).toBe(CREATE_PO);
      expect(model.startActivities[0].count).toBe(5);

      expect(model.endActivities.length).toBe(1);
      expect(model.endActivities[0].activity).toBe(PAYMENT);
      expect(model.endActivities[0].count).toBe(5);
    });

    it('should identify multiple start activities when cases begin differently', () => {
      const cases = [
        {
          id: 'A1',
          activities: [
            { name: CREATE_PO, ts: '2024-01-15T09:00:00Z' },
            { name: GR,        ts: '2024-01-15T10:00:00Z' },
          ],
        },
        {
          id: 'A2',
          activities: [
            { name: APPROVE_PO, ts: '2024-01-16T09:00:00Z' },
            { name: GR,         ts: '2024-01-16T10:00:00Z' },
          ],
        },
      ];
      const model = new HeuristicMiner().mine(buildLog(cases));
      const startNames = model.startActivities.map(s => s.activity);
      expect(startNames).toContain(CREATE_PO);
      expect(startNames).toContain(APPROVE_PO);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 8. Empty event log — graceful handling
  // ────────────────────────────────────────────────────────────────────────
  describe('empty event log', () => {
    it('should return a model with empty arrays when the log has no traces', () => {
      const log = new EventLog('EmptyLog');
      const miner = new HeuristicMiner();
      const model = miner.mine(log);

      expect(model.activities).toHaveLength(0);
      expect(model.edges).toHaveLength(0);
      expect(model.startActivities).toHaveLength(0);
      expect(model.endActivities).toHaveLength(0);
      expect(model.loopsL1).toHaveLength(0);
      expect(model.loopsL2).toHaveLength(0);
      expect(model.gateways).toHaveLength(0);
      expect(model.caseCount).toBe(0);
      expect(model.eventCount).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 9. Single case
  // ────────────────────────────────────────────────────────────────────────
  describe('single case', () => {
    it('should discover a valid model from a single trace', () => {
      const log = buildSequentialLog([CREATE_PO, APPROVE_PO, PAYMENT], 1);
      const miner = new HeuristicMiner();
      const model = miner.mine(log);

      expect(model.activities.length).toBe(3);
      expect(model.caseCount).toBe(1);
      expect(model.edges.length).toBeGreaterThanOrEqual(2);
      expect(model.hasTransition(CREATE_PO, APPROVE_PO)).toBe(true);
      expect(model.hasTransition(APPROVE_PO, PAYMENT)).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 10. ProcessModel.toJSON() structure
  // ────────────────────────────────────────────────────────────────────────
  describe('ProcessModel.toJSON()', () => {
    it('should produce a JSON object with correct top-level keys and stats', () => {
      const log = buildSequentialLog([CREATE_PO, APPROVE_PO, GR], 5);
      const model = new HeuristicMiner().mine(log);
      const json = model.toJSON();

      expect(json).toHaveProperty('activities');
      expect(json).toHaveProperty('edges');
      expect(json).toHaveProperty('startActivities');
      expect(json).toHaveProperty('endActivities');
      expect(json).toHaveProperty('loopsL1');
      expect(json).toHaveProperty('loopsL2');
      expect(json).toHaveProperty('gateways');
      expect(json).toHaveProperty('stats');

      expect(json.stats.activityCount).toBe(3);
      expect(json.stats.caseCount).toBe(5);
      expect(json.stats.eventCount).toBe(15);
      expect(json.stats.edgeCount).toBe(json.edges.length);
      expect(json.stats.gatewayCount).toBe(json.gateways.length);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 11. ProcessModel.toText() — human-readable output
  // ────────────────────────────────────────────────────────────────────────
  describe('ProcessModel.toText()', () => {
    it('should produce a human-readable string with key sections', () => {
      const log = buildSequentialLog([CREATE_PO, APPROVE_PO, GR, PAYMENT], 3);
      const model = new HeuristicMiner().mine(log);
      const text = model.toText();

      expect(typeof text).toBe('string');
      expect(text).toContain('Process Model:');
      expect(text).toContain('Start Activities:');
      expect(text).toContain('Edges (dependency):');
      expect(text).toContain('End Activities:');
      expect(text).toContain(CREATE_PO);
      expect(text).toContain(PAYMENT);
    });

    it('should include self-loops and L2 loops sections when present', () => {
      const cases = [];
      for (let i = 0; i < 5; i++) {
        cases.push({
          id: `TXT-${i}`,
          activities: [
            { name: 'Start',  ts: new Date(1705300000000 + i * 86400000).toISOString() },
            { name: 'Check',  ts: new Date(1705300000000 + i * 86400000 + 3600000).toISOString() },
            { name: 'Check',  ts: new Date(1705300000000 + i * 86400000 + 7200000).toISOString() },
            { name: 'Fix',    ts: new Date(1705300000000 + i * 86400000 + 10800000).toISOString() },
            { name: 'Check',  ts: new Date(1705300000000 + i * 86400000 + 14400000).toISOString() },
            { name: 'Done',   ts: new Date(1705300000000 + i * 86400000 + 18000000).toISOString() },
          ],
        });
      }
      const model = new HeuristicMiner().mine(buildLog(cases));
      const text = model.toText();

      if (model.loopsL1.length > 0) {
        expect(text).toContain('Self-loops:');
      }
      if (model.loopsL2.length > 0) {
        expect(text).toContain('Length-2 loops:');
      }
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 12. minFrequency option — filters infrequent transitions
  // ────────────────────────────────────────────────────────────────────────
  describe('minFrequency option', () => {
    it('should filter out transitions below the minimum frequency', () => {
      const cases = [];
      // 10 cases: A->B->C
      for (let i = 0; i < 10; i++) {
        cases.push({
          id: `FREQ-${i}`,
          activities: [
            { name: 'A', ts: new Date(1705300000000 + i * 86400000).toISOString() },
            { name: 'B', ts: new Date(1705300000000 + i * 86400000 + 3600000).toISOString() },
            { name: 'C', ts: new Date(1705300000000 + i * 86400000 + 7200000).toISOString() },
          ],
        });
      }
      // 1 case: A->D->C (rare path)
      cases.push({
        id: 'RARE-1',
        activities: [
          { name: 'A', ts: '2024-03-01T09:00:00Z' },
          { name: 'D', ts: '2024-03-01T10:00:00Z' },
          { name: 'C', ts: '2024-03-01T11:00:00Z' },
        ],
      });

      const miner = new HeuristicMiner({ minFrequency: 5, relativeToBestThreshold: 0 });
      const model = miner.mine(buildLog(cases));

      expect(model.hasTransition('A', 'B')).toBe(true);
      expect(model.hasTransition('A', 'D')).toBe(false); // freq=1 < minFrequency=5
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 13. Constructor options — default thresholds
  // ────────────────────────────────────────────────────────────────────────
  describe('constructor options', () => {
    it('should have correct default threshold values', () => {
      const miner = new HeuristicMiner();
      expect(miner.dependencyThreshold).toBe(0.5);
      expect(miner.andThreshold).toBe(0.1);
      expect(miner.loopLengthOneThreshold).toBe(0.5);
      expect(miner.loopLengthTwoThreshold).toBe(0.5);
      expect(miner.relativeToBestThreshold).toBe(0.05);
      expect(miner.minFrequency).toBe(1);
    });

    it('should accept custom options that override defaults', () => {
      const miner = new HeuristicMiner({
        dependencyThreshold: 0.8,
        andThreshold: 0.2,
        loopLengthOneThreshold: 0.7,
        loopLengthTwoThreshold: 0.6,
        relativeToBestThreshold: 0.1,
        minFrequency: 3,
      });
      expect(miner.dependencyThreshold).toBe(0.8);
      expect(miner.andThreshold).toBe(0.2);
      expect(miner.loopLengthOneThreshold).toBe(0.7);
      expect(miner.loopLengthTwoThreshold).toBe(0.6);
      expect(miner.relativeToBestThreshold).toBe(0.1);
      expect(miner.minFrequency).toBe(3);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 14. Multiple cases same variant — edge frequencies
  // ────────────────────────────────────────────────────────────────────────
  describe('multiple cases same variant', () => {
    it('should accumulate edge frequencies from multiple identical traces', () => {
      const log = buildSequentialLog([CREATE_PO, APPROVE_PO, GR], 10);
      const model = new HeuristicMiner().mine(log);

      const edge = model.getEdge(CREATE_PO, APPROVE_PO);
      expect(edge).toBeDefined();
      expect(edge.frequency).toBe(10);
      expect(model.getDirectlyFollowsCount(CREATE_PO, APPROVE_PO)).toBe(10);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 15. ProcessModel helper methods
  // ────────────────────────────────────────────────────────────────────────
  describe('ProcessModel helper methods', () => {
    let model;

    beforeEach(() => {
      const log = buildSequentialLog([CREATE_PO, APPROVE_PO, GR, IR, PAYMENT], 5);
      model = new HeuristicMiner().mine(log);
    });

    it('getSuccessors returns successor activities', () => {
      const successors = model.getSuccessors(CREATE_PO);
      expect(successors).toContain(APPROVE_PO);
    });

    it('getPredecessors returns predecessor activities', () => {
      const predecessors = model.getPredecessors(PAYMENT);
      expect(predecessors).toContain(IR);
    });

    it('hasTransition returns false for non-existent edges', () => {
      expect(model.hasTransition(PAYMENT, CREATE_PO)).toBe(false);
    });

    it('getEdge returns null for non-existent transition', () => {
      expect(model.getEdge(PAYMENT, CREATE_PO)).toBeNull();
    });

    it('getEdge returns edge details for existing transition', () => {
      const edge = model.getEdge(CREATE_PO, APPROVE_PO);
      expect(edge).toBeDefined();
      expect(edge.source).toBe(CREATE_PO);
      expect(edge.target).toBe(APPROVE_PO);
      expect(edge.frequency).toBe(5);
      expect(typeof edge.dependency).toBe('number');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 16. Full P2P process model with 5 activities
  // ────────────────────────────────────────────────────────────────────────
  describe('full P2P process discovery', () => {
    it('should discover a complete P2P chain with correct transition order', () => {
      const activities = [CREATE_PO, APPROVE_PO, GR, IR, PAYMENT];
      const log = buildSequentialLog(activities, 20);
      const model = new HeuristicMiner().mine(log);

      // All 4 sequential edges should exist
      expect(model.hasTransition(CREATE_PO, APPROVE_PO)).toBe(true);
      expect(model.hasTransition(APPROVE_PO, GR)).toBe(true);
      expect(model.hasTransition(GR, IR)).toBe(true);
      expect(model.hasTransition(IR, PAYMENT)).toBe(true);

      // No skip edges in a strict sequential log
      expect(model.hasTransition(CREATE_PO, GR)).toBe(false);
      expect(model.hasTransition(APPROVE_PO, PAYMENT)).toBe(false);

      expect(model.caseCount).toBe(20);
      expect(model.eventCount).toBe(100);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 17. Self-loop dependency formula: |a->a| / (|a->a| + 1)
  // ────────────────────────────────────────────────────────────────────────
  describe('self-loop dependency formula', () => {
    it('should calculate self-loop dependency correctly', () => {
      // Single case with 5 self-loops of activity X
      const cases = [{
        id: 'SELF-1',
        activities: [
          { name: 'X', ts: '2024-01-15T09:00:00Z' },
          { name: 'X', ts: '2024-01-15T09:01:00Z' },
          { name: 'X', ts: '2024-01-15T09:02:00Z' },
          { name: 'X', ts: '2024-01-15T09:03:00Z' },
          { name: 'X', ts: '2024-01-15T09:04:00Z' },
          { name: 'X', ts: '2024-01-15T09:05:00Z' },
          { name: 'Y', ts: '2024-01-15T09:06:00Z' },
        ],
      }];
      const model = new HeuristicMiner({ loopLengthOneThreshold: 0 }).mine(buildLog(cases));

      // X->X occurs 5 times, dep = 5/(5+1) = 0.833
      const l1 = model.loopsL1.find(l => l.activity === 'X');
      expect(l1).toBeDefined();
      expect(l1.dependency).toBeCloseTo(5 / 6, 2);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 18. XOR split detection — exclusive choice
  // ────────────────────────────────────────────────────────────────────────
  describe('XOR split detection', () => {
    it('should classify as XOR when branches are mutually exclusive', () => {
      const cases = [];
      // Path 1 (exclusive): A -> B -> D
      for (let i = 0; i < 10; i++) {
        cases.push({
          id: `XOR-B-${i}`,
          activities: [
            { name: 'A', ts: new Date(1705300000000 + i * 86400000).toISOString() },
            { name: 'B', ts: new Date(1705300000000 + i * 86400000 + 3600000).toISOString() },
            { name: 'D', ts: new Date(1705300000000 + i * 86400000 + 7200000).toISOString() },
          ],
        });
      }
      // Path 2 (exclusive): A -> C -> D
      for (let i = 0; i < 10; i++) {
        cases.push({
          id: `XOR-C-${i}`,
          activities: [
            { name: 'A', ts: new Date(1706000000000 + i * 86400000).toISOString() },
            { name: 'C', ts: new Date(1706000000000 + i * 86400000 + 3600000).toISOString() },
            { name: 'D', ts: new Date(1706000000000 + i * 86400000 + 7200000).toISOString() },
          ],
        });
      }

      const miner = new HeuristicMiner({ dependencyThreshold: 0.1, andThreshold: 0.1 });
      const model = miner.mine(buildLog(cases));

      const split = model.gateways.find(
        g => g.gatewayType === 'split' && g.activity === 'A'
      );
      expect(split).toBeDefined();
      // B and C never co-occur, so this should be XOR
      expect(split.type).toBe('xor');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 19. Event count and case count on model
  // ────────────────────────────────────────────────────────────────────────
  describe('event and case counts on model', () => {
    it('should store correct event and case counts', () => {
      const log = buildSequentialLog(['A', 'B', 'C', 'D'], 7);
      const model = new HeuristicMiner().mine(log);
      expect(model.caseCount).toBe(7);
      expect(model.eventCount).toBe(28);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 20. Relative-to-best threshold
  // ────────────────────────────────────────────────────────────────────────
  describe('relativeToBest threshold', () => {
    it('should keep edges that are close to the best dependency for a source', () => {
      const cases = [];
      // A->B: 10 occurrences (strong)
      for (let i = 0; i < 10; i++) {
        cases.push({
          id: `RTB-AB-${i}`,
          activities: [
            { name: 'A', ts: new Date(1705300000000 + i * 86400000).toISOString() },
            { name: 'B', ts: new Date(1705300000000 + i * 86400000 + 3600000).toISOString() },
          ],
        });
      }
      // A->C: 9 occurrences (close to best)
      for (let i = 0; i < 9; i++) {
        cases.push({
          id: `RTB-AC-${i}`,
          activities: [
            { name: 'A', ts: new Date(1706000000000 + i * 86400000).toISOString() },
            { name: 'C', ts: new Date(1706000000000 + i * 86400000 + 3600000).toISOString() },
          ],
        });
      }

      // High dependency threshold, but generous relative-to-best threshold
      const miner = new HeuristicMiner({ dependencyThreshold: 0.99, relativeToBestThreshold: 0.1 });
      const model = miner.mine(buildLog(cases));

      // Both should be kept — A->C dep is close to A->B dep
      expect(model.hasTransition('A', 'B')).toBe(true);
      expect(model.hasTransition('A', 'C')).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 21. getAndSplits and getXorSplits helpers
  // ────────────────────────────────────────────────────────────────────────
  describe('getAndSplits and getXorSplits', () => {
    it('getAndSplits returns only AND-type split gateways', () => {
      const model = new ProcessModel({
        activities: ['A', 'B', 'C'],
        edges: [],
        startActivities: [],
        endActivities: [],
        gateways: [
          { type: 'and', gatewayType: 'split', activity: 'A', branches: ['B', 'C'] },
          { type: 'xor', gatewayType: 'split', activity: 'X', branches: ['Y', 'Z'] },
          { type: 'and', gatewayType: 'join', activity: 'D', branches: ['B', 'C'] },
        ],
        dfMatrix: new Map(),
        depMatrix: new Map(),
        caseCount: 0,
        eventCount: 0,
      });

      expect(model.getAndSplits().length).toBe(1);
      expect(model.getAndSplits()[0].activity).toBe('A');

      expect(model.getXorSplits().length).toBe(1);
      expect(model.getXorSplits()[0].activity).toBe('X');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 22. getDependencyMeasure returns 0 for unknown activities
  // ────────────────────────────────────────────────────────────────────────
  describe('getDependencyMeasure for unknown activities', () => {
    it('should return 0 for activities not in the model', () => {
      const log = buildSequentialLog(['A', 'B'], 5);
      const model = new HeuristicMiner().mine(log);
      expect(model.getDependencyMeasure('X', 'Y')).toBe(0);
      expect(model.getDirectlyFollowsCount('X', 'Y')).toBe(0);
    });
  });
});
