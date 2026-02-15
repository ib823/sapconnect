/**
 * Tests for SSE streaming endpoints in the Express server.
 */

const http = require('http');
const { createApp } = require('../server');

describe('SSE Endpoints', () => {
  let app, server, baseUrl;

  beforeAll(async () => {
    app = createApp({ port: 0, apiKey: '' });
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('should expose progressBus on app', () => {
    expect(app._progressBus).toBeDefined();
    expect(typeof app._progressBus.emit).toBe('function');
    expect(typeof app._progressBus.connectSSE).toBe('function');
  });

  it('should attach progressBus to forensicState', () => {
    expect(app._forensicState.progressBus).toBe(app._progressBus);
  });

  describe('GET /api/events/history', () => {
    it('should return empty history initially', async () => {
      const body = await fetchJSON(`${baseUrl}/api/events/history`);
      expect(body.events).toEqual([]);
      expect(body.clients).toBe(0);
    });

    it('should return emitted events', async () => {
      app._progressBus.emit('extraction:start', { extractor: 'TEST' });
      app._progressBus.emit('extraction:progress', { percent: 50 });

      const body = await fetchJSON(`${baseUrl}/api/events/history`);
      expect(body.events).toHaveLength(2);
      expect(body.events[0].type).toBe('extraction:start');
    });

    it('should filter by type', async () => {
      app._progressBus.emit('migration:start', { objectId: 'MAT-001' });

      const body = await fetchJSON(`${baseUrl}/api/events/history?type=migration`);
      expect(body.events).toHaveLength(1);
      expect(body.events[0].type).toBe('migration:start');
    });

    it('should respect count parameter', async () => {
      const body = await fetchJSON(`${baseUrl}/api/events/history?count=1`);
      expect(body.events).toHaveLength(1);
    });
  });

  describe('GET /api/events (SSE)', () => {
    it('should return SSE content type and connected event', async () => {
      const { headers, body } = await fetchRaw(`${baseUrl}/api/events?replay=0`, 300);
      expect(headers['content-type']).toBe('text/event-stream');
      expect(body).toContain('event: connected');
    });
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${data.substring(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

function fetchRaw(url, timeout = 500) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      setTimeout(() => {
        req.destroy();
        resolve({ headers: res.headers, body: data });
      }, timeout);
    });
  });
}
