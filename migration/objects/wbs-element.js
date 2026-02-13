/**
 * WBS Element Migration Object
 *
 * Migrates Work Breakdown Structure elements from ECC (PRPS/PROJ)
 * to S/4HANA via API_PROJECT_V2.
 *
 * ~45 field mappings. Includes project definition (PROJ) and WBS elements (PRPS).
 */

const BaseMigrationObject = require('./base-migration-object');

class WBSElementMigrationObject extends BaseMigrationObject {
  get objectId() { return 'WBS_ELEMENT'; }
  get name() { return 'WBS Element'; }

  getFieldMappings() {
    return [
      // ── Project definition fields ──────────────────────────
      { source: 'PSPNR', target: 'ProjectElement' },
      { source: 'PSPID', target: 'ProjectDefinition' },
      { source: 'POST1', target: 'ProjectDescription' },
      { source: 'VERNR', target: 'PersonResponsible' },
      { source: 'VERNA', target: 'ApplicantName' },
      { source: 'ASTNA', target: 'RequesterName' },
      { source: 'PROFL', target: 'ProjectProfile' },
      { source: 'PRESSION_ART', target: 'ProjectType' },

      // ── WBS element master ─────────────────────────────────
      { source: 'POSID', target: 'WBSElement' },
      { source: 'POSID_EDIT', target: 'WBSElementExternalID' },
      { source: 'POST1_WBS', target: 'WBSDescription' },
      { source: 'STUFE', target: 'WBSLevel', convert: 'toInteger' },
      { source: 'ABOVE', target: 'WBSElementParent' },
      { source: 'LEFT_POS', target: 'LeftSibling' },
      { source: 'PSPHI', target: 'ProjectDefinitionInternal' },
      { source: 'PBUKR', target: 'CompanyCode' },
      { source: 'PGSBR', target: 'BusinessArea' },
      { source: 'PKOKRS', target: 'ControllingArea' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'FESSION_AREA', target: 'FunctionalArea' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'STORT', target: 'Location' },

      // ── Dates ──────────────────────────────────────────────
      { source: 'PLFAZ', target: 'PlannedStartDate', convert: 'toDate' },
      { source: 'PLSEZ', target: 'PlannedEndDate', convert: 'toDate' },
      { source: 'ISTAZ', target: 'ActualStartDate', convert: 'toDate' },
      { source: 'ISZAZ', target: 'ActualEndDate', convert: 'toDate' },

      // ── Status / Control ───────────────────────────────────
      { source: 'BELKZ', target: 'AccountAssignmentElement', convert: 'boolYN' },
      { source: 'PLESSION_KZ', target: 'PlanningElement', convert: 'boolYN' },
      { source: 'FESSION_KZ', target: 'BillingElement', convert: 'boolYN' },
      { source: 'STESSION_AT', target: 'SystemStatus' },
      { source: 'USESSION_TAT', target: 'UserStatus' },
      { source: 'LOEVM', target: 'IsDeleted', convert: 'boolYN' },

      // ── Financial ──────────────────────────────────────────
      { source: 'WAESSION_RS', target: 'Currency' },
      { source: 'PRESSION_OG', target: 'InvestmentProgram' },
      { source: 'IZWEK', target: 'InvestmentReason' },
      { source: 'ESSION_KGRP', target: 'StatisticalKeyFigureGroup' },
      { source: 'TAESSION_KZ', target: 'TaxJurisdiction' },

      // ── Organization ───────────────────────────────────────
      { source: 'USR00', target: 'UserField1' },
      { source: 'USR01', target: 'UserField2' },
      { source: 'USR02', target: 'UserField3' },
      { source: 'USR03', target: 'UserField4' },
      { source: 'SCOPE', target: 'ProjectScope' },

      // ── Metadata ───────────────────────────────────────────
      { source: 'ERDAT', target: 'CreationDate', convert: 'toDate' },
      { source: 'ERNAM', target: 'CreatedByUser' },
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'WBS_ELEMENT' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['WBSElement', 'WBSDescription', 'CompanyCode', 'ControllingArea'],
      exactDuplicate: { keys: ['WBSElement'] },
      range: [
        { field: 'WBSLevel', min: 1, max: 10 },
      ],
    };
  }

  _extractMock() {
    const records = [];
    const projects = [
      { id: 'P-2024-001', name: 'ERP Migration Program', profile: 'ZPROJ1' },
      { id: 'P-2024-002', name: 'New Plant Construction', profile: 'ZPROJ2' },
      { id: 'P-2024-003', name: 'Product Development Alpha', profile: 'ZPROJ1' },
    ];

    const wbsStructure = [
      // Project 1 WBS
      { posid: 'P-2024-001.01', desc: 'Assessment Phase', level: 2, above: 'P-2024-001', proj: 0 },
      { posid: 'P-2024-001.02', desc: 'Design Phase', level: 2, above: 'P-2024-001', proj: 0 },
      { posid: 'P-2024-001.02.01', desc: 'Technical Design', level: 3, above: 'P-2024-001.02', proj: 0 },
      { posid: 'P-2024-001.02.02', desc: 'Functional Design', level: 3, above: 'P-2024-001.02', proj: 0 },
      { posid: 'P-2024-001.03', desc: 'Build Phase', level: 2, above: 'P-2024-001', proj: 0 },
      { posid: 'P-2024-001.04', desc: 'Test & Go-Live', level: 2, above: 'P-2024-001', proj: 0 },
      // Project 2 WBS
      { posid: 'P-2024-002.01', desc: 'Site Preparation', level: 2, above: 'P-2024-002', proj: 1 },
      { posid: 'P-2024-002.02', desc: 'Foundation Work', level: 2, above: 'P-2024-002', proj: 1 },
      { posid: 'P-2024-002.03', desc: 'Structure Build', level: 2, above: 'P-2024-002', proj: 1 },
      { posid: 'P-2024-002.03.01', desc: 'Steel Framework', level: 3, above: 'P-2024-002.03', proj: 1 },
      { posid: 'P-2024-002.03.02', desc: 'Concrete & Walls', level: 3, above: 'P-2024-002.03', proj: 1 },
      { posid: 'P-2024-002.04', desc: 'Equipment Install', level: 2, above: 'P-2024-002', proj: 1 },
      // Project 3 WBS
      { posid: 'P-2024-003.01', desc: 'Concept Design', level: 2, above: 'P-2024-003', proj: 2 },
      { posid: 'P-2024-003.02', desc: 'Prototyping', level: 2, above: 'P-2024-003', proj: 2 },
      { posid: 'P-2024-003.03', desc: 'Testing & Certification', level: 2, above: 'P-2024-003', proj: 2 },
    ];

    // Level 1 entries (project definitions as WBS root)
    for (let p = 0; p < projects.length; p++) {
      const proj = projects[p];
      records.push({
        PSPNR: String(10000 + p + 1),
        PSPID: proj.id,
        POST1: proj.name,
        VERNR: `PM${p + 1}`,
        VERNA: `Project Manager ${p + 1}`,
        ASTNA: 'Sponsor',
        PROFL: proj.profile,
        PRESSION_ART: 'IT',
        POSID: proj.id,
        POSID_EDIT: proj.id,
        POST1_WBS: proj.name,
        STUFE: 1,
        ABOVE: '',
        LEFT_POS: '',
        PSPHI: String(10000 + p + 1),
        PBUKR: '1000',
        PGSBR: 'BU01',
        PKOKRS: '1000',
        PRCTR: `PC${String(p + 1).padStart(4, '0')}`,
        FESSION_AREA: 'FA01',
        WERKS: '1000',
        STORT: '',
        PLFAZ: '20240101',
        PLSEZ: '20251231',
        ISTAZ: '20240115',
        ISZAZ: '',
        BELKZ: 'X',
        PLESSION_KZ: 'X',
        FESSION_KZ: '',
        STESSION_AT: 'I0001 I0002',
        USESSION_TAT: '',
        LOEVM: '',
        WAESSION_RS: 'USD',
        PRESSION_OG: '',
        IZWEK: '',
        ESSION_KGRP: '',
        TAESSION_KZ: '',
        USR00: '',
        USR01: '',
        USR02: '',
        USR03: '',
        SCOPE: '',
        ERDAT: '20240101',
        ERNAM: 'ADMIN',
      });
    }

    // WBS child elements
    for (const wbs of wbsStructure) {
      const proj = projects[wbs.proj];
      records.push({
        PSPNR: String(20000 + records.length),
        PSPID: proj.id,
        POST1: proj.name,
        VERNR: `PM${wbs.proj + 1}`,
        VERNA: '',
        ASTNA: '',
        PROFL: proj.profile,
        PRESSION_ART: 'IT',
        POSID: wbs.posid,
        POSID_EDIT: wbs.posid,
        POST1_WBS: wbs.desc,
        STUFE: wbs.level,
        ABOVE: wbs.above,
        LEFT_POS: '',
        PSPHI: String(10000 + wbs.proj + 1),
        PBUKR: '1000',
        PGSBR: 'BU01',
        PKOKRS: '1000',
        PRCTR: `PC${String(wbs.proj + 1).padStart(4, '0')}`,
        FESSION_AREA: 'FA01',
        WERKS: '1000',
        STORT: '',
        PLFAZ: '20240201',
        PLSEZ: '20251130',
        ISTAZ: wbs.level === 2 ? '20240215' : '',
        ISZAZ: '',
        BELKZ: 'X',
        PLESSION_KZ: 'X',
        FESSION_KZ: wbs.level === 2 ? 'X' : '',
        STESSION_AT: 'I0001 I0002',
        USESSION_TAT: '',
        LOEVM: '',
        WAESSION_RS: 'USD',
        PRESSION_OG: '',
        IZWEK: '',
        ESSION_KGRP: '',
        TAESSION_KZ: '',
        USR00: '',
        USR01: '',
        USR02: '',
        USR03: '',
        SCOPE: '',
        ERDAT: '20240101',
        ERNAM: 'ADMIN',
      });
    }

    return records; // 3 projects + 15 WBS elements = 18 records
  }
}

module.exports = WBSElementMigrationObject;
