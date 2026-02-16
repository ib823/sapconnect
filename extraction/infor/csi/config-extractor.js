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
 * Infor CSI System Configuration Extractor
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforCSIConfigExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_CSI_CONFIG'; }
  get name() { return 'Infor CSI System Configuration'; }
  get module() { return 'CSI_BASIS'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: "parms", description: "Company Parameters", critical: true },
      { table: "sites", description: "Sites", critical: true },
      { table: "currencies", description: "Currency Settings", critical: false },
    ];
  }

  async _extractLive() {
    throw new Error('Live extraction not implemented for INFOR_CSI_CONFIG');
  }

  async _extractMock() {
    const mockData = require('../mock-data/csi/config.json');
    this._trackCoverage("parms", "extracted", { rowCount: 1 });
    this._trackCoverage("sites", "extracted", { rowCount: mockData.sites.length });
    this._trackCoverage("currencies", "extracted", { rowCount: mockData.currencySettings.length });
    return mockData;
  }
}

InforCSIConfigExtractor._extractorId = 'INFOR_CSI_CONFIG';
InforCSIConfigExtractor._module = 'CSI_BASIS';
InforCSIConfigExtractor._category = 'config';
InforCSIConfigExtractor._sourceSystem = 'INFOR_CSI';
ExtractorRegistry.register(InforCSIConfigExtractor);

module.exports = InforCSIConfigExtractor;
