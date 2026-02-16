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
 * Lawson System Configuration Extractor
 *
 * Extracts Infor Lawson system configuration: companies, process levels,
 * accounting units, system parameters, and accounting string structure.
 * Lawson uses a flat accounting string format (Company-AcctUnit-Account-SubAccount)
 * that must be decomposed for SAP mapping.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class LawsonConfigExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LAWSON_CONFIG'; }
  get name() { return 'Lawson System Configuration'; }
  get module() { return 'LAWSON_BASIS'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'COMPANY', description: 'Lawson company master', critical: true },
      { table: 'PROCESSLEVEL', description: 'Process level hierarchy', critical: true },
      { table: 'ACCOUNTINGUNIT', description: 'Accounting unit definitions', critical: true },
      { table: 'SYSTEMPARAMS', description: 'System-wide parameters', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // Companies via Landmark REST API
    try {
      const companies = await this._readOData('lawson/v1', 'COMPANY');
      result.companies = companies;
      this._trackCoverage('COMPANY', 'extracted', { rowCount: companies.length });
    } catch (err) {
      this.logger.warn(`COMPANY read failed: ${err.message}`);
      result.companies = [];
      this._trackCoverage('COMPANY', 'failed', { error: err.message });
    }

    // Process Levels
    try {
      const processLevels = await this._readOData('lawson/v1', 'PROCESSLEVEL');
      result.processLevels = processLevels;
      this._trackCoverage('PROCESSLEVEL', 'extracted', { rowCount: processLevels.length });
    } catch (err) {
      this.logger.warn(`PROCESSLEVEL read failed: ${err.message}`);
      result.processLevels = [];
      this._trackCoverage('PROCESSLEVEL', 'failed', { error: err.message });
    }

    // Accounting Units
    try {
      const accountingUnits = await this._readOData('lawson/v1', 'ACCOUNTINGUNIT');
      result.accountingUnits = accountingUnits;
      this._trackCoverage('ACCOUNTINGUNIT', 'extracted', { rowCount: accountingUnits.length });
    } catch (err) {
      this.logger.warn(`ACCOUNTINGUNIT read failed: ${err.message}`);
      result.accountingUnits = [];
      this._trackCoverage('ACCOUNTINGUNIT', 'failed', { error: err.message });
    }

    // System Parameters
    try {
      const params = await this._readOData('lawson/v1', 'SYSTEMPARAMS');
      result.systemParameters = params;
      this._trackCoverage('SYSTEMPARAMS', 'extracted', { rowCount: params.length });
    } catch (err) {
      this.logger.warn(`SYSTEMPARAMS read failed: ${err.message}`);
      result.systemParameters = [];
      this._trackCoverage('SYSTEMPARAMS', 'failed', { error: err.message });
    }

    // Derive accounting string structure from system parameters
    result.accountingStringStructure = this._deriveAccountingStringStructure(result.systemParameters);

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/lawson/config.json');
    this._trackCoverage('COMPANY', 'extracted', { rowCount: mockData.companies.length });
    this._trackCoverage('PROCESSLEVEL', 'extracted', { rowCount: mockData.processLevels.length });
    this._trackCoverage('ACCOUNTINGUNIT', 'extracted', { rowCount: mockData.accountingUnits.length });
    this._trackCoverage('SYSTEMPARAMS', 'extracted', { rowCount: mockData.systemParameters.length });
    return mockData;
  }

  /**
   * Derive the accounting string structure from system parameters.
   * Lawson stores GL accounts as concatenated flat strings (e.g., "1-HQ-1000-00").
   */
  _deriveAccountingStringStructure(params) {
    const formatParam = (params || []).find(p => p.PARAMETER === 'ACCT_STRING_FORMAT');
    const format = formatParam ? formatParam.VALUE : 'CO-AU-ACCT-SUB';

    return {
      format,
      segments: [
        { segment: 'COMPANY', position: 1, description: 'Company number' },
        { segment: 'ACCT_UNIT', position: 2, description: 'Accounting unit' },
        { segment: 'ACCOUNT', position: 3, description: 'GL account number' },
        { segment: 'SUB_ACCOUNT', position: 4, description: 'Sub-account' },
      ],
      separator: '-',
    };
  }
}

LawsonConfigExtractor._extractorId = 'INFOR_LAWSON_CONFIG';
LawsonConfigExtractor._module = 'LAWSON_BASIS';
LawsonConfigExtractor._category = 'config';
LawsonConfigExtractor._sourceSystem = 'INFOR_LAWSON';
ExtractorRegistry.register(LawsonConfigExtractor);

module.exports = LawsonConfigExtractor;
