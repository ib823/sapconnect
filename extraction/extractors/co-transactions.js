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
 * CO Transaction Evidence Extractor
 *
 * Extracts Controlling transaction data: CO document headers (COBK),
 * CO line items (COEP), external postings (COSP), internal postings (COSS),
 * and allocation cycle runs (AUAH/AUAB/AUAC).
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class COTransactionsExtractor extends BaseExtractor {
  get extractorId() { return 'CO_TRANSACTIONS'; }
  get name() { return 'CO Transaction Evidence'; }
  get module() { return 'CO'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: 'COBK', description: 'CO document headers', critical: true },
      { table: 'COEP', description: 'CO line items', critical: true },
      { table: 'COSP', description: 'CO external postings (totals)', critical: true },
      { table: 'COSS', description: 'CO internal postings (totals)', critical: true },
      { table: 'AUAH', description: 'Allocation cycle run headers', critical: false },
      { table: 'AUAB', description: 'Allocation cycle run segments', critical: false },
      { table: 'AUAC', description: 'Allocation cycle run details', critical: false },
    ];
  }

  async _extractLive() {
    const result = { allocationCycles: {} };

    // COBK - CO Document Headers
    try {
      const data = await this._readTable('COBK', {
        fields: ['KOKRS', 'BESSION', 'BELNR', 'BLDAT', 'BUDAT', 'VESSION', 'USNAM', 'AWTYP'],
      });
      result.documentHeaders = data.rows;
    } catch (err) {
      this.logger.warn(`COBK read failed: ${err.message}`);
      result.documentHeaders = [];
    }

    // COEP - CO Line Items
    try {
      const data = await this._readTable('COEP', {
        fields: ['KOKRS', 'BESSION', 'BELNR', 'BUZEI', 'KSTAR', 'OBJNR', 'WKGBTR', 'MESSION', 'BEESSION'],
      });
      result.lineItems = data.rows;
    } catch (err) {
      this.logger.warn(`COEP read failed: ${err.message}`);
      result.lineItems = [];
    }

    // COSP - CO External Postings (Totals)
    try {
      const data = await this._readTable('COSP', {
        fields: ['KOKRS', 'GJAHR', 'KSTAR', 'OBJNR', 'WRTTP', 'VERSN', 'WKGBTR', 'MESSION'],
      });
      result.externalPostings = data.rows;
    } catch (err) {
      this.logger.warn(`COSP read failed: ${err.message}`);
      result.externalPostings = [];
    }

    // COSS - CO Internal Postings (Totals)
    try {
      const data = await this._readTable('COSS', {
        fields: ['KOKRS', 'GJAHR', 'KSTAR', 'OBJNR', 'WRTTP', 'VERSN', 'WKGBTR', 'MESSION'],
      });
      result.internalPostings = data.rows;
    } catch (err) {
      this.logger.warn(`COSS read failed: ${err.message}`);
      result.internalPostings = [];
    }

    // AUAH - Allocation Cycle Run Headers
    try {
      const data = await this._readTable('AUAH', {
        fields: ['KOKRS', 'GJAHR', 'AUESSION_NR', 'AUFNR', 'CYCLE', 'RUN_DATE', 'STATUS'],
      });
      result.allocationCycles.headers = data.rows;
    } catch (err) {
      this.logger.warn(`AUAH read failed: ${err.message}`);
      result.allocationCycles.headers = [];
    }

    // AUAB - Allocation Cycle Run Segments
    try {
      const data = await this._readTable('AUAB', {
        fields: ['KOKRS', 'GJAHR', 'AUESSION_NR', 'SESSION_NR', 'SNAME', 'SENDER', 'RECEIVER', 'WKGBTR'],
      });
      result.allocationCycles.segments = data.rows;
    } catch (err) {
      this.logger.warn(`AUAB read failed: ${err.message}`);
      result.allocationCycles.segments = [];
    }

    // AUAC - Allocation Cycle Run Details
    try {
      const data = await this._readTable('AUAC', {
        fields: ['KOKRS', 'GJAHR', 'AUESSION_NR', 'SNAME', 'PEESSION_FROM', 'PEESSION_TO', 'CTYPE'],
      });
      result.allocationCycles.details = data.rows;
    } catch (err) {
      this.logger.warn(`AUAC read failed: ${err.message}`);
      result.allocationCycles.details = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/co-transactions.json');
    this._trackCoverage('COBK', 'extracted', { rowCount: mockData.documentHeaders.length });
    this._trackCoverage('COEP', 'extracted', { rowCount: mockData.lineItems.length });
    this._trackCoverage('COSP', 'extracted', { rowCount: mockData.externalPostings.length });
    this._trackCoverage('COSS', 'extracted', { rowCount: mockData.internalPostings.length });
    this._trackCoverage('AUAH', 'extracted', { rowCount: mockData.allocationCycles.headers.length });
    this._trackCoverage('AUAB', 'extracted', { rowCount: mockData.allocationCycles.segments.length });
    this._trackCoverage('AUAC', 'extracted', { rowCount: mockData.allocationCycles.details.length });
    return mockData;
  }
}

COTransactionsExtractor._extractorId = 'CO_TRANSACTIONS';
COTransactionsExtractor._module = 'CO';
COTransactionsExtractor._category = 'transaction';
ExtractorRegistry.register(COTransactionsExtractor);

module.exports = COTransactionsExtractor;
