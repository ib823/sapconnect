/**
 * Tests for Generic SQL Database Adapter
 */
const InforDbAdapter = require('../../../lib/infor/db-adapter');
const { InforDbError } = require('../../../lib/errors');

describe('InforDbAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new InforDbAdapter({
      type: 'sqlserver',
      host: 'db.example.com',
      database: 'INFOR_DB',
      mode: 'mock',
    });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should store config values', () => {
      expect(adapter.type).toBe('sqlserver');
      expect(adapter.host).toBe('db.example.com');
      expect(adapter.database).toBe('INFOR_DB');
      expect(adapter.mode).toBe('mock');
    });

    it('should default mode to live', () => {
      const a = new InforDbAdapter({});
      expect(a.mode).toBe('live');
    });

    it('should default type to sqlserver', () => {
      const a = new InforDbAdapter({});
      expect(a.type).toBe('sqlserver');
    });

    it('should accept driver as alias for type', () => {
      const a = new InforDbAdapter({ driver: 'oracle' });
      expect(a.type).toBe('oracle');
    });
  });

  // ── query (mock mode) ────────────────────────────────────────

  describe('query in mock mode', () => {
    it('should return rows for a SELECT', async () => {
      const result = await adapter.query('SELECT * FROM ITEM_MASTER');
      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rowCount).toBeGreaterThan(0);
    });

    it('should handle COUNT queries', async () => {
      const result = await adapter.query('SELECT COUNT(*) AS cnt FROM ITEM_MASTER');
      expect(result.rows[0].cnt).toBe(1500);
    });

    it('should accept query parameters', async () => {
      const result = await adapter.query('SELECT * FROM ITEM_MASTER WHERE STATUS = @status', { status: 'Active' });
      expect(result.rows).toBeDefined();
    });
  });

  // ── read-only enforcement ─────────────────────────────────────

  describe('read-only enforcement', () => {
    it('should reject INSERT statements', async () => {
      await expect(adapter.query("INSERT INTO ITEMS VALUES ('X', 'Y')"))
        .rejects.toThrow(InforDbError);
    });

    it('should reject UPDATE statements', async () => {
      await expect(adapter.query("UPDATE ITEMS SET STATUS = 'Inactive'"))
        .rejects.toThrow(InforDbError);
    });

    it('should reject DELETE statements', async () => {
      await expect(adapter.query('DELETE FROM ITEMS WHERE ID = 1'))
        .rejects.toThrow(InforDbError);
    });

    it('should reject DROP statements', async () => {
      await expect(adapter.query('DROP TABLE ITEMS'))
        .rejects.toThrow(InforDbError);
    });

    it('should reject ALTER statements', async () => {
      await expect(adapter.query('ALTER TABLE ITEMS ADD COLUMN NewCol VARCHAR(10)'))
        .rejects.toThrow(InforDbError);
    });

    it('should reject CREATE statements', async () => {
      await expect(adapter.query('CREATE TABLE Evil (id INT)'))
        .rejects.toThrow(InforDbError);
    });

    it('should reject TRUNCATE statements', async () => {
      await expect(adapter.query('TRUNCATE TABLE ITEMS'))
        .rejects.toThrow(InforDbError);
    });

    it('should allow SELECT statements', async () => {
      const result = await adapter.query('SELECT ID, NAME FROM ITEMS WHERE STATUS = 1');
      expect(result.rows).toBeDefined();
    });

    it('should allow SELECT with leading whitespace', async () => {
      const result = await adapter.query('  SELECT * FROM ITEMS');
      expect(result.rows).toBeDefined();
    });

    it('should include error message about read-only', async () => {
      try {
        await adapter.query('INSERT INTO ITEMS VALUES (1)');
        expect.unreachable('should have thrown');
      } catch (err) {
        expect(err.message).toContain('read-only');
      }
    });
  });

  // ── profileTable ──────────────────────────────────────────────

  describe('profileTable', () => {
    it('should return table profile in mock mode', async () => {
      const profile = await adapter.profileTable('ITEM_MASTER');
      expect(profile.tableName).toBe('ITEM_MASTER');
      expect(profile.rowCount).toBe(1500);
      expect(profile.columns).toBeDefined();
      expect(profile.columns.length).toBeGreaterThan(0);
      expect(profile.sampleRows).toBeDefined();
      expect(profile.mock).toBe(true);
    });

    it('should include column metadata', async () => {
      const profile = await adapter.profileTable('ITEM_MASTER');
      const col = profile.columns[0];
      expect(col).toHaveProperty('name');
      expect(col).toHaveProperty('type');
      expect(col).toHaveProperty('nullable');
      expect(col).toHaveProperty('maxLength');
    });
  });

  // ── getTableRowCount ──────────────────────────────────────────

  describe('getTableRowCount', () => {
    it('should return row count in mock mode', async () => {
      const count = await adapter.getTableRowCount('ITEM_MASTER');
      expect(count).toBe(1500);
    });

    it('should return a number', async () => {
      const count = await adapter.getTableRowCount('ANY_TABLE');
      expect(typeof count).toBe('number');
    });
  });

  // ── listTables ────────────────────────────────────────────────

  describe('listTables', () => {
    it('should return table names in mock mode', async () => {
      const tables = await adapter.listTables();
      expect(Array.isArray(tables)).toBe(true);
      expect(tables.length).toBeGreaterThan(0);
    });

    it('should include known table names', async () => {
      const tables = await adapter.listTables();
      expect(tables).toContain('ITEM_MASTER');
      expect(tables).toContain('CUSTOMER_MASTER');
      expect(tables).toContain('GL_ACCOUNT');
    });
  });

  // ── healthCheck ───────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return healthy status in mock mode', async () => {
      const health = await adapter.healthCheck();
      expect(health.ok).toBe(true);
      expect(health.status).toBe('mock');
      expect(health.product).toBe('Infor DB');
      expect(health.databaseType).toBe('sqlserver');
    });

    it('should include latencyMs', async () => {
      const health = await adapter.healthCheck();
      expect(typeof health.latencyMs).toBe('number');
    });
  });
});
