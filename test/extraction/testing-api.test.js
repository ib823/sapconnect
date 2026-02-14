/**
 * Tests for Testing API endpoints
 *
 * Verifies all 6 Testing endpoints: generate, templates, template detail,
 * instantiate, execute, and report.
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

describe('Testing API', () => {
  let app;

  beforeEach(() => {
    app = createApp({ NODE_ENV: 'test', LOG_LEVEL: 'error' });
  });

  // ── POST /api/testing/generate ──────────────────────────────

  describe('POST /api/testing/generate', () => {
    it('should return 200 with generated test cases', async () => {
      const res = await request(app).post('/api/testing/generate', {
        type: 'description',
        input: 'Test GL posting in S/4HANA',
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.testCases)).toBe(true);
      expect(res.body.testCases.length).toBe(3);
      expect(res.body.generatedAt).toBeDefined();
    });

    it('should use type in test case names', async () => {
      const res = await request(app).post('/api/testing/generate', {
        type: 'bpmn',
        input: '<bpmn/>',
      });
      expect(res.body.testCases[0].type).toBe('bpmn');
      expect(res.body.testCases[0].name).toContain('bpmn');
    });

    it('should default to description type when none provided', async () => {
      const res = await request(app).post('/api/testing/generate', {});
      expect(res.body.testCases[0].type).toBe('description');
    });
  });

  // ── GET /api/testing/templates ──────────────────────────────

  describe('GET /api/testing/templates', () => {
    it('should return 200 with templates array', async () => {
      const res = await request(app).get('/api/testing/templates');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.templates)).toBe(true);
      expect(res.body.templates.length).toBe(5);
      expect(res.body.total).toBe(5);
    });

    it('should filter by module', async () => {
      const res = await request(app).get('/api/testing/templates?module=FI');
      expect(res.status).toBe(200);
      expect(res.body.templates.every((t) => t.module === 'FI')).toBe(true);
      expect(res.body.templates.length).toBe(2);
    });

    it('should filter by type', async () => {
      const res = await request(app).get('/api/testing/templates?type=smoke');
      expect(res.status).toBe(200);
      expect(res.body.templates.every((t) => t.type === 'smoke')).toBe(true);
    });

    it('should return templates with expected fields', async () => {
      const res = await request(app).get('/api/testing/templates');
      const tpl = res.body.templates[0];
      expect(tpl).toHaveProperty('id');
      expect(tpl).toHaveProperty('name');
      expect(tpl).toHaveProperty('module');
      expect(tpl).toHaveProperty('type');
      expect(tpl).toHaveProperty('description');
      expect(tpl).toHaveProperty('variables');
      expect(tpl).toHaveProperty('steps');
    });
  });

  // ── GET /api/testing/templates/:id ──────────────────────────

  describe('GET /api/testing/templates/:id', () => {
    it('should return 200 with template for valid ID', async () => {
      const res = await request(app).get('/api/testing/templates/tpl-fi-smoke-001');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('tpl-fi-smoke-001');
      expect(res.body.name).toBe('FI Posting Smoke Test');
    });

    it('should return 404 for nonexistent template', async () => {
      const res = await request(app).get('/api/testing/templates/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Template not found');
    });
  });

  // ── POST /api/testing/templates/:id/instantiate ─────────────

  describe('POST /api/testing/templates/:id/instantiate', () => {
    it('should return 200 with instantiated template', async () => {
      const res = await request(app).post('/api/testing/templates/tpl-fi-smoke-001/instantiate', {
        variables: { companyCode: '1000', fiscalYear: '2025', currency: 'EUR' },
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('tpl-fi-smoke-001');
      expect(res.body.instantiatedAt).toBeDefined();
      expect(res.body.resolvedVariables).toBeDefined();
      expect(res.body.resolvedVariables.companyCode).toBe('1000');
    });

    it('should return 404 for nonexistent template instantiation', async () => {
      const res = await request(app).post('/api/testing/templates/nonexistent/instantiate', {
        variables: {},
      });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Template not found');
    });
  });

  // ── POST /api/testing/execute ───────────────────────────────

  describe('POST /api/testing/execute', () => {
    it('should return 200 with execution results', async () => {
      const res = await request(app).post('/api/testing/execute', {
        testCases: [
          { id: 'tc-1', name: 'Test 1' },
          { id: 'tc-2', name: 'Test 2' },
          { id: 'tc-3', name: 'Test 3' },
        ],
      });
      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.total).toBe(3);
      expect(typeof res.body.summary.passed).toBe('number');
      expect(typeof res.body.summary.failed).toBe('number');
      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBe(3);
    });

    it('should handle empty test cases array', async () => {
      const res = await request(app).post('/api/testing/execute', { testCases: [] });
      expect(res.status).toBe(200);
      expect(res.body.summary.total).toBe(0);
      expect(res.body.results).toEqual([]);
    });
  });

  // ── GET /api/testing/report ─────────────────────────────────

  describe('GET /api/testing/report', () => {
    it('should return 200 with test report', async () => {
      const res = await request(app).get('/api/testing/report');
      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(typeof res.body.summary.total).toBe('number');
      expect(typeof res.body.summary.passed).toBe('number');
      expect(typeof res.body.summary.failed).toBe('number');
      expect(typeof res.body.summary.passRate).toBe('number');
    });

    it('should include module breakdown', async () => {
      const res = await request(app).get('/api/testing/report');
      expect(res.body.modules).toBeDefined();
      expect(res.body.modules.FI).toBeDefined();
      expect(res.body.modules.SD).toBeDefined();
    });
  });
});
