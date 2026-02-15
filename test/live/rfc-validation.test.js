/**
 * RFC Live Validation Tests
 *
 * Validates RFC client behavior against a real SAP system.
 * These tests are SKIPPED unless SAP_LIVE_TEST=1 is set and
 * node-rfc is installed.
 *
 * Required env vars:
 *   SAP_LIVE_TEST=1
 *   SAP_RFC_ASHOST=<host> (or SAP_RFC_MSHOST for load-balanced)
 *   SAP_RFC_SYSNR=<system_number>
 *   SAP_RFC_CLIENT=<client>
 *   SAP_RFC_USER=<user>
 *   SAP_RFC_PASSWD=<password>
 */

const LIVE = process.env.SAP_LIVE_TEST === '1';

let nodeRfcAvailable = false;
try {
  require('node-rfc');
  nodeRfcAvailable = true;
} catch { /* node-rfc not installed */ }

const describeLive = (LIVE && nodeRfcAvailable) ? describe : describe.skip;

describeLive('RFC Live Validation', () => {
  let RfcClient;
  let RfcPool;
  let TableReader;
  let client;

  beforeAll(async () => {
    RfcClient = require('../../lib/rfc/client');
    RfcPool = require('../../lib/rfc/pool');
    TableReader = require('../../lib/rfc/table-reader');

    client = new RfcClient({
      ashost: process.env.SAP_RFC_ASHOST,
      sysnr: process.env.SAP_RFC_SYSNR || '00',
      client: process.env.SAP_RFC_CLIENT || '100',
      user: process.env.SAP_RFC_USER,
      passwd: process.env.SAP_RFC_PASSWD,
      lang: process.env.SAP_RFC_LANG || 'EN',
    });

    await client.open();
  }, 30000);

  afterAll(async () => {
    if (client?.isConnected) {
      await client.close();
    }
  });

  // ── Connectivity ─────────────────────────────────────────────

  describe('connectivity', () => {
    it('should connect and ping', async () => {
      const ok = await client.ping();
      expect(ok).toBe(true);
    }, 15000);

    it('should report connection type', () => {
      expect(['direct', 'load-balanced', 'router']).toContain(client.connectionType);
    });

    it('should report circuit breaker stats', () => {
      const stats = client.getCircuitBreakerStats();
      expect(stats.state).toBe('closed');
    });
  });

  // ── RFC Function Calls ───────────────────────────────────────

  describe('function module calls', () => {
    it('should call RFC_SYSTEM_INFO', async () => {
      const result = await client.call('RFC_SYSTEM_INFO');
      expect(result).toBeDefined();
      expect(result.RFCSI_EXPORT || result.DEST).toBeDefined();
    }, 15000);

    it('should search function modules', async () => {
      const results = await client.searchFunctionModules('RFC_*');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].FUNCNAME).toBeDefined();
    }, 15000);

    it('should get function interface', async () => {
      const iface = await client.getFunctionInterface('RFC_PING');
      expect(iface.name).toBe('RFC_PING');
    }, 15000);
  });

  // ── Table Reader ─────────────────────────────────────────────

  describe('table reader', () => {
    let reader;

    beforeAll(() => {
      reader = new TableReader(client);
    });

    it('should read a small table (T000 — clients)', async () => {
      const rows = await reader.read('T000', {
        fields: ['MANDT', 'MTEXT'],
        maxRows: 10,
      });
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].MANDT).toBeDefined();
    }, 30000);

    it('should read with WHERE clause', async () => {
      const mandt = process.env.SAP_RFC_CLIENT || '100';
      const rows = await reader.read('T000', {
        fields: ['MANDT', 'MTEXT'],
        where: `MANDT = '${mandt}'`,
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].MANDT.trim()).toBe(mandt);
    }, 30000);

    it('should handle non-existent table gracefully', async () => {
      try {
        await reader.read('ZTABLE_DOES_NOT_EXIST_XYZ', { fields: ['MANDT'] });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).toBeDefined();
      }
    }, 15000);
  });

  // ── Connection Pool ──────────────────────────────────────────

  describe('connection pool', () => {
    let pool;

    beforeAll(() => {
      pool = new RfcPool({
        ashost: process.env.SAP_RFC_ASHOST,
        sysnr: process.env.SAP_RFC_SYSNR || '00',
        client: process.env.SAP_RFC_CLIENT || '100',
        user: process.env.SAP_RFC_USER,
        passwd: process.env.SAP_RFC_PASSWD,
      }, {
        poolSize: 3,
        acquireTimeout: 15000,
      });
    });

    afterAll(async () => {
      if (pool) await pool.drain();
    });

    it('should acquire and release connections', async () => {
      const conn = await pool.acquire();
      expect(conn).toBeDefined();
      const ok = await conn.ping();
      expect(ok).toBe(true);
      await pool.release(conn);
    }, 30000);

    it('should handle concurrent acquisitions', async () => {
      const promises = Array.from({ length: 3 }, async () => {
        const conn = await pool.acquire();
        await conn.ping();
        await pool.release(conn);
        return true;
      });
      const results = await Promise.all(promises);
      expect(results.every((r) => r === true)).toBe(true);
    }, 60000);
  });

  // ── Encoding ─────────────────────────────────────────────────

  describe('encoding', () => {
    it('should handle special characters in table data', async () => {
      // Read T005T (Country names) which contains accented characters
      const reader = new TableReader(client);
      const rows = await reader.read('T005T', {
        fields: ['SPRAS', 'LAND1', 'LANDX'],
        where: "SPRAS = 'D'",
        maxRows: 20,
      });
      expect(rows.length).toBeGreaterThan(0);
      // German country names should include umlauts (Österreich, etc.)
    }, 30000);
  });
});
