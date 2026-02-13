/**
 * Data Quality Checker
 *
 * Validates migration data for duplicates, required fields,
 * referential integrity, format compliance, and value ranges.
 */

const Logger = require('../lib/logger');

// ── Levenshtein distance (inline, no external deps) ─────────────────

function levenshtein(a, b) {
  if (!a || !b) return (a || b || '').length;
  const al = a.length;
  const bl = b.length;
  const dp = Array.from({ length: al + 1 }, (_, i) => i);
  for (let j = 1; j <= bl; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= al; i++) {
      const tmp = dp[i];
      dp[i] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[i], dp[i - 1]);
      prev = tmp;
    }
  }
  return dp[al];
}

function normalizedSimilarity(a, b) {
  if (!a && !b) return 1;
  const maxLen = Math.max((a || '').length, (b || '').length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

class DataQualityChecker {
  constructor(options = {}) {
    this.logger = new Logger('data-quality', { level: options.logLevel || 'warn' });
  }

  /**
   * Run a set of quality checks against records
   * @param {object[]} records
   * @param {object} checksConfig - { required, exactDuplicate, fuzzyDuplicate, referential, format, range }
   * @returns {{ status, totalRecords, checks, errors, warnings, passed, errorCount, warningCount }}
   */
  check(records, checksConfig = {}) {
    const results = {
      totalRecords: records.length,
      checks: [],
      errors: [],
      warnings: [],
      passed: [],
    };

    if (checksConfig.required) {
      const r = this.checkRequired(records, checksConfig.required);
      results.checks.push(r);
      this._classify(r, results);
    }

    if (checksConfig.exactDuplicate) {
      const r = this.findExactDuplicates(records, checksConfig.exactDuplicate.keys);
      results.checks.push(r);
      this._classify(r, results);
    }

    if (checksConfig.fuzzyDuplicate) {
      const cfg = checksConfig.fuzzyDuplicate;
      const r = this.findFuzzyDuplicates(records, cfg.keys, cfg.threshold || 0.85);
      results.checks.push(r);
      this._classify(r, results);
    }

    if (checksConfig.referential) {
      for (const ref of checksConfig.referential) {
        const r = this.checkReferentialIntegrity(records, ref.field, ref.validSet);
        results.checks.push(r);
        this._classify(r, results);
      }
    }

    if (checksConfig.format) {
      for (const fmt of checksConfig.format) {
        const r = this.checkFormat(records, fmt.field, fmt.pattern, fmt.description);
        results.checks.push(r);
        this._classify(r, results);
      }
    }

    if (checksConfig.range) {
      for (const rng of checksConfig.range) {
        const r = this.checkRange(records, rng.field, rng.min, rng.max);
        results.checks.push(r);
        this._classify(r, results);
      }
    }

    results.errorCount = results.errors.length;
    results.warningCount = results.warnings.length;
    results.status = results.errorCount > 0 ? 'errors' : results.warningCount > 0 ? 'warnings' : 'passed';
    return results;
  }

  /**
   * Check required fields are non-null/non-empty
   */
  checkRequired(records, fields) {
    const missing = [];
    for (let i = 0; i < records.length; i++) {
      for (const f of fields) {
        const val = records[i][f];
        if (val === null || val === undefined || val === '') {
          missing.push({ row: i, field: f });
        }
      }
    }
    return {
      name: 'required',
      severity: missing.length > 0 ? 'error' : 'pass',
      message: missing.length > 0
        ? `${missing.length} missing required value(s) across fields: ${fields.join(', ')}`
        : `All required fields present: ${fields.join(', ')}`,
      details: missing,
      count: missing.length,
    };
  }

  /**
   * Find exact duplicates based on composite key
   */
  findExactDuplicates(records, keys) {
    const seen = new Map();
    const duplicates = [];

    for (let i = 0; i < records.length; i++) {
      const keyVal = keys.map((k) => String(records[i][k] || '')).join('|');
      if (seen.has(keyVal)) {
        duplicates.push({ row: i, duplicateOf: seen.get(keyVal), key: keyVal });
      } else {
        seen.set(keyVal, i);
      }
    }

    return {
      name: 'exactDuplicate',
      severity: duplicates.length > 0 ? 'error' : 'pass',
      message: duplicates.length > 0
        ? `${duplicates.length} exact duplicate(s) on keys: ${keys.join(', ')}`
        : `No exact duplicates on keys: ${keys.join(', ')}`,
      details: duplicates,
      count: duplicates.length,
    };
  }

  /**
   * Find fuzzy duplicates using Levenshtein similarity
   */
  findFuzzyDuplicates(records, fuzzyKeys, threshold = 0.85) {
    const candidates = [];

    // Build string representation per record
    const strings = records.map((r) =>
      fuzzyKeys.map((k) => String(r[k] || '').toLowerCase().trim()).join(' ')
    );

    // O(n^2) comparison — acceptable for migration batch sizes (< 100k records)
    // For larger sets, a blocking/bucketing strategy would be needed
    const limit = Math.min(records.length, 10000); // cap for safety
    for (let i = 0; i < limit; i++) {
      for (let j = i + 1; j < limit; j++) {
        const sim = normalizedSimilarity(strings[i], strings[j]);
        if (sim >= threshold && sim < 1.0) {
          candidates.push({ rowA: i, rowB: j, similarity: Math.round(sim * 100) / 100 });
        }
      }
    }

    return {
      name: 'fuzzyDuplicate',
      severity: candidates.length > 0 ? 'warning' : 'pass',
      message: candidates.length > 0
        ? `${candidates.length} potential fuzzy duplicate(s) (threshold: ${threshold})`
        : `No fuzzy duplicates detected (threshold: ${threshold})`,
      details: candidates,
      count: candidates.length,
    };
  }

  /**
   * Check referential integrity — every value in field must exist in validSet
   */
  checkReferentialIntegrity(records, field, validSet) {
    const refSet = validSet instanceof Set ? validSet : new Set(validSet);
    const violations = [];

    for (let i = 0; i < records.length; i++) {
      const val = records[i][field];
      if (val !== null && val !== undefined && val !== '' && !refSet.has(val)) {
        violations.push({ row: i, field, value: val });
      }
    }

    return {
      name: 'referentialIntegrity',
      severity: violations.length > 0 ? 'error' : 'pass',
      message: violations.length > 0
        ? `${violations.length} referential integrity violation(s) on ${field}`
        : `Referential integrity OK for ${field}`,
      details: violations,
      count: violations.length,
    };
  }

  /**
   * Check field values match a regex pattern
   */
  checkFormat(records, field, pattern, description) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    const violations = [];

    for (let i = 0; i < records.length; i++) {
      const val = records[i][field];
      if (val !== null && val !== undefined && val !== '' && !regex.test(String(val))) {
        violations.push({ row: i, field, value: val });
      }
    }

    return {
      name: 'format',
      severity: violations.length > 0 ? 'warning' : 'pass',
      message: violations.length > 0
        ? `${violations.length} format violation(s) on ${field} (${description || pattern})`
        : `Format OK for ${field}`,
      details: violations,
      count: violations.length,
    };
  }

  /**
   * Check numeric values within range
   */
  checkRange(records, field, min, max) {
    const violations = [];

    for (let i = 0; i < records.length; i++) {
      const val = Number(records[i][field]);
      if (!isNaN(val)) {
        if (min !== null && min !== undefined && val < min) violations.push({ row: i, field, value: val, reason: `below min ${min}` });
        if (max !== null && max !== undefined && val > max) violations.push({ row: i, field, value: val, reason: `above max ${max}` });
      }
    }

    return {
      name: 'range',
      severity: violations.length > 0 ? 'warning' : 'pass',
      message: violations.length > 0
        ? `${violations.length} range violation(s) on ${field} (${min || '-∞'}..${max || '∞'})`
        : `Range OK for ${field}`,
      details: violations,
      count: violations.length,
    };
  }

  /** Classify a check result into errors/warnings/passed */
  _classify(result, results) {
    if (result.severity === 'error') results.errors.push(result);
    else if (result.severity === 'warning') results.warnings.push(result);
    else results.passed.push(result);
  }
}

module.exports = { DataQualityChecker, levenshtein, normalizedSimilarity };
