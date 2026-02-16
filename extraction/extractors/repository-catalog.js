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
 * Repository Catalog Extractor
 *
 * Extracts all repository objects (programs, classes, FMs, tables),
 * program attributes, function modules, and development packages.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class RepositoryCatalogExtractor extends BaseExtractor {
  get extractorId() { return 'REPOSITORY_CATALOG'; }
  get name() { return 'Repository Object Catalog'; }
  get module() { return 'BASIS'; }
  get category() { return 'code'; }

  getExpectedTables() {
    return [
      { table: 'TADIR', description: 'Repository objects directory', critical: true },
      { table: 'TRDIR', description: 'Program attributes', critical: true },
      { table: 'TFDIR', description: 'Function modules', critical: true },
      { table: 'TDEVC', description: 'Development packages', critical: false },
      { table: 'TDEVCT', description: 'Package texts', critical: false },
      { table: 'D010TAB', description: 'Table usage in programs', critical: false },
      { table: 'D010INC', description: 'Include usage in programs', critical: false },
    ];
  }

  async _extractLive() {
    const result = {
      objects: {},
      programs: {},
      functionModules: {},
      packages: {},
      stats: { totalObjects: 0, customObjects: 0, sapObjects: 0, byType: {} },
    };

    // TADIR — All repository objects
    try {
      for await (const chunk of this._streamTable('TADIR', {
        fields: ['PGMID', 'OBJECT', 'OBJ_NAME', 'DEVCLASS', 'AUTHOR', 'CREATED_ON'],
        chunkSize: 50000,
      })) {
        for (const row of chunk.rows) {
          const key = `${row.PGMID}:${row.OBJECT}:${row.OBJ_NAME}`;
          result.objects[key] = row;
          result.stats.totalObjects++;

          const isCustom = (row.OBJ_NAME || '').startsWith('Z') || (row.OBJ_NAME || '').startsWith('Y');
          if (isCustom) result.stats.customObjects++;
          else result.stats.sapObjects++;

          const objType = row.OBJECT || 'UNKNOWN';
          result.stats.byType[objType] = (result.stats.byType[objType] || 0) + 1;
        }
      }
    } catch (err) {
      this.logger.error(`TADIR stream failed: ${err.message}`);
    }

    // TRDIR — Program attributes
    try {
      const progs = await this._readTable('TRDIR', {
        fields: ['NAME', 'SUBC', 'CDAT', 'UDAT', 'CNAM', 'UNAM', 'RSTAT'],
        where: "SUBC IN ('1','I','M','F','S','J','K')",
      });
      for (const row of progs.rows) {
        result.programs[row.NAME] = row;
      }
    } catch (err) {
      this.logger.warn(`TRDIR read failed: ${err.message}`);
    }

    // TFDIR — Function modules
    try {
      const fms = await this._readTable('TFDIR', {
        fields: ['FUNCNAME', 'PNAME', 'FMODE', 'RFCTYPE'],
      });
      for (const row of fms.rows) {
        result.functionModules[row.FUNCNAME] = row;
      }
    } catch (err) {
      this.logger.warn(`TFDIR read failed: ${err.message}`);
    }

    // TDEVC — Development packages
    try {
      const pkgs = await this._readTable('TDEVC', {
        fields: ['DEVCLASS', 'PARENTCL', 'COMPONENT', 'DLVUNIT'],
      });
      for (const row of pkgs.rows) {
        result.packages[row.DEVCLASS] = row;
      }
    } catch (err) {
      this.logger.warn(`TDEVC read failed: ${err.message}`);
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/repository-catalog.json');

    this._trackCoverage('TADIR', 'extracted', { rowCount: Object.keys(mockData.objects).length });
    this._trackCoverage('TRDIR', 'extracted', { rowCount: Object.keys(mockData.programs).length });
    this._trackCoverage('TFDIR', 'extracted', { rowCount: Object.keys(mockData.functionModules).length });
    this._trackCoverage('TDEVC', 'extracted', { rowCount: Object.keys(mockData.packages).length });
    this._trackCoverage('TDEVCT', 'extracted', { rowCount: Object.keys(mockData.packages).length });
    this._trackCoverage('D010TAB', 'skipped', { reason: 'Mock mode' });
    this._trackCoverage('D010INC', 'skipped', { reason: 'Mock mode' });

    return mockData;
  }
}

RepositoryCatalogExtractor._extractorId = 'REPOSITORY_CATALOG';
RepositoryCatalogExtractor._module = 'BASIS';
RepositoryCatalogExtractor._category = 'code';
ExtractorRegistry.register(RepositoryCatalogExtractor);

module.exports = RepositoryCatalogExtractor;
