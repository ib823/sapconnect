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
 * PM Extractor
 *
 * Extracts Plant Maintenance data: equipment, functional locations,
 * maintenance plans, notifications, planning plants, and planner groups.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class PMExtractor extends BaseExtractor {
  get extractorId() { return 'PM_EXTRACTOR'; }
  get name() { return 'Plant Maintenance'; }
  get module() { return 'PM'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'EQUI', description: 'Equipment master', critical: true },
      { table: 'EQKT', description: 'Equipment short text', critical: true },
      { table: 'IFLOT', description: 'Functional location data', critical: true },
      { table: 'IFLOS', description: 'Functional location labels', critical: false },
      { table: 'IFLOTX', description: 'Functional location long text', critical: false },
      { table: 'MPLA', description: 'Maintenance plan header', critical: true },
      { table: 'MPOS', description: 'Maintenance plan items', critical: true },
      { table: 'QMIH', description: 'Maintenance notification header', critical: true },
      { table: 'T370', description: 'Planning plants for PM', critical: false },
      { table: 'T024I', description: 'Planner groups', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // Equipment master
    try {
      const equi = await this._readTable('EQUI', {
        fields: ['EQUNR', 'EQTYP', 'EQART', 'SWERK', 'STORT', 'TPLNR', 'INBDT', 'ERDAT'],
        maxRows: 10000,
      });
      const eqkt = await this._readTable('EQKT', {
        fields: ['EQUNR', 'EQKTX', 'SPRAS'],
        maxRows: 10000,
      });
      result.equipment = equi.rows.map(e => {
        const text = eqkt.rows.find(t => t.EQUNR === e.EQUNR && t.SPRAS === 'E');
        return { ...e, EQKTX: text ? text.EQKTX : '' };
      });
    } catch (err) {
      this.logger.warn(`EQUI/EQKT read failed: ${err.message}`);
      result.equipment = [];
    }

    // Functional locations
    try {
      const data = await this._readTable('IFLOT', {
        fields: ['TPLNR', 'FLTYP', 'SWERK', 'STORT', 'IWERK', 'ERDAT'],
        maxRows: 10000,
      });
      result.functionalLocations = data.rows;
    } catch (err) {
      this.logger.warn(`IFLOT read failed: ${err.message}`);
      result.functionalLocations = [];
    }

    // Maintenance plans
    try {
      const mpla = await this._readTable('MPLA', {
        fields: ['WARPL', 'ABESSION', 'AESSION_TXT', 'STRAT', 'SESSION'],
        maxRows: 5000,
      });
      result.maintenancePlans = mpla.rows;
    } catch (err) {
      this.logger.warn(`MPLA read failed: ${err.message}`);
      result.maintenancePlans = [];
    }

    // Maintenance notifications
    try {
      const data = await this._readTable('QMIH', {
        fields: ['QMNUM', 'QMART', 'EQUNR', 'TPLNR', 'SWERK', 'ERDAT', 'ERNAM', 'PRIESSION'],
        maxRows: 10000,
      });
      result.notifications = data.rows;
    } catch (err) {
      this.logger.warn(`QMIH read failed: ${err.message}`);
      result.notifications = [];
    }

    // Planning plants
    try {
      const data = await this._readTable('T370', {
        fields: ['IESSION', 'SWERK', 'IWERK'],
      });
      result.planningPlants = data.rows;
    } catch (err) {
      this._trackCoverage('T370', 'skipped', { reason: err.message });
      result.planningPlants = [];
    }

    // Planner groups
    try {
      const data = await this._readTable('T024I', {
        fields: ['IWERK', 'INGRP', 'INNAM'],
      });
      result.plannerGroups = data.rows;
    } catch (err) {
      this._trackCoverage('T024I', 'skipped', { reason: err.message });
      result.plannerGroups = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/pm-extractor.json');
    this._trackCoverage('EQUI', 'extracted', { rowCount: mockData.equipment.length });
    this._trackCoverage('EQKT', 'extracted', { rowCount: mockData.equipment.length });
    this._trackCoverage('IFLOT', 'extracted', { rowCount: mockData.functionalLocations.length });
    this._trackCoverage('MPLA', 'extracted', { rowCount: mockData.maintenancePlans.length });
    this._trackCoverage('QMIH', 'extracted', { rowCount: mockData.notifications.length });
    this._trackCoverage('T370', 'extracted', { rowCount: mockData.planningPlants.length });
    this._trackCoverage('T024I', 'extracted', { rowCount: mockData.plannerGroups.length });
    return mockData;
  }
}

PMExtractor._extractorId = 'PM_EXTRACTOR';
PMExtractor._module = 'PM';
PMExtractor._category = 'config';
ExtractorRegistry.register(PMExtractor);

module.exports = PMExtractor;
