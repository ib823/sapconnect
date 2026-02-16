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
 * BW Extractor Migration Object
 *
 * Inventories and assesses BW data sources / extractors for
 * S/4HANA compatibility. Classifies each extractor as:
 * - keep: compatible, no changes needed
 * - replace-with-cds: replace with CDS-based extraction
 * - update: needs field/logic updates for S/4 data model
 * - decommission: source tables removed in S/4HANA
 *
 * ~30 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class BWExtractorMigrationObject extends BaseMigrationObject {
  get objectId() { return 'BW_EXTRACTOR'; }
  get name() { return 'BW Extractor'; }

  getFieldMappings() {
    return [
      { source: 'DATASOURCE', target: 'DataSource' },
      { source: 'DS_DESC', target: 'DataSourceDescription' },
      { source: 'APPL_COMP', target: 'ApplicationComponent' },
      { source: 'DS_TYPE', target: 'DataSourceType' },
      { source: 'EXTRACT_TYPE', target: 'ExtractionType' },
      { source: 'SOURCE_TABLE', target: 'SourceTable' },
      { source: 'DELTA_TYPE', target: 'DeltaType' },
      { source: 'DELTA_FIELD', target: 'DeltaField' },
      // Target BW objects
      { source: 'INFOSOURCE', target: 'InfoSource' },
      { source: 'DTP_ID', target: 'DataTransferProcess' },
      { source: 'TARGET_OBJ', target: 'TargetObject' },
      { source: 'TARGET_TYPE', target: 'TargetObjectType' },
      // Usage metrics
      { source: 'LAST_EXEC', target: 'LastExecution', convert: 'toDate' },
      { source: 'EXEC_COUNT', target: 'ExecutionCount', convert: 'toInteger' },
      { source: 'AVG_RECORDS', target: 'AvgRecordsPerLoad', convert: 'toInteger' },
      { source: 'AVG_DURATION', target: 'AvgDurationMin', convert: 'toDecimal' },
      // Assessment
      { source: 'MIGRATION_ACTION', target: 'MigrationAction' },
      { source: 'REPLACEMENT_DS', target: 'ReplacementDataSource' },
      { source: 'IMPACT', target: 'ImpactLevel' },
      { source: 'AFFECTED_TABLES', target: 'AffectedTables' },
      { source: 'NOTES', target: 'Notes' },
      // Custom indicator
      { source: 'IS_CUSTOM', target: 'IsCustomExtractor', convert: 'boolYN' },
      { source: 'CUSTOM_FM', target: 'CustomFunctionModule' },
      // Status
      { source: 'STATUS', target: 'AssessmentStatus' },
      { source: 'PRIORITY', target: 'MigrationPriority' },
      // Metadata
      { target: 'SourceSystem', default: 'BW' },
      { target: 'MigrationObjectId', default: 'BW_EXTRACTOR' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['DataSource', 'ApplicationComponent', 'MigrationAction'],
      exactDuplicate: { keys: ['DataSource'] },
    };
  }

  _classifyExtractor(ds) {
    const name = ds.DATASOURCE || '';
    const table = ds.SOURCE_TABLE || '';

    // FI extractors sourcing from removed tables
    if (/^0FI_(GL|AR|AP|AA)_/.test(name)) {
      return { action: 'replace-with-cds', replacement: name.replace(/^0FI_/, 'I_'), impact: 'HIGH',
        notes: 'Classic FI extractor; source tables (BSEG/BKPF/FAGLFLEXT) replaced by ACDOCA' };
    }
    // CO extractors
    if (/^0CO_(OM|PC|PA)_/.test(name)) {
      return { action: 'replace-with-cds', replacement: name.replace(/^0CO_/, 'I_CO_'), impact: 'HIGH',
        notes: 'CO extractor; COSS/COSP replaced by ACDOCA' };
    }
    // Logistics extractors
    if (/^2LIS_/.test(name)) {
      return { action: 'update', replacement: '', impact: 'MEDIUM',
        notes: 'Logistics extractor; review setup tables and delta handling' };
    }
    // Asset extractors
    if (/^0FIAA_|^0AM_/.test(name)) {
      return { action: 'replace-with-cds', replacement: name.replace(/^0(FIAA|AM)_/, 'I_AA_'), impact: 'HIGH',
        notes: 'Asset extractor; ANLP/ANLC removed, use ACDOCA-based CDS views' };
    }
    // Custom extractors
    if (/^Z/.test(name)) {
      return { action: 'update', replacement: '', impact: 'HIGH',
        notes: 'Custom extractor; validate source tables against S/4HANA data model' };
    }
    // HR extractors
    if (/^0HR_/.test(name)) {
      return { action: 'update', replacement: '', impact: 'MEDIUM',
        notes: 'HR extractor; validate infotype table changes' };
    }
    // Standard unaffected
    return { action: 'keep', replacement: '', impact: 'LOW',
      notes: 'Standard extractor; no known S/4HANA impact' };
  }

  _extractMock() {
    const records = [];
    const extractors = [
      // FI extractors (high impact)
      { ds: '0FI_GL_14', desc: 'GL Line Items', comp: 'FI-GL', type: 'TRAN', extract: 'FULL_DELTA', table: 'FAGLFLEXT', delta: 'ABR', last: '20240601', count: '365', recs: '150000', dur: '45' },
      { ds: '0FI_AR_4', desc: 'AR Line Items', comp: 'FI-AR', type: 'TRAN', extract: 'DELTA', table: 'BSID', delta: 'ABR', last: '20240601', count: '365', recs: '80000', dur: '25' },
      { ds: '0FI_AP_4', desc: 'AP Line Items', comp: 'FI-AP', type: 'TRAN', extract: 'DELTA', table: 'BSIK', delta: 'ABR', last: '20240601', count: '365', recs: '60000', dur: '20' },
      { ds: '0FI_AA_11', desc: 'Asset Transactions', comp: 'FI-AA', type: 'TRAN', extract: 'DELTA', table: 'ANLP', delta: 'ABR', last: '20240601', count: '52', recs: '5000', dur: '10' },
      // CO extractors
      { ds: '0CO_OM_CCA_9', desc: 'Cost Center Actuals', comp: 'CO-OM', type: 'TRAN', extract: 'DELTA', table: 'COSS', delta: 'ABR', last: '20240601', count: '52', recs: '30000', dur: '15' },
      { ds: '0CO_PC_ACT_05', desc: 'Product Cost Actuals', comp: 'CO-PC', type: 'TRAN', extract: 'DELTA', table: 'COSP', delta: 'ABR', last: '20240501', count: '12', recs: '20000', dur: '30' },
      // Logistics extractors
      { ds: '2LIS_02_ITM', desc: 'Purchasing Items', comp: 'MM', type: 'TRAN', extract: 'DELTA', table: 'EKPO', delta: 'ABR', last: '20240601', count: '365', recs: '50000', dur: '15' },
      { ds: '2LIS_11_VAHDR', desc: 'Sales Order Header', comp: 'SD', type: 'TRAN', extract: 'DELTA', table: 'VBAK', delta: 'ABR', last: '20240601', count: '365', recs: '40000', dur: '12' },
      { ds: '2LIS_12_VCITM', desc: 'Billing Items', comp: 'SD', type: 'TRAN', extract: 'DELTA', table: 'VBRP', delta: 'ABR', last: '20240601', count: '365', recs: '35000', dur: '10' },
      { ds: '2LIS_03_BF', desc: 'Goods Movements', comp: 'MM', type: 'TRAN', extract: 'DELTA', table: 'MSEG', delta: 'AIMD', last: '20240601', count: '365', recs: '200000', dur: '60' },
      // Custom extractors
      { ds: 'ZCUSTOM_SALES_RPT', desc: 'Custom Sales Report', comp: 'SD', type: 'TRAN', extract: 'FULL', table: 'VBAK/VBAP', delta: 'FULL', last: '20240501', count: '52', recs: '10000', dur: '8', custom: 'X', fm: 'Z_EXTRACT_SALES_RPT' },
      { ds: 'ZCUSTOM_INVENTORY', desc: 'Custom Inventory Extract', comp: 'MM', type: 'MAST', extract: 'FULL', table: 'MARD', delta: 'FULL', last: '20240515', count: '12', recs: '25000', dur: '15', custom: 'X', fm: 'Z_EXTRACT_INVENTORY' },
      { ds: 'ZCUSTOM_HR_HEADCOUNT', desc: 'Custom HR Headcount', comp: 'HR', type: 'MAST', extract: 'FULL', table: 'PA0001', delta: 'FULL', last: '20240601', count: '52', recs: '3000', dur: '5', custom: 'X', fm: 'Z_HR_HEADCOUNT' },
      // Standard unaffected
      { ds: '0MATERIAL_ATTR', desc: 'Material Master Attributes', comp: 'MM', type: 'MAST', extract: 'FULL', table: 'MARA', delta: 'ABR', last: '20240601', count: '52', recs: '50000', dur: '20' },
      { ds: '0CUSTOMER_ATTR', desc: 'Customer Master Attributes', comp: 'SD', type: 'MAST', extract: 'FULL', table: 'KNA1', delta: 'ABR', last: '20240601', count: '52', recs: '20000', dur: '8' },
      // HR extractors
      { ds: '0HR_PA_0', desc: 'HR Master Data', comp: 'HR', type: 'MAST', extract: 'FULL', table: 'PA0000', delta: 'ABR', last: '20240501', count: '52', recs: '5000', dur: '10' },
    ];

    for (const e of extractors) {
      const classification = this._classifyExtractor({ DATASOURCE: e.ds, SOURCE_TABLE: e.table });
      records.push({
        DATASOURCE: e.ds,
        DS_DESC: e.desc,
        APPL_COMP: e.comp,
        DS_TYPE: e.type,
        EXTRACT_TYPE: e.extract,
        SOURCE_TABLE: e.table,
        DELTA_TYPE: e.delta,
        DELTA_FIELD: '',
        INFOSOURCE: `IS_${e.ds}`,
        DTP_ID: `DTP_${e.ds}`,
        TARGET_OBJ: `ADSO_${e.comp.replace('-', '_')}`,
        TARGET_TYPE: 'ADSO',
        LAST_EXEC: e.last,
        EXEC_COUNT: e.count,
        AVG_RECORDS: e.recs,
        AVG_DURATION: e.dur,
        MIGRATION_ACTION: classification.action,
        REPLACEMENT_DS: classification.replacement,
        IMPACT: classification.impact,
        AFFECTED_TABLES: e.table,
        NOTES: classification.notes,
        IS_CUSTOM: e.custom || '',
        CUSTOM_FM: e.fm || '',
        STATUS: 'ASSESSED',
        PRIORITY: classification.impact === 'HIGH' ? 'P1' : classification.impact === 'MEDIUM' ? 'P2' : 'P3',
      });
    }

    return records; // 16
  }
}

module.exports = BWExtractorMigrationObject;
