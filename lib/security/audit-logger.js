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
 * Audit Logger
 *
 * Immutable, structured audit trail for all security-relevant events.
 * Supports file-based and in-memory storage.
 */

const Logger = require('../logger');
const fs = require('fs');
const path = require('path');

const AUDIT_EVENTS = {
  AUTH_SUCCESS: 'auth.success',
  AUTH_FAILURE: 'auth.failure',
  AUTH_LOGOUT: 'auth.logout',
  API_ACCESS: 'api.access',
  API_ERROR: 'api.error',
  MIGRATION_START: 'migration.start',
  MIGRATION_COMPLETE: 'migration.complete',
  MIGRATION_FAIL: 'migration.fail',
  DATA_EXPORT: 'data.export',
  DATA_IMPORT: 'data.import',
  CONFIG_CHANGE: 'config.change',
  ADMIN_ACTION: 'admin.action',
  RATE_LIMIT_HIT: 'security.rate_limit',
  VALIDATION_FAIL: 'security.validation_fail',
};

class AuditLogger {
  constructor(options = {}) {
    this.logger = new Logger('audit', { level: 'info', format: 'json' });
    this.store = options.store || 'memory';
    this.filePath = options.filePath || null;
    this._entries = [];
    this._maxEntries = options.maxEntries || 10000;

    if (this.store === 'file' && this.filePath) {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(event, details = {}) {
    const entry = {
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      event,
      actor: details.actor || 'system',
      ip: details.ip || null,
      resource: details.resource || null,
      action: details.action || null,
      outcome: details.outcome || 'success',
      metadata: details.metadata || {},
    };

    this._entries.push(entry);
    if (this._entries.length > this._maxEntries) {
      this._entries = this._entries.slice(-this._maxEntries);
    }

    this.logger.info(`AUDIT: ${event}`, entry);

    if (this.store === 'file' && this.filePath) {
      fs.appendFileSync(this.filePath, JSON.stringify(entry) + '\n');
    }

    return entry;
  }

  query(filters = {}) {
    let results = [...this._entries];

    if (filters.event) {
      results = results.filter(e => e.event === filters.event);
    }
    if (filters.actor) {
      results = results.filter(e => e.actor === filters.actor);
    }
    if (filters.since) {
      const since = new Date(filters.since).toISOString();
      results = results.filter(e => e.timestamp >= since);
    }
    if (filters.until) {
      const until = new Date(filters.until).toISOString();
      results = results.filter(e => e.timestamp <= until);
    }
    if (filters.outcome) {
      results = results.filter(e => e.outcome === filters.outcome);
    }
    if (filters.resource) {
      results = results.filter(e => e.resource === filters.resource);
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    return {
      total: results.length,
      entries: results.slice(offset, offset + limit),
    };
  }

  getStats() {
    const byEvent = {};
    const byOutcome = { success: 0, failure: 0, error: 0 };
    const byActor = {};

    for (const entry of this._entries) {
      byEvent[entry.event] = (byEvent[entry.event] || 0) + 1;
      if (byOutcome[entry.outcome] !== undefined) byOutcome[entry.outcome]++;
      byActor[entry.actor] = (byActor[entry.actor] || 0) + 1;
    }

    return {
      totalEntries: this._entries.length,
      byEvent,
      byOutcome,
      byActor,
      oldestEntry: this._entries[0]?.timestamp || null,
      newestEntry: this._entries[this._entries.length - 1]?.timestamp || null,
    };
  }

  /** Express middleware for automatic API audit logging */
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      res.on('finish', () => {
        this.log(AUDIT_EVENTS.API_ACCESS, {
          actor: req.user?.id || req.ip || 'anonymous',
          ip: req.ip,
          resource: `${req.method} ${req.path}`,
          action: req.method,
          outcome: res.statusCode < 400 ? 'success' : res.statusCode < 500 ? 'failure' : 'error',
          metadata: {
            statusCode: res.statusCode,
            durationMs: Date.now() - startTime,
            userAgent: req.get('user-agent'),
            contentLength: res.get('content-length'),
          },
        });
      });

      next();
    };
  }

  clear() {
    this._entries = [];
  }

  _generateId() {
    return `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

module.exports = { AuditLogger, AUDIT_EVENTS };
