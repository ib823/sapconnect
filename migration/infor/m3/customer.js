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
 * Infor M3 Customer Migration Object
 *
 * Migrates Customer Master from M3 (OCUSMA / CIDMAS)
 * to S/4HANA Business Partner (BUT000) with customer role,
 * plus addresses and bank details.
 *
 * M3 CIDMAS uses OK prefix for customer fields:
 *   OKCUNO — customer number
 *   OKCUNM — customer name
 *   OKYRNO — tax registration number
 *   OKCUTP — customer type / group
 *
 * ~30 field mappings covering general, address, financial, and sales data.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforM3CustomerMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_M3_CUSTOMER'; }
  get name() { return 'Infor M3 Customer'; }

  getFieldMappings() {
    return [
      // ── General customer data (CIDMAS OK prefix) — 10 ────────
      { source: 'OKCUNO', target: 'BUT000-PARTNER', convert: 'padLeft10' },
      { source: 'OKCUNM', target: 'BUT000-NAME_ORG1' },
      { source: 'OKCUN2', target: 'BUT000-NAME_ORG2' },
      { source: 'OKYRNO', target: 'KNA1-STCD1' },
      { source: 'OKCUTP', target: 'KNVV-KDGRP', valueMap: { '0': '01', '1': '02', '2': '03', '3': '04', '4': '05' } },
      { source: 'OKLNCD', target: 'BUT000-BU_LANGU', convert: 'toUpperCase' },
      { source: 'OKSTAT', target: 'BUT000-XDELE', valueMap: { '20': '', '90': 'X' } },
      { source: 'OKRGDT', target: 'BUT000-CRDAT', convert: 'toDate' },
      { source: 'OKLMDT', target: 'BUT000-CHDAT', convert: 'toDate' },
      { source: 'OKSORT', target: 'KNA1-SORTL', convert: 'toUpperCase' },

      // ── Address data — 10 ───────────────────────────────────
      { source: 'OKCUA1', target: 'ADDR-STREET' },
      { source: 'OKCUA2', target: 'ADDR-STR_SUPPL1' },
      { source: 'OKCUA3', target: 'ADDR-STR_SUPPL2' },
      { source: 'OKTOWN', target: 'ADDR-CITY1' },
      { source: 'OKECAR', target: 'ADDR-REGION' },
      { source: 'OKPONO', target: 'ADDR-POST_CODE1' },
      { source: 'OKCSCD', target: 'ADDR-COUNTRY', convert: 'toUpperCase' },
      { source: 'OKPHNO', target: 'ADDR-TEL_NUMBER' },
      { source: 'OKTFNO', target: 'ADDR-FAX_NUMBER' },
      { source: 'OKEMAL', target: 'ADDR-SMTP_ADDR' },

      // ── Financial data — 6 ──────────────────────────────────
      { source: 'OKCUCD', target: 'KNVV-WAERS' },
      { source: 'OKTEPY', target: 'KNB1-ZTERM', valueMap: { '0': '0001', '1': '0010', '2': '0030', '3': '0045', '4': '0060' } },
      { source: 'OKPYCD', target: 'KNB1-ZWELS' },
      { source: 'OKCRL1', target: 'KNB1-CRBLB', convert: 'toDecimal' },
      { source: 'OKBLCD', target: 'KNB1-SPERR', valueMap: { '0': '', '1': 'X', '2': 'X' } },
      { source: 'OKTXAP', target: 'KNVI-TAXKD' },

      // ── Sales / distribution — 6 ────────────────────────────
      { source: 'OKSMCD', target: 'KNVV-VKBUR' },
      { source: 'OKSDST', target: 'KNVV-BZIRK' },
      { source: 'OKFRE1', target: 'KNVV-INCO1' },
      { source: 'OKFRE2', target: 'KNVV-INCO2' },
      { source: 'OKPRIR', target: 'KNVV-LPRIO', convert: 'toInteger' },
      { source: 'OKDISY', target: 'KNVV-VTWEG' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_M3' },
      { target: 'MigrationObjectId', default: 'INFOR_M3_CUSTOMER' },
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
    const customerTypes = ['0', '1', '2', '3', '4'];
    const payTerms = ['0', '1', '2', '3', '4'];
    const countries = ['US', 'US', 'CA', 'GB', 'DE', 'US', 'FR', 'US', 'AU', 'JP'];
    const cities = [
      'New York', 'Chicago', 'Toronto', 'London', 'Munich',
      'Los Angeles', 'Paris', 'Houston', 'Sydney', 'Tokyo',
    ];
    const regions = ['NY', 'IL', 'ON', 'LDN', 'BY', 'CA', 'IDF', 'TX', 'NSW', 'TK'];
    const currencies = ['USD', 'USD', 'CAD', 'GBP', 'EUR', 'USD', 'EUR', 'USD', 'AUD', 'JPY'];
    const incoterms = ['FOB', 'CIF', 'EXW', 'DDP', 'DAP'];

    for (let i = 1; i <= 10; i++) {
      const ci = (i - 1) % 10;
      records.push({
        // General
        OKCUNO: `M3C${String(i).padStart(5, '0')}`,
        OKCUNM: `M3 Customer Corp ${i}`,
        OKCUN2: i % 3 === 0 ? `Division ${i}` : '',
        OKYRNO: `TX${countries[ci]}${String(100000 + i)}`,
        OKCUTP: customerTypes[(i - 1) % 5],
        OKLNCD: 'EN',
        OKSTAT: i === 10 ? '90' : '20',
        OKRGDT: '20180601',
        OKLMDT: '20240115',
        OKSORT: `M3CUST${String(i).padStart(3, '0')}`,

        // Address
        OKCUA1: `${100 + i * 10} Commerce Blvd`,
        OKCUA2: i % 4 === 0 ? `Suite ${i * 100}` : '',
        OKCUA3: '',
        OKTOWN: cities[ci],
        OKECAR: regions[ci],
        OKPONO: `${String(10000 + i * 111)}`,
        OKCSCD: countries[ci],
        OKPHNO: `+1-555-${String(1000 + i).padStart(4, '0')}`,
        OKTFNO: i % 3 === 0 ? `+1-555-${String(2000 + i).padStart(4, '0')}` : '',
        OKEMAL: `contact@m3customer${i}.com`,

        // Financial
        OKCUCD: currencies[ci],
        OKTEPY: payTerms[(i - 1) % 5],
        OKPYCD: i % 2 === 0 ? 'CHK' : 'TRF',
        OKCRL1: String(Math.floor(Math.random() * 500000 + 10000)),
        OKBLCD: i === 10 ? '1' : '0',
        OKTXAP: i % 3 === 0 ? '1' : '0',

        // Sales
        OKSMCD: `SM${String((i - 1) % 3 + 1).padStart(2, '0')}`,
        OKSDST: `DS${String((i - 1) % 5 + 1).padStart(2, '0')}`,
        OKFRE1: incoterms[(i - 1) % 5],
        OKFRE2: cities[ci],
        OKPRIR: String((i - 1) % 5 + 1),
        OKDISY: `${String((i - 1) % 3 + 1).padStart(2, '0')}`,
      });
    }

    return records; // 10 customers
  }
}

module.exports = InforM3CustomerMigrationObject;
