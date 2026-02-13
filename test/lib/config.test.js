/**
 * Tests for lib/config.js
 *
 * Covers loadConfig, validateConfig, and DEFAULTS exports.
 * Validates environment variable parsing, type coercion, and validation rules.
 */

const path = require('path');

const { loadConfig, validateConfig, DEFAULTS } = require('../../lib/config');

describe('lib/config', () => {
  // Preserve original env and restore after each test to prevent leakage
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Strip all SAP/app-related env vars so each test starts clean
    const keysToDelete = Object.keys(process.env).filter(
      (k) =>
        k.startsWith('SAP_') ||
        k.startsWith('CLOUD_ALM_') ||
        k.startsWith('MIGRATION_') ||
        k.startsWith('METRICS_') ||
        k.startsWith('HEALTH_') ||
        k.startsWith('VSP_') ||
        [
          'PORT',
          'HOST',
          'NODE_ENV',
          'LOG_LEVEL',
          'LOG_FORMAT',
          'RATE_LIMIT_WINDOW_MS',
          'RATE_LIMIT_MAX',
          'CORS_ORIGINS',
          'TRUST_PROXY',
          'CHECKPOINT_DIR',
          'APP_VERSION',
          'APP_NAME',
        ].includes(k)
    );
    for (const k of keysToDelete) {
      delete process.env[k];
    }
  });

  afterEach(() => {
    // Restore to snapshot taken before the suite
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  // ── DEFAULTS export ──────────────────────────────────────────

  describe('DEFAULTS', () => {
    it('should be a plain object with expected default values', () => {
      expect(DEFAULTS).toBeDefined();
      expect(typeof DEFAULTS).toBe('object');
      expect(DEFAULTS.PORT).toBe(4004);
      expect(DEFAULTS.HOST).toBe('0.0.0.0');
      expect(DEFAULTS.NODE_ENV).toBe('development');
      expect(DEFAULTS.LOG_LEVEL).toBe('info');
      expect(DEFAULTS.LOG_FORMAT).toBe('text');
      expect(DEFAULTS.RATE_LIMIT_WINDOW_MS).toBe(60000);
      expect(DEFAULTS.RATE_LIMIT_MAX).toBe(100);
      expect(DEFAULTS.CORS_ORIGINS).toBe('*');
      expect(DEFAULTS.TRUST_PROXY).toBe(false);
      expect(DEFAULTS.SAP_TIMEOUT).toBe(30000);
      expect(DEFAULTS.SAP_RETRIES).toBe(3);
      expect(DEFAULTS.SAP_ODATA_VERSION).toBe('v2');
      expect(DEFAULTS.MIGRATION_MODE).toBe('mock');
      expect(DEFAULTS.MIGRATION_BATCH_SIZE).toBe(500);
      expect(DEFAULTS.MIGRATION_CONCURRENCY).toBe(5);
      expect(DEFAULTS.CLOUD_ALM_MODE).toBe('mock');
      expect(DEFAULTS.METRICS_PREFIX).toBe('sapconnect');
      expect(DEFAULTS.HEALTH_TIMEOUT_MS).toBe(5000);
      expect(DEFAULTS.APP_VERSION).toBe('1.0.0');
      expect(DEFAULTS.APP_NAME).toBe('sapconnect');
    });
  });

  // ── loadConfig ───────────────────────────────────────────────

  describe('loadConfig', () => {
    it('should return default values when no env vars or overrides are set', () => {
      const config = loadConfig();

      expect(config.port).toBe(4004);
      expect(config.host).toBe('0.0.0.0');
      expect(config.nodeEnv).toBe('development');
      expect(config.logLevel).toBe('info');
      expect(config.logFormat).toBe('text');
      expect(config.rateLimitWindowMs).toBe(60000);
      expect(config.rateLimitMax).toBe(100);
      expect(config.corsOrigins).toEqual(['*']);
      expect(config.trustProxy).toBe(false);
      expect(config.sapBaseUrl).toBeNull();
      expect(config.sapUsername).toBeNull();
      expect(config.sapPassword).toBeNull();
      expect(config.sapClient).toBeNull();
      expect(config.sapTimeout).toBe(30000);
      expect(config.sapRetries).toBe(3);
      expect(config.sapODataVersion).toBe('v2');
      expect(config.sapRfcAshost).toBeNull();
      expect(config.sapRfcSysnr).toBeNull();
      expect(config.sapRfcSapRouter).toBeNull();
      expect(config.migrationMode).toBe('mock');
      expect(config.checkpointDir).toBe(
        path.join(process.cwd(), '.sapconnect-checkpoints')
      );
      expect(config.migrationBatchSize).toBe(500);
      expect(config.migrationConcurrency).toBe(5);
      expect(config.cloudAlmMode).toBe('mock');
      expect(config.cloudAlmBaseUrl).toBeNull();
      expect(config.cloudAlmTokenUrl).toBeNull();
      expect(config.cloudAlmClientId).toBeNull();
      expect(config.cloudAlmClientSecret).toBeNull();
      expect(config.metricsPrefix).toBe('sapconnect');
      expect(config.healthTimeoutMs).toBe(5000);
      expect(config.appVersion).toBe('1.0.0');
      expect(config.appName).toBe('sapconnect');
      expect(config.vspPath).toBeNull();
      expect(config.vspSystem).toBeNull();
    });

    it('should pick up values from process.env', () => {
      process.env.PORT = '9090';
      process.env.HOST = '127.0.0.1';
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'debug';
      process.env.SAP_BASE_URL = 'https://sap.example.com';
      process.env.SAP_USERNAME = 'admin';
      process.env.SAP_PASSWORD = 'secret';

      const config = loadConfig();

      expect(config.port).toBe(9090);
      expect(config.host).toBe('127.0.0.1');
      expect(config.nodeEnv).toBe('production');
      expect(config.logLevel).toBe('debug');
      expect(config.sapBaseUrl).toBe('https://sap.example.com');
      expect(config.sapUsername).toBe('admin');
      expect(config.sapPassword).toBe('secret');
    });

    it('should apply explicit overrides over both defaults and env vars', () => {
      process.env.PORT = '8080';
      process.env.LOG_LEVEL = 'warn';

      const config = loadConfig({
        PORT: '3000',
        LOG_LEVEL: 'error',
        SAP_BASE_URL: 'https://override.sap.com',
      });

      expect(config.port).toBe(3000);
      expect(config.logLevel).toBe('error');
      expect(config.sapBaseUrl).toBe('https://override.sap.com');
    });

    it('should parse integer values from string env vars', () => {
      const config = loadConfig({
        PORT: '8888',
        SAP_TIMEOUT: '60000',
        SAP_RETRIES: '5',
        RATE_LIMIT_WINDOW_MS: '120000',
        RATE_LIMIT_MAX: '50',
        MIGRATION_BATCH_SIZE: '1000',
        MIGRATION_CONCURRENCY: '10',
        HEALTH_TIMEOUT_MS: '3000',
      });

      expect(config.port).toBe(8888);
      expect(config.sapTimeout).toBe(60000);
      expect(config.sapRetries).toBe(5);
      expect(config.rateLimitWindowMs).toBe(120000);
      expect(config.rateLimitMax).toBe(50);
      expect(config.migrationBatchSize).toBe(1000);
      expect(config.migrationConcurrency).toBe(10);
      expect(config.healthTimeoutMs).toBe(3000);
    });

    it('should fall back to default when int value is non-numeric', () => {
      const config = loadConfig({ PORT: 'abc', SAP_TIMEOUT: 'xyz' });

      expect(config.port).toBe(DEFAULTS.PORT);
      expect(config.sapTimeout).toBe(DEFAULTS.SAP_TIMEOUT);
    });

    it('should parse TRUST_PROXY=true as boolean true', () => {
      const config = loadConfig({ TRUST_PROXY: 'true' });
      expect(config.trustProxy).toBe(true);
    });

    it('should parse TRUST_PROXY=1 as boolean true', () => {
      const config = loadConfig({ TRUST_PROXY: '1' });
      expect(config.trustProxy).toBe(true);
    });

    it('should parse TRUST_PROXY=false as boolean false', () => {
      const config = loadConfig({ TRUST_PROXY: 'false' });
      expect(config.trustProxy).toBe(false);
    });

    it('should parse comma-separated CORS_ORIGINS into an array', () => {
      const config = loadConfig({ CORS_ORIGINS: 'a.com,b.com,c.com' });
      expect(config.corsOrigins).toEqual(['a.com', 'b.com', 'c.com']);
    });

    it('should trim whitespace in CORS_ORIGINS entries', () => {
      const config = loadConfig({ CORS_ORIGINS: ' a.com , b.com , c.com ' });
      expect(config.corsOrigins).toEqual(['a.com', 'b.com', 'c.com']);
    });

    it('should set isProduction=true when NODE_ENV=production', () => {
      const config = loadConfig({ NODE_ENV: 'production' });
      expect(config.isProduction).toBe(true);
      expect(config.isDevelopment).toBe(false);
      expect(config.isTest).toBe(false);
    });

    it('should set isDevelopment=true when NODE_ENV=development', () => {
      const config = loadConfig({ NODE_ENV: 'development' });
      expect(config.isProduction).toBe(false);
      expect(config.isDevelopment).toBe(true);
      expect(config.isTest).toBe(false);
    });

    it('should set isTest=true when NODE_ENV=test', () => {
      const config = loadConfig({ NODE_ENV: 'test' });
      expect(config.isProduction).toBe(false);
      expect(config.isDevelopment).toBe(false);
      expect(config.isTest).toBe(true);
    });

    it('should load VSP fields from overrides', () => {
      const config = loadConfig({
        VSP_PATH: '/usr/local/vsp',
        VSP_SYSTEM: 'DEV',
      });
      expect(config.vspPath).toBe('/usr/local/vsp');
      expect(config.vspSystem).toBe('DEV');
    });
  });

  // ── validateConfig ───────────────────────────────────────────

  describe('validateConfig', () => {
    it('should pass in mock mode with default config', () => {
      const config = loadConfig();
      const result = validateConfig(config, 'mock');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail in live mode when SAP_BASE_URL is missing', () => {
      const config = loadConfig();
      const result = validateConfig(config, 'live');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('SAP_BASE_URL is required for live mode');
    });

    it('should fail in live mode when SAP_USERNAME is missing', () => {
      const config = loadConfig({ SAP_BASE_URL: 'https://sap.example.com' });
      const result = validateConfig(config, 'live');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('SAP_USERNAME is required for live mode');
    });

    it('should fail in live mode when SAP_PASSWORD is missing', () => {
      const config = loadConfig({
        SAP_BASE_URL: 'https://sap.example.com',
        SAP_USERNAME: 'admin',
      });
      const result = validateConfig(config, 'live');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('SAP_PASSWORD is required for live mode');
    });

    it('should pass in live mode with all required SAP fields', () => {
      const config = loadConfig({
        SAP_BASE_URL: 'https://sap.example.com',
        SAP_USERNAME: 'admin',
        SAP_PASSWORD: 'secret',
      });
      const result = validateConfig(config, 'live');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when cloudAlmMode=live and Cloud ALM fields are missing', () => {
      const config = loadConfig({ CLOUD_ALM_MODE: 'live' });
      const result = validateConfig(config, 'mock');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('CLOUD_ALM_BASE_URL is required for live Cloud ALM');
      expect(result.errors).toContain('CLOUD_ALM_TOKEN_URL is required for live Cloud ALM');
      expect(result.errors).toContain('CLOUD_ALM_CLIENT_ID is required for live Cloud ALM');
      expect(result.errors).toContain('CLOUD_ALM_CLIENT_SECRET is required for live Cloud ALM');
    });

    it('should pass when cloudAlmMode=live and all Cloud ALM fields are provided', () => {
      const config = loadConfig({
        CLOUD_ALM_MODE: 'live',
        CLOUD_ALM_BASE_URL: 'https://alm.example.com',
        CLOUD_ALM_TOKEN_URL: 'https://alm.example.com/token',
        CLOUD_ALM_CLIENT_ID: 'client-123',
        CLOUD_ALM_CLIENT_SECRET: 'secret-456',
      });
      const result = validateConfig(config, 'mock');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when PORT is below 1', () => {
      const config = loadConfig();
      config.port = 0;
      const result = validateConfig(config, 'mock');

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid PORT'))).toBe(true);
    });

    it('should fail when PORT is above 65535', () => {
      const config = loadConfig();
      config.port = 70000;
      const result = validateConfig(config, 'mock');

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid PORT'))).toBe(true);
    });

    it('should fail when LOG_LEVEL is invalid', () => {
      const config = loadConfig();
      config.logLevel = 'verbose';
      const result = validateConfig(config, 'mock');

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid LOG_LEVEL'))).toBe(true);
    });

    it('should accept all valid LOG_LEVEL values', () => {
      for (const level of ['debug', 'info', 'warn', 'error']) {
        const config = loadConfig();
        config.logLevel = level;
        const result = validateConfig(config, 'mock');
        expect(result.valid).toBe(true);
      }
    });

    it('should default to mock mode when mode parameter is omitted', () => {
      const config = loadConfig();
      const result = validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accumulate multiple errors at once', () => {
      const config = loadConfig({ CLOUD_ALM_MODE: 'live' });
      config.port = -1;
      config.logLevel = 'trace';
      const result = validateConfig(config, 'live');

      // Should have PORT, LOG_LEVEL, SAP_*, and CLOUD_ALM_* errors
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });
});
