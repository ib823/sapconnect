/**
 * Tests for LN Adapter (Infor LN / Baan)
 */
const LNAdapter = require('../../../../lib/infor/adapters/ln-adapter');
const { InforError } = require('../../../../lib/errors');

describe('LNAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new LNAdapter({ company: '100', mode: 'mock' });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should store config values', () => {
      expect(adapter.product).toBe('ln');
      expect(adapter.company).toBe('100');
      expect(adapter.mode).toBe('mock');
    });

    it('should default company to 100', () => {
      const a = new LNAdapter({ mode: 'mock' });
      expect(a.company).toBe('100');
    });
  });

  // ── Company suffix handling ───────────────────────────────────

  describe('company suffix handling', () => {
    it('should append company to table name', () => {
      expect(adapter.getCompanyTable('tcibd001')).toBe('tcibd001100');
    });

    it('should pad single-digit company to 3 digits', () => {
      const a = new LNAdapter({ company: '1', mode: 'mock' });
      expect(a.getCompanyTable('tcibd001')).toBe('tcibd001001');
    });

    it('should pad two-digit company to 3 digits', () => {
      const a = new LNAdapter({ company: '50', mode: 'mock' });
      expect(a.getCompanyTable('tcibd001')).toBe('tcibd001050');
    });

    it('should handle 3-digit company as-is', () => {
      const a = new LNAdapter({ company: '200', mode: 'mock' });
      expect(a.getCompanyTable('tccom100')).toBe('tccom100200');
    });
  });

  // ── readTable (mock mode) ─────────────────────────────────────

  describe('readTable with mock mode', () => {
    it('should return rows for known table', async () => {
      const result = await adapter.readTable('tcibd001');
      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should return items with LN field names', async () => {
      const result = await adapter.readTable('tcibd001');
      expect(result.rows[0]).toHaveProperty('ITEM');
      expect(result.rows[0]).toHaveProperty('DSCA');
    });

    it('should return empty rows for unknown table', async () => {
      const result = await adapter.readTable('nonexistent_table');
      expect(result.rows).toEqual([]);
      expect(result.metadata.rowCount).toBe(0);
    });

    it('should respect maxRows option', async () => {
      const result = await adapter.readTable('tcibd001', { maxRows: 1 });
      expect(result.rows.length).toBe(1);
    });

    it('should filter fields when specified', async () => {
      const result = await adapter.readTable('tcibd001', { fields: ['ITEM', 'DSCA'] });
      const row = result.rows[0];
      expect(row.ITEM).toBeDefined();
      expect(row.DSCA).toBeDefined();
      expect(row.CITG).toBeUndefined();
    });

    it('should include metadata with company suffix table name', async () => {
      const result = await adapter.readTable('tcibd001');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.tableName).toBe('tcibd001100');
      expect(result.metadata.baseTable).toBe('tcibd001');
      expect(result.metadata.company).toBe('100');
      expect(result.metadata.source).toBe('mock');
    });
  });

  // ── getSystemInfo ─────────────────────────────────────────────

  describe('getSystemInfo', () => {
    it('should return system info in mock mode', async () => {
      const info = await adapter.getSystemInfo();
      expect(info.product).toBe('Infor LN');
      expect(info.company).toBe('100');
      expect(info.version).toBeDefined();
      expect(info.mock).toBe(true);
    });

    it('should include modules list', async () => {
      const info = await adapter.getSystemInfo();
      expect(Array.isArray(info.modules)).toBe(true);
      expect(info.modules.length).toBeGreaterThan(0);
    });
  });

  // ── healthCheck ───────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return healthy in mock mode', async () => {
      const health = await adapter.healthCheck();
      expect(health.ok).toBe(true);
      expect(health.status).toBe('mock');
      expect(health.product).toBe('Infor LN');
      expect(health.company).toBe('100');
    });
  });
});
