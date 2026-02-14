/**
 * Tests for extraction/process-mining/api.js — Process Mining REST API
 *
 * Tests all 11 endpoints: process listing, config, reference model,
 * analyze, discover, conformance, performance, variants, social network,
 * KPIs, and demo.
 */

const http = require('http');
const { createProcessMiningRouter } = require('../../../extraction/process-mining/api');
const { getAllProcessIds, getProcessConfig } = require('../../../extraction/process-mining/sap-table-config');
const express = require('express');

// ── HTTP test helper ─────────────────────────────────────────

function createTestApp() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(createProcessMiningRouter());
  return app;
}

function request(app) {
  return {
    get: (path) => _request(app, 'GET', path),
    post: (path, body) => _request(app, 'POST', path, body),
  };
}

function _request(app, method, path, body) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
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
          resolve({ status: res.statusCode, body: parsed });
        });
      });
      req.on('error', (e) => { server.close(); reject(e); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

// ── Sample event log payload ─────────────────────────────────

function sampleEventPayload() {
  const baseTime = new Date('2024-01-15T08:00:00Z').getTime();
  const events = [];
  const activities = ['Create Order', 'Approve', 'Ship', 'Invoice', 'Pay'];

  for (let c = 1; c <= 5; c++) {
    for (let a = 0; a < activities.length; a++) {
      events.push({
        caseId: `CASE-${c}`,
        activity: activities[a],
        timestamp: new Date(baseTime + c * 86400000 + a * 3600000).toISOString(),
        resource: `USER_${String.fromCharCode(65 + (a % 3))}`,
      });
    }
  }
  return { events };
}

// ── Tests ────────────────────────────────────────────────────

describe('Process Mining API', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  // ── GET /api/process-mining/processes ──────────────────────

  describe('GET /api/process-mining/processes', () => {
    it('should return all 7 SAP processes', async () => {
      const res = await request(app).get('/api/process-mining/processes');
      expect(res.status).toBe(200);
      expect(res.body.processes).toBeDefined();
      expect(res.body.processes.length).toBe(7);

      const ids = res.body.processes.map((p) => p.id);
      expect(ids).toContain('O2C');
      expect(ids).toContain('P2P');
      expect(ids).toContain('R2R');

      for (const p of res.body.processes) {
        expect(p.id).toBeDefined();
        expect(p.name).toBeDefined();
        expect(p.description).toBeDefined();
      }
    });
  });

  // ── GET /api/process-mining/processes/:id ──────────────────

  describe('GET /api/process-mining/processes/:id', () => {
    it('should return process config for O2C', async () => {
      const res = await request(app).get('/api/process-mining/processes/O2C');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('O2C');
      expect(res.body.name).toBe('Order to Cash');
      expect(Array.isArray(res.body.tables)).toBe(true);
      expect(res.body.tables.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive process ID', async () => {
      const res = await request(app).get('/api/process-mining/processes/o2c');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('O2C');
    });

    it('should return 404 for unknown process', async () => {
      const res = await request(app).get('/api/process-mining/processes/UNKNOWN');
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });

  // ── GET /api/process-mining/processes/:id/reference-model ─

  describe('GET /api/process-mining/processes/:id/reference-model', () => {
    it('should return reference model for O2C', async () => {
      const res = await request(app).get('/api/process-mining/processes/O2C/reference-model');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('O2C');
      expect(res.body.activities).toBeDefined();
      expect(Array.isArray(res.body.activities)).toBe(true);
    });

    it('should return 404 for unknown process', async () => {
      const res = await request(app).get('/api/process-mining/processes/FAKE/reference-model');
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/process-mining/analyze ──────────────────────

  describe('POST /api/process-mining/analyze', () => {
    it('should run full analysis on event log', async () => {
      const res = await request(app).post('/api/process-mining/analyze', sampleEventPayload());
      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(res.body.executiveSummary).toBeDefined();
    });

    it('should return 400 for empty events', async () => {
      const res = await request(app).post('/api/process-mining/analyze', { events: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 for missing body', async () => {
      const res = await request(app).post('/api/process-mining/analyze', {});
      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/process-mining/discover ─────────────────────

  describe('POST /api/process-mining/discover', () => {
    it('should discover a process model', async () => {
      const res = await request(app).post('/api/process-mining/discover', sampleEventPayload());
      expect(res.status).toBe(200);
      expect(res.body.activities).toBeDefined();
      expect(res.body.edges).toBeDefined();
    });

    it('should return 400 for invalid payload', async () => {
      const res = await request(app).post('/api/process-mining/discover', { events: [] });
      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/process-mining/conformance ──────────────────

  describe('POST /api/process-mining/conformance', () => {
    it('should return 400 without processId', async () => {
      const res = await request(app).post('/api/process-mining/conformance', sampleEventPayload());
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('processId');
    });

    it('should run conformance with O2C reference model', async () => {
      const payload = { ...sampleEventPayload(), options: { processId: 'O2C' } };
      const res = await request(app).post('/api/process-mining/conformance', payload);
      expect(res.status).toBe(200);
      expect(res.body.fitness).toBeDefined();
    });
  });

  // ── POST /api/process-mining/performance ──────────────────

  describe('POST /api/process-mining/performance', () => {
    it('should analyze performance', async () => {
      const res = await request(app).post('/api/process-mining/performance', sampleEventPayload());
      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(res.body.caseDurations).toBeDefined();
    });
  });

  // ── POST /api/process-mining/variants ─────────────────────

  describe('POST /api/process-mining/variants', () => {
    it('should analyze variants', async () => {
      const res = await request(app).post('/api/process-mining/variants', sampleEventPayload());
      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(res.body.happyPath).toBeDefined();
    });
  });

  // ── POST /api/process-mining/social-network ───────────────

  describe('POST /api/process-mining/social-network', () => {
    it('should analyze social network', async () => {
      const res = await request(app).post('/api/process-mining/social-network', sampleEventPayload());
      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(res.body.handoverMatrix).toBeDefined();
    });
  });

  // ── POST /api/process-mining/kpis ─────────────────────────

  describe('POST /api/process-mining/kpis', () => {
    it('should calculate KPIs', async () => {
      const res = await request(app).post('/api/process-mining/kpis', sampleEventPayload());
      expect(res.status).toBe(200);
      expect(res.body.caseCount).toBeDefined();
      expect(res.body.time).toBeDefined();
    });
  });

  // ── GET /api/process-mining/demo/:processId ───────────────

  describe('GET /api/process-mining/demo/:processId', () => {
    it('should generate demo for O2C', async () => {
      const res = await request(app).get('/api/process-mining/demo/O2C');
      expect(res.status).toBe(200);
      expect(res.body.processId).toBe('O2C');
      expect(res.body.processName).toBe('Order to Cash');
      expect(res.body.eventLog.cases).toBeGreaterThan(0);
      expect(res.body.eventLog.events).toBeGreaterThan(0);
      expect(res.body.analysis).toBeDefined();
      expect(res.body.analysis.summary).toBeDefined();
    });

    it('should return 404 for unknown process', async () => {
      const res = await request(app).get('/api/process-mining/demo/FAKE');
      expect(res.status).toBe(404);
    });
  });

  // ── Event log reconstruction ──────────────────────────────

  describe('event log reconstruction', () => {
    it('should reject events missing required fields', async () => {
      const payload = { events: [{ caseId: 'C1', activity: 'A' }] }; // missing timestamp
      const res = await request(app).post('/api/process-mining/analyze', payload);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('timestamp');
    });

    it('should handle events with optional resource', async () => {
      const payload = {
        events: [
          { caseId: 'C1', activity: 'Start', timestamp: '2024-01-01T00:00:00Z' },
          { caseId: 'C1', activity: 'End', timestamp: '2024-01-01T01:00:00Z' },
        ],
      };
      const res = await request(app).post('/api/process-mining/discover', payload);
      expect(res.status).toBe(200);
    });
  });
});
