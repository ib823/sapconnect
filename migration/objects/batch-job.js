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
 * Batch Job Migration Object
 *
 * Migrates batch job configurations from ECC (TBTCO/TBTCP)
 * to S/4HANA. Assesses custom programs for compatibility
 * and suggests Application Job migration where appropriate.
 *
 * ~18 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class BatchJobMigrationObject extends BaseMigrationObject {
  get objectId() { return 'BATCH_JOB'; }
  get name() { return 'Batch Job'; }

  getFieldMappings() {
    return [
      // ── Job identification ─────────────────────────────────────
      { source: 'JOBNAME', target: 'JobName' },
      { source: 'JOBCLASS', target: 'JobClass' },
      { source: 'PROGNAME', target: 'ProgramName' },
      { source: 'VARIANT', target: 'Variant' },
      { source: 'AUTHCKNAM', target: 'AuthorizationUser' },

      // ── Schedule ───────────────────────────────────────────────
      { source: 'FREQUENCY', target: 'Frequency' },
      { source: 'STARTTIME', target: 'StartTime' },
      { source: 'PRDMINS', target: 'PeriodMinutes', convert: 'toInteger' },
      { source: 'PRDHOURS', target: 'PeriodHours', convert: 'toInteger' },
      { source: 'PRDDAYS', target: 'PeriodDays', convert: 'toInteger' },
      { source: 'CALENDAR', target: 'FactoryCalendar' },

      // ── Runtime info ───────────────────────────────────────────
      { source: 'STATUS', target: 'Status' },
      { source: 'AVGRUNTIME', target: 'AvgRuntimeMinutes', convert: 'toInteger' },
      { source: 'LASTRUN', target: 'LastRunDate', convert: 'toDate' },
      { source: 'LASTSTATUS', target: 'LastRunStatus' },

      // ── Migration assessment ───────────────────────────────────
      { source: 'MIGSTRATEGY', target: 'MigrationStrategy' },
      { source: 'CUSTOMCODE', target: 'HasCustomCode', convert: 'boolYN' },

      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'BATCH_JOB' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['JobName', 'ProgramName', 'Frequency'],
      exactDuplicate: { keys: ['JobName'] },
      range: [
        { field: 'AvgRuntimeMinutes', min: 0, max: 1440 },
      ],
    };
  }

  /**
   * Classify batch job migration strategy.
   */
  _classifyJob(progName, frequency, runtime) {
    // Z-programs need code review
    const isCustom = /^Z/.test(progName);
    // Long-running jobs need performance review
    const isLongRunning = runtime > 120;
    // High-frequency jobs are candidates for Application Jobs
    const isHighFreq = frequency === 'hourly';

    if (!isCustom) return 'keep';
    if (isLongRunning) return 'review-performance';
    if (isHighFreq) return 'convert-to-app-job';
    return 'review-compatibility';
  }

  _extractMock() {
    const records = [];
    const jobs = [
      { name: 'Z_FI_MONTHLY_CLOSE', freq: 'monthly', prog: 'ZREP_FI_MONTHLY', runtime: 240, cls: 'A' },
      { name: 'Z_MM_PO_RELEASE', freq: 'daily', prog: 'ZCL_MM_PO_ENHANCE', runtime: 15, cls: 'B' },
      { name: 'Z_SD_BILLING_RUN', freq: 'daily', prog: 'ZCL_SD_ORDER_PROC', runtime: 45, cls: 'B' },
      { name: 'Z_CUSTOMER_SYNC', freq: 'hourly', prog: 'ZCL_FI_CUSTOMER_AGING', runtime: 5, cls: 'B' },
      { name: 'Z_VENDOR_EVAL', freq: 'weekly', prog: 'ZCL_MM_VENDOR_EVAL', runtime: 30, cls: 'C' },
      { name: 'Z_WM_REPLENISH', freq: 'daily', prog: 'ZCL_WM_STOCK_CHECK', runtime: 20, cls: 'B' },
      { name: 'Z_SD_OUTPUT', freq: 'hourly', prog: 'ZCL_SD_OUTPUT_MGR', runtime: 10, cls: 'A' },
      { name: 'Z_DELIVERY_PROC', freq: 'daily', prog: 'ZCL_SD_DELIVERY', runtime: 35, cls: 'B' },
      { name: 'Z_PAYMENT_RUN', freq: 'weekly', prog: 'ZREP_FI_MONTHLY', runtime: 60, cls: 'A' },
      { name: 'Z_MRP_CUSTOM', freq: 'daily', prog: 'Z_MRP_PROCESSOR', runtime: 120, cls: 'A' },
      { name: 'Z_ARCHIVE_DATA', freq: 'monthly', prog: 'Z_ARCHIVE_PROC', runtime: 480, cls: 'C' },
      { name: 'Z_EDI_MONITOR', freq: 'hourly', prog: 'Z_EDI_PROC', runtime: 3, cls: 'B' },
      { name: 'Z_BANK_STMT_IMPORT', freq: 'daily', prog: 'Z_BANK_IMPORT', runtime: 8, cls: 'B' },
      { name: 'Z_TAX_REPORT', freq: 'monthly', prog: 'Z_TAX_PROC', runtime: 90, cls: 'A' },
      { name: 'Z_INVENTORY_COUNT', freq: 'weekly', prog: 'Z_INV_COUNT', runtime: 25, cls: 'C' },
      // Standard SAP jobs (non-custom)
      { name: 'SAP_COLLECTOR_FOR_PERFMONITOR', freq: 'hourly', prog: 'RSCOLL00', runtime: 1, cls: 'A' },
      { name: 'SAP_CCMS_MONI_BATCH_DP', freq: 'daily', prog: 'RSAL_BATCH_TOOL_MANAGER', runtime: 2, cls: 'A' },
      { name: 'SAP_REORG_SPOOL', freq: 'daily', prog: 'RSPO0041', runtime: 5, cls: 'C' },
    ];

    const freqToMins = { hourly: 60, daily: 1440, weekly: 10080, monthly: 43200 };

    for (const j of jobs) {
      records.push({
        JOBNAME: j.name,
        JOBCLASS: j.cls,
        PROGNAME: j.prog,
        VARIANT: j.name.startsWith('Z_') ? `${j.name}_VAR` : '',
        AUTHCKNAM: 'BATCH_USER',
        FREQUENCY: j.freq,
        STARTTIME: '060000',
        PRDMINS: j.freq === 'hourly' ? '60' : '0',
        PRDHOURS: j.freq === 'daily' ? '24' : '0',
        PRDDAYS: j.freq === 'weekly' ? '7' : j.freq === 'monthly' ? '30' : '0',
        CALENDAR: 'US',
        STATUS: 'active',
        AVGRUNTIME: String(j.runtime),
        LASTRUN: '20240115',
        LASTSTATUS: 'success',
        MIGSTRATEGY: this._classifyJob(j.prog, j.freq, j.runtime),
        CUSTOMCODE: j.prog.startsWith('Z') ? 'X' : '',
      });
    }

    return records; // 18 records
  }
}

module.exports = BatchJobMigrationObject;
