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
 * PLM Extractor
 *
 * Extracts Product Lifecycle Management configuration including document
 * info records, document content, classification, and characteristics.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class PLMExtractor extends BaseExtractor {
  get extractorId() { return 'PLM_EXTRACTOR'; }
  get name() { return 'Product Lifecycle Management'; }
  get module() { return 'PLM'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'DRAW', description: 'Document info records', critical: true },
      { table: 'STXH', description: 'Document content headers (SAPscript)', critical: false },
      { table: 'STXL', description: 'Document content lines (SAPscript)', critical: false },
      { table: 'AUSP', description: 'Classification values', critical: true },
      { table: 'CABN', description: 'Characteristics', critical: true },
      { table: 'CAWN', description: 'Characteristic values', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // DRAW - Document info records
    try {
      const data = await this._readTable('DRAW', {
        fields: ['DOKNR', 'DOKAR', 'DOKVR', 'DOKTL', 'DKTXT', 'LABOR', 'DOKST', 'DWNAM'],
      });
      result.documentInfoRecords = data.rows;
    } catch (err) {
      this.logger.warn(`DRAW read failed: ${err.message}`);
      result.documentInfoRecords = [];
    }

    // STXH - Document content headers
    try {
      const data = await this._readTable('STXH', {
        fields: ['TDOBJECT', 'TDNAME', 'TDID', 'TDSPRAS', 'TDTEXTTYPE', 'TDVERSION'],
      });
      result.documentContent = data.rows;
    } catch (err) {
      this._trackCoverage('STXH', 'skipped', { reason: err.message });
      result.documentContent = [];
    }

    // AUSP - Classification values
    try {
      const data = await this._readTable('AUSP', {
        fields: ['OBJEK', 'ATINN', 'ATZHL', 'MESSION', 'KLART', 'ATWRT', 'ATFLV'],
      });
      result.classification = data.rows;
    } catch (err) {
      this.logger.warn(`AUSP read failed: ${err.message}`);
      result.classification = [];
    }

    // CABN - Characteristics
    try {
      const data = await this._readTable('CABN', {
        fields: ['ATINN', 'ATNAM', 'ATFOR', 'ANZST', 'ATSCH', 'ADZHL'],
      });
      result.characteristics = data.rows;
    } catch (err) {
      this.logger.warn(`CABN read failed: ${err.message}`);
      result.characteristics = [];
    }

    // CAWN - Characteristic values
    try {
      const data = await this._readTable('CAWN', {
        fields: ['ATINN', 'ATZHL', 'ATWRT', 'ATCOD', 'ATAWE', 'ATAW1'],
      });
      result.characteristicValues = data.rows;
    } catch (err) {
      this._trackCoverage('CAWN', 'skipped', { reason: err.message });
      result.characteristicValues = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/plm-data.json');
    this._trackCoverage('DRAW', 'extracted', { rowCount: mockData.documentInfoRecords.length });
    this._trackCoverage('STXH', 'extracted', { rowCount: mockData.documentContent.length });
    this._trackCoverage('AUSP', 'extracted', { rowCount: mockData.classification.length });
    this._trackCoverage('CABN', 'extracted', { rowCount: mockData.characteristics.length });
    this._trackCoverage('CAWN', 'extracted', { rowCount: mockData.characteristicValues.length });
    return mockData;
  }
}

PLMExtractor._extractorId = 'PLM_EXTRACTOR';
PLMExtractor._module = 'PLM';
PLMExtractor._category = 'config';
ExtractorRegistry.register(PLMExtractor);

module.exports = PLMExtractor;
