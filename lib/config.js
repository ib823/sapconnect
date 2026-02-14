/**
 * Centralized Configuration
 *
 * Single source of truth for all environment-driven configuration.
 * Validates required values and provides typed defaults.
 */

const path = require('path');

const DEFAULTS = {
  // Server
  PORT: 4004,
  HOST: '0.0.0.0',
  NODE_ENV: 'development',

  // Logging
  LOG_LEVEL: 'info',
  LOG_FORMAT: 'text',

  // Security
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX: 100,
  CORS_ORIGINS: '*',
  TRUST_PROXY: false,

  // SAP Connection
  SAP_TIMEOUT: 30000,
  SAP_RETRIES: 3,
  SAP_ODATA_VERSION: 'v2',

  // Migration
  MIGRATION_MODE: 'mock',
  CHECKPOINT_DIR: path.join(process.cwd(), '.sapconnect-checkpoints'),
  MIGRATION_BATCH_SIZE: 500,
  MIGRATION_CONCURRENCY: 5,

  // Cloud ALM
  CLOUD_ALM_MODE: 'mock',

  // Monitoring
  METRICS_PREFIX: 'sapconnect',
  HEALTH_TIMEOUT_MS: 5000,

  // App
  APP_VERSION: '1.0.0',
  APP_NAME: 'sapconnect',
};

/**
 * Load configuration from environment variables with defaults.
 * @param {object} [overrides] - Optional overrides (useful for testing)
 * @returns {object} Validated configuration
 */
function loadConfig(overrides = {}) {
  const env = { ...process.env, ...overrides };

  const config = {
    // Server
    port: _int(env.PORT, DEFAULTS.PORT),
    host: env.HOST || DEFAULTS.HOST,
    nodeEnv: env.NODE_ENV || DEFAULTS.NODE_ENV,
    isProduction: (env.NODE_ENV || DEFAULTS.NODE_ENV) === 'production',
    isDevelopment: (env.NODE_ENV || DEFAULTS.NODE_ENV) === 'development',
    isTest: (env.NODE_ENV || DEFAULTS.NODE_ENV) === 'test',

    // Logging
    logLevel: env.LOG_LEVEL || DEFAULTS.LOG_LEVEL,
    logFormat: env.LOG_FORMAT || DEFAULTS.LOG_FORMAT,

    // Security
    rateLimitWindowMs: _int(env.RATE_LIMIT_WINDOW_MS, DEFAULTS.RATE_LIMIT_WINDOW_MS),
    rateLimitMax: _int(env.RATE_LIMIT_MAX, DEFAULTS.RATE_LIMIT_MAX),
    corsOrigins: _list(env.CORS_ORIGINS, [DEFAULTS.CORS_ORIGINS]),
    trustProxy: _bool(env.TRUST_PROXY, DEFAULTS.TRUST_PROXY),

    // SAP Connection
    sapBaseUrl: env.SAP_BASE_URL || null,
    sapUsername: env.SAP_USERNAME || null,
    sapPassword: env.SAP_PASSWORD || null,
    sapClient: env.SAP_CLIENT || null,
    sapTimeout: _int(env.SAP_TIMEOUT, DEFAULTS.SAP_TIMEOUT),
    sapRetries: _int(env.SAP_RETRIES, DEFAULTS.SAP_RETRIES),
    sapODataVersion: env.SAP_ODATA_VERSION || DEFAULTS.SAP_ODATA_VERSION,

    // RFC (optional — direct connection)
    sapRfcAshost: env.SAP_RFC_ASHOST || null,
    sapRfcSysnr: env.SAP_RFC_SYSNR || null,
    sapRfcSapRouter: env.SAP_RFC_SAPROUTER || null,

    // RFC (optional — load-balanced connection)
    sapRfcMshost: env.SAP_RFC_MSHOST || null,
    sapRfcMsserv: env.SAP_RFC_MSSERV || null,
    sapRfcGroup: env.SAP_RFC_GROUP || null,
    sapRfcR3name: env.SAP_RFC_R3NAME || null,

    // Migration
    migrationMode: env.MIGRATION_MODE || DEFAULTS.MIGRATION_MODE,
    checkpointDir: env.CHECKPOINT_DIR || DEFAULTS.CHECKPOINT_DIR,
    migrationBatchSize: _int(env.MIGRATION_BATCH_SIZE, DEFAULTS.MIGRATION_BATCH_SIZE),
    migrationConcurrency: _int(env.MIGRATION_CONCURRENCY, DEFAULTS.MIGRATION_CONCURRENCY),

    // Cloud ALM
    cloudAlmMode: env.CLOUD_ALM_MODE || DEFAULTS.CLOUD_ALM_MODE,
    cloudAlmBaseUrl: env.CLOUD_ALM_BASE_URL || null,
    cloudAlmTokenUrl: env.CLOUD_ALM_TOKEN_URL || null,
    cloudAlmClientId: env.CLOUD_ALM_CLIENT_ID || null,
    cloudAlmClientSecret: env.CLOUD_ALM_CLIENT_SECRET || null,

    // Monitoring
    metricsPrefix: env.METRICS_PREFIX || DEFAULTS.METRICS_PREFIX,
    healthTimeoutMs: _int(env.HEALTH_TIMEOUT_MS, DEFAULTS.HEALTH_TIMEOUT_MS),

    // Authentication
    apiKey: env.API_KEY || null,

    // App
    appVersion: env.APP_VERSION || DEFAULTS.APP_VERSION,
    appName: env.APP_NAME || DEFAULTS.APP_NAME,

    // VSP (vibing-steampunk)
    vspPath: env.VSP_PATH || null,
    vspSystem: env.VSP_SYSTEM || null,
  };

  return config;
}

/**
 * Validate that required configuration for a specific mode is present.
 * @param {object} config - Config from loadConfig()
 * @param {'live'|'mock'} mode - Operating mode
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateConfig(config, mode = 'mock') {
  const errors = [];

  if (config.port < 1 || config.port > 65535) {
    errors.push(`Invalid PORT: ${config.port}`);
  }

  if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
    errors.push(`Invalid LOG_LEVEL: ${config.logLevel}`);
  }

  if (mode === 'live') {
    if (!config.sapBaseUrl) errors.push('SAP_BASE_URL is required for live mode');
    if (!config.sapUsername) errors.push('SAP_USERNAME is required for live mode');
    if (!config.sapPassword) errors.push('SAP_PASSWORD is required for live mode');
  }

  if (config.cloudAlmMode === 'live') {
    if (!config.cloudAlmBaseUrl) errors.push('CLOUD_ALM_BASE_URL is required for live Cloud ALM');
    if (!config.cloudAlmTokenUrl) errors.push('CLOUD_ALM_TOKEN_URL is required for live Cloud ALM');
    if (!config.cloudAlmClientId) errors.push('CLOUD_ALM_CLIENT_ID is required for live Cloud ALM');
    if (!config.cloudAlmClientSecret) errors.push('CLOUD_ALM_CLIENT_SECRET is required for live Cloud ALM');
  }

  return { valid: errors.length === 0, errors };
}

// ── Helpers ──────────────────────────────────────────────────

function _int(val, fallback) {
  if (val === undefined || val === null || val === '') return fallback;
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

function _bool(val, fallback) {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'boolean') return val;
  return val === 'true' || val === '1';
}

function _list(val, fallback) {
  if (val === undefined || val === null || val === '') return fallback;
  if (Array.isArray(val)) return val;
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

module.exports = { loadConfig, validateConfig, DEFAULTS };
