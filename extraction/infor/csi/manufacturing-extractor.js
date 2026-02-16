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
 * Infor CSI Manufacturing Extractor
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforCSIManufacturingExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_CSI_MANUFACTURING'; }
  get name() { return 'Infor CSI Manufacturing'; }
  get module() { return 'CSI_PP'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: "job", description: "Job Headers", critical: true },
      { table: "jobroute", description: "Job Routes", critical: true },
      { table: "jobmatl", description: "Job Materials", critical: false },
    ];
  }

  async _extractLive() {
    throw new Error('Live extraction not implemented for INFOR_CSI_MANUFACTURING');
  }

  async _extractMock() {
    const mockData = require('../mock-data/csi/manufacturing.json');
    this._trackCoverage("job", "extracted", { rowCount: mockData.jobHeaders.length });
    this._trackCoverage("jobroute", "extracted", { rowCount: mockData.jobRoutes.length });
    this._trackCoverage("jobmatl", "extracted", { rowCount: mockData.jobMaterials.length });
    return mockData;
  }
}

InforCSIManufacturingExtractor._extractorId = 'INFOR_CSI_MANUFACTURING';
InforCSIManufacturingExtractor._module = 'CSI_PP';
InforCSIManufacturingExtractor._category = 'master-data';
InforCSIManufacturingExtractor._sourceSystem = 'INFOR_CSI';
ExtractorRegistry.register(InforCSIManufacturingExtractor);

module.exports = InforCSIManufacturingExtractor;
