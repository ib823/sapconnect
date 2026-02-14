/**
 * Tests for Data Export API
 */
const http = require('http');
const express = require('express');
const { createExportRouter } = require('../../extraction/export-api');

function createTestApp(state) {
  const app = express();
  app.use(express.json());
  app.use(createExportRouter(state));
  return app;
}

function request(app, path) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          server.close();
          let body;
          try { body = JSON.parse(data); } catch { body = data; }
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      });
      req.on('error', (e) => { server.close(); reject(e); });
    });
  });
}

describe('Export API', () => {
  let state;

  beforeEach(() => {
    state = {
      report: null,
      eventLog: null,
      eventLogs: {},
      latestPlan: null,
    };
  });

  // ── Forensic JSON export ──────────────────────────────────

  describe('GET /api/export/forensic/json', () => {
    it('should return 404 when no report', async () => {
      const app = createTestApp(state);
      const res = await request(app, '/api/export/forensic/json');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('No forensic report');
    });

    it('should return JSON with Content-Disposition when report exists', async () => {
      state.report = {
        toJSON: () => ({ system: 'SAP', modules: ['FI', 'CO'] }),
      };
      const app = createTestApp(state);
      const res = await request(app, '/api/export/forensic/json');
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('forensic-report.json');
      expect(res.body.system).toBe('SAP');
    });
  });

  // ── Forensic Markdown export ──────────────────────────────

  describe('GET /api/export/forensic/markdown', () => {
    it('should return 404 when no report', async () => {
      const app = createTestApp(state);
      const res = await request(app, '/api/export/forensic/markdown');
      expect(res.status).toBe(404);
    });

    it('should return markdown with proper MIME type', async () => {
      state.report = {
        toMarkdown: () => '# Forensic Report\n\nTest content',
      };
      const app = createTestApp(state);
      const res = await request(app, '/api/export/forensic/markdown');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/markdown');
      expect(res.headers['content-disposition']).toContain('forensic-report.md');
      expect(res.body).toContain('# Forensic Report');
    });
  });

  // ── Event log CSV export ──────────────────────────────────

  describe('GET /api/export/event-log/csv', () => {
    it('should return 404 when no event log', async () => {
      const app = createTestApp(state);
      const res = await request(app, '/api/export/event-log/csv');
      expect(res.status).toBe(404);
    });

    it('should return CSV with proper MIME type', async () => {
      state.eventLog = {
        toCSV: () => 'caseId,activity,timestamp\n1,Start,2024-01-01',
      };
      const app = createTestApp(state);
      const res = await request(app, '/api/export/event-log/csv');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('event-log.csv');
      expect(res.body).toContain('caseId');
    });
  });

  // ── Event log XES export ──────────────────────────────────

  describe('GET /api/export/event-log/xes', () => {
    it('should return 404 when no event log', async () => {
      const app = createTestApp(state);
      const res = await request(app, '/api/export/event-log/xes');
      expect(res.status).toBe(404);
    });

    it('should return XES XML with proper MIME type', async () => {
      state.eventLog = {
        toXES: () => '<?xml version="1.0"?><log/>',
      };
      const app = createTestApp(state);
      const res = await request(app, '/api/export/event-log/xes');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.headers['content-disposition']).toContain('event-log.xes');
      expect(res.body).toContain('<?xml');
    });
  });

  // ── Event log JSON export ─────────────────────────────────

  describe('GET /api/export/event-log/json', () => {
    it('should return 404 when no event log', async () => {
      const app = createTestApp(state);
      const res = await request(app, '/api/export/event-log/json');
      expect(res.status).toBe(404);
    });

    it('should return JSON with Content-Disposition', async () => {
      state.eventLog = {
        toJSON: () => ({ name: 'test-log', traces: [] }),
      };
      const app = createTestApp(state);
      const res = await request(app, '/api/export/event-log/json');
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('event-log.json');
      expect(res.body.name).toBe('test-log');
    });
  });

  // ── Migration plan JSON export ────────────────────────────

  describe('GET /api/export/migration/plan/json', () => {
    it('should return 404 when no plan', async () => {
      const app = createTestApp(state);
      const res = await request(app, '/api/export/migration/plan/json');
      expect(res.status).toBe(404);
    });

    it('should return plan JSON with Content-Disposition', async () => {
      state.latestPlan = {
        generatedAt: '2024-01-01T00:00:00Z',
        scope: { totalObjects: 10 },
      };
      const app = createTestApp(state);
      const res = await request(app, '/api/export/migration/plan/json');
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('migration-plan.json');
      expect(res.body.scope.totalObjects).toBe(10);
    });
  });

  // ── Event log fallback from eventLogs map ─────────────────

  describe('eventLogs map fallback', () => {
    it('should use first entry from eventLogs when eventLog is null', async () => {
      state.eventLogs = {
        O2C: { toCSV: () => 'caseId,activity\nO2C-1,Start' },
      };
      const app = createTestApp(state);
      const res = await request(app, '/api/export/event-log/csv');
      expect(res.status).toBe(200);
      expect(res.body).toContain('O2C-1');
    });
  });
});
