'use strict';

const { Event, Trace, EventLog } = require('../../../extraction/process-mining/event-log');

// ---------------------------------------------------------------------------
// Helper: build a realistic SAP O2C event log
// ---------------------------------------------------------------------------

function buildO2CEventLog() {
  const log = new EventLog('SAP O2C Test Log');

  // Case 1: happy-path order
  const t1 = new Trace('SO-1001', { customer: 'ACME Corp', region: 'US' });
  t1.addEvent(new Event({ activity: 'Create Sales Order', timestamp: '2025-01-10T08:00:00Z', resource: 'USER01', attributes: { amount: 5000 } }));
  t1.addEvent(new Event({ activity: 'Credit Check',      timestamp: '2025-01-10T09:00:00Z', resource: 'USER02' }));
  t1.addEvent(new Event({ activity: 'Create Delivery',   timestamp: '2025-01-12T10:00:00Z', resource: 'USER03' }));
  t1.addEvent(new Event({ activity: 'Goods Issue',       timestamp: '2025-01-13T14:00:00Z', resource: 'USER03' }));
  t1.addEvent(new Event({ activity: 'Create Invoice',    timestamp: '2025-01-14T08:00:00Z', resource: 'USER04' }));
  t1.addEvent(new Event({ activity: 'Receive Payment',   timestamp: '2025-02-10T16:00:00Z', resource: 'USER05' }));
  log.addTrace(t1);

  // Case 2: same variant as case 1 (different resources/times)
  const t2 = new Trace('SO-1002', { customer: 'Beta Inc', region: 'EU' });
  t2.addEvent(new Event({ activity: 'Create Sales Order', timestamp: '2025-01-11T07:30:00Z', resource: 'USER01' }));
  t2.addEvent(new Event({ activity: 'Credit Check',      timestamp: '2025-01-11T08:00:00Z', resource: 'USER02' }));
  t2.addEvent(new Event({ activity: 'Create Delivery',   timestamp: '2025-01-14T09:00:00Z', resource: 'USER06' }));
  t2.addEvent(new Event({ activity: 'Goods Issue',       timestamp: '2025-01-15T11:00:00Z', resource: 'USER06' }));
  t2.addEvent(new Event({ activity: 'Create Invoice',    timestamp: '2025-01-16T10:00:00Z', resource: 'USER04' }));
  t2.addEvent(new Event({ activity: 'Receive Payment',   timestamp: '2025-02-15T14:00:00Z', resource: 'USER05' }));
  log.addTrace(t2);

  // Case 3: different variant with rework (order changed after creation)
  const t3 = new Trace('SO-1003', { customer: 'Gamma Ltd', region: 'US' });
  t3.addEvent(new Event({ activity: 'Create Sales Order', timestamp: '2025-01-15T09:00:00Z', resource: 'USER01' }));
  t3.addEvent(new Event({ activity: 'Credit Check',      timestamp: '2025-01-15T10:00:00Z', resource: 'USER02' }));
  t3.addEvent(new Event({ activity: 'Change Sales Order', timestamp: '2025-01-16T08:00:00Z', resource: 'USER01' }));
  t3.addEvent(new Event({ activity: 'Credit Check',      timestamp: '2025-01-16T09:00:00Z', resource: 'USER02' }));
  t3.addEvent(new Event({ activity: 'Create Delivery',   timestamp: '2025-01-18T10:00:00Z', resource: 'USER03' }));
  t3.addEvent(new Event({ activity: 'Goods Issue',       timestamp: '2025-01-19T14:00:00Z', resource: 'USER03' }));
  t3.addEvent(new Event({ activity: 'Create Invoice',    timestamp: '2025-01-20T08:00:00Z', resource: 'USER04' }));
  t3.addEvent(new Event({ activity: 'Receive Payment',   timestamp: '2025-02-20T16:00:00Z', resource: 'USER05' }));
  log.addTrace(t3);

  return log;
}

// ===========================================================================
// Event class
// ===========================================================================

describe('Event', () => {
  describe('constructor', () => {
    it('creates an event with all properties', () => {
      const evt = new Event({
        activity: 'Create Sales Order',
        timestamp: '2025-01-15T10:00:00Z',
        resource: 'USER01',
        lifecycle: 'start',
        attributes: { amount: 5000, currency: 'USD' },
        sourceRef: { table: 'VBAK', key: '0000001234', field: 'ERDAT' },
      });

      expect(evt.activity).toBe('Create Sales Order');
      expect(evt.timestamp).toBeInstanceOf(Date);
      expect(evt.timestamp.toISOString()).toBe('2025-01-15T10:00:00.000Z');
      expect(evt.resource).toBe('USER01');
      expect(evt.lifecycle).toBe('start');
      expect(evt.attributes.get('amount')).toBe(5000);
      expect(evt.attributes.get('currency')).toBe('USD');
      expect(evt.sourceRef).toEqual({ table: 'VBAK', key: '0000001234', field: 'ERDAT' });
    });

    it('defaults lifecycle to "complete"', () => {
      const evt = new Event({ activity: 'Post', timestamp: new Date() });
      expect(evt.lifecycle).toBe('complete');
    });

    it('defaults resource to null', () => {
      const evt = new Event({ activity: 'Post', timestamp: new Date() });
      expect(evt.resource).toBeNull();
    });

    it('accepts a Date object as timestamp', () => {
      const d = new Date('2025-06-01T12:00:00Z');
      const evt = new Event({ activity: 'X', timestamp: d });
      expect(evt.timestamp.getTime()).toBe(d.getTime());
    });

    it('accepts a numeric timestamp', () => {
      const ms = Date.now();
      const evt = new Event({ activity: 'X', timestamp: ms });
      expect(evt.timestamp.getTime()).toBe(ms);
    });

    it('accepts XES-style +00:00 timestamps', () => {
      const evt = new Event({ activity: 'X', timestamp: '2025-01-01T00:00:00.000+00:00' });
      expect(evt.timestamp.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('accepts attributes as a Map', () => {
      const attrs = new Map([['k1', 'v1'], ['k2', 42]]);
      const evt = new Event({ activity: 'X', timestamp: new Date(), attributes: attrs });
      expect(evt.attributes.get('k1')).toBe('v1');
      expect(evt.attributes.get('k2')).toBe(42);
    });

    it('throws when activity is missing', () => {
      expect(() => new Event({ timestamp: new Date() })).toThrow('activity');
    });

    it('throws when activity is empty string', () => {
      expect(() => new Event({ activity: '', timestamp: new Date() })).toThrow('activity');
    });

    it('throws when timestamp is missing', () => {
      expect(() => new Event({ activity: 'X' })).toThrow('timestamp');
    });

    it('throws for unparseable timestamp string', () => {
      expect(() => new Event({ activity: 'X', timestamp: 'not-a-date' })).toThrow();
    });
  });

  describe('toJSON()', () => {
    it('serializes all standard fields', () => {
      const evt = new Event({
        activity: 'Goods Issue',
        timestamp: '2025-03-01T08:30:00Z',
        resource: 'WH_USER',
        lifecycle: 'complete',
      });
      const json = evt.toJSON();
      expect(json.activity).toBe('Goods Issue');
      expect(json.timestamp).toBe('2025-03-01T08:30:00.000Z');
      expect(json.resource).toBe('WH_USER');
      expect(json.lifecycle).toBe('complete');
    });

    it('omits resource when null', () => {
      const evt = new Event({ activity: 'X', timestamp: new Date() });
      expect(evt.toJSON()).not.toHaveProperty('resource');
    });

    it('omits attributes when empty', () => {
      const evt = new Event({ activity: 'X', timestamp: new Date() });
      expect(evt.toJSON()).not.toHaveProperty('attributes');
    });

    it('includes attributes when present', () => {
      const evt = new Event({ activity: 'X', timestamp: new Date(), attributes: { doc: '123' } });
      expect(evt.toJSON().attributes).toEqual({ doc: '123' });
    });

    it('includes sourceRef when present', () => {
      const evt = new Event({ activity: 'X', timestamp: new Date(), sourceRef: { table: 'VBAK', key: '1' } });
      expect(evt.toJSON().sourceRef).toEqual({ table: 'VBAK', key: '1' });
    });
  });

  describe('fromJSON()', () => {
    it('round-trips through toJSON/fromJSON', () => {
      const original = new Event({
        activity: 'Create Invoice',
        timestamp: '2025-04-01T12:00:00Z',
        resource: 'FIN01',
        lifecycle: 'complete',
        attributes: { amount: 1234.56 },
        sourceRef: { table: 'VBRK', key: '9000001', field: 'ERDAT' },
      });
      const restored = Event.fromJSON(original.toJSON());
      expect(restored.activity).toBe(original.activity);
      expect(restored.timestamp.getTime()).toBe(original.timestamp.getTime());
      expect(restored.resource).toBe(original.resource);
      expect(restored.lifecycle).toBe(original.lifecycle);
      expect(restored.attributes.get('amount')).toBe(1234.56);
      expect(restored.sourceRef).toEqual(original.sourceRef);
    });
  });

  describe('clone()', () => {
    it('produces an independent deep copy', () => {
      const evt = new Event({
        activity: 'Pay',
        timestamp: '2025-01-01T00:00:00Z',
        resource: 'U',
        attributes: { x: 1 },
        sourceRef: { table: 'T', key: 'K' },
      });
      const copy = evt.clone();
      expect(copy.activity).toBe(evt.activity);
      expect(copy.timestamp.getTime()).toBe(evt.timestamp.getTime());
      expect(copy).not.toBe(evt);
      // Mutating copy does not affect original
      copy.attributes.set('x', 99);
      expect(evt.attributes.get('x')).toBe(1);
    });
  });
});

// ===========================================================================
// Trace class
// ===========================================================================

describe('Trace', () => {
  describe('constructor', () => {
    it('requires a caseId', () => {
      expect(() => new Trace()).toThrow('caseId');
      expect(() => new Trace('')).toThrow('caseId');
    });

    it('initialises with empty events and attributes', () => {
      const t = new Trace('C1');
      expect(t.caseId).toBe('C1');
      expect(t.events).toHaveLength(0);
      expect(t.attributes.size).toBe(0);
    });

    it('accepts case-level attributes as object', () => {
      const t = new Trace('C1', { plant: '1000', region: 'US' });
      expect(t.attributes.get('plant')).toBe('1000');
    });
  });

  describe('addEvent() — chronological insertion', () => {
    it('appends events in order when added chronologically', () => {
      const t = new Trace('T1');
      t.addEvent(new Event({ activity: 'A', timestamp: '2025-01-01T01:00:00Z' }));
      t.addEvent(new Event({ activity: 'B', timestamp: '2025-01-01T02:00:00Z' }));
      t.addEvent(new Event({ activity: 'C', timestamp: '2025-01-01T03:00:00Z' }));
      expect(t.getActivities()).toEqual(['A', 'B', 'C']);
    });

    it('inserts out-of-order events at the correct position', () => {
      const t = new Trace('T1');
      t.addEvent(new Event({ activity: 'C', timestamp: '2025-01-01T03:00:00Z' }));
      t.addEvent(new Event({ activity: 'A', timestamp: '2025-01-01T01:00:00Z' }));
      t.addEvent(new Event({ activity: 'B', timestamp: '2025-01-01T02:00:00Z' }));
      expect(t.getActivities()).toEqual(['A', 'B', 'C']);
    });

    it('performs stable insertion for equal timestamps', () => {
      const t = new Trace('T1');
      t.addEvent(new Event({ activity: 'First',  timestamp: '2025-01-01T10:00:00Z' }));
      t.addEvent(new Event({ activity: 'Second', timestamp: '2025-01-01T10:00:00Z' }));
      t.addEvent(new Event({ activity: 'Third',  timestamp: '2025-01-01T10:00:00Z' }));
      expect(t.getActivities()).toEqual(['First', 'Second', 'Third']);
    });

    it('rejects non-Event objects', () => {
      const t = new Trace('T1');
      expect(() => t.addEvent({ activity: 'X', timestamp: new Date() })).toThrow('Event instance');
    });

    it('supports chaining', () => {
      const t = new Trace('T1');
      const result = t.addEvent(new Event({ activity: 'A', timestamp: new Date() }));
      expect(result).toBe(t);
    });
  });

  describe('getDuration()', () => {
    it('returns 0 for empty or single-event trace', () => {
      const t0 = new Trace('T');
      expect(t0.getDuration()).toBe(0);

      const t1 = new Trace('T');
      t1.addEvent(new Event({ activity: 'A', timestamp: '2025-01-01T00:00:00Z' }));
      expect(t1.getDuration()).toBe(0);
    });

    it('returns correct duration in milliseconds', () => {
      const t = new Trace('T');
      t.addEvent(new Event({ activity: 'A', timestamp: '2025-01-01T00:00:00Z' }));
      t.addEvent(new Event({ activity: 'B', timestamp: '2025-01-01T01:00:00Z' }));
      expect(t.getDuration()).toBe(3600000); // 1 hour in ms
    });
  });

  describe('getVariantKey()', () => {
    it('returns arrow-delimited activity sequence', () => {
      const t = new Trace('T');
      t.addEvent(new Event({ activity: 'Create', timestamp: '2025-01-01T01:00:00Z' }));
      t.addEvent(new Event({ activity: 'Approve', timestamp: '2025-01-01T02:00:00Z' }));
      t.addEvent(new Event({ activity: 'Post', timestamp: '2025-01-01T03:00:00Z' }));
      expect(t.getVariantKey()).toBe('Create -> Approve -> Post');
    });

    it('returns empty string for empty trace', () => {
      expect(new Trace('T').getVariantKey()).toBe('');
    });
  });

  describe('hasRework()', () => {
    it('returns false when all activities are unique', () => {
      const t = new Trace('T');
      t.addEvent(new Event({ activity: 'A', timestamp: '2025-01-01T01:00:00Z' }));
      t.addEvent(new Event({ activity: 'B', timestamp: '2025-01-01T02:00:00Z' }));
      expect(t.hasRework()).toBe(false);
    });

    it('returns true when an activity repeats', () => {
      const t = new Trace('T');
      t.addEvent(new Event({ activity: 'A', timestamp: '2025-01-01T01:00:00Z' }));
      t.addEvent(new Event({ activity: 'B', timestamp: '2025-01-01T02:00:00Z' }));
      t.addEvent(new Event({ activity: 'A', timestamp: '2025-01-01T03:00:00Z' }));
      expect(t.hasRework()).toBe(true);
    });
  });

  describe('getReworkActivities()', () => {
    it('returns activities that appear more than once', () => {
      const t = new Trace('T');
      t.addEvent(new Event({ activity: 'A', timestamp: '2025-01-01T01:00:00Z' }));
      t.addEvent(new Event({ activity: 'B', timestamp: '2025-01-01T02:00:00Z' }));
      t.addEvent(new Event({ activity: 'A', timestamp: '2025-01-01T03:00:00Z' }));
      t.addEvent(new Event({ activity: 'C', timestamp: '2025-01-01T04:00:00Z' }));
      expect(t.getReworkActivities()).toEqual(['A']);
    });
  });

  describe('getResources()', () => {
    it('returns set of unique resources', () => {
      const t = new Trace('T');
      t.addEvent(new Event({ activity: 'A', timestamp: '2025-01-01T01:00:00Z', resource: 'U1' }));
      t.addEvent(new Event({ activity: 'B', timestamp: '2025-01-01T02:00:00Z', resource: 'U2' }));
      t.addEvent(new Event({ activity: 'C', timestamp: '2025-01-01T03:00:00Z', resource: 'U1' }));
      const res = t.getResources();
      expect(res.size).toBe(2);
      expect(res.has('U1')).toBe(true);
      expect(res.has('U2')).toBe(true);
    });

    it('excludes null resources', () => {
      const t = new Trace('T');
      t.addEvent(new Event({ activity: 'A', timestamp: '2025-01-01T01:00:00Z' }));
      expect(t.getResources().size).toBe(0);
    });
  });

  describe('getActivityDurations()', () => {
    it('returns inter-event durations keyed by the first activity', () => {
      const t = new Trace('T');
      t.addEvent(new Event({ activity: 'A', timestamp: '2025-01-01T00:00:00Z' }));
      t.addEvent(new Event({ activity: 'B', timestamp: '2025-01-01T01:00:00Z' }));
      t.addEvent(new Event({ activity: 'C', timestamp: '2025-01-01T04:00:00Z' }));
      const durations = t.getActivityDurations();
      expect(durations.get('A')).toBe(3600000);      // 1 hour
      expect(durations.get('B')).toBe(3 * 3600000);   // 3 hours
    });
  });

  describe('toJSON() / fromJSON()', () => {
    it('round-trips a trace', () => {
      const t = new Trace('C-42', { priority: 'high' });
      t.addEvent(new Event({ activity: 'X', timestamp: '2025-01-01T00:00:00Z', resource: 'R' }));
      t.addEvent(new Event({ activity: 'Y', timestamp: '2025-01-02T00:00:00Z' }));

      const restored = Trace.fromJSON(t.toJSON());
      expect(restored.caseId).toBe('C-42');
      expect(restored.events).toHaveLength(2);
      expect(restored.attributes.get('priority')).toBe('high');
      expect(restored.getVariantKey()).toBe(t.getVariantKey());
    });
  });
});

// ===========================================================================
// EventLog class
// ===========================================================================

describe('EventLog', () => {
  describe('construction and trace management', () => {
    it('creates with default name', () => {
      const log = new EventLog();
      expect(log.name).toBe('EventLog');
      expect(log.getCaseCount()).toBe(0);
    });

    it('addTrace stores and replaces by caseId', () => {
      const log = new EventLog();
      const t1 = new Trace('C1');
      t1.addEvent(new Event({ activity: 'A', timestamp: new Date() }));
      log.addTrace(t1);
      expect(log.getCaseCount()).toBe(1);

      // Replace with same caseId
      const t1b = new Trace('C1');
      t1b.addEvent(new Event({ activity: 'B', timestamp: new Date() }));
      log.addTrace(t1b);
      expect(log.getCaseCount()).toBe(1);
      expect(log.getTrace('C1').getActivities()).toEqual(['B']);
    });

    it('addEvent creates trace automatically if missing', () => {
      const log = new EventLog();
      log.addEvent('NEW-CASE', new Event({ activity: 'X', timestamp: new Date() }));
      expect(log.getCaseCount()).toBe(1);
      expect(log.getTrace('NEW-CASE')).toBeDefined();
    });

    it('addTrace rejects non-Trace argument', () => {
      const log = new EventLog();
      expect(() => log.addTrace({ caseId: 'X' })).toThrow();
    });

    it('addEvent rejects non-Event argument', () => {
      const log = new EventLog();
      expect(() => log.addEvent('C', { activity: 'X' })).toThrow();
    });
  });

  describe('statistics', () => {
    let log;
    beforeEach(() => {
      log = buildO2CEventLog();
    });

    it('getCaseCount returns correct count', () => {
      expect(log.getCaseCount()).toBe(3);
    });

    it('getEventCount returns total across all traces', () => {
      // 6 + 6 + 8 = 20
      expect(log.getEventCount()).toBe(20);
    });

    it('getActivitySet returns all unique activities', () => {
      const acts = log.getActivitySet();
      expect(acts.has('Create Sales Order')).toBe(true);
      expect(acts.has('Credit Check')).toBe(true);
      expect(acts.has('Create Delivery')).toBe(true);
      expect(acts.has('Goods Issue')).toBe(true);
      expect(acts.has('Create Invoice')).toBe(true);
      expect(acts.has('Receive Payment')).toBe(true);
      expect(acts.has('Change Sales Order')).toBe(true);
      expect(acts.size).toBe(7);
    });

    it('getResourceSet returns all unique resources', () => {
      const res = log.getResourceSet();
      expect(res.has('USER01')).toBe(true);
      expect(res.has('USER06')).toBe(true);
      expect(res.size).toBe(6);
    });
  });

  describe('getVariants()', () => {
    it('returns variants sorted by frequency descending', () => {
      const log = buildO2CEventLog();
      const variants = log.getVariants();
      const entries = [...variants.entries()];

      // First variant should be the one followed by 2 cases (SO-1001, SO-1002)
      expect(entries[0][1].count).toBe(2);
      expect(entries[0][1].caseIds).toContain('SO-1001');
      expect(entries[0][1].caseIds).toContain('SO-1002');

      // Second variant: the rework case
      expect(entries[1][1].count).toBe(1);
    });

    it('reports correct percentages', () => {
      const log = buildO2CEventLog();
      const variants = log.getVariants();
      const entries = [...variants.entries()];
      // 2 out of 3 = 66.67%
      expect(entries[0][1].percentage).toBeCloseTo(66.67, 1);
      // 1 out of 3 = 33.33%
      expect(entries[1][1].percentage).toBeCloseTo(33.33, 1);
    });
  });

  describe('getDirectlyFollowsMatrix()', () => {
    it('returns correct DFG counts', () => {
      const log = buildO2CEventLog();
      const dfg = log.getDirectlyFollowsMatrix();

      // All 3 cases start with "Create Sales Order" followed by "Credit Check"
      // (case 3 has it twice but the first occurrence also follows Create Sales Order)
      expect(dfg.get('Create Sales Order').get('Credit Check')).toBe(3);

      // Only case 3 has "Change Sales Order" -> "Credit Check"
      expect(dfg.get('Change Sales Order').get('Credit Check')).toBe(1);

      // "Goods Issue" -> "Create Invoice" present in all 3
      expect(dfg.get('Goods Issue').get('Create Invoice')).toBe(3);
    });
  });

  describe('getTimeRange via getSummary()', () => {
    it('returns the earliest start and latest end', () => {
      const log = buildO2CEventLog();
      const summary = log.getSummary();
      // Earliest event: 2025-01-10T08:00:00Z (case 1)
      expect(summary.timeRange.start).toBe('2025-01-10T08:00:00.000Z');
      // Latest event: 2025-02-20T16:00:00Z (case 3)
      expect(summary.timeRange.end).toBe('2025-02-20T16:00:00.000Z');
    });
  });

  describe('filtering', () => {
    let log;
    beforeEach(() => {
      log = buildO2CEventLog();
    });

    it('filterByCases keeps only specified cases', () => {
      const filtered = log.filterByCases(['SO-1001', 'SO-1003']);
      expect(filtered.getCaseCount()).toBe(2);
      expect(filtered.getTrace('SO-1001')).toBeDefined();
      expect(filtered.getTrace('SO-1002')).toBeUndefined();
    });

    it('filterByCases accepts a Set', () => {
      const filtered = log.filterByCases(new Set(['SO-1002']));
      expect(filtered.getCaseCount()).toBe(1);
    });

    it('filterByActivities keeps only events with matching activities', () => {
      const filtered = log.filterByActivities(['Create Sales Order', 'Receive Payment']);
      expect(filtered.getCaseCount()).toBe(3);
      // Each trace should have exactly 2 events
      for (const trace of filtered.traces.values()) {
        expect(trace.events).toHaveLength(2);
      }
    });

    it('filterByActivities drops traces with no matching events', () => {
      const filtered = log.filterByActivities(['Nonexistent Activity']);
      expect(filtered.getCaseCount()).toBe(0);
    });

    it('filterByTimeRange returns overlapping cases', () => {
      // Range that covers all 3 cases (case 3 starts Jan 15, ends Feb 20)
      const filtered = log.filterByTimeRange('2025-01-01T00:00:00Z', '2025-03-01T00:00:00Z');
      expect(filtered.getCaseCount()).toBe(3);
    });

    it('filterByTimeRange returns only cases overlapping the range', () => {
      // Range ending before case 3 starts (Jan 15) - only cases 1 and 2 overlap
      const filtered = log.filterByTimeRange('2025-01-10T00:00:00Z', '2025-01-14T00:00:00Z');
      expect(filtered.getCaseCount()).toBe(2);
    });

    it('filterByTimeRange excludes non-overlapping cases', () => {
      // Range far in the future
      const filtered = log.filterByTimeRange('2026-01-01T00:00:00Z', '2026-12-31T00:00:00Z');
      expect(filtered.getCaseCount()).toBe(0);
    });

    it('filterByTimeRange throws when start > end', () => {
      expect(() => log.filterByTimeRange('2025-12-31T00:00:00Z', '2025-01-01T00:00:00Z')).toThrow();
    });

    it('filterByAttribute filters by case-level attribute', () => {
      const filtered = log.filterByAttribute('region', 'US');
      expect(filtered.getCaseCount()).toBe(2); // SO-1001 and SO-1003
      expect(filtered.getTrace('SO-1002')).toBeUndefined();
    });
  });

  describe('export: toJSON / fromJSON round-trip', () => {
    it('round-trips an event log through JSON', () => {
      const original = buildO2CEventLog();
      const json = original.toJSON();
      const restored = EventLog.fromJSON(json);

      expect(restored.name).toBe(original.name);
      expect(restored.getCaseCount()).toBe(original.getCaseCount());
      expect(restored.getEventCount()).toBe(original.getEventCount());
      expect(restored.getVariantCount()).toBe(original.getVariantCount());
    });

    it('fromJSON throws for non-object input', () => {
      expect(() => EventLog.fromJSON(null)).toThrow();
      expect(() => EventLog.fromJSON('string')).toThrow();
    });
  });

  describe('export: toCSV / fromCSV round-trip', () => {
    it('round-trips through CSV', () => {
      const original = buildO2CEventLog();
      const csv = original.toCSV();
      const restored = EventLog.fromCSV(csv, { name: 'Restored' });

      expect(restored.getCaseCount()).toBe(original.getCaseCount());
      expect(restored.getEventCount()).toBe(original.getEventCount());
    });

    it('CSV header contains standard columns', () => {
      const log = buildO2CEventLog();
      const csv = log.toCSV();
      const headerLine = csv.split('\n')[0];
      expect(headerLine).toContain('caseId');
      expect(headerLine).toContain('activity');
      expect(headerLine).toContain('timestamp');
      expect(headerLine).toContain('resource');
      expect(headerLine).toContain('lifecycle');
    });

    it('fromCSV throws for missing required columns', () => {
      expect(() => EventLog.fromCSV('bad,header\n1,2')).toThrow('caseId');
    });

    it('fromCSV throws for empty input', () => {
      expect(() => EventLog.fromCSV('')).toThrow();
    });
  });

  describe('export: toXES()', () => {
    it('produces valid XES XML', () => {
      const log = buildO2CEventLog();
      const xes = log.toXES();
      expect(xes).toContain('<?xml version="1.0"');
      expect(xes).toContain('<log xes.version="2.0"');
      expect(xes).toContain('<extension name="Concept"');
      expect(xes).toContain('<extension name="Time"');
      expect(xes).toContain('<trace>');
      expect(xes).toContain('<event>');
      expect(xes).toContain('concept:name');
      expect(xes).toContain('time:timestamp');
      expect(xes).toContain('</log>');
    });

    it('includes all traces', () => {
      const log = buildO2CEventLog();
      const xes = log.toXES();
      expect(xes).toContain('SO-1001');
      expect(xes).toContain('SO-1002');
      expect(xes).toContain('SO-1003');
    });
  });

  describe('getSummary()', () => {
    it('returns correct shape and values', () => {
      const log = buildO2CEventLog();
      const summary = log.getSummary();
      expect(summary).toHaveProperty('name');
      expect(summary).toHaveProperty('cases');
      expect(summary).toHaveProperty('events');
      expect(summary).toHaveProperty('activities');
      expect(summary).toHaveProperty('variants');
      expect(summary).toHaveProperty('timeRange');
      expect(summary).toHaveProperty('resources');
      expect(summary.timeRange).toHaveProperty('start');
      expect(summary.timeRange).toHaveProperty('end');
      expect(summary.cases).toBe(3);
      expect(summary.events).toBe(20);
      expect(summary.activities).toBe(7);
      expect(summary.variants).toBe(2);
      expect(summary.resources).toBe(6);
    });
  });

  describe('empty event log edge cases', () => {
    it('getCaseCount / getEventCount return 0', () => {
      const log = new EventLog();
      expect(log.getCaseCount()).toBe(0);
      expect(log.getEventCount()).toBe(0);
    });

    it('getActivitySet / getResourceSet return empty sets', () => {
      const log = new EventLog();
      expect(log.getActivitySet().size).toBe(0);
      expect(log.getResourceSet().size).toBe(0);
    });

    it('getVariants returns empty Map', () => {
      const log = new EventLog();
      expect(log.getVariants().size).toBe(0);
    });

    it('getDirectlyFollowsMatrix returns empty Map', () => {
      const log = new EventLog();
      expect(log.getDirectlyFollowsMatrix().size).toBe(0);
    });

    it('toJSON / toCSV / toXES do not throw', () => {
      const log = new EventLog();
      expect(() => log.toJSON()).not.toThrow();
      expect(() => log.toCSV()).not.toThrow();
      expect(() => log.toXES()).not.toThrow();
    });

    it('getSummary returns nulls for time range', () => {
      const log = new EventLog();
      const summary = log.getSummary();
      expect(summary.timeRange.start).toBeNull();
      expect(summary.timeRange.end).toBeNull();
    });
  });

  describe('getStartActivities / getEndActivities', () => {
    it('counts start and end activities correctly', () => {
      const log = buildO2CEventLog();
      const starts = log.getStartActivities();
      // All 3 cases start with "Create Sales Order"
      expect(starts.get('Create Sales Order')).toBe(3);
      expect(starts.size).toBe(1);

      const ends = log.getEndActivities();
      // All 3 cases end with "Receive Payment"
      expect(ends.get('Receive Payment')).toBe(3);
      expect(ends.size).toBe(1);
    });
  });
});
