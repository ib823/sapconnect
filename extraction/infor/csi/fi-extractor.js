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
 * Infor CSI Financials Extractor
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforCSIFIExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_CSI_FI'; }
  get name() { return 'Infor CSI Financials'; }
  get module() { return 'CSI_FI'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: "chart", description: "GL Accounts", critical: true },
      { table: "journal", description: "Journal Entries", critical: true },
    ];
  }

  async _extractLive() {
    throw new Error('Live extraction not implemented for INFOR_CSI_FI');
  }

  async _extractMock() {
    const mockData = require('../mock-data/csi/fi.json');
    this._trackCoverage("chart", "extracted", { rowCount: mockData.glAccounts.length });
    this._trackCoverage("journal", "extracted", { rowCount: mockData.journalEntries.length });
    return mockData;
  }
}

InforCSIFIExtractor._extractorId = 'INFOR_CSI_FI';
InforCSIFIExtractor._module = 'CSI_FI';
InforCSIFIExtractor._category = 'transaction';
InforCSIFIExtractor._sourceSystem = 'INFOR_CSI';
ExtractorRegistry.register(InforCSIFIExtractor);

module.exports = InforCSIFIExtractor;
