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
 * SD Configuration Extractor
 *
 * Extracts Sales & Distribution configuration: sales organizations,
 * distribution channels, divisions, sales document types, delivery types,
 * billing types, item categories, schedule line categories, pricing
 * procedures, and condition types.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class SDConfigExtractor extends BaseExtractor {
  get extractorId() { return 'SD_CONFIG'; }
  get name() { return 'Sales & Distribution Configuration'; }
  get module() { return 'SD'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'TVKO', description: 'Sales organizations', critical: true },
      { table: 'TVTW', description: 'Distribution channels', critical: true },
      { table: 'TSPA', description: 'Divisions', critical: true },
      { table: 'TVAK', description: 'Sales document types', critical: true },
      { table: 'TVLK', description: 'Delivery types', critical: true },
      { table: 'TVFK', description: 'Billing types', critical: true },
      { table: 'TVAP', description: 'Item categories', critical: false },
      { table: 'TVEP', description: 'Schedule line categories', critical: false },
      { table: 'T683', description: 'Pricing procedures', critical: false },
      { table: 'T683V', description: 'Pricing procedure assignment', critical: false },
      { table: 'T685', description: 'Condition types', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // Sales organizations
    try {
      const data = await this._readTable('TVKO', { fields: ['VKORG', 'WAESSION', 'BUKRS', 'ADRNR'] });
      result.salesOrgs = data.rows;
    } catch (err) {
      this.logger.warn(`TVKO read failed: ${err.message}`);
      result.salesOrgs = [];
    }

    // Distribution channels
    try {
      const data = await this._readTable('TVTW', { fields: ['VTWEG', 'VTEXT'] });
      result.distributionChannels = data.rows;
    } catch (err) {
      this.logger.warn(`TVTW read failed: ${err.message}`);
      result.distributionChannels = [];
    }

    // Divisions
    try {
      const data = await this._readTable('TSPA', { fields: ['SPART', 'VTEXT'] });
      result.divisions = data.rows;
    } catch (err) {
      this.logger.warn(`TSPA read failed: ${err.message}`);
      result.divisions = [];
    }

    // Sales document types
    try {
      const data = await this._readTable('TVAK', { fields: ['AUART', 'BEZEI', 'VBTYP', 'NUMKI'] });
      result.salesDocTypes = data.rows;
    } catch (err) {
      this.logger.warn(`TVAK read failed: ${err.message}`);
      result.salesDocTypes = [];
    }

    // Delivery types
    try {
      const data = await this._readTable('TVLK', { fields: ['LFART', 'VTEXT', 'LDEST'] });
      result.deliveryTypes = data.rows;
    } catch (err) {
      this.logger.warn(`TVLK read failed: ${err.message}`);
      result.deliveryTypes = [];
    }

    // Billing types
    try {
      const data = await this._readTable('TVFK', { fields: ['FKART', 'VTEXT', 'FKTYP'] });
      result.billingTypes = data.rows;
    } catch (err) {
      this.logger.warn(`TVFK read failed: ${err.message}`);
      result.billingTypes = [];
    }

    // Item categories
    try {
      const data = await this._readTable('TVAP', { fields: ['PSTYV', 'VTEXT'] });
      result.itemCategories = data.rows;
    } catch (err) {
      this._trackCoverage('TVAP', 'skipped', { reason: err.message });
      result.itemCategories = [];
    }

    // Schedule line categories
    try {
      const data = await this._readTable('TVEP', { fields: ['ETTYP', 'VTEXT', 'ETEFM'] });
      result.scheduleLineCategories = data.rows;
    } catch (err) {
      this._trackCoverage('TVEP', 'skipped', { reason: err.message });
      result.scheduleLineCategories = [];
    }

    // Pricing procedures
    try {
      const data = await this._readTable('T683', { fields: ['KALSM', 'VTEXT'] });
      result.pricingProcedures = data.rows;
    } catch (err) {
      this._trackCoverage('T683', 'skipped', { reason: err.message });
      result.pricingProcedures = [];
    }

    // Condition types
    try {
      const data = await this._readTable('T685', { fields: ['KSCHL', 'VTEXT', 'KOPTS', 'KOTYP'] });
      result.conditionTypes = data.rows;
    } catch (err) {
      this._trackCoverage('T685', 'skipped', { reason: err.message });
      result.conditionTypes = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/sd-config.json');
    this._trackCoverage('TVKO', 'extracted', { rowCount: mockData.salesOrgs.length });
    this._trackCoverage('TVTW', 'extracted', { rowCount: mockData.distributionChannels.length });
    this._trackCoverage('TSPA', 'extracted', { rowCount: mockData.divisions.length });
    this._trackCoverage('TVAK', 'extracted', { rowCount: mockData.salesDocTypes.length });
    this._trackCoverage('TVLK', 'extracted', { rowCount: mockData.deliveryTypes.length });
    this._trackCoverage('TVFK', 'extracted', { rowCount: mockData.billingTypes.length });
    this._trackCoverage('TVAP', 'extracted', { rowCount: mockData.itemCategories.length });
    this._trackCoverage('TVEP', 'extracted', { rowCount: mockData.scheduleLineCategories.length });
    this._trackCoverage('T683', 'extracted', { rowCount: mockData.pricingProcedures.length });
    this._trackCoverage('T685', 'extracted', { rowCount: mockData.conditionTypes.length });
    return mockData;
  }
}

SDConfigExtractor._extractorId = 'SD_CONFIG';
SDConfigExtractor._module = 'SD';
SDConfigExtractor._category = 'config';
ExtractorRegistry.register(SDConfigExtractor);

module.exports = SDConfigExtractor;
