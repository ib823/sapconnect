/**
 * Base Canonical Entity
 *
 * Abstract base class for all OAGIS-aligned canonical data model entities.
 * Provides validation, serialization, and source-system mapping capabilities.
 *
 * Every entity subclass must implement:
 *   - getRequiredFields()     — returns string[] of required field names
 *   - getFieldDefinitions()   — returns { fieldName: { type, required, maxLength, description } }
 */

const Logger = require('../logger');
const { CanonicalMappingError } = require('../errors');

const log = new Logger('canonical');

class BaseCanonicalEntity {
  /**
   * @param {string} entityType — canonical entity type identifier (e.g. 'Item', 'Customer')
   */
  constructor(entityType) {
    if (new.target === BaseCanonicalEntity) {
      throw new CanonicalMappingError('Cannot instantiate BaseCanonicalEntity directly');
    }
    this.entityType = entityType;
    this.data = {};
  }

  // ── Validation ──────────────────────────────────────────────────────

  /**
   * Validate the entity data against required fields and field definitions.
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];
    const required = this.getRequiredFields();
    const definitions = this.getFieldDefinitions();

    // Check required fields
    for (const field of required) {
      if (this.data[field] === undefined || this.data[field] === null || this.data[field] === '') {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check field types and constraints
    for (const [fieldName, value] of Object.entries(this.data)) {
      if (value === undefined || value === null) continue;

      const def = definitions[fieldName];
      if (!def) continue;

      // Type check
      if (def.type === 'string' && typeof value !== 'string') {
        errors.push(`Field '${fieldName}' must be a string, got ${typeof value}`);
      } else if (def.type === 'number' && typeof value !== 'number') {
        errors.push(`Field '${fieldName}' must be a number, got ${typeof value}`);
      } else if (def.type === 'date' && !(value instanceof Date) && typeof value !== 'string') {
        errors.push(`Field '${fieldName}' must be a date or date string, got ${typeof value}`);
      } else if (def.type === 'array' && !Array.isArray(value)) {
        errors.push(`Field '${fieldName}' must be an array, got ${typeof value}`);
      } else if (def.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Field '${fieldName}' must be a boolean, got ${typeof value}`);
      }

      // MaxLength check (string only)
      if (def.maxLength && typeof value === 'string' && value.length > def.maxLength) {
        errors.push(`Field '${fieldName}' exceeds max length ${def.maxLength} (got ${value.length})`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // ── Serialization ───────────────────────────────────────────────────

  /**
   * Serialize entity to a JSON-safe object.
   * Includes _entityType and _timestamp metadata.
   */
  toJSON() {
    return {
      _entityType: this.entityType,
      _timestamp: new Date().toISOString(),
      ...this.data,
    };
  }

  // ── Source Mapping ──────────────────────────────────────────────────

  /**
   * Populate this entity from a source-system record using registered mappings.
   * @param {string} sourceSystem — e.g. 'SAP', 'INFOR_LN', 'INFOR_M3'
   * @param {object} record — raw source record
   * @returns {this}
   */
  fromSource(sourceSystem, record) {
    // Lazy-require to avoid circular dependency
    const { getMappings } = require('./source-mapping');

    const mappings = getMappings(sourceSystem, this.entityType);
    if (!mappings || mappings.length === 0) {
      throw new CanonicalMappingError(
        `No mappings found for source '${sourceSystem}' entity '${this.entityType}'`,
        { sourceSystem, entityType: this.entityType }
      );
    }

    log.debug(`Mapping ${sourceSystem} → ${this.entityType} (${mappings.length} fields)`);

    for (const mapping of mappings) {
      const sourceValue = record[mapping.source];
      if (sourceValue !== undefined && sourceValue !== null) {
        if (typeof mapping.convert === 'function') {
          this.data[mapping.target] = mapping.convert(sourceValue, record);
        } else {
          this.data[mapping.target] = sourceValue;
        }
      }
    }

    return this;
  }

  // ── Abstract Methods ────────────────────────────────────────────────

  /**
   * Return array of required field names.
   * Subclasses MUST override.
   * @returns {string[]}
   */
  getRequiredFields() {
    return [];
  }

  /**
   * Return field definition map.
   * Subclasses MUST override.
   * @returns {Object<string, { type: string, required: boolean, maxLength?: number, description: string }>}
   */
  getFieldDefinitions() {
    return {};
  }
}

module.exports = BaseCanonicalEntity;
