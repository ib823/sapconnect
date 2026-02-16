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
 * Change Document Extractor
 *
 * Reads CDHDR/CDPOS tables (streamed by date range) to build
 * event logs for process mining. These tables can be massive.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class ChangeDocumentExtractor extends BaseExtractor {
  get extractorId() { return 'CHANGE_DOCUMENTS'; }
  get name() { return 'Change Documents'; }
  get module() { return 'BASIS'; }
  get category() { return 'process'; }

  getExpectedTables() {
    return [
      { table: 'CDHDR', description: 'Change document headers', critical: true },
      { table: 'CDPOS', description: 'Change document items', critical: true },
      { table: 'TCDOB', description: 'Object class definitions', critical: false },
    ];
  }

  async _extractLive() {
    const result = { headers: [], items: [], objectClasses: [] };

    // TCDOB — object class definitions
    try {
      const tcdob = await this._readTable('TCDOB', { fields: ['OBJECT', 'OBTEXT'] });
      result.objectClasses = tcdob.rows;
    } catch (err) {
      this.logger.warn(`TCDOB read failed: ${err.message}`);
    }

    // CDHDR — streamed by year/month for last 24 months
    try {
      const now = new Date();
      for (let m = 0; m < 24; m++) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
        const where = `UDATE LIKE '${yyyymm}%'`;
        try {
          const chunk = await this._readTable('CDHDR', {
            fields: ['OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'USERNAME', 'UDATE', 'UTIME', 'TCODE'],
            where,
            maxRows: 100000,
          });
          result.headers.push(...chunk.rows);
        } catch (err) {
          this.logger.warn(`CDHDR chunk ${yyyymm} failed: ${err.message}`);
        }
      }
      this._trackCoverage('CDHDR', 'extracted', { rowCount: result.headers.length });
    } catch (err) {
      this._trackCoverage('CDHDR', 'failed', { error: err.message });
    }

    // CDPOS — join with headers for relevant change numbers
    try {
      const changeNrs = [...new Set(result.headers.map(h => h.CHANGENR))].slice(0, 10000);
      if (changeNrs.length > 0) {
        const batch = changeNrs.slice(0, 100);
        const where = `CHANGENR IN ('${batch.join("','")}')`;
        const items = await this._readTable('CDPOS', {
          fields: ['OBJECTCLAS', 'OBJECTID', 'CHANGENR', 'TABNAME', 'FNAME', 'CHNGIND', 'VALUE_NEW', 'VALUE_OLD'],
          where,
          maxRows: 500000,
        });
        result.items = items.rows;
      }
      this._trackCoverage('CDPOS', 'extracted', { rowCount: result.items.length });
    } catch (err) {
      this._trackCoverage('CDPOS', 'failed', { error: err.message });
    }

    return result;
  }

  async _extractMock() {
    const mockData = {
      headers: [
        { OBJECTCLAS: 'VERKBELEG', OBJECTID: '0000500001', CHANGENR: '0000000001', USERNAME: 'JSMITH', UDATE: '20231015', UTIME: '143022', TCODE: 'VA01' },
        { OBJECTCLAS: 'VERKBELEG', OBJECTID: '0000500001', CHANGENR: '0000000002', USERNAME: 'JSMITH', UDATE: '20231016', UTIME: '091500', TCODE: 'VA02' },
        { OBJECTCLAS: 'EINKBELEG', OBJECTID: '4500000100', CHANGENR: '0000000003', USERNAME: 'KLEE', UDATE: '20231015', UTIME: '100000', TCODE: 'ME21N' },
        { OBJECTCLAS: 'EINKBELEG', OBJECTID: '4500000100', CHANGENR: '0000000004', USERNAME: 'KLEE', UDATE: '20231017', UTIME: '140000', TCODE: 'ME29N' },
        { OBJECTCLAS: 'DEBI', OBJECTID: '0000001000', CHANGENR: '0000000005', USERNAME: 'ADMIN', UDATE: '20231018', UTIME: '080000', TCODE: 'XD02' },
        { OBJECTCLAS: 'MATERIAL', OBJECTID: '000000000000100001', CHANGENR: '0000000006', USERNAME: 'MJONES', UDATE: '20231019', UTIME: '110000', TCODE: 'MM02' },
      ],
      items: [
        { OBJECTCLAS: 'VERKBELEG', OBJECTID: '0000500001', CHANGENR: '0000000001', TABNAME: 'VBAK', FNAME: 'AUART', CHNGIND: 'I', VALUE_NEW: 'OR', VALUE_OLD: '' },
        { OBJECTCLAS: 'VERKBELEG', OBJECTID: '0000500001', CHANGENR: '0000000002', TABNAME: 'VBAK', FNAME: 'NETWR', CHNGIND: 'U', VALUE_NEW: '15000.00', VALUE_OLD: '10000.00' },
        { OBJECTCLAS: 'EINKBELEG', OBJECTID: '4500000100', CHANGENR: '0000000003', TABNAME: 'EKKO', FNAME: 'BSART', CHNGIND: 'I', VALUE_NEW: 'NB', VALUE_OLD: '' },
        { OBJECTCLAS: 'EINKBELEG', OBJECTID: '4500000100', CHANGENR: '0000000004', TABNAME: 'EKKO', FNAME: 'FRGZU', CHNGIND: 'U', VALUE_NEW: 'X', VALUE_OLD: '' },
      ],
      objectClasses: [
        { OBJECT: 'VERKBELEG', OBTEXT: 'Sales Document' },
        { OBJECT: 'EINKBELEG', OBTEXT: 'Purchasing Document' },
        { OBJECT: 'DEBI', OBTEXT: 'Customer Master' },
        { OBJECT: 'MATERIAL', OBTEXT: 'Material Master' },
        { OBJECT: 'KRED', OBTEXT: 'Vendor Master' },
      ],
    };

    this._trackCoverage('CDHDR', 'extracted', { rowCount: mockData.headers.length });
    this._trackCoverage('CDPOS', 'extracted', { rowCount: mockData.items.length });
    this._trackCoverage('TCDOB', 'extracted', { rowCount: mockData.objectClasses.length });
    return mockData;
  }
}

ChangeDocumentExtractor._extractorId = 'CHANGE_DOCUMENTS';
ChangeDocumentExtractor._module = 'BASIS';
ChangeDocumentExtractor._category = 'process';
ExtractorRegistry.register(ChangeDocumentExtractor);

module.exports = ChangeDocumentExtractor;
