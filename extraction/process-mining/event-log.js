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
 * IEEE XES-Compatible Event Log Data Model
 *
 * Foundation data model for process mining over forensic extraction data.
 * Implements the IEEE 1849-2016 (XES) standard for event log interchange,
 * providing Event, Trace, and EventLog classes with full support for:
 *
 *   - XES extensions: concept, lifecycle, time, organizational
 *   - Process variant analysis
 *   - Directly-follows graph (DFG) computation
 *   - Rework detection
 *   - Export to XES XML, JSON, and CSV
 *   - Import from JSON and CSV
 *   - Forensic evidence linking via sourceRef
 *
 * No external dependencies. Pure JavaScript.
 *
 * @see https://xes-standard.org/
 * @see IEEE 1849-2016
 */

'use strict';

const Logger = require('../../lib/logger');

const logger = new Logger('process-mining:event-log');

// ─────────────────────────────────────────────────────────────────────────────
// XES extension URIs
// ─────────────────────────────────────────────────────────────────────────────

const XES_EXTENSIONS = Object.freeze({
  concept:        { name: 'Concept',        prefix: 'concept',   uri: 'http://www.xes-standard.org/concept.xesext' },
  time:           { name: 'Time',           prefix: 'time',      uri: 'http://www.xes-standard.org/time.xesext' },
  lifecycle:      { name: 'Lifecycle',      prefix: 'lifecycle', uri: 'http://www.xes-standard.org/lifecycle.xesext' },
  organizational: { name: 'Organizational', prefix: 'org',       uri: 'http://www.xes-standard.org/org.xesext' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escape a string for safe inclusion in XML text content and attribute values.
 * Handles the five predefined XML entities.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

/**
 * Format a Date to ISO 8601 with explicit UTC offset for XES compliance.
 * XES requires the timezone designator; we always emit +00:00.
 *
 * @param {Date} date
 * @returns {string}
 */
function formatXesTimestamp(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '1970-01-01T00:00:00.000+00:00';
  }
  // toISOString() yields e.g. "2024-01-15T09:30:00.000Z"
  // Replace trailing 'Z' with '+00:00' per XES convention
  return date.toISOString().replace('Z', '+00:00');
}

/**
 * Parse a timestamp string (ISO 8601 or XES format) into a Date.
 * Handles both 'Z' and '+00:00' suffixes.
 *
 * @param {string|Date} value
 * @returns {Date}
 */
function parseTimestamp(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value !== 'string') {
    throw new Error(`Invalid timestamp value: ${value}`);
  }
  const normalized = value.replace(/\+00:00$/, 'Z');
  const date = new Date(normalized);
  if (isNaN(date.getTime())) {
    throw new Error(`Unparseable timestamp: ${value}`);
  }
  return date;
}

/**
 * Escape a value for CSV output. Wraps in double quotes if the value contains
 * a comma, double quote, or newline. Inner double quotes are doubled.
 *
 * @param {*} value
 * @returns {string}
 */
function escapeCsvField(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Parse a single CSV line respecting quoted fields.
 *
 * @param {string} line
 * @returns {string[]}
 */
function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote (doubled)
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }

  // Push last field
  fields.push(current);
  return fields;
}

/**
 * Parse a full CSV string into an array of records (each record is an array
 * of field strings). Correctly handles quoted fields that contain newlines,
 * commas, and escaped double-quotes.
 *
 * @param {string} csv
 * @returns {string[][]}
 */
function parseCsvRecords(csv) {
  const records = [];
  let current = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < csv.length) {
    const ch = csv[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < csv.length && csv[i + 1] === '"') {
          // Escaped quote
          field += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        current.push(field);
        field = '';
        i++;
      } else if (ch === '\r') {
        // Handle \r\n or bare \r as record delimiter
        current.push(field);
        field = '';
        if (current.some(f => f.length > 0)) {
          records.push(current);
        }
        current = [];
        if (i + 1 < csv.length && csv[i + 1] === '\n') {
          i += 2;
        } else {
          i++;
        }
      } else if (ch === '\n') {
        current.push(field);
        field = '';
        if (current.some(f => f.length > 0)) {
          records.push(current);
        }
        current = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Flush final record
  current.push(field);
  if (current.some(f => f.length > 0)) {
    records.push(current);
  }

  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// Event
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single event in a process trace.
 *
 * Maps to XES <event> with standard attribute extensions:
 *   - concept:name          -> activity
 *   - time:timestamp        -> timestamp
 *   - org:resource          -> resource
 *   - lifecycle:transition  -> lifecycle
 */
class Event {
  /**
   * @param {object} params
   * @param {string} params.activity         - Activity name (concept:name). Required.
   * @param {Date|string|number} params.timestamp - Event timestamp (time:timestamp). Required.
   * @param {string} [params.resource]       - Resource/user (org:resource). Optional.
   * @param {string} [params.lifecycle]      - Lifecycle transition. Default: 'complete'.
   * @param {Map|Object} [params.attributes] - Additional event-level attributes.
   * @param {object} [params.sourceRef]      - Forensic evidence link to SAP record.
   * @param {string} [params.sourceRef.table] - SAP table name.
   * @param {string} [params.sourceRef.key]   - Record key.
   * @param {string} [params.sourceRef.field] - Field name.
   */
  constructor({ activity, timestamp, resource, lifecycle, attributes, sourceRef } = {}) {
    if (!activity || typeof activity !== 'string') {
      throw new Error('Event requires a non-empty activity string');
    }
    if (timestamp === undefined || timestamp === null) {
      throw new Error('Event requires a timestamp');
    }

    /** @type {string} Activity name (concept:name) */
    this.activity = activity;

    /** @type {Date} Event timestamp (time:timestamp) */
    this.timestamp = parseTimestamp(timestamp);

    /** @type {string|null} Resource identifier (org:resource) */
    this.resource = resource || null;

    /** @type {string} Lifecycle transition (lifecycle:transition) */
    this.lifecycle = lifecycle || 'complete';

    /** @type {Map<string, *>} Additional event-level attributes */
    this.attributes = new Map();
    if (attributes) {
      const entries = attributes instanceof Map
        ? attributes.entries()
        : Object.entries(attributes);
      for (const [key, value] of entries) {
        this.attributes.set(key, value);
      }
    }

    /**
     * Forensic evidence link back to the SAP record that produced this event.
     * @type {{ table: string, key: string, field: string }|null}
     */
    this.sourceRef = sourceRef || null;
  }

  /**
   * Create a deep clone of this event.
   * @returns {Event}
   */
  clone() {
    return new Event({
      activity: this.activity,
      timestamp: new Date(this.timestamp.getTime()),
      resource: this.resource,
      lifecycle: this.lifecycle,
      attributes: new Map(this.attributes),
      sourceRef: this.sourceRef ? { ...this.sourceRef } : null,
    });
  }

  /**
   * Serialize to a plain object suitable for JSON.
   * @returns {object}
   */
  toJSON() {
    const obj = {
      activity: this.activity,
      timestamp: this.timestamp.toISOString(),
      lifecycle: this.lifecycle,
    };
    if (this.resource) obj.resource = this.resource;
    if (this.attributes.size > 0) obj.attributes = Object.fromEntries(this.attributes);
    if (this.sourceRef) obj.sourceRef = { ...this.sourceRef };
    return obj;
  }

  /**
   * Reconstruct an Event from a plain object (inverse of toJSON).
   * @param {object} json
   * @returns {Event}
   */
  static fromJSON(json) {
    return new Event({
      activity: json.activity,
      timestamp: json.timestamp,
      resource: json.resource || null,
      lifecycle: json.lifecycle || 'complete',
      attributes: json.attributes || null,
      sourceRef: json.sourceRef || null,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Trace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A process trace (case) — an ordered sequence of events sharing a case identifier.
 *
 * Maps to XES <trace> with concept:name = caseId.
 * Events are maintained in chronological order by timestamp.
 */
class Trace {
  /**
   * @param {string} caseId                 - Case identifier (concept:name). Required.
   * @param {Map|Object} [attributes]       - Case-level attributes.
   */
  constructor(caseId, attributes) {
    if (!caseId || typeof caseId !== 'string') {
      throw new Error('Trace requires a non-empty caseId string');
    }

    /** @type {string} Case identifier (concept:name) */
    this.caseId = caseId;

    /** @type {Event[]} Events in chronological order */
    this.events = [];

    /** @type {Map<string, *>} Case-level attributes */
    this.attributes = new Map();
    if (attributes) {
      const entries = attributes instanceof Map
        ? attributes.entries()
        : Object.entries(attributes);
      for (const [key, value] of entries) {
        this.attributes.set(key, value);
      }
    }
  }

  /**
   * Insert an event in timestamp order via binary search.
   * If timestamps are equal, the new event is placed after existing events
   * with the same timestamp (stable insertion).
   *
   * @param {Event} event
   * @returns {Trace} this (for chaining)
   */
  addEvent(event) {
    if (!(event instanceof Event)) {
      throw new Error('addEvent requires an Event instance');
    }

    const ts = event.timestamp.getTime();

    // Fast path: append if empty or event is at/after the last event
    if (this.events.length === 0 || ts >= this.events[this.events.length - 1].timestamp.getTime()) {
      this.events.push(event);
      return this;
    }

    // Binary search for insertion point (stable — insert after equal timestamps)
    let lo = 0;
    let hi = this.events.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.events[mid].timestamp.getTime() <= ts) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    this.events.splice(lo, 0, event);
    return this;
  }

  /**
   * Total duration of the trace in milliseconds.
   * Returns 0 if fewer than 2 events.
   *
   * @returns {number} Duration in milliseconds
   */
  getDuration() {
    if (this.events.length < 2) return 0;
    return this.events[this.events.length - 1].timestamp.getTime() - this.events[0].timestamp.getTime();
  }

  /**
   * Ordered list of activity names in this trace.
   * @returns {string[]}
   */
  getActivities() {
    return this.events.map(e => e.activity);
  }

  /**
   * Variant key: the exact sequence of activities joined with ' -> '.
   * Two traces with the same variant key followed the same process path.
   *
   * @returns {string}
   */
  getVariantKey() {
    return this.events.map(e => e.activity).join(' -> ');
  }

  /**
   * Set of unique resources (users) that participated in this trace.
   * @returns {Set<string>}
   */
  getResources() {
    const resources = new Set();
    for (const event of this.events) {
      if (event.resource) {
        resources.add(event.resource);
      }
    }
    return resources;
  }

  /**
   * Timestamp of the first event, or null if the trace is empty.
   * @returns {Date|null}
   */
  getStartTime() {
    return this.events.length > 0 ? this.events[0].timestamp : null;
  }

  /**
   * Timestamp of the last event, or null if the trace is empty.
   * @returns {Date|null}
   */
  getEndTime() {
    return this.events.length > 0 ? this.events[this.events.length - 1].timestamp : null;
  }

  /**
   * Compute the duration between each pair of consecutive events, keyed by
   * the activity of the *first* event in each pair (i.e., the time spent
   * between starting activity A and the next activity).
   *
   * If an activity appears multiple times, durations are summed.
   *
   * @returns {Map<string, number>} activity -> total duration in milliseconds
   */
  getActivityDurations() {
    const durations = new Map();
    for (let i = 0; i < this.events.length - 1; i++) {
      const activity = this.events[i].activity;
      const delta = this.events[i + 1].timestamp.getTime() - this.events[i].timestamp.getTime();
      durations.set(activity, (durations.get(activity) || 0) + delta);
    }
    return durations;
  }

  /**
   * Whether any activity name appears more than once in this trace.
   * Rework is a key process mining metric indicating loops or corrections.
   *
   * @returns {boolean}
   */
  hasRework() {
    const seen = new Set();
    for (const event of this.events) {
      if (seen.has(event.activity)) return true;
      seen.add(event.activity);
    }
    return false;
  }

  /**
   * Activities that appear more than once in this trace.
   * @returns {string[]}
   */
  getReworkActivities() {
    const counts = new Map();
    for (const event of this.events) {
      counts.set(event.activity, (counts.get(event.activity) || 0) + 1);
    }
    const rework = [];
    for (const [activity, count] of counts) {
      if (count > 1) rework.push(activity);
    }
    return rework;
  }

  /**
   * Create a deep clone of this trace including all events.
   * @returns {Trace}
   */
  clone() {
    const trace = new Trace(this.caseId, new Map(this.attributes));
    for (const event of this.events) {
      // Directly push cloned events — they are already in order
      trace.events.push(event.clone());
    }
    return trace;
  }

  /**
   * Serialize to a plain object suitable for JSON.
   * @returns {object}
   */
  toJSON() {
    const obj = {
      caseId: this.caseId,
      events: this.events.map(e => e.toJSON()),
    };
    if (this.attributes.size > 0) obj.attributes = Object.fromEntries(this.attributes);
    return obj;
  }

  /**
   * Reconstruct a Trace from a plain object (inverse of toJSON).
   * @param {object} json
   * @returns {Trace}
   */
  static fromJSON(json) {
    const trace = new Trace(json.caseId, json.attributes || null);
    for (const eventJson of (json.events || [])) {
      trace.addEvent(Event.fromJSON(eventJson));
    }
    return trace;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EventLog
// ─────────────────────────────────────────────────────────────────────────────

/**
 * An event log — the top-level container for process mining data.
 *
 * Maps to the XES <log> element. Contains traces (cases), each of which
 * contains a sequence of events.
 *
 * Provides analytics (variants, DFG, statistics), filtering, and
 * import/export (XES XML, JSON, CSV).
 */
class EventLog {
  /**
   * @param {string} [name]                 - Log name.
   * @param {Map|Object} [attributes]       - Log-level attributes.
   */
  constructor(name, attributes) {
    /** @type {string} Log name */
    this.name = name || 'EventLog';

    /** @type {Map<string, Trace>} Case ID -> Trace */
    this.traces = new Map();

    /** @type {Map<string, *>} Log-level attributes */
    this.attributes = new Map();
    if (attributes) {
      const entries = attributes instanceof Map
        ? attributes.entries()
        : Object.entries(attributes);
      for (const [key, value] of entries) {
        this.attributes.set(key, value);
      }
    }

    /** @type {object} Standard XES classifiers */
    this.classifiers = {
      activity: 'concept:name',
      resource: 'org:resource',
    };

    /** @type {string[]} Active XES extensions */
    this.extensions = ['concept', 'lifecycle', 'time', 'organizational'];
  }

  // ── Trace management ────────────────────────────────────────────────────

  /**
   * Add a trace to the log. Replaces any existing trace with the same caseId.
   *
   * @param {Trace} trace
   * @returns {EventLog} this
   */
  addTrace(trace) {
    if (!(trace instanceof Trace)) {
      throw new Error('addTrace requires a Trace instance');
    }
    if (this.traces.has(trace.caseId)) {
      logger.warn(`Replacing existing trace for case '${trace.caseId}'`);
    }
    this.traces.set(trace.caseId, trace);
    return this;
  }

  /**
   * Add an event to a specific case. Creates the trace if it does not exist.
   *
   * @param {string} caseId
   * @param {Event} event
   * @returns {EventLog} this
   */
  addEvent(caseId, event) {
    if (!caseId || typeof caseId !== 'string') {
      throw new Error('addEvent requires a non-empty caseId string');
    }
    if (!(event instanceof Event)) {
      throw new Error('addEvent requires an Event instance');
    }
    if (!this.traces.has(caseId)) {
      this.traces.set(caseId, new Trace(caseId));
    }
    this.traces.get(caseId).addEvent(event);
    return this;
  }

  /**
   * Retrieve a trace by case ID.
   *
   * @param {string} caseId
   * @returns {Trace|undefined}
   */
  getTrace(caseId) {
    return this.traces.get(caseId);
  }

  // ── Statistics ──────────────────────────────────────────────────────────

  /**
   * Number of cases (traces) in the log.
   * @returns {number}
   */
  getCaseCount() {
    return this.traces.size;
  }

  /**
   * Total number of events across all traces.
   * @returns {number}
   */
  getEventCount() {
    let count = 0;
    for (const trace of this.traces.values()) {
      count += trace.events.length;
    }
    return count;
  }

  /**
   * Set of all unique activity names across all events.
   * @returns {Set<string>}
   */
  getActivitySet() {
    const activities = new Set();
    for (const trace of this.traces.values()) {
      for (const event of trace.events) {
        activities.add(event.activity);
      }
    }
    return activities;
  }

  /**
   * Number of unique activities in the log.
   * @returns {number}
   */
  getActivityCount() {
    return this.getActivitySet().size;
  }

  /**
   * Set of all unique resource identifiers across all events.
   * @returns {Set<string>}
   */
  getResourceSet() {
    const resources = new Set();
    for (const trace of this.traces.values()) {
      for (const event of trace.events) {
        if (event.resource) resources.add(event.resource);
      }
    }
    return resources;
  }

  /**
   * Compute process variants — unique activity sequences with frequency counts.
   *
   * Returns a Map sorted by frequency descending, where each entry contains:
   *   - count: number of cases following this variant
   *   - caseIds: array of case IDs
   *   - percentage: fraction of total cases (0-100, 2 decimal places)
   *
   * @returns {Map<string, { count: number, caseIds: string[], percentage: number }>}
   */
  getVariants() {
    const variantMap = new Map();
    const totalCases = this.traces.size;

    for (const [caseId, trace] of this.traces) {
      const key = trace.getVariantKey();
      if (!variantMap.has(key)) {
        variantMap.set(key, { count: 0, caseIds: [] });
      }
      const entry = variantMap.get(key);
      entry.count++;
      entry.caseIds.push(caseId);
    }

    // Compute percentages
    for (const entry of variantMap.values()) {
      entry.percentage = totalCases > 0
        ? Math.round((entry.count / totalCases) * 10000) / 100
        : 0;
    }

    // Sort by count descending, then by variant key for determinism
    const sorted = [...variantMap.entries()].sort((a, b) => {
      const diff = b[1].count - a[1].count;
      if (diff !== 0) return diff;
      return a[0].localeCompare(b[0]);
    });

    return new Map(sorted);
  }

  /**
   * Number of unique process variants.
   * @returns {number}
   */
  getVariantCount() {
    const keys = new Set();
    for (const trace of this.traces.values()) {
      keys.add(trace.getVariantKey());
    }
    return keys.size;
  }

  // ── Filtering ───────────────────────────────────────────────────────────

  /**
   * Return a new EventLog containing only the specified case IDs.
   *
   * @param {string[]|Set<string>} caseIds
   * @returns {EventLog}
   */
  filterByCases(caseIds) {
    const idSet = caseIds instanceof Set ? caseIds : new Set(caseIds);
    const filtered = new EventLog(this.name, new Map(this.attributes));
    filtered.classifiers = { ...this.classifiers };
    filtered.extensions = [...this.extensions];

    for (const [caseId, trace] of this.traces) {
      if (idSet.has(caseId)) {
        filtered.addTrace(trace.clone());
      }
    }

    logger.debug(`filterByCases: ${this.traces.size} -> ${filtered.traces.size} cases`);
    return filtered;
  }

  /**
   * Return a new EventLog keeping only events whose activity is in the
   * provided set. Traces that end up with zero events are omitted.
   *
   * @param {string[]|Set<string>} activities
   * @returns {EventLog}
   */
  filterByActivities(activities) {
    const actSet = activities instanceof Set ? activities : new Set(activities);
    const filtered = new EventLog(this.name, new Map(this.attributes));
    filtered.classifiers = { ...this.classifiers };
    filtered.extensions = [...this.extensions];

    for (const [caseId, trace] of this.traces) {
      const newTrace = new Trace(caseId, new Map(trace.attributes));
      for (const event of trace.events) {
        if (actSet.has(event.activity)) {
          newTrace.addEvent(event.clone());
        }
      }
      if (newTrace.events.length > 0) {
        filtered.addTrace(newTrace);
      }
    }

    logger.debug(`filterByActivities: ${this.traces.size} -> ${filtered.traces.size} cases`);
    return filtered;
  }

  /**
   * Return a new EventLog with cases that overlap the given time range.
   * A case overlaps if its start time is before `end` AND its end time is
   * after `start` (standard interval overlap test).
   *
   * @param {Date|string} start
   * @param {Date|string} end
   * @returns {EventLog}
   */
  filterByTimeRange(start, end) {
    const startMs = parseTimestamp(start).getTime();
    const endMs = parseTimestamp(end).getTime();

    if (startMs > endMs) {
      throw new Error('filterByTimeRange: start must be before end');
    }

    const filtered = new EventLog(this.name, new Map(this.attributes));
    filtered.classifiers = { ...this.classifiers };
    filtered.extensions = [...this.extensions];

    for (const [, trace] of this.traces) {
      const traceStart = trace.getStartTime();
      const traceEnd = trace.getEndTime();
      if (!traceStart || !traceEnd) continue;

      // Overlap: trace starts before range ends AND trace ends after range starts
      if (traceStart.getTime() <= endMs && traceEnd.getTime() >= startMs) {
        filtered.addTrace(trace.clone());
      }
    }

    logger.debug(`filterByTimeRange: ${this.traces.size} -> ${filtered.traces.size} cases`);
    return filtered;
  }

  /**
   * Return a new EventLog containing only cases whose case-level attributes
   * include the specified key-value pair.
   *
   * @param {string} key
   * @param {*} value
   * @returns {EventLog}
   */
  filterByAttribute(key, value) {
    const filtered = new EventLog(this.name, new Map(this.attributes));
    filtered.classifiers = { ...this.classifiers };
    filtered.extensions = [...this.extensions];

    for (const [, trace] of this.traces) {
      if (trace.attributes.has(key) && trace.attributes.get(key) === value) {
        filtered.addTrace(trace.clone());
      }
    }

    logger.debug(`filterByAttribute(${key}=${value}): ${this.traces.size} -> ${filtered.traces.size} cases`);
    return filtered;
  }

  // ── Directly-Follows Graph ──────────────────────────────────────────────

  /**
   * Compute the directly-follows matrix across all traces.
   *
   * For every pair of consecutive events (A, B) in every trace, increment
   * DFG[A][B]. This is the core data structure for process discovery
   * algorithms (Alpha Miner, Heuristic Miner, Inductive Miner, etc.).
   *
   * @returns {Map<string, Map<string, number>>}
   */
  getDirectlyFollowsMatrix() {
    const dfg = new Map();

    for (const trace of this.traces.values()) {
      for (let i = 0; i < trace.events.length - 1; i++) {
        const from = trace.events[i].activity;
        const to = trace.events[i + 1].activity;

        if (!dfg.has(from)) dfg.set(from, new Map());
        const row = dfg.get(from);
        row.set(to, (row.get(to) || 0) + 1);
      }
    }

    return dfg;
  }

  /**
   * Count of the first activity in each trace.
   *
   * @returns {Map<string, number>}
   */
  getStartActivities() {
    const starts = new Map();
    for (const trace of this.traces.values()) {
      if (trace.events.length > 0) {
        const act = trace.events[0].activity;
        starts.set(act, (starts.get(act) || 0) + 1);
      }
    }
    return starts;
  }

  /**
   * Count of the last activity in each trace.
   *
   * @returns {Map<string, number>}
   */
  getEndActivities() {
    const ends = new Map();
    for (const trace of this.traces.values()) {
      if (trace.events.length > 0) {
        const act = trace.events[trace.events.length - 1].activity;
        ends.set(act, (ends.get(act) || 0) + 1);
      }
    }
    return ends;
  }

  /**
   * Return the overall time range of the event log.
   *
   * @returns {{ start: string|null, end: string|null }}
   */
  getTimeRange() {
    let minTime = null;
    let maxTime = null;

    for (const trace of this.traces.values()) {
      const start = trace.getStartTime();
      const end = trace.getEndTime();
      if (start && (!minTime || start < minTime)) minTime = start;
      if (end && (!maxTime || end > maxTime)) maxTime = end;
    }

    return {
      start: minTime ? minTime.toISOString() : null,
      end: maxTime ? maxTime.toISOString() : null,
    };
  }

  // ── Export ──────────────────────────────────────────────────────────────

  /**
   * Full structured JSON export of the event log.
   * @returns {object}
   */
  toJSON() {
    return {
      name: this.name,
      attributes: Object.fromEntries(this.attributes),
      classifiers: { ...this.classifiers },
      extensions: [...this.extensions],
      traces: Array.from(this.traces.values()).map(t => t.toJSON()),
    };
  }

  /**
   * Export as a flat CSV table.
   *
   * Columns: caseId, activity, timestamp, resource, lifecycle, then all
   * attribute keys found across all events (sorted alphabetically for
   * deterministic output).
   *
   * @returns {string}
   */
  toCSV() {
    // Collect all attribute keys across all events
    const attrKeys = new Set();
    for (const trace of this.traces.values()) {
      for (const event of trace.events) {
        for (const key of event.attributes.keys()) {
          attrKeys.add(key);
        }
      }
    }
    const sortedAttrKeys = [...attrKeys].sort();

    // Header
    const headers = ['caseId', 'activity', 'timestamp', 'resource', 'lifecycle', ...sortedAttrKeys];
    const lines = [headers.map(escapeCsvField).join(',')];

    // Rows — iterate traces in insertion order, events in chronological order
    for (const [caseId, trace] of this.traces) {
      for (const event of trace.events) {
        const row = [
          caseId,
          event.activity,
          event.timestamp.toISOString(),
          event.resource || '',
          event.lifecycle,
          ...sortedAttrKeys.map(k => {
            const val = event.attributes.get(k);
            return val !== undefined ? val : '';
          }),
        ];
        lines.push(row.map(escapeCsvField).join(','));
      }
    }

    return lines.join('\n');
  }

  /**
   * Export as IEEE XES 2.0 XML.
   *
   * Produces valid XML conforming to the XES standard with extensions
   * for concept, time, lifecycle, and organizational attributes.
   *
   * @returns {string}
   */
  toXES() {
    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8" ?>');
    lines.push('<log xes.version="2.0" xes.features="">');

    // Extensions
    for (const extKey of this.extensions) {
      const ext = XES_EXTENSIONS[extKey];
      if (ext) {
        lines.push(`  <extension name="${escapeXml(ext.name)}" prefix="${escapeXml(ext.prefix)}" uri="${escapeXml(ext.uri)}"/>`);
      }
    }

    // Global attributes
    lines.push('  <global scope="trace">');
    lines.push('    <string key="concept:name" value="UNKNOWN"/>');
    lines.push('  </global>');
    lines.push('  <global scope="event">');
    lines.push('    <string key="concept:name" value="UNKNOWN"/>');
    lines.push('    <date key="time:timestamp" value="1970-01-01T00:00:00.000+00:00"/>');
    lines.push('  </global>');

    // Classifiers
    lines.push(`  <classifier name="Activity" keys="${escapeXml(this.classifiers.activity)}"/>`);
    lines.push(`  <classifier name="Resource" keys="${escapeXml(this.classifiers.resource)}"/>`);

    // Log-level attributes
    if (this.name) {
      lines.push(`  <string key="concept:name" value="${escapeXml(this.name)}"/>`);
    }
    for (const [key, value] of this.attributes) {
      lines.push(`  ${_xesAttribute(key, value)}`);
    }

    // Traces
    for (const trace of this.traces.values()) {
      lines.push('  <trace>');
      lines.push(`    <string key="concept:name" value="${escapeXml(trace.caseId)}"/>`);

      // Trace-level attributes
      for (const [key, value] of trace.attributes) {
        lines.push(`    ${_xesAttribute(key, value)}`);
      }

      // Events
      for (const event of trace.events) {
        lines.push('    <event>');
        lines.push(`      <string key="concept:name" value="${escapeXml(event.activity)}"/>`);
        lines.push(`      <date key="time:timestamp" value="${formatXesTimestamp(event.timestamp)}"/>`);
        if (event.resource) {
          lines.push(`      <string key="org:resource" value="${escapeXml(event.resource)}"/>`);
        }
        lines.push(`      <string key="lifecycle:transition" value="${escapeXml(event.lifecycle)}"/>`);

        // Additional attributes
        for (const [key, value] of event.attributes) {
          lines.push(`      ${_xesAttribute(key, value)}`);
        }

        // sourceRef as nested attributes (non-standard but useful for forensics)
        if (event.sourceRef) {
          if (event.sourceRef.table) {
            lines.push(`      <string key="sap:table" value="${escapeXml(event.sourceRef.table)}"/>`);
          }
          if (event.sourceRef.key) {
            lines.push(`      <string key="sap:key" value="${escapeXml(event.sourceRef.key)}"/>`);
          }
          if (event.sourceRef.field) {
            lines.push(`      <string key="sap:field" value="${escapeXml(event.sourceRef.field)}"/>`);
          }
        }

        lines.push('    </event>');
      }

      lines.push('  </trace>');
    }

    lines.push('</log>');
    return lines.join('\n');
  }

  /**
   * Compact summary of the event log.
   *
   * @returns {object}
   */
  getSummary() {
    const variants = this.getVariants();
    const resources = this.getResourceSet();
    let minTime = null;
    let maxTime = null;

    for (const trace of this.traces.values()) {
      const start = trace.getStartTime();
      const end = trace.getEndTime();
      if (start && (!minTime || start < minTime)) minTime = start;
      if (end && (!maxTime || end > maxTime)) maxTime = end;
    }

    return {
      name: this.name,
      cases: this.getCaseCount(),
      events: this.getEventCount(),
      activities: this.getActivityCount(),
      variants: variants.size,
      timeRange: {
        start: minTime ? minTime.toISOString() : null,
        end: maxTime ? maxTime.toISOString() : null,
      },
      resources: resources.size,
    };
  }

  // ── Import ──────────────────────────────────────────────────────────────

  /**
   * Reconstruct an EventLog from the output of toJSON().
   *
   * @param {object} json
   * @returns {EventLog}
   */
  static fromJSON(json) {
    if (!json || typeof json !== 'object') {
      throw new Error('fromJSON requires a non-null object');
    }

    const log = new EventLog(json.name || 'EventLog', json.attributes || null);

    if (json.classifiers) {
      log.classifiers = { ...log.classifiers, ...json.classifiers };
    }
    if (json.extensions && Array.isArray(json.extensions)) {
      log.extensions = [...json.extensions];
    }

    for (const traceJson of (json.traces || [])) {
      log.addTrace(Trace.fromJSON(traceJson));
    }

    logger.info(`Imported event log from JSON: ${log.getCaseCount()} cases, ${log.getEventCount()} events`);
    return log;
  }

  /**
   * Parse a CSV string into an EventLog.
   *
   * Expected columns (first row is header):
   *   - caseId (required)
   *   - activity (required)
   *   - timestamp (required, ISO 8601)
   *   - resource (optional)
   *   - lifecycle (optional, defaults to 'complete')
   *   - any additional columns become event attributes
   *
   * @param {string} csvString
   * @param {object} [options]
   * @param {string} [options.name] - Name for the created EventLog
   * @returns {EventLog}
   */
  static fromCSV(csvString, options = {}) {
    if (!csvString || typeof csvString !== 'string') {
      throw new Error('fromCSV requires a non-empty CSV string');
    }

    // Parse CSV into records, respecting quoted fields that may contain newlines.
    // We cannot simply split on \n because quoted fields may embed line breaks.
    const records = parseCsvRecords(csvString);

    if (records.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    // Parse header
    const headers = records[0];
    const caseIdIdx = headers.indexOf('caseId');
    const activityIdx = headers.indexOf('activity');
    const timestampIdx = headers.indexOf('timestamp');
    const resourceIdx = headers.indexOf('resource');
    const lifecycleIdx = headers.indexOf('lifecycle');

    if (caseIdIdx === -1) throw new Error('CSV missing required column: caseId');
    if (activityIdx === -1) throw new Error('CSV missing required column: activity');
    if (timestampIdx === -1) throw new Error('CSV missing required column: timestamp');

    // Identify attribute columns (everything that isn't a standard column)
    const standardCols = new Set(['caseId', 'activity', 'timestamp', 'resource', 'lifecycle']);
    const attrIndices = [];
    for (let i = 0; i < headers.length; i++) {
      if (!standardCols.has(headers[i])) {
        attrIndices.push({ index: i, key: headers[i] });
      }
    }

    const log = new EventLog(options.name || 'ImportedCSV');
    let parsed = 0;
    let skipped = 0;

    for (let recordNum = 1; recordNum < records.length; recordNum++) {
      const fields = records[recordNum];

      const caseId = fields[caseIdIdx];
      const activity = fields[activityIdx];
      const timestampStr = fields[timestampIdx];

      if (!caseId || !activity || !timestampStr) {
        skipped++;
        logger.warn(`CSV record ${recordNum + 1}: skipped — missing required field(s)`);
        continue;
      }

      let timestamp;
      try {
        timestamp = parseTimestamp(timestampStr);
      } catch (e) {
        skipped++;
        logger.warn(`CSV record ${recordNum + 1}: skipped — invalid timestamp '${timestampStr}'`);
        continue;
      }

      const resource = resourceIdx !== -1 ? (fields[resourceIdx] || null) : null;
      const lifecycle = lifecycleIdx !== -1 ? (fields[lifecycleIdx] || 'complete') : 'complete';

      // Collect additional attributes
      const attributes = {};
      for (const { index, key } of attrIndices) {
        const val = fields[index];
        if (val !== undefined && val !== '') {
          attributes[key] = val;
        }
      }

      const event = new Event({
        activity,
        timestamp,
        resource: resource || undefined,
        lifecycle,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      });

      log.addEvent(caseId, event);
      parsed++;
    }

    logger.info(`Imported event log from CSV: ${log.getCaseCount()} cases, ${parsed} events, ${skipped} skipped`);
    return log;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: XES attribute serialization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render a key-value pair as an XES attribute element.
 * Infers type from the JavaScript value type.
 *
 * @param {string} key
 * @param {*} value
 * @returns {string} XES XML element
 */
function _xesAttribute(key, value) {
  if (value instanceof Date) {
    return `<date key="${escapeXml(key)}" value="${formatXesTimestamp(value)}"/>`;
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return `<int key="${escapeXml(key)}" value="${value}"/>`;
    }
    return `<float key="${escapeXml(key)}" value="${value}"/>`;
  }
  if (typeof value === 'boolean') {
    return `<boolean key="${escapeXml(key)}" value="${value}"/>`;
  }
  return `<string key="${escapeXml(key)}" value="${escapeXml(String(value))}"/>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = { Event, Trace, EventLog };
