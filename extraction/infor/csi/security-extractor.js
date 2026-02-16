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
 * Infor CSI Security Extractor
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforCSISecurityExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_CSI_SECURITY'; }
  get name() { return 'Infor CSI Security'; }
  get module() { return 'CSI_SEC'; }
  get category() { return 'security'; }

  getExpectedTables() {
    return [
      { table: "UserNames", description: "Users", critical: true },
      { table: "Groups", description: "Groups", critical: true },
      { table: "Permissions", description: "Permissions", critical: true },
    ];
  }

  async _extractLive() {
    throw new Error('Live extraction not implemented for INFOR_CSI_SECURITY');
  }

  async _extractMock() {
    const mockData = require('../mock-data/csi/security.json');
    this._trackCoverage("UserNames", "extracted", { rowCount: mockData.users.length });
    this._trackCoverage("Groups", "extracted", { rowCount: mockData.groups.length });
    this._trackCoverage("Permissions", "extracted", { rowCount: mockData.permissions.length });
    return mockData;
  }
}

InforCSISecurityExtractor._extractorId = 'INFOR_CSI_SECURITY';
InforCSISecurityExtractor._module = 'CSI_SEC';
InforCSISecurityExtractor._category = 'security';
InforCSISecurityExtractor._sourceSystem = 'INFOR_CSI';
ExtractorRegistry.register(InforCSISecurityExtractor);

module.exports = InforCSISecurityExtractor;
