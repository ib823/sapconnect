/**
 * Tests for M3 Adapter (Infor M3)
 */
const M3Adapter = require('../../../../lib/infor/adapters/m3-adapter');
const { InforError } = require('../../../../lib/errors');

describe('M3Adapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new M3Adapter({ company: '100', division: 'AAA', mode: 'mock' });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should store config values', () => {
      expect(adapter.product).toBe('m3');
      expect(adapter.company).toBe('100');
      expect(adapter.division).toBe('AAA');
      expect(adapter.mode).toBe('mock');
    });

    it('should default company to 100', () => {
      const a = new M3Adapter({ mode: 'mock' });
      expect(a.company).toBe('100');
    });

    it('should default division to empty string', () => {
      const a = new M3Adapter({ mode: 'mock' });
      expect(a.division).toBe('');
    });
  });

  // ── Field prefix handling ─────────────────────────────────────

  describe('field prefix handling', () => {
    it('should return Item for IT prefix', () => {
      expect(M3Adapter.getFieldPrefix('ITNO')).toBe('Item');
    });

    it('should return Warehouse for WH prefix', () => {
      expect(M3Adapter.getFieldPrefix('WHLO')).toBe('Warehouse');
    });

    it('should return Customer for CU prefix', () => {
      expect(M3Adapter.getFieldPrefix('CUNO')).toBe('Customer');
    });

    it('should return Supplier for SU prefix', () => {
      expect(M3Adapter.getFieldPrefix('SUNO')).toBe('Supplier');
    });

    it('should return Unknown for unrecognized prefix', () => {
      expect(M3Adapter.getFieldPrefix('XXYZ')).toBe('Unknown');
    });

    it('should handle empty string', () => {
      expect(M3Adapter.getFieldPrefix('')).toBe('Unknown');
    });

    it('should handle null/undefined', () => {
      expect(M3Adapter.getFieldPrefix(null)).toBe('Unknown');
      expect(M3Adapter.getFieldPrefix(undefined)).toBe('Unknown');
    });
  });

  // ── readTable (mock mode) ─────────────────────────────────────

  describe('readTable with mock mode', () => {
    it('should return rows for MITMAS (item master)', async () => {
      const result = await adapter.readTable('MITMAS');
      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should return M3-style field names', async () => {
      const result = await adapter.readTable('MITMAS');
      expect(result.rows[0]).toHaveProperty('ITNO');
      expect(result.rows[0]).toHaveProperty('ITDS');
    });

    it('should return rows for OCUSMA (customer master)', async () => {
      const result = await adapter.readTable('OCUSMA');
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0]).toHaveProperty('CUNO');
    });

    it('should return empty rows for unknown table', async () => {
      const result = await adapter.readTable('UNKNOWN_TABLE');
      expect(result.rows).toEqual([]);
      expect(result.metadata.rowCount).toBe(0);
    });

    it('should respect maxRows option', async () => {
      const result = await adapter.readTable('MITMAS', { maxRows: 1 });
      expect(result.rows.length).toBe(1);
    });

    it('should include metadata with table and company info', async () => {
      const result = await adapter.readTable('MITMAS');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.tableName).toBe('MITMAS');
      expect(result.metadata.company).toBe('100');
      expect(result.metadata.source).toBe('mock');
    });
  });

  // ── getSystemInfo ─────────────────────────────────────────────

  describe('getSystemInfo', () => {
    it('should return system info in mock mode', async () => {
      const info = await adapter.getSystemInfo();
      expect(info.product).toBe('Infor M3');
      expect(info.company).toBe('100');
      expect(info.division).toBe('AAA');
      expect(info.mock).toBe(true);
    });

    it('should include M3 modules', async () => {
      const info = await adapter.getSystemInfo();
      expect(Array.isArray(info.modules)).toBe(true);
      expect(info.modules).toContain('MMS');
      expect(info.modules).toContain('OIS');
    });

    it('should include field prefixes reference', async () => {
      const info = await adapter.getSystemInfo();
      expect(info.fieldPrefixes).toBeDefined();
      expect(info.fieldPrefixes.IT).toBe('Item');
    });
  });

  // ── healthCheck ───────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return healthy in mock mode', async () => {
      const health = await adapter.healthCheck();
      expect(health.ok).toBe(true);
      expect(health.status).toBe('mock');
      expect(health.product).toBe('Infor M3');
      expect(health.company).toBe('100');
    });
  });
});
