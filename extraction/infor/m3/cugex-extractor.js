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
 * Infor M3 CUGEX Extractor
 *
 * Extracts CUGEX (Customer Generic Extension) tables:
 * CUGEX1, CUGEX2, CUGEX3.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3CugexExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_CUGEX'; }
  get name() { return 'Infor M3 CUGEX Custom Extensions'; }
  get module() { return 'M3_CUSTOM'; }
  get category() { return 'customization'; }

  getExpectedTables() {
    return [
      { table: 'CUGEX1', description: 'CUGEX table 1', critical: true },
      { table: 'CUGEX2', description: 'CUGEX table 2', critical: false },
      { table: 'CUGEX3', description: 'CUGEX table 3', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('CUGEX1', {
        fields: ['F1PK01', 'F1PK02', 'F1FILE', 'F1A030', 'F1A130', 'F1N096', 'F1CONO', 'F1RGDT'],
      });
      result.cugex1 = data.rows;
    } catch (err) {
      this.logger.warn(`CUGEX1 read failed: ${err.message}`);
      result.cugex1 = [];
    }

    try {
      const data = await this._readTable('CUGEX2', {
        fields: ['F2PK01', 'F2PK02', 'F2FILE', 'F2A030', 'F2A130', 'F2CONO', 'F2RGDT'],
      });
      result.cugex2 = data.rows;
    } catch (err) {
      this.logger.warn(`CUGEX2 read failed: ${err.message}`);
      result.cugex2 = [];
    }

    try {
      const data = await this._readTable('CUGEX3', {
        fields: ['F3PK01', 'F3PK02', 'F3FILE', 'F3A030', 'F3A130', 'F3DAT1', 'F3DAT2', 'F3CONO'],
      });
      result.cugex3 = data.rows;
    } catch (err) {
      this.logger.warn(`CUGEX3 read failed: ${err.message}`);
      result.cugex3 = [];
    }

    result.summary = {
      totalCugex1Records: result.cugex1.length,
      totalCugex2Records: result.cugex2.length,
      totalCugex3Records: result.cugex3.length,
      tablesExtended: [...new Set([
        ...result.cugex1.map(r => r.F1FILE),
        ...result.cugex2.map(r => r.F2FILE),
        ...result.cugex3.map(r => r.F3FILE),
      ])],
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/cugex.json');
    this._trackCoverage('CUGEX1', 'extracted', { rowCount: (mockData.cugex1 || mockData.cugexRecords || []).length });
    this._trackCoverage('CUGEX2', 'extracted', { rowCount: (mockData.cugex2 || []).length });
    this._trackCoverage('CUGEX3', 'extracted', { rowCount: (mockData.cugex3 || mockData.cugexDefinitions || []).length });
    return mockData;
  }
}

InforM3CugexExtractor._extractorId = 'INFOR_M3_CUGEX';
InforM3CugexExtractor._module = 'M3_CUSTOM';
InforM3CugexExtractor._category = 'customization';
InforM3CugexExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3CugexExtractor);

module.exports = InforM3CugexExtractor;
