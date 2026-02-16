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
 * Metrics Collector
 *
 * Lightweight in-process metrics collection.
 * Supports counters, gauges, histograms, and summaries.
 * Exposes Prometheus-compatible text format.
 */

class MetricsCollector {
  constructor(options = {}) {
    this.prefix = options.prefix || 'sapconnect';
    this._counters = new Map();
    this._gauges = new Map();
    this._histograms = new Map();
    this.startTime = Date.now();
  }

  /** Increment a counter */
  increment(name, labels = {}, value = 1) {
    const key = this._key(name, labels);
    const current = this._counters.get(key) || { value: 0, labels, name };
    current.value += value;
    this._counters.set(key, current);
  }

  /** Set a gauge value */
  gauge(name, value, labels = {}) {
    const key = this._key(name, labels);
    this._gauges.set(key, { value, labels, name, timestamp: Date.now() });
  }

  /** Record a histogram observation */
  observe(name, value, labels = {}) {
    const key = this._key(name, labels);
    if (!this._histograms.has(key)) {
      this._histograms.set(key, {
        name,
        labels,
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        buckets: new Map(),
      });
    }
    const hist = this._histograms.get(key);
    hist.count++;
    hist.sum += value;
    hist.min = Math.min(hist.min, value);
    hist.max = Math.max(hist.max, value);

    // Standard buckets
    for (const boundary of [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]) {
      if (value <= boundary) {
        hist.buckets.set(boundary, (hist.buckets.get(boundary) || 0) + 1);
      }
    }
  }

  /** Get all metrics as JSON */
  toJSON() {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      counters: {},
      gauges: {},
      histograms: {},
    };

    for (const [key, counter] of this._counters) {
      metrics.counters[key] = { ...counter };
    }
    for (const [key, gauge] of this._gauges) {
      metrics.gauges[key] = { ...gauge };
    }
    for (const [key, hist] of this._histograms) {
      metrics.histograms[key] = {
        ...hist,
        avg: hist.count > 0 ? hist.sum / hist.count : 0,
        buckets: Object.fromEntries(hist.buckets),
      };
    }

    return metrics;
  }

  /** Export in Prometheus text format */
  toPrometheus() {
    const lines = [];

    for (const [, counter] of this._counters) {
      const fullName = `${this.prefix}_${counter.name}_total`;
      const labelStr = this._labelsToString(counter.labels);
      lines.push(`# TYPE ${fullName} counter`);
      lines.push(`${fullName}${labelStr} ${counter.value}`);
    }

    for (const [, gauge] of this._gauges) {
      const fullName = `${this.prefix}_${gauge.name}`;
      const labelStr = this._labelsToString(gauge.labels);
      lines.push(`# TYPE ${fullName} gauge`);
      lines.push(`${fullName}${labelStr} ${gauge.value}`);
    }

    for (const [, hist] of this._histograms) {
      const fullName = `${this.prefix}_${hist.name}`;
      const labelStr = this._labelsToString(hist.labels);
      lines.push(`# TYPE ${fullName} histogram`);
      for (const [boundary, count] of hist.buckets) {
        lines.push(`${fullName}_bucket${this._mergeLabels(labelStr, `le="${boundary}"`)} ${count}`);
      }
      lines.push(`${fullName}_bucket${this._mergeLabels(labelStr, 'le="+Inf"')} ${hist.count}`);
      lines.push(`${fullName}_sum${labelStr} ${hist.sum}`);
      lines.push(`${fullName}_count${labelStr} ${hist.count}`);
    }

    return lines.join('\n') + '\n';
  }

  /** Express middleware for request metrics */
  middleware() {
    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        const labels = { method: req.method, path: req.route?.path || req.path, status: String(res.statusCode) };

        this.increment('http_requests', labels);
        this.observe('http_request_duration_ms', duration, { method: req.method, path: req.route?.path || req.path });

        if (res.statusCode >= 500) {
          this.increment('http_errors', { method: req.method, status: String(res.statusCode) });
        }
      });

      next();
    };
  }

  /** Register /metrics endpoint */
  registerRoutes(router) {
    router.get('/metrics', (_req, res) => {
      const accept = _req.get('Accept') || '';
      if (accept.includes('application/json')) {
        res.json(this.toJSON());
      } else {
        res.type('text/plain').send(this.toPrometheus());
      }
    });

    return router;
  }

  reset() {
    this._counters.clear();
    this._gauges.clear();
    this._histograms.clear();
  }

  _key(name, labels) {
    const labelStr = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  _labelsToString(labels) {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';
    return `{${entries.map(([k, v]) => `${k}="${v}"`).join(',')}}`;
  }

  _mergeLabels(existing, extra) {
    if (!existing) return `{${extra}}`;
    return existing.replace('}', `,${extra}}`);
  }
}

module.exports = { MetricsCollector };
