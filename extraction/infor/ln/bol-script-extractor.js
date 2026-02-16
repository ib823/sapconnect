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
 * Infor LN BOL Script Extractor
 *
 * Extracts BOL/4GL scripts, user exits, DEM customizations,
 * and chart field extensions.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNBOLScriptExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_BOL_SCRIPTS'; }
  get name() { return 'Infor LN BOL Scripts and User Exits'; }
  get module() { return 'LN_CUSTOM'; }
  get category() { return 'customization'; }

  getExpectedTables() {
    return [
      { table: 'ttadv3100', description: 'BOL/4GL scripts', critical: true },
      { table: 'ttadv3200', description: 'User exits', critical: true },
      { table: 'ttadv5100', description: 'DEM customizations', critical: false },
      { table: 'ttadv5200', description: 'Chart field extensions', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // ttadv3100 - BOL/4GL Scripts
    try {
      const data = await this._readTable('ttadv3100', { fields: ['t$scid', 't$name', 't$desc', 't$sess', 't$type', 't$lang', 't$lines', 't$cpnb', 't$mdat'] });
      result.bolScripts = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv3100 read failed: ${err.message}`);
      result.bolScripts = [];
    }

    // ttadv3200 - User Exits
    try {
      const data = await this._readTable('ttadv3200', { fields: ['t$ueid', 't$name', 't$desc', 't$hook', 't$sess', 't$actv', 't$lines'] });
      result.userExits = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv3200 read failed: ${err.message}`);
      result.userExits = [];
    }

    // ttadv5100 - DEM Customizations
    try {
      const data = await this._readTable('ttadv5100', { fields: ['t$dmid', 't$desc', 't$tabl', 't$nfld', 't$fields', 't$mdat'] });
      result.demCustomizations = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv5100 read failed: ${err.message}`);
      result.demCustomizations = [];
    }

    // ttadv5200 - Chart Field Extensions
    try {
      const data = await this._readTable('ttadv5200', { fields: ['t$cfid', 't$dimn', 't$desc', 't$size', 't$type', 't$mand'] });
      result.chartFieldExtensions = data.rows;
    } catch (err) {
      this.logger.warn(`ttadv5200 read failed: ${err.message}`);
      result.chartFieldExtensions = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/bol-scripts.json');
    this._trackCoverage('ttadv3100', 'extracted', { rowCount: mockData.bolScripts.length });
    this._trackCoverage('ttadv3200', 'extracted', { rowCount: mockData.userExits.length });
    this._trackCoverage('ttadv5100', 'extracted', { rowCount: mockData.demCustomizations.length });
    this._trackCoverage('ttadv5200', 'extracted', { rowCount: mockData.chartFieldExtensions.length });
    return mockData;
  }
}

InforLNBOLScriptExtractor._extractorId = 'INFOR_LN_BOL_SCRIPTS';
InforLNBOLScriptExtractor._module = 'LN_CUSTOM';
InforLNBOLScriptExtractor._category = 'customization';
InforLNBOLScriptExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNBOLScriptExtractor);

module.exports = InforLNBOLScriptExtractor;
