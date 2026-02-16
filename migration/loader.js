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
const Logger = require('../lib/logger');

/**
 * Target Data Loader
 *
 * Loads transformed data via OData APIs (public cloud) or staging tables (private cloud).
 * Mock mode simulates load results with record counts.
 */
class Loader {
  constructor(gateway, options = {}) {
    this.gateway = gateway;
    this.verbose = options.verbose || false;
    this.batchSize = options.batchSize || 5000;
    this.targetType = options.targetType || 'public'; // public | private
    this.logger = new Logger('loader', { level: options.logLevel || 'info' });
  }

  _log(msg) {
    this.logger.info(msg);
  }

  /**
   * Load transformed data into target system
   * @param {object} transformResult - Output from Transformer.transform()
   * @returns {object} { loads[], stats }
   */
  async load(transformResult) {
    this._log('Starting data load...');

    const loads = [];
    let totalLoaded = 0;
    let totalErrors = 0;
    let totalBatches = 0;

    for (const transformation of transformResult.transformations) {
      if (transformation.status === 'skipped') continue;

      const result = await this._loadModule(transformation);
      loads.push(result);
      totalLoaded += result.recordsLoaded;
      totalErrors += result.errors;
      totalBatches += result.batches;
    }

    return {
      loads,
      stats: {
        modulesLoaded: loads.length,
        totalRecordsLoaded: totalLoaded,
        totalBatches,
        totalErrors,
        batchSize: this.batchSize,
        targetType: this.targetType,
        status: totalErrors === 0 ? 'completed' : 'completed_with_errors',
      },
    };
  }

  async _loadModule(transformation) {
    this._log(`Loading module: ${transformation.module}`);

    const tableLoads = [];
    let recordsLoaded = 0;
    let errors = 0;
    let batches = 0;

    for (const mapping of transformation.tableMappings) {
      const tableBatches = Math.ceil(mapping.outputRecords / this.batchSize);
      // Simulate a small error rate (0.1%)
      const tableErrors = Math.round(mapping.outputRecords * 0.001);
      const loaded = mapping.outputRecords - tableErrors;

      tableLoads.push({
        sourceTable: mapping.sourceTable,
        targetTable: mapping.targetTable,
        targetAPI: mapping.targetAPI,
        method: this.targetType === 'public' ? 'OData API' : 'Staging Table',
        inputRecords: mapping.outputRecords,
        recordsLoaded: loaded,
        errors: tableErrors,
        batches: tableBatches,
        status: tableErrors === 0 ? 'success' : 'partial',
      });

      recordsLoaded += loaded;
      errors += tableErrors;
      batches += tableBatches;
    }

    return {
      module: transformation.module,
      status: errors === 0 ? 'success' : 'partial',
      recordsLoaded,
      errors,
      batches,
      tableLoads,
    };
  }
}

module.exports = Loader;
