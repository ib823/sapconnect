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
 * CO Configuration Extractor
 *
 * Extracts Controlling configuration: controlling areas (master, assignments,
 * settings), CO versions, allocation schemes, hierarchy sets (headers, nodes,
 * leaves), planning profiles, cost elements, cost centers, profit centers,
 * and internal orders.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class COConfigExtractor extends BaseExtractor {
  get extractorId() { return 'CO_CONFIG'; }
  get name() { return 'Controlling Configuration'; }
  get module() { return 'CO'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'TKA01', description: 'Controlling areas', critical: true },
      { table: 'TKA02', description: 'Controlling area assignments', critical: true },
      { table: 'TKA03', description: 'Controlling area settings', critical: false },
      { table: 'T811', description: 'CO versions', critical: true },
      { table: 'SETLEAF', description: 'Set hierarchy leaves', critical: false },
      { table: 'SETNODE', description: 'Set hierarchy nodes', critical: false },
      { table: 'SETHEADER', description: 'Set hierarchy headers', critical: false },
      { table: 'TKA50', description: 'Planning profiles', critical: false },
      { table: 'CSKA', description: 'Cost element master', critical: true },
      { table: 'CSKU', description: 'Cost element texts', critical: false },
      { table: 'CSKS', description: 'Cost center master', critical: true },
      { table: 'CSKT', description: 'Cost center texts', critical: false },
      { table: 'CEPC', description: 'Profit center master', critical: true },
      { table: 'CEPCT', description: 'Profit center texts', critical: false },
      { table: 'AUFK', description: 'Internal orders', critical: true },
    ];
  }

  async _extractLive() {
    const result = { controllingAreas: {}, hierarchySets: {}, costElements: {}, costCenters: {}, profitCenters: {} };

    // TKA01 - Controlling Areas
    try {
      const data = await this._readTable('TKA01', { fields: ['KOKRS', 'BEZEI', 'KTOPL', 'WAESSION', 'GSESSION'] });
      result.controllingAreas.master = data.rows;
    } catch (err) {
      this.logger.warn(`TKA01 read failed: ${err.message}`);
      result.controllingAreas.master = [];
    }

    // TKA02 - Controlling Area Assignments
    try {
      const data = await this._readTable('TKA02', { fields: ['KOKRS', 'BUKRS'] });
      result.controllingAreas.assignments = data.rows;
    } catch (err) {
      this.logger.warn(`TKA02 read failed: ${err.message}`);
      result.controllingAreas.assignments = [];
    }

    // TKA03 - Controlling Area Settings
    try {
      const data = await this._readTable('TKA03', { fields: ['KOKRS', 'VERSN', 'KSTAR_FROM', 'KSTAR_TO'] });
      result.controllingAreas.settings = data.rows;
    } catch (err) {
      this.logger.warn(`TKA03 read failed: ${err.message}`);
      result.controllingAreas.settings = [];
    }

    // T811 - CO Versions
    try {
      const data = await this._readTable('T811', { fields: ['KOKRS', 'VERSN', 'BEZEI', 'AKTIV'] });
      result.versions = data.rows;
    } catch (err) {
      this.logger.warn(`T811 read failed: ${err.message}`);
      result.versions = [];
    }

    // SETHEADER - Hierarchy Set Headers
    try {
      const data = await this._readTable('SETHEADER', { fields: ['SETCLASS', 'SUBCLASS', 'SETNAME', 'DESSION'] });
      result.hierarchySets.headers = data.rows;
    } catch (err) {
      this.logger.warn(`SETHEADER read failed: ${err.message}`);
      result.hierarchySets.headers = [];
    }

    // SETNODE - Hierarchy Set Nodes
    try {
      const data = await this._readTable('SETNODE', { fields: ['SETCLASS', 'SUBCLASS', 'SETNAME', 'SUBSETNAME', 'SEQNR'] });
      result.hierarchySets.nodes = data.rows;
    } catch (err) {
      this.logger.warn(`SETNODE read failed: ${err.message}`);
      result.hierarchySets.nodes = [];
    }

    // SETLEAF - Hierarchy Set Leaves
    try {
      const data = await this._readTable('SETLEAF', { fields: ['SETCLASS', 'SUBCLASS', 'SETNAME', 'VESSION_FROM', 'VESSION_TO', 'SEQNR'] });
      result.hierarchySets.leaves = data.rows;
    } catch (err) {
      this.logger.warn(`SETLEAF read failed: ${err.message}`);
      result.hierarchySets.leaves = [];
    }

    // TKA50 - Planning Profiles
    try {
      const data = await this._readTable('TKA50', { fields: ['KOKRS', 'PROFIL', 'DESCR', 'VERSN'] });
      result.planningProfiles = data.rows;
    } catch (err) {
      this.logger.warn(`TKA50 read failed: ${err.message}`);
      result.planningProfiles = [];
    }

    // CSKA - Cost Element Master
    try {
      const data = await this._readTable('CSKA', { fields: ['KTOPL', 'KSTAR', 'KATYP', 'DATBI'] });
      result.costElements.master = data.rows;
    } catch (err) {
      this.logger.warn(`CSKA read failed: ${err.message}`);
      result.costElements.master = [];
    }

    // CSKU - Cost Element Texts
    try {
      const data = await this._readTable('CSKU', { fields: ['SPRAS', 'KTOPL', 'KSTAR', 'KTEXT', 'LTEXT'] });
      result.costElements.texts = data.rows;
    } catch (err) {
      this.logger.warn(`CSKU read failed: ${err.message}`);
      result.costElements.texts = [];
    }

    // CSKS - Cost Center Master
    try {
      const data = await this._readTable('CSKS', { fields: ['KOKRS', 'KOSTL', 'DATBI', 'BUKRS', 'KOSAR', 'PRCTR', 'AESSION'] });
      result.costCenters.master = data.rows;
    } catch (err) {
      this.logger.warn(`CSKS read failed: ${err.message}`);
      result.costCenters.master = [];
    }

    // CSKT - Cost Center Texts
    try {
      const data = await this._readTable('CSKT', { fields: ['SPRAS', 'KOKRS', 'KOSTL', 'KTEXT', 'LTEXT'] });
      result.costCenters.texts = data.rows;
    } catch (err) {
      this.logger.warn(`CSKT read failed: ${err.message}`);
      result.costCenters.texts = [];
    }

    // CEPC - Profit Center Master
    try {
      const data = await this._readTable('CEPC', { fields: ['KOKRS', 'PRCTR', 'DATBI', 'BUKRS'] });
      result.profitCenters.master = data.rows;
    } catch (err) {
      this.logger.warn(`CEPC read failed: ${err.message}`);
      result.profitCenters.master = [];
    }

    // CEPCT - Profit Center Texts
    try {
      const data = await this._readTable('CEPCT', { fields: ['SPRAS', 'KOKRS', 'PRCTR', 'KTEXT', 'LTEXT'] });
      result.profitCenters.texts = data.rows;
    } catch (err) {
      this.logger.warn(`CEPCT read failed: ${err.message}`);
      result.profitCenters.texts = [];
    }

    // AUFK - Internal Orders
    try {
      const data = await this._readTable('AUFK', { fields: ['AUFNR', 'AUTYP', 'AUART', 'BUKRS', 'KOKRS', 'KTEXT', 'USER0', 'PRCTR'] });
      result.internalOrders = data.rows;
    } catch (err) {
      this.logger.warn(`AUFK read failed: ${err.message}`);
      result.internalOrders = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/co-config.json');
    this._trackCoverage('TKA01', 'extracted', { rowCount: mockData.controllingAreas.master.length });
    this._trackCoverage('TKA02', 'extracted', { rowCount: mockData.controllingAreas.assignments.length });
    this._trackCoverage('TKA03', 'extracted', { rowCount: mockData.controllingAreas.settings.length });
    this._trackCoverage('T811', 'extracted', { rowCount: mockData.versions.length });
    this._trackCoverage('SETHEADER', 'extracted', { rowCount: mockData.hierarchySets.headers.length });
    this._trackCoverage('SETNODE', 'extracted', { rowCount: mockData.hierarchySets.nodes.length });
    this._trackCoverage('SETLEAF', 'extracted', { rowCount: mockData.hierarchySets.leaves.length });
    this._trackCoverage('TKA50', 'extracted', { rowCount: mockData.planningProfiles.length });
    this._trackCoverage('CSKA', 'extracted', { rowCount: mockData.costElements.master.length });
    this._trackCoverage('CSKU', 'extracted', { rowCount: mockData.costElements.texts.length });
    this._trackCoverage('CSKS', 'extracted', { rowCount: mockData.costCenters.master.length });
    this._trackCoverage('CSKT', 'extracted', { rowCount: mockData.costCenters.texts.length });
    this._trackCoverage('CEPC', 'extracted', { rowCount: mockData.profitCenters.master.length });
    this._trackCoverage('CEPCT', 'extracted', { rowCount: mockData.profitCenters.texts.length });
    this._trackCoverage('AUFK', 'extracted', { rowCount: mockData.internalOrders.length });
    return mockData;
  }
}

COConfigExtractor._extractorId = 'CO_CONFIG';
COConfigExtractor._module = 'CO';
COConfigExtractor._category = 'config';
ExtractorRegistry.register(COConfigExtractor);

module.exports = COConfigExtractor;
