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
 * Infor LN Report Extractor
 *
 * Extracts reports and batch jobs: ttadv7500 (reports), ttjmg (batch jobs),
 * and business rules.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNReportExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_REPORTS'; }
  get name() { return 'Infor LN Reports and Batch Jobs'; }
  get module() { return 'LN_RPT'; }
  get category() { return 'reports'; }

  getExpectedTables() {
    return [
      { table: 'ttadv7500', description: 'Reports', critical: true },
      { table: 'ttjmg0100', description: 'Batch jobs', critical: true },
      { table: 'ttadv7600', description: 'Business rules', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // ttadv7500 - Reports
    try {
      const data = await this._readTable('ttadv7500', { fields: ['t$rpid', 't$code', 't$name', 't$modn', 't$type', 't$frmt', 't$freq', 't$cust', 't$actv'] });
      result.reports = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv7500 read failed: ${err.message}`);
      result.reports = [];
    }

    // ttjmg0100 - Batch Jobs
    try {
      const data = await this._readTable('ttjmg0100', { fields: ['t$jbid', 't$name', 't$sess', 't$schd', 't$freq', 't$cpnb', 't$actv', 't$lrun', 't$stat', 't$durn'] });
      result.batchJobs = data.rows;
    } catch (err) {
      this.logger.warn(`ttjmg0100 read failed: ${err.message}`);
      result.batchJobs = [];
    }

    // ttadv7600 - Business Rules
    try {
      const data = await this._readTable('ttadv7600', { fields: ['t$brid', 't$name', 't$desc', 't$modn', 't$type', 't$cond', 't$actn', 't$actv'] });
      result.businessRules = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv7600 read failed: ${err.message}`);
      result.businessRules = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/reports.json');
    this._trackCoverage('ttadv7500', 'extracted', { rowCount: mockData.reports.length });
    this._trackCoverage('ttjmg0100', 'extracted', { rowCount: mockData.batchJobs.length });
    this._trackCoverage('ttadv7600', 'extracted', { rowCount: mockData.businessRules.length });
    return mockData;
  }
}

InforLNReportExtractor._extractorId = 'INFOR_LN_REPORTS';
InforLNReportExtractor._module = 'LN_RPT';
InforLNReportExtractor._category = 'reports';
InforLNReportExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNReportExtractor);

module.exports = InforLNReportExtractor;
