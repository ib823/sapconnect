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
 * Infor LN Security Extractor
 *
 * Extracts security configuration: ttaad auth tables, user-role assignments,
 * and SOD (Segregation of Duties) analysis.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNSecurityExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_SECURITY'; }
  get name() { return 'Infor LN Security Configuration'; }
  get module() { return 'LN_SEC'; }
  get category() { return 'security'; }

  getExpectedTables() {
    return [
      { table: 'ttaad1100', description: 'Users', critical: true },
      { table: 'ttaad2100', description: 'Roles', critical: true },
      { table: 'ttaad3100', description: 'User-role assignments', critical: true },
      { table: 'ttaad4100', description: 'SOD rule definitions', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // ttaad1100 - Users
    try {
      const data = await this._readTable('ttaad1100', { fields: ['t$user', 't$name', 't$dept', 't$cpnb', 't$actv', 't$llog', 't$type'] });
      result.users = data.rows;
    } catch (err) {
      this.logger.warn(`ttaad1100 read failed: ${err.message}`);
      result.users = [];
    }

    // ttaad2100 - Roles
    try {
      const data = await this._readTable('ttaad2100', { fields: ['t$role', 't$desc', 't$type', 't$nprm', 't$actv'] });
      result.roles = data.rows;
    } catch (err) {
      this.logger.warn(`ttaad2100 read failed: ${err.message}`);
      result.roles = [];
    }

    // ttaad3100 - Role Assignments
    try {
      const data = await this._readTable('ttaad3100', { fields: ['t$user', 't$role', 't$cpnb', 't$from', 't$to'] });
      result.roleAssignments = data.rows;
    } catch (err) {
      this.logger.warn(`ttaad3100 read failed: ${err.message}`);
      result.roleAssignments = [];
    }

    // Perform SOD analysis
    result.sodViolations = this._analyzeSoD(result.roleAssignments);

    return result;
  }

  _analyzeSoD(assignments) {
    // SOD conflict pairs: roles that should not be assigned to the same user
    const sodRules = [
      { role1: 'LN_BUYER', role2: 'LN_AP_CLERK', type: 'Create PO / Approve Invoice', risk: 'High' },
      { role1: 'LN_AP_CLERK', role2: 'LN_AR_CLERK', type: 'AP Processing / AR Processing', risk: 'Medium' },
      { role1: 'LN_FIN_MGR', role2: 'LN_BUYER', type: 'PO Approval / PO Creation', risk: 'High' },
    ];

    const violations = [];
    const userRoles = {};

    for (const a of assignments) {
      const user = a['t$user'];
      if (!a['t$to'] || new Date(a['t$to']) > new Date()) {
        if (!userRoles[user]) userRoles[user] = [];
        userRoles[user].push(a['t$role']);
      }
    }

    for (const [user, roles] of Object.entries(userRoles)) {
      for (const rule of sodRules) {
        if (roles.includes(rule.role1) && roles.includes(rule.role2)) {
          violations.push({
            't$user': user,
            't$role1': rule.role1,
            't$role2': rule.role2,
            't$type': rule.type,
            't$risk': rule.risk,
            't$desc': `User can ${rule.type.toLowerCase()}`,
          });
        }
      }
    }

    return violations;
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/security.json');
    this._trackCoverage('ttaad1100', 'extracted', { rowCount: mockData.users.length });
    this._trackCoverage('ttaad2100', 'extracted', { rowCount: mockData.roles.length });
    this._trackCoverage('ttaad3100', 'extracted', { rowCount: mockData.roleAssignments.length });
    this._trackCoverage('ttaad4100', 'extracted', { rowCount: mockData.sodViolations.length });
    return mockData;
  }
}

InforLNSecurityExtractor._extractorId = 'INFOR_LN_SECURITY';
InforLNSecurityExtractor._module = 'LN_SEC';
InforLNSecurityExtractor._category = 'security';
InforLNSecurityExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNSecurityExtractor);

module.exports = InforLNSecurityExtractor;
