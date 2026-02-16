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
 * GTS Extractor
 *
 * Extracts Global Trade Services configuration including customs products,
 * legal regulations, sanctioned parties, and preference processing.
 *
 * Note: GTS tables use the /SAPSLL/ namespace and may not exist in all
 * systems. Tables are marked as non-critical and will be skipped if not found.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class GTSExtractor extends BaseExtractor {
  get extractorId() { return 'GTS_EXTRACTOR'; }
  get name() { return 'Global Trade Services'; }
  get module() { return 'GTS'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: '/SAPSLL/TCDP', description: 'Customs products', critical: false },
      { table: '/SAPSLL/LEGL', description: 'Legal regulations', critical: false },
      { table: '/SAPSLL/SANCL', description: 'Sanctioned party lists', critical: false },
      { table: '/SAPSLL/PRFER', description: 'Preference processing', critical: false },
    ];
  }

  async _extractLive() {
    // Note: These tables may not exist in all systems.
    // Each table is wrapped individually and marked as skipped if not found.
    const result = {};

    // /SAPSLL/TCDP - Customs products
    try {
      const data = await this._readTable('/SAPSLL/TCDP', {
        fields: ['GUID', 'CNTRY', 'STAWN', 'DESCR', 'VALID_FROM', 'VALID_TO'],
      });
      result.customsProducts = data.rows;
    } catch (err) {
      this._trackCoverage('/SAPSLL/TCDP', 'skipped', { reason: err.message });
      result.customsProducts = [];
    }

    // /SAPSLL/LEGL - Legal regulations
    try {
      const data = await this._readTable('/SAPSLL/LEGL', {
        fields: ['GUID', 'LGREG', 'CNTRY', 'DESCR', 'ACTIVE', 'VALID_FROM'],
      });
      result.legalRegulations = data.rows;
    } catch (err) {
      this._trackCoverage('/SAPSLL/LEGL', 'skipped', { reason: err.message });
      result.legalRegulations = [];
    }

    // /SAPSLL/SANCL - Sanctioned party lists
    try {
      const data = await this._readTable('/SAPSLL/SANCL', {
        fields: ['GUID', 'LIST_TYPE', 'PARTY_NAME', 'CNTRY', 'STATUS', 'LAST_CHECK'],
      });
      result.sanctionedParties = data.rows;
    } catch (err) {
      this._trackCoverage('/SAPSLL/SANCL', 'skipped', { reason: err.message });
      result.sanctionedParties = [];
    }

    // /SAPSLL/PRFER - Preference processing
    try {
      const data = await this._readTable('/SAPSLL/PRFER', {
        fields: ['GUID', 'MATNR', 'CNTRY_FROM', 'CNTRY_TO', 'PREF_STATUS', 'VALID_FROM', 'VALID_TO'],
      });
      result.preferenceProcessing = data.rows;
    } catch (err) {
      this._trackCoverage('/SAPSLL/PRFER', 'skipped', { reason: err.message });
      result.preferenceProcessing = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/gts-data.json');
    this._trackCoverage('/SAPSLL/TCDP', 'extracted', { rowCount: mockData.customsProducts.length });
    this._trackCoverage('/SAPSLL/LEGL', 'extracted', { rowCount: mockData.legalRegulations.length });
    this._trackCoverage('/SAPSLL/SANCL', 'extracted', { rowCount: mockData.sanctionedParties.length });
    this._trackCoverage('/SAPSLL/PRFER', 'extracted', { rowCount: mockData.preferenceProcessing.length });
    return mockData;
  }
}

GTSExtractor._extractorId = 'GTS_EXTRACTOR';
GTSExtractor._module = 'GTS';
GTSExtractor._category = 'config';
ExtractorRegistry.register(GTSExtractor);

module.exports = GTSExtractor;
