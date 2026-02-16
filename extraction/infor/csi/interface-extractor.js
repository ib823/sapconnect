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
 * Infor CSI Interfaces Extractor
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforCSIInterfaceExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_CSI_INTERFACES'; }
  get name() { return 'Infor CSI Interfaces'; }
  get module() { return 'CSI_INT'; }
  get category() { return 'interface'; }

  getExpectedTables() {
    return [
      { table: "IdoConnections", description: "IDO Connections", critical: true },
      { table: "BodInterfaces", description: "BOD Interfaces", critical: false },
    ];
  }

  async _extractLive() {
    throw new Error('Live extraction not implemented for INFOR_CSI_INTERFACES');
  }

  async _extractMock() {
    const mockData = require('../mock-data/csi/interfaces.json');
    this._trackCoverage("IdoConnections", "extracted", { rowCount: mockData.idoConnections.length });
    this._trackCoverage("BodInterfaces", "extracted", { rowCount: mockData.bodInterfaces.length });
    return mockData;
  }
}

InforCSIInterfaceExtractor._extractorId = 'INFOR_CSI_INTERFACES';
InforCSIInterfaceExtractor._module = 'CSI_INT';
InforCSIInterfaceExtractor._category = 'interface';
InforCSIInterfaceExtractor._sourceSystem = 'INFOR_CSI';
ExtractorRegistry.register(InforCSIInterfaceExtractor);

module.exports = InforCSIInterfaceExtractor;
