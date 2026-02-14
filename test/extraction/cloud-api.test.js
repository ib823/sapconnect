/**
 * Tests for Cloud Integration API endpoints
 *
 * Verifies all 8 Cloud endpoints covering SuccessFactors, Ariba,
 * Concur, and SAP Analytics Cloud integration.
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

describe('Cloud Integration API', () => {
  let app;

  beforeEach(() => {
    app = createApp({ NODE_ENV: 'test', LOG_LEVEL: 'error' });
  });

  // ── SuccessFactors ──────────────────────────────────────────

  describe('GET /api/cloud/sf/entities/:entitySet', () => {
    it('should return 200 with PerPerson entities', async () => {
      const res = await request(app).get('/api/cloud/sf/entities/PerPerson');
      expect(res.status).toBe(200);
      expect(res.body.entitySet).toBe('PerPerson');
      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBe(3);
      expect(res.body.total).toBe(3);
    });

    it('should return 200 with Position entities', async () => {
      const res = await request(app).get('/api/cloud/sf/entities/Position');
      expect(res.status).toBe(200);
      expect(res.body.entitySet).toBe('Position');
      expect(Array.isArray(res.body.results)).toBe(true);
    });

    it('should return 404 for unknown entity set', async () => {
      const res = await request(app).get('/api/cloud/sf/entities/UnknownEntity');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Entity set not found');
    });

    it('should return employee records with expected fields', async () => {
      const res = await request(app).get('/api/cloud/sf/entities/PerPerson');
      const emp = res.body.results[0];
      expect(emp).toHaveProperty('userId');
      expect(emp).toHaveProperty('firstName');
      expect(emp).toHaveProperty('lastName');
      expect(emp).toHaveProperty('department');
      expect(emp).toHaveProperty('status');
    });
  });

  describe('POST /api/cloud/sf/entities/:entitySet', () => {
    it('should return 201 with created entity', async () => {
      const res = await request(app).post('/api/cloud/sf/entities/PerPerson', {
        firstName: 'Max',
        lastName: 'Mustermann',
        department: 'Sales',
      });
      expect(res.status).toBe(201);
      expect(res.body.created).toBe(true);
      expect(res.body.entitySet).toBe('PerPerson');
      expect(res.body.entity).toBeDefined();
      expect(res.body.entity.firstName).toBe('Max');
      expect(res.body.createdAt).toBeDefined();
    });
  });

  // ── Ariba ────────────────────────────────────────────────────

  describe('GET /api/cloud/ariba/purchase-orders', () => {
    it('should return 200 with purchase orders', async () => {
      const res = await request(app).get('/api/cloud/ariba/purchase-orders');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.purchaseOrders)).toBe(true);
      expect(res.body.purchaseOrders.length).toBe(3);
      expect(res.body.total).toBe(3);
    });

    it('should return POs with expected fields', async () => {
      const res = await request(app).get('/api/cloud/ariba/purchase-orders');
      const po = res.body.purchaseOrders[0];
      expect(po).toHaveProperty('poNumber');
      expect(po).toHaveProperty('vendor');
      expect(po).toHaveProperty('amount');
      expect(po).toHaveProperty('currency');
      expect(po).toHaveProperty('status');
    });
  });

  describe('GET /api/cloud/ariba/contracts', () => {
    it('should return 200 with contracts', async () => {
      const res = await request(app).get('/api/cloud/ariba/contracts');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.contracts)).toBe(true);
      expect(res.body.contracts.length).toBe(2);
      expect(res.body.total).toBe(2);
    });

    it('should return contracts with expected fields', async () => {
      const res = await request(app).get('/api/cloud/ariba/contracts');
      const contract = res.body.contracts[0];
      expect(contract).toHaveProperty('contractId');
      expect(contract).toHaveProperty('title');
      expect(contract).toHaveProperty('vendor');
      expect(contract).toHaveProperty('value');
      expect(contract).toHaveProperty('status');
    });
  });

  // ── Concur ───────────────────────────────────────────────────

  describe('GET /api/cloud/concur/expense-reports', () => {
    it('should return 200 with expense reports', async () => {
      const res = await request(app).get('/api/cloud/concur/expense-reports');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.expenseReports)).toBe(true);
      expect(res.body.expenseReports.length).toBe(3);
      expect(res.body.total).toBe(3);
    });

    it('should return reports with expected fields', async () => {
      const res = await request(app).get('/api/cloud/concur/expense-reports');
      const report = res.body.expenseReports[0];
      expect(report).toHaveProperty('reportId');
      expect(report).toHaveProperty('employee');
      expect(report).toHaveProperty('totalAmount');
      expect(report).toHaveProperty('currency');
      expect(report).toHaveProperty('status');
    });
  });

  describe('POST /api/cloud/concur/users', () => {
    it('should return 201 with provisioned user', async () => {
      const res = await request(app).post('/api/cloud/concur/users', {
        email: 'new.user@example.com',
        firstName: 'New',
        lastName: 'User',
      });
      expect(res.status).toBe(201);
      expect(res.body.provisioned).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.loginId).toBe('new.user@example.com');
      expect(res.body.user.status).toBe('Active');
      expect(res.body.user.provisionedAt).toBeDefined();
    });
  });

  // ── SAP Analytics Cloud ──────────────────────────────────────

  describe('GET /api/cloud/sac/models', () => {
    it('should return 200 with SAC models', async () => {
      const res = await request(app).get('/api/cloud/sac/models');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.models)).toBe(true);
      expect(res.body.models.length).toBe(3);
      expect(res.body.total).toBe(3);
    });

    it('should return models with expected fields', async () => {
      const res = await request(app).get('/api/cloud/sac/models');
      const model = res.body.models[0];
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('type');
      expect(model).toHaveProperty('dimensions');
      expect(model).toHaveProperty('measures');
    });
  });

  describe('POST /api/cloud/sac/models/:id/import', () => {
    it('should return 200 with import result for valid model', async () => {
      const res = await request(app).post('/api/cloud/sac/models/mdl-fin-001/import', {
        data: [
          { Company: '1000', Account: '400000', Amount: 50000 },
          { Company: '1000', Account: '500000', Amount: 30000 },
        ],
      });
      expect(res.status).toBe(200);
      expect(res.body.modelId).toBe('mdl-fin-001');
      expect(res.body.importStatus).toBe('completed');
      expect(res.body.rowsImported).toBe(2);
      expect(res.body.importedAt).toBeDefined();
    });

    it('should return 404 for nonexistent model import', async () => {
      const res = await request(app).post('/api/cloud/sac/models/nonexistent/import', {
        data: [],
      });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Model not found');
    });
  });
});
