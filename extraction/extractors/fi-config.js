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
 * FI Configuration Extractor
 *
 * Extracts Financial Accounting configuration: company codes, document types,
 * charts of accounts, posting keys, account determination, payment config,
 * tax codes, countries, credit control areas, banks, asset classes,
 * depreciation areas, business areas, ledger config, and document splitting.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class FIConfigExtractor extends BaseExtractor {
  get extractorId() { return 'FI_CONFIG'; }
  get name() { return 'Financial Accounting Configuration'; }
  get module() { return 'FI'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'T001', description: 'Company codes', critical: true },
      { table: 'T001B', description: 'Company code details (permitted posting periods)', critical: false },
      { table: 'T001E', description: 'Company code currency settings', critical: false },
      { table: 'T003', description: 'Document types', critical: true },
      { table: 'T003T', description: 'Document type texts', critical: false },
      { table: 'T004', description: 'Charts of accounts', critical: true },
      { table: 'T004T', description: 'Charts of accounts texts', critical: false },
      { table: 'TBSL', description: 'Posting keys', critical: true },
      { table: 'TBSLT', description: 'Posting key texts', critical: false },
      { table: 'T030', description: 'Account determination', critical: true },
      { table: 'T042', description: 'Payment configuration', critical: false },
      { table: 'T007A', description: 'Tax codes', critical: true },
      { table: 'T007B', description: 'Tax code details', critical: false },
      { table: 'T005', description: 'Countries', critical: true },
      { table: 'T014', description: 'Credit control areas', critical: false },
      { table: 'BNKA', description: 'Bank master records', critical: false },
      { table: 'T880', description: 'Consolidation units / trading partners', critical: false },
      { table: 'TGSB', description: 'Business areas', critical: false },
      { table: 'TGSBT', description: 'Business area texts', critical: false },
      { table: 'TBA01', description: 'Asset classes', critical: false },
      { table: 'T090', description: 'Depreciation areas', critical: false },
      { table: 'TABWA', description: 'Tolerance groups', critical: false },
      { table: 'FAGL_SPLINFO', description: 'Document splitting configuration', critical: false },
      { table: 'FINSC_LEDGER', description: 'Ledger configuration', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // T001 - Company Codes
    try {
      const data = await this._readTable('T001', { fields: ['BUKRS', 'BUTXT', 'ORT01', 'LAND1', 'WAERS', 'KTOPL', 'PERIV'] });
      result.companyCodes = data.rows;
    } catch (err) {
      this.logger.warn(`T001 read failed: ${err.message}`);
      result.companyCodes = [];
    }

    // T001B - Company Code Details
    try {
      const data = await this._readTable('T001B', { fields: ['BUKRS', 'GSBER', 'BKONT'] });
      result.companyCodeDetails = data.rows;
    } catch (err) {
      this.logger.warn(`T001B read failed: ${err.message}`);
      result.companyCodeDetails = [];
    }

    // T001E - Company Code Currencies
    try {
      const data = await this._readTable('T001E', { fields: ['BUKRS', 'WAERS'] });
      result.companyCodeCurrencies = data.rows;
    } catch (err) {
      this.logger.warn(`T001E read failed: ${err.message}`);
      result.companyCodeCurrencies = [];
    }

    // T003 - Document Types
    try {
      const data = await this._readTable('T003', { fields: ['BLART', 'BLTYP'] });
      result.documentTypes = data.rows;
    } catch (err) {
      this.logger.warn(`T003 read failed: ${err.message}`);
      result.documentTypes = [];
    }

    // T003T - Document Type Texts
    try {
      const data = await this._readTable('T003T', { fields: ['BLART', 'LTEXT'] });
      result.documentTypeTexts = data.rows;
    } catch (err) {
      this.logger.warn(`T003T read failed: ${err.message}`);
      result.documentTypeTexts = [];
    }

    // T004 - Charts of Accounts
    try {
      const data = await this._readTable('T004', { fields: ['KTOPL', 'KTPLT'] });
      result.chartsOfAccounts = data.rows;
    } catch (err) {
      this.logger.warn(`T004 read failed: ${err.message}`);
      result.chartsOfAccounts = [];
    }

    // T004T - Charts of Accounts Texts
    try {
      const data = await this._readTable('T004T', { fields: ['KTOPL', 'SPRAS', 'KTPLT'] });
      result.chartsOfAccountsTexts = data.rows;
    } catch (err) {
      this.logger.warn(`T004T read failed: ${err.message}`);
      result.chartsOfAccountsTexts = [];
    }

    // TBSL - Posting Keys
    try {
      const data = await this._readTable('TBSL', { fields: ['BSCHL', 'KOART', 'SHKZG', 'XSONU'] });
      result.postingKeys = data.rows;
    } catch (err) {
      this.logger.warn(`TBSL read failed: ${err.message}`);
      result.postingKeys = [];
    }

    // TBSLT - Posting Key Texts
    try {
      const data = await this._readTable('TBSLT', { fields: ['BSCHL', 'LTEXT'] });
      result.postingKeyTexts = data.rows;
    } catch (err) {
      this.logger.warn(`TBSLT read failed: ${err.message}`);
      result.postingKeyTexts = [];
    }

    // T030 - Account Determination
    try {
      const data = await this._readTable('T030', { fields: ['KTOPL', 'KTOSL', 'HKONT'] });
      result.accountDetermination = data.rows;
    } catch (err) {
      this.logger.warn(`T030 read failed: ${err.message}`);
      result.accountDetermination = [];
    }

    // T042 - Payment Configuration
    try {
      const data = await this._readTable('T042', { fields: ['ZBUKR', 'RZAWE', 'TEXT1'] });
      result.paymentConfig = data.rows;
    } catch (err) {
      this.logger.warn(`T042 read failed: ${err.message}`);
      result.paymentConfig = [];
    }

    // T007A - Tax Codes
    try {
      const data = await this._readTable('T007A', { fields: ['KALSM', 'MWSKZ', 'TEXT1'] });
      result.taxCodes = data.rows;
    } catch (err) {
      this.logger.warn(`T007A read failed: ${err.message}`);
      result.taxCodes = [];
    }

    // T007B - Tax Code Details
    try {
      const data = await this._readTable('T007B', { fields: ['KALSM', 'MWSKZ', 'KSCHL', 'KBETR'] });
      result.taxCodeDetails = data.rows;
    } catch (err) {
      this.logger.warn(`T007B read failed: ${err.message}`);
      result.taxCodeDetails = [];
    }

    // T005 - Countries
    try {
      const data = await this._readTable('T005', { fields: ['LAND1', 'LANDX', 'WAESSION'] });
      result.countries = data.rows;
    } catch (err) {
      this.logger.warn(`T005 read failed: ${err.message}`);
      result.countries = [];
    }

    // T014 - Credit Control Areas
    try {
      const data = await this._readTable('T014', { fields: ['KKBER', 'KKBTX', 'BUKRS', 'WAESSION'] });
      result.creditControlAreas = data.rows;
    } catch (err) {
      this.logger.warn(`T014 read failed: ${err.message}`);
      result.creditControlAreas = [];
    }

    // BNKA - Bank Master
    try {
      const data = await this._readTable('BNKA', { fields: ['BANKS', 'BANKL', 'BANKA', 'STRAS', 'ORT01'] });
      result.banks = data.rows;
    } catch (err) {
      this.logger.warn(`BNKA read failed: ${err.message}`);
      result.banks = [];
    }

    // T880 - Consolidation Units
    try {
      const data = await this._readTable('T880', { fields: ['RCOMP', 'RTEXT'] });
      result.consolidationUnits = data.rows;
    } catch (err) {
      this.logger.warn(`T880 read failed: ${err.message}`);
      result.consolidationUnits = [];
    }

    // TGSB - Business Areas
    try {
      const data = await this._readTable('TGSB', { fields: ['GSBER', 'GTEXT'] });
      result.businessAreas = data.rows;
    } catch (err) {
      this.logger.warn(`TGSB read failed: ${err.message}`);
      result.businessAreas = [];
    }

    // TGSBT - Business Area Texts
    try {
      const data = await this._readTable('TGSBT', { fields: ['GSBER', 'SPRAS', 'GTEXT'] });
      result.businessAreaTexts = data.rows;
    } catch (err) {
      this.logger.warn(`TGSBT read failed: ${err.message}`);
      result.businessAreaTexts = [];
    }

    // TBA01 - Asset Classes
    try {
      const data = await this._readTable('TBA01', { fields: ['ANLKL', 'KTGRU', 'AFESSION'] });
      result.assetClasses = data.rows;
    } catch (err) {
      this.logger.warn(`TBA01 read failed: ${err.message}`);
      result.assetClasses = [];
    }

    // T090 - Depreciation Areas
    try {
      const data = await this._readTable('T090', { fields: ['AFESSION', 'AFESSION_TXT'] });
      result.depreciationAreas = data.rows;
    } catch (err) {
      this.logger.warn(`T090 read failed: ${err.message}`);
      result.depreciationAreas = [];
    }

    // TABWA - Tolerance Groups
    try {
      const data = await this._readTable('TABWA', { fields: ['BUKRS', 'HTEFH', 'HTEFS'] });
      result.toleranceGroups = data.rows;
    } catch (err) {
      this.logger.warn(`TABWA read failed: ${err.message}`);
      result.toleranceGroups = [];
    }

    // FAGL_SPLINFO - Document Splitting
    try {
      const data = await this._readTable('FAGL_SPLINFO', { fields: ['SPLIT_FIELD', 'SPLIT_ACTIVE', 'INHERITANCE'] });
      result.documentSplitting = data.rows;
    } catch (err) {
      this.logger.warn(`FAGL_SPLINFO read failed: ${err.message}`);
      result.documentSplitting = [];
    }

    // FINSC_LEDGER - Ledger Configuration
    try {
      const data = await this._readTable('FINSC_LEDGER', { fields: ['RLDNR', 'NAME', 'GCURR', 'LEDGER_TYPE'] });
      result.ledgerConfig = data.rows;
    } catch (err) {
      this.logger.warn(`FINSC_LEDGER read failed: ${err.message}`);
      result.ledgerConfig = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/fi-config.json');
    this._trackCoverage('T001', 'extracted', { rowCount: mockData.companyCodes.length });
    this._trackCoverage('T001B', 'extracted', { rowCount: mockData.companyCodeDetails.length });
    this._trackCoverage('T001E', 'extracted', { rowCount: mockData.companyCodeCurrencies.length });
    this._trackCoverage('T003', 'extracted', { rowCount: mockData.documentTypes.length });
    this._trackCoverage('T003T', 'extracted', { rowCount: mockData.documentTypeTexts.length });
    this._trackCoverage('T004', 'extracted', { rowCount: mockData.chartsOfAccounts.length });
    this._trackCoverage('T004T', 'extracted', { rowCount: mockData.chartsOfAccountsTexts.length });
    this._trackCoverage('TBSL', 'extracted', { rowCount: mockData.postingKeys.length });
    this._trackCoverage('TBSLT', 'extracted', { rowCount: mockData.postingKeyTexts.length });
    this._trackCoverage('T030', 'extracted', { rowCount: mockData.accountDetermination.length });
    this._trackCoverage('T042', 'extracted', { rowCount: mockData.paymentConfig.length });
    this._trackCoverage('T007A', 'extracted', { rowCount: mockData.taxCodes.length });
    this._trackCoverage('T007B', 'extracted', { rowCount: mockData.taxCodeDetails.length });
    this._trackCoverage('T005', 'extracted', { rowCount: mockData.countries.length });
    this._trackCoverage('T014', 'extracted', { rowCount: mockData.creditControlAreas.length });
    this._trackCoverage('BNKA', 'extracted', { rowCount: mockData.banks.length });
    this._trackCoverage('T880', 'extracted', { rowCount: mockData.consolidationUnits.length });
    this._trackCoverage('TGSB', 'extracted', { rowCount: mockData.businessAreas.length });
    this._trackCoverage('TGSBT', 'extracted', { rowCount: mockData.businessAreaTexts.length });
    this._trackCoverage('TBA01', 'extracted', { rowCount: mockData.assetClasses.length });
    this._trackCoverage('T090', 'extracted', { rowCount: mockData.depreciationAreas.length });
    this._trackCoverage('TABWA', 'extracted', { rowCount: mockData.toleranceGroups.length });
    this._trackCoverage('FAGL_SPLINFO', 'extracted', { rowCount: mockData.documentSplitting.length });
    this._trackCoverage('FINSC_LEDGER', 'extracted', { rowCount: mockData.ledgerConfig.length });
    return mockData;
  }
}

FIConfigExtractor._extractorId = 'FI_CONFIG';
FIConfigExtractor._module = 'FI';
FIConfigExtractor._category = 'config';
ExtractorRegistry.register(FIConfigExtractor);

module.exports = FIConfigExtractor;
