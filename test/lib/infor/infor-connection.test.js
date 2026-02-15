/**
 * Tests for Infor Connection Factory
 */
const InforConnection = require('../../../lib/infor/infor-connection');
const IONClient = require('../../../lib/infor/ion-client');
const M3ApiClient = require('../../../lib/infor/m3-api-client');
const IDOClient = require('../../../lib/infor/ido-client');
const LandmarkClient = require('../../../lib/infor/landmark-client');
const InforDbAdapter = require('../../../lib/infor/db-adapter');
const { InforError } = require('../../../lib/errors');

describe('InforConnection', () => {
  // ── fromEnv ───────────────────────────────────────────────────

  describe('fromEnv', () => {
    it('should create M3 product client from env', () => {
      const env = {
        INFOR_PRODUCT: 'M3',
        INFOR_ION_BASE_URL: 'https://ion.example.com',
        INFOR_MODE: 'mock',
        INFOR_TENANT: 'TESTTENANT',
      };

      const result = InforConnection.fromEnv(env);
      expect(result.productType).toBe('M3');
      expect(result.product).toBeInstanceOf(M3ApiClient);
      expect(result.ion).toBeInstanceOf(IONClient);
      expect(result.mode).toBe('mock');
    });

    it('should create CSI product client from env', () => {
      const env = {
        INFOR_PRODUCT: 'CSI',
        INFOR_MODE: 'mock',
      };

      const result = InforConnection.fromEnv(env);
      expect(result.productType).toBe('CSI');
      expect(result.product).toBeInstanceOf(IDOClient);
    });

    it('should create LAWSON product client from env', () => {
      const env = {
        INFOR_PRODUCT: 'LAWSON',
        INFOR_MODE: 'mock',
      };

      const result = InforConnection.fromEnv(env);
      expect(result.productType).toBe('LAWSON');
      expect(result.product).toBeInstanceOf(LandmarkClient);
    });

    it('should create LN product (uses ION) from env', () => {
      const env = {
        INFOR_PRODUCT: 'LN',
        INFOR_MODE: 'mock',
      };

      const result = InforConnection.fromEnv(env);
      expect(result.productType).toBe('LN');
      expect(result.product).toBeInstanceOf(IONClient);
    });

    it('should create DB adapter when DB config provided', () => {
      const env = {
        INFOR_PRODUCT: 'M3',
        INFOR_MODE: 'mock',
        INFOR_DB_TYPE: 'oracle',
        INFOR_DB_HOST: 'db.example.com',
        INFOR_DB_PORT: '1521',
        INFOR_DB_NAME: 'INFORDB',
      };

      const result = InforConnection.fromEnv(env);
      expect(result.db).toBeInstanceOf(InforDbAdapter);
      expect(result.db.type).toBe('oracle');
    });

    it('should throw for unknown product', () => {
      const env = { INFOR_PRODUCT: 'UNKNOWN' };
      expect(() => InforConnection.fromEnv(env)).toThrow(InforError);
    });

    it('should throw for missing product', () => {
      expect(() => InforConnection.fromEnv({})).toThrow(InforError);
    });

    it('should default mode to mock', () => {
      const env = { INFOR_PRODUCT: 'M3' };
      const result = InforConnection.fromEnv(env);
      expect(result.mode).toBe('mock');
    });

    it('should be case-insensitive for product name', () => {
      const env = { INFOR_PRODUCT: 'm3', INFOR_MODE: 'mock' };
      const result = InforConnection.fromEnv(env);
      expect(result.productType).toBe('M3');
    });
  });

  // ── createClient ──────────────────────────────────────────────

  describe('createClient', () => {
    it('should create ION client', () => {
      const client = InforConnection.createClient({ product: 'ION', mode: 'mock' });
      expect(client).toBeInstanceOf(IONClient);
    });

    it('should create M3 client', () => {
      const client = InforConnection.createClient({ product: 'M3', mode: 'mock' });
      expect(client).toBeInstanceOf(M3ApiClient);
    });

    it('should create CSI client', () => {
      const client = InforConnection.createClient({ product: 'CSI', mode: 'mock' });
      expect(client).toBeInstanceOf(IDOClient);
    });

    it('should create Lawson client', () => {
      const client = InforConnection.createClient({ product: 'LAWSON', mode: 'mock' });
      expect(client).toBeInstanceOf(LandmarkClient);
    });

    it('should create DB adapter', () => {
      const client = InforConnection.createClient({ product: 'DB', mode: 'mock', dbType: 'sqlserver' });
      expect(client).toBeInstanceOf(InforDbAdapter);
    });

    it('should throw for unknown product', () => {
      expect(() => InforConnection.createClient({ product: 'fake' })).toThrow(InforError);
    });

    it('should pass config through to client', () => {
      const client = InforConnection.createClient({
        product: 'ION',
        mode: 'mock',
        baseUrl: 'https://ion.example.com',
        tenant: 'MY_TENANT',
      });
      expect(client.baseUrl).toBe('https://ion.example.com');
      expect(client.tenant).toBe('MY_TENANT');
    });
  });

  // ── healthCheck ───────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return healthy when all clients pass', async () => {
      const ionClient = new IONClient({ mode: 'mock' });
      const m3Client = new M3ApiClient({ mode: 'mock' });

      const result = await InforConnection.healthCheck([ionClient, m3Client]);
      expect(result.overall).toBe('healthy');
      expect(result.results).toHaveLength(2);
      expect(result.results[0].ok).toBe(true);
      expect(result.results[1].ok).toBe(true);
    });

    it('should return unhealthy when no clients provided', async () => {
      const result = await InforConnection.healthCheck([]);
      expect(result.overall).toBe('unhealthy');
      expect(result.results).toHaveLength(0);
    });

    it('should include timestamp', async () => {
      const result = await InforConnection.healthCheck([]);
      expect(result.timestamp).toBeDefined();
    });

    it('should accept a single client (not array)', async () => {
      const ionClient = new IONClient({ mode: 'mock' });
      const result = await InforConnection.healthCheck(ionClient);
      expect(result.overall).toBe('healthy');
      expect(result.results).toHaveLength(1);
    });
  });

  // ── getSupportedProducts ──────────────────────────────────────

  describe('getSupportedProducts', () => {
    it('should return list of supported products', () => {
      const products = InforConnection.getSupportedProducts();
      expect(products).toContain('LN');
      expect(products).toContain('M3');
      expect(products).toContain('CSI');
      expect(products).toContain('LAWSON');
    });
  });
});
