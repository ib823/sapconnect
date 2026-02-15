/**
 * Tests for ION API Gateway Client
 */
const IONClient = require('../../../lib/infor/ion-client');
const { IONError } = require('../../../lib/errors');

describe('IONClient', () => {
  let client;

  beforeEach(() => {
    client = new IONClient({
      baseUrl: 'https://mingle-ionapi.example.com',
      tenant: 'TESTTENANT',
      mode: 'mock',
    });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should store config values', () => {
      expect(client.baseUrl).toBe('https://mingle-ionapi.example.com');
      expect(client.tenant).toBe('TESTTENANT');
      expect(client.mode).toBe('mock');
    });

    it('should default mode to live', () => {
      const c = new IONClient({ baseUrl: 'https://example.com' });
      expect(c.mode).toBe('live');
    });

    it('should strip trailing slashes from baseUrl', () => {
      const c = new IONClient({ baseUrl: 'https://example.com///', mode: 'mock' });
      expect(c.baseUrl).toBe('https://example.com');
    });

    it('should create an internal auth provider', () => {
      expect(client._authProvider).toBeDefined();
    });
  });

  // ── Mock mode ─────────────────────────────────────────────────

  describe('mock mode', () => {
    it('should return mock data for request()', async () => {
      const result = await client.request('GET', '/test/path');
      expect(result.mock).toBe(true);
      expect(result.method).toBe('GET');
      expect(result.path).toBe('/test/path');
    });

    it('should return mock health check', async () => {
      const health = await client.healthCheck();
      expect(health.ok).toBe(true);
      expect(health.status).toBe('mock');
      expect(health.product).toBe('ION API Gateway');
    });
  });

  // ── authenticate ──────────────────────────────────────────────

  describe('authenticate', () => {
    it('should authenticate in mock mode via auth provider', async () => {
      const result = await client.authenticate();
      expect(result).toBe(true);
      expect(client._authenticated).toBe(true);
    });

    it('should cache authentication state', async () => {
      await client.authenticate();
      expect(client._authenticated).toBe(true);

      // Second call should also succeed (token is cached in provider)
      const result = await client.authenticate();
      expect(result).toBe(true);
    });
  });

  // ── queryBOD ──────────────────────────────────────────────────

  describe('queryBOD', () => {
    it('should return BOD documents in mock mode', async () => {
      const result = await client.queryBOD('SalesOrder');
      expect(result.value).toBeDefined();
      expect(result.value.length).toBeGreaterThan(0);
      expect(result.noun).toBe('SalesOrder');
      expect(result.mock).toBe(true);
    });

    it('should include noun and verb in result', async () => {
      const result = await client.queryBOD('Item', 'Sync');
      expect(result.noun).toBe('Item');
      expect(result.verb).toBe('Sync');
    });

    it('should respect $top filter', async () => {
      const result = await client.queryBOD('SalesOrder', 'Get', { $top: 2 });
      expect(result.value.length).toBeLessThanOrEqual(2);
    });

    it('should return items with expected shape', async () => {
      const result = await client.queryBOD('PurchaseOrder');
      const item = result.value[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('noun');
      expect(item).toHaveProperty('status');
    });
  });

  // ── getBODDocument ────────────────────────────────────────────

  describe('getBODDocument', () => {
    it('should return a single BOD document', async () => {
      const result = await client.getBODDocument('SalesOrder', 'SO-12345');
      expect(result.id).toBe('SO-12345');
      expect(result.noun).toBe('SalesOrder');
      expect(result.mock).toBe(true);
    });

    it('should include document properties', async () => {
      const result = await client.getBODDocument('Item', 'ITM-001');
      expect(result.properties).toBeDefined();
    });
  });

  // ── listBODs ──────────────────────────────────────────────────

  describe('listBODs', () => {
    it('should return a catalog of available BODs', async () => {
      const bods = await client.listBODs();
      expect(Array.isArray(bods)).toBe(true);
      expect(bods.length).toBeGreaterThan(0);
    });

    it('should include noun, description, and verbs', async () => {
      const bods = await client.listBODs();
      const first = bods[0];
      expect(first).toHaveProperty('noun');
      expect(first).toHaveProperty('description');
      expect(first).toHaveProperty('verbs');
      expect(Array.isArray(first.verbs)).toBe(true);
    });
  });

  // ── healthCheck ───────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return healthy status in mock mode', async () => {
      const health = await client.healthCheck();
      expect(health.ok).toBe(true);
      expect(health.status).toBe('mock');
      expect(health.latencyMs).toBeDefined();
      expect(health.product).toBe('ION API Gateway');
    });
  });

  // ── Authentication token caching ──────────────────────────────

  describe('authentication token caching', () => {
    it('should cache the auth provider token', async () => {
      const provider = client.getAuthProvider();
      const token1 = await provider.getToken();
      const token2 = await provider.getToken();
      // Second call returns cached token (same value)
      expect(token1).toBe(token2);
    });

    it('should refresh token when expired', async () => {
      const provider = client.getAuthProvider();

      // Control Date.now() to ensure different mock token strings
      let now = 1000000;
      const spy = vi.spyOn(Date, 'now').mockImplementation(() => now);

      const token1 = await provider.getToken();

      // Force expiration and advance time
      provider._expiresAt = 0;
      now = 2000000;
      const token2 = await provider.getToken();

      spy.mockRestore();

      // After expiry, a new token is generated
      expect(token2).not.toBe(token1);
    });
  });
});
