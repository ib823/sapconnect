/**
 * Input Validation Engine
 *
 * Schema-based validation for all API inputs.
 * Uses lightweight inline validation (no external deps).
 */

class ValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.statusCode = 400;
  }
}

const SCHEMAS = {
  objectId: {
    type: 'string',
    pattern: /^[A-Z][A-Z0-9_]{1,49}$/,
    message: 'Object ID must be 1-50 uppercase alphanumeric characters with underscores',
  },
  projectId: {
    type: 'string',
    pattern: /^[A-Za-z0-9][A-Za-z0-9_-]{0,49}$/,
    message: 'Project ID must be 1-50 alphanumeric characters with hyphens/underscores',
  },
  projectName: {
    type: 'string',
    minLength: 1,
    maxLength: 200,
    message: 'Project name must be 1-200 characters',
  },
  template: {
    type: 'string',
    enum: ['greenfield_full', 'brownfield_core', 'brownfield_full', 'selective_data', 'landscape_consolidation'],
    message: 'Invalid template identifier',
  },
  mode: {
    type: 'string',
    enum: ['mock', 'live', 'vsp'],
    message: 'Mode must be mock, live, or vsp',
  },
  modules: {
    type: 'array',
    items: { type: 'string', pattern: /^[A-Z]{2,4}$/ },
    maxItems: 20,
    message: 'Modules must be an array of 2-4 character uppercase codes',
  },
  pagination: {
    type: 'object',
    properties: {
      limit: { type: 'number', min: 1, max: 1000, default: 100 },
      offset: { type: 'number', min: 0, default: 0 },
    },
  },
};

class InputValidator {
  constructor() {
    this.schemas = { ...SCHEMAS };
  }

  validate(value, schemaName) {
    const schema = this.schemas[schemaName];
    if (!schema) throw new Error(`Unknown schema: ${schemaName}`);
    return this._validateValue(value, schema, schemaName);
  }

  validateObject(obj, schemaMap) {
    const errors = [];
    const sanitized = {};

    for (const [field, schemaName] of Object.entries(schemaMap)) {
      try {
        if (obj[field] !== undefined) {
          sanitized[field] = this.validate(obj[field], schemaName);
        }
      } catch (err) {
        errors.push({ field, message: err.message, value: obj[field] });
      }
    }

    if (errors.length > 0) {
      const err = new ValidationError(
        `Validation failed: ${errors.map(e => e.message).join('; ')}`,
        errors[0].field,
        errors[0].value
      );
      err.errors = errors;
      throw err;
    }

    return sanitized;
  }

  _validateValue(value, schema, fieldName) {
    // Type check
    if (schema.type === 'string') {
      if (typeof value !== 'string') {
        throw new ValidationError(`${fieldName} must be a string`, fieldName, value);
      }
      // Sanitize: trim and remove control characters
      value = value.trim().replace(/[\x00-\x1f\x7f]/g, '');

      if (schema.minLength && value.length < schema.minLength) {
        throw new ValidationError(schema.message || `${fieldName} too short`, fieldName, value);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        throw new ValidationError(schema.message || `${fieldName} too long`, fieldName, value);
      }
      if (schema.pattern && !schema.pattern.test(value)) {
        throw new ValidationError(schema.message || `${fieldName} format invalid`, fieldName, value);
      }
      if (schema.enum && !schema.enum.includes(value)) {
        throw new ValidationError(schema.message || `${fieldName} must be one of: ${schema.enum.join(', ')}`, fieldName, value);
      }
    }

    if (schema.type === 'number') {
      value = Number(value);
      if (isNaN(value)) {
        throw new ValidationError(`${fieldName} must be a number`, fieldName, value);
      }
      if (schema.min !== undefined && value < schema.min) {
        throw new ValidationError(`${fieldName} must be >= ${schema.min}`, fieldName, value);
      }
      if (schema.max !== undefined && value > schema.max) {
        throw new ValidationError(`${fieldName} must be <= ${schema.max}`, fieldName, value);
      }
    }

    if (schema.type === 'array') {
      if (!Array.isArray(value)) {
        throw new ValidationError(`${fieldName} must be an array`, fieldName, value);
      }
      if (schema.maxItems && value.length > schema.maxItems) {
        throw new ValidationError(`${fieldName} exceeds max ${schema.maxItems} items`, fieldName, value);
      }
      if (schema.items) {
        value = value.map((item, i) => this._validateValue(item, schema.items, `${fieldName}[${i}]`));
      }
    }

    if (schema.type === 'object' && schema.properties) {
      if (typeof value !== 'object' || value === null) {
        throw new ValidationError(`${fieldName} must be an object`, fieldName, value);
      }
      const result = {};
      for (const [prop, propSchema] of Object.entries(schema.properties)) {
        if (value[prop] !== undefined) {
          result[prop] = this._validateValue(value[prop], propSchema, `${fieldName}.${prop}`);
        } else if (propSchema.default !== undefined) {
          result[prop] = propSchema.default;
        }
      }
      return result;
    }

    return value;
  }

  /** Express middleware factory */
  middleware(paramSchemas = {}, bodySchemas = {}, querySchemas = {}) {
    return (req, _res, next) => {
      try {
        if (Object.keys(paramSchemas).length > 0) {
          this.validateObject(req.params, paramSchemas);
        }
        if (Object.keys(bodySchemas).length > 0 && req.body) {
          this.validateObject(req.body, bodySchemas);
        }
        if (Object.keys(querySchemas).length > 0) {
          this.validateObject(req.query, querySchemas);
        }
        next();
      } catch (err) {
        next(err);
      }
    };
  }
}

module.exports = { InputValidator, ValidationError, SCHEMAS };
