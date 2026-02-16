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
 * Infor Forensic Orchestrator
 *
 * Coordinates Infor-specific extraction lifecycle:
 * 1. Detect source system (LN, M3, CSI, Lawson)
 * 2. Load appropriate extractors
 * 3. Run extraction with concurrency control
 * 4. Aggregate results
 *
 * Follows same pattern as ForensicOrchestrator but for Infor products.
 */

const Logger = require('../../lib/logger');
const ExtractorRegistry = require('../extractor-registry');

class InforOrchestrator {
  /**
   * @param {import('../extraction-context')} context
   */
  constructor(context) {
    this.context = context;
    this.log = new Logger('infor-orchestrator');
    this._results = new Map();
    this._callbacks = { progress: [], extractorComplete: [], error: [] };
    this._progress = { phase: 'idle', completed: 0, total: 0, current: null };
  }

  onProgress(callback) { this._callbacks.progress.push(callback); }
  onExtractorComplete(callback) { this._callbacks.extractorComplete.push(callback); }
  onError(callback) { this._callbacks.error.push(callback); }
  getProgress() { return { ...this._progress }; }

  /**
   * Run full Infor forensic extraction.
   * @param {object} [options]
   * @param {number} [options.concurrency=5]
   * @param {string[]} [options.modules] - Filter to specific modules
   * @returns {{ results, durationMs, sourceSystem, extractorCount }}
   */
  async run(options = {}) {
    const start = Date.now();
    const concurrency = options.concurrency || 5;
    const sourceSystem = this.context.sourceSystem;

    this.log.info(`Starting Infor extraction for ${sourceSystem}`);

    // Load appropriate extractor module
    this._loadExtractors(sourceSystem);

    // Filter to only this source system's extractors
    const all = ExtractorRegistry.getAll();
    let entries = all.filter(e => e.cls._sourceSystem === sourceSystem);

    if (options.modules) {
      const mods = new Set(options.modules.map(m => m.toUpperCase()));
      entries = entries.filter(e => mods.has((e.cls._module || '').toUpperCase()));
    }

    this._updateProgress('extraction', 0, entries.length);
    this.log.info(`Running ${entries.length} extractors (concurrency: ${concurrency})`);

    // Execute with concurrency limit
    const queue = [...entries];
    const running = new Set();
    let completed = 0;

    const runNext = () => {
      while (queue.length > 0 && running.size < concurrency) {
        const entry = queue.shift();
        const promise = (async () => {
          try {
            const extractor = new entry.cls(this.context);
            const result = await extractor.extract();
            this._results.set(entry.id, result);
            this._emit('extractorComplete', { extractorId: entry.id, result });
            this.log.info(`Completed: ${entry.id}`);
          } catch (err) {
            this._results.set(entry.id, { error: err.message });
            this._emit('error', { extractorId: entry.id, error: err.message });
            this.log.error(`Failed: ${entry.id}: ${err.message}`);
          }
          completed++;
          this._updateProgress('extraction', completed, entries.length);
          running.delete(promise);
          runNext();
        })();
        running.add(promise);
      }
    };

    runNext();
    while (running.size > 0) {
      await Promise.race(running);
    }

    this._updateProgress('complete', entries.length, entries.length);
    const durationMs = Date.now() - start;
    this.log.info(`Infor extraction complete in ${durationMs}ms (${entries.length} extractors)`);

    return {
      results: this._results,
      sourceSystem,
      extractorCount: entries.length,
      completedCount: completed,
      durationMs,
    };
  }

  /**
   * Get aggregated results.
   */
  getResults() {
    return this._results;
  }

  /**
   * Get supported source systems.
   */
  static getSupportedSystems() {
    return ['INFOR_LN', 'INFOR_M3', 'INFOR_CSI', 'INFOR_LAWSON'];
  }

  /** @private */
  _loadExtractors(sourceSystem) {
    try {
      switch (sourceSystem) {
        case 'INFOR_LN': require('./ln/index'); break;
        case 'INFOR_M3': require('./m3/index'); break;
        case 'INFOR_CSI': require('./csi/index'); break;
        case 'INFOR_LAWSON': require('./lawson/index'); break;
        default:
          this.log.warn(`Unknown source system: ${sourceSystem}`);
      }
    } catch (err) {
      this.log.error(`Failed to load extractors for ${sourceSystem}: ${err.message}`);
    }
  }

  /** @private */
  _updateProgress(phase, completed, total) {
    this._progress = { phase, completed, total, current: phase, timestamp: new Date().toISOString() };
    this._emit('progress', this._progress);
  }

  /** @private */
  _emit(event, data) {
    for (const cb of this._callbacks[event] || []) {
      try { cb(data); } catch { /* ignore callback errors */ }
    }
  }
}

module.exports = InforOrchestrator;
