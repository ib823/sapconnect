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
 * Infor LN Cost Center Migration Object
 *
 * Migrates LN Cost Centers (tcmcs065) to SAP Cost Center
 * (CSKS/CSKT).
 *
 * Key transforms:
 * - Cost center (cctr) maps to CSKS-KOSTL
 * - Cost center group maps to CSKS-KOSAR
 * - Responsible person maps to CSKS-VERAK
 *
 * ~14 field mappings. Mock: 12 cost centers.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforLNCostCenterMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_LN_COST_CENTER'; }
  get name() { return 'LN Cost Center to SAP Cost Center'; }

  getFieldMappings() {
    return [
      // ── Cost center master (CSKS) ─────────────────────────────
      { source: 'cctr', target: 'CSKS-KOSTL', convert: 'padLeft10' },
      { source: 'kokrs', target: 'CSKS-KOKRS' },
      { source: 'desc', target: 'CSKT-KTEXT' },
      { source: 'desc_long', target: 'CSKT-LTEXT' },
      { source: 'fcmp', target: 'CSKS-BUKRS' },
      { source: 'ccgrp', target: 'CSKS-KOSAR' },
      { source: 'hctr', target: 'CSKS-KHINR' },
      { source: 'resp', target: 'CSKS-VERAK' },
      { source: 'curr', target: 'CSKS-WAERS' },
      { source: 'efdt', target: 'CSKS-DATAB', convert: 'toDate' },
      { source: 'exdt', target: 'CSKS-DATBI', convert: 'toDate' },
      { source: 'lnge', target: 'CSKT-SPRAS', default: 'EN' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_LN' },
      { target: 'MigrationObjectId', default: 'INFOR_LN_COST_CENTER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['CSKS-KOSTL', 'CSKS-KOKRS', 'CSKT-KTEXT', 'CSKS-BUKRS'],
      exactDuplicate: { keys: ['CSKS-KOSTL', 'CSKS-KOKRS'] },
    };
  }

  _extractMock() {
    const centers = [
      { cctr: 'CC01', desc: 'Production Department', ccgrp: 'PROD', hctr: 'HCC-MFG', resp: 'J.Smith' },
      { cctr: 'CC02', desc: 'Materials Management', ccgrp: 'PROD', hctr: 'HCC-MFG', resp: 'R.Johnson' },
      { cctr: 'CC03', desc: 'Human Resources', ccgrp: 'ADMIN', hctr: 'HCC-ADM', resp: 'L.Williams' },
      { cctr: 'CC04', desc: 'Finance and Accounting', ccgrp: 'ADMIN', hctr: 'HCC-ADM', resp: 'M.Brown' },
      { cctr: 'CC05', desc: 'Asset Management', ccgrp: 'ADMIN', hctr: 'HCC-ADM', resp: 'K.Davis' },
      { cctr: 'CC06', desc: 'Quality Control', ccgrp: 'PROD', hctr: 'HCC-MFG', resp: 'P.Garcia' },
      { cctr: 'CC07', desc: 'Sales Domestic', ccgrp: 'SALES', hctr: 'HCC-SLS', resp: 'T.Miller' },
      { cctr: 'CC08', desc: 'Sales Export', ccgrp: 'SALES', hctr: 'HCC-SLS', resp: 'A.Wilson' },
      { cctr: 'CC09', desc: 'IT Department', ccgrp: 'ADMIN', hctr: 'HCC-ADM', resp: 'D.Anderson' },
      { cctr: 'CC10', desc: 'Maintenance', ccgrp: 'PROD', hctr: 'HCC-MFG', resp: 'S.Taylor' },
      { cctr: 'CC11', desc: 'Research and Development', ccgrp: 'RND', hctr: 'HCC-RND', resp: 'C.Thomas' },
      { cctr: 'CC12', desc: 'Logistics and Shipping', ccgrp: 'PROD', hctr: 'HCC-MFG', resp: 'E.Jackson' },
    ];

    return centers.map(c => ({
      cctr: c.cctr,
      kokrs: '1000',
      desc: c.desc,
      desc_long: `${c.desc} - LN Cost Center`,
      fcmp: '100',
      ccgrp: c.ccgrp,
      hctr: c.hctr,
      resp: c.resp,
      curr: 'USD',
      efdt: '20200101',
      exdt: '99991231',
      lnge: 'EN',
    }));
  }
}

module.exports = InforLNCostCenterMigrationObject;
