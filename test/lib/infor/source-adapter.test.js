/**
 * Tests for SourceAdapter abstract base class
 */
const SourceAdapter = require('../../../lib/infor/source-adapter');
const { InforError } = require('../../../lib/errors');

describe('SourceAdapter', () => {
  // ── Abstract enforcement ──────────────────────────────────────

  describe('abstract class enforcement', () => {
    it('should throw when instantiated directly', () => {
      expect(() => new SourceAdapter({ product: 'test' }))
        .toThrow(InforError);
    });

    it('should throw with descriptive message', () => {
      expect(() => new SourceAdapter())
        .toThrow('SourceAdapter is abstract and cannot be instantiated directly');
    });
  });

  // ── Subclass behavior ─────────────────────────────────────────

  describe('subclass behavior', () => {
    class TestAdapter extends SourceAdapter {
      constructor(config) {
        super({ ...config, product: 'test' });
      }
    }

    it('should allow instantiation via subclass', () => {
      const adapter = new TestAdapter({ mode: 'mock' });
      expect(adapter.product).toBe('test');
      expect(adapter.mode).toBe('mock');
    });

    it('should default mode to mock', () => {
      const adapter = new TestAdapter({});
      expect(adapter.mode).toBe('mock');
    });

    it('should initialize _connected to false', () => {
      const adapter = new TestAdapter({ mode: 'mock' });
      expect(adapter._connected).toBe(false);
    });
  });

  // ── Required method signatures ────────────────────────────────

  describe('required method signatures', () => {
    class BareAdapter extends SourceAdapter {
      constructor() {
        super({ product: 'bare', mode: 'mock' });
      }
    }

    let adapter;

    beforeEach(() => {
      adapter = new BareAdapter();
    });

    it('should throw from readTable() if not overridden', async () => {
      await expect(adapter.readTable('SomeTable'))
        .rejects.toThrow(InforError);
    });

    it('should include class name in readTable error', async () => {
      await expect(adapter.readTable('SomeTable'))
        .rejects.toThrow('BareAdapter');
    });

    it('should throw from getSystemInfo() if not overridden', async () => {
      await expect(adapter.getSystemInfo())
        .rejects.toThrow(InforError);
    });

    it('should throw from healthCheck() if not overridden', async () => {
      await expect(adapter.healthCheck())
        .rejects.toThrow(InforError);
    });

    it('should throw from connect() if not overridden', async () => {
      await expect(adapter.connect())
        .rejects.toThrow(InforError);
    });

    it('should allow disconnect() without override', async () => {
      adapter._connected = true;
      await adapter.disconnect();
      expect(adapter._connected).toBe(false);
    });
  });
});
