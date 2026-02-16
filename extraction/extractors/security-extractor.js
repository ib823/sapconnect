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
 * Security Extractor
 *
 * Extracts security and authorization model including users, roles,
 * profiles, authorization objects, and user group assignments.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class SecurityExtractor extends BaseExtractor {
  get extractorId() { return 'SECURITY'; }
  get name() { return 'Security & Authorization Model'; }
  get module() { return 'BASIS'; }
  get category() { return 'security'; }

  getExpectedTables() {
    return [
      { table: 'USR02', description: 'User logon data', critical: true },
      { table: 'USR21', description: 'User master keys', critical: true },
      { table: 'AGR_DEFINE', description: 'Role definitions', critical: true },
      { table: 'AGR_1251', description: 'Role authorization values', critical: true },
      { table: 'AGR_USERS', description: 'Role-to-user assignments', critical: true },
      { table: 'AGR_TCODES', description: 'Role transaction code assignments', critical: false },
      { table: 'AGR_TEXTS', description: 'Role texts', critical: false },
      { table: 'AGR_PROF', description: 'Role profiles', critical: false },
      { table: 'UST04', description: 'User profiles', critical: false },
      { table: 'USOBX', description: 'Authorization check indicators', critical: false },
      { table: 'USOBT', description: 'Default authorization values', critical: false },
      { table: 'USGRP', description: 'User groups', critical: false },
      { table: 'USGRPT', description: 'User group texts', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // USR02 - User logon data
    try {
      const data = await this._readTable('USR02', {
        fields: ['BNAME', 'USTYP', 'CLASS', 'GLTGV', 'GLTGB', 'TRDAT', 'LTIME', 'UFLAG'],
      });
      result.users = data.rows;
    } catch (err) {
      this.logger.warn(`USR02 read failed: ${err.message}`);
      result.users = [];
    }

    // USR21 - User master keys
    try {
      const data = await this._readTable('USR21', {
        fields: ['BNAME', 'PERSNUMBER', 'ADDRNUMBER', 'KOSTL'],
      });
      result.userKeys = data.rows;
    } catch (err) {
      this.logger.warn(`USR21 read failed: ${err.message}`);
      result.userKeys = [];
    }

    // AGR_DEFINE - Role definitions
    try {
      const data = await this._readTable('AGR_DEFINE', {
        fields: ['AGR_NAME', 'PARENT_AGR', 'CREATE_USR', 'CREATE_DAT', 'CREATE_TIM'],
      });
      result.roleDefinitions = data.rows;
    } catch (err) {
      this.logger.warn(`AGR_DEFINE read failed: ${err.message}`);
      result.roleDefinitions = [];
    }

    // AGR_1251 - Role authorization values
    try {
      const data = await this._readTable('AGR_1251', {
        fields: ['AGR_NAME', 'OBJECT', 'AUTH', 'FIELD', 'LOW', 'HIGH'],
      });
      result.roleAuthValues = data.rows;
    } catch (err) {
      this.logger.warn(`AGR_1251 read failed: ${err.message}`);
      result.roleAuthValues = [];
    }

    // AGR_USERS - Role-to-user assignments
    try {
      const data = await this._readTable('AGR_USERS', {
        fields: ['AGR_NAME', 'UNAME', 'FROM_DAT', 'TO_DAT'],
      });
      result.roleUserAssignments = data.rows;
    } catch (err) {
      this.logger.warn(`AGR_USERS read failed: ${err.message}`);
      result.roleUserAssignments = [];
    }

    // AGR_TCODES - Role transaction codes
    try {
      const data = await this._readTable('AGR_TCODES', {
        fields: ['AGR_NAME', 'TCODE'],
      });
      result.roleTcodes = data.rows;
    } catch (err) {
      this._trackCoverage('AGR_TCODES', 'skipped', { reason: err.message });
      result.roleTcodes = [];
    }

    // AGR_TEXTS - Role texts
    try {
      const data = await this._readTable('AGR_TEXTS', {
        fields: ['AGR_NAME', 'SPRAS', 'TEXT'],
      });
      result.roleTexts = data.rows;
    } catch (err) {
      this._trackCoverage('AGR_TEXTS', 'skipped', { reason: err.message });
      result.roleTexts = [];
    }

    // AGR_PROF - Role profiles
    try {
      const data = await this._readTable('AGR_PROF', {
        fields: ['AGR_NAME', 'PROFILE'],
      });
      result.roleProfiles = data.rows;
    } catch (err) {
      this._trackCoverage('AGR_PROF', 'skipped', { reason: err.message });
      result.roleProfiles = [];
    }

    // UST04 - User profiles
    try {
      const data = await this._readTable('UST04', {
        fields: ['BNAME', 'PROFILE'],
      });
      result.userProfiles = data.rows;
    } catch (err) {
      this._trackCoverage('UST04', 'skipped', { reason: err.message });
      result.userProfiles = [];
    }

    // USOBX - Authorization check indicators
    try {
      const data = await this._readTable('USOBX', {
        fields: ['OBJECT', 'FIELD', 'OKFLAG'],
      });
      result.checkIndicators = data.rows;
    } catch (err) {
      this._trackCoverage('USOBX', 'skipped', { reason: err.message });
      result.checkIndicators = [];
    }

    // USOBT - Default authorization values
    try {
      const data = await this._readTable('USOBT', {
        fields: ['OBJECT', 'FIELD', 'LOW', 'HIGH', 'OKFLAG'],
      });
      result.defaultAuthValues = data.rows;
    } catch (err) {
      this._trackCoverage('USOBT', 'skipped', { reason: err.message });
      result.defaultAuthValues = [];
    }

    // USGRP - User groups
    try {
      const data = await this._readTable('USGRP', {
        fields: ['USERGROUP'],
      });
      result.userGroups = data.rows;
    } catch (err) {
      this._trackCoverage('USGRP', 'skipped', { reason: err.message });
      result.userGroups = [];
    }

    // Analysis
    result.analysis = this._analyzeSecurityData(result);

    return result;
  }

  _analyzeSecurityData(result) {
    const analysis = {};

    // Users with SAP_ALL profile
    const sapAllUsers = new Set();
    for (const up of (result.userProfiles || [])) {
      if (up.PROFILE === 'SAP_ALL') {
        sapAllUsers.add(up.BNAME);
      }
    }
    analysis.usersWithSapAll = Array.from(sapAllUsers);

    // Unused roles (roles with no user assignments)
    const assignedRoles = new Set(
      (result.roleUserAssignments || []).map(a => a.AGR_NAME)
    );
    analysis.unusedRoles = (result.roleDefinitions || [])
      .map(r => r.AGR_NAME)
      .filter(name => !assignedRoles.has(name));

    return analysis;
  }

  async _extractMock() {
    const mockData = require('../mock-data/security-data.json');
    this._trackCoverage('USR02', 'extracted', { rowCount: mockData.users.length });
    this._trackCoverage('USR21', 'extracted', { rowCount: mockData.userKeys.length });
    this._trackCoverage('AGR_DEFINE', 'extracted', { rowCount: mockData.roleDefinitions.length });
    this._trackCoverage('AGR_1251', 'extracted', { rowCount: mockData.roleAuthValues.length });
    this._trackCoverage('AGR_USERS', 'extracted', { rowCount: mockData.roleUserAssignments.length });
    this._trackCoverage('AGR_TCODES', 'extracted', { rowCount: mockData.roleTcodes.length });
    this._trackCoverage('AGR_TEXTS', 'extracted', { rowCount: mockData.roleTexts.length });
    this._trackCoverage('AGR_PROF', 'extracted', { rowCount: mockData.roleProfiles.length });
    this._trackCoverage('UST04', 'extracted', { rowCount: mockData.userProfiles.length });
    this._trackCoverage('USOBX', 'extracted', { rowCount: mockData.checkIndicators.length });
    this._trackCoverage('USOBT', 'extracted', { rowCount: mockData.defaultAuthValues.length });
    this._trackCoverage('USGRP', 'extracted', { rowCount: mockData.userGroups.length });
    this._trackCoverage('USGRPT', 'extracted', { rowCount: 0 });
    return mockData;
  }
}

SecurityExtractor._extractorId = 'SECURITY';
SecurityExtractor._module = 'BASIS';
SecurityExtractor._category = 'security';
ExtractorRegistry.register(SecurityExtractor);

module.exports = SecurityExtractor;
