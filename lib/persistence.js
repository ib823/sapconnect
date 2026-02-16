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
 * Persistence Adapter — Extraction & Migration state storage.
 *
 * Dual-mode:
 *   - memory: In-memory Map storage (development, testing)
 *   - cds:    SAP CAP CDS persistence (production w/ HANA Cloud or SQLite)
 *
 * Provides checkpoint/resume support for long-running extractions.
 *
 * Usage:
 *   const store = new PersistenceAdapter({ mode: 'memory' });
 *   await store.saveRun({ runId: 'run-1', status: 'running' });
 *   await store.saveCheckpoint('run-1', 'CUSTOM_CODE', { offset: 1000 });
 *   const cp = await store.loadCheckpoint('run-1', 'CUSTOM_CODE');
 */

const Logger = require('./logger');
const { v4: uuidv4 } = require('crypto');

function generateId() {
  // Use crypto.randomUUID if available, else timestamp-based
  try {
    return require('crypto').randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
}

class PersistenceAdapter {
  /**
   * @param {object} options
   * @param {'memory'|'cds'} [options.mode='memory']
   */
  constructor(options = {}) {
    this._mode = options.mode || 'memory';
    this._log = new Logger('persistence');

    // In-memory stores
    this._runs = new Map();
    this._results = new Map();
    this._checkpoints = new Map();
    this._migrationRuns = new Map();
  }

  get mode() { return this._mode; }

  // ── Extraction Runs ────────────────────────────────────────

  /**
   * Save or update an extraction run.
   * @param {object} run — { runId, status, mode, startedAt, completedAt, ... }
   * @returns {object} The saved run with generated ID
   */
  async saveRun(run) {
    const record = {
      ID: run.ID || generateId(),
      runId: run.runId,
      status: run.status || 'pending',
      mode: run.mode || 'mock',
      startedAt: run.startedAt || null,
      completedAt: run.completedAt || null,
      extractorCount: run.extractorCount || 0,
      errorCount: run.errorCount || 0,
      confidence: run.confidence || 0,
      grade: run.grade || null,
      metadata: typeof run.metadata === 'string' ? run.metadata : JSON.stringify(run.metadata || {}),
      createdAt: run.createdAt || new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    if (this._mode === 'cds') {
      return this._cdsUpsert('sapconnect.ExtractionRuns', record);
    }

    this._runs.set(record.runId, record);
    return record;
  }

  /**
   * Get an extraction run by runId.
   * @param {string} runId
   * @returns {object|null}
   */
  async getRun(runId) {
    if (this._mode === 'cds') {
      return this._cdsSelectOne('sapconnect.ExtractionRuns', { runId });
    }
    return this._runs.get(runId) || null;
  }

  /**
   * List extraction runs, newest first.
   * @param {number} [limit=20]
   * @returns {object[]}
   */
  async listRuns(limit = 20) {
    if (this._mode === 'cds') {
      return this._cdsSelect('sapconnect.ExtractionRuns', {}, limit, 'createdAt desc');
    }
    return Array.from(this._runs.values())
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, limit);
  }

  // ── Extraction Results ─────────────────────────────────────

  /**
   * Save an extractor result within a run.
   * @param {string} runId
   * @param {object} result — { extractorId, status, recordCount, data, ... }
   */
  async saveResult(runId, result) {
    const record = {
      ID: result.ID || generateId(),
      run_ID: runId,
      extractorId: result.extractorId,
      status: result.status || 'pending',
      startedAt: result.startedAt || null,
      completedAt: result.completedAt || null,
      recordCount: result.recordCount || 0,
      errorMessage: result.errorMessage || null,
      data: typeof result.data === 'string' ? result.data : JSON.stringify(result.data || {}),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    if (this._mode === 'cds') {
      return this._cdsUpsert('sapconnect.ExtractionResults', record);
    }

    const key = `${runId}:${result.extractorId}`;
    this._results.set(key, record);
    return record;
  }

  /**
   * Get results for a run.
   * @param {string} runId
   * @returns {object[]}
   */
  async getResults(runId) {
    if (this._mode === 'cds') {
      return this._cdsSelect('sapconnect.ExtractionResults', { run_ID: runId });
    }
    return Array.from(this._results.values())
      .filter(r => r.run_ID === runId);
  }

  /**
   * Get a specific result.
   * @param {string} runId
   * @param {string} extractorId
   * @returns {object|null}
   */
  async getResult(runId, extractorId) {
    if (this._mode === 'cds') {
      return this._cdsSelectOne('sapconnect.ExtractionResults', { run_ID: runId, extractorId });
    }
    return this._results.get(`${runId}:${extractorId}`) || null;
  }

  // ── Checkpoints ────────────────────────────────────────────

  /**
   * Save a checkpoint for resume support.
   * @param {string} runId
   * @param {string} extractorId
   * @param {object} checkpoint — Arbitrary checkpoint state (will be JSON-serialized)
   */
  async saveCheckpoint(runId, extractorId, checkpoint) {
    const record = {
      ID: generateId(),
      run_ID: runId,
      extractorId,
      checkpoint: JSON.stringify(checkpoint),
      resumable: true,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    if (this._mode === 'cds') {
      // Upsert by runId + extractorId
      const existing = await this._cdsSelectOne('sapconnect.Checkpoints', { run_ID: runId, extractorId });
      if (existing) {
        record.ID = existing.ID;
      }
      return this._cdsUpsert('sapconnect.Checkpoints', record);
    }

    const key = `${runId}:${extractorId}`;
    this._checkpoints.set(key, record);
    return record;
  }

  /**
   * Load a checkpoint for resume.
   * @param {string} runId
   * @param {string} extractorId
   * @returns {object|null} — Parsed checkpoint state, or null if none
   */
  async loadCheckpoint(runId, extractorId) {
    let record;
    if (this._mode === 'cds') {
      record = await this._cdsSelectOne('sapconnect.Checkpoints', { run_ID: runId, extractorId });
    } else {
      record = this._checkpoints.get(`${runId}:${extractorId}`) || null;
    }

    if (!record || !record.resumable) return null;

    try {
      return JSON.parse(record.checkpoint);
    } catch {
      return null;
    }
  }

  /**
   * Mark a checkpoint as consumed (non-resumable).
   * @param {string} runId
   * @param {string} extractorId
   */
  async consumeCheckpoint(runId, extractorId) {
    if (this._mode === 'cds') {
      const existing = await this._cdsSelectOne('sapconnect.Checkpoints', { run_ID: runId, extractorId });
      if (existing) {
        existing.resumable = false;
        return this._cdsUpsert('sapconnect.Checkpoints', existing);
      }
      return;
    }

    const key = `${runId}:${extractorId}`;
    const record = this._checkpoints.get(key);
    if (record) {
      record.resumable = false;
    }
  }

  // ── Migration Runs ─────────────────────────────────────────

  /**
   * Save a migration run.
   * @param {object} run
   */
  async saveMigrationRun(run) {
    const record = {
      ID: run.ID || generateId(),
      runId: run.runId,
      status: run.status || 'pending',
      mode: run.mode || 'mock',
      startedAt: run.startedAt || null,
      completedAt: run.completedAt || null,
      objectCount: run.objectCount || 0,
      successCount: run.successCount || 0,
      errorCount: run.errorCount || 0,
      metadata: typeof run.metadata === 'string' ? run.metadata : JSON.stringify(run.metadata || {}),
      createdAt: run.createdAt || new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    if (this._mode === 'cds') {
      return this._cdsUpsert('sapconnect.MigrationRuns', record);
    }

    this._migrationRuns.set(record.runId, record);
    return record;
  }

  /**
   * Get a migration run.
   * @param {string} runId
   * @returns {object|null}
   */
  async getMigrationRun(runId) {
    if (this._mode === 'cds') {
      return this._cdsSelectOne('sapconnect.MigrationRuns', { runId });
    }
    return this._migrationRuns.get(runId) || null;
  }

  // ── CDS Operations (production) ────────────────────────────

  /** @private */
  async _cdsUpsert(entity, record) {
    const cds = require('@sap/cds');
    const db = await cds.connect.to('db');
    const { [entity.split('.').pop()]: Entity } = db.entities('sapconnect');
    await db.run(db.upsert(Entity).entries(record));
    return record;
  }

  /** @private */
  async _cdsSelectOne(entity, where) {
    const cds = require('@sap/cds');
    const db = await cds.connect.to('db');
    const { [entity.split('.').pop()]: Entity } = db.entities('sapconnect');
    return db.run(db.read(Entity).where(where).limit(1)).then(r => r[0] || null);
  }

  /** @private */
  async _cdsSelect(entity, where = {}, limit = 100, orderBy = null) {
    const cds = require('@sap/cds');
    const db = await cds.connect.to('db');
    const { [entity.split('.').pop()]: Entity } = db.entities('sapconnect');
    let query = db.read(Entity).where(where).limit(limit);
    if (orderBy) query = query.orderBy(orderBy);
    return db.run(query);
  }
}

module.exports = { PersistenceAdapter };
