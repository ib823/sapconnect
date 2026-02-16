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
 * Cost Center Migration Object
 *
 * Migrates Cost Center master from ECC (CSKS/CSKT)
 * to S/4HANA via API_COSTCENTER_SRV.
 *
 * ~35 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class CostCenterMigrationObject extends BaseMigrationObject {
  get objectId() { return 'COST_CENTER'; }
  get name() { return 'Cost Center'; }

  getFieldMappings() {
    return [
      { source: 'KOKRS', target: 'ControllingArea' },
      { source: 'KOSTL', target: 'CostCenter', convert: 'padLeft10' },
      { source: 'DATBI', target: 'ValidityEndDate', convert: 'toDate' },
      { source: 'DATAB', target: 'ValidityStartDate', convert: 'toDate' },
      { source: 'KTEXT', target: 'CostCenterName' },
      { source: 'LTEXT', target: 'CostCenterDescription' },
      { source: 'VERAK', target: 'PersonResponsible' },
      { source: 'VERAK_USER', target: 'ResponsibleUser' },
      { source: 'KOSAR', target: 'CostCenterCategory' },
      { source: 'KHINR', target: 'CostCenterHierarchyArea' },
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'GSBER', target: 'BusinessArea' },
      { source: 'FUNC_AREA', target: 'FunctionalArea' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'LAND1', target: 'Country', convert: 'toUpperCase' },
      { source: 'ANRED', target: 'Title' },
      { source: 'NAME1', target: 'Name' },
      { source: 'NAME2', target: 'Name2' },
      { source: 'NAME3', target: 'Name3' },
      { source: 'NAME4', target: 'Name4' },
      { source: 'ORT01', target: 'City' },
      { source: 'PSTLZ', target: 'PostalCode' },
      { source: 'REGIO', target: 'Region' },
      { source: 'STRAS', target: 'Street' },
      { source: 'TELF1', target: 'Phone' },
      { source: 'TELFX', target: 'Fax' },
      { source: 'WAESSION_RS', target: 'Currency' },
      { source: 'SPRAS', target: 'Language', convert: 'toUpperCase' },
      { source: 'BESSION_KRS', target: 'LockIndicator', convert: 'boolYN' },
      { source: 'PKZKP', target: 'ActualPrimaryPostingCCtr' },
      { source: 'PKZSE', target: 'ActualSecondaryPostingCCtr' },
      { source: 'PKZRV', target: 'ActualRevenueCCtr' },
      { source: 'SEGMENT', target: 'Segment' },
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'COST_CENTER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['ControllingArea', 'CostCenter', 'CostCenterName', 'ValidityStartDate'],
      exactDuplicate: { keys: ['ControllingArea', 'CostCenter', 'ValidityStartDate'] },
    };
  }

  _extractMock() {
    const records = [];
    const categories = ['E', 'F', 'H', 'L', 'P']; // Production, Admin, Mgmt, Logistics, Project
    const names = [
      'Production Line 1', 'Production Line 2', 'Administration', 'Finance Dept',
      'Human Resources', 'IT Department', 'Sales Domestic', 'Sales Export',
      'Warehouse Ops', 'Quality Control', 'R&D Lab', 'Maintenance',
      'Executive Office', 'Legal Department', 'Marketing', 'Customer Service',
      'Procurement', 'Engineering', 'Facilities', 'Training Center',
    ];

    for (let i = 1; i <= 20; i++) {
      records.push({
        KOKRS: '1000',
        KOSTL: `CC${String(i).padStart(4, '0')}`,
        DATBI: '99991231',
        DATAB: '20200101',
        KTEXT: names[i - 1],
        LTEXT: `${names[i - 1]} - Company 1000`,
        VERAK: `Manager ${i}`,
        VERAK_USER: `MGR${String(i).padStart(3, '0')}`,
        KOSAR: categories[(i - 1) % 5],
        KHINR: 'H1',
        BUKRS: i <= 15 ? '1000' : '2000',
        GSBER: 'BU01',
        FUNC_AREA: `FA${String(((i - 1) % 4) + 1).padStart(2, '0')}`,
        PRCTR: `PC${String(((i - 1) % 5) + 1).padStart(4, '0')}`,
        WERKS: i <= 10 ? '1000' : '2000',
        LAND1: 'US',
        ANRED: '',
        NAME1: names[i - 1],
        NAME2: '',
        NAME3: '',
        NAME4: '',
        ORT01: i <= 10 ? 'New York' : 'Chicago',
        PSTLZ: i <= 10 ? '10001' : '60601',
        REGIO: i <= 10 ? 'NY' : 'IL',
        STRAS: `${100 + i} Corporate Blvd`,
        TELF1: `555-${String(1000 + i)}`,
        TELFX: '',
        WAESSION_RS: 'USD',
        SPRAS: 'EN',
        BESSION_KRS: '',
        PKZKP: 'X',
        PKZSE: 'X',
        PKZRV: i <= 5 ? '' : 'X',
        SEGMENT: 'SEG1',
      });
    }

    return records;
  }
}

module.exports = CostCenterMigrationObject;
