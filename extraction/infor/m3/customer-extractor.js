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
 * Infor M3 Customer Master Extractor
 *
 * Extracts customers: CIDMAS (customer master), CIDADR (addresses),
 * and bank details.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3CustomerExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_CUSTOMER'; }
  get name() { return 'Infor M3 Customer Master'; }
  get module() { return 'M3_BP'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'CIDMAS', description: 'Customer master', critical: true },
      { table: 'CIDADR', description: 'Customer addresses', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('CIDMAS', {
        fields: ['OKCUNO', 'OKCUNM', 'OKYRNO', 'OKCUTP', 'OKCUCL', 'OKCONO', 'OKCSCD', 'OKPHNO', 'OKEMAL', 'OKSTAT', 'OKLNCD', 'OKCUCD'],
      });
      result.customers = data.rows;
    } catch (err) {
      this.logger.warn(`CIDMAS read failed: ${err.message}`);
      result.customers = [];
    }

    try {
      const data = await this._readTable('CIDADR', {
        fields: ['ADCUNO', 'ADADRT', 'ADADR1', 'ADADR2', 'ADTOWN', 'ADECAR', 'ADPONO', 'ADCSCD'],
      });
      result.customerAddresses = data.rows;
    } catch (err) {
      this.logger.warn(`CIDADR read failed: ${err.message}`);
      result.customerAddresses = [];
    }

    result.summary = {
      totalCustomers: result.customers.length,
      activeCustomers: result.customers.filter(c => c.OKSTAT === '20').length,
      totalAddresses: result.customerAddresses.length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/customers.json');
    this._trackCoverage('CIDMAS', 'extracted', { rowCount: (mockData.customers || []).length });
    this._trackCoverage('CIDADR', 'extracted', { rowCount: (mockData.customerAddresses || []).length });
    return mockData;
  }
}

InforM3CustomerExtractor._extractorId = 'INFOR_M3_CUSTOMER';
InforM3CustomerExtractor._module = 'M3_BP';
InforM3CustomerExtractor._category = 'master-data';
InforM3CustomerExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3CustomerExtractor);

module.exports = InforM3CustomerExtractor;
