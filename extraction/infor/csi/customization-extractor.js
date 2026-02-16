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
 * Infor CSI Customizations Extractor
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforCSICustomizationExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_CSI_CUSTOMIZATIONS'; }
  get name() { return 'Infor CSI Customizations'; }
  get module() { return 'CSI_CUSTOM'; }
  get category() { return 'customization'; }

  getExpectedTables() {
    return [
      { table: "UserDefinedFields", description: "User Defined Fields", critical: true },
      { table: "CustomForms", description: "Custom Forms", critical: true },
      { table: "IdoExtensions", description: "IDO Extensions", critical: false },
    ];
  }

  async _extractLive() {
    throw new Error('Live extraction not implemented for INFOR_CSI_CUSTOMIZATIONS');
  }

  async _extractMock() {
    const mockData = require('../mock-data/csi/customizations.json');
    this._trackCoverage("UserDefinedFields", "extracted", { rowCount: mockData.userDefinedFields.length });
    this._trackCoverage("CustomForms", "extracted", { rowCount: mockData.customForms.length });
    this._trackCoverage("IdoExtensions", "extracted", { rowCount: mockData.idoExtensions.length });
    return mockData;
  }
}

InforCSICustomizationExtractor._extractorId = 'INFOR_CSI_CUSTOMIZATIONS';
InforCSICustomizationExtractor._module = 'CSI_CUSTOM';
InforCSICustomizationExtractor._category = 'customization';
InforCSICustomizationExtractor._sourceSystem = 'INFOR_CSI';
ExtractorRegistry.register(InforCSICustomizationExtractor);

module.exports = InforCSICustomizationExtractor;
