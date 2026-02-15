'use strict';

/**
 * Infor Connectivity Module -- Central Exports
 *
 * Provides clients for all Infor product lines:
 *
 *   ION API Gateway     — OAuth2-authenticated access to Infor OS services and BODs
 *   M3 MI Programs      — REST client for Infor M3 MI transactions
 *   CSI IDO             — REST/SOAP client for CloudSuite Industrial / SyteLine IDOs
 *   Lawson Landmark     — REST client for Infor Lawson Landmark APIs and PFI
 *   Database Adapter    — Read-only SQL adapter supporting SQL Server, Oracle, DB2, PostgreSQL
 *   Source Adapters     — Product-specific adapters (LN, M3, CSI, Lawson) with unified API
 *   Auth Providers      — ION OAuth2 and Basic authentication
 *   Connection Factory  — Environment-driven or config-driven client creation
 *
 * Quick start:
 *   const { InforConnection, LNAdapter, M3Adapter } = require('./lib/infor');
 *
 *   // From environment variables
 *   const conn = InforConnection.fromEnv();
 *
 *   // From explicit config
 *   const client = InforConnection.createClient({ product: 'M3', mode: 'mock' });
 *
 *   // Direct adapter usage
 *   const adapter = new M3Adapter({ mode: 'mock' });
 *   await adapter.connect();
 *   const items = await adapter.readTable('MITMAS');
 */

// ── Core Clients ─────────────────────────────────────────────────

const IONClient = require('./ion-client');
const M3ApiClient = require('./m3-api-client');
const IDOClient = require('./ido-client');
const LandmarkClient = require('./landmark-client');
const InforDbAdapter = require('./db-adapter');

// ── Connection Factory ───────────────────────────────────────────

const InforConnection = require('./infor-connection');

// ── Base Adapter ─────────────────────────────────────────────────

const SourceAdapter = require('./source-adapter');

// ── Authentication Providers ─────────────────────────────────────

const IONOAuth2Provider = require('./auth/ion-oauth2-provider');
const InforBasicAuthProvider = require('./auth/basic-provider');

// ── Product-Specific Adapters ────────────────────────────────────

const LNAdapter = require('./adapters/ln-adapter');
const M3Adapter = require('./adapters/m3-adapter');
const CSIAdapter = require('./adapters/csi-adapter');
const LawsonAdapter = require('./adapters/lawson-adapter');

// ── Convenience: Adapter Map ─────────────────────────────────────

/**
 * Map of product keys to their adapter classes.
 * @type {Object<string, typeof SourceAdapter>}
 */
const ADAPTER_MAP = {
  LN: LNAdapter,
  M3: M3Adapter,
  CSI: CSIAdapter,
  LAWSON: LawsonAdapter,
};

/**
 * Map of product keys to their API client classes.
 * @type {Object<string, Function>}
 */
const CLIENT_MAP = {
  ION: IONClient,
  M3: M3ApiClient,
  CSI: IDOClient,
  LAWSON: LandmarkClient,
  DB: InforDbAdapter,
};

/**
 * Create a product-specific adapter by product name.
 *
 * @param {string} product - Product key: 'LN', 'M3', 'CSI', 'LAWSON'
 * @param {object} [config={}] - Adapter configuration
 * @returns {SourceAdapter} Product adapter instance
 * @throws {Error} If product is not recognized
 */
function createAdapter(product, config = {}) {
  const key = (product || '').toUpperCase();
  const AdapterClass = ADAPTER_MAP[key];
  if (!AdapterClass) {
    const supported = Object.keys(ADAPTER_MAP).join(', ');
    throw new Error(`Unknown Infor product: "${product}". Supported: ${supported}`);
  }
  return new AdapterClass(config);
}

/**
 * Get the list of supported Infor products.
 * @returns {string[]}
 */
function getSupportedProducts() {
  return Object.keys(ADAPTER_MAP);
}

// ── Module Exports ───────────────────────────────────────────────

module.exports = {
  // Core clients
  IONClient,
  M3ApiClient,
  IDOClient,
  LandmarkClient,
  InforDbAdapter,

  // Connection factory
  InforConnection,

  // Base adapter
  SourceAdapter,

  // Auth providers
  IONOAuth2Provider,
  InforBasicAuthProvider,
  BasicProvider: InforBasicAuthProvider, // backward-compatible alias

  // Product adapters
  LNAdapter,
  M3Adapter,
  CSIAdapter,
  LawsonAdapter,

  // Maps and helpers
  ADAPTER_MAP,
  CLIENT_MAP,
  createAdapter,
  getSupportedProducts,
};
