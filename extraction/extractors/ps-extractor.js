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
 * PS Extractor
 *
 * Extracts Project System configuration including project definitions,
 * WBS elements, hierarchy, orders, budgets, and status management.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class PSExtractor extends BaseExtractor {
  get extractorId() { return 'PS_EXTRACTOR'; }
  get name() { return 'Project System'; }
  get module() { return 'PS'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'PROJ', description: 'Project definitions', critical: true },
      { table: 'PRPS', description: 'WBS elements', critical: true },
      { table: 'PRHI', description: 'WBS hierarchy', critical: true },
      { table: 'AUFK', description: 'PS orders', critical: true },
      { table: 'BPGE', description: 'Budget line items', critical: false },
      { table: 'JEST', description: 'System status', critical: false },
      { table: 'JSTO', description: 'Status object', critical: false },
      { table: 'TJ30', description: 'Status profiles', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // PROJ - Project definitions
    try {
      const data = await this._readTable('PROJ', {
        fields: ['PSPNR', 'PSPID', 'POST1', 'OBJNR', 'PLFAZ', 'PLSEZ', 'VERNR', 'BUKRS', 'VBUKR'],
      });
      result.projects = data.rows;
    } catch (err) {
      this.logger.warn(`PROJ read failed: ${err.message}`);
      result.projects = [];
    }

    // PRPS - WBS elements
    try {
      const data = await this._readTable('PRPS', {
        fields: ['PSPNR', 'POSID', 'POST1', 'OBJNR', 'PSPHI', 'STUFE', 'BELKZ', 'FAKKZ', 'PKOKR'],
      });
      result.wbsElements = data.rows;
    } catch (err) {
      this.logger.warn(`PRPS read failed: ${err.message}`);
      result.wbsElements = [];
    }

    // PRHI - WBS hierarchy
    try {
      const data = await this._readTable('PRHI', {
        fields: ['POSNR', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'REFNR'],
      });
      result.wbsHierarchy = data.rows;
    } catch (err) {
      this.logger.warn(`PRHI read failed: ${err.message}`);
      result.wbsHierarchy = [];
    }

    // AUFK - PS orders
    try {
      const data = await this._readTable('AUFK', {
        fields: ['AUFNR', 'AUART', 'AUTYP', 'KTEXT', 'BUKRS', 'WERKS', 'OBJNR', 'PSPEL'],
      });
      result.psOrders = data.rows;
    } catch (err) {
      this.logger.warn(`AUFK read failed: ${err.message}`);
      result.psOrders = [];
    }

    // BPGE - Budget line items
    try {
      const data = await this._readTable('BPGE', {
        fields: ['OBJNR', 'GJAHR', 'WRTTP', 'VORGA', 'WLGES', 'WTGES'],
      });
      result.budgets = data.rows;
    } catch (err) {
      this._trackCoverage('BPGE', 'skipped', { reason: err.message });
      result.budgets = [];
    }

    // JEST - System status
    try {
      const data = await this._readTable('JEST', {
        fields: ['OBJNR', 'STAT', 'INACT', 'CHGNR'],
      });
      result.systemStatus = data.rows;
    } catch (err) {
      this._trackCoverage('JEST', 'skipped', { reason: err.message });
      result.systemStatus = [];
    }

    // JSTO - Status object
    try {
      const data = await this._readTable('JSTO', {
        fields: ['OBJNR', 'OBTYP', 'STSMA', 'CHGNR'],
      });
      result.userStatus = data.rows;
    } catch (err) {
      this._trackCoverage('JSTO', 'skipped', { reason: err.message });
      result.userStatus = [];
    }

    // TJ30 - Status profiles
    try {
      const data = await this._readTable('TJ30', {
        fields: ['STSMA', 'ESTAT', 'STONR', 'TXT04', 'TXT30'],
      });
      result.statusProfiles = data.rows;
    } catch (err) {
      this._trackCoverage('TJ30', 'skipped', { reason: err.message });
      result.statusProfiles = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/ps-data.json');
    this._trackCoverage('PROJ', 'extracted', { rowCount: mockData.projects.length });
    this._trackCoverage('PRPS', 'extracted', { rowCount: mockData.wbsElements.length });
    this._trackCoverage('PRHI', 'extracted', { rowCount: mockData.wbsHierarchy.length });
    this._trackCoverage('AUFK', 'extracted', { rowCount: mockData.psOrders.length });
    this._trackCoverage('BPGE', 'extracted', { rowCount: mockData.budgets.length });
    this._trackCoverage('JEST', 'extracted', { rowCount: mockData.systemStatus.length });
    this._trackCoverage('JSTO', 'extracted', { rowCount: mockData.userStatus.length });
    this._trackCoverage('TJ30', 'extracted', { rowCount: mockData.statusProfiles.length });
    return mockData;
  }
}

PSExtractor._extractorId = 'PS_EXTRACTOR';
PSExtractor._module = 'PS';
PSExtractor._category = 'config';
ExtractorRegistry.register(PSExtractor);

module.exports = PSExtractor;
