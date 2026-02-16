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
 * System Info Extractor
 *
 * Extracts system identity, client list, component versions,
 * support packages, and system parameters.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class SystemInfoExtractor extends BaseExtractor {
  get extractorId() { return 'SYSTEM_INFO'; }
  get name() { return 'System Information'; }
  get module() { return 'BASIS'; }
  get category() { return 'metadata'; }

  getExpectedTables() {
    return [
      { table: 'T000', description: 'Client directory', critical: true },
      { table: 'CVERS', description: 'Component versions', critical: true },
      { table: 'PAT01', description: 'Support packages', critical: false },
      { table: 'PAHI', description: 'System parameters history', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // System info via RFC
    try {
      const sysInfo = await this._callFM('RFC_SYSTEM_INFO');
      if (sysInfo) {
        result.sid = (sysInfo.RFCSI_EXPORT?.RFCSYSID || '').trim();
        result.client = (sysInfo.RFCSI_EXPORT?.RFCCLIENT || '').trim();
        result.release = (sysInfo.RFCSI_EXPORT?.RFCABAPREL || '').trim();
        result.kernel = (sysInfo.RFCSI_EXPORT?.RFCKERNRL || '').trim();
        result.database = (sysInfo.RFCSI_EXPORT?.RFCDBSYS || '').trim();
        result.os = (sysInfo.RFCSI_EXPORT?.RFCOPSYS || '').trim();
        result.hostname = (sysInfo.RFCSI_EXPORT?.RFCHOST || '').trim();
      }
    } catch (err) {
      this.logger.warn(`RFC_SYSTEM_INFO failed: ${err.message}`);
    }

    // Clients
    try {
      const clients = await this._readTable('T000', { fields: ['MANDT', 'MTEXT', 'CCCATEGORY'] });
      result.clients = clients.rows;
    } catch (err) {
      this.logger.warn(`T000 read failed: ${err.message}`);
      result.clients = [];
    }

    // Component versions
    try {
      const cvers = await this._readTable('CVERS', {
        fields: ['COMPONENT', 'RELEASE', 'EXTRELEASE', 'COMP_TYPE'],
      });
      result.components = cvers.rows;
    } catch (err) {
      this.logger.warn(`CVERS read failed: ${err.message}`);
      result.components = [];
    }

    // Support packages
    try {
      const packs = await this._readTable('PAT01', {
        fields: ['COMP', 'PATNO', 'PATCH_NOSC', 'DTEFIXED'],
      });
      result.supportPackages = packs.rows;
    } catch (err) {
      this._trackCoverage('PAT01', 'skipped', { reason: err.message });
      result.supportPackages = [];
    }

    // System parameters
    try {
      const params = await this._readTable('PAHI', {
        fields: ['PARAMETER', 'VALUE'],
        maxRows: 500,
      });
      result.parameters = {};
      for (const row of params.rows) {
        result.parameters[row.PARAMETER] = row.VALUE;
      }
    } catch (err) {
      this._trackCoverage('PAHI', 'skipped', { reason: err.message });
      result.parameters = {};
    }

    // Update system context
    if (result.release) {
      const isS4 = parseInt(result.release, 10) >= 1709 ||
        result.components?.some(c => c.COMPONENT === 'S4CORE');
      this.context.system = {
        ...this.context.system,
        sid: result.sid,
        release: result.release,
        type: isS4 ? 'S4HANA' : 'ECC',
      };
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/system-info.json');
    this._trackCoverage('T000', 'extracted', { rowCount: mockData.clients.length });
    this._trackCoverage('CVERS', 'extracted', { rowCount: mockData.components.length });
    this._trackCoverage('PAT01', 'extracted', { rowCount: mockData.supportPackages.length });
    this._trackCoverage('PAHI', 'extracted', { rowCount: Object.keys(mockData.parameters).length });
    return mockData;
  }
}

SystemInfoExtractor._extractorId = 'SYSTEM_INFO';
SystemInfoExtractor._module = 'BASIS';
SystemInfoExtractor._category = 'metadata';
ExtractorRegistry.register(SystemInfoExtractor);

module.exports = SystemInfoExtractor;
