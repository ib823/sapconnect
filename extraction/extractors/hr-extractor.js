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
 * HR Extractor
 *
 * Extracts Human Resources configuration and master data including
 * organizational assignment, personal data, payroll, and org management.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class HRExtractor extends BaseExtractor {
  get extractorId() { return 'HR_EXTRACTOR'; }
  get name() { return 'Human Resources'; }
  get module() { return 'HR'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'PA0001', description: 'Organizational assignment', critical: true },
      { table: 'PA0002', description: 'Personal data', critical: true },
      { table: 'PA0006', description: 'Addresses', critical: false },
      { table: 'PA0008', description: 'Basic pay', critical: true },
      { table: 'PA0014', description: 'Recurring payments/deductions', critical: false },
      { table: 'PA0015', description: 'Additional payments', critical: false },
      { table: 'HRP1000', description: 'Org management - objects', critical: true },
      { table: 'HRP1001', description: 'Org management - relationships', critical: true },
      { table: 'T500P', description: 'Personnel areas', critical: false },
      { table: 'T001P', description: 'Personnel subareas', critical: false },
      { table: 'T503', description: 'Employee groups', critical: false },
      { table: 'T510', description: 'Pay scale areas', critical: false },
    ];
  }

  async _extractLive() {
    // NOTE: HR data contains sensitive PII. In production, anonymization
    // should be applied before storing extraction results. Consider masking
    // names, addresses, bank details, and other personal identifiers.
    const result = {};

    // PA0001 - Organizational assignment
    try {
      const data = await this._readTable('PA0001', {
        fields: ['PERNR', 'BEGDA', 'ENDDA', 'BUKRS', 'WERKS', 'BTRTL', 'PERSG', 'PERSK', 'ORGEH', 'STELL', 'PLANS'],
      });
      result.orgAssignment = data.rows;
    } catch (err) {
      this.logger.warn(`PA0001 read failed: ${err.message}`);
      result.orgAssignment = [];
    }

    // PA0002 - Personal data
    try {
      const data = await this._readTable('PA0002', {
        fields: ['PERNR', 'BEGDA', 'ENDDA', 'NACHN', 'VORNA', 'GBDAT', 'SPRSL', 'ANRED', 'GESCH'],
      });
      result.personalData = data.rows;
    } catch (err) {
      this.logger.warn(`PA0002 read failed: ${err.message}`);
      result.personalData = [];
    }

    // PA0006 - Addresses
    try {
      const data = await this._readTable('PA0006', {
        fields: ['PERNR', 'BEGDA', 'ENDDA', 'ANSSA', 'STRAS', 'ORT01', 'PSTLZ', 'LAND1'],
      });
      result.addresses = data.rows;
    } catch (err) {
      this.logger.warn(`PA0006 read failed: ${err.message}`);
      result.addresses = [];
    }

    // PA0008 - Basic pay
    try {
      const data = await this._readTable('PA0008', {
        fields: ['PERNR', 'BEGDA', 'ENDDA', 'TRFAR', 'TRFGB', 'TRFGR', 'TRFST', 'ANSAL', 'WAERS'],
      });
      result.basicPay = data.rows;
    } catch (err) {
      this.logger.warn(`PA0008 read failed: ${err.message}`);
      result.basicPay = [];
    }

    // PA0014 - Recurring payments/deductions
    try {
      const data = await this._readTable('PA0014', {
        fields: ['PERNR', 'BEGDA', 'ENDDA', 'LGART', 'BETRG', 'WAERS'],
      });
      result.recurringPayments = data.rows;
    } catch (err) {
      this._trackCoverage('PA0014', 'skipped', { reason: err.message });
      result.recurringPayments = [];
    }

    // PA0015 - Additional payments
    try {
      const data = await this._readTable('PA0015', {
        fields: ['PERNR', 'BEGDA', 'ENDDA', 'LGART', 'BETRG', 'WAERS'],
      });
      result.additionalPayments = data.rows;
    } catch (err) {
      this._trackCoverage('PA0015', 'skipped', { reason: err.message });
      result.additionalPayments = [];
    }

    // HRP1000 - Org management objects
    try {
      const data = await this._readTable('HRP1000', {
        fields: ['PLVAR', 'OTYPE', 'OBJID', 'BEGDA', 'ENDDA', 'STEXT', 'LANGU'],
      });
      result.orgObjects = data.rows;
    } catch (err) {
      this.logger.warn(`HRP1000 read failed: ${err.message}`);
      result.orgObjects = [];
    }

    // HRP1001 - Org management relationships
    try {
      const data = await this._readTable('HRP1001', {
        fields: ['PLVAR', 'OTYPE', 'OBJID', 'RSIGN', 'RELAT', 'SCLAS', 'SOBID', 'BEGDA', 'ENDDA'],
      });
      result.orgRelationships = data.rows;
    } catch (err) {
      this.logger.warn(`HRP1001 read failed: ${err.message}`);
      result.orgRelationships = [];
    }

    // T500P - Personnel areas
    try {
      const data = await this._readTable('T500P', {
        fields: ['PERSA', 'NAME1', 'BUKRS', 'LAND1', 'MOLGA'],
      });
      result.personnelAreas = data.rows;
    } catch (err) {
      this._trackCoverage('T500P', 'skipped', { reason: err.message });
      result.personnelAreas = [];
    }

    // T001P - Personnel subareas
    try {
      const data = await this._readTable('T001P', {
        fields: ['WERKS', 'BTRTL', 'BTEXT', 'LAND1'],
      });
      result.personnelSubareas = data.rows;
    } catch (err) {
      this._trackCoverage('T001P', 'skipped', { reason: err.message });
      result.personnelSubareas = [];
    }

    // T503 - Employee groups
    try {
      const data = await this._readTable('T503', {
        fields: ['PERSG', 'PERSK', 'PTEXT'],
      });
      result.employeeGroups = data.rows;
    } catch (err) {
      this._trackCoverage('T503', 'skipped', { reason: err.message });
      result.employeeGroups = [];
    }

    // T510 - Pay scale areas
    try {
      const data = await this._readTable('T510', {
        fields: ['MOLGA', 'TRFAR', 'TRFGB', 'TRFKZ', 'BTEFG'],
      });
      result.payScaleAreas = data.rows;
    } catch (err) {
      this._trackCoverage('T510', 'skipped', { reason: err.message });
      result.payScaleAreas = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/hr-data.json');
    this._trackCoverage('PA0001', 'extracted', { rowCount: mockData.orgAssignment.length });
    this._trackCoverage('PA0002', 'extracted', { rowCount: mockData.personalData.length });
    this._trackCoverage('PA0006', 'extracted', { rowCount: mockData.addresses.length });
    this._trackCoverage('PA0008', 'extracted', { rowCount: mockData.basicPay.length });
    this._trackCoverage('PA0014', 'extracted', { rowCount: mockData.recurringPayments.length });
    this._trackCoverage('PA0015', 'extracted', { rowCount: mockData.additionalPayments.length });
    this._trackCoverage('HRP1000', 'extracted', { rowCount: mockData.orgObjects.length });
    this._trackCoverage('HRP1001', 'extracted', { rowCount: mockData.orgRelationships.length });
    this._trackCoverage('T500P', 'extracted', { rowCount: mockData.personnelAreas.length });
    this._trackCoverage('T001P', 'extracted', { rowCount: mockData.personnelSubareas.length });
    this._trackCoverage('T503', 'extracted', { rowCount: mockData.employeeGroups.length });
    this._trackCoverage('T510', 'extracted', { rowCount: mockData.payScaleAreas.length });
    return mockData;
  }
}

HRExtractor._extractorId = 'HR_EXTRACTOR';
HRExtractor._module = 'HR';
HRExtractor._category = 'config';
ExtractorRegistry.register(HRExtractor);

module.exports = HRExtractor;
