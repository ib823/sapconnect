/**
 * Tests for BaseCanonicalEntity
 */

const BaseCanonicalEntity = require('../../../lib/canonical/base-entity');
const { CanonicalMappingError } = require('../../../lib/errors');

// Concrete subclass for testing
class TestEntity extends BaseCanonicalEntity {
  constructor() {
    super('TestEntity');
  }

  getRequiredFields() {
    return ['id', 'name'];
  }

  getFieldDefinitions() {
    return {
      id:          { type: 'string',  required: true,  maxLength: 10,  description: 'Unique identifier' },
      name:        { type: 'string',  required: true,  maxLength: 40,  description: 'Display name' },
      count:       { type: 'number',  required: false,                  description: 'A numeric count' },
      active:      { type: 'boolean', required: false,                  description: 'Whether entity is active' },
      tags:        { type: 'array',   required: false,                  description: 'List of tags' },
      createdDate: { type: 'date',    required: false,                  description: 'Creation date' },
    };
  }
}

describe('BaseCanonicalEntity', () => {
  describe('constructor', () => {
    it('cannot be instantiated directly', () => {
      expect(() => new BaseCanonicalEntity('Test')).toThrow(CanonicalMappingError);
      expect(() => new BaseCanonicalEntity('Test')).toThrow('Cannot instantiate BaseCanonicalEntity directly');
    });

    it('sets entityType and empty data on subclass', () => {
      const entity = new TestEntity();
      expect(entity.entityType).toBe('TestEntity');
      expect(entity.data).toEqual({});
    });
  });

  describe('validate()', () => {
    it('returns valid when all required fields are present', () => {
      const entity = new TestEntity();
      entity.data = { id: 'T001', name: 'Test Item' };
      const result = entity.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns errors for missing required fields', () => {
      const entity = new TestEntity();
      entity.data = {};
      const result = entity.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
      expect(result.errors).toContain('Missing required field: name');
    });

    it('returns error for empty string on required field', () => {
      const entity = new TestEntity();
      entity.data = { id: '', name: 'Test' };
      const result = entity.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
    });

    it('returns error for null on required field', () => {
      const entity = new TestEntity();
      entity.data = { id: null, name: 'Test' };
      const result = entity.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
    });

    it('validates string type', () => {
      const entity = new TestEntity();
      entity.data = { id: 123, name: 'Test' };
      const result = entity.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Field 'id' must be a string, got number");
    });

    it('validates number type', () => {
      const entity = new TestEntity();
      entity.data = { id: 'T001', name: 'Test', count: 'not-a-number' };
      const result = entity.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Field 'count' must be a number, got string");
    });

    it('validates boolean type', () => {
      const entity = new TestEntity();
      entity.data = { id: 'T001', name: 'Test', active: 'yes' };
      const result = entity.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Field 'active' must be a boolean, got string");
    });

    it('validates array type', () => {
      const entity = new TestEntity();
      entity.data = { id: 'T001', name: 'Test', tags: 'not-an-array' };
      const result = entity.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Field 'tags' must be an array, got string");
    });

    it('validates maxLength for strings', () => {
      const entity = new TestEntity();
      entity.data = { id: 'T001234567890', name: 'Test' };
      const result = entity.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("'id' exceeds max length 10"))).toBe(true);
    });

    it('passes validation for correct types', () => {
      const entity = new TestEntity();
      entity.data = {
        id: 'T001',
        name: 'Test',
        count: 42,
        active: true,
        tags: ['a', 'b'],
        createdDate: '2025-01-01',
      };
      const result = entity.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('skips validation for undefined/null optional fields', () => {
      const entity = new TestEntity();
      entity.data = { id: 'T001', name: 'Test', count: undefined, active: null };
      const result = entity.validate();
      expect(result.valid).toBe(true);
    });

    it('ignores fields not in definitions', () => {
      const entity = new TestEntity();
      entity.data = { id: 'T001', name: 'Test', unknownField: 12345 };
      const result = entity.validate();
      expect(result.valid).toBe(true);
    });
  });

  describe('toJSON()', () => {
    it('returns data with _entityType and _timestamp', () => {
      const entity = new TestEntity();
      entity.data = { id: 'T001', name: 'Test Entity' };
      const json = entity.toJSON();

      expect(json._entityType).toBe('TestEntity');
      expect(json._timestamp).toBeDefined();
      expect(typeof json._timestamp).toBe('string');
      expect(json.id).toBe('T001');
      expect(json.name).toBe('Test Entity');
    });

    it('includes all data fields in output', () => {
      const entity = new TestEntity();
      entity.data = { id: 'T001', name: 'Test', count: 5, active: true };
      const json = entity.toJSON();

      expect(json.count).toBe(5);
      expect(json.active).toBe(true);
    });

    it('produces a valid ISO timestamp', () => {
      const entity = new TestEntity();
      entity.data = { id: 'T001', name: 'Test' };
      const json = entity.toJSON();

      const parsed = new Date(json._timestamp);
      expect(parsed.toISOString()).toBe(json._timestamp);
    });
  });

  describe('getRequiredFields()', () => {
    it('returns required fields from subclass', () => {
      const entity = new TestEntity();
      expect(entity.getRequiredFields()).toEqual(['id', 'name']);
    });

    it('returns empty array from base class default', () => {
      // Create a minimal subclass without overriding getRequiredFields
      class MinimalEntity extends BaseCanonicalEntity {
        constructor() { super('Minimal'); }
      }
      const entity = new MinimalEntity();
      expect(entity.getRequiredFields()).toEqual([]);
    });
  });

  describe('getFieldDefinitions()', () => {
    it('returns field definitions from subclass', () => {
      const entity = new TestEntity();
      const defs = entity.getFieldDefinitions();
      expect(defs.id).toBeDefined();
      expect(defs.id.type).toBe('string');
      expect(defs.id.required).toBe(true);
      expect(defs.id.maxLength).toBe(10);
    });

    it('returns empty object from base class default', () => {
      class MinimalEntity extends BaseCanonicalEntity {
        constructor() { super('Minimal'); }
      }
      const entity = new MinimalEntity();
      expect(entity.getFieldDefinitions()).toEqual({});
    });
  });

  describe('fromSource()', () => {
    it('throws when no mappings exist for entity type', () => {
      const entity = new TestEntity();
      expect(() => entity.fromSource('SAP', {})).toThrow(CanonicalMappingError);
    });

    it('throws when source system is unsupported', () => {
      const entity = new TestEntity();
      expect(() => entity.fromSource('UNKNOWN_ERP', {})).toThrow(CanonicalMappingError);
    });
  });
});
