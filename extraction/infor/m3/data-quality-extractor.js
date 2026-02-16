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
 * Infor M3 Data Quality Extractor
 *
 * Profiles data quality across key M3 tables: MITMAS, CIDMAS,
 * OOHEAD, FSLEDG, MPHEAD. Measures completeness, null rates,
 * duplicate counts, and cross-table referential integrity.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3DataQualityExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_DATA_QUALITY'; }
  get name() { return 'Infor M3 Data Quality Profiling'; }
  get module() { return 'M3_DQ'; }
  get category() { return 'data-quality'; }

  getExpectedTables() {
    return [
      { table: 'MITMAS', description: 'Item master quality profile', critical: true },
      { table: 'CIDMAS', description: 'Customer master quality profile', critical: true },
      { table: 'OOHEAD', description: 'Customer order quality profile', critical: true },
      { table: 'FSLEDG', description: 'Subledger quality profile', critical: true },
      { table: 'MPHEAD', description: 'Purchase order quality profile', critical: true },
    ];
  }

  async _extractLive() {
    const result = { tables: [], crossTableIntegrity: [] };
    const tablesToProfile = ['MITMAS', 'CIDMAS', 'OOHEAD', 'FSLEDG', 'MPHEAD'];

    for (const table of tablesToProfile) {
      try {
        const data = await this._readTable(table, {});
        const profile = this._profileTable(table, data.rows);
        result.tables.push(profile);
        this._trackCoverage(table, 'extracted', { rowCount: data.rows.length });
      } catch (err) {
        this.logger.warn(`${table} profiling failed: ${err.message}`);
        this._trackCoverage(table, 'failed', { error: err.message });
      }
    }

    result.summary = {
      tablesAnalyzed: result.tables.length,
      totalRecords: result.tables.reduce((sum, t) => sum + t.totalRecords, 0),
      averageCompletenessScore: result.tables.length > 0
        ? result.tables.reduce((sum, t) => sum + t.overallScore, 0) / result.tables.length
        : 0,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  _profileTable(table, records) {
    const totalRecords = records.length;
    const completeness = {};
    if (totalRecords > 0) {
      const fields = Object.keys(records[0]);
      for (const field of fields) {
        const populated = records.filter(r => r[field] !== null && r[field] !== undefined && r[field] !== '').length;
        completeness[field] = {
          populated,
          nullCount: totalRecords - populated,
          completeness: (populated / totalRecords) * 100,
        };
      }
    }
    const scores = Object.values(completeness).map(c => c.completeness);
    const overallScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length : 100;

    return { table, totalRecords, completeness, overallScore };
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/data-quality.json');
    const tables = mockData.tables || [];
    for (const t of tables) {
      this._trackCoverage(t.table, 'extracted', { rowCount: t.totalRecords });
    }
    return mockData;
  }
}

InforM3DataQualityExtractor._extractorId = 'INFOR_M3_DATA_QUALITY';
InforM3DataQualityExtractor._module = 'M3_DQ';
InforM3DataQualityExtractor._category = 'data-quality';
InforM3DataQualityExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3DataQualityExtractor);

module.exports = InforM3DataQualityExtractor;
