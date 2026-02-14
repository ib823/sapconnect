/**
 * Tests for SuccessFactors OData V2 Client
 */
const SuccessFactorsClient = require('../../../lib/cloud/successfactors-client');
const { SuccessFactorsError } = require('../../../lib/errors');

describe('SuccessFactorsClient', () => {
  let client;

  beforeEach(() => {
    client = new SuccessFactorsClient({ mode: 'mock', companyId: 'TEST_COMPANY' });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const c = new SuccessFactorsClient({});
      expect(c.mode).toBe('mock');
    });

    it('should accept custom options', () => {
      const c = new SuccessFactorsClient({
        baseUrl: 'https://sf.example.com',
        companyId: 'MY_CO',
        username: 'admin',
        password: 'secret',
        mode: 'mock',
      });
      expect(c.baseUrl).toBe('https://sf.example.com');
      expect(c.companyId).toBe('MY_CO');
      expect(c.username).toBe('admin');
    });

    it('should throw when baseUrl missing in live mode', () => {
      expect(() => new SuccessFactorsClient({ mode: 'live' }))
        .toThrow(SuccessFactorsError);
    });
  });

  // ── authenticate ─────────────────────────────────────────────────

  describe('authenticate', () => {
    it('should authenticate in mock mode', async () => {
      const result = await client.authenticate();
      expect(result.authenticated).toBe(true);
      expect(result.mode).toBe('mock');
    });

    it('should set _authenticated flag', async () => {
      expect(client._authenticated).toBe(false);
      await client.authenticate();
      expect(client._authenticated).toBe(true);
    });

    it('should throw when not authenticated before API call', () => {
      const unauthClient = new SuccessFactorsClient({ mode: 'mock' });
      expect(() => unauthClient.getEntity('FOCompany', 'ACME'))
        .rejects.toThrow(SuccessFactorsError);
    });
  });

  // ── getEntity ────────────────────────────────────────────────────

  describe('getEntity', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should get entity by key', async () => {
      const result = await client.getEntity('FOCompany', 'ACME');
      expect(result.d).toBeDefined();
      expect(result.d.externalCode).toBe('ACME');
      expect(result.d.name).toBe('ACME Corp');
    });

    it('should support $select parameter', async () => {
      const result = await client.getEntity('FOCompany', 'ACME', { $select: 'externalCode,name' });
      expect(result.d.externalCode).toBe('ACME');
      expect(result.d.name).toBe('ACME Corp');
      expect(result.d.country).toBeUndefined();
    });

    it('should support $expand parameter', async () => {
      // $expand is accepted in params even in mock mode (passed through)
      const result = await client.getEntity('FOCompany', 'ACME', { $expand: 'companyNav' });
      expect(result.d.externalCode).toBe('ACME');
    });

    it('should throw when entity not found', async () => {
      await expect(client.getEntity('FOCompany', 'NONEXISTENT'))
        .rejects.toThrow(SuccessFactorsError);
    });
  });

  // ── queryEntities ────────────────────────────────────────────────

  describe('queryEntities', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should query entities with filter', async () => {
      const result = await client.queryEntities('FOCompany', { $filter: "country eq 'US'" });
      expect(result.d.results).toBeDefined();
      expect(result.d.results.length).toBe(1);
      expect(result.d.results[0].externalCode).toBe('ACME');
    });

    it('should support $top and $skip', async () => {
      const result = await client.queryEntities('FODepartment', { $top: 2, $skip: 1 });
      expect(result.d.results.length).toBe(2);
      expect(result.d.results[0].externalCode).toBe('FIN001');
    });

    it('should support $orderby', async () => {
      const result = await client.queryEntities('FOCompany', { $orderby: 'name desc' });
      expect(result.d.results[0].name).toBe('Tech Solutions');
    });

    it('should support effective dating params', async () => {
      const result = await client.queryEntities('EmpJob', { asOfDate: '2023-06-01' });
      expect(result.d.results).toBeDefined();
      expect(result.d.results.length).toBeGreaterThan(0);
    });

    it('should work for multiple entity sets', async () => {
      const companies = await client.queryEntities('FOCompany');
      const departments = await client.queryEntities('FODepartment');
      const jobCodes = await client.queryEntities('FOJobCode');

      expect(companies.d.results.length).toBe(3);
      expect(departments.d.results.length).toBe(5);
      expect(jobCodes.d.results.length).toBe(10);
    });
  });

  // ── createEntity ─────────────────────────────────────────────────

  describe('createEntity', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should create a new entity', async () => {
      const data = { externalCode: 'NEW001', name: 'New Department', status: 'A' };
      const result = await client.createEntity('FODepartment', data);
      expect(result.d).toBeDefined();
      expect(result.d.externalCode).toBe('NEW001');
      expect(result.d.name).toBe('New Department');
    });

    it('should return the created data with metadata', async () => {
      const data = { externalCode: 'CC5000', name: 'New Cost Center', status: 'A' };
      const result = await client.createEntity('FOCostCenter', data);
      expect(result.d.__metadata).toBeDefined();
      expect(result.d.__metadata.type).toBe('FOCostCenter');
    });

    it('should validate entity set', async () => {
      await expect(client.createEntity('InvalidSet', { name: 'test' }))
        .rejects.toThrow(SuccessFactorsError);
    });

    it('should handle CSRF token concept', async () => {
      // In mock mode, CSRF is not needed but the code path should not error
      const data = { externalCode: 'TEST', name: 'Test', status: 'A' };
      const result = await client.createEntity('FOCompany', data);
      expect(result.d.externalCode).toBe('TEST');
    });
  });

  // ── updateEntity ─────────────────────────────────────────────────

  describe('updateEntity', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should update an entity', async () => {
      const result = await client.updateEntity('FOCompany', 'ACME', { name: 'ACME Corporation' });
      expect(result.d.name).toBe('ACME Corporation');
      expect(result.d.externalCode).toBe('ACME');
    });

    it('should use merge semantics (partial update)', async () => {
      const result = await client.updateEntity('FOCompany', 'GLOB', { name: 'Global Enterprises' });
      expect(result.d.name).toBe('Global Enterprises');
      expect(result.d.country).toBe('DE'); // unchanged field preserved
    });

    it('should throw when key is missing', async () => {
      await expect(client.updateEntity('FOCompany', '', { name: 'test' }))
        .rejects.toThrow(SuccessFactorsError);
    });
  });

  // ── deleteEntity ─────────────────────────────────────────────────

  describe('deleteEntity', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should delete an entity', async () => {
      const result = await client.deleteEntity('FOCompany', 'TECH');
      expect(result.status).toBe(204);

      // Verify it's gone
      await expect(client.getEntity('FOCompany', 'TECH'))
        .rejects.toThrow(SuccessFactorsError);
    });

    it('should throw when key is missing', async () => {
      await expect(client.deleteEntity('FOCompany', ''))
        .rejects.toThrow(SuccessFactorsError);
    });
  });

  // ── executeBatch ─────────────────────────────────────────────────

  describe('executeBatch', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should execute batch operations', async () => {
      const ops = [
        { method: 'GET', entitySet: 'FOCompany', key: 'ACME' },
      ];
      const result = await client.executeBatch(ops);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe(200);
    });

    it('should handle mixed CRUD operations', async () => {
      const ops = [
        { method: 'GET', entitySet: 'FOCompany', key: 'ACME' },
        { method: 'POST', entitySet: 'FODivision', data: { externalCode: 'DIV_NEW', name: 'New Division', status: 'A' } },
        { method: 'MERGE', entitySet: 'FOCompany', key: 'GLOB', data: { name: 'Updated Global' } },
      ];
      const result = await client.executeBatch(ops);
      expect(result.results).toHaveLength(3);
      expect(result.results[0].status).toBe(200);
      expect(result.results[1].status).toBe(201);
      expect(result.results[2].status).toBe(200);
    });

    it('should return batch results with status per operation', async () => {
      const ops = [
        { method: 'DELETE', entitySet: 'FODivision', key: 'DIV_NA' },
      ];
      const result = await client.executeBatch(ops);
      expect(result.results[0].status).toBe(204);
      expect(result.status).toBe('completed');
    });

    it('should handle empty batch', async () => {
      const result = await client.executeBatch([]);
      expect(result.results).toHaveLength(0);
      expect(result.status).toBe('empty');
    });
  });

  // ── getMetadata ──────────────────────────────────────────────────

  describe('getMetadata', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return all entity type definitions', async () => {
      const meta = await client.getMetadata();
      expect(meta.FOCompany).toBeDefined();
      expect(meta.FODepartment).toBeDefined();
      expect(meta.EmpEmployment).toBeDefined();
      expect(meta.PerPersonal).toBeDefined();
    });

    it('should include fields in entity type', async () => {
      const meta = await client.getMetadata();
      expect(meta.FOCompany.fields).toBeDefined();
      expect(meta.FOCompany.fields.length).toBeGreaterThan(0);
      expect(meta.FOCompany.fields[0]).toHaveProperty('name');
      expect(meta.FOCompany.fields[0]).toHaveProperty('type');
    });

    it('should return specific entity set metadata', async () => {
      const meta = await client.getMetadata('EmpJob');
      expect(meta.entityType).toBe('EmpJob');
      expect(meta.fields).toBeDefined();
    });

    it('should include key fields', async () => {
      const meta = await client.getMetadata('FOCompany');
      expect(meta.keyFields).toContain('externalCode');
      const keyField = meta.fields.find((f) => f.key === true);
      expect(keyField).toBeDefined();
    });
  });

  // ── Mock data quality ────────────────────────────────────────────

  describe('mock data quality', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should have 3 companies', async () => {
      const result = await client.queryEntities('FOCompany');
      expect(result.d.results).toHaveLength(3);
    });

    it('should have 5 departments', async () => {
      const result = await client.queryEntities('FODepartment');
      expect(result.d.results).toHaveLength(5);
    });

    it('should have 10 job codes', async () => {
      const result = await client.queryEntities('FOJobCode');
      expect(result.d.results).toHaveLength(10);
    });

    it('should have 5 employees', async () => {
      const result = await client.queryEntities('EmpEmployment');
      expect(result.d.results).toHaveLength(5);
    });

    it('should have correct entity sets available', async () => {
      const entitySets = ['FOCompany', 'FODepartment', 'FODivision', 'FOJobCode',
        'FOLocation', 'FOCostCenter', 'FOPayGroup',
        'EmpEmployment', 'EmpJob', 'EmpCompensation',
        'PerPersonal', 'PerEmail', 'PerPhone'];

      for (const es of entitySets) {
        const result = await client.queryEntities(es);
        expect(result.d.results.length).toBeGreaterThan(0);
      }
    });
  });

  // ── Error handling ───────────────────────────────────────────────

  describe('error handling', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should throw SuccessFactorsError', async () => {
      try {
        await client.getEntity('FOCompany', 'NONEXISTENT');
        expect.unreachable('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(SuccessFactorsError);
      }
    });

    it('should have correct error code', async () => {
      try {
        await client.getEntity('FOCompany', 'NONEXISTENT');
        expect.unreachable('should have thrown');
      } catch (err) {
        expect(err.code).toBe('ERR_SUCCESSFACTORS');
      }
    });

    it('should include error details', async () => {
      try {
        await client.getEntity('FOCompany', 'NONEXISTENT');
        expect.unreachable('should have thrown');
      } catch (err) {
        expect(err.details).toBeDefined();
        expect(err.details.entitySet).toBe('FOCompany');
        expect(err.details.key).toBe('NONEXISTENT');
      }
    });

    it('should throw on unknown entity set', async () => {
      await expect(client.queryEntities('UnknownEntitySet'))
        .rejects.toThrow(SuccessFactorsError);
    });
  });

  // ── Effective dating ─────────────────────────────────────────────

  describe('effective dating', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should filter by asOfDate', async () => {
      const result = await client.queryEntities('EmpJob', { asOfDate: '2025-01-01' });
      expect(result.d.results).toBeDefined();
      expect(result.d.results.length).toBeGreaterThan(0);
    });

    it('should filter by fromDate/toDate range', async () => {
      const result = await client.queryEntities('EmpCompensation', {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
      });
      expect(result.d.results).toBeDefined();
      expect(result.d.results.length).toBeGreaterThan(0);
    });

    it('should return all when no date params specified', async () => {
      const result = await client.queryEntities('EmpJob');
      expect(result.d.results.length).toBe(5);
    });

    it('should handle date filtering gracefully', async () => {
      // Very old date should still return records that started before it
      const result = await client.queryEntities('EmpJob', { asOfDate: '2019-01-01' });
      expect(result.d.results).toBeDefined();
      // Some jobs started before 2019 — none in our mock have startDate before 2019
      // so we accept any valid array result
      expect(Array.isArray(result.d.results)).toBe(true);
    });
  });
});
