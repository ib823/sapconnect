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
 * Coverage Tracker
 *
 * Tracks every table read attempt across all extractors.
 * Produces coverage metrics per extractor, per module, and system-wide.
 */

class CoverageTracker {
  constructor() {
    this._records = new Map(); // extractorId -> Map<table, { status, details, timestamp }>
  }

  /**
   * Track a table extraction attempt.
   * @param {string} extractorId
   * @param {string} table
   * @param {'extracted'|'failed'|'skipped'|'partial'} status
   * @param {object} [details] - { rowCount, error, reason }
   */
  track(extractorId, table, status, details = {}) {
    if (!this._records.has(extractorId)) {
      this._records.set(extractorId, new Map());
    }
    this._records.get(extractorId).set(table, {
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get coverage report for a specific extractor.
   */
  getReport(extractorId) {
    const tables = this._records.get(extractorId);
    if (!tables) return { extracted: 0, failed: 0, skipped: 0, partial: 0, total: 0, coverage: 0 };

    const counts = { extracted: 0, failed: 0, skipped: 0, partial: 0 };
    for (const [, record] of tables) {
      counts[record.status] = (counts[record.status] || 0) + 1;
    }

    const total = tables.size;
    const coverage = total > 0 ? Math.round(((counts.extracted + counts.partial) / total) * 100) : 0;

    return { ...counts, total, coverage, tables: Object.fromEntries(tables) };
  }

  /**
   * Get coverage report for a module (aggregates all extractors for that module).
   */
  getModuleReport(module) {
    const combined = { extracted: 0, failed: 0, skipped: 0, partial: 0, total: 0 };
    for (const [extractorId, tables] of this._records) {
      if (extractorId.startsWith(module + '_') || extractorId === module) {
        for (const [, record] of tables) {
          combined[record.status] = (combined[record.status] || 0) + 1;
          combined.total++;
        }
      }
    }
    combined.coverage = combined.total > 0
      ? Math.round(((combined.extracted + combined.partial) / combined.total) * 100)
      : 0;
    return combined;
  }

  /**
   * Get overall system coverage report.
   */
  getSystemReport() {
    const combined = { extracted: 0, failed: 0, skipped: 0, partial: 0, total: 0 };
    for (const [, tables] of this._records) {
      for (const [, record] of tables) {
        combined[record.status] = (combined[record.status] || 0) + 1;
        combined.total++;
      }
    }
    combined.coverage = combined.total > 0
      ? Math.round(((combined.extracted + combined.partial) / combined.total) * 100)
      : 0;
    combined.extractorCount = this._records.size;
    return combined;
  }

  /**
   * Get all gaps (tables that weren't fully extracted).
   */
  getGaps() {
    const gaps = [];
    for (const [extractorId, tables] of this._records) {
      for (const [table, record] of tables) {
        if (record.status !== 'extracted') {
          gaps.push({ extractorId, table, status: record.status, details: record.details });
        }
      }
    }
    return gaps;
  }

  /**
   * Get all tracked data as plain object.
   */
  toJSON() {
    const result = {};
    for (const [extractorId, tables] of this._records) {
      result[extractorId] = Object.fromEntries(tables);
    }
    return result;
  }
}

module.exports = CoverageTracker;
