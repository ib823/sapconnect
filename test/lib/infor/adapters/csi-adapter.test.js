/**
 * Tests for CSI Adapter (Infor CloudSuite Industrial / SyteLine)
 */
const CSIAdapter = require('../../../../lib/infor/adapters/csi-adapter');
const { InforError } = require('../../../../lib/errors');

describe('CSIAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new CSIAdapter({ site: 'MAIN', mode: 'mock' });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should store config values', () => {
      expect(adapter.product).toBe('csi');
      expect(adapter.site).toBe('MAIN');
      expect(adapter.mode).toBe('mock');
    });

    it('should default site to MAIN', () => {
      const a = new CSIAdapter({ mode: 'mock' });
      expect(a.site).toBe('MAIN');
    });
  });

  // ── readTable (mock mode) ─────────────────────────────────────

  describe('readTable with mock mode', () => {
    it('should return rows for SLItems', async () => {
      const result = await adapter.readTable('SLItems');
      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should return CSI-style field names', async () => {
      const result = await adapter.readTable('SLItems');
      expect(result.rows[0]).toHaveProperty('Item');
      expect(result.rows[0]).toHaveProperty('Description');
    });

    it('should return customers', async () => {
      const result = await adapter.readTable('SLCustomers');
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0]).toHaveProperty('CustNum');
    });

    it('should return empty rows for unknown collection', async () => {
      const result = await adapter.readTable('UnknownIDO');
      expect(result.rows).toEqual([]);
      expect(result.metadata.rowCount).toBe(0);
    });

    it('should respect maxRows option', async () => {
      const result = await adapter.readTable('SLItems', { maxRows: 1 });
      expect(result.rows.length).toBe(1);
    });

    it('should include metadata with site info', async () => {
      const result = await adapter.readTable('SLItems');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.site).toBe('MAIN');
      expect(result.metadata.source).toBe('mock');
    });
  });

  // ── getSystemInfo ─────────────────────────────────────────────

  describe('getSystemInfo', () => {
    it('should return system info in mock mode', async () => {
      const info = await adapter.getSystemInfo();
      expect(info.product).toBe('Infor CSI/SyteLine');
      expect(info.site).toBe('MAIN');
      expect(info.mock).toBe(true);
    });

    it('should include modules list', async () => {
      const info = await adapter.getSystemInfo();
      expect(Array.isArray(info.modules)).toBe(true);
      expect(info.modules.length).toBeGreaterThan(0);
    });

    it('should include database type', async () => {
      const info = await adapter.getSystemInfo();
      expect(info.database).toBe('SQL Server');
    });
  });

  // ── healthCheck ───────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return healthy in mock mode', async () => {
      const health = await adapter.healthCheck();
      expect(health.ok).toBe(true);
      expect(health.status).toBe('mock');
      expect(health.product).toBe('Infor CSI/SyteLine');
      expect(health.site).toBe('MAIN');
    });
  });
});
