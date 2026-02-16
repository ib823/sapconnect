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
 * Interface Extractor
 *
 * Extracts the interface landscape including RFC destinations, trusted
 * systems, IDoc configurations, partner profiles, logical systems, and
 * HTTP service endpoints.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class InterfaceExtractor extends BaseExtractor {
  get extractorId() { return 'INTERFACES'; }
  get name() { return 'Interface Landscape'; }
  get module() { return 'BASIS'; }
  get category() { return 'interface'; }

  getExpectedTables() {
    return [
      { table: 'RFCDES', description: 'RFC destinations', critical: true },
      { table: 'RFCSYSACL', description: 'Trusted/trusting systems', critical: false },
      { table: 'EDP13', description: 'IDoc outbound partner/message', critical: true },
      { table: 'EDP21', description: 'IDoc inbound partner/message', critical: true },
      { table: 'EDPP1', description: 'Partner profiles', critical: false },
      { table: 'EDIDC', description: 'IDoc control records / statistics', critical: false },
      { table: 'EDIMSG', description: 'IDoc message types', critical: false },
      { table: 'EDISEG', description: 'IDoc segment definitions', critical: false },
      { table: 'TBDLS', description: 'Logical systems', critical: true },
      { table: 'TBDLST', description: 'Logical system texts', critical: false },
      { table: 'HTTPURLLOC', description: 'HTTP service endpoints', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // RFCDES - RFC destinations
    try {
      const data = await this._readTable('RFCDES', {
        fields: ['RFCDEST', 'RFCTYPE', 'RFCOPTIONS', 'RFCHOST', 'RFCSYSID', 'RFCSAMEUSR', 'RFCSNC', 'DESCRIPTION'],
      });
      result.rfcDestinations = data.rows;
    } catch (err) {
      this.logger.warn(`RFCDES read failed: ${err.message}`);
      result.rfcDestinations = [];
    }

    // RFCSYSACL - Trusted systems
    try {
      const data = await this._readTable('RFCSYSACL', {
        fields: ['RFCSYSID', 'RFCTRUSTSY', 'RFCSLOPT', 'RFCMSGSRV', 'RFCSYSNO'],
      });
      result.trustedSystems = data.rows;
    } catch (err) {
      this._trackCoverage('RFCSYSACL', 'skipped', { reason: err.message });
      result.trustedSystems = [];
    }

    // EDP13 - IDoc outbound
    try {
      const data = await this._readTable('EDP13', {
        fields: ['RCVPRN', 'MESTYP', 'RCVPRT', 'RCVPFC', 'SNDPRN', 'SNDPRT'],
      });
      result.idocOutbound = data.rows;
    } catch (err) {
      this.logger.warn(`EDP13 read failed: ${err.message}`);
      result.idocOutbound = [];
    }

    // EDP21 - IDoc inbound
    try {
      const data = await this._readTable('EDP21', {
        fields: ['SNDPRN', 'MESTYP', 'SNDPRT', 'SNDPFC', 'RCVPRN', 'RCVPRT'],
      });
      result.idocInbound = data.rows;
    } catch (err) {
      this.logger.warn(`EDP21 read failed: ${err.message}`);
      result.idocInbound = [];
    }

    // EDPP1 - Partner profiles
    try {
      const data = await this._readTable('EDPP1', {
        fields: ['PARNUM', 'PARTYP', 'PARTNR', 'PARROL', 'RTEFIND'],
      });
      result.partnerProfiles = data.rows;
    } catch (err) {
      this._trackCoverage('EDPP1', 'skipped', { reason: err.message });
      result.partnerProfiles = [];
    }

    // EDIDC - IDoc statistics (recent records)
    try {
      const data = await this._readTable('EDIDC', {
        fields: ['DOCNUM', 'MESTYP', 'DIRECT', 'STATUS', 'CREDAT', 'CRETIM', 'RCVPRN'],
        maxRows: 500,
      });
      result.idocStatistics = data.rows;
    } catch (err) {
      this._trackCoverage('EDIDC', 'skipped', { reason: err.message });
      result.idocStatistics = [];
    }

    // EDIMSG - Message types
    try {
      const data = await this._readTable('EDIMSG', {
        fields: ['MESTYP'],
      });
      result.messageTypes = data.rows;
    } catch (err) {
      this._trackCoverage('EDIMSG', 'skipped', { reason: err.message });
      result.messageTypes = [];
    }

    // EDISEG - Segment definitions
    try {
      const data = await this._readTable('EDISEG', {
        fields: ['SEGTYP', 'SEGDEF', 'PARSEG', 'QUALIFIER', 'DESCRP'],
      });
      result.segments = data.rows;
    } catch (err) {
      this._trackCoverage('EDISEG', 'skipped', { reason: err.message });
      result.segments = [];
    }

    // TBDLS - Logical systems
    try {
      const data = await this._readTable('TBDLS', {
        fields: ['LOGSYS', 'SYSNAM'],
      });
      result.logicalSystems = data.rows;
    } catch (err) {
      this.logger.warn(`TBDLS read failed: ${err.message}`);
      result.logicalSystems = [];
    }

    // HTTPURLLOC - HTTP service endpoints
    try {
      const data = await this._readTable('HTTPURLLOC', {
        fields: ['ICF_NAME', 'ICF_DOCU', 'ICFACTIVE', 'ICFPARGUID'],
      });
      result.httpServices = data.rows;
    } catch (err) {
      this._trackCoverage('HTTPURLLOC', 'skipped', { reason: err.message });
      result.httpServices = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/interface-data.json');
    this._trackCoverage('RFCDES', 'extracted', { rowCount: mockData.rfcDestinations.length });
    this._trackCoverage('RFCSYSACL', 'extracted', { rowCount: mockData.trustedSystems.length });
    this._trackCoverage('EDP13', 'extracted', { rowCount: mockData.idocOutbound.length });
    this._trackCoverage('EDP21', 'extracted', { rowCount: mockData.idocInbound.length });
    this._trackCoverage('EDPP1', 'extracted', { rowCount: mockData.partnerProfiles.length });
    this._trackCoverage('EDIDC', 'extracted', { rowCount: mockData.idocStatistics.length });
    this._trackCoverage('EDIMSG', 'extracted', { rowCount: mockData.messageTypes.length });
    this._trackCoverage('EDISEG', 'extracted', { rowCount: mockData.segments.length });
    this._trackCoverage('TBDLS', 'extracted', { rowCount: mockData.logicalSystems.length });
    this._trackCoverage('TBDLST', 'extracted', { rowCount: 0 });
    this._trackCoverage('HTTPURLLOC', 'extracted', { rowCount: mockData.httpServices.length });
    return mockData;
  }
}

InterfaceExtractor._extractorId = 'INTERFACES';
InterfaceExtractor._module = 'BASIS';
InterfaceExtractor._category = 'interface';
ExtractorRegistry.register(InterfaceExtractor);

module.exports = InterfaceExtractor;
