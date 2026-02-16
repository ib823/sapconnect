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
 * PP Master Data Extractor
 *
 * Extracts Production Planning master data: BOM links, BOM headers,
 * BOM items, routing headers, routing operations, work centers,
 * and task list assignments.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class PPMasterdataExtractor extends BaseExtractor {
  get extractorId() { return 'PP_MASTERDATA'; }
  get name() { return 'PP Master Data'; }
  get module() { return 'PP'; }
  get category() { return 'masterdata'; }

  getExpectedTables() {
    return [
      { table: 'MAST', description: 'Material to BOM link', critical: true },
      { table: 'STKO', description: 'BOM header', critical: true },
      { table: 'STPO', description: 'BOM item', critical: true },
      { table: 'PLKO', description: 'Routing header', critical: true },
      { table: 'PLPO', description: 'Routing operation', critical: true },
      { table: 'CRHD', description: 'Work center header', critical: true },
      { table: 'CRHS', description: 'Work center hierarchy', critical: false },
      { table: 'MAPL', description: 'Task list assignment to material', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // BOM links
    try {
      const data = await this._readTable('MAST', {
        fields: ['MATNR', 'WERKS', 'STLAN', 'STLNR', 'STLAL'],
        maxRows: 10000,
      });
      result.bomLinks = data.rows;
    } catch (err) {
      this.logger.warn(`MAST read failed: ${err.message}`);
      result.bomLinks = [];
    }

    // BOM headers
    try {
      const data = await this._readTable('STKO', {
        fields: ['STLNR', 'STLAL', 'STTXT', 'BMENG', 'BMEIN', 'STLST', 'DATEFROM'],
        maxRows: 10000,
      });
      result.bomHeaders = data.rows;
    } catch (err) {
      this.logger.warn(`STKO read failed: ${err.message}`);
      result.bomHeaders = [];
    }

    // BOM items
    try {
      const data = await this._readTable('STPO', {
        fields: ['STLNR', 'STLKN', 'IDNRK', 'MENGE', 'MEINS', 'POSTP', 'AUSCH'],
        maxRows: 20000,
      });
      result.bomItems = data.rows;
    } catch (err) {
      this.logger.warn(`STPO read failed: ${err.message}`);
      result.bomItems = [];
    }

    // Routing headers
    try {
      const data = await this._readTable('PLKO', {
        fields: ['PLNTY', 'PLNNR', 'PLNAL', 'LOESSION', 'WERKS', 'VERWE', 'STATU'],
        maxRows: 10000,
      });
      result.routingHeaders = data.rows;
    } catch (err) {
      this.logger.warn(`PLKO read failed: ${err.message}`);
      result.routingHeaders = [];
    }

    // Routing operations
    try {
      const data = await this._readTable('PLPO', {
        fields: ['PLNTY', 'PLNNR', 'PLNAL', 'VORNR', 'ARBID', 'STEUS', 'VGW01', 'VGE01'],
        maxRows: 20000,
      });
      result.routingOperations = data.rows;
    } catch (err) {
      this.logger.warn(`PLPO read failed: ${err.message}`);
      result.routingOperations = [];
    }

    // Work centers
    try {
      const data = await this._readTable('CRHD', {
        fields: ['OBJID', 'OBJTY', 'ARBPL', 'WERKS', 'VERWE'],
        maxRows: 5000,
      });
      result.workCenters = data.rows;
    } catch (err) {
      this.logger.warn(`CRHD read failed: ${err.message}`);
      result.workCenters = [];
    }

    // Task list assignments
    try {
      const data = await this._readTable('MAPL', {
        fields: ['MATNR', 'WERKS', 'PLNTY', 'PLNNR', 'PLNAL', 'ZKESSION'],
        maxRows: 10000,
      });
      result.taskListAssignments = data.rows;
    } catch (err) {
      this._trackCoverage('MAPL', 'skipped', { reason: err.message });
      result.taskListAssignments = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/pp-masterdata.json');
    this._trackCoverage('MAST', 'extracted', { rowCount: mockData.bomLinks.length });
    this._trackCoverage('STKO', 'extracted', { rowCount: mockData.bomHeaders.length });
    this._trackCoverage('STPO', 'extracted', { rowCount: mockData.bomItems.length });
    this._trackCoverage('PLKO', 'extracted', { rowCount: mockData.routingHeaders.length });
    this._trackCoverage('PLPO', 'extracted', { rowCount: mockData.routingOperations.length });
    this._trackCoverage('CRHD', 'extracted', { rowCount: mockData.workCenters.length });
    this._trackCoverage('MAPL', 'extracted', { rowCount: mockData.taskListAssignments.length });
    return mockData;
  }
}

PPMasterdataExtractor._extractorId = 'PP_MASTERDATA';
PPMasterdataExtractor._module = 'PP';
PPMasterdataExtractor._category = 'masterdata';
ExtractorRegistry.register(PPMasterdataExtractor);

module.exports = PPMasterdataExtractor;
