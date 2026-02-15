/**
 * Declarative Field Mapping Engine
 *
 * Maps source records to target records using declarative mapping definitions.
 * Supports simple rename, type conversion, value mapping, concatenation,
 * defaults, and conditional transforms.
 */

const Logger = require('../lib/logger');

// ── Built-in converters ──────────────────────────────────────────────

const CONVERTERS = {
  padLeft40: (v) => v === null || v === undefined ? '' : String(v).padStart(40, '0'),
  padLeft10: (v) => v === null || v === undefined ? '' : String(v).padStart(10, '0'),
  toUpperCase: (v) => v === null || v === undefined ? '' : String(v).toUpperCase(),
  toLowerCase: (v) => v === null || v === undefined ? '' : String(v).toLowerCase(),
  toDate: (v) => {
    if (!v) return null;
    const s = String(v).replace(/[^0-9]/g, '');
    if (s.length === 8) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    return String(v);
  },
  toDecimal: (v) => {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  },
  toInteger: (v) => {
    if (v === null || v === undefined || v === '') return 0;
    const n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  },
  boolYN: (v) => v === 'Y' || v === 'X' || v === true || v === 1,
  boolTF: (v) => (v === 'Y' || v === 'X' || v === true || v === 1) ? 'T' : 'F',
  stripLeadingZeros: (v) => v === null || v === undefined ? '' : String(v).replace(/^0+/, '') || '0',
  trim: (v) => v === null || v === undefined ? '' : String(v).trim(),
  inforLNItemType: (v) => {
    const map = { '1': 'ROH', '2': 'HALB', '3': 'FERT', '4': 'HAWA', '5': 'DIEN', '6': 'NLAG' };
    return map[String(v)] || 'HAWA';
  },
  inforUomToISO: (v) => {
    const map = { 'kg': 'KG', 'g': 'G', 'l': 'L', 'ml': 'ML', 'm': 'M', 'cm': 'CM', 'mm': 'MM', 'pcs': 'EA', 'ea': 'EA', 'pc': 'EA', 'hr': 'HUR', 'min': 'MIN', 'box': 'BX', 'pal': 'PL', 'set': 'SET' };
    return map[String(v).toLowerCase()] || String(v).toUpperCase();
  },
  inforLNCompanySuffix: (v, record) => {
    // Strip company number suffix from LN table field values
    if (!v) return '';
    return String(v).replace(/\d{3}$/, '');
  },
  m3FieldPrefix: (v, record) => {
    // Strip 2-char M3 field prefix if present
    if (!v || typeof v !== 'string') return v;
    return v;
  },
  lawsonAccountString: (v) => {
    // Decompose Lawson flat accounting string: COMPANY-ACCTUNIT-ACCOUNT-SUBACCOUNT
    if (!v) return '';
    const parts = String(v).split('-');
    return parts.length >= 3 ? parts[2] : String(v);
  },
};

// ── Mapping types ────────────────────────────────────────────────────
//
//  simple:        { source, target }
//  convert:       { source, target, convert: 'converterName' | fn }
//  valueMap:      { source, target, valueMap: { 'A': '1', 'B': '2' }, default: '?' }
//  concatenation: { target, sources: ['F1', 'F2'], separator: ' ' }
//  default:       { target, default: value }
//  conditional:   { source, target, transform: fn(value, record) }

class FieldMappingEngine {
  /**
   * @param {object[]} mappings - Array of mapping definitions
   * @param {object} [options]
   * @param {boolean} [options.strict] - Throw on unmapped source fields
   * @param {boolean} [options.passThrough] - Copy unmapped fields as-is
   */
  constructor(mappings, options = {}) {
    this.mappings = mappings;
    this.strict = options.strict || false;
    this.passThrough = options.passThrough || false;
    this.logger = new Logger('field-mapping', { level: options.logLevel || 'warn' });
    this._stats = { processed: 0, mapped: 0, unmapped: 0, errors: 0 };
  }

  /**
   * Convert legacy 'SOURCE->TARGET' string mappings to mapping objects
   */
  static fromLegacy(strings) {
    return strings.map((s) => {
      const [source, target] = s.split('->').map((p) => p.trim());
      return { source, target };
    });
  }

  /**
   * Apply mappings to a single record
   * @param {object} record - Source record
   * @returns {object} Target record
   */
  applyRecord(record) {
    const target = {};
    const mappedSources = new Set();

    for (const m of this.mappings) {
      try {
        if (m.sources && m.target) {
          // Concatenation
          const parts = m.sources.map((s) => {
            mappedSources.add(s);
            return record[s] !== null && record[s] !== undefined ? String(record[s]) : '';
          });
          target[m.target] = parts.join(m.separator !== null && m.separator !== undefined ? m.separator : ' ');
        } else if (m.source && m.target && m.valueMap) {
          // Value map
          mappedSources.add(m.source);
          const raw = record[m.source];
          target[m.target] = m.valueMap[raw] !== null && m.valueMap[raw] !== undefined ? m.valueMap[raw] : (m.default !== null && m.default !== undefined ? m.default : raw);
        } else if (m.source && m.target && m.convert) {
          // Type conversion
          mappedSources.add(m.source);
          const converter = typeof m.convert === 'function' ? m.convert : CONVERTERS[m.convert];
          if (!converter) {
            this.logger.warn(`Unknown converter: ${m.convert}`);
            target[m.target] = record[m.source];
          } else {
            target[m.target] = converter(record[m.source], record);
          }
        } else if (m.source && m.target && m.transform) {
          // Conditional / custom transform
          mappedSources.add(m.source);
          target[m.target] = m.transform(record[m.source], record);
        } else if (!m.source && m.target && m.default !== undefined) {
          // Default value (no source field)
          target[m.target] = typeof m.default === 'function' ? m.default(record) : m.default;
        } else if (m.source && m.target) {
          // Simple rename
          mappedSources.add(m.source);
          target[m.target] = record[m.source];
        }
        this._stats.mapped++;
      } catch (err) {
        this._stats.errors++;
        this.logger.warn(`Mapping error on field ${m.source || m.target}: ${err.message}`);
        if (m.target) target[m.target] = null;
      }
    }

    // Pass-through unmapped source fields
    if (this.passThrough) {
      for (const key of Object.keys(record)) {
        if (!mappedSources.has(key) && target[key] === undefined) {
          target[key] = record[key];
          this._stats.unmapped++;
        }
      }
    }

    this._stats.processed++;
    return target;
  }

  /**
   * Apply mappings to a batch of records
   * @param {object[]} records
   * @returns {object[]}
   */
  applyBatch(records) {
    return records.map((r) => this.applyRecord(r));
  }

  /**
   * Validate mapping definitions for common errors
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateMappings() {
    const errors = [];
    const targets = new Set();

    for (let i = 0; i < this.mappings.length; i++) {
      const m = this.mappings[i];
      if (!m.target) {
        errors.push(`Mapping[${i}]: missing target field`);
      }
      if (!m.source && !m.sources && m.default === undefined) {
        errors.push(`Mapping[${i}]: no source, sources, or default defined`);
      }
      if (m.convert && typeof m.convert === 'string' && !CONVERTERS[m.convert]) {
        errors.push(`Mapping[${i}]: unknown converter '${m.convert}'`);
      }
      if (m.target && targets.has(m.target)) {
        errors.push(`Mapping[${i}]: duplicate target '${m.target}'`);
      }
      if (m.target) targets.add(m.target);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get processing statistics
   */
  getSummary() {
    return {
      totalMappings: this.mappings.length,
      ...this._stats,
    };
  }

  /**
   * Reset processing stats
   */
  resetStats() {
    this._stats = { processed: 0, mapped: 0, unmapped: 0, errors: 0 };
  }
}

module.exports = { FieldMappingEngine, CONVERTERS };
