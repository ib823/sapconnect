/**
 * Tests for M3 MI Programs REST Client
 */
const M3ApiClient = require('../../../lib/infor/m3-api-client');
const { M3ApiError } = require('../../../lib/errors');

describe('M3ApiClient', () => {
  let client;

  beforeEach(() => {
    client = new M3ApiClient({
      baseUrl: 'https://m3.example.com',
      mode: 'mock',
      company: '100',
      division: 'AAA',
    });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should store config values', () => {
      expect(client.baseUrl).toBe('https://m3.example.com');
      expect(client.mode).toBe('mock');
      expect(client.company).toBe('100');
      expect(client.division).toBe('AAA');
    });

    it('should default mode to live', () => {
      const c = new M3ApiClient({ baseUrl: 'https://m3.example.com' });
      expect(c.mode).toBe('live');
    });

    it('should accept auth provider', () => {
      const mockAuth = { getHeaders: vi.fn() };
      const c = new M3ApiClient({ mode: 'mock', auth: mockAuth });
      expect(c.auth).toBe(mockAuth);
    });
  });

  // ── execute ───────────────────────────────────────────────────

  describe('execute', () => {
    it('should return transaction result in mock mode', async () => {
      const result = await client.execute('MMS200', 'GetItm', { ITNO: 'A001' });
      expect(result.program).toBe('MMS200');
      expect(result.transaction).toBe('GetItm');
      expect(result.records).toBeDefined();
      expect(result.records.length).toBeGreaterThan(0);
      expect(result.mock).toBe(true);
    });

    it('should return single record for Get transactions', async () => {
      const result = await client.execute('MMS200', 'GetItm', { ITNO: 'A001' });
      expect(result.records.length).toBe(1);
    });

    it('should return multiple records for List transactions', async () => {
      const result = await client.execute('MMS200', 'LstByNam');
      expect(result.records.length).toBeGreaterThan(1);
    });

    it('should include metadata in result', async () => {
      const result = await client.execute('CRS610', 'GetBasicData', { CUNO: 'CUST001' });
      expect(result.metadata).toBeDefined();
      expect(result.metadata.program).toBe('CRS610');
      expect(result.metadata.transaction).toBe('GetBasicData');
      expect(result.metadata.recordCount).toBeGreaterThan(0);
    });

    it('should include NameValue pairs in records', async () => {
      const result = await client.execute('MMS200', 'GetItm', { ITNO: 'A001' });
      const record = result.records[0];
      expect(record.NameValue).toBeDefined();
      expect(Array.isArray(record.NameValue)).toBe(true);

      const itnoField = record.NameValue.find(nv => nv.Name === 'ITNO');
      expect(itnoField).toBeDefined();
      expect(itnoField.Value).toBeDefined();
    });
  });

  // ── listPrograms ──────────────────────────────────────────────

  describe('listPrograms', () => {
    it('should return list of MI programs', async () => {
      const programs = await client.listPrograms();
      expect(Array.isArray(programs)).toBe(true);
      expect(programs.length).toBeGreaterThan(0);
    });

    it('should include program name and description', async () => {
      const programs = await client.listPrograms();
      const first = programs[0];
      expect(first).toHaveProperty('program');
      expect(first).toHaveProperty('description');
      expect(typeof first.program).toBe('string');
      expect(first.program.length).toBeGreaterThan(0);
    });

    it('should include known programs like MMS200', async () => {
      const programs = await client.listPrograms();
      const mms200 = programs.find(p => p.program === 'MMS200');
      expect(mms200).toBeDefined();
      expect(mms200.description).toContain('Item');
    });
  });

  // ── discoverTransactions ──────────────────────────────────────

  describe('discoverTransactions', () => {
    it('should return transactions for a known program', async () => {
      const transactions = await client.discoverTransactions('MMS200');
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
    });

    it('should include transaction name', async () => {
      const transactions = await client.discoverTransactions('MMS200');
      const first = transactions[0];
      expect(first).toHaveProperty('transaction');
      expect(typeof first.transaction).toBe('string');
    });

    it('should return empty for unknown program', async () => {
      const transactions = await client.discoverTransactions('UNKNOWN_PROG');
      expect(transactions).toEqual([]);
    });
  });

  // ── mock mode ─────────────────────────────────────────────────

  describe('mock mode', () => {
    it('should set mock flag on execute results', async () => {
      const result = await client.execute('MMS200', 'GetItm');
      expect(result.mock).toBe(true);
    });

    it('should inject default CONO into mock records', async () => {
      const result = await client.execute('MMS200', 'GetItm', {});
      const record = result.records[0];
      const cono = record.NameValue.find(nv => nv.Name === 'CONO');
      expect(cono.Value).toBe('100');
    });
  });

  // ── healthCheck ───────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return healthy status in mock mode', async () => {
      const health = await client.healthCheck();
      expect(health.ok).toBe(true);
      expect(health.status).toBe('mock');
      expect(health.product).toBe('Infor M3');
    });

    it('should include latencyMs', async () => {
      const health = await client.healthCheck();
      expect(health.latencyMs).toBeDefined();
      expect(typeof health.latencyMs).toBe('number');
    });
  });
});
