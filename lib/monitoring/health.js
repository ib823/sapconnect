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
 * Health Check Endpoints
 *
 * Provides /health (liveness) and /ready (readiness) endpoints
 * following Kubernetes health check conventions.
 */

const Logger = require('../logger');

class HealthCheck {
  constructor(options = {}) {
    this.logger = new Logger('health', { level: 'warn' });
    this.checks = new Map();
    this.startTime = Date.now();
    this.version = options.version || process.env.APP_VERSION || '1.0.0';
    this.name = options.name || 'sapconnect';
  }

  /**
   * Register a readiness check
   * @param {string} name - Check name (e.g., 'database', 'sap-connectivity')
   * @param {Function} checkFn - Async function returning { status: 'up'|'down', details? }
   */
  register(name, checkFn) {
    this.checks.set(name, checkFn);
  }

  /**
   * Liveness probe - is the process alive and responding?
   */
  async liveness() {
    return {
      status: 'up',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: this.version,
      name: this.name,
      pid: process.pid,
      memory: {
        rss: Math.floor(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };
  }

  /**
   * Readiness probe - are all dependencies available?
   */
  async readiness() {
    const results = {};
    let allHealthy = true;

    for (const [name, checkFn] of this.checks) {
      try {
        const result = await Promise.race([
          checkFn(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
        ]);
        results[name] = result;
        if (result.status !== 'up') allHealthy = false;
      } catch (err) {
        results[name] = { status: 'down', error: err.message };
        allHealthy = false;
      }
    }

    return {
      status: allHealthy ? 'up' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: results,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Register Express routes
   */
  registerRoutes(router) {
    router.get('/health', async (_req, res) => {
      const result = await this.liveness();
      res.status(200).json(result);
    });

    router.get('/ready', async (_req, res) => {
      const result = await this.readiness();
      res.status(result.status === 'up' ? 200 : 503).json(result);
    });

    return router;
  }
}

module.exports = { HealthCheck };
