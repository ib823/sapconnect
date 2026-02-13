/**
 * Migration Checkpoint Manager
 *
 * Saves and restores migration state for crash recovery
 * and resumable long-running migrations.
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../lib/logger');

class CheckpointManager {
  constructor(options = {}) {
    this.logger = new Logger('checkpoint', { level: options.logLevel || 'info' });
    this.checkpointDir = options.checkpointDir || path.join(process.cwd(), '.migration-checkpoints');
    this._ensureDir();
  }

  /**
   * Save a checkpoint for a migration run
   */
  save(runId, state) {
    const checkpoint = {
      runId,
      timestamp: new Date().toISOString(),
      version: 1,
      state: {
        completedObjects: state.completedObjects || [],
        failedObjects: state.failedObjects || [],
        pendingObjects: state.pendingObjects || [],
        results: state.results || [],
        startedAt: state.startedAt,
        config: state.config || {},
      },
    };

    const filePath = this._getPath(runId);
    fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2));
    this.logger.info(`Checkpoint saved: ${runId} (${checkpoint.state.completedObjects.length} completed, ${checkpoint.state.pendingObjects.length} pending)`);
    return checkpoint;
  }

  /**
   * Load a checkpoint
   */
  load(runId) {
    const filePath = this._getPath(runId);
    if (!fs.existsSync(filePath)) {
      this.logger.debug(`No checkpoint found for ${runId}`);
      return null;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    this.logger.info(`Checkpoint loaded: ${runId} (${data.state.completedObjects.length} completed, ${data.state.pendingObjects.length} pending)`);
    return data;
  }

  /**
   * Remove a checkpoint (on successful completion)
   */
  remove(runId) {
    const filePath = this._getPath(runId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.info(`Checkpoint removed: ${runId}`);
      return true;
    }
    return false;
  }

  /**
   * List all available checkpoints
   */
  list() {
    if (!fs.existsSync(this.checkpointDir)) return [];

    return fs.readdirSync(this.checkpointDir)
      .filter(f => f.endsWith('.checkpoint.json'))
      .map(f => {
        const data = JSON.parse(fs.readFileSync(path.join(this.checkpointDir, f), 'utf8'));
        return {
          runId: data.runId,
          timestamp: data.timestamp,
          completed: data.state.completedObjects.length,
          pending: data.state.pendingObjects.length,
          failed: data.state.failedObjects.length,
        };
      });
  }

  /**
   * Clean up old checkpoints (older than maxAge days)
   */
  cleanup(maxAgeDays = 30) {
    const checkpoints = this.list();
    const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
    let removed = 0;

    for (const cp of checkpoints) {
      if (new Date(cp.timestamp) < cutoff) {
        this.remove(cp.runId);
        removed++;
      }
    }

    this.logger.info(`Cleaned up ${removed} old checkpoints`);
    return removed;
  }

  _getPath(runId) {
    return path.join(this.checkpointDir, `${runId}.checkpoint.json`);
  }

  _ensureDir() {
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }
}

module.exports = { CheckpointManager };
