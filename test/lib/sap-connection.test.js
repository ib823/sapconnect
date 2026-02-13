const SapConnection = require('../../lib/sap-connection');
const { ConnectionError } = require('../../lib/errors');
const path = require('path');
const fs = require('fs');
const os = require('os');

describe('SapConnection', () => {
  describe('fromEnv()', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('should create connection from basic auth env vars', () => {
      process.env.SAP_BASE_URL = 'https://sap.example.com:44300';
      process.env.SAP_USERNAME = 'TEST_USER';
      process.env.SAP_PASSWORD = 'TEST_PASS';

      const conn = SapConnection.fromEnv();

      expect(conn.baseUrl).toBe('https://sap.example.com:44300');
      expect(conn.name).toBe('env');
      expect(conn.version).toBe('v2');
      expect(conn.authProvider).toBeDefined();
    });

    it('should create connection from OAuth2 env vars', () => {
      process.env.SAP_BASE_URL = 'https://s4.cloud.sap';
      process.env.SAP_TOKEN_URL = 'https://auth.cloud.sap/oauth/token';
      process.env.SAP_CLIENT_ID = 'cid';
      process.env.SAP_CLIENT_SECRET = 'csec';

      const conn = SapConnection.fromEnv();

      expect(conn.baseUrl).toBe('https://s4.cloud.sap');
      expect(conn.authProvider).toBeDefined();
    });

    it('should respect SAP_ODATA_VERSION', () => {
      process.env.SAP_BASE_URL = 'https://sap.example.com';
      process.env.SAP_USERNAME = 'u';
      process.env.SAP_PASSWORD = 'p';
      process.env.SAP_ODATA_VERSION = 'v4';

      const conn = SapConnection.fromEnv();
      expect(conn.version).toBe('v4');
    });

    it('should throw if SAP_BASE_URL is missing', () => {
      delete process.env.SAP_BASE_URL;
      expect(() => SapConnection.fromEnv()).toThrow(ConnectionError);
      expect(() => SapConnection.fromEnv()).toThrow('SAP_BASE_URL');
    });

    it('should throw if no auth credentials', () => {
      process.env.SAP_BASE_URL = 'https://sap.example.com';
      delete process.env.SAP_USERNAME;
      delete process.env.SAP_PASSWORD;
      delete process.env.SAP_TOKEN_URL;

      expect(() => SapConnection.fromEnv()).toThrow(ConnectionError);
    });
  });

  describe('fromConfig()', () => {
    let tmpDir;
    let configPath;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sapconn-'));
      configPath = path.join(tmpDir, '.sapconnect.json');
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should create connection from config file (basic auth)', () => {
      const config = {
        source: {
          baseUrl: 'https://ecc.example.com:44300',
          auth: { type: 'basic', username: 'USER', password: 'PASS' },
        },
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const conn = SapConnection.fromConfig(configPath, 'source');

      expect(conn.baseUrl).toBe('https://ecc.example.com:44300');
      expect(conn.name).toBe('source');
    });

    it('should create connection from config file (oauth2)', () => {
      const config = {
        target: {
          baseUrl: 'https://s4.cloud.sap',
          odataVersion: 'v4',
          auth: {
            type: 'oauth2',
            tokenUrl: 'https://auth.cloud.sap/token',
            clientId: 'cid',
            clientSecret: 'csec',
          },
        },
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const conn = SapConnection.fromConfig(configPath, 'target');

      expect(conn.baseUrl).toBe('https://s4.cloud.sap');
      expect(conn.version).toBe('v4');
    });

    it('should support username/password at top level of connection block', () => {
      const config = {
        source: {
          baseUrl: 'https://ecc.example.com',
          username: 'USER',
          password: 'PASS',
        },
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const conn = SapConnection.fromConfig(configPath, 'source');
      expect(conn.baseUrl).toBe('https://ecc.example.com');
    });

    it('should throw on missing config file', () => {
      expect(() => SapConnection.fromConfig('/nonexistent/.sapconnect.json'))
        .toThrow(ConnectionError);
    });

    it('should throw on missing connection name', () => {
      const config = { source: { baseUrl: 'https://x', auth: { type: 'basic', username: 'u', password: 'p' } } };
      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(() => SapConnection.fromConfig(configPath, 'target'))
        .toThrow(/Connection "target" not found/);
    });

    it('should throw on missing auth in connection', () => {
      const config = { source: { baseUrl: 'https://x' } };
      fs.writeFileSync(configPath, JSON.stringify(config));

      expect(() => SapConnection.fromConfig(configPath, 'source'))
        .toThrow(ConnectionError);
    });
  });

  describe('connect()', () => {
    it('should return an OData client', async () => {
      const conn = new SapConnection({
        baseUrl: 'https://sap.example.com',
        authProvider: { getHeaders: async () => ({}), getAgent: () => null },
      });

      const client = await conn.connect();
      expect(client).toBeDefined();
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
    });
  });

  describe('testConnection()', () => {
    it('should return ok:false when fetch fails', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      try {
        const conn = new SapConnection({
          baseUrl: 'https://sap.example.com',
          authProvider: { getHeaders: async () => ({}), getAgent: () => null },
          timeout: 1000,
          retries: 0,
        });

        const result = await conn.testConnection();

        expect(result.ok).toBe(false);
        expect(result.latencyMs).toBeGreaterThanOrEqual(0);
        expect(result.error).toBeDefined();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should return ok:true when endpoint responds', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        text: async () => '{}',
      });

      try {
        const conn = new SapConnection({
          baseUrl: 'https://sap.example.com',
          authProvider: { getHeaders: async () => ({}), getAgent: () => null },
        });

        const result = await conn.testConnection();

        expect(result.ok).toBe(true);
        expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('getClient()', () => {
    it('should auto-connect if not yet connected', async () => {
      const conn = new SapConnection({
        baseUrl: 'https://sap.example.com',
        authProvider: { getHeaders: async () => ({}), getAgent: () => null },
      });

      const client = await conn.getClient();
      expect(client).toBeDefined();
    });
  });
});
