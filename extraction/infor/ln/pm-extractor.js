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
 * Infor LN Plant Maintenance Extractor
 *
 * Extracts PM data from Infor LN including equipment, functional locations,
 * maintenance schedules, and work orders.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNPMExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_PM'; }
  get name() { return 'Infor LN Plant Maintenance'; }
  get module() { return 'LN_PM'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'tiasc001', description: 'Equipment master', critical: true },
      { table: 'tiasc010', description: 'Functional locations', critical: true },
      { table: 'tsmsc100', description: 'Maintenance schedules', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // tiasc001 - Equipment master
    try {
      const data = await this._readTable('tiasc001', {
        fields: ['t$eqid', 't$desc', 't$type', 't$locn', 't$whno', 't$cpnb', 't$mfgr', 't$modl', 't$srnb', 't$indt', 't$stat', 't$crit'],
        maxRows: 50000,
      });
      result.equipment = data.rows;
    } catch (err) {
      this.logger.warn(`tiasc001 read failed: ${err.message}`);
      result.equipment = [];
    }

    // tiasc010 - Functional locations
    try {
      const data = await this._readTable('tiasc010', {
        fields: ['t$floc', 't$desc', 't$whno', 't$cpnb', 't$type', 't$prnt'],
        maxRows: 50000,
      });
      result.functionalLocations = data.rows;
    } catch (err) {
      this.logger.warn(`tiasc010 read failed: ${err.message}`);
      result.functionalLocations = [];
    }

    // tsmsc100 - Maintenance schedules
    try {
      const data = await this._readTable('tsmsc100', {
        fields: ['t$msid', 't$eqid', 't$desc', 't$freq', 't$dura', 't$cuni', 't$last', 't$next', 't$stat'],
        maxRows: 50000,
      });
      result.maintenanceSchedules = data.rows;
    } catch (err) {
      this._trackCoverage('tsmsc100', 'skipped', { reason: err.message });
      result.maintenanceSchedules = [];
    }

    // Compute summary
    result.summary = this._computeSummary(result);

    return result;
  }

  _computeSummary(result) {
    const equipment = result.equipment || [];
    const active = equipment.filter(e => e.t$stat === 'ACT').length;
    const maintenance = equipment.filter(e => e.t$stat === 'MNT').length;
    const critA = equipment.filter(e => e.t$crit === 'A').length;
    const critB = equipment.filter(e => e.t$crit === 'B').length;
    const critC = equipment.filter(e => e.t$crit === 'C').length;

    return {
      totalEquipment: equipment.length,
      activeEquipment: active,
      maintenanceEquipment: maintenance,
      functionalLocations: (result.functionalLocations || []).length,
      maintenanceSchedules: (result.maintenanceSchedules || []).length,
      criticalityA: critA,
      criticalityB: critB,
      criticalityC: critC,
      extractedAt: new Date().toISOString(),
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/pm.json');
    this._trackCoverage('tiasc001', 'extracted', { rowCount: mockData.equipment.length });
    this._trackCoverage('tiasc010', 'extracted', { rowCount: mockData.functionalLocations.length });
    this._trackCoverage('tsmsc100', 'extracted', { rowCount: mockData.maintenanceSchedules.length });
    return mockData;
  }
}

InforLNPMExtractor._extractorId = 'INFOR_LN_PM';
InforLNPMExtractor._module = 'LN_PM';
InforLNPMExtractor._category = 'master-data';
InforLNPMExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNPMExtractor);

module.exports = InforLNPMExtractor;
