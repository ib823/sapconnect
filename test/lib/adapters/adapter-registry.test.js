/**
 * Tests for Adapter Registry
 */
const { AdapterRegistry } = require('../../../lib/adapters/adapter-registry');
const { BaseSourceAdapter } = require('../../../lib/adapters/base-source-adapter');

// Minimal test adapter
class MockAdapter extends BaseSourceAdapter {
  get sourceSystem() { return 'MOCK'; }
  async connect() { this._connected = true; return { success: true }; }
  async disconnect() { this._connected = false; }
  async readTable() { return { rows: [], totalRows: 0, fields: [] }; }
  async queryEntities() { return { entities: [], totalCount: 0 }; }
  async getSystemInfo() { return { systemId: 'MOCK' }; }
  async healthCheck() { return { healthy: true, latencyMs: 1, details: {} }; }
}

describe('AdapterRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new AdapterRegistry();
  });

  describe('auto-registration', () => {
    it('should auto-register SAP adapter', () => {
      expect(registry.has('SAP')).toBe(true);
    });

    it('should auto-register INFOR_M3 adapter', () => {
      expect(registry.has('INFOR_M3')).toBe(true);
    });

    it('should auto-register INFOR_LN adapter', () => {
      expect(registry.has('INFOR_LN')).toBe(true);
    });
  });

  describe('register', () => {
    it('should register a custom adapter', () => {
      registry.register('CUSTOM', MockAdapter);
      expect(registry.has('CUSTOM')).toBe(true);
    });

    it('should be case-insensitive', () => {
      registry.register('mySystem', MockAdapter);
      expect(registry.has('MYSYSTEM')).toBe(true);
      expect(registry.has('mysystem')).toBe(true);
    });

    it('should throw on empty systemType', () => {
      expect(() => registry.register('', MockAdapter)).toThrow('non-empty string');
    });

    it('should throw on non-function AdapterClass', () => {
      expect(() => registry.register('X', {})).toThrow('constructor function');
    });
  });

  describe('get', () => {
    it('should return the registered class', () => {
      registry.register('CUSTOM', MockAdapter);
      expect(registry.get('CUSTOM')).toBe(MockAdapter);
    });

    it('should throw for unregistered system', () => {
      expect(() => registry.get('NONEXISTENT')).toThrow('No adapter registered');
    });

    it('should be case-insensitive', () => {
      registry.register('CuStOm', MockAdapter);
      expect(registry.get('custom')).toBe(MockAdapter);
    });
  });

  describe('create', () => {
    it('should create an instance of the registered adapter', () => {
      registry.register('CUSTOM', MockAdapter);
      const instance = registry.create('CUSTOM', { mode: 'mock' });
      expect(instance).toBeInstanceOf(MockAdapter);
      expect(instance).toBeInstanceOf(BaseSourceAdapter);
      expect(instance.mode).toBe('mock');
    });

    it('should throw for unregistered system', () => {
      expect(() => registry.create('NONEXISTENT')).toThrow('No adapter registered');
    });
  });

  describe('listSystems', () => {
    it('should list all registered systems', () => {
      const systems = registry.listSystems();
      expect(systems).toContain('SAP');
      expect(systems).toContain('INFOR_M3');
      expect(systems).toContain('INFOR_LN');
    });

    it('should include custom registrations', () => {
      registry.register('CUSTOM', MockAdapter);
      expect(registry.listSystems()).toContain('CUSTOM');
    });
  });

  describe('has', () => {
    it('should return true for registered systems', () => {
      expect(registry.has('SAP')).toBe(true);
    });

    it('should return false for unregistered systems', () => {
      expect(registry.has('ORACLE')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should remove a registered adapter', () => {
      registry.register('CUSTOM', MockAdapter);
      registry.unregister('CUSTOM');
      expect(registry.has('CUSTOM')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all registrations', () => {
      registry.clear();
      expect(registry.listSystems()).toHaveLength(0);
    });
  });
});
