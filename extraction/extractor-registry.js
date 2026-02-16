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
 * Extractor Registry
 *
 * Central registry for all forensic extractors. Supports auto-discovery,
 * parallel execution with configurable concurrency, and aggregated coverage.
 */

const Logger = require('../lib/logger');

class ExtractorRegistry {
  static _extractors = new Map();
  static _log = new Logger('extractor-registry');

  static register(ExtractorClass) {
    // Instantiate with null context to read identity
    const temp = Object.create(ExtractorClass.prototype);
    let id;
    try {
      id = ExtractorClass._extractorId || temp.constructor._extractorId;
    } catch {
      // Fall back to calling getter via a dummy
    }
    if (!id) {
      // Use a more robust approach — store on the class itself
      id = ExtractorClass.name;
    }
    ExtractorRegistry._extractors.set(id, ExtractorClass);
  }

  static get(extractorId) {
    return ExtractorRegistry._extractors.get(extractorId) || null;
  }

  static getByModule(module) {
    const result = [];
    for (const [, ExtClass] of ExtractorRegistry._extractors) {
      if (ExtClass._module === module) result.push(ExtClass);
    }
    return result;
  }

  static getByCategory(category) {
    const result = [];
    for (const [, ExtClass] of ExtractorRegistry._extractors) {
      if (ExtClass._category === category) result.push(ExtClass);
    }
    return result;
  }

  static getAll() {
    return Array.from(ExtractorRegistry._extractors.entries()).map(([id, cls]) => ({ id, cls }));
  }

  /**
   * Run all registered extractors in parallel with concurrency control.
   * @param {import('./extraction-context')} context
   * @param {object} [options]
   * @param {number} [options.concurrency=5]
   * @param {string[]} [options.modules] - Filter to specific modules
   * @returns {Map<string, object>} Results by extractorId
   */
  static async runAll(context, options = {}) {
    const concurrency = options.concurrency || 5;
    const log = ExtractorRegistry._log;
    const results = new Map();

    let entries = ExtractorRegistry.getAll();
    if (options.modules) {
      const mods = new Set(options.modules.map(m => m.toUpperCase()));
      entries = entries.filter(e => mods.has((e.cls._module || '').toUpperCase()));
    }

    // Sort: metadata extractors first, then by module
    entries.sort((a, b) => {
      const aCat = a.cls._category || '';
      const bCat = b.cls._category || '';
      if (aCat === 'metadata' && bCat !== 'metadata') return -1;
      if (bCat === 'metadata' && aCat !== 'metadata') return 1;
      return (a.cls._module || '').localeCompare(b.cls._module || '');
    });

    log.info(`Running ${entries.length} extractors (concurrency: ${concurrency})`);

    // Execute with concurrency limit
    const queue = [...entries];
    const running = new Set();

    const runNext = async () => {
      while (queue.length > 0 && running.size < concurrency) {
        const entry = queue.shift();
        const promise = (async () => {
          const extractor = new entry.cls(context);
          try {
            const result = await extractor.extract();
            results.set(entry.id, result);
            log.info(`Completed: ${entry.id}`);
          } catch (err) {
            results.set(entry.id, { error: err.message });
            log.error(`Failed: ${entry.id}: ${err.message}`);
          }
        })();
        running.add(promise);
        promise.finally(() => {
          running.delete(promise);
          runNext();
        });
      }
    };

    await runNext();
    // Wait for all running to complete
    while (running.size > 0) {
      await Promise.race(running);
    }

    return results;
  }

  /**
   * Run all extractors for a specific module.
   */
  static async runModule(module, context, options = {}) {
    return ExtractorRegistry.runAll(context, { ...options, modules: [module] });
  }

  /**
   * Get aggregated coverage across all extractors.
   */
  static getAggregatedCoverage(context) {
    return context.coverage.getSystemReport();
  }

  static clear() {
    ExtractorRegistry._extractors.clear();
  }
}

module.exports = ExtractorRegistry;
