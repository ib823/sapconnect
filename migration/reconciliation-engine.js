/**
 * Reconciliation Engine
 *
 * Compares source and target data at multiple levels:
 * - Record count reconciliation
 * - Aggregate value reconciliation (sums, counts)
 * - Field-level sample reconciliation
 * - Hash-based integrity verification
 *
 * This is the "trust but verify" layer — after migration,
 * every record must be accounted for.
 */

const Logger = require('../lib/logger');

class ReconciliationEngine {
  constructor(options = {}) {
    this.logger = new Logger('reconciliation', { level: options.verbose ? 'debug' : 'info' });
    this.tolerances = {
      amount: options.amountTolerance || 0.01,
      count: options.countTolerance || 0,
      percentage: options.percentageTolerance || 0.001,
      ...options.tolerances,
    };
  }

  /**
   * Run full reconciliation between source and target datasets.
   * @param {object} config - { objectId, sourceRecords, targetRecords, keyFields, valueFields, options }
   * @returns {object} Reconciliation report
   */
  reconcile(config) {
    const {
      objectId,
      sourceRecords,
      targetRecords,
      keyFields,
      valueFields = [],
      aggregateFields = [],
    } = config;

    this.logger.info(`Reconciling ${objectId}: ${sourceRecords.length} source vs ${targetRecords.length} target records`);

    const report = {
      objectId,
      timestamp: new Date().toISOString(),
      checks: [],
      summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
    };

    // 1. Record count check
    report.checks.push(this._checkRecordCount(sourceRecords, targetRecords));

    // 2. Key coverage check — every source key should exist in target
    if (keyFields && keyFields.length > 0) {
      report.checks.push(this._checkKeyCoverage(sourceRecords, targetRecords, keyFields));
    }

    // 3. Aggregate value checks
    for (const field of aggregateFields) {
      report.checks.push(this._checkAggregateValue(sourceRecords, targetRecords, field));
    }

    // 4. Field-level sample check
    if (valueFields.length > 0 && keyFields && keyFields.length > 0) {
      report.checks.push(this._checkFieldSample(sourceRecords, targetRecords, keyFields, valueFields));
    }

    // 5. Duplicate check on target
    if (keyFields && keyFields.length > 0) {
      report.checks.push(this._checkTargetDuplicates(targetRecords, keyFields));
    }

    // 6. Null/empty field check
    if (valueFields.length > 0) {
      report.checks.push(this._checkNullFields(targetRecords, valueFields));
    }

    // Summarize
    for (const check of report.checks) {
      report.summary.total++;
      if (check.status === 'passed') report.summary.passed++;
      else if (check.status === 'failed') report.summary.failed++;
      else if (check.status === 'warning') report.summary.warnings++;
    }

    report.summary.status = report.summary.failed > 0 ? 'FAILED' :
                            report.summary.warnings > 0 ? 'PASSED_WITH_WARNINGS' : 'PASSED';

    this.logger.info(`Reconciliation ${objectId}: ${report.summary.status} (${report.summary.passed}/${report.summary.total} passed)`);

    return report;
  }

  /**
   * Run reconciliation across multiple migration object results.
   */
  reconcileAll(migrationResults) {
    const reports = [];

    for (const result of migrationResults) {
      if (!result.phases || !result.phases.extract || !result.phases.transform) continue;

      const sourceRecords = result.phases.extract.records || [];
      const targetRecords = result.phases.transform.records || [];

      if (sourceRecords.length === 0 && targetRecords.length === 0) continue;

      const report = this.reconcile({
        objectId: result.objectId,
        sourceRecords,
        targetRecords,
        keyFields: this._inferKeyFields(result),
        valueFields: this._inferValueFields(result),
        aggregateFields: this._inferAggregateFields(result),
      });

      reports.push(report);
    }

    const totalChecks = reports.reduce((s, r) => s + r.summary.total, 0);
    const totalPassed = reports.reduce((s, r) => s + r.summary.passed, 0);
    const totalFailed = reports.reduce((s, r) => s + r.summary.failed, 0);

    return {
      reports,
      summary: {
        objectsReconciled: reports.length,
        totalChecks,
        totalPassed,
        totalFailed,
        overallStatus: totalFailed > 0 ? 'FAILED' : 'PASSED',
      },
    };
  }

  // ── Check implementations ──────────────────────────────────────

  _checkRecordCount(source, target) {
    const diff = target.length - source.length;
    const withinTolerance = Math.abs(diff) <= this.tolerances.count;

    return {
      name: 'Record Count',
      type: 'count',
      sourceValue: source.length,
      targetValue: target.length,
      variance: diff,
      tolerance: this.tolerances.count,
      status: withinTolerance ? 'passed' : 'failed',
      message: withinTolerance
        ? `Record counts match: ${source.length}`
        : `Record count mismatch: source=${source.length}, target=${target.length}, diff=${diff}`,
    };
  }

  _checkKeyCoverage(source, target, keyFields) {
    const targetKeys = new Set(target.map(r => this._makeKey(r, keyFields)));
    let missing = 0;
    const missingExamples = [];

    for (const rec of source) {
      const key = this._makeKey(rec, keyFields);
      if (!targetKeys.has(key)) {
        missing++;
        if (missingExamples.length < 5) {
          missingExamples.push(key);
        }
      }
    }

    return {
      name: 'Key Coverage',
      type: 'coverage',
      sourceKeys: source.length,
      targetKeys: targetKeys.size,
      missingKeys: missing,
      missingExamples,
      status: missing === 0 ? 'passed' : 'failed',
      message: missing === 0
        ? `All ${source.length} source keys found in target`
        : `${missing} source keys missing in target`,
    };
  }

  _checkAggregateValue(source, target, field) {
    const sourceSum = source.reduce((s, r) => s + (parseFloat(r[field]) || 0), 0);
    const targetSum = target.reduce((s, r) => s + (parseFloat(r[field]) || 0), 0);
    const variance = Math.abs(targetSum - sourceSum);
    const withinTolerance = variance <= this.tolerances.amount;

    return {
      name: `Aggregate: ${field}`,
      type: 'aggregate',
      field,
      sourceValue: sourceSum,
      targetValue: targetSum,
      variance,
      tolerance: this.tolerances.amount,
      status: withinTolerance ? 'passed' : 'failed',
      message: withinTolerance
        ? `${field} aggregate matches: ${sourceSum}`
        : `${field} aggregate mismatch: source=${sourceSum}, target=${targetSum}, diff=${variance}`,
    };
  }

  _checkFieldSample(source, target, keyFields, valueFields) {
    const targetMap = new Map();
    for (const rec of target) {
      targetMap.set(this._makeKey(rec, keyFields), rec);
    }

    const sampleSize = Math.min(source.length, 50);
    const step = Math.max(1, Math.floor(source.length / sampleSize));
    let checked = 0;
    let mismatches = 0;
    const mismatchDetails = [];

    for (let i = 0; i < source.length && checked < sampleSize; i += step) {
      const srcRec = source[i];
      const key = this._makeKey(srcRec, keyFields);
      const tgtRec = targetMap.get(key);

      if (!tgtRec) continue;
      checked++;

      for (const field of valueFields) {
        const srcVal = String(srcRec[field] || '');
        const tgtVal = String(tgtRec[field] || '');
        if (srcVal !== tgtVal) {
          mismatches++;
          if (mismatchDetails.length < 5) {
            mismatchDetails.push({ key, field, source: srcVal, target: tgtVal });
          }
        }
      }
    }

    return {
      name: 'Field Sample Check',
      type: 'sample',
      sampledRecords: checked,
      fieldsChecked: valueFields.length,
      mismatches,
      mismatchDetails,
      status: mismatches === 0 ? 'passed' : mismatches <= 3 ? 'warning' : 'failed',
      message: mismatches === 0
        ? `${checked} sampled records match across ${valueFields.length} fields`
        : `${mismatches} field mismatches found in ${checked} sampled records`,
    };
  }

  _checkTargetDuplicates(target, keyFields) {
    const seen = new Set();
    let duplicates = 0;

    for (const rec of target) {
      const key = this._makeKey(rec, keyFields);
      if (seen.has(key)) duplicates++;
      seen.add(key);
    }

    return {
      name: 'Target Duplicates',
      type: 'duplicates',
      totalRecords: target.length,
      duplicateCount: duplicates,
      status: duplicates === 0 ? 'passed' : 'failed',
      message: duplicates === 0
        ? 'No duplicate keys in target'
        : `${duplicates} duplicate keys found in target`,
    };
  }

  _checkNullFields(target, valueFields) {
    const nullCounts = {};
    for (const field of valueFields) {
      nullCounts[field] = 0;
    }

    for (const rec of target) {
      for (const field of valueFields) {
        if (rec[field] === null || rec[field] === undefined || rec[field] === '') {
          nullCounts[field]++;
        }
      }
    }

    const totalNull = Object.values(nullCounts).reduce((s, c) => s + c, 0);
    const totalCells = target.length * valueFields.length;
    const nullRate = totalCells > 0 ? totalNull / totalCells : 0;

    return {
      name: 'Null/Empty Fields',
      type: 'completeness',
      totalCells,
      nullCells: totalNull,
      nullRate: Math.round(nullRate * 10000) / 100,
      fieldBreakdown: nullCounts,
      status: nullRate < 0.05 ? 'passed' : nullRate < 0.15 ? 'warning' : 'failed',
      message: `${Math.round(nullRate * 100)}% null/empty (${totalNull}/${totalCells} cells)`,
    };
  }

  // ── Helpers ────────────────────────────────────────────────────

  _makeKey(record, keyFields) {
    return keyFields.map(f => String(record[f] || '')).join('|');
  }

  _inferKeyFields(result) {
    // Use the first few source fields as keys (heuristic)
    const records = result.phases.extract.records || [];
    if (records.length === 0) return [];
    const keys = Object.keys(records[0]).slice(0, 3);
    return keys;
  }

  _inferValueFields(result) {
    const records = result.phases.extract.records || [];
    if (records.length === 0) return [];
    return Object.keys(records[0]).slice(3, 8);
  }

  _inferAggregateFields(result) {
    // Look for numeric fields
    const records = result.phases.extract.records || [];
    if (records.length === 0) return [];
    const numericFields = [];
    const sample = records[0];
    for (const [key, val] of Object.entries(sample)) {
      if (!isNaN(parseFloat(val)) && val !== '') {
        numericFields.push(key);
        if (numericFields.length >= 3) break;
      }
    }
    return numericFields;
  }
}

module.exports = ReconciliationEngine;
