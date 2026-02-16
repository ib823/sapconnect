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
 * Infor M3 Organization Structure Extractor
 *
 * Extracts organizational hierarchy: CONO (company), DIVI (division),
 * FACI (facility), WHLO (warehouse) and builds the tree structure.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforM3OrgStructureExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_M3_ORG_STRUCTURE'; }
  get name() { return 'Infor M3 Organization Structure'; }
  get module() { return 'M3_BASIS'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'CMNCMP', description: 'Companies', critical: true },
      { table: 'CMNDIV', description: 'Divisions', critical: true },
      { table: 'CFACIL', description: 'Facilities', critical: true },
      { table: 'MITWHL', description: 'Warehouses', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const data = await this._readTable('CMNCMP', {
        fields: ['CCCONO', 'CCCONM', 'CCCSCD', 'CCCOCU', 'CCSTAT', 'CCRGDT'],
      });
      result.companies = data.rows;
    } catch (err) {
      this.logger.warn(`CMNCMP read failed: ${err.message}`);
      result.companies = [];
    }

    try {
      const data = await this._readTable('CMNDIV', {
        fields: ['CCDIVI', 'CCCONO', 'CCDIVN', 'CCCSCD', 'CCTEPY'],
      });
      result.divisions = data.rows;
    } catch (err) {
      this.logger.warn(`CMNDIV read failed: ${err.message}`);
      result.divisions = [];
    }

    try {
      const data = await this._readTable('CFACIL', {
        fields: ['CFFACI', 'CFCONO', 'CFDIVI', 'CFFACN', 'CFCSCD', 'CFSTAT'],
      });
      result.facilities = data.rows;
    } catch (err) {
      this.logger.warn(`CFACIL read failed: ${err.message}`);
      result.facilities = [];
    }

    try {
      const data = await this._readTable('MITWHL', {
        fields: ['MHWHLO', 'MHCONO', 'MHFACI', 'MHWHNM', 'MHWHTY'],
      });
      result.warehouses = data.rows;
    } catch (err) {
      this.logger.warn(`MITWHL read failed: ${err.message}`);
      result.warehouses = [];
    }

    result.hierarchy = this._buildHierarchy(result);
    result.summary = {
      totalCompanies: result.companies.length,
      totalDivisions: result.divisions.length,
      totalFacilities: result.facilities.length,
      totalWarehouses: result.warehouses.length,
      extractedAt: new Date().toISOString(),
    };

    return result;
  }

  _buildHierarchy(data) {
    const tree = [];
    for (const company of data.companies) {
      const cono = company.CCCONO;
      const divs = data.divisions.filter(d => d.CCCONO === cono);
      tree.push({
        level: 'Company',
        code: String(cono),
        name: company.CCCONM,
        children: divs.map(div => {
          const facis = data.facilities.filter(f => f.CFCONO === cono && f.CFDIVI === div.CCDIVI);
          return {
            level: 'Division',
            code: div.CCDIVI,
            name: div.CCDIVN,
            children: facis.map(faci => ({
              level: 'Facility',
              code: faci.CFFACI,
              name: faci.CFFACN,
              warehouses: data.warehouses
                .filter(w => w.MHCONO === cono && w.MHFACI === faci.CFFACI)
                .map(w => w.MHWHLO),
            })),
          };
        }),
      });
    }
    return tree;
  }

  async _extractMock() {
    const mockData = require('../mock-data/m3/org-structure.json');
    this._trackCoverage('CMNCMP', 'extracted', { rowCount: mockData.companies.length });
    this._trackCoverage('CMNDIV', 'extracted', { rowCount: mockData.divisions.length });
    this._trackCoverage('CFACIL', 'extracted', { rowCount: mockData.facilities.length });
    this._trackCoverage('MITWHL', 'extracted', { rowCount: mockData.warehouses.length });
    return mockData;
  }
}

InforM3OrgStructureExtractor._extractorId = 'INFOR_M3_ORG_STRUCTURE';
InforM3OrgStructureExtractor._module = 'M3_BASIS';
InforM3OrgStructureExtractor._category = 'config';
InforM3OrgStructureExtractor._sourceSystem = 'INFOR_M3';
ExtractorRegistry.register(InforM3OrgStructureExtractor);

module.exports = InforM3OrgStructureExtractor;
