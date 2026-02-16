/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
'use strict';

/**
 * Infor Connection Factory
 *
 * Central factory for creating Infor product clients based on configuration
 * or environment variables. Supports all four Infor products (LN, M3, CSI,
 * Lawson) plus ION API Gateway and direct database access.
 *
 * Usage:
 *   const client = InforConnection.fromEnv();         // from env vars
 *   const client = InforConnection.createClient(cfg); // from explicit config
 *
 * Environment variables:
 *   INFOR_PRODUCT           - Product type: LN, M3, CSI, LAWSON
 *   INFOR_ION_BASE_URL      - ION API Gateway base URL
 *   INFOR_ION_TOKEN_URL     - ION OAuth2 token endpoint
 *   INFOR_ION_CLIENT_ID     - ION OAuth2 client ID
 *   INFOR_ION_CLIENT_SECRET - ION OAuth2 client secret
 *   INFOR_TENANT            - Infor tenant identifier
 *   INFOR_DB_TYPE           - Database type: oracle, sqlserver, db2, postgres
 *   INFOR_DB_CONNECTION     - Database connection string
 *   INFOR_DB_HOST           - Database host
 *   INFOR_DB_PORT           - Database port
 *   INFOR_DB_NAME           - Database name
 *   INFOR_USERNAME          - Username (for basic auth or DB)
 *   INFOR_PASSWORD          - Password (for basic auth or DB)
 *   INFOR_MODE              - Operation mode: 'live' or 'mock'
 */

const Logger = require('../logger');
const { InforError } = require('../errors');
const IONClient = require('./ion-client');
const M3ApiClient = require('./m3-api-client');
const IDOClient = require('./ido-client');
const LandmarkClient = require('./landmark-client');
const InforDbAdapter = require('./db-adapter');
const IONOAuth2Provider = require('./auth/ion-oauth2-provider');
const InforBasicAuthProvider = require('./auth/basic-provider');

/** Supported Infor products */
const SUPPORTED_PRODUCTS = ['LN', 'M3', 'CSI', 'LAWSON'];

class InforConnection {
  /**
   * Create an Infor client setup from environment variables.
   *
   * Reads INFOR_PRODUCT to determine which product to connect to, then
   * creates the appropriate ION + product client combination.
   *
   * @param {object} [env] - Override environment (defaults to process.env)
   * @returns {{ ion: IONClient|null, product: object|null, db: InforDbAdapter|null, productType: string }}
   */
  static fromEnv(env) {
    const e = env || process.env;
    const productType = (e.INFOR_PRODUCT || '').toUpperCase();

    if (!productType || !SUPPORTED_PRODUCTS.includes(productType)) {
      throw new InforError(
        `Unknown or missing INFOR_PRODUCT: "${productType}". Supported: ${SUPPORTED_PRODUCTS.join(', ')}`,
        { product: productType, supported: SUPPORTED_PRODUCTS }
      );
    }

    const mode = e.INFOR_MODE || 'mock';
    const tenant = e.INFOR_TENANT || '';
    const log = new Logger('infor-connection');

    // Create ION client if ION credentials are provided
    let ion = null;
    const ionBaseUrl = e.INFOR_ION_BASE_URL || '';
    const ionTokenUrl = e.INFOR_ION_TOKEN_URL || '';
    const ionClientId = e.INFOR_ION_CLIENT_ID || '';
    const ionClientSecret = e.INFOR_ION_CLIENT_SECRET || '';

    if (ionBaseUrl || mode === 'mock') {
      ion = new IONClient({
        baseUrl: ionBaseUrl,
        tokenUrl: ionTokenUrl,
        clientId: ionClientId,
        clientSecret: ionClientSecret,
        tenant,
        mode,
        logger: log.child('ion'),
      });
    }

    // Create auth provider based on available credentials
    let authProvider = null;
    if (ionTokenUrl && ionClientId && ionClientSecret) {
      authProvider = new IONOAuth2Provider({
        tokenUrl: ionTokenUrl,
        clientId: ionClientId,
        clientSecret: ionClientSecret,
        tenant,
        mode,
        logger: log.child('auth'),
      });
    } else if (e.INFOR_USERNAME && e.INFOR_PASSWORD) {
      authProvider = new InforBasicAuthProvider({
        username: e.INFOR_USERNAME,
        password: e.INFOR_PASSWORD,
        mode,
        logger: log.child('auth'),
      });
    }

    // Create database adapter if DB config is provided
    let db = null;
    const dbType = e.INFOR_DB_TYPE || '';
    if (dbType || e.INFOR_DB_CONNECTION || e.INFOR_DB_HOST) {
      db = new InforDbAdapter({
        type: dbType || 'sqlserver',
        connectionString: e.INFOR_DB_CONNECTION || '',
        host: e.INFOR_DB_HOST || '',
        port: parseInt(e.INFOR_DB_PORT || '0', 10),
        database: e.INFOR_DB_NAME || '',
        username: e.INFOR_USERNAME || '',
        password: e.INFOR_PASSWORD || '',
        mode,
        logger: log.child('db'),
      });
    }

    // Create product-specific client
    let product = null;
    const productBaseUrl = e.INFOR_ION_BASE_URL || '';

    switch (productType) {
      case 'M3':
        product = new M3ApiClient({
          baseUrl: productBaseUrl,
          auth: authProvider,
          tenant,
          mode,
          company: e.INFOR_M3_COMPANY || '',
          division: e.INFOR_M3_DIVISION || '',
          logger: log.child('m3'),
        });
        break;

      case 'CSI':
        product = new IDOClient({
          baseUrl: e.INFOR_CSI_BASE_URL || productBaseUrl,
          auth: authProvider,
          configId: e.INFOR_CSI_CONFIG_ID || '',
          mode,
          logger: log.child('csi'),
        });
        break;

      case 'LAWSON':
        product = new LandmarkClient({
          baseUrl: e.INFOR_LAWSON_BASE_URL || productBaseUrl,
          auth: authProvider,
          dataArea: e.INFOR_LAWSON_DATA_AREA || '',
          tenant,
          mode,
          logger: log.child('lawson'),
        });
        break;

      case 'LN':
        // LN primarily uses ION + DB; no separate product client
        // The LNAdapter combines these at the adapter level
        product = ion;
        break;
    }

    log.info(`Infor connection created for ${productType}`, {
      product: productType,
      mode,
      hasIon: !!ion,
      hasProduct: !!product,
      hasDb: !!db,
      tenant,
    });

    return {
      ion,
      product,
      db,
      productType,
      mode,
      tenant,
    };
  }

  /**
   * Create an Infor client from an explicit configuration object.
   *
   * @param {object} config
   * @param {string} config.product - Product type: 'LN', 'M3', 'CSI', 'LAWSON', 'ION', 'DB'
   * @param {string} [config.mode='mock'] - 'live' or 'mock'
   * @param {string} [config.baseUrl] - API base URL
   * @param {string} [config.tokenUrl] - OAuth2 token URL
   * @param {string} [config.clientId] - OAuth2 client ID
   * @param {string} [config.clientSecret] - OAuth2 client secret
   * @param {string} [config.tenant] - Tenant identifier
   * @param {string} [config.username] - Username for basic auth
   * @param {string} [config.password] - Password for basic auth
   * @param {object} [config.db] - Database configuration
   * @returns {object} The appropriate Infor client instance
   */
  static createClient(config = {}) {
    const product = (config.product || '').toUpperCase();
    const mode = config.mode || 'mock';
    const log = new Logger('infor-connection');

    switch (product) {
      case 'ION':
        return new IONClient({
          baseUrl: config.baseUrl,
          tokenUrl: config.tokenUrl,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          tenant: config.tenant,
          mode,
          logger: log.child('ion'),
        });

      case 'M3':
        return new M3ApiClient({
          baseUrl: config.baseUrl,
          auth: InforConnection._buildAuth(config),
          tenant: config.tenant,
          company: config.company,
          division: config.division,
          mode,
          logger: log.child('m3'),
        });

      case 'CSI':
        return new IDOClient({
          baseUrl: config.baseUrl,
          auth: InforConnection._buildAuth(config),
          configId: config.configId,
          mode,
          logger: log.child('csi'),
        });

      case 'LAWSON':
        return new LandmarkClient({
          baseUrl: config.baseUrl,
          auth: InforConnection._buildAuth(config),
          dataArea: config.dataArea,
          tenant: config.tenant,
          mode,
          logger: log.child('lawson'),
        });

      case 'LN':
        return new IONClient({
          baseUrl: config.baseUrl,
          tokenUrl: config.tokenUrl,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          tenant: config.tenant,
          mode,
          logger: log.child('ln-ion'),
        });

      case 'DB':
        return new InforDbAdapter({
          type: config.dbType || config.type || 'sqlserver',
          connectionString: config.connectionString,
          host: config.host,
          port: config.port,
          database: config.database,
          username: config.username,
          password: config.password,
          mode,
          logger: log.child('db'),
        });

      default:
        throw new InforError(
          `Unknown product: "${config.product}". Supported: ${SUPPORTED_PRODUCTS.join(', ')}, ION, DB`,
          { product: config.product }
        );
    }
  }

  /**
   * Health check across one or more Infor clients.
   *
   * @param {object|object[]} clients - Single client or array of clients with healthCheck() methods
   * @returns {Promise<{ overall: string, results: object[], timestamp: string }>}
   */
  static async healthCheck(clients) {
    const clientList = Array.isArray(clients) ? clients : [clients];
    const results = [];

    for (const client of clientList) {
      if (client && typeof client.healthCheck === 'function') {
        try {
          const result = await client.healthCheck();
          results.push(result);
        } catch (err) {
          results.push({ ok: false, error: err.message });
        }
      }
    }

    const allOk = results.length > 0 && results.every(r => r.ok);
    const anyOk = results.some(r => r.ok);

    return {
      overall: allOk ? 'healthy' : (anyOk ? 'degraded' : 'unhealthy'),
      results,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get list of supported products.
   * @returns {string[]}
   */
  static getSupportedProducts() {
    return [...SUPPORTED_PRODUCTS];
  }

  // ── Private helpers ───────────────────────────────────────────────

  /**
   * Build an auth provider from a config object.
   * @private
   */
  static _buildAuth(config) {
    if (config.tokenUrl && config.clientId && config.clientSecret) {
      return new IONOAuth2Provider({
        tokenUrl: config.tokenUrl,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        tenant: config.tenant,
        mode: config.mode,
      });
    }

    if (config.username && config.password) {
      return new InforBasicAuthProvider({
        username: config.username,
        password: config.password,
        mode: config.mode,
      });
    }

    return null;
  }
}

module.exports = InforConnection;
