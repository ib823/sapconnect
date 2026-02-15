/**
 * Tests for Base Source Adapter
 */
const { BaseSourceAdapter } = require('../../../lib/adapters/base-source-adapter');

describe('BaseSourceAdapter', () => {
  describe('instantiation', () => {
    it('should throw when instantiated directly', () => {
      expect(() => new BaseSourceAdapter()).toThrow('Cannot instantiate BaseSourceAdapter directly');
    });

    it('should allow subclass instantiation', () => {
      class TestAdapter extends BaseSourceAdapter {
        get sourceSystem() { return 'TEST'; }
      }
      const adapter = new TestAdapter();
      expect(adapter).toBeInstanceOf(BaseSourceAdapter);
      expect(adapter.sourceSystem).toBe('TEST');
    });
  });

  describe('defaults', () => {
    let adapter;

    beforeEach(() => {
      class TestAdapter extends BaseSourceAdapter {
        get sourceSystem() { return 'TEST'; }
      }
      adapter = new TestAdapter();
    });

    it('should default mode to mock', () => {
      expect(adapter.mode).toBe('mock');
    });

    it('should not be connected initially', () => {
      expect(adapter.isConnected).toBe(false);
    });

    it('should accept config', () => {
      class TestAdapter extends BaseSourceAdapter {
        get sourceSystem() { return 'TEST'; }
      }
      const a = new TestAdapter({ mode: 'live', customProp: 'x' });
      expect(a.mode).toBe('live');
      expect(a.config.customProp).toBe('x');
    });
  });

  describe('abstract methods', () => {
    let adapter;

    beforeEach(() => {
      class TestAdapter extends BaseSourceAdapter {
        get sourceSystem() { return 'TEST'; }
      }
      adapter = new TestAdapter();
    });

    it('connect() should throw', async () => {
      await expect(adapter.connect()).rejects.toThrow('not implemented');
    });

    it('disconnect() should throw', async () => {
      await expect(adapter.disconnect()).rejects.toThrow('not implemented');
    });

    it('readTable() should throw', async () => {
      await expect(adapter.readTable('TABLE')).rejects.toThrow('not implemented');
    });

    it('queryEntities() should throw', async () => {
      await expect(adapter.queryEntities('Entity')).rejects.toThrow('not implemented');
    });

    it('getSystemInfo() should throw', async () => {
      await expect(adapter.getSystemInfo()).rejects.toThrow('not implemented');
    });

    it('healthCheck() should throw', async () => {
      await expect(adapter.healthCheck()).rejects.toThrow('not implemented');
    });
  });

  describe('sourceSystem property', () => {
    it('should throw on subclass that does not override sourceSystem', () => {
      // The constructor references this.sourceSystem for the logger name,
      // so the error fires during construction if sourceSystem is not overridden.
      class BadAdapter extends BaseSourceAdapter {}
      expect(() => new BadAdapter()).toThrow('sourceSystem not implemented');
    });
  });

  describe('getStatus', () => {
    it('should return adapter status summary', () => {
      class TestAdapter extends BaseSourceAdapter {
        get sourceSystem() { return 'TEST'; }
      }
      const adapter = new TestAdapter({ mode: 'live' });
      const status = adapter.getStatus();
      expect(status).toEqual({
        sourceSystem: 'TEST',
        mode: 'live',
        connected: false,
      });
    });
  });
});
