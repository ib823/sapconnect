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
 * Infor CSI Purchasing Extractor
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforCSIPurchasingExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_CSI_PURCHASING'; }
  get name() { return 'Infor CSI Purchasing'; }
  get module() { return 'CSI_MM'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: "po", description: "PO Headers", critical: true },
      { table: "poline", description: "PO Lines", critical: true },
      { table: "vendor", description: "Vendors", critical: true },
    ];
  }

  async _extractLive() {
    throw new Error('Live extraction not implemented for INFOR_CSI_PURCHASING');
  }

  async _extractMock() {
    const mockData = require('../mock-data/csi/purchasing.json');
    this._trackCoverage("po", "extracted", { rowCount: mockData.poHeaders.length });
    this._trackCoverage("poline", "extracted", { rowCount: mockData.poLines.length });
    this._trackCoverage("vendor", "extracted", { rowCount: mockData.vendors.length });
    return mockData;
  }
}

InforCSIPurchasingExtractor._extractorId = 'INFOR_CSI_PURCHASING';
InforCSIPurchasingExtractor._module = 'CSI_MM';
InforCSIPurchasingExtractor._category = 'transaction';
InforCSIPurchasingExtractor._sourceSystem = 'INFOR_CSI';
ExtractorRegistry.register(InforCSIPurchasingExtractor);

module.exports = InforCSIPurchasingExtractor;
