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
const fs = require('fs');
const path = require('path');
const Logger = require('../lib/logger');

/**
 * Source Data Extractor
 *
 * Extracts data per module with selection criteria (cutoff dates, status filters).
 * Mock mode returns sample extraction results.
 */
class Extractor {
  constructor(gateway, options = {}) {
    this.gateway = gateway;
    this.verbose = options.verbose || false;
    this.cutoffDate = options.cutoffDate || '2020-01-01';
    this.modules = options.modules || ['FI', 'MM', 'SD', 'HR'];
    this.logger = new Logger('extractor', { level: options.logLevel || 'info' });
  }

  _log(msg) {
    this.logger.info(msg);
  }

  /**
   * Extract source data per module
   * @returns {object} { extractions[], stats }
   */
  async extract() {
    this._log('Starting data extraction...');

    if (this.gateway.mode === 'mock') {
      return this._extractMock();
    }

    return this._extractLive();
  }

  _extractMock() {
    this._log('Running mock extraction (demo data)...');

    const extractions = [];
    const moduleConfigs = {
      FI: {
        tables: [
          { table: 'BKPF', description: 'Accounting Doc Headers', records: 4200000, criteria: `BUDAT >= '${this.cutoffDate}'` },
          { table: 'BSEG', description: 'Accounting Doc Items', records: 29400000, criteria: `Header BUDAT >= '${this.cutoffDate}'` },
          { table: 'KNA1', description: 'Customer Master', records: 42000, criteria: 'All active customers' },
          { table: 'LFA1', description: 'Vendor Master', records: 24000, criteria: 'All active vendors' },
          { table: 'SKA1', description: 'GL Account Master', records: 3200, criteria: 'All accounts' },
        ],
        totalRecords: 33669200,
        duration: '4h 20m',
      },
      MM: {
        tables: [
          { table: 'EKKO', description: 'PO Headers', records: 1560000, criteria: `AEDAT >= '${this.cutoffDate}'` },
          { table: 'EKPO', description: 'PO Items', records: 4520000, criteria: `Header AEDAT >= '${this.cutoffDate}'` },
          { table: 'MARA', description: 'Material Master', records: 185000, criteria: 'All active materials' },
          { table: 'MARC', description: 'Plant Data', records: 420000, criteria: 'All active plant assignments' },
        ],
        totalRecords: 6685000,
        duration: '1h 45m',
      },
      SD: {
        tables: [
          { table: 'VBAK', description: 'Sales Order Headers', records: 2000000, criteria: `ERDAT >= '${this.cutoffDate}'` },
          { table: 'VBAP', description: 'Sales Order Items', records: 5750000, criteria: `Header ERDAT >= '${this.cutoffDate}'` },
          { table: 'LIKP', description: 'Delivery Headers', records: 1800000, criteria: `ERDAT >= '${this.cutoffDate}'` },
          { table: 'LIPS', description: 'Delivery Items', records: 4650000, criteria: `Header ERDAT >= '${this.cutoffDate}'` },
        ],
        totalRecords: 14200000,
        duration: '3h 10m',
      },
      HR: {
        tables: [
          { table: 'PA0001', description: 'Org Assignment', records: 890000, criteria: 'All infotype records' },
          { table: 'PA0002', description: 'Personal Data', records: 45000, criteria: 'All active employees' },
          { table: 'PA0008', description: 'Basic Pay', records: 320000, criteria: 'All infotype records' },
        ],
        totalRecords: 1255000,
        duration: '0h 35m',
      },
    };

    let totalRecords = 0;
    for (const mod of this.modules) {
      const config = moduleConfigs[mod.toUpperCase()];
      if (config) {
        extractions.push({
          module: mod.toUpperCase(),
          status: 'completed',
          tables: config.tables,
          totalRecords: config.totalRecords,
          estimatedDuration: config.duration,
          cutoffDate: this.cutoffDate,
        });
        totalRecords += config.totalRecords;
      }
    }

    return {
      extractions,
      stats: {
        modulesExtracted: extractions.length,
        totalRecords,
        cutoffDate: this.cutoffDate,
        status: 'completed',
      },
    };
  }

  async _extractLive() {
    this._log('Live extraction not yet implemented, falling back to mock...');
    this.logger.warn('Live extraction requires RFC_READ_TABLE or ABAP extraction programs.');
    this.logger.warn('Falling back to mock data.');
    return this._extractMock();
  }
}

module.exports = Extractor;
