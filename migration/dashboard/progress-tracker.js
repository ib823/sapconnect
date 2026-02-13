/**
 * Progress Tracker
 *
 * Tracks migration progress across multiple runs and phases.
 * Provides timeline, phase completion percentages, and
 * estimated time to completion based on historical velocity.
 */

const Logger = require('../../lib/logger');

class ProgressTracker {
  constructor(options = {}) {
    this.logger = new Logger('progress-tracker', { level: options.verbose ? 'debug' : 'info' });
    this._events = [];
    this._phases = ['assess', 'remediate', 'profile', 'migrate', 'validate', 'test', 'cutover'];
    this._currentPhase = options.initialPhase || 'assess';
    this._objectProgress = new Map();
  }

  /**
   * Record a migration event
   */
  recordEvent(event) {
    this._events.push({
      timestamp: new Date().toISOString(),
      ...event,
    });

    if (event.objectId && event.status) {
      this._objectProgress.set(event.objectId, {
        status: event.status,
        phase: event.phase || this._currentPhase,
        lastUpdate: new Date().toISOString(),
        recordCount: event.recordCount || 0,
      });
    }
  }

  /**
   * Set the current migration phase
   */
  setPhase(phase) {
    if (this._phases.includes(phase)) {
      this._currentPhase = phase;
      this.recordEvent({ type: 'phase_change', phase });
    }
  }

  /**
   * Record completion of a migration object run
   */
  recordObjectRun(result) {
    this.recordEvent({
      type: 'object_run',
      objectId: result.objectId,
      status: result.status,
      phase: 'migrate',
      recordCount: result.phases?.extract?.recordCount || 0,
      durationMs: result.stats?.durationMs || 0,
    });
  }

  /**
   * Get current progress snapshot
   */
  getProgress() {
    const phaseIndex = this._phases.indexOf(this._currentPhase);
    const phaseProgress = this._phases.length > 0
      ? Math.round((phaseIndex / this._phases.length) * 100)
      : 0;

    const objectStatuses = {};
    for (const [id, prog] of this._objectProgress) {
      objectStatuses[id] = prog;
    }

    const totalObjects = this._objectProgress.size;
    const completedObjects = Array.from(this._objectProgress.values())
      .filter(p => p.status === 'completed' || p.status === 'completed_with_errors').length;

    return {
      currentPhase: this._currentPhase,
      phaseIndex,
      totalPhases: this._phases.length,
      phaseProgress,
      migrationProgress: totalObjects > 0
        ? Math.round((completedObjects / totalObjects) * 100)
        : 0,
      totalObjects,
      completedObjects,
      objectStatuses,
      timeline: this._getTimeline(),
      velocity: this._calculateVelocity(),
    };
  }

  /**
   * Get event timeline (last 50 events)
   */
  _getTimeline() {
    return this._events.slice(-50).map(e => ({
      timestamp: e.timestamp,
      type: e.type,
      objectId: e.objectId || null,
      status: e.status || null,
      phase: e.phase || null,
    }));
  }

  /**
   * Calculate migration velocity (objects per minute)
   */
  _calculateVelocity() {
    const objectRuns = this._events.filter(e => e.type === 'object_run');
    if (objectRuns.length < 2) return { objectsPerMinute: 0, recordsPerMinute: 0 };

    const first = new Date(objectRuns[0].timestamp).getTime();
    const last = new Date(objectRuns[objectRuns.length - 1].timestamp).getTime();
    const durationMin = (last - first) / 60000;

    if (durationMin <= 0) return { objectsPerMinute: objectRuns.length, recordsPerMinute: 0 };

    const totalRecords = objectRuns.reduce((s, e) => s + (e.recordCount || 0), 0);

    return {
      objectsPerMinute: Math.round((objectRuns.length / durationMin) * 100) / 100,
      recordsPerMinute: Math.round(totalRecords / durationMin),
    };
  }

  /**
   * Record a batch of migration results (from runAll)
   */
  recordBatchRun(runResult) {
    for (const result of runResult.results) {
      this.recordObjectRun(result);
    }
  }

  /**
   * Reset all progress data
   */
  reset() {
    this._events = [];
    this._objectProgress.clear();
    this._currentPhase = 'assess';
  }
}

module.exports = ProgressTracker;
