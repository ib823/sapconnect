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
 * Live Test Harness — Validates operations against real SAP systems.
 *
 * Supports:
 *   - Dry-run mode (read-only validation)
 *   - Test data cleanup
 *   - Result assertions
 *   - Connection validation
 *   - Gated behind SAP_LIVE_TEST=1
 *
 * Usage:
 *   const harness = new LiveTestHarness({ connection });
 *   if (!harness.isEnabled()) return;
 *   const result = await harness.runTest('odata-read', async (ctx) => {
 *     const data = await ctx.connection.getClient().get('/sap/opu/odata/...');
 *     ctx.assert(data.d.results.length > 0, 'Should return results');
 *   });
 */

const Logger = require('./logger');

class LiveTestHarness {
  /**
   * @param {object} options
   * @param {import('./sap-connection')} [options.connection]
   * @param {boolean} [options.dryRun=true] — When true, skip write operations
   * @param {string[]} [options.cleanupTags] — Tags for auto-cleanup
   */
  constructor(options = {}) {
    this._connection = options.connection || null;
    this._dryRun = options.dryRun !== false;
    this._log = options.logger || new Logger('test-harness');
    this._results = [];
    this._cleanupCallbacks = [];
  }

  /**
   * Check if live testing is enabled.
   * @returns {boolean}
   */
  isEnabled() {
    return process.env.SAP_LIVE_TEST === '1' || process.env.SAP_LIVE_TEST === 'true';
  }

  /** @returns {boolean} */
  get dryRun() { return this._dryRun; }

  /** @returns {object[]} */
  get results() { return [...this._results]; }

  /**
   * Run a named test.
   * @param {string} name — Test identifier
   * @param {function} testFn — async (ctx) => void
   * @returns {object} — { name, passed, duration, error?, assertions }
   */
  async runTest(name, testFn) {
    const ctx = this._createContext(name);
    const start = Date.now();

    try {
      await testFn(ctx);
      const result = {
        name,
        passed: ctx._failures.length === 0,
        duration: Date.now() - start,
        assertions: ctx._assertions,
        failures: ctx._failures,
      };
      this._results.push(result);
      this._log.info(`Test ${result.passed ? 'PASSED' : 'FAILED'}: ${name} (${result.duration}ms)`);
      return result;
    } catch (err) {
      const result = {
        name,
        passed: false,
        duration: Date.now() - start,
        error: err.message,
        assertions: ctx._assertions,
        failures: [...ctx._failures, err.message],
      };
      this._results.push(result);
      this._log.warn(`Test ERROR: ${name} — ${err.message}`);
      return result;
    }
  }

  /**
   * Run multiple tests sequentially.
   * @param {Array<{name: string, fn: function}>} tests
   * @returns {object} — { total, passed, failed, results }
   */
  async runSuite(tests) {
    const results = [];
    for (const { name, fn } of tests) {
      results.push(await this.runTest(name, fn));
    }
    const passed = results.filter(r => r.passed).length;
    return {
      total: results.length,
      passed,
      failed: results.length - passed,
      results,
    };
  }

  /**
   * Register a cleanup callback for test teardown.
   * @param {function} fn — async () => void
   */
  onCleanup(fn) {
    this._cleanupCallbacks.push(fn);
  }

  /**
   * Run all registered cleanup callbacks.
   */
  async cleanup() {
    for (const fn of this._cleanupCallbacks.reverse()) {
      try {
        await fn();
      } catch (err) {
        this._log.warn(`Cleanup error: ${err.message}`);
      }
    }
    this._cleanupCallbacks = [];
  }

  /**
   * Get a summary of all test results.
   * @returns {object}
   */
  getSummary() {
    const total = this._results.length;
    const passed = this._results.filter(r => r.passed).length;
    const totalDuration = this._results.reduce((sum, r) => sum + (r.duration || 0), 0);
    return {
      total,
      passed,
      failed: total - passed,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      totalDuration,
      results: this._results,
    };
  }

  /**
   * Reset test results.
   */
  reset() {
    this._results = [];
    this._cleanupCallbacks = [];
  }

  /** @private */
  _createContext(testName) {
    const ctx = {
      connection: this._connection,
      dryRun: this._dryRun,
      log: this._log.child(testName),
      _assertions: 0,
      _failures: [],

      /**
       * Assert a condition.
       * @param {boolean} condition
       * @param {string} message
       */
      assert(condition, message) {
        ctx._assertions++;
        if (!condition) {
          ctx._failures.push(message || `Assertion ${ctx._assertions} failed`);
        }
      },

      /**
       * Assert equality.
       * @param {*} actual
       * @param {*} expected
       * @param {string} [message]
       */
      assertEqual(actual, expected, message) {
        ctx._assertions++;
        if (actual !== expected) {
          ctx._failures.push(message || `Expected ${expected}, got ${actual}`);
        }
      },

      /**
       * Assert that a value is truthy.
       * @param {*} value
       * @param {string} [message]
       */
      assertTruthy(value, message) {
        ctx._assertions++;
        if (!value) {
          ctx._failures.push(message || `Expected truthy value, got ${value}`);
        }
      },

      /**
       * Assert array has at least N items.
       * @param {Array} arr
       * @param {number} minLength
       * @param {string} [message]
       */
      assertMinLength(arr, minLength, message) {
        ctx._assertions++;
        if (!Array.isArray(arr) || arr.length < minLength) {
          const len = Array.isArray(arr) ? arr.length : 'not an array';
          ctx._failures.push(message || `Expected at least ${minLength} items, got ${len}`);
        }
      },

      /**
       * Skip write operations in dry-run mode.
       * @param {function} fn — async () => result
       * @param {*} [mockResult] — Value to return in dry-run mode
       * @returns {*}
       */
      async writeOp(fn, mockResult = null) {
        if (ctx.dryRun) {
          ctx.log.info('Skipped write operation (dry-run)');
          return mockResult;
        }
        return fn();
      },
    };

    return ctx;
  }
}

module.exports = { LiveTestHarness };
