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
 * Profit Center Migration Object
 *
 * Migrates Profit Center master from ECC (CEPC/CEPCT)
 * to S/4HANA via API_PROFITCENTER_SRV.
 *
 * ~30 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class ProfitCenterMigrationObject extends BaseMigrationObject {
  get objectId() { return 'PROFIT_CENTER'; }
  get name() { return 'Profit Center'; }

  getFieldMappings() {
    return [
      { source: 'KOKRS', target: 'ControllingArea' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'DATBI', target: 'ValidityEndDate', convert: 'toDate' },
      { source: 'DATAB', target: 'ValidityStartDate', convert: 'toDate' },
      { source: 'KTEXT', target: 'ProfitCenterName' },
      { source: 'LTEXT', target: 'ProfitCenterLongText' },
      { source: 'VERAK', target: 'PersonResponsible' },
      { source: 'VERAK_USER', target: 'ResponsibleUser' },
      { source: 'WAESSION_RS', target: 'Currency' },
      { source: 'PCESSION_TYP', target: 'ProfitCenterType' },
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'SEGMENT', target: 'Segment' },
      { source: 'LAND1', target: 'Country', convert: 'toUpperCase' },
      { source: 'ANRED', target: 'Title' },
      { source: 'NAME1', target: 'Name' },
      { source: 'NAME2', target: 'Name2' },
      { source: 'ORT01', target: 'City' },
      { source: 'PSTLZ', target: 'PostalCode' },
      { source: 'REGIO', target: 'Region' },
      { source: 'STRAS', target: 'Street' },
      { source: 'TELF1', target: 'Phone' },
      { source: 'SPRAS', target: 'Language', convert: 'toUpperCase' },
      { source: 'LOCK_IND', target: 'IsLocked', convert: 'boolYN' },
      { source: 'KHINR', target: 'ProfitCenterHierarchyArea' },
      { source: 'GSBER', target: 'BusinessArea' },
      { source: 'FUNC_AREA', target: 'FunctionalArea' },
      { source: 'IN_CYCLE', target: 'InAllocationCycle', convert: 'boolYN' },
      { source: 'ERDAT', target: 'CreationDate', convert: 'toDate' },
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'PROFIT_CENTER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['ControllingArea', 'ProfitCenter', 'ProfitCenterName', 'ValidityStartDate'],
      exactDuplicate: { keys: ['ControllingArea', 'ProfitCenter', 'ValidityStartDate'] },
    };
  }

  _extractMock() {
    const records = [];
    const names = [
      'Americas Region', 'EMEA Region', 'APAC Region',
      'Product Line A', 'Product Line B', 'Product Line C',
      'Services Division', 'Digital Solutions', 'Aftermarket',
      'Corporate Functions',
    ];

    for (let i = 1; i <= 10; i++) {
      records.push({
        KOKRS: '1000',
        PRCTR: `PC${String(i).padStart(4, '0')}`,
        DATBI: '99991231',
        DATAB: '20200101',
        KTEXT: names[i - 1],
        LTEXT: `${names[i - 1]} - Profit Center`,
        VERAK: `Director ${i}`,
        VERAK_USER: `DIR${String(i).padStart(3, '0')}`,
        WAESSION_RS: 'USD',
        PCESSION_TYP: '',
        BUKRS: i <= 7 ? '1000' : '2000',
        SEGMENT: `SEG${Math.ceil(i / 3)}`,
        LAND1: i <= 3 ? 'US' : i <= 6 ? 'DE' : 'JP',
        ANRED: '',
        NAME1: names[i - 1],
        NAME2: '',
        ORT01: i <= 3 ? 'New York' : i <= 6 ? 'Frankfurt' : 'Tokyo',
        PSTLZ: i <= 3 ? '10001' : i <= 6 ? '60311' : '100-0001',
        REGIO: i <= 3 ? 'NY' : '',
        STRAS: `${i * 10} Business Park`,
        TELF1: `+1-555-${String(2000 + i)}`,
        SPRAS: 'EN',
        LOCK_IND: '',
        KHINR: 'H1',
        GSBER: 'BU01',
        FUNC_AREA: 'FA01',
        IN_CYCLE: i <= 5 ? 'X' : '',
        ERDAT: '20200101',
      });
    }

    return records;
  }
}

module.exports = ProfitCenterMigrationObject;
