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
 * Infor M3 Vendor Migration Object
 *
 * Migrates Vendor/Supplier Master from M3 (CIDVEN)
 * to S/4HANA Business Partner (BUT000) with vendor/supplier role,
 * plus LFA1 purchasing data.
 *
 * M3 CIDVEN uses II prefix for supplier fields:
 *   IISUNO — supplier number
 *   IISUNM — supplier name
 *   IIPYNO — payment reference / terms
 *
 * ~30 field mappings covering general, address, purchasing, and banking data.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforM3VendorMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_M3_VENDOR'; }
  get name() { return 'Infor M3 Vendor'; }

  getFieldMappings() {
    return [
      // ── General vendor data (CIDVEN II prefix) — 10 ──────────
      { source: 'IISUNO', target: 'BUT000-PARTNER', convert: 'padLeft10' },
      { source: 'IISUNM', target: 'BUT000-NAME_ORG1' },
      { source: 'IISUN2', target: 'BUT000-NAME_ORG2' },
      { source: 'IIPYNO', target: 'LFA1-ZTERM', valueMap: { '0': '0001', '1': '0010', '2': '0030', '3': '0045', '4': '0060' } },
      { source: 'IISUTY', target: 'LFA1-KTOKK', valueMap: { '0': 'KRED', '1': 'LIEF', '2': 'DLNR' } },
      { source: 'IILNCD', target: 'BUT000-BU_LANGU', convert: 'toUpperCase' },
      { source: 'IISTAT', target: 'BUT000-XDELE', valueMap: { '20': '', '90': 'X' } },
      { source: 'IIRGDT', target: 'BUT000-CRDAT', convert: 'toDate' },
      { source: 'IILMDT', target: 'BUT000-CHDAT', convert: 'toDate' },
      { source: 'IIORTP', target: 'LFA1-SORTL', convert: 'toUpperCase' },

      // ── Address data — 10 ───────────────────────────────────
      { source: 'IISUA1', target: 'ADDR-STREET' },
      { source: 'IISUA2', target: 'ADDR-STR_SUPPL1' },
      { source: 'IISUA3', target: 'ADDR-STR_SUPPL2' },
      { source: 'IITOWN', target: 'ADDR-CITY1' },
      { source: 'IIECAR', target: 'ADDR-REGION' },
      { source: 'IIPONO', target: 'ADDR-POST_CODE1' },
      { source: 'IICSCD', target: 'ADDR-COUNTRY', convert: 'toUpperCase' },
      { source: 'IIPHNO', target: 'ADDR-TEL_NUMBER' },
      { source: 'IITFNO', target: 'ADDR-FAX_NUMBER' },
      { source: 'IIEMAL', target: 'ADDR-SMTP_ADDR' },

      // ── Purchasing data — 6 ─────────────────────────────────
      { source: 'IIBUYE', target: 'LFM1-EKGRP' },
      { source: 'IISUCO', target: 'LFA1-LAND1', convert: 'toUpperCase' },
      { source: 'IICUCD', target: 'LFB1-WAERS' },
      { source: 'IIFRE1', target: 'LFM1-INCO1' },
      { source: 'IIFRE2', target: 'LFM1-INCO2' },
      { source: 'IISUBL', target: 'LFA1-SPERR', valueMap: { '0': '', '1': 'X', '2': 'X' } },

      // ── Banking data — 4 ────────────────────────────────────
      { source: 'IIBKNO', target: 'LFBK-BANKN' },
      { source: 'IISWCD', target: 'LFBK-SWIFT' },
      { source: 'IIIBAN', target: 'LFBK-IBAN' },
      { source: 'IIBKAC', target: 'LFBK-KOINH' },

      // ── Tax and quality — 4 ─────────────────────────────────
      { source: 'IIVRNO', target: 'LFA1-STCD1' },
      { source: 'IITXAP', target: 'LFA1-TXKRS' },
      { source: 'IIQUCL', target: 'LFA1-QSSYS' },
      { source: 'IIABCD', target: 'LFM1-WEBRE', valueMap: { 'Y': 'X', 'N': '' } },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_M3' },
      { target: 'MigrationObjectId', default: 'INFOR_M3_VENDOR' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['BUT000-PARTNER', 'BUT000-NAME_ORG1', 'ADDR-COUNTRY'],
      exactDuplicate: { keys: ['BUT000-PARTNER'] },
      fuzzyDuplicate: { keys: ['BUT000-NAME_ORG1', 'ADDR-CITY1'], threshold: 0.85 },
    };
  }

  _extractMock() {
    const records = [];
    const supplierTypes = ['0', '1', '2'];
    const payTerms = ['0', '1', '2', '3', '4'];
    const countries = ['US', 'CN', 'DE', 'MX', 'IN', 'JP', 'KR', 'TW'];
    const cities = [
      'Detroit', 'Shenzhen', 'Stuttgart', 'Monterrey',
      'Mumbai', 'Osaka', 'Seoul', 'Taipei',
    ];
    const regions = ['MI', 'GD', 'BW', 'NL', 'MH', 'OSK', 'SE', 'TPE'];
    const currencies = ['USD', 'CNY', 'EUR', 'MXN', 'INR', 'JPY', 'KRW', 'TWD'];
    const incoterms = ['FOB', 'CIF', 'EXW', 'DDP', 'FCA'];

    for (let i = 1; i <= 8; i++) {
      const ci = (i - 1) % 8;
      records.push({
        // General
        IISUNO: `M3V${String(i).padStart(5, '0')}`,
        IISUNM: `M3 Supplier Industries ${i}`,
        IISUN2: i % 3 === 0 ? `Div. ${i}` : '',
        IIPYNO: payTerms[(i - 1) % 5],
        IISUTY: supplierTypes[(i - 1) % 3],
        IILNCD: 'EN',
        IISTAT: i === 8 ? '90' : '20',
        IIRGDT: '20170801',
        IILMDT: '20240201',
        IIORTP: `M3VND${String(i).padStart(3, '0')}`,

        // Address
        IISUA1: `${200 + i * 5} Industrial Pkwy`,
        IISUA2: i % 3 === 0 ? `Building ${i}` : '',
        IISUA3: '',
        IITOWN: cities[ci],
        IIECAR: regions[ci],
        IIPONO: `${String(20000 + i * 222)}`,
        IICSCD: countries[ci],
        IIPHNO: `+1-555-${String(3000 + i).padStart(4, '0')}`,
        IITFNO: i % 4 === 0 ? `+1-555-${String(4000 + i).padStart(4, '0')}` : '',
        IIEMAL: `procurement@m3supplier${i}.com`,

        // Purchasing
        IIBUYE: `BY${String((i - 1) % 4 + 1).padStart(2, '0')}`,
        IISUCO: countries[ci],
        IICUCD: currencies[ci],
        IIFRE1: incoterms[(i - 1) % 5],
        IIFRE2: cities[ci],
        IISUBL: i === 8 ? '1' : '0',

        // Banking
        IIBKNO: `${String(100000000 + i * 111111)}`,
        IISWCD: i % 2 === 0 ? 'DEUTDEFF' : 'CHASUS33',
        IIIBAN: countries[ci] === 'DE' ? `DE${String(10000000000 + i)}` : '',
        IIBKAC: `M3 Supplier Industries ${i}`,

        // Tax and quality
        IIVRNO: `TX${countries[ci]}${String(200000 + i)}`,
        IITXAP: i % 3 === 0 ? '1' : '0',
        IIQUCL: i % 2 === 0 ? 'ISO9001' : '',
        IIABCD: i % 2 === 0 ? 'Y' : 'N',
      });
    }

    return records; // 8 vendors
  }
}

module.exports = InforM3VendorMigrationObject;
