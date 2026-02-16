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
 * FI Master Data Extractor
 *
 * Extracts Financial Accounting master data: G/L accounts (chart and company
 * code level), customer master (general, company code, sales area, partner
 * functions), vendor master (general, company code, purchasing org), and
 * asset master (general, depreciation terms, values, time-dependent data).
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class FIMasterDataExtractor extends BaseExtractor {
  get extractorId() { return 'FI_MASTERDATA'; }
  get name() { return 'FI Master Data'; }
  get module() { return 'FI'; }
  get category() { return 'masterdata'; }

  getExpectedTables() {
    return [
      { table: 'SKA1', description: 'G/L account master (chart of accounts level)', critical: true },
      { table: 'SKAT', description: 'G/L account texts', critical: true },
      { table: 'SKB1', description: 'G/L account master (company code level)', critical: true },
      { table: 'KNA1', description: 'Customer master - general data', critical: true },
      { table: 'KNB1', description: 'Customer master - company code data', critical: true },
      { table: 'KNVV', description: 'Customer master - sales area data', critical: false },
      { table: 'KNVP', description: 'Customer master - partner functions', critical: false },
      { table: 'LFA1', description: 'Vendor master - general data', critical: true },
      { table: 'LFB1', description: 'Vendor master - company code data', critical: true },
      { table: 'LFM1', description: 'Vendor master - purchasing org data', critical: false },
      { table: 'ANLA', description: 'Asset master - general data', critical: true },
      { table: 'ANLB', description: 'Asset master - depreciation terms', critical: false },
      { table: 'ANLC', description: 'Asset master - values', critical: false },
      { table: 'ANLZ', description: 'Asset master - time-dependent data', critical: false },
    ];
  }

  async _extractLive() {
    const result = { glAccounts: {}, customers: {}, vendors: {}, assets: {} };

    // SKA1 - G/L Account Master (Chart of Accounts Level)
    try {
      const data = await this._readTable('SKA1', { fields: ['KTOPL', 'SAKNR', 'KTOKS', 'XBILK', 'GVTYP'] });
      result.glAccounts.chartLevel = data.rows;
    } catch (err) {
      this.logger.warn(`SKA1 read failed: ${err.message}`);
      result.glAccounts.chartLevel = [];
    }

    // SKAT - G/L Account Texts
    try {
      const data = await this._readTable('SKAT', { fields: ['SPRAS', 'KTOPL', 'SAKNR', 'TXT20', 'TXT50'] });
      result.glAccounts.chartTexts = data.rows;
    } catch (err) {
      this.logger.warn(`SKAT read failed: ${err.message}`);
      result.glAccounts.chartTexts = [];
    }

    // SKB1 - G/L Account Master (Company Code Level)
    try {
      const data = await this._readTable('SKB1', { fields: ['BUKRS', 'SAKNR', 'BEGRU', 'FDLEV', 'MITKZ'] });
      result.glAccounts.companyCodeLevel = data.rows;
    } catch (err) {
      this.logger.warn(`SKB1 read failed: ${err.message}`);
      result.glAccounts.companyCodeLevel = [];
    }

    // KNA1 - Customer Master General
    try {
      const data = await this._readTable('KNA1', { fields: ['KUNNR', 'NAME1', 'LAND1', 'ORT01', 'STRAS', 'PSTLZ', 'KTOKD'] });
      result.customers.general = data.rows;
    } catch (err) {
      this.logger.warn(`KNA1 read failed: ${err.message}`);
      result.customers.general = [];
    }

    // KNB1 - Customer Master Company Code
    try {
      const data = await this._readTable('KNB1', { fields: ['KUNNR', 'BUKRS', 'AKONT', 'ZUESSION', 'ZWELS'] });
      result.customers.companyCode = data.rows;
    } catch (err) {
      this.logger.warn(`KNB1 read failed: ${err.message}`);
      result.customers.companyCode = [];
    }

    // KNVV - Customer Master Sales Area
    try {
      const data = await this._readTable('KNVV', { fields: ['KUNNR', 'VKORG', 'VTWEG', 'SPART', 'KDGRP'] });
      result.customers.salesArea = data.rows;
    } catch (err) {
      this.logger.warn(`KNVV read failed: ${err.message}`);
      result.customers.salesArea = [];
    }

    // KNVP - Customer Master Partner Functions
    try {
      const data = await this._readTable('KNVP', { fields: ['KUNNR', 'VKORG', 'VTWEG', 'SPART', 'PARVW', 'KUNN2'] });
      result.customers.partnerFunctions = data.rows;
    } catch (err) {
      this.logger.warn(`KNVP read failed: ${err.message}`);
      result.customers.partnerFunctions = [];
    }

    // LFA1 - Vendor Master General
    try {
      const data = await this._readTable('LFA1', { fields: ['LIFNR', 'NAME1', 'LAND1', 'ORT01', 'STRAS', 'PSTLZ', 'KTOKK'] });
      result.vendors.general = data.rows;
    } catch (err) {
      this.logger.warn(`LFA1 read failed: ${err.message}`);
      result.vendors.general = [];
    }

    // LFB1 - Vendor Master Company Code
    try {
      const data = await this._readTable('LFB1', { fields: ['LIFNR', 'BUKRS', 'AKONT', 'ZUESSION', 'ZWELS'] });
      result.vendors.companyCode = data.rows;
    } catch (err) {
      this.logger.warn(`LFB1 read failed: ${err.message}`);
      result.vendors.companyCode = [];
    }

    // LFM1 - Vendor Master Purchasing Org
    try {
      const data = await this._readTable('LFM1', { fields: ['LIFNR', 'EKORG', 'WAERS', 'WEESSION'] });
      result.vendors.purchasingOrg = data.rows;
    } catch (err) {
      this.logger.warn(`LFM1 read failed: ${err.message}`);
      result.vendors.purchasingOrg = [];
    }

    // ANLA - Asset Master General
    try {
      const data = await this._readTable('ANLA', { fields: ['BUKRS', 'ANLN1', 'ANLN2', 'ANLKL', 'TXT50', 'AKTIV'] });
      result.assets.general = data.rows;
    } catch (err) {
      this.logger.warn(`ANLA read failed: ${err.message}`);
      result.assets.general = [];
    }

    // ANLB - Asset Master Depreciation Terms
    try {
      const data = await this._readTable('ANLB', { fields: ['BUKRS', 'ANLN1', 'ANLN2', 'AFESSION', 'NDJAR', 'AFESSION_NAME'] });
      result.assets.depreciation = data.rows;
    } catch (err) {
      this.logger.warn(`ANLB read failed: ${err.message}`);
      result.assets.depreciation = [];
    }

    // ANLC - Asset Master Values
    try {
      const data = await this._readTable('ANLC', { fields: ['BUKRS', 'ANLN1', 'ANLN2', 'AFESSION', 'GJAHR', 'KANSW', 'KNAFA'] });
      result.assets.values = data.rows;
    } catch (err) {
      this.logger.warn(`ANLC read failed: ${err.message}`);
      result.assets.values = [];
    }

    // ANLZ - Asset Master Time-Dependent Data
    try {
      const data = await this._readTable('ANLZ', { fields: ['BUKRS', 'ANLN1', 'ANLN2', 'KOSTL', 'GSBER', 'PRCTR'] });
      result.assets.timeDependent = data.rows;
    } catch (err) {
      this.logger.warn(`ANLZ read failed: ${err.message}`);
      result.assets.timeDependent = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/fi-masterdata.json');
    this._trackCoverage('SKA1', 'extracted', { rowCount: mockData.glAccounts.chartLevel.length });
    this._trackCoverage('SKAT', 'extracted', { rowCount: mockData.glAccounts.chartTexts.length });
    this._trackCoverage('SKB1', 'extracted', { rowCount: mockData.glAccounts.companyCodeLevel.length });
    this._trackCoverage('KNA1', 'extracted', { rowCount: mockData.customers.general.length });
    this._trackCoverage('KNB1', 'extracted', { rowCount: mockData.customers.companyCode.length });
    this._trackCoverage('KNVV', 'extracted', { rowCount: mockData.customers.salesArea.length });
    this._trackCoverage('KNVP', 'extracted', { rowCount: mockData.customers.partnerFunctions.length });
    this._trackCoverage('LFA1', 'extracted', { rowCount: mockData.vendors.general.length });
    this._trackCoverage('LFB1', 'extracted', { rowCount: mockData.vendors.companyCode.length });
    this._trackCoverage('LFM1', 'extracted', { rowCount: mockData.vendors.purchasingOrg.length });
    this._trackCoverage('ANLA', 'extracted', { rowCount: mockData.assets.general.length });
    this._trackCoverage('ANLB', 'extracted', { rowCount: mockData.assets.depreciation.length });
    this._trackCoverage('ANLC', 'extracted', { rowCount: mockData.assets.values.length });
    this._trackCoverage('ANLZ', 'extracted', { rowCount: mockData.assets.timeDependent.length });
    return mockData;
  }
}

FIMasterDataExtractor._extractorId = 'FI_MASTERDATA';
FIMasterDataExtractor._module = 'FI';
FIMasterDataExtractor._category = 'masterdata';
ExtractorRegistry.register(FIMasterDataExtractor);

module.exports = FIMasterDataExtractor;
