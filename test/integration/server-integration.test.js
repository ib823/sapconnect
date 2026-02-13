/**
 * Integration Test — Express Server Endpoints
 *
 * Tests every public route exposed by server.js using Node's
 * built-in http module (no external HTTP client needed).
 * Verifies responses, security headers, and operational endpoints.
 */

const http = require('http');
const { createApp } = require('../../server');

// ── Helper: spin up a throwaway server, make one request, tear down ──
function makeRequest(app, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const options = {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          server.close();
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: JSON.parse(data),
            });
          } catch {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data,
            });
          }
        });
      });
      req.on('error', (e) => {
        server.close();
        reject(e);
      });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

/**
 * Helper that reuses a single server for multiple sequential requests.
 * Required when the test depends on state accumulated from prior requests
 * (e.g. metrics data that only appears after at least one hit).
 */
function makeSequentialRequests(app, requestSpecs) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, async () => {
      const port = server.address().port;
      const results = [];
      try {
        for (const spec of requestSpecs) {
          const result = await new Promise((res, rej) => {
            const options = {
              hostname: 'localhost',
              port,
              path: spec.path,
              method: spec.method || 'GET',
              headers: { 'Content-Type': 'application/json' },
            };
            const req = http.request(options, (response) => {
              let data = '';
              response.on('data', (chunk) => (data += chunk));
              response.on('end', () => {
                try {
                  res({
                    status: response.statusCode,
                    headers: response.headers,
                    body: JSON.parse(data),
                  });
                } catch {
                  res({
                    status: response.statusCode,
                    headers: response.headers,
                    body: data,
                  });
                }
              });
            });
            req.on('error', rej);
            if (spec.body) req.write(JSON.stringify(spec.body));
            req.end();
          });
          results.push(result);
          // Yield to let server-side finish handlers (e.g. metrics middleware) run
          await new Promise(r => setTimeout(r, 10));
        }
        server.close();
        resolve(results);
      } catch (err) {
        server.close();
        reject(err);
      }
    });
  });
}

describe('Express Server Integration', () => {
  let app;

  beforeEach(() => {
    app = createApp({ migrationMode: 'mock', logLevel: 'warn' });
  });

  // ──────────────────────────────────────────────────────────
  // Operational Endpoints
  // ──────────────────────────────────────────────────────────
  describe('Operational Endpoints', () => {
    it('GET /health returns 200 with status, uptime, version, and memory info', async () => {
      const res = await makeRequest(app, 'GET', '/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('up');
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.version).toBeDefined();
      expect(res.body.memory).toBeDefined();
      expect(typeof res.body.memory.rss).toBe('number');
    });

    it('GET /ready returns 200 with status and checks', async () => {
      const res = await makeRequest(app, 'GET', '/ready');

      expect(res.status).toBe(200);
      expect(res.body.status).toBeDefined();
      expect(res.body.checks).toBeDefined();
      expect(typeof res.body.checks).toBe('object');
    });

    it('GET /metrics returns text/plain Prometheus format with sapconnect_ prefix', async () => {
      // Metrics are populated by the middleware after requests are processed.
      // We hit /health first on the same server instance so that the metrics
      // collector records at least one request, then check /metrics.
      const [, metricsRes] = await makeSequentialRequests(app, [
        { method: 'GET', path: '/health' },
        { method: 'GET', path: '/metrics' },
      ]);

      expect(metricsRes.status).toBe(200);
      expect(metricsRes.headers['content-type']).toMatch(/text\/plain/);
      // Body is a string in Prometheus exposition format
      expect(typeof metricsRes.body).toBe('string');
      expect(metricsRes.body).toContain('sapconnect_');
    });
  });

  // ──────────────────────────────────────────────────────────
  // API Endpoints
  // ──────────────────────────────────────────────────────────
  describe('API Endpoints', () => {
    it('GET /api/info returns name, version, environment, migrationMode, and migrationObjects count', async () => {
      const res = await makeRequest(app, 'GET', '/api/info');

      expect(res.status).toBe(200);
      expect(res.body.name).toBeDefined();
      expect(typeof res.body.name).toBe('string');
      expect(res.body.version).toBeDefined();
      expect(res.body.environment).toBeDefined();
      expect(res.body.migrationMode).toBeDefined();
      expect(typeof res.body.migrationObjects).toBe('number');
      expect(res.body.migrationObjects).toBeGreaterThan(0);
    });

    it('GET /api/dashboard/summary returns totalObjects and totalRules', async () => {
      const res = await makeRequest(app, 'GET', '/api/dashboard/summary');

      expect(res.status).toBe(200);
      expect(typeof res.body.totalObjects).toBe('number');
      expect(res.body.totalObjects).toBeGreaterThan(0);
      expect(typeof res.body.totalRules).toBe('number');
      expect(res.body.timestamp).toBeDefined();
    });

    it('GET /api/dashboard/objects returns array of objects', async () => {
      const res = await makeRequest(app, 'GET', '/api/dashboard/objects');

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);

      for (const obj of res.body) {
        expect(obj).toHaveProperty('objectId');
        expect(obj).toHaveProperty('name');
        expect(typeof obj.objectId).toBe('string');
        expect(typeof obj.name).toBe('string');
      }
    });

    it('GET /api/dashboard/rules returns rules analysis', async () => {
      const res = await makeRequest(app, 'GET', '/api/dashboard/rules');

      expect(res.status).toBe(200);
      expect(typeof res.body.total).toBe('number');
      expect(res.body).toHaveProperty('bySeverity');
      expect(res.body).toHaveProperty('byCategory');
    });
  });

  // ──────────────────────────────────────────────────────────
  // Audit Endpoints
  // ──────────────────────────────────────────────────────────
  describe('Audit Endpoints', () => {
    it('GET /api/audit returns total and entries array', async () => {
      const res = await makeRequest(app, 'GET', '/api/audit');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('entries');
      expect(res.body.entries).toBeInstanceOf(Array);
    });

    it('GET /api/audit/stats returns totalEntries, byEvent, and byOutcome', async () => {
      const res = await makeRequest(app, 'GET', '/api/audit/stats');

      expect(res.status).toBe(200);
      expect(typeof res.body.totalEntries).toBe('number');
      expect(res.body).toHaveProperty('byEvent');
      expect(res.body).toHaveProperty('byOutcome');
    });
  });

  // ──────────────────────────────────────────────────────────
  // Error Handling
  // ──────────────────────────────────────────────────────────
  describe('Error Handling', () => {
    it('GET /nonexistent returns 404 JSON with error "Not Found"', async () => {
      const res = await makeRequest(app, 'GET', '/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
      expect(res.body.status).toBe(404);
      expect(res.body.timestamp).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────
  // Security Headers
  // ──────────────────────────────────────────────────────────
  describe('Security Headers', () => {
    it('X-Content-Type-Options: nosniff is present', async () => {
      const res = await makeRequest(app, 'GET', '/health');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('X-Frame-Options: DENY is present', async () => {
      const res = await makeRequest(app, 'GET', '/health');

      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    it('Strict-Transport-Security header is present', async () => {
      const res = await makeRequest(app, 'GET', '/health');

      expect(res.headers['strict-transport-security']).toBeDefined();
      expect(res.headers['strict-transport-security']).toContain('max-age=');
    });

    it('CORS header Access-Control-Allow-Origin is present', async () => {
      const res = await makeRequest(app, 'GET', '/health');

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });

    it('X-Request-ID header is present in response', async () => {
      const res = await makeRequest(app, 'GET', '/health');

      expect(res.headers['x-request-id']).toBeDefined();
      expect(typeof res.headers['x-request-id']).toBe('string');
      expect(res.headers['x-request-id'].length).toBeGreaterThan(0);
    });
  });
});
