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
 * Base Extractor — Abstract Base Class
 *
 * All forensic extractors extend this class. Provides:
 * - Extraction lifecycle (live vs mock)
 * - Coverage tracking per table
 * - Checkpoint/resume support
 * - Utility methods for table reads, FM calls, OData
 */

const Logger = require('../lib/logger');
const { ExtractionError } = require('../lib/errors');

class BaseExtractor {
  /**
   * @param {import('./extraction-context')} context
   */
  constructor(context) {
    if (new.target === BaseExtractor) {
      throw new ExtractionError('Cannot instantiate BaseExtractor directly');
    }
    this.context = context;
    this.logger = new Logger(`extractor:${this.extractorId}`);
    this._tableReader = null;
    this._functionCaller = null;
  }

  // ── Identity (subclass MUST override) ──

  get extractorId() { throw new ExtractionError('extractorId not implemented'); }
  get name() { throw new ExtractionError('name not implemented'); }
  get module() { throw new ExtractionError('module not implemented'); }
  get category() { return 'config'; }

  // ── Extraction lifecycle ──

  async extract() {
    const start = Date.now();
    this.logger.info(`Starting extraction: ${this.name}`);

    let result;
    try {
      if (this.context.mode === 'mock') {
        result = await this._extractMock();
      } else {
        result = await this._extractLive();
      }

      await this._saveCheckpoint('_complete', {
        status: 'completed',
        timestamp: new Date().toISOString(),
        resultKeys: result ? Object.keys(result) : [],
      });

      this.logger.info(`Extraction complete: ${this.name} (${Date.now() - start}ms)`);
      return result;
    } catch (err) {
      this.logger.error(`Extraction failed: ${this.name}: ${err.message}`);
      throw err;
    }
  }

  async _extractLive() {
    throw new ExtractionError(`_extractLive not implemented for ${this.extractorId}`);
  }

  async _extractMock() {
    throw new ExtractionError(`_extractMock not implemented for ${this.extractorId}`);
  }

  // ── Coverage tracking ──

  getExpectedTables() { return []; }

  getCoverageReport() {
    return this.context.coverage.getReport(this.extractorId);
  }

  // ── Checkpoint support ──

  async _saveCheckpoint(key, data) {
    await this.context.checkpoint.save(this.extractorId, key, data);
  }

  async _loadCheckpoint(key) {
    return this.context.checkpoint.load(this.extractorId, key);
  }

  async _clearCheckpoints() {
    await this.context.checkpoint.clear(this.extractorId);
  }

  // ── Utility methods for subclasses ──

  async _readTable(table, opts = {}) {
    try {
      if (!this._tableReader && this.context.rfc) {
        const { TableReader } = require('../lib/rfc/table-reader');
        this._tableReader = new TableReader(this.context.rfc, { logger: this.logger });
      }
      if (!this._tableReader) {
        this._trackCoverage(table, 'skipped', { reason: 'No RFC connection' });
        return { rows: [], fields: [], totalRows: 0 };
      }
      const result = await this._tableReader.readTable(table, opts);
      this._trackCoverage(table, 'extracted', { rowCount: result.rows.length });
      return result;
    } catch (err) {
      this._trackCoverage(table, 'failed', { error: err.message });
      throw err;
    }
  }

  async *_streamTable(table, opts = {}) {
    if (!this._tableReader && this.context.rfc) {
      const { TableReader } = require('../lib/rfc/table-reader');
      this._tableReader = new TableReader(this.context.rfc, { logger: this.logger });
    }
    if (!this._tableReader) {
      this._trackCoverage(table, 'skipped', { reason: 'No RFC connection' });
      return;
    }
    let totalRows = 0;
    try {
      for await (const chunk of this._tableReader.streamTable(table, opts)) {
        totalRows += chunk.rows.length;
        yield chunk;
      }
      this._trackCoverage(table, 'extracted', { rowCount: totalRows });
    } catch (err) {
      this._trackCoverage(table, totalRows > 0 ? 'partial' : 'failed', {
        rowCount: totalRows,
        error: err.message,
      });
      throw err;
    }
  }

  async _callFM(fm, params = {}) {
    if (!this._functionCaller && this.context.rfc) {
      const { FunctionCaller } = require('../lib/rfc/function-caller');
      this._functionCaller = new FunctionCaller(this.context.rfc, { logger: this.logger });
    }
    if (!this._functionCaller) {
      return null;
    }
    return this._functionCaller.call(fm, params);
  }

  async _readOData(service, entity, opts = {}) {
    if (!this.context.odata) return [];
    try {
      return await this.context.odata.getAll(`${service}/${entity}`, opts);
    } catch (err) {
      this.logger.warn(`OData read failed for ${entity}: ${err.message}`);
      return [];
    }
  }

  _trackCoverage(table, status, details = {}) {
    this.context.coverage.track(this.extractorId, table, status, details);
  }
}

module.exports = BaseExtractor;
