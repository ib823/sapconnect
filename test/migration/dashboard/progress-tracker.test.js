const ProgressTracker = require('../../../migration/dashboard/progress-tracker');

describe('ProgressTracker', () => {
  let tracker;

  beforeEach(() => { tracker = new ProgressTracker(); });

  // ── Constructor ────────────────────────────────────────────

  it('starts at assess phase', () => {
    const progress = tracker.getProgress();
    expect(progress.currentPhase).toBe('assess');
    expect(progress.phaseIndex).toBe(0);
  });

  it('accepts initial phase', () => {
    const t = new ProgressTracker({ initialPhase: 'migrate' });
    expect(t.getProgress().currentPhase).toBe('migrate');
  });

  // ── setPhase ───────────────────────────────────────────────

  describe('setPhase', () => {
    it('changes current phase', () => {
      tracker.setPhase('remediate');
      expect(tracker.getProgress().currentPhase).toBe('remediate');
    });

    it('ignores invalid phases', () => {
      tracker.setPhase('nonexistent');
      expect(tracker.getProgress().currentPhase).toBe('assess');
    });

    it('records phase change event', () => {
      tracker.setPhase('migrate');
      const progress = tracker.getProgress();
      expect(progress.timeline.length).toBe(1);
      expect(progress.timeline[0].type).toBe('phase_change');
    });
  });

  // ── recordEvent ────────────────────────────────────────────

  describe('recordEvent', () => {
    it('adds event to timeline', () => {
      tracker.recordEvent({ type: 'test', message: 'hello' });
      expect(tracker.getProgress().timeline).toHaveLength(1);
    });

    it('tracks object progress', () => {
      tracker.recordEvent({ objectId: 'GL_BALANCE', status: 'completed', recordCount: 30 });
      const progress = tracker.getProgress();
      expect(progress.totalObjects).toBe(1);
      expect(progress.completedObjects).toBe(1);
      expect(progress.objectStatuses.GL_BALANCE.status).toBe('completed');
    });
  });

  // ── recordObjectRun ────────────────────────────────────────

  describe('recordObjectRun', () => {
    it('records migration result', () => {
      tracker.recordObjectRun({
        objectId: 'GL_BALANCE', status: 'completed',
        phases: { extract: { recordCount: 30 } },
        stats: { durationMs: 100 },
      });

      const progress = tracker.getProgress();
      expect(progress.objectStatuses.GL_BALANCE).toBeDefined();
      expect(progress.objectStatuses.GL_BALANCE.status).toBe('completed');
    });
  });

  // ── recordBatchRun ─────────────────────────────────────────

  describe('recordBatchRun', () => {
    it('records all results', () => {
      tracker.recordBatchRun({
        results: [
          { objectId: 'A', status: 'completed', phases: { extract: { recordCount: 10 } } },
          { objectId: 'B', status: 'completed', phases: { extract: { recordCount: 20 } } },
          { objectId: 'C', status: 'error', phases: { extract: { recordCount: 5 } } },
        ],
      });

      const progress = tracker.getProgress();
      expect(progress.totalObjects).toBe(3);
      expect(progress.completedObjects).toBe(2);
      expect(progress.migrationProgress).toBe(67); // 2/3 rounded
    });
  });

  // ── getProgress ────────────────────────────────────────────

  describe('getProgress', () => {
    it('calculates phase progress', () => {
      tracker.setPhase('validate'); // index 4 of 7
      const progress = tracker.getProgress();
      expect(progress.phaseProgress).toBe(Math.round((4 / 7) * 100));
    });

    it('returns 0 migration progress with no objects', () => {
      expect(tracker.getProgress().migrationProgress).toBe(0);
    });

    it('has velocity metrics', () => {
      const progress = tracker.getProgress();
      expect(progress.velocity).toHaveProperty('objectsPerMinute');
      expect(progress.velocity).toHaveProperty('recordsPerMinute');
    });
  });

  // ── velocity ───────────────────────────────────────────────

  describe('velocity', () => {
    it('returns 0 with fewer than 2 runs', () => {
      const velocity = tracker.getProgress().velocity;
      expect(velocity.objectsPerMinute).toBe(0);
    });
  });

  // ── reset ──────────────────────────────────────────────────

  describe('reset', () => {
    it('clears all data', () => {
      tracker.recordEvent({ objectId: 'A', status: 'completed' });
      tracker.setPhase('migrate');
      tracker.reset();

      const progress = tracker.getProgress();
      expect(progress.totalObjects).toBe(0);
      expect(progress.currentPhase).toBe('assess');
      expect(progress.timeline).toHaveLength(0);
    });
  });

  // ── timeline ───────────────────────────────────────────────

  describe('timeline', () => {
    it('limits to 50 events', () => {
      for (let i = 0; i < 60; i++) {
        tracker.recordEvent({ type: 'test', index: i });
      }
      expect(tracker.getProgress().timeline).toHaveLength(50);
    });
  });
});
