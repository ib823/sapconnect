/**
 * Tests for Signavio API endpoints
 *
 * Verifies all 6 Signavio endpoints return correct mock data,
 * handle 404s for missing models, and support search filtering.
 */

const http = require('http');
const { createApp } = require('../../server');

// ── HTTP test helpers ─────────────────────────────────────────

function request(app) {
  return {
    get: (path) =>
      new Promise((resolve, reject) => {
        const server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => {
          const port = server.address().port;
          const req = http.get(
            `http://127.0.0.1:${port}${path}`,
            (res) => {
              let data = '';
              res.on('data', (chunk) => (data += chunk));
              res.on('end', () => {
                server.close();
                let body;
                try {
                  body = JSON.parse(data);
                } catch {
                  body = data;
                }
                resolve({ status: res.statusCode, headers: res.headers, body });
              });
            }
          );
          req.on('error', (e) => {
            server.close();
            reject(e);
          });
        });
      }),
    post: (path, postBody) =>
      new Promise((resolve, reject) => {
        const server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => {
          const port = server.address().port;
          const postData = JSON.stringify(postBody || {});
          const req = http.request(
            {
              hostname: '127.0.0.1',
              port,
              path,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
              },
            },
            (res) => {
              let data = '';
              res.on('data', (chunk) => (data += chunk));
              res.on('end', () => {
                server.close();
                let body;
                try {
                  body = JSON.parse(data);
                } catch {
                  body = data;
                }
                resolve({ status: res.statusCode, headers: res.headers, body });
              });
            }
          );
          req.on('error', (e) => {
            server.close();
            reject(e);
          });
          req.write(postData);
          req.end();
        });
      }),
  };
}

// ── Tests ────────────────────────────────────────────────────

describe('Signavio API', () => {
  let app;

  beforeEach(() => {
    app = createApp({ NODE_ENV: 'test', LOG_LEVEL: 'error' });
  });

  // ── GET /api/signavio/models ────────────────────────────────

  describe('GET /api/signavio/models', () => {
    it('should return 200 with models array', async () => {
      const res = await request(app).get('/api/signavio/models');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.models)).toBe(true);
      expect(res.body.models.length).toBe(5);
      expect(res.body.total).toBe(5);
    });

    it('should return models with expected fields', async () => {
      const res = await request(app).get('/api/signavio/models');
      const model = res.body.models[0];
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('description');
      expect(model).toHaveProperty('revisionId');
      expect(model).toHaveProperty('lastModified');
      expect(model).toHaveProperty('author');
    });
  });

  // ── GET /api/signavio/models/:id ────────────────────────────

  describe('GET /api/signavio/models/:id', () => {
    it('should return 200 with model for valid revision ID', async () => {
      const res = await request(app).get('/api/signavio/models/rev-o2c-001');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Order-to-Cash (O2C)');
      expect(res.body.revisionId).toBe('rev-o2c-001');
    });

    it('should return 200 with model for valid model ID', async () => {
      const res = await request(app).get('/api/signavio/models/mod-o2c-001');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Order-to-Cash (O2C)');
    });

    it('should return 404 for nonexistent model', async () => {
      const res = await request(app).get('/api/signavio/models/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Model not found');
    });
  });

  // ── GET /api/signavio/models/:id/bpmn ───────────────────────

  describe('GET /api/signavio/models/:id/bpmn', () => {
    it('should return 200 with BPMN XML for valid model', async () => {
      const res = await request(app).get('/api/signavio/models/rev-o2c-001/bpmn');
      expect(res.status).toBe(200);
      expect(res.body.bpmn).toBeDefined();
      expect(res.body.bpmn).toContain('<bpmn:definitions');
      expect(res.body.modelId).toBe('mod-o2c-001');
    });

    it('should return 404 for nonexistent model BPMN', async () => {
      const res = await request(app).get('/api/signavio/models/nonexistent/bpmn');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Model not found');
    });
  });

  // ── POST /api/signavio/models/:id/parse ─────────────────────

  describe('POST /api/signavio/models/:id/parse', () => {
    it('should return 200 with config steps for valid model', async () => {
      const res = await request(app).post('/api/signavio/models/rev-o2c-001/parse', {
        bpmnXml: '<bpmn/>',
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.configSteps)).toBe(true);
      expect(res.body.configSteps.length).toBeGreaterThan(0);
      expect(res.body.complexity).toBeDefined();
      expect(res.body.complexity.totalSteps).toBeGreaterThan(0);
    });

    it('should include module and tcode in config steps', async () => {
      const res = await request(app).post('/api/signavio/models/rev-o2c-001/parse', {});
      const step = res.body.configSteps[0];
      expect(step).toHaveProperty('step');
      expect(step).toHaveProperty('activity');
      expect(step).toHaveProperty('tcode');
      expect(step).toHaveProperty('module');
      expect(step).toHaveProperty('type');
    });

    it('should return 404 for nonexistent model parse', async () => {
      const res = await request(app).post('/api/signavio/models/nonexistent/parse', {});
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Model not found');
    });
  });

  // ── GET /api/signavio/search ────────────────────────────────

  describe('GET /api/signavio/search', () => {
    it('should return 200 with matching results for Order', async () => {
      const res = await request(app).get('/api/signavio/search?q=Order');
      expect(res.status).toBe(200);
      expect(res.body.query).toBe('Order');
      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBeGreaterThan(0);
      expect(res.body.total).toBe(res.body.results.length);
    });

    it('should return 200 with empty results for nonexistent query', async () => {
      const res = await request(app).get('/api/signavio/search?q=nonexistent');
      expect(res.status).toBe(200);
      expect(res.body.results).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('should handle empty query parameter', async () => {
      const res = await request(app).get('/api/signavio/search?q=');
      expect(res.status).toBe(200);
      expect(res.body.results.length).toBe(5);
    });
  });

  // ── GET /api/signavio/dictionary ────────────────────────────

  describe('GET /api/signavio/dictionary', () => {
    it('should return 200 with glossary entries', async () => {
      const res = await request(app).get('/api/signavio/dictionary');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.entries)).toBe(true);
      expect(res.body.entries.length).toBe(5);
      expect(res.body.total).toBe(5);
    });

    it('should return entries with expected fields', async () => {
      const res = await request(app).get('/api/signavio/dictionary');
      const entry = res.body.entries[0];
      expect(entry).toHaveProperty('term');
      expect(entry).toHaveProperty('definition');
      expect(entry).toHaveProperty('domain');
    });
  });
});
