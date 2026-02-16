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
 * Variant Extractor
 *
 * Extracts report variants including variant definitions, texts,
 * and selection screen variable values. In live mode, RS_VARIANT_CONTENTS
 * would be called per variant for detailed selection values; mock mode
 * provides static data.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class VariantExtractor extends BaseExtractor {
  get extractorId() { return 'VARIANTS'; }
  get name() { return 'Report Variants'; }
  get module() { return 'BASIS'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'VARID', description: 'Variant directory', critical: true },
      { table: 'VARIT', description: 'Variant texts', critical: false },
      { table: 'TVARVC', description: 'Selection screen variables', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // VARID - Variant directory
    try {
      const data = await this._readTable('VARID', {
        fields: ['REPORT', 'VARIANT', 'MESSION_DATE', 'MESSION_USER', 'ESSION', 'PROTECTED'],
      });
      result.variants = data.rows;
    } catch (err) {
      this.logger.warn(`VARID read failed: ${err.message}`);
      result.variants = [];
    }

    // VARIT - Variant texts
    try {
      const data = await this._readTable('VARIT', {
        fields: ['REPORT', 'VARIANT', 'LANGU', 'VTEXT'],
      });
      result.variantTexts = data.rows;
    } catch (err) {
      this._trackCoverage('VARIT', 'skipped', { reason: err.message });
      result.variantTexts = [];
    }

    // TVARVC - Selection screen variables
    try {
      const data = await this._readTable('TVARVC', {
        fields: ['NAME', 'TYPE', 'NUMB', 'SIGN', 'OPTI', 'LOW', 'HIGH'],
      });
      result.selectionVariables = data.rows;
    } catch (err) {
      this._trackCoverage('TVARVC', 'skipped', { reason: err.message });
      result.selectionVariables = [];
    }

    // Note: In live mode, RS_VARIANT_CONTENTS FM would be called per variant
    // to retrieve detailed selection screen values. This is omitted in
    // extraction for performance; individual variant content can be retrieved
    // on demand.

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/variant-data.json');
    this._trackCoverage('VARID', 'extracted', { rowCount: mockData.variants.length });
    this._trackCoverage('VARIT', 'extracted', { rowCount: mockData.variantTexts.length });
    this._trackCoverage('TVARVC', 'extracted', { rowCount: mockData.selectionVariables.length });
    return mockData;
  }
}

VariantExtractor._extractorId = 'VARIANTS';
VariantExtractor._module = 'BASIS';
VariantExtractor._category = 'config';
ExtractorRegistry.register(VariantExtractor);

module.exports = VariantExtractor;
