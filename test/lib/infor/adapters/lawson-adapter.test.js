/**
 * Tests for Lawson Adapter (Infor Lawson / Landmark)
 */
const LawsonAdapter = require('../../../../lib/infor/adapters/lawson-adapter');
const { InforError } = require('../../../../lib/errors');

describe('LawsonAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new LawsonAdapter({ dataArea: 'PROD', mode: 'mock' });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should store config values', () => {
      expect(adapter.product).toBe('lawson');
      expect(adapter.dataArea).toBe('PROD');
      expect(adapter.mode).toBe('mock');
    });

    it('should default dataArea to PROD', () => {
      const a = new LawsonAdapter({ mode: 'mock' });
      expect(a.dataArea).toBe('PROD');
    });
  });

  // ── readTable (mock mode) ─────────────────────────────────────

  describe('readTable with mock mode', () => {
    it('should return rows for Employee', async () => {
      const result = await adapter.readTable('Employee');
      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should return Lawson-style field names', async () => {
      const result = await adapter.readTable('Employee');
      expect(result.rows[0]).toHaveProperty('Employee');
      expect(result.rows[0]).toHaveProperty('FirstName');
      expect(result.rows[0]).toHaveProperty('LastName');
    });

    it('should return vendors', async () => {
      const result = await adapter.readTable('Vendor');
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0]).toHaveProperty('Vendor');
      expect(result.rows[0]).toHaveProperty('Name');
    });

    it('should return empty for unknown entity', async () => {
      const result = await adapter.readTable('UnknownEntity');
      expect(result.rows).toEqual([]);
    });

    it('should respect maxRows option', async () => {
      const result = await adapter.readTable('Employee', { maxRows: 1 });
      expect(result.rows.length).toBe(1);
    });
  });

  // ── getSystemInfo ─────────────────────────────────────────────

  describe('getSystemInfo', () => {
    it('should return system info in mock mode', async () => {
      const info = await adapter.getSystemInfo();
      expect(info.product).toBe('Infor Lawson/Landmark');
      expect(info.dataArea).toBe('PROD');
      expect(info.mock).toBe(true);
    });

    it('should include modules list', async () => {
      const info = await adapter.getSystemInfo();
      expect(Array.isArray(info.modules)).toBe(true);
      const codes = info.modules.map(m => m.code);
      expect(codes).toContain('HR');
      expect(codes).toContain('GL');
    });

    it('should include database type', async () => {
      const info = await adapter.getSystemInfo();
      expect(info.database).toBe('Oracle');
    });
  });

  // ── healthCheck ───────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return healthy in mock mode', async () => {
      const health = await adapter.healthCheck();
      expect(health.ok).toBe(true);
      expect(health.status).toBe('mock');
      expect(health.product).toBe('Infor Lawson/Landmark');
      expect(health.dataArea).toBe('PROD');
    });
  });
});
