/**
 * Progress Bus — Central event hub for real-time progress streaming.
 *
 * Uses Node.js EventEmitter to broadcast typed events from extraction,
 * migration, and agent operations to SSE-connected dashboard clients.
 *
 * Usage:
 *   const bus = new ProgressBus();
 *   bus.emit('extraction:progress', { extractor: 'CUSTOM_CODE', percent: 45 });
 *   bus.emit('migration:complete', { objectId: 'MAT-001', status: 'success' });
 *
 * SSE integration:
 *   bus.connectSSE(res);  // Wires an Express response as SSE stream
 */

const { EventEmitter } = require('events');
const Logger = require('./logger');

const EVENT_TYPES = [
  'extraction:start',
  'extraction:progress',
  'extraction:complete',
  'extraction:error',
  'migration:start',
  'migration:progress',
  'migration:complete',
  'migration:error',
  'agent:start',
  'agent:progress',
  'agent:complete',
  'agent:error',
  'system:health',
  'system:info',
];

class ProgressBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Support many SSE clients
    this._clients = new Set();
    this._history = [];
    this._maxHistory = 200;
    this._log = new Logger('progress-bus');
  }

  /**
   * Emit a typed event and broadcast to all SSE clients.
   * @param {string} type — Event type (e.g. 'extraction:progress')
   * @param {object} data — Event payload
   */
  emit(type, data = {}) {
    const event = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    // Store in history ring buffer
    this._history.push(event);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    // Broadcast to SSE clients
    this._broadcast(event);

    // Also emit on EventEmitter for internal listeners
    return super.emit(type, event);
  }

  /**
   * Connect an Express response as an SSE stream.
   * @param {import('express').Response} res
   * @param {object} [options]
   * @param {number} [options.replayCount=20] — Number of recent events to replay
   */
  connectSSE(res, options = {}) {
    const { replayCount = 20 } = options;

    // SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId: this._clients.size + 1, timestamp: new Date().toISOString() })}\n\n`);

    // Replay recent events
    const recent = this._history.slice(-replayCount);
    for (const event of recent) {
      res.write(`id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    }

    // Add to client set
    this._clients.add(res);
    this._log.debug(`SSE client connected (${this._clients.size} total)`);

    // Heartbeat to keep connection alive (every 30s)
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 30000);

    // Cleanup on disconnect
    res.on('close', () => {
      clearInterval(heartbeat);
      this._clients.delete(res);
      this._log.debug(`SSE client disconnected (${this._clients.size} remaining)`);
    });
  }

  /**
   * Get recent event history.
   * @param {number} [count=50]
   * @param {string} [typeFilter] — Optional type prefix filter
   */
  getHistory(count = 50, typeFilter = null) {
    let events = this._history;
    if (typeFilter) {
      events = events.filter(e => e.type.startsWith(typeFilter));
    }
    return events.slice(-count);
  }

  /** Number of connected SSE clients */
  get clientCount() {
    return this._clients.size;
  }

  /** @private */
  _broadcast(event) {
    const message = `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of this._clients) {
      try {
        client.write(message);
      } catch {
        this._clients.delete(client);
      }
    }
  }
}

module.exports = { ProgressBus, EVENT_TYPES };
