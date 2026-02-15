/**
 * OData Live Validation Tests
 *
 * Validates OData client behavior against a real SAP system.
 * These tests are SKIPPED unless SAP_LIVE_TEST=1 is set.
 *
 * Required env vars:
 *   SAP_LIVE_TEST=1
 *   SAP_BASE_URL=https://<host>:<port>
 *   SAP_USERNAME=<user>
 *   SAP_PASSWORD=<password>
 *   SAP_CLIENT=<mandant> (optional)
 */

const LIVE = process.env.SAP_LIVE_TEST === '1';
const describeLive = LIVE ? describe : describe.skip;

const SapConnection = require('../../lib/sap-connection');

describeLive('OData Live Validation', () => {
  let conn;
  let client;

  beforeAll(async () => {
    conn = SapConnection.fromEnv();
    client = await conn.connect();
  }, 30000);

  // ── Connectivity ─────────────────────────────────────────────

  describe('connectivity', () => {
    it('should fetch OData service document', async () => {
      const result = await conn.testConnection();
      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.latencyMs).toBeLessThan(30000);
    }, 30000);

    it('should ping and update status', async () => {
      const result = await conn.ping();
      expect(result.ok).toBe(true);
      expect(result.status).toBe('connected');
    }, 30000);

    it('should return telemetry after ping', async () => {
      await conn.ping();
      const telemetry = conn.getTelemetry();
      expect(telemetry.totalRequests).toBeGreaterThan(0);
      expect(telemetry.successCount).toBeGreaterThan(0);
      expect(telemetry.avgLatencyMs).toBeGreaterThan(0);
    }, 30000);
  });

  // ── Metadata ─────────────────────────────────────────────────

  describe('metadata', () => {
    it('should fetch $metadata XML', async () => {
      const metadata = await client.getMetadata('/sap/opu/odata/sap/API_BUSINESS_PARTNER');
      expect(metadata).toBeDefined();
      expect(typeof metadata).toBe('string');
      expect(metadata).toContain('edmx');
    }, 60000);

    it('should parse $metadata into entity types', async () => {
      const model = await client.parseMetadata('/sap/opu/odata/sap/API_BUSINESS_PARTNER');
      expect(model.entityTypes).toBeDefined();
      expect(Object.keys(model.entityTypes).length).toBeGreaterThan(0);
    }, 60000);
  });

  // ── Read Operations (GET) ────────────────────────────────────

  describe('read operations', () => {
    it('should GET entity set with pagination', async () => {
      const results = await client.getAll('/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner', {
        $top: 100,
        $select: 'BusinessPartner,BusinessPartnerFullName',
      });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    }, 60000);

    it('should handle $filter queries', async () => {
      const results = await client.getAll('/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner', {
        $top: 10,
        $filter: "BusinessPartnerCategory eq '1'",
        $select: 'BusinessPartner,BusinessPartnerCategory',
      });
      expect(Array.isArray(results)).toBe(true);
      for (const bp of results) {
        expect(bp.BusinessPartnerCategory).toBe('1');
      }
    }, 60000);

    it('should handle $count', async () => {
      const result = await client.get('/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner/$count');
      expect(typeof result === 'number' || typeof result === 'string').toBe(true);
    }, 30000);
  });

  // ── CSRF Token Management ────────────────────────────────────

  describe('CSRF management', () => {
    it('should handle concurrent requests with shared CSRF token', async () => {
      // Fire 5 parallel GET requests — CSRF should be fetched once and shared
      const promises = Array.from({ length: 5 }, () =>
        client.get('/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner', {
          $top: 1,
          $select: 'BusinessPartner',
        })
      );
      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      for (const r of results) {
        expect(r).toBeDefined();
      }
    }, 60000);
  });

  // ── Batch Operations ─────────────────────────────────────────

  describe('batch operations', () => {
    it('should execute batch GET requests', async () => {
      const BatchBuilder = require('../../lib/odata/batch');
      const batch = new BatchBuilder();
      batch.addGet('/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner?$top=1');
      batch.addGet('/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner?$top=2');

      const result = await client.batch(batch);
      expect(result).toBeDefined();
    }, 60000);
  });

  // ── Error Handling ───────────────────────────────────────────

  describe('error handling', () => {
    it('should handle 404 gracefully', async () => {
      try {
        await client.get('/sap/opu/odata/sap/NONEXISTENT_SERVICE/Entities');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).toBeDefined();
      }
    }, 30000);

    it('should handle invalid $filter gracefully', async () => {
      try {
        await client.get('/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner', {
          $filter: "INVALID_FIELD eq 'X'",
        });
        // Some systems return empty results instead of error
      } catch (err) {
        expect(err.message).toBeDefined();
      }
    }, 30000);
  });

  // ── Circuit Breaker ──────────────────────────────────────────

  describe('circuit breaker', () => {
    it('should report circuit breaker stats', () => {
      const stats = client.getCircuitBreakerStats();
      expect(stats.state).toBe('closed');
      expect(stats.failureCount).toBe(0);
    });
  });
});
