/**
 * Tests for Lawson Landmark REST Client
 */
const LandmarkClient = require('../../../lib/infor/landmark-client');
const { LandmarkError } = require('../../../lib/errors');

describe('LandmarkClient', () => {
  let client;

  beforeEach(() => {
    client = new LandmarkClient({
      baseUrl: 'https://lawson.example.com',
      dataArea: 'PROD',
      mode: 'mock',
    });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should store config values', () => {
      expect(client.baseUrl).toBe('https://lawson.example.com');
      expect(client.dataArea).toBe('PROD');
      expect(client.mode).toBe('mock');
    });

    it('should default mode to live', () => {
      const c = new LandmarkClient({});
      expect(c.mode).toBe('live');
    });
  });

  // ── queryEntities ─────────────────────────────────────────────

  describe('queryEntities', () => {
    it('should return entities for a known type', async () => {
      const result = await client.queryEntities('Employee');
      expect(result.entities).toBeDefined();
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.mock).toBe(true);
    });

    it('should include totalCount and entityType', async () => {
      const result = await client.queryEntities('Vendor');
      expect(result.totalCount).toBeDefined();
      expect(typeof result.totalCount).toBe('number');
      expect(result.entityType).toBe('Vendor');
    });

    it('should respect top option', async () => {
      const result = await client.queryEntities('Employee', null, { top: 1 });
      expect(result.entities.length).toBe(1);
    });

    it('should filter fields with select option', async () => {
      const result = await client.queryEntities('Employee', null, { select: 'Employee,FirstName' });
      const entity = result.entities[0];
      expect(entity.Employee).toBeDefined();
      expect(entity.FirstName).toBeDefined();
      expect(entity.LastName).toBeUndefined();
    });

    it('should return empty for unknown entity type', async () => {
      const result = await client.queryEntities('UnknownType');
      expect(result.entities).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('should query multiple entity types', async () => {
      const employees = await client.queryEntities('Employee');
      const vendors = await client.queryEntities('Vendor');
      const customers = await client.queryEntities('Customer');

      expect(employees.entities.length).toBeGreaterThan(0);
      expect(vendors.entities.length).toBeGreaterThan(0);
      expect(customers.entities.length).toBeGreaterThan(0);
    });
  });

  // ── getEntity ─────────────────────────────────────────────────

  describe('getEntity', () => {
    it('should return a single entity by key', async () => {
      const entity = await client.getEntity('Employee', 'EMP001');
      expect(entity.Employee).toBe('EMP001');
      expect(entity.FirstName).toBe('John');
      expect(entity.LastName).toBe('Doe');
    });

    it('should return vendor by key', async () => {
      const entity = await client.getEntity('Vendor', 'V1000');
      expect(entity.Vendor).toBe('V1000');
      expect(entity.Name).toBe('Industrial Supply Co');
    });

    it('should throw for entity not found', async () => {
      await expect(client.getEntity('Employee', 'NONEXISTENT'))
        .rejects.toThrow(LandmarkError);
    });

    it('should throw for unknown entity type', async () => {
      await expect(client.getEntity('FakeType', 'KEY'))
        .rejects.toThrow(LandmarkError);
    });
  });

  // ── listEntityTypes ───────────────────────────────────────────

  describe('listEntityTypes', () => {
    it('should return list of entity types', async () => {
      const types = await client.listEntityTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should include name, dataArea, and description', async () => {
      const types = await client.listEntityTypes();
      const first = types[0];
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('dataArea');
      expect(first).toHaveProperty('description');
    });

    it('should include known entity types', async () => {
      const types = await client.listEntityTypes();
      const names = types.map(t => t.name);
      expect(names).toContain('Employee');
      expect(names).toContain('Vendor');
      expect(names).toContain('GLAccount');
    });
  });

  // ── mock mode ─────────────────────────────────────────────────

  describe('mock mode', () => {
    it('should set mock flag on query results', async () => {
      const result = await client.queryEntities('Employee');
      expect(result.mock).toBe(true);
    });

    it('should return consistent data on repeated calls', async () => {
      const r1 = await client.queryEntities('Employee');
      const r2 = await client.queryEntities('Employee');
      expect(r1.entities.length).toBe(r2.entities.length);
    });
  });

  // ── healthCheck ───────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return healthy status in mock mode', async () => {
      const health = await client.healthCheck();
      expect(health.ok).toBe(true);
      expect(health.status).toBe('mock');
      expect(health.product).toBe('Infor Lawson/Landmark');
    });

    it('should include latencyMs', async () => {
      const health = await client.healthCheck();
      expect(typeof health.latencyMs).toBe('number');
    });
  });
});
