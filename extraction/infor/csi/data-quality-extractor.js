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
 * Infor CSI Data Quality Extractor
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforCSIDataQualityExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_CSI_DATA_QUALITY'; }
  get name() { return 'Infor CSI Data Quality'; }
  get module() { return 'CSI_DQ'; }
  get category() { return 'data-quality'; }

  getExpectedTables() {
    return [
      { table: "item", description: "Item Data Quality", critical: true },
      { table: "customer", description: "Customer Data Quality", critical: true },
    ];
  }

  async _extractLive() {
    throw new Error('Live extraction not implemented for INFOR_CSI_DATA_QUALITY');
  }

  async _extractMock() {
    const mockData = require('../mock-data/csi/data-quality.json');
    this._trackCoverage("item", "extracted", { rowCount: mockData.tables.length });
    this._trackCoverage("customer", "extracted", { rowCount: mockData.duplicates.length });
    return mockData;
  }
}

InforCSIDataQualityExtractor._extractorId = 'INFOR_CSI_DATA_QUALITY';
InforCSIDataQualityExtractor._module = 'CSI_DQ';
InforCSIDataQualityExtractor._category = 'data-quality';
InforCSIDataQualityExtractor._sourceSystem = 'INFOR_CSI';
ExtractorRegistry.register(InforCSIDataQualityExtractor);

module.exports = InforCSIDataQualityExtractor;
