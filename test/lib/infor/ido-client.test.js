/**
 * Tests for CSI IDO REST Client (Infor SyteLine / CloudSuite Industrial)
 */
const IDOClient = require('../../../lib/infor/ido-client');
const { IDOError } = require('../../../lib/errors');

describe('IDOClient', () => {
  let client;

  beforeEach(() => {
    client = new IDOClient({
      baseUrl: 'https://csi.example.com',
      mode: 'mock',
    });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should store config values', () => {
      expect(client.baseUrl).toBe('https://csi.example.com');
      expect(client.mode).toBe('mock');
    });

    it('should default mode to live', () => {
      const c = new IDOClient({});
      expect(c.mode).toBe('live');
    });

    it('should strip trailing slashes from baseUrl', () => {
      const c = new IDOClient({ baseUrl: 'https://csi.example.com///', mode: 'mock' });
      expect(c.baseUrl).toBe('https://csi.example.com');
    });

    it('should accept auth provider', () => {
      const mockAuth = { getHeaders: vi.fn() };
      const c = new IDOClient({ mode: 'mock', auth: mockAuth });
      expect(c.auth).toBe(mockAuth);
    });
  });

  // ── queryCollection ───────────────────────────────────────────

  describe('queryCollection', () => {
    it('should return records for a known collection', async () => {
      const result = await client.queryCollection('SLItems');
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.mock).toBe(true);
    });

    it('should include totalCount and idoName', async () => {
      const result = await client.queryCollection('SLCustomers');
      expect(result.totalCount).toBeDefined();
      expect(typeof result.totalCount).toBe('number');
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.idoName).toBe('SLCustomers');
    });

    it('should respect recordCap option', async () => {
      const result = await client.queryCollection('SLItems', null, null, { recordCap: 1 });
      expect(result.items.length).toBe(1);
    });

    it('should filter properties when specified as string', async () => {
      const result = await client.queryCollection('SLItems', 'Item,Description');
      const item = result.items[0];
      expect(item.Item).toBeDefined();
      expect(item.Description).toBeDefined();
      expect(item.UM).toBeUndefined();
    });

    it('should filter properties when specified as array', async () => {
      const result = await client.queryCollection('SLItems', ['Item', 'Status']);
      const item = result.items[0];
      expect(item.Item).toBeDefined();
      expect(item.Status).toBeDefined();
      expect(item.Description).toBeUndefined();
    });

    it('should return empty for unknown collection', async () => {
      const result = await client.queryCollection('UnknownCollection');
      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('should query multiple collections', async () => {
      const items = await client.queryCollection('SLItems');
      const customers = await client.queryCollection('SLCustomers');
      const vendors = await client.queryCollection('SLVendors');

      expect(items.items.length).toBeGreaterThan(0);
      expect(customers.items.length).toBeGreaterThan(0);
      expect(vendors.items.length).toBeGreaterThan(0);
    });
  });

  // ── getProperty ───────────────────────────────────────────────

  describe('getProperty', () => {
    it('should return property info for a known IDO and property', async () => {
      const result = await client.getProperty('SLItems', 'Item');
      expect(result.idoName).toBe('SLItems');
      expect(result.propertyName).toBe('Item');
      expect(result.value).toBe('ITEM-001');
      expect(result.mock).toBe(true);
    });

    it('should include schema information', async () => {
      const result = await client.getProperty('SLItems', 'Item');
      expect(result.schema).toBeDefined();
      expect(result.schema).toHaveProperty('type');
      expect(result.schema).toHaveProperty('length');
      expect(result.schema).toHaveProperty('isKey');
    });

    it('should return mock value for unknown property', async () => {
      const result = await client.getProperty('SLItems', 'UnknownProp');
      expect(result.value).toContain('mock_');
    });
  });

  // ── executeMethod ─────────────────────────────────────────────

  describe('executeMethod', () => {
    it('should return success result in mock mode', async () => {
      const result = await client.executeMethod('SLItems', 'ValidateItem', { Item: 'ITEM-001' });
      expect(result.success).toBe(true);
      expect(result.idoName).toBe('SLItems');
      expect(result.methodName).toBe('ValidateItem');
      expect(result.mock).toBe(true);
    });

    it('should include returnValue', async () => {
      const result = await client.executeMethod('SLItems', 'UpdateQty', { Item: 'TEST', Qty: 10 });
      expect(result.returnValue).toBe(0);
    });

    it('should include message about mock execution', async () => {
      const result = await client.executeMethod('SLCos', 'ConfirmOrder', { CoNum: 'CO-10001' });
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
    });
  });

  // ── listIDOs ──────────────────────────────────────────────────

  describe('listIDOs', () => {
    it('should return a catalog of available IDOs', async () => {
      const idos = await client.listIDOs();
      expect(Array.isArray(idos)).toBe(true);
      expect(idos.length).toBeGreaterThan(0);
    });

    it('should include name and description', async () => {
      const idos = await client.listIDOs();
      const first = idos[0];
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('description');
    });

    it('should include known IDOs', async () => {
      const idos = await client.listIDOs();
      const names = idos.map(i => i.name);
      expect(names).toContain('SLItems');
      expect(names).toContain('SLCustomers');
    });
  });

  // ── mock mode ─────────────────────────────────────────────────

  describe('mock mode', () => {
    it('should set mock flag on query results', async () => {
      const result = await client.queryCollection('SLItems');
      expect(result.mock).toBe(true);
    });

    it('should return consistent mock data', async () => {
      const result1 = await client.queryCollection('SLItems');
      const result2 = await client.queryCollection('SLItems');
      expect(result1.items.length).toBe(result2.items.length);
    });
  });

  // ── healthCheck ───────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return healthy status in mock mode', async () => {
      const health = await client.healthCheck();
      expect(health.ok).toBe(true);
      expect(health.status).toBe('mock');
      expect(health.product).toBe('Infor CSI/SyteLine');
    });

    it('should include latencyMs', async () => {
      const health = await client.healthCheck();
      expect(health.latencyMs).toBeDefined();
      expect(typeof health.latencyMs).toBe('number');
    });
  });
});
