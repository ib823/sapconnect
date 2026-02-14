/**
 * Tests for Migration Plan API
 */
const http = require('http');
const express = require('express');
const { createMigrationPlanRouter } = require('../../extraction/migration-plan-api');

function createTestApp(state) {
  const app = express();
  app.use(express.json());
  app.use(createMigrationPlanRouter(state));
  return app;
}

function request(app, method, path, body) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const bodyStr = body ? JSON.stringify(body) : null;
      const options = {
        hostname: '127.0.0.1',
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
          let parsed;
          try { parsed = JSON.parse(data); } catch { parsed = data; }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      });
      req.on('error', (e) => { server.close(); reject(e); });
      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  });
}

describe('Migration Plan API', () => {
  let state;

  beforeEach(() => {
    state = {
      report: null,
      results: {},
      confidence: {},
      gapReport: {},
      latestPlan: null,
    };
  });

  describe('POST /api/migration/plan', () => {
    it('should return 400 when no forensic data available', async () => {
      const app = createTestApp(state);
      const res = await request(app, 'POST', '/api/migration/plan', {});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('No forensic data');
    });

    it('should generate plan from provided forensicResult', async () => {
      const app = createTestApp(state);
      const forensicResult = {
        results: {
          FI_TRANSACTIONS: { records: [1, 2, 3], count: 3 },
          FI_GL_ACCOUNTS: { records: [1], count: 1 },
        },
        confidence: { overall: 80, grade: 'B' },
        gapReport: {},
        humanValidation: [],
      };

      const res = await request(app, 'POST', '/api/migration/plan', { forensicResult });
      expect(res.status).toBe(200);
      expect(res.body.scope).toBeDefined();
      expect(res.body.objects).toBeDefined();
      expect(res.body.executionPlan).toBeDefined();
      expect(res.body.effort).toBeDefined();
      expect(res.body.risks).toBeDefined();
      expect(res.body.generatedAt).toBeDefined();
    });

    it('should store plan as latestPlan in state', async () => {
      const app = createTestApp(state);
      const forensicResult = {
        results: { FI_TRANSACTIONS: { count: 5 } },
        confidence: {},
        gapReport: {},
      };

      await request(app, 'POST', '/api/migration/plan', { forensicResult });
      expect(state.latestPlan).toBeDefined();
      expect(state.latestPlan.scope).toBeDefined();
    });

    it('should accept plan options', async () => {
      const app = createTestApp(state);
      const forensicResult = {
        results: {
          FI_TRANSACTIONS: { count: 100 },
          MM_MATERIALS: { count: 50 },
        },
        confidence: {},
        gapReport: {},
      };

      const res = await request(app, 'POST', '/api/migration/plan', {
        forensicResult,
        options: { includeModules: ['FI'] },
      });
      expect(res.status).toBe(200);
      expect(res.body.scope.activeModules).toContain('FI');
    });

    it('should fall back to state.report when no body forensicResult', async () => {
      state.report = {
        toJSON: () => ({ humanValidation: [] }),
      };
      state.results = { FI_TRANSACTIONS: { count: 10 } };
      state.confidence = { overall: 75 };

      const app = createTestApp(state);
      const res = await request(app, 'POST', '/api/migration/plan', {});
      expect(res.status).toBe(200);
      expect(res.body.scope).toBeDefined();
    });
  });

  describe('GET /api/migration/plan/latest', () => {
    it('should return 404 when no plan available', async () => {
      const app = createTestApp(state);
      const res = await request(app, 'GET', '/api/migration/plan/latest');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('No migration plan');
    });

    it('should return the latest plan after POST', async () => {
      const app = createTestApp(state);
      const forensicResult = {
        results: { FI_TRANSACTIONS: { count: 5 } },
        confidence: {},
        gapReport: {},
      };

      // Generate plan
      await request(app, 'POST', '/api/migration/plan', { forensicResult });

      // Retrieve it
      const res = await request(app, 'GET', '/api/migration/plan/latest');
      expect(res.status).toBe(200);
      expect(res.body.scope).toBeDefined();
      expect(res.body.generatedAt).toBeDefined();
    });

    it('should return same plan object on repeated GETs', async () => {
      state.latestPlan = {
        generatedAt: '2024-01-01T00:00:00Z',
        scope: { totalObjects: 5 },
      };
      const app = createTestApp(state);
      const res1 = await request(app, 'GET', '/api/migration/plan/latest');
      const res2 = await request(app, 'GET', '/api/migration/plan/latest');
      expect(res1.body.generatedAt).toBe(res2.body.generatedAt);
    });
  });
});
