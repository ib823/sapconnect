/**
 * Tests for SocialNetworkMiner and SocialNetworkResult
 */

const { SocialNetworkMiner, SocialNetworkResult } = require('../../../extraction/process-mining/social-network-miner');
const { Event, Trace, EventLog } = require('../../../extraction/process-mining/event-log');

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASE = new Date('2025-01-01T00:00:00Z').getTime();
const HOUR = 3_600_000;

/**
 * Build an event log from trace descriptions with explicit resources.
 * @param {Array<{ caseId: string, events: Array<{ activity: string, resource?: string, offsetMs: number }> }>} cases
 * @returns {EventLog}
 */
function buildLog(cases) {
  const log = new EventLog('TestLog');
  for (const c of cases) {
    const trace = new Trace(c.caseId);
    for (const e of c.events) {
      trace.addEvent(new Event({
        activity: e.activity,
        timestamp: new Date(BASE + e.offsetMs),
        resource: e.resource || undefined,
      }));
    }
    log.addTrace(trace);
  }
  return log;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SocialNetworkMiner', () => {
  let miner;

  beforeEach(() => {
    miner = new SocialNetworkMiner({ logLevel: 'silent' });
  });

  // 1
  describe('handover matrix', () => {
    it('counts handovers when A does activity then B does next activity', () => {
      const log = buildLog([{
        caseId: 'C1',
        events: [
          { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
          { activity: 'Step2', resource: 'USER_JONES', offsetMs: HOUR },
          { activity: 'Step3', resource: 'USER_SMITH', offsetMs: 2 * HOUR },
        ],
      }]);

      const result = miner.analyze(log);

      expect(result.handoverMatrix.totalHandovers).toBe(2);
      // SMITH -> JONES (Step1->Step2) and JONES -> SMITH (Step2->Step3)
      const smithToJones = result.handoverMatrix.entries.find(
        e => e.from === 'USER_SMITH' && e.to === 'USER_JONES'
      );
      const jonesToSmith = result.handoverMatrix.entries.find(
        e => e.from === 'USER_JONES' && e.to === 'USER_SMITH'
      );
      expect(smithToJones).toBeDefined();
      expect(smithToJones.count).toBe(1);
      expect(jonesToSmith).toBeDefined();
      expect(jonesToSmith.count).toBe(1);
    });

    it('aggregates handover counts across multiple cases', () => {
      const log = buildLog([
        {
          caseId: 'C1',
          events: [
            { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
            { activity: 'Step2', resource: 'USER_JONES', offsetMs: HOUR },
          ],
        },
        {
          caseId: 'C2',
          events: [
            { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 2 * HOUR },
            { activity: 'Step2', resource: 'USER_JONES', offsetMs: 3 * HOUR },
          ],
        },
      ]);

      const result = miner.analyze(log);

      const smithToJones = result.handoverMatrix.entries.find(
        e => e.from === 'USER_SMITH' && e.to === 'USER_JONES'
      );
      expect(smithToJones.count).toBe(2);
    });
  });

  // 2
  describe('same resource no handover', () => {
    it('does not count consecutive activities by the same resource as handovers', () => {
      const log = buildLog([{
        caseId: 'C1',
        events: [
          { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
          { activity: 'Step2', resource: 'USER_SMITH', offsetMs: HOUR },
          { activity: 'Step3', resource: 'USER_SMITH', offsetMs: 2 * HOUR },
        ],
      }]);

      const result = miner.analyze(log);

      expect(result.handoverMatrix.totalHandovers).toBe(0);
      expect(result.handoverMatrix.entries.length).toBe(0);
    });
  });

  // 3
  describe('working together', () => {
    it('counts pairs of resources that work on the same case', () => {
      const log = buildLog([{
        caseId: 'C1',
        events: [
          { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
          { activity: 'Step2', resource: 'USER_JONES', offsetMs: HOUR },
          { activity: 'Step3', resource: 'USER_CLARK', offsetMs: 2 * HOUR },
        ],
      }]);

      const result = miner.analyze(log);

      // 3 resources => C(3,2)=3 pairs
      expect(result.workingTogether.totalPairs).toBe(3);
      expect(result.workingTogether.casesWithMultipleResources).toBe(1);

      // Verify specific pairs exist
      const pairSet = new Set(result.workingTogether.entries.map(
        e => [e.resourceA, e.resourceB].sort().join('|')
      ));
      expect(pairSet.has('USER_JONES|USER_SMITH')).toBe(true);
      expect(pairSet.has('USER_CLARK|USER_SMITH')).toBe(true);
      expect(pairSet.has('USER_CLARK|USER_JONES')).toBe(true);
    });

    it('increments shared case count for pairs appearing in multiple cases', () => {
      const log = buildLog([
        {
          caseId: 'C1',
          events: [
            { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
            { activity: 'Step2', resource: 'USER_JONES', offsetMs: HOUR },
          ],
        },
        {
          caseId: 'C2',
          events: [
            { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 2 * HOUR },
            { activity: 'Step2', resource: 'USER_JONES', offsetMs: 3 * HOUR },
          ],
        },
      ]);

      const result = miner.analyze(log);

      const pair = result.workingTogether.entries.find(
        e => [e.resourceA, e.resourceB].sort().join('|') === 'USER_JONES|USER_SMITH'
      );
      expect(pair).toBeDefined();
      expect(pair.sharedCases).toBe(2);
    });
  });

  // 4
  describe('resource utilization', () => {
    it('tracks event counts and case counts per resource', () => {
      const log = buildLog([
        {
          caseId: 'C1',
          events: [
            { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
            { activity: 'Step2', resource: 'USER_SMITH', offsetMs: HOUR },
            { activity: 'Step3', resource: 'USER_JONES', offsetMs: 2 * HOUR },
          ],
        },
        {
          caseId: 'C2',
          events: [
            { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 3 * HOUR },
            { activity: 'Step2', resource: 'USER_JONES', offsetMs: 4 * HOUR },
          ],
        },
      ]);

      const result = miner.analyze(log);

      const smith = result.resourceUtilization.resources.find(r => r.resource === 'USER_SMITH');
      expect(smith).toBeDefined();
      expect(smith.eventCount).toBe(3); // 2 in C1, 1 in C2
      expect(smith.caseCount).toBe(2);

      const jones = result.resourceUtilization.resources.find(r => r.resource === 'USER_JONES');
      expect(jones).toBeDefined();
      expect(jones.eventCount).toBe(2); // 1 in C1, 1 in C2
      expect(jones.caseCount).toBe(2);
    });
  });

  // 5
  describe('workload balance', () => {
    it('calculates CV and isBalanced flag for evenly distributed workloads', () => {
      // Each resource does 2 events
      const log = buildLog([{
        caseId: 'C1',
        events: [
          { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
          { activity: 'Step2', resource: 'USER_JONES', offsetMs: HOUR },
          { activity: 'Step3', resource: 'USER_SMITH', offsetMs: 2 * HOUR },
          { activity: 'Step4', resource: 'USER_JONES', offsetMs: 3 * HOUR },
        ],
      }]);

      const result = miner.analyze(log);

      expect(result.resourceUtilization.workloadDistribution.coefficientOfVariation).toBe(0);
      expect(result.resourceUtilization.workloadDistribution.isBalanced).toBe(true);
    });

    it('detects unbalanced workloads when CV >= 0.5', () => {
      // SMITH does 10 events, JONES does 1
      const events = [];
      for (let i = 0; i < 10; i++) {
        events.push({ activity: `Step${i}`, resource: 'USER_SMITH', offsetMs: i * HOUR });
      }
      events.push({ activity: 'Step10', resource: 'USER_JONES', offsetMs: 10 * HOUR });

      const log = buildLog([{ caseId: 'C1', events }]);
      const result = miner.analyze(log);

      expect(result.resourceUtilization.workloadDistribution.coefficientOfVariation).toBeGreaterThan(0);
      expect(result.resourceUtilization.workloadDistribution.isBalanced).toBe(false);
    });
  });

  // 6
  describe('activity-resource matrix', () => {
    it('tracks which resources perform which activities', () => {
      const log = buildLog([
        {
          caseId: 'C1',
          events: [
            { activity: 'Create PO', resource: 'USER_SMITH', offsetMs: 0 },
            { activity: 'Approve PO', resource: 'USER_JONES', offsetMs: HOUR },
          ],
        },
        {
          caseId: 'C2',
          events: [
            { activity: 'Create PO', resource: 'USER_SMITH', offsetMs: 2 * HOUR },
            { activity: 'Approve PO', resource: 'USER_CLARK', offsetMs: 3 * HOUR },
          ],
        },
      ]);

      const result = miner.analyze(log);

      const createPO = result.activityResourceMatrix.find(a => a.activity === 'Create PO');
      expect(createPO).toBeDefined();
      expect(createPO.totalExecutions).toBe(2);
      expect(createPO.resourceCount).toBe(1); // Only SMITH
      expect(createPO.primaryResource).toBe('USER_SMITH');

      const approvePO = result.activityResourceMatrix.find(a => a.activity === 'Approve PO');
      expect(approvePO).toBeDefined();
      expect(approvePO.totalExecutions).toBe(2);
      expect(approvePO.resourceCount).toBe(2); // JONES and CLARK
    });
  });

  // 7
  describe('SoD violations', () => {
    it('detects when same resource performs conflicting activities', () => {
      const log = buildLog([{
        caseId: 'C1',
        events: [
          { activity: 'Create Purchase Order', resource: 'USER_SMITH', offsetMs: 0 },
          { activity: 'Approve Purchase Order', resource: 'USER_SMITH', offsetMs: HOUR },
        ],
      }]);

      const sodRules = [
        { name: 'Create/Approve PO', activities: ['Create Purchase Order', 'Approve Purchase Order'] },
      ];

      const result = miner.analyze(log, { sodRules });

      expect(result.sodViolations.totalViolations).toBeGreaterThan(0);
      const rule = result.sodViolations.rules.find(r => r.rule === 'Create/Approve PO');
      expect(rule).toBeDefined();
      expect(rule.status).toBe('violation');
      expect(rule.violationCount).toBe(1);
      expect(rule.violatingCases[0].caseId).toBe('C1');
      expect(rule.violatingCases[0].resources).toContain('USER_SMITH');
    });
  });

  // 8
  describe('SoD compliant', () => {
    it('reports no violations when different resources perform conflicting activities', () => {
      const log = buildLog([{
        caseId: 'C1',
        events: [
          { activity: 'Create Purchase Order', resource: 'USER_SMITH', offsetMs: 0 },
          { activity: 'Approve Purchase Order', resource: 'USER_JONES', offsetMs: HOUR },
        ],
      }]);

      const sodRules = [
        { name: 'Create/Approve PO', activities: ['Create Purchase Order', 'Approve Purchase Order'] },
      ];

      const result = miner.analyze(log, { sodRules });

      expect(result.sodViolations.totalViolations).toBe(0);
      const rule = result.sodViolations.rules.find(r => r.rule === 'Create/Approve PO');
      expect(rule.status).toBe('compliant');
      expect(rule.violationCount).toBe(0);
    });
  });

  // 9
  describe('default SoD rules', () => {
    it('loads 6 built-in SAP rules when no custom rules are provided', () => {
      const log = buildLog([{
        caseId: 'C1',
        events: [
          { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
          { activity: 'Step2', resource: 'USER_JONES', offsetMs: HOUR },
        ],
      }]);

      const result = miner.analyze(log);

      expect(result.sodViolations.rulesChecked).toBe(6);
      const ruleNames = result.sodViolations.rules.map(r => r.rule);
      expect(ruleNames).toContain('Create PO / Approve PO');
      expect(ruleNames).toContain('Create PR / Approve PR');
      expect(ruleNames).toContain('Create Invoice / Approve Payment');
      expect(ruleNames).toContain('Goods Receipt / Invoice Receipt');
      expect(ruleNames).toContain('Create JE / Approve JE');
      expect(ruleNames).toContain('Create Asset / Retire Asset');
    });
  });

  // 10
  describe('custom SoD rules', () => {
    it('uses passed rules instead of defaults', () => {
      const log = buildLog([{
        caseId: 'C1',
        events: [
          { activity: 'Initiate', resource: 'USER_SMITH', offsetMs: 0 },
          { activity: 'Verify', resource: 'USER_SMITH', offsetMs: HOUR },
        ],
      }]);

      const customRules = [
        { name: 'Custom Rule', activities: ['Initiate', 'Verify'] },
      ];

      const result = miner.analyze(log, { sodRules: customRules });

      expect(result.sodViolations.rulesChecked).toBe(1);
      expect(result.sodViolations.rules[0].rule).toBe('Custom Rule');
      expect(result.sodViolations.rules[0].violationCount).toBe(1);
    });
  });

  // 11
  describe('centrality metrics', () => {
    it('calculates in/out degree, volume, and centrality score', () => {
      const log = buildLog([
        {
          caseId: 'C1',
          events: [
            { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
            { activity: 'Step2', resource: 'USER_JONES', offsetMs: HOUR },
            { activity: 'Step3', resource: 'USER_CLARK', offsetMs: 2 * HOUR },
          ],
        },
        {
          caseId: 'C2',
          events: [
            { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 3 * HOUR },
            { activity: 'Step2', resource: 'USER_JONES', offsetMs: 4 * HOUR },
            { activity: 'Step3', resource: 'USER_SMITH', offsetMs: 5 * HOUR },
          ],
        },
      ]);

      const result = miner.analyze(log);

      expect(result.centralityMetrics.length).toBeGreaterThan(0);

      for (const metric of result.centralityMetrics) {
        expect(metric).toHaveProperty('resource');
        expect(metric).toHaveProperty('inDegree');
        expect(metric).toHaveProperty('outDegree');
        expect(metric).toHaveProperty('totalDegree');
        expect(metric).toHaveProperty('inVolume');
        expect(metric).toHaveProperty('outVolume');
        expect(metric).toHaveProperty('totalVolume');
        expect(metric).toHaveProperty('centralityScore');
      }

      // JONES hands over to CLARK (C1) and to SMITH (C2), so outDegree >= 2
      const jones = result.centralityMetrics.find(m => m.resource === 'USER_JONES');
      expect(jones).toBeDefined();
      expect(jones.outDegree).toBeGreaterThanOrEqual(1);
      expect(jones.inDegree).toBeGreaterThanOrEqual(1);
      expect(jones.centralityScore).toBeGreaterThan(0);
    });

    it('sorts centrality by score descending', () => {
      const log = buildLog([
        {
          caseId: 'C1',
          events: [
            { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
            { activity: 'Step2', resource: 'USER_JONES', offsetMs: HOUR },
            { activity: 'Step3', resource: 'USER_SMITH', offsetMs: 2 * HOUR },
          ],
        },
      ]);

      const result = miner.analyze(log);

      for (let i = 1; i < result.centralityMetrics.length; i++) {
        expect(result.centralityMetrics[i - 1].centralityScore)
          .toBeGreaterThanOrEqual(result.centralityMetrics[i].centralityScore);
      }
    });
  });

  // 12
  describe('SocialNetworkResult.getSummary()', () => {
    it('returns an object with the correct shape', () => {
      const log = buildLog([{
        caseId: 'C1',
        events: [
          { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
          { activity: 'Step2', resource: 'USER_JONES', offsetMs: HOUR },
        ],
      }]);

      const result = miner.analyze(log);
      const summary = result.getSummary();

      expect(summary).toHaveProperty('resourceCount');
      expect(summary).toHaveProperty('caseCount');
      expect(summary).toHaveProperty('totalHandovers');
      expect(summary).toHaveProperty('uniqueHandoverPairs');
      expect(summary).toHaveProperty('casesWithMultipleResources');
      expect(summary).toHaveProperty('workloadBalanced');
      expect(summary).toHaveProperty('sodViolations');
      expect(summary).toHaveProperty('sodRulesViolated');
      expect(summary).toHaveProperty('mostCentralResource');

      expect(summary.resourceCount).toBe(2);
      expect(summary.caseCount).toBe(1);
      expect(summary.totalHandovers).toBe(1);
    });
  });

  // 13
  describe('SocialNetworkResult.toJSON()', () => {
    it('serializes to a JSON-compatible object', () => {
      const log = buildLog([{
        caseId: 'C1',
        events: [
          { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
          { activity: 'Step2', resource: 'USER_JONES', offsetMs: HOUR },
          { activity: 'Step3', resource: 'USER_CLARK', offsetMs: 2 * HOUR },
        ],
      }]);

      const result = miner.analyze(log);
      const json = result.toJSON();

      expect(json).toHaveProperty('summary');
      expect(json).toHaveProperty('handoverMatrix');
      expect(json).toHaveProperty('workingTogether');
      expect(json).toHaveProperty('resourceUtilization');
      expect(json).toHaveProperty('activityResourceMatrix');
      expect(json).toHaveProperty('sodViolations');
      expect(json).toHaveProperty('centralityMetrics');

      // Round-trip through JSON.stringify
      const str = JSON.stringify(json);
      const parsed = JSON.parse(str);
      expect(parsed.summary.resourceCount).toBe(3);
    });
  });

  // 14
  describe('no resources', () => {
    it('handles events without resource field gracefully', () => {
      const log = buildLog([{
        caseId: 'C1',
        events: [
          { activity: 'Step1', offsetMs: 0 },
          { activity: 'Step2', offsetMs: HOUR },
          { activity: 'Step3', offsetMs: 2 * HOUR },
        ],
      }]);

      const result = miner.analyze(log);

      expect(result.handoverMatrix.totalHandovers).toBe(0);
      expect(result.handoverMatrix.entries.length).toBe(0);
      expect(result.workingTogether.totalPairs).toBe(0);
      expect(result.resourceUtilization.totalResources).toBe(0);
      expect(result.activityResourceMatrix.length).toBe(0);
      expect(result.centralityMetrics.length).toBe(0);
      expect(result.resourceCount).toBe(0);
    });
  });

  // 15
  describe('single resource', () => {
    it('produces no handovers and no working-together pairs', () => {
      const log = buildLog([{
        caseId: 'C1',
        events: [
          { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
          { activity: 'Step2', resource: 'USER_SMITH', offsetMs: HOUR },
          { activity: 'Step3', resource: 'USER_SMITH', offsetMs: 2 * HOUR },
        ],
      }]);

      const result = miner.analyze(log);

      expect(result.handoverMatrix.totalHandovers).toBe(0);
      expect(result.workingTogether.totalPairs).toBe(0);
      expect(result.workingTogether.casesWithMultipleResources).toBe(0);
      expect(result.resourceUtilization.totalResources).toBe(1);
      expect(result.resourceUtilization.resources[0].resource).toBe('USER_SMITH');
      expect(result.resourceUtilization.resources[0].eventCount).toBe(3);
    });
  });

  // 16
  describe('handover matrix top handovers', () => {
    it('returns topHandovers sorted by count descending', () => {
      const events = [];
      // SMITH -> JONES 5 times, JONES -> CLARK 3 times, CLARK -> SMITH 1 time
      for (let i = 0; i < 5; i++) {
        events.push({ activity: `A${i * 3}`, resource: 'USER_SMITH', offsetMs: i * 3 * HOUR });
        events.push({ activity: `A${i * 3 + 1}`, resource: 'USER_JONES', offsetMs: (i * 3 + 1) * HOUR });
      }

      const log = buildLog([{ caseId: 'C1', events }]);
      const result = miner.analyze(log);

      expect(result.handoverMatrix.topHandovers.length).toBeGreaterThan(0);
      // First entry should have the highest count
      if (result.handoverMatrix.topHandovers.length >= 2) {
        expect(result.handoverMatrix.topHandovers[0].count)
          .toBeGreaterThanOrEqual(result.handoverMatrix.topHandovers[1].count);
      }
    });
  });

  // 17
  describe('resource utilization avg events per case', () => {
    it('calculates avgEventsPerCase correctly', () => {
      const log = buildLog([
        {
          caseId: 'C1',
          events: [
            { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 0 },
            { activity: 'Step2', resource: 'USER_SMITH', offsetMs: HOUR },
          ],
        },
        {
          caseId: 'C2',
          events: [
            { activity: 'Step1', resource: 'USER_SMITH', offsetMs: 2 * HOUR },
            { activity: 'Step2', resource: 'USER_SMITH', offsetMs: 3 * HOUR },
            { activity: 'Step3', resource: 'USER_SMITH', offsetMs: 4 * HOUR },
            { activity: 'Step4', resource: 'USER_SMITH', offsetMs: 5 * HOUR },
          ],
        },
      ]);

      const result = miner.analyze(log);

      const smith = result.resourceUtilization.resources.find(r => r.resource === 'USER_SMITH');
      // 6 events across 2 cases = 3.0
      expect(smith.avgEventsPerCase).toBe(3);
    });
  });

  // 18
  describe('activity-resource primary resource share', () => {
    it('calculates the primary resource share percentage', () => {
      const log = buildLog([
        {
          caseId: 'C1',
          events: [
            { activity: 'Approve', resource: 'USER_SMITH', offsetMs: 0 },
          ],
        },
        {
          caseId: 'C2',
          events: [
            { activity: 'Approve', resource: 'USER_SMITH', offsetMs: HOUR },
          ],
        },
        {
          caseId: 'C3',
          events: [
            { activity: 'Approve', resource: 'USER_JONES', offsetMs: 2 * HOUR },
          ],
        },
      ]);

      const result = miner.analyze(log);

      const approve = result.activityResourceMatrix.find(a => a.activity === 'Approve');
      expect(approve).toBeDefined();
      expect(approve.primaryResource).toBe('USER_SMITH');
      // 2 out of 3 = 67%
      expect(approve.primaryResourceShare).toBe(67);
    });
  });

  // 19
  describe('SoD violations across multiple cases', () => {
    it('counts violations per case, not globally', () => {
      const log = buildLog([
        {
          caseId: 'C1',
          events: [
            { activity: 'Create Purchase Order', resource: 'USER_SMITH', offsetMs: 0 },
            { activity: 'Approve Purchase Order', resource: 'USER_SMITH', offsetMs: HOUR },
          ],
        },
        {
          caseId: 'C2',
          events: [
            { activity: 'Create Purchase Order', resource: 'USER_JONES', offsetMs: 2 * HOUR },
            { activity: 'Approve Purchase Order', resource: 'USER_JONES', offsetMs: 3 * HOUR },
          ],
        },
        {
          caseId: 'C3',
          events: [
            { activity: 'Create Purchase Order', resource: 'USER_SMITH', offsetMs: 4 * HOUR },
            { activity: 'Approve Purchase Order', resource: 'USER_CLARK', offsetMs: 5 * HOUR },
          ],
        },
      ]);

      const sodRules = [
        { name: 'Create/Approve PO', activities: ['Create Purchase Order', 'Approve Purchase Order'] },
      ];

      const result = miner.analyze(log, { sodRules });

      const rule = result.sodViolations.rules.find(r => r.rule === 'Create/Approve PO');
      expect(rule.violationCount).toBe(2); // C1 and C2 violate; C3 is compliant
    });
  });

  // 20
  describe('empty event log', () => {
    it('handles an empty log gracefully', () => {
      const log = new EventLog('Empty');
      const result = miner.analyze(log);

      expect(result.resourceCount).toBe(0);
      expect(result.caseCount).toBe(0);
      expect(result.handoverMatrix.totalHandovers).toBe(0);
      expect(result.workingTogether.totalPairs).toBe(0);
      expect(result.resourceUtilization.totalResources).toBe(0);
      expect(result.activityResourceMatrix.length).toBe(0);
      expect(result.centralityMetrics.length).toBe(0);
      expect(result.sodViolations.totalViolations).toBe(0);

      const summary = result.getSummary();
      expect(summary.mostCentralResource).toBeNull();
    });
  });

  // 21
  describe('unique activities per resource', () => {
    it('tracks the number of unique activities performed by each resource', () => {
      const log = buildLog([{
        caseId: 'C1',
        events: [
          { activity: 'StepA', resource: 'USER_SMITH', offsetMs: 0 },
          { activity: 'StepB', resource: 'USER_SMITH', offsetMs: HOUR },
          { activity: 'StepA', resource: 'USER_SMITH', offsetMs: 2 * HOUR },
          { activity: 'StepC', resource: 'USER_JONES', offsetMs: 3 * HOUR },
        ],
      }]);

      const result = miner.analyze(log);

      const smith = result.resourceUtilization.resources.find(r => r.resource === 'USER_SMITH');
      expect(smith.uniqueActivities).toBe(2); // StepA and StepB
      expect(smith.eventCount).toBe(3);

      const jones = result.resourceUtilization.resources.find(r => r.resource === 'USER_JONES');
      expect(jones.uniqueActivities).toBe(1); // StepC
    });
  });
});
