/**
 * Tests for RFC Connection Pool
 */
const RfcClient = require('../../../lib/rfc/client');
const RfcPool = require('../../../lib/rfc/pool');

describe('RfcPool', () => {
  const connParams = { ashost: '10.0.0.1', sysnr: '00', client: '100', user: 'TEST', passwd: 'pass' };
  let pool;

  beforeEach(() => {
    // Stub _loadNodeRfc to return mock
    vi.spyOn(RfcClient, '_loadNodeRfc').mockReturnValue({
      Client: vi.fn().mockImplementation(() => ({
        open: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
        call: vi.fn().mockResolvedValue({}),
      })),
    });

    pool = new RfcPool(connParams, { poolSize: 3, acquireTimeout: 2000 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with defaults', () => {
      const p = new RfcPool(connParams);
      expect(p.poolSize).toBe(5);
      expect(p.acquireTimeout).toBe(10000);
    });

    it('should accept custom options', () => {
      expect(pool.poolSize).toBe(3);
      expect(pool.acquireTimeout).toBe(2000);
    });
  });

  describe('stats', () => {
    it('should report initial stats', () => {
      expect(pool.stats).toEqual({ total: 0, available: 0, busy: 0, waiting: 0 });
    });

    it('should track busy connections', async () => {
      const client = await pool.acquire();
      expect(pool.stats.busy).toBe(1);
      expect(pool.stats.available).toBe(0);
      await pool.release(client);
      expect(pool.stats.busy).toBe(0);
      expect(pool.stats.available).toBe(1);
    });
  });

  describe('acquire/release', () => {
    it('should create new connections up to pool size', async () => {
      const c1 = await pool.acquire();
      const c2 = await pool.acquire();
      const c3 = await pool.acquire();
      expect(pool.stats.busy).toBe(3);

      await pool.release(c1);
      await pool.release(c2);
      await pool.release(c3);
      expect(pool.stats.available).toBe(3);
    });

    it('should reuse released connections', async () => {
      const c1 = await pool.acquire();
      await pool.release(c1);
      const c2 = await pool.acquire();
      expect(pool.stats.total).toBe(1);
    });

    it('should wait when pool is exhausted', async () => {
      const c1 = await pool.acquire();
      const c2 = await pool.acquire();
      const c3 = await pool.acquire();

      const acquirePromise = pool.acquire();
      // Release one to unblock
      await pool.release(c1);
      const c4 = await acquirePromise;
      expect(c4).toBeDefined();

      await pool.release(c2);
      await pool.release(c3);
      await pool.release(c4);
    });

    it('should timeout when no connections become available', async () => {
      pool = new RfcPool(connParams, { poolSize: 1, acquireTimeout: 100 });
      const c1 = await pool.acquire();
      await expect(pool.acquire()).rejects.toThrow('Acquire timeout');
      await pool.release(c1);
    });
  });

  describe('drain', () => {
    it('should close all connections', async () => {
      const c1 = await pool.acquire();
      const c2 = await pool.acquire();
      await pool.release(c1);
      await pool.drain();
      expect(pool.stats.total).toBe(0);
    });

    it('should reject new acquires after drain', async () => {
      await pool.drain();
      await expect(pool.acquire()).rejects.toThrow('Pool has been drained');
    });
  });
});
