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
 * Infor M3 Purchase Orders Extractor
 *
 * Extracts purchasing: MPHEAD/MPLINE (PO header/lines),
 * MPAGRH (agreements).
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3PurchasingExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_PURCHASING'; }
  get name() { return 'Infor M3 Purchase Orders'; }
  get module() { return 'M3_MM'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: 'MPHEAD', description: 'PO headers', critical: true },
      { table: 'MPLINE', description: 'PO lines', critical: true },
      { table: 'MPAGRH', description: 'Purchase agreements', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('MPHEAD', {
        fields: ['IAPUNO', 'IASUNO', 'IASUNM', 'IAORDT', 'IAPUSL', 'IADWDT', 'IATEPY', 'IAFACI', 'IAWHLO', 'IACUCD', 'IACONO'],
      });
      result.poHeaders = data.rows;
    } catch (err) {
      this.logger.warn(`MPHEAD read failed: ${err.message}`);
      result.poHeaders = [];
    }

    try {
      const data = await this._readTable('MPLINE', {
        fields: ['IBPUNO', 'IBPONR', 'IBITNO', 'IBITDS', 'IBORQA', 'IBORQT', 'IBPUPR', 'IBNEPR', 'IBSTAT'],
      });
      result.poLines = data.rows;
    } catch (err) {
      this.logger.warn(`MPLINE read failed: ${err.message}`);
      result.poLines = [];
    }

    try {
      const data = await this._readTable('MPAGRH', {
        fields: ['AHAGRN', 'AHSUNO', 'AHSUNM', 'AHFVDT', 'AHUVDT', 'AHSTAT', 'AHCUCD', 'AHAGTP', 'AHCONO'],
      });
      result.agreements = data.rows;
    } catch (err) {
      this.logger.warn(`MPAGRH read failed: ${err.message}`);
      result.agreements = [];
    }

    result.summary = {
      totalPOs: result.poHeaders.length,
      totalPOLines: result.poLines.length,
      totalAgreements: (result.agreements || []).length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/purchasing.json');
    this._trackCoverage('MPHEAD', 'extracted', { rowCount: (mockData.poHeaders || []).length });
    this._trackCoverage('MPLINE', 'extracted', { rowCount: (mockData.poLines || []).length });
    this._trackCoverage('MPAGRH', 'extracted', { rowCount: (mockData.agreements || mockData.suppliers || []).length });
    return mockData;
  }
}

InforM3PurchasingExtractor._extractorId = 'INFOR_M3_PURCHASING';
InforM3PurchasingExtractor._module = 'M3_MM';
InforM3PurchasingExtractor._category = 'transaction';
InforM3PurchasingExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3PurchasingExtractor);

module.exports = InforM3PurchasingExtractor;
