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
 * Infor M3 Security Extractor
 *
 * Extracts security configuration: user profiles, function access
 * rules, role definitions, and segregation of duties (SOD) analysis.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3SecurityExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_SECURITY'; }
  get name() { return 'Infor M3 Security & Authorization'; }
  get module() { return 'M3_SEC'; }
  get category() { return 'security'; }

  getExpectedTables() {
    return [
      { table: 'CMNUSR', description: 'User master', critical: true },
      { table: 'CMNROL', description: 'Role definitions', critical: true },
      { table: 'CMNFAC', description: 'Function access', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('CMNUSR', {
        fields: ['JBUSER', 'JBUSNA', 'JBDEPT', 'JBUSTP', 'JBEMAL', 'JBSTAT', 'JBLDAT', 'JBLLTM'],
      });
      result.users = data.rows;
    } catch (err) {
      this.logger.warn(`CMNUSR read failed: ${err.message}`);
      result.users = [];
    }

    try {
      const data = await this._readTable('CMNROL', {
        fields: ['RLRLID', 'RLDESC', 'RLPGMS', 'RLUSRC'],
      });
      result.roles = data.rows;
    } catch (err) {
      this.logger.warn(`CMNROL read failed: ${err.message}`);
      result.roles = [];
    }

    try {
      const data = await this._readTable('CMNFAC', {
        fields: ['JBUSER', 'FAROLEID', 'FAPROG', 'FAALVL', 'FAGDAT'],
      });
      result.functionAccess = data.rows;
    } catch (err) {
      this.logger.warn(`CMNFAC read failed: ${err.message}`);
      result.functionAccess = [];
    }

    result.sodViolations = this._analyzeSoD(result);
    result.summary = {
      totalUsers: result.users.length,
      activeUsers: result.users.filter(u => u.JBSTAT === 'Active').length,
      inactiveUsers: result.users.filter(u => u.JBSTAT !== 'Active').length,
      totalRoles: result.roles.length,
      totalFunctionAccessRules: result.functionAccess.length,
      sodViolations: result.sodViolations.length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  _analyzeSoD(data) {
    const violations = [];
    const userPrograms = new Map();

    for (const fa of (data.functionAccess || [])) {
      const user = fa.JBUSER || fa.user;
      const prog = fa.FAPROG || fa.program;
      if (!user || !prog) continue;
      if (!userPrograms.has(user)) userPrograms.set(user, new Set());
      userPrograms.get(user).add(prog);
    }

    const sodRules = [
      { programs: ['APS380'], desc: 'AP Invoice Entry + AP Payment Processing', risk: 'High' },
      { programs: ['MNS150', 'GLS200'], desc: 'User Administration + Financial Posting', risk: 'Critical' },
    ];

    for (const [user, progs] of userPrograms) {
      for (const rule of sodRules) {
        if (rule.programs.every(p => progs.has(p))) {
          violations.push({ user, violation: rule.desc, risk: rule.risk });
        }
      }
    }

    return violations;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/security.json');
    this._trackCoverage('CMNUSR', 'extracted', { rowCount: (mockData.users || []).length });
    this._trackCoverage('CMNROL', 'extracted', { rowCount: (mockData.roles || []).length });
    this._trackCoverage('CMNFAC', 'extracted', { rowCount: (mockData.functionAccess || []).length });
    return mockData;
  }
}

InforM3SecurityExtractor._extractorId = 'INFOR_M3_SECURITY';
InforM3SecurityExtractor._module = 'M3_SEC';
InforM3SecurityExtractor._category = 'security';
InforM3SecurityExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3SecurityExtractor);

module.exports = InforM3SecurityExtractor;
