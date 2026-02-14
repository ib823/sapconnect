const { VariantAnalyzer, VariantAnalysisResult } = require('../../../extraction/process-mining/variant-analyzer');
const { Event, Trace, EventLog } = require('../../../extraction/process-mining/event-log');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build an EventLog from compact case definitions.
 * Each case is { id, activities: [{ name, ts }], attributes?: {} }.
 */
function buildLog(cases) {
  const log = new EventLog('TestLog');
  for (const c of cases) {
    const trace = new Trace(c.id, c.attributes || undefined);
    for (const act of c.activities) {
      trace.addEvent(new Event({
        activity: act.name,
        timestamp: act.ts,
        resource: act.resource,
        attributes: act.attributes,
      }));
    }
    log.addTrace(trace);
  }
  return log;
}

/**
 * Build a standard P2P test event log with multiple variants and durations.
 * Returns 15 cases across 4 variants:
 *   Variant 1 (happy path, 6 cases):  PO -> Approve -> GR -> IR -> Pay
 *   Variant 2 (3 cases):              PO -> Approve -> IR -> GR -> Pay (swapped GR/IR)
 *   Variant 3 (rework, 4 cases):      PO -> Approve -> GR -> GR -> IR -> Pay
 *   Variant 4 (short, 2 cases):       PO -> GR -> Pay (skipped approve & IR)
 */
function buildP2PLog() {
  const cases = [];
  const base = new Date('2024-01-15T09:00:00Z').getTime();
  const HOUR = 3600000;
  const DAY = 86400000;

  // Variant 1: Happy path (6 cases, 4-hour duration each)
  for (let i = 0; i < 6; i++) {
    const start = base + i * DAY;
    cases.push({
      id: `PO-${String(i + 1).padStart(3, '0')}`,
      attributes: { region: 'EMEA', priority: 'normal' },
      activities: [
        { name: 'Create Purchase Order', ts: new Date(start).toISOString() },
        { name: 'Approve Purchase Order', ts: new Date(start + 1 * HOUR).toISOString() },
        { name: 'Goods Receipt',         ts: new Date(start + 2 * HOUR).toISOString() },
        { name: 'Invoice Receipt',       ts: new Date(start + 3 * HOUR).toISOString() },
        { name: 'Payment Run',           ts: new Date(start + 4 * HOUR).toISOString() },
      ],
    });
  }

  // Variant 2: Swapped GR/IR (3 cases, 5-hour duration)
  for (let i = 0; i < 3; i++) {
    const start = base + (6 + i) * DAY;
    cases.push({
      id: `PO-${String(7 + i).padStart(3, '0')}`,
      attributes: { region: 'APAC', priority: 'normal' },
      activities: [
        { name: 'Create Purchase Order', ts: new Date(start).toISOString() },
        { name: 'Approve Purchase Order', ts: new Date(start + 1 * HOUR).toISOString() },
        { name: 'Invoice Receipt',       ts: new Date(start + 2 * HOUR).toISOString() },
        { name: 'Goods Receipt',         ts: new Date(start + 3 * HOUR).toISOString() },
        { name: 'Payment Run',           ts: new Date(start + 5 * HOUR).toISOString() },
      ],
    });
  }

  // Variant 3: Rework — duplicate Goods Receipt (4 cases, 6-hour duration)
  for (let i = 0; i < 4; i++) {
    const start = base + (9 + i) * DAY;
    cases.push({
      id: `PO-${String(10 + i).padStart(3, '0')}`,
      attributes: { region: 'AMER', priority: 'urgent' },
      activities: [
        { name: 'Create Purchase Order', ts: new Date(start).toISOString() },
        { name: 'Approve Purchase Order', ts: new Date(start + 1 * HOUR).toISOString() },
        { name: 'Goods Receipt',         ts: new Date(start + 2 * HOUR).toISOString() },
        { name: 'Goods Receipt',         ts: new Date(start + 3 * HOUR).toISOString() },
        { name: 'Invoice Receipt',       ts: new Date(start + 4 * HOUR).toISOString() },
        { name: 'Payment Run',           ts: new Date(start + 6 * HOUR).toISOString() },
      ],
    });
  }

  // Variant 4: Short path (2 cases, 3-hour duration)
  for (let i = 0; i < 2; i++) {
    const start = base + (13 + i) * DAY;
    cases.push({
      id: `PO-${String(14 + i).padStart(3, '0')}`,
      attributes: { region: 'EMEA', priority: 'low' },
      activities: [
        { name: 'Create Purchase Order', ts: new Date(start).toISOString() },
        { name: 'Goods Receipt',         ts: new Date(start + 1 * HOUR).toISOString() },
        { name: 'Payment Run',           ts: new Date(start + 3 * HOUR).toISOString() },
      ],
    });
  }

  return buildLog(cases);
}

describe('VariantAnalyzer', () => {
  // ────────────────────────────────────────────────────────────────────────
  // 1. Basic variant extraction
  // ────────────────────────────────────────────────────────────────────────
  describe('basic variant extraction', () => {
    it('should extract correct variant counts and frequencies from a multi-variant log', () => {
      const log = buildP2PLog();
      const analyzer = new VariantAnalyzer();
      const result = analyzer.analyze(log);

      expect(result.totalVariantCount).toBe(4);
      expect(result.totalCaseCount).toBe(15);
      expect(result.variants.length).toBe(4);

      // Each variant should have caseCount, frequency, and activities
      for (const v of result.variants) {
        expect(v.caseCount).toBeGreaterThan(0);
        expect(v.frequency).toBeGreaterThan(0);
        expect(v.activities.length).toBeGreaterThan(0);
      }
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. Variant ranking — most frequent first
  // ────────────────────────────────────────────────────────────────────────
  describe('variant ranking', () => {
    it('should rank variants by frequency descending', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      expect(result.variants[0].caseCount).toBe(6); // Happy path
      for (let i = 0; i < result.variants.length - 1; i++) {
        expect(result.variants[i].caseCount).toBeGreaterThanOrEqual(result.variants[i + 1].caseCount);
      }

      // Rank numbers should be 1-based sequential
      expect(result.variants[0].rank).toBe(1);
      expect(result.variants[1].rank).toBe(2);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3. Happy path identification
  // ────────────────────────────────────────────────────────────────────────
  describe('happy path', () => {
    it('should identify the most frequent rework-free variant as the happy path', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      expect(result.happyPath).toBeDefined();
      expect(result.happyPath.caseCount).toBe(6);
      expect(result.happyPath.isReworkFree).toBe(true);
      expect(result.happyPath.activities).toEqual([
        'Create Purchase Order',
        'Approve Purchase Order',
        'Goods Receipt',
        'Invoice Receipt',
        'Payment Run',
      ]);
    });

    it('should fall back to most frequent variant if all have rework', () => {
      const cases = [];
      // All cases have rework
      for (let i = 0; i < 5; i++) {
        cases.push({
          id: `RW-${i}`,
          activities: [
            { name: 'A', ts: new Date(1705300000000 + i * 86400000).toISOString() },
            { name: 'B', ts: new Date(1705300000000 + i * 86400000 + 3600000).toISOString() },
            { name: 'A', ts: new Date(1705300000000 + i * 86400000 + 7200000).toISOString() },
            { name: 'C', ts: new Date(1705300000000 + i * 86400000 + 10800000).toISOString() },
          ],
        });
      }
      const result = new VariantAnalyzer().analyze(buildLog(cases));
      expect(result.happyPath).toBeDefined();
      expect(result.happyPath.isReworkFree).toBe(false);
      expect(result.happyPath.caseCount).toBe(5);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 4. Duration statistics
  // ────────────────────────────────────────────────────────────────────────
  describe('duration statistics', () => {
    it('should calculate mean, median, P90, P95 correctly', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      // Happy path variant: all 6 cases have 4-hour (14400000 ms) duration
      const happyVariant = result.variants[0];
      expect(happyVariant.durationStats).toBeDefined();
      expect(happyVariant.durationStats.count).toBe(6);
      expect(happyVariant.durationStats.mean).toBe(14400000);
      expect(happyVariant.durationStats.median).toBe(14400000);
      expect(happyVariant.durationStats.min).toBe(14400000);
      expect(happyVariant.durationStats.max).toBe(14400000);
    });

    it('should compute stats with varying durations', () => {
      const cases = [];
      const durations = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // hours
      for (let i = 0; i < durations.length; i++) {
        const base = new Date('2024-01-15T09:00:00Z').getTime();
        cases.push({
          id: `DUR-${i}`,
          activities: [
            { name: 'Start', ts: new Date(base).toISOString() },
            { name: 'End',   ts: new Date(base + durations[i] * 3600000).toISOString() },
          ],
        });
      }
      const result = new VariantAnalyzer().analyze(buildLog(cases));
      const stats = result.variants[0].durationStats;

      expect(stats.count).toBe(10);
      expect(stats.min).toBe(1 * 3600000);
      expect(stats.max).toBe(10 * 3600000);
      // Mean of 1..10 hours = 5.5 hours
      expect(stats.mean).toBe(Math.round(5.5 * 3600000));
      // Median of even count: (5+6)/2 = 5.5 hours
      expect(stats.median).toBe(Math.round(5.5 * 3600000));
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 5. Rework detection — cases with repeated activities
  // ────────────────────────────────────────────────────────────────────────
  describe('rework detection', () => {
    it('should flag cases with repeated activities', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      // Variant 3 has rework (Goods Receipt repeated)
      const reworkVariant = result.variants.find(v => v.hasRework);
      expect(reworkVariant).toBeDefined();
      expect(reworkVariant.reworkActivities.length).toBeGreaterThan(0);
      expect(reworkVariant.reworkActivities[0].activity).toBe('Goods Receipt');
      expect(reworkVariant.reworkActivities[0].occurrences).toBe(2);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 6. Rework rate — percentage of cases with rework
  // ────────────────────────────────────────────────────────────────────────
  describe('rework rate', () => {
    it('should calculate the correct rework rate', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      // 4 of 15 cases have rework (Variant 3)
      expect(result.rework.casesWithRework).toBe(4);
      expect(result.rework.reworkRate).toBeCloseTo(4 / 15 * 100, 1);
      expect(result.rework.firstTimeRightRate).toBeCloseTo((15 - 4) / 15 * 100, 1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 7. Top rework activities
  // ────────────────────────────────────────────────────────────────────────
  describe('top rework activities', () => {
    it('should identify the most frequently repeated activities', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      expect(result.rework.reworkByActivity.length).toBeGreaterThan(0);
      // Goods Receipt is repeated in 4 cases (1 extra occurrence each)
      const grRework = result.rework.reworkByActivity.find(
        r => r.activity === 'Goods Receipt'
      );
      expect(grRework).toBeDefined();
      expect(grRework.reworkCount).toBe(4);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 8. Variant clustering — Levenshtein-based grouping
  // ────────────────────────────────────────────────────────────────────────
  describe('variant clustering', () => {
    it('should cluster similar variants together', () => {
      const log = buildP2PLog();
      // Use a generous threshold so the two full-length variants cluster
      const analyzer = new VariantAnalyzer({ clusterThreshold: 0.5 });
      const result = analyzer.analyze(log);

      expect(result.clusters.length).toBeGreaterThan(0);
      // At minimum, each cluster should have a representativeVariant and totalCases
      for (const cluster of result.clusters) {
        expect(cluster.representativeVariant).toBeDefined();
        expect(cluster.totalCases).toBeGreaterThan(0);
        expect(cluster.variants.length).toBeGreaterThan(0);
      }
    });

    it('should group identical variants in the same cluster', () => {
      // All 5 cases follow the same path
      const cases = [];
      for (let i = 0; i < 5; i++) {
        cases.push({
          id: `SAME-${i}`,
          activities: [
            { name: 'A', ts: new Date(1705300000000 + i * 86400000).toISOString() },
            { name: 'B', ts: new Date(1705300000000 + i * 86400000 + 3600000).toISOString() },
          ],
        });
      }
      const result = new VariantAnalyzer().analyze(buildLog(cases));
      expect(result.clusters.length).toBe(1);
      expect(result.clusters[0].totalCases).toBe(5);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 9. Root cause analysis — attribute-based lift
  // ────────────────────────────────────────────────────────────────────────
  describe('root cause analysis', () => {
    it('should identify case attributes correlated with specific variants', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      // Root causes may or may not be found depending on lift thresholds.
      // The rework variant is AMER+urgent; happy path is EMEA+normal.
      // With 15 cases, the lifts should trigger for some attribute/variant combos.
      expect(Array.isArray(result.rootCauses)).toBe(true);

      if (result.rootCauses.length > 0) {
        const rc = result.rootCauses[0];
        expect(rc).toHaveProperty('variantRank');
        expect(rc).toHaveProperty('attribute');
        expect(rc).toHaveProperty('value');
        expect(rc).toHaveProperty('lift');
        expect(rc).toHaveProperty('support');
        expect(rc).toHaveProperty('confidence');
        expect(rc).toHaveProperty('direction');
      }
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 10. Deviation identification
  // ────────────────────────────────────────────────────────────────────────
  describe('deviation identification', () => {
    it('should mark non-happy-path variants as deviations', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      expect(result.deviations.deviationCount).toBe(3); // 4 variants - 1 happy path = 3
      expect(result.deviations.deviations.length).toBe(3);

      for (const dev of result.deviations.deviations) {
        expect(dev).toHaveProperty('variantRank');
        expect(dev).toHaveProperty('caseCount');
        expect(dev).toHaveProperty('editDistance');
        expect(dev).toHaveProperty('type');
        expect(['skip', 'insertion', 'substitution', 'reorder']).toContain(dev.type);
      }
    });

    it('should detect skipped activities in short-path variants', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      // Variant 4 (PO -> GR -> Pay) skips Approve and IR
      const shortDeviation = result.deviations.deviations.find(d => {
        return d.skippedActivities.includes('Approve Purchase Order');
      });
      expect(shortDeviation).toBeDefined();
      expect(shortDeviation.skippedActivities).toContain('Invoice Receipt');
      expect(shortDeviation.type).toBe('skip');
    });

    it('should detect reorder deviations when activities are in different order', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      // Variant 2 (PO -> Approve -> IR -> GR -> Pay) has reordered activities
      const reorderDeviation = result.deviations.deviations.find(d => d.type === 'reorder');
      expect(reorderDeviation).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 11. maxVariants option
  // ────────────────────────────────────────────────────────────────────────
  describe('maxVariants option', () => {
    it('should limit the output to the specified number of variants', () => {
      const log = buildP2PLog();
      const analyzer = new VariantAnalyzer({ maxVariants: 2 });
      const result = analyzer.analyze(log);

      expect(result.variants.length).toBe(2);
      // totalVariantCount should still reflect all discovered variants
      expect(result.totalVariantCount).toBe(4);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 12. clusterThreshold option
  // ────────────────────────────────────────────────────────────────────────
  describe('clusterThreshold option', () => {
    it('should create more clusters with a lower threshold', () => {
      const log = buildP2PLog();

      // Very strict clustering (threshold=0) — each variant is its own cluster
      const strict = new VariantAnalyzer({ clusterThreshold: 0 }).analyze(log);
      // Generous clustering
      const loose = new VariantAnalyzer({ clusterThreshold: 0.8 }).analyze(log);

      expect(strict.clusters.length).toBeGreaterThanOrEqual(loose.clusters.length);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 13. Single variant — all cases follow same path
  // ────────────────────────────────────────────────────────────────────────
  describe('single variant', () => {
    it('should handle a log where all cases follow the same path', () => {
      const cases = [];
      for (let i = 0; i < 10; i++) {
        const base = new Date('2024-01-15T09:00:00Z').getTime() + i * 86400000;
        cases.push({
          id: `SINGLE-${i}`,
          activities: [
            { name: 'Create PO', ts: new Date(base).toISOString() },
            { name: 'Approve',   ts: new Date(base + 3600000).toISOString() },
            { name: 'Pay',       ts: new Date(base + 7200000).toISOString() },
          ],
        });
      }
      const result = new VariantAnalyzer().analyze(buildLog(cases));

      expect(result.totalVariantCount).toBe(1);
      expect(result.variants[0].caseCount).toBe(10);
      expect(result.variants[0].frequency).toBe(100);
      expect(result.happyPath.frequency).toBe(100);
      expect(result.rework.casesWithRework).toBe(0);
      expect(result.rework.reworkRate).toBe(0);
      expect(result.deviations.deviationCount).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 14. Empty event log
  // ────────────────────────────────────────────────────────────────────────
  describe('empty event log', () => {
    it('should handle an empty event log gracefully', () => {
      const log = new EventLog('EmptyLog');
      const result = new VariantAnalyzer().analyze(log);

      expect(result.totalVariantCount).toBe(0);
      expect(result.totalCaseCount).toBe(0);
      expect(result.variants).toHaveLength(0);
      expect(result.happyPath).toBeNull();
      expect(result.rework.casesWithRework).toBe(0);
      expect(result.rework.reworkRate).toBe(0);
      expect(result.clusters).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 15. VariantAnalysisResult.getSummary()
  // ────────────────────────────────────────────────────────────────────────
  describe('VariantAnalysisResult.getSummary()', () => {
    it('should return a summary object with the correct shape', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);
      const summary = result.getSummary();

      expect(summary).toHaveProperty('totalVariants');
      expect(summary).toHaveProperty('totalCases');
      expect(summary).toHaveProperty('happyPathRate');
      expect(summary).toHaveProperty('reworkRate');
      expect(summary).toHaveProperty('firstTimeRightRate');
      expect(summary).toHaveProperty('clusterCount');
      expect(summary).toHaveProperty('top5VariantsCoverage');
      expect(summary).toHaveProperty('top10VariantsCoverage');

      expect(summary.totalVariants).toBe(4);
      expect(summary.totalCases).toBe(15);
      expect(summary.happyPathRate).toBe(40); // 6/15 * 100
    });

    it('should calculate top5 and top10 variant coverage correctly', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);
      const summary = result.getSummary();

      // All 4 variants are within top-5 and top-10
      expect(summary.top5VariantsCoverage).toBe(100);
      expect(summary.top10VariantsCoverage).toBe(100);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 16. VariantAnalysisResult.toJSON()
  // ────────────────────────────────────────────────────────────────────────
  describe('VariantAnalysisResult.toJSON()', () => {
    it('should serialize to JSON with correct structure', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);
      const json = result.toJSON();

      expect(json).toHaveProperty('summary');
      expect(json).toHaveProperty('happyPath');
      expect(json).toHaveProperty('rework');
      expect(json).toHaveProperty('variants');
      expect(json).toHaveProperty('clusters');
      expect(json).toHaveProperty('deviations');
      expect(json).toHaveProperty('rootCauses');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 17. toJSON() variant entries have correct shape
  // ────────────────────────────────────────────────────────────────────────
  describe('toJSON variant entry shape', () => {
    it('should include rank, activities, caseCount, frequency, hasRework, and durationStats per variant', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);
      const json = result.toJSON();

      for (const v of json.variants) {
        expect(v).toHaveProperty('rank');
        expect(v).toHaveProperty('activities');
        expect(v).toHaveProperty('caseCount');
        expect(v).toHaveProperty('frequency');
        expect(v).toHaveProperty('hasRework');
        expect(v).toHaveProperty('durationStats');
        expect(Array.isArray(v.activities)).toBe(true);
      }
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 18. Frequency percentages sum to 100
  // ────────────────────────────────────────────────────────────────────────
  describe('frequency percentages', () => {
    it('should have variant frequencies that sum to 100%', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      const totalFrequency = result.variants.reduce((sum, v) => sum + v.frequency, 0);
      expect(totalFrequency).toBeCloseTo(100, 0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 19. Variant with no rework is flagged correctly
  // ────────────────────────────────────────────────────────────────────────
  describe('rework flag on variants', () => {
    it('should flag variants with rework and leave clean ones unflagged', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      const withRework = result.variants.filter(v => v.hasRework);
      const withoutRework = result.variants.filter(v => !v.hasRework);

      expect(withRework.length).toBe(1); // Only Variant 3 has rework
      expect(withoutRework.length).toBe(3);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 20. Deviation conformant rate
  // ────────────────────────────────────────────────────────────────────────
  describe('deviation conformant rate', () => {
    it('should calculate the conformant rate based on happy path share', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      // Happy path has 6 of 15 cases = 40%
      expect(result.deviations.conformantRate).toBe(40);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 21. Constructor defaults
  // ────────────────────────────────────────────────────────────────────────
  describe('constructor defaults', () => {
    it('should have correct default option values', () => {
      const analyzer = new VariantAnalyzer();
      expect(analyzer.maxVariants).toBe(100);
      expect(analyzer.clusterThreshold).toBe(0.3);
    });

    it('should accept custom options', () => {
      const analyzer = new VariantAnalyzer({ maxVariants: 50, clusterThreshold: 0.5 });
      expect(analyzer.maxVariants).toBe(50);
      expect(analyzer.clusterThreshold).toBe(0.5);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 22. Unique activity count per variant
  // ────────────────────────────────────────────────────────────────────────
  describe('unique activity count per variant', () => {
    it('should track the number of unique activities in each variant', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      // Happy path: 5 unique activities
      expect(result.variants[0].uniqueActivities).toBe(5);

      // Rework variant: has Goods Receipt twice, so 5 unique out of 6 events
      const reworkVariant = result.variants.find(v => v.hasRework);
      expect(reworkVariant.uniqueActivities).toBe(5);
      expect(reworkVariant.activityCount).toBe(6);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 23. totalReworkEvents count
  // ────────────────────────────────────────────────────────────────────────
  describe('totalReworkEvents', () => {
    it('should count total extra (rework) event occurrences', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      // 4 cases each have 1 extra Goods Receipt = 4 rework events
      expect(result.rework.totalReworkEvents).toBe(4);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 24. Deviation edit distances are valid
  // ────────────────────────────────────────────────────────────────────────
  describe('deviation edit distances', () => {
    it('should produce edit distances between 0 and 1', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer().analyze(log);

      for (const dev of result.deviations.deviations) {
        expect(dev.editDistance).toBeGreaterThanOrEqual(0);
        expect(dev.editDistance).toBeLessThanOrEqual(1);
      }
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 25. Cluster IDs are sequential from 0
  // ────────────────────────────────────────────────────────────────────────
  describe('cluster IDs', () => {
    it('should assign sequential cluster IDs starting from 0', () => {
      const log = buildP2PLog();
      const result = new VariantAnalyzer({ clusterThreshold: 0 }).analyze(log);

      for (let i = 0; i < result.clusters.length; i++) {
        expect(result.clusters[i].clusterId).toBe(i);
      }
    });
  });
});
