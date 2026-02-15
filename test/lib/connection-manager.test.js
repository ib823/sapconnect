/**
 * Tests for ConnectionManager — multi-source connection orchestration.
 */

const { ConnectionManager } = require('../../lib/connection-manager');

describe('ConnectionManager', () => {
  let mgr;

  beforeEach(() => {
    mgr = new ConnectionManager();
  });

  describe('addProfile / listProfiles', () => {
    it('should add and list profiles', () => {
      mgr.addProfile('source', { baseUrl: 'https://source.sap.com' });
      mgr.addProfile('target', { baseUrl: 'https://target.sap.com' });

      expect(mgr.listProfiles()).toEqual(['source', 'target']);
      expect(mgr.profileCount).toBe(2);
    });

    it('should overwrite existing profile', () => {
      mgr.addProfile('source', { baseUrl: 'https://old.sap.com' });
      mgr.addProfile('source', { baseUrl: 'https://new.sap.com' });
      expect(mgr.profileCount).toBe(1);
    });
  });

  describe('loadProfiles', () => {
    it('should load multiple profiles from object', () => {
      mgr.loadProfiles({
        source: { baseUrl: 'https://s1.sap.com', auth: { type: 'basic', username: 'u', password: 'p' } },
        target: { baseUrl: 'https://s2.sap.com', auth: { type: 'basic', username: 'u', password: 'p' } },
      });
      expect(mgr.profileCount).toBe(2);
      expect(mgr.has('source')).toBe(true);
      expect(mgr.has('target')).toBe(true);
    });
  });

  describe('loadFromEnv', () => {
    const envBackup = {};

    beforeEach(() => {
      // Backup and set test env vars
      const vars = {
        SAP_CONN_DEV_BASE_URL: 'https://dev.sap.com',
        SAP_CONN_DEV_USERNAME: 'devuser',
        SAP_CONN_DEV_PASSWORD: 'devpass',
        SAP_CONN_PROD_BASE_URL: 'https://prod.sap.com',
        SAP_CONN_PROD_TOKEN_URL: 'https://auth.sap.com/token',
        SAP_CONN_PROD_CLIENT_ID: 'cid',
        SAP_CONN_PROD_CLIENT_SECRET: 'csec',
      };
      for (const [k, v] of Object.entries(vars)) {
        envBackup[k] = process.env[k];
        process.env[k] = v;
      }
    });

    afterEach(() => {
      for (const [k, v] of Object.entries(envBackup)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    });

    it('should load profiles from environment variables', () => {
      const loaded = mgr.loadFromEnv();
      expect(loaded).toContain('dev');
      expect(loaded).toContain('prod');
      expect(mgr.has('dev')).toBe(true);
      expect(mgr.has('prod')).toBe(true);
    });
  });

  describe('has', () => {
    it('should return false for non-existent profile', () => {
      expect(mgr.has('missing')).toBe(false);
    });

    it('should return true for existing profile', () => {
      mgr.addProfile('test', { baseUrl: 'https://test.sap.com' });
      expect(mgr.has('test')).toBe(true);
    });
  });

  describe('get', () => {
    it('should throw for non-existent profile', () => {
      expect(() => mgr.get('missing')).toThrow('No connection profile');
    });

    it('should create and cache connection from profile', () => {
      mgr.addProfile('source', {
        baseUrl: 'https://s1.sap.com',
        auth: { type: 'basic', username: 'u', password: 'p' },
      });
      const conn1 = mgr.get('source');
      const conn2 = mgr.get('source');
      expect(conn1).toBe(conn2); // Same instance
      expect(conn1.name).toBe('source');
      expect(mgr.size).toBe(1);
    });
  });

  describe('healthCheck', () => {
    it('should return no_connections when empty', async () => {
      const health = await mgr.healthCheck();
      expect(health.overall).toBe('no_connections');
      expect(health.total).toBe(0);
    });
  });

  describe('getTelemetry', () => {
    it('should return empty telemetry when no connections', () => {
      const telemetry = mgr.getTelemetry();
      expect(telemetry).toEqual({});
    });
  });

  describe('disconnectAll', () => {
    it('should clear all connections', async () => {
      mgr.addProfile('test', {
        baseUrl: 'https://test.sap.com',
        auth: { type: 'basic', username: 'u', password: 'p' },
      });
      mgr.get('test'); // Create connection
      expect(mgr.size).toBe(1);

      await mgr.disconnectAll();
      expect(mgr.size).toBe(0);
    });
  });
});
