/**
 * Tests for EntityRegistry
 */

const EntityRegistry = require('../../../lib/canonical/entity-registry');
const BaseCanonicalEntity = require('../../../lib/canonical/base-entity');
const { CanonicalMappingError } = require('../../../lib/errors');

// Custom entity for testing registration
class CustomEntity extends BaseCanonicalEntity {
  constructor() {
    super('CustomEntity');
  }

  getRequiredFields() {
    return ['customId'];
  }

  getFieldDefinitions() {
    return {
      customId: { type: 'string', required: true, maxLength: 20, description: 'Custom identifier' },
    };
  }
}

describe('EntityRegistry', () => {
  describe('auto-registration', () => {
    it('has all 14 built-in entities registered', () => {
      const types = EntityRegistry.listTypes();
      expect(types).toContain('Item');
      expect(types).toContain('Customer');
      expect(types).toContain('Vendor');
      expect(types).toContain('ChartOfAccounts');
      expect(types).toContain('SalesOrder');
      expect(types).toContain('PurchaseOrder');
      expect(types).toContain('ProductionOrder');
      expect(types).toContain('Inventory');
      expect(types).toContain('GlEntry');
      expect(types).toContain('Employee');
      expect(types).toContain('Bom');
      expect(types).toContain('Routing');
      expect(types).toContain('FixedAsset');
      expect(types).toContain('CostCenter');
      expect(types.length).toBe(14);
    });
  });

  describe('register()', () => {
    afterEach(() => {
      // Clean up custom registrations — re-register built-ins are idempotent
      // Just remove our custom one if it was added
      EntityRegistry._entities.delete('CustomEntity');
    });

    it('registers a custom entity class', () => {
      EntityRegistry.register('CustomEntity', CustomEntity);
      expect(EntityRegistry.get('CustomEntity')).toBe(CustomEntity);
    });

    it('overwrites existing registration with warning', () => {
      EntityRegistry.register('CustomEntity', CustomEntity);
      // Register again — should not throw
      EntityRegistry.register('CustomEntity', CustomEntity);
      expect(EntityRegistry.get('CustomEntity')).toBe(CustomEntity);
    });
  });

  describe('get()', () => {
    it('returns class for registered entity type', () => {
      const ItemClass = EntityRegistry.get('Item');
      expect(ItemClass).toBeDefined();
      expect(typeof ItemClass).toBe('function');
    });

    it('returns null for unregistered entity type', () => {
      expect(EntityRegistry.get('NonExistentEntity')).toBeNull();
    });
  });

  describe('create()', () => {
    it('creates a new instance of a registered entity', () => {
      const item = EntityRegistry.create('Item');
      expect(item).toBeDefined();
      expect(item.entityType).toBe('Item');
      expect(item.data).toEqual({});
    });

    it('creates distinct instances on each call', () => {
      const item1 = EntityRegistry.create('Item');
      const item2 = EntityRegistry.create('Item');
      item1.data.itemId = 'A';
      expect(item2.data.itemId).toBeUndefined();
    });

    it('throws CanonicalMappingError for unknown entity type', () => {
      expect(() => EntityRegistry.create('FictionalEntity')).toThrow(CanonicalMappingError);
      expect(() => EntityRegistry.create('FictionalEntity')).toThrow('Unknown entity type: FictionalEntity');
    });

    it('creates all 14 built-in entity types', () => {
      const types = EntityRegistry.listTypes();
      for (const type of types) {
        const entity = EntityRegistry.create(type);
        expect(entity.entityType).toBe(type);
        expect(Array.isArray(entity.getRequiredFields())).toBe(true);
        expect(typeof entity.getFieldDefinitions()).toBe('object');
      }
    });
  });

  describe('listTypes()', () => {
    it('returns an array of strings', () => {
      const types = EntityRegistry.listTypes();
      expect(Array.isArray(types)).toBe(true);
      for (const t of types) {
        expect(typeof t).toBe('string');
      }
    });

    it('includes newly registered types', () => {
      EntityRegistry.register('CustomEntity', CustomEntity);
      const types = EntityRegistry.listTypes();
      expect(types).toContain('CustomEntity');
      EntityRegistry._entities.delete('CustomEntity');
    });
  });

  describe('clear()', () => {
    it('removes all registrations', () => {
      // Save a reference to restore after test
      const savedEntities = new Map(EntityRegistry._entities);

      EntityRegistry.clear();
      expect(EntityRegistry.listTypes()).toEqual([]);
      expect(EntityRegistry.get('Item')).toBeNull();

      // Restore
      for (const [k, v] of savedEntities) {
        EntityRegistry._entities.set(k, v);
      }
    });
  });
});
