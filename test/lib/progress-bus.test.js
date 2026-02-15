/**
 * Tests for ProgressBus — SSE event streaming infrastructure.
 */

const { ProgressBus, EVENT_TYPES } = require('../../lib/progress-bus');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createMockResponse() {
  const chunks = [];
  const res = {
    writeHead: vi.fn(),
    write: vi.fn((data) => chunks.push(data)),
    on: vi.fn((event, cb) => {
      if (event === 'close') res._onClose = cb;
    }),
    _onClose: null,
    _chunks: chunks,
    destroy() {
      if (res._onClose) res._onClose();
    },
  };
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ProgressBus', () => {
  let bus;

  beforeEach(() => {
    bus = new ProgressBus();
  });

  describe('emit', () => {
    it('should store events in history', () => {
      bus.emit('extraction:start', { extractor: 'CUSTOM_CODE' });
      const history = bus.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('extraction:start');
      expect(history[0].data.extractor).toBe('CUSTOM_CODE');
      expect(history[0].id).toBeDefined();
      expect(history[0].timestamp).toBeDefined();
    });

    it('should cap history at maxHistory', () => {
      bus._maxHistory = 5;
      for (let i = 0; i < 10; i++) {
        bus.emit('extraction:progress', { i });
      }
      expect(bus.getHistory()).toHaveLength(5);
      expect(bus.getHistory()[0].data.i).toBe(5);
    });

    it('should trigger EventEmitter listeners', () => {
      const handler = vi.fn();
      bus.on('migration:complete', handler);
      bus.emit('migration:complete', { objectId: 'MAT-001' });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'migration:complete',
        data: { objectId: 'MAT-001' },
      }));
    });
  });

  describe('getHistory', () => {
    beforeEach(() => {
      bus.emit('extraction:start', { a: 1 });
      bus.emit('extraction:progress', { a: 2 });
      bus.emit('migration:start', { a: 3 });
      bus.emit('extraction:complete', { a: 4 });
    });

    it('should return all events when count exceeds history', () => {
      expect(bus.getHistory(100)).toHaveLength(4);
    });

    it('should limit by count', () => {
      expect(bus.getHistory(2)).toHaveLength(2);
    });

    it('should filter by type prefix', () => {
      const filtered = bus.getHistory(50, 'extraction');
      expect(filtered).toHaveLength(3);
      filtered.forEach(e => expect(e.type).toMatch(/^extraction:/));
    });

    it('should filter by migration prefix', () => {
      const filtered = bus.getHistory(50, 'migration');
      expect(filtered).toHaveLength(1);
    });
  });

  describe('connectSSE', () => {
    it('should set SSE headers on response', () => {
      const res = createMockResponse();
      bus.connectSSE(res);
      expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      }));
      res.destroy();
    });

    it('should send connected event', () => {
      const res = createMockResponse();
      bus.connectSSE(res);
      expect(res._chunks[0]).toContain('event: connected');
      expect(res._chunks[0]).toContain('clientId');
      res.destroy();
    });

    it('should replay recent events', () => {
      bus.emit('extraction:start', { a: 1 });
      bus.emit('extraction:progress', { a: 2 });

      const res = createMockResponse();
      bus.connectSSE(res, { replayCount: 10 });

      // chunks: [connected, event1, event2]
      const eventChunks = res._chunks.filter(c => c.includes('extraction:'));
      expect(eventChunks).toHaveLength(2);
      res.destroy();
    });

    it('should track client count', () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      bus.connectSSE(res1);
      bus.connectSSE(res2);
      expect(bus.clientCount).toBe(2);
      res1.destroy();
      expect(bus.clientCount).toBe(1);
      res2.destroy();
      expect(bus.clientCount).toBe(0);
    });

    it('should broadcast new events to connected clients', () => {
      const res = createMockResponse();
      bus.connectSSE(res);
      const initialChunks = res._chunks.length;

      bus.emit('extraction:progress', { percent: 50 });

      expect(res._chunks.length).toBe(initialChunks + 1);
      expect(res._chunks[initialChunks]).toContain('extraction:progress');
      expect(res._chunks[initialChunks]).toContain('"percent":50');
      res.destroy();
    });

    it('should handle client disconnection gracefully', () => {
      const res = createMockResponse();
      bus.connectSSE(res);
      expect(bus.clientCount).toBe(1);

      // Simulate write error
      res.write.mockImplementation(() => { throw new Error('Connection closed'); });
      bus.emit('extraction:progress', { percent: 80 });

      expect(bus.clientCount).toBe(0);
    });

    it('should limit replay count', () => {
      for (let i = 0; i < 30; i++) {
        bus.emit('extraction:progress', { i });
      }

      const res = createMockResponse();
      bus.connectSSE(res, { replayCount: 5 });

      const eventChunks = res._chunks.filter(c => c.includes('extraction:'));
      expect(eventChunks).toHaveLength(5);
      res.destroy();
    });
  });
});

describe('EVENT_TYPES', () => {
  it('should export known event types', () => {
    expect(EVENT_TYPES).toContain('extraction:start');
    expect(EVENT_TYPES).toContain('extraction:progress');
    expect(EVENT_TYPES).toContain('extraction:complete');
    expect(EVENT_TYPES).toContain('migration:start');
    expect(EVENT_TYPES).toContain('agent:start');
    expect(EVENT_TYPES).toContain('system:health');
    expect(EVENT_TYPES.length).toBeGreaterThanOrEqual(14);
  });
});
