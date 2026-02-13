/**
 * Tests for Dashboard API
 */

const { createDashboardRouter } = require('../../../extraction/report/dashboard-api');

/**
 * Helper to invoke an Express route handler with mock req/res.
 */
function callRoute(router, method, path, body) {
  return new Promise((resolve, reject) => {
    const layer = findLayer(router, method, path);
    if (!layer) {
      return reject(new Error(`No route found for ${method} ${path}`));
    }

    const params = extractParams(layer.route.path, path);
    const req = { method: method.toUpperCase(), url: path, params, body: body || {} };
    const res = createMockRes(resolve);

    layer.route.stack[0].handle(req, res, (err) => {
      if (err) reject(err);
    });
  });
}

function findLayer(router, method, url) {
  for (const layer of router.stack) {
    if (!layer.route) continue;
    const routePath = layer.route.path;
    const methods = layer.route.methods;
    if (!methods[method.toLowerCase()]) continue;

    // Build regex from route path for param matching
    const paramNames = [];
    const regexStr = routePath.replace(/:(\w+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const regex = new RegExp(`^${regexStr}$`);
    if (regex.test(url)) {
      return layer;
    }
  }
  return null;
}

function extractParams(routePath, actualPath) {
  const paramNames = [];
  const regexStr = routePath.replace(/:(\w+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const regex = new RegExp(`^${regexStr}$`);
  const match = actualPath.match(regex);
  const params = {};
  if (match) {
    paramNames.forEach((name, i) => { params[name] = match[i + 1]; });
  }
  return params;
}

function createMockRes(resolve) {
  let statusCode = 200;
  const res = {
    statusCode: 200,
    status(code) {
      statusCode = code;
      res.statusCode = code;
      return res;
    },
    json(data) {
      resolve({ statusCode, body: data });
    },
  };
  return res;
}

describe('Dashboard API', () => {
  describe('createDashboardRouter', () => {
    it('creates router from empty state', () => {
      const router = createDashboardRouter({});
      expect(router).toBeDefined();
      expect(router.stack.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/forensic/summary', () => {
    it('returns no_extraction when no report', async () => {
      const router = createDashboardRouter({});
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/summary');
      expect(statusCode).toBe(200);
      expect(body.status).toBe('no_extraction');
      expect(body.message).toBe('No extraction data available');
    });

    it('returns data when report exists', async () => {
      const mockOverview = { system: 'ECC', release: '750' };
      const state = {
        report: {
          _renderSystemOverview: () => mockOverview,
        },
      };
      const router = createDashboardRouter(state);
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/summary');
      expect(statusCode).toBe(200);
      expect(body).toEqual(mockOverview);
    });
  });

  describe('GET /api/forensic/modules', () => {
    it('returns empty modules array when no report', async () => {
      const router = createDashboardRouter({});
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/modules');
      expect(statusCode).toBe(200);
      expect(body).toEqual({ modules: [] });
    });

    it('returns module inventory when report exists', async () => {
      const mockInventory = { modules: [{ code: 'FI', name: 'Financial Accounting' }] };
      const state = {
        report: {
          _renderModuleInventory: () => mockInventory,
        },
      };
      const router = createDashboardRouter(state);
      const { body } = await callRoute(router, 'GET', '/api/forensic/modules');
      expect(body).toEqual(mockInventory);
    });
  });

  describe('GET /api/forensic/modules/:id', () => {
    it('returns 404 when no report', async () => {
      const router = createDashboardRouter({});
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/modules/FI');
      expect(statusCode).toBe(404);
      expect(body.error).toBe('No data');
    });

    it('returns module report when report exists', async () => {
      const mockModuleReport = { module: 'FI', tables: 5 };
      const state = {
        report: {
          toModuleReport: (mod) => mockModuleReport,
        },
      };
      const router = createDashboardRouter(state);
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/modules/fi');
      expect(statusCode).toBe(200);
      expect(body).toEqual(mockModuleReport);
    });
  });

  describe('GET /api/forensic/processes', () => {
    it('returns empty processes array when no catalog', async () => {
      const router = createDashboardRouter({});
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/processes');
      expect(statusCode).toBe(200);
      expect(body).toEqual({ processes: [] });
    });

    it('returns catalog data when available', async () => {
      const mockCatalog = { processes: [{ id: 'P1', name: 'Order to Cash' }] };
      const state = {
        processCatalog: {
          toJSON: () => mockCatalog,
        },
      };
      const router = createDashboardRouter(state);
      const { body } = await callRoute(router, 'GET', '/api/forensic/processes');
      expect(body).toEqual(mockCatalog);
    });
  });

  describe('GET /api/forensic/processes/:id', () => {
    it('returns 404 when no catalog', async () => {
      const router = createDashboardRouter({});
      const { statusCode } = await callRoute(router, 'GET', '/api/forensic/processes/P1');
      expect(statusCode).toBe(404);
    });

    it('returns 404 when process not found', async () => {
      const state = {
        processCatalog: {
          getProcess: () => null,
        },
      };
      const router = createDashboardRouter(state);
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/processes/NONEXISTENT');
      expect(statusCode).toBe(404);
      expect(body.error).toBe('Process not found');
    });

    it('returns process when found', async () => {
      const mockProcess = { id: 'P1', name: 'Order to Cash' };
      const state = {
        processCatalog: {
          getProcess: (id) => id === 'P1' ? mockProcess : null,
        },
      };
      const router = createDashboardRouter(state);
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/processes/P1');
      expect(statusCode).toBe(200);
      expect(body).toEqual(mockProcess);
    });
  });

  describe('GET /api/forensic/code', () => {
    it('returns default when no data', async () => {
      const router = createDashboardRouter({});
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/code');
      expect(statusCode).toBe(200);
      expect(body).toEqual({ stats: { totalCustom: 0 } });
    });

    it('returns custom code data when available', async () => {
      const mockCode = { stats: { totalCustom: 42 }, programs: [] };
      const state = { results: { CUSTOM_CODE: mockCode } };
      const router = createDashboardRouter(state);
      const { body } = await callRoute(router, 'GET', '/api/forensic/code');
      expect(body).toEqual(mockCode);
    });
  });

  describe('GET /api/forensic/security', () => {
    it('returns empty when no data', async () => {
      const router = createDashboardRouter({});
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/security');
      expect(statusCode).toBe(200);
      expect(body).toEqual({});
    });

    it('returns security data when available', async () => {
      const mockSecurity = { roles: 5, users: 100 };
      const state = { results: { SECURITY: mockSecurity } };
      const router = createDashboardRouter(state);
      const { body } = await callRoute(router, 'GET', '/api/forensic/security');
      expect(body).toEqual(mockSecurity);
    });
  });

  describe('GET /api/forensic/interfaces', () => {
    it('returns empty when no data', async () => {
      const router = createDashboardRouter({});
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/interfaces');
      expect(statusCode).toBe(200);
      expect(body).toEqual({});
    });
  });

  describe('GET /api/forensic/gaps', () => {
    it('returns empty when no data', async () => {
      const router = createDashboardRouter({});
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/gaps');
      expect(statusCode).toBe(200);
      expect(body).toEqual({});
    });

    it('returns gap report when available', async () => {
      const mockGaps = { extraction: [], authorization: [] };
      const state = { gapReport: mockGaps };
      const router = createDashboardRouter(state);
      const { body } = await callRoute(router, 'GET', '/api/forensic/gaps');
      expect(body).toEqual(mockGaps);
    });
  });

  describe('GET /api/forensic/confidence', () => {
    it('returns default grade F when no data', async () => {
      const router = createDashboardRouter({});
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/confidence');
      expect(statusCode).toBe(200);
      expect(body).toEqual({ overall: 0, grade: 'F' });
    });

    it('returns confidence data when available', async () => {
      const mockConf = { overall: 85, grade: 'B' };
      const state = { confidence: mockConf };
      const router = createDashboardRouter(state);
      const { body } = await callRoute(router, 'GET', '/api/forensic/confidence');
      expect(body).toEqual(mockConf);
    });
  });

  describe('GET /api/forensic/coverage', () => {
    it('returns default when no tracker', async () => {
      const router = createDashboardRouter({});
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/coverage');
      expect(statusCode).toBe(200);
      expect(body).toEqual({ total: 0 });
    });

    it('returns coverage report when tracker exists', async () => {
      const mockReport = { total: 50, extracted: 45 };
      const state = {
        coverageTracker: {
          getSystemReport: () => mockReport,
        },
      };
      const router = createDashboardRouter(state);
      const { body } = await callRoute(router, 'GET', '/api/forensic/coverage');
      expect(body).toEqual(mockReport);
    });
  });

  describe('POST /api/forensic/extract', () => {
    it('triggers onExtract callback', async () => {
      const onExtract = vi.fn();
      const state = { running: false, onExtract };
      const router = createDashboardRouter(state);
      const { statusCode, body } = await callRoute(router, 'POST', '/api/forensic/extract');
      expect(statusCode).toBe(200);
      expect(body.status).toBe('started');
      expect(onExtract).toHaveBeenCalled();
      expect(state.running).toBe(true);
    });

    it('returns 409 when already running', async () => {
      const state = { running: true };
      const router = createDashboardRouter(state);
      const { statusCode, body } = await callRoute(router, 'POST', '/api/forensic/extract');
      expect(statusCode).toBe(409);
      expect(body.error).toBe('Extraction already in progress');
    });
  });

  describe('GET /api/forensic/progress', () => {
    it('returns running=false when idle', async () => {
      const router = createDashboardRouter({});
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/progress');
      expect(statusCode).toBe(200);
      expect(body.running).toBe(false);
      expect(body.progress).toEqual({});
      expect(body.startedAt).toBeNull();
    });

    it('returns running state when in progress', async () => {
      const state = {
        running: true,
        progress: { phase: 'extracting', completed: 3, total: 10 },
        startedAt: '2024-01-01T00:00:00.000Z',
      };
      const router = createDashboardRouter(state);
      const { body } = await callRoute(router, 'GET', '/api/forensic/progress');
      expect(body.running).toBe(true);
      expect(body.progress.phase).toBe('extracting');
      expect(body.startedAt).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('GET /api/forensic/config/:module', () => {
    it('returns empty array when no interpretations', async () => {
      const router = createDashboardRouter({});
      const { statusCode, body } = await callRoute(router, 'GET', '/api/forensic/config/FI');
      expect(statusCode).toBe(200);
      expect(body).toEqual([]);
    });

    it('filters interpretations by module prefix', async () => {
      const state = {
        interpretations: [
          { ruleId: 'FI_001', description: 'FI config' },
          { ruleId: 'FI_002', description: 'FI other' },
          { ruleId: 'MM_001', description: 'MM config' },
        ],
      };
      const router = createDashboardRouter(state);
      const { body } = await callRoute(router, 'GET', '/api/forensic/config/fi');
      expect(body).toHaveLength(2);
      expect(body[0].ruleId).toBe('FI_001');
      expect(body[1].ruleId).toBe('FI_002');
    });
  });
});
