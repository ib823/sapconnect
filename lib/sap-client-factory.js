/**
 * SAP Client Factory
 *
 * Creates pre-configured OData clients for SAP services.
 * Supports multiple authentication methods and system types.
 */

const ODataClient = require('./odata/client');
const { BasicAuthProvider, OAuth2ClientCredentialsProvider } = require('./odata/auth');
const Logger = require('./logger');

const SAP_SERVICES = {
  // S/4HANA Cloud APIs
  BUSINESS_PARTNER: '/sap/opu/odata/sap/API_BUSINESS_PARTNER',
  GL_ACCOUNT: '/sap/opu/odata4/sap/api_glaccountinchartofaccounts/srvd_a2x/sap/glaccountinchartofaccounts/0001',
  JOURNAL_ENTRY: '/sap/opu/odata4/sap/api_journalentry/srvd_a2x/sap/journalentry/0001',
  MATERIAL: '/sap/opu/odata/sap/API_PRODUCT_SRV',
  PURCHASE_ORDER: '/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV',
  SALES_ORDER: '/sap/opu/odata/sap/API_SALES_ORDER_SRV',
  COST_CENTER: '/sap/opu/odata/sap/API_COSTCENTER_SRV',
  PROFIT_CENTER: '/sap/opu/odata/sap/API_PROFITCENTER_SRV',
  FIXED_ASSET: '/sap/opu/odata/sap/API_FIXEDASSET_SRV',
  EQUIPMENT: '/sap/opu/odata/sap/API_EQUIPMENT_SRV',
  MAINTENANCE_ORDER: '/sap/opu/odata/sap/API_MAINTENANCEORDER',
  PRODUCTION_ORDER: '/sap/opu/odata/sap/API_PRODUCTION_ORDER_2_SRV',
  PLANT: '/sap/opu/odata/sap/API_PLANT_SRV',
  BANK: '/sap/opu/odata/sap/API_BANKDETAIL_SRV',
  EMPLOYEE: '/sap/opu/odata/sap/API_BUSINESS_PARTNER',
  BATCH: '/sap/opu/odata/sap/API_BATCH_SRV',

  // ECC OData (for source extraction)
  ECC_GL_BALANCE: '/sap/opu/odata/sap/ZFAGLFLEXT_CDS',
  ECC_CUSTOMER: '/sap/opu/odata/sap/ZCUSTOMER_MASTER_CDS',
  ECC_VENDOR: '/sap/opu/odata/sap/ZVENDOR_MASTER_CDS',
  ECC_MATERIAL: '/sap/opu/odata/sap/ZMARA_CDS',

  // Cloud ALM
  CLOUD_ALM_PROJECT: '/api/calm-projects/v1',
  CLOUD_ALM_TASK: '/api/calm-tasks/v1',
  CLOUD_ALM_REQUIREMENT: '/api/calm-requirements/v1',
};

class SapClientFactory {
  constructor(config = {}) {
    this.logger = new Logger('sap-client-factory', { level: config.logLevel || 'info' });
    this.systems = new Map();
    this._clients = new Map();

    if (config.systems) {
      for (const [name, systemConfig] of Object.entries(config.systems)) {
        this.registerSystem(name, systemConfig);
      }
    }
  }

  /**
   * Register a SAP system configuration
   */
  registerSystem(name, config) {
    this.systems.set(name, {
      baseUrl: config.baseUrl,
      authType: config.authType || 'basic',
      version: config.version || 'v2',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      credentials: config.credentials || {},
    });
    this.logger.info(`Registered system: ${name}`);
  }

  /**
   * Get or create an OData client for a system + service
   */
  getClient(systemName, serviceName) {
    const cacheKey = `${systemName}:${serviceName}`;
    if (this._clients.has(cacheKey)) {
      return this._clients.get(cacheKey);
    }

    const system = this.systems.get(systemName);
    if (!system) {
      throw new Error(`Unknown SAP system: ${systemName}. Register it with registerSystem() first.`);
    }

    const servicePath = SAP_SERVICES[serviceName] || serviceName;
    const authProvider = this._createAuthProvider(system);

    const client = new ODataClient({
      baseUrl: system.baseUrl,
      authProvider,
      version: system.version,
      timeout: system.timeout,
      retries: system.retries,
      logger: this.logger.child(serviceName),
    });

    // Attach service path for convenience
    client.servicePath = servicePath;
    this._clients.set(cacheKey, client);
    return client;
  }

  /**
   * Create a standalone client (no system registration required)
   */
  createClient(options) {
    const authProvider = this._createAuthProvider(options);
    return new ODataClient({
      baseUrl: options.baseUrl,
      authProvider,
      version: options.version || 'v2',
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      logger: this.logger.child('standalone'),
    });
  }

  /**
   * Get available service names
   */
  getServiceNames() {
    return Object.keys(SAP_SERVICES);
  }

  /**
   * Get service path by name
   */
  getServicePath(serviceName) {
    return SAP_SERVICES[serviceName] || null;
  }

  _createAuthProvider(config) {
    const creds = config.credentials || {};
    switch (config.authType) {
      case 'oauth2':
        return new OAuth2ClientCredentialsProvider(
          creds.tokenUrl,
          creds.clientId,
          creds.clientSecret,
          creds.scope,
        );
      case 'basic':
      default:
        return new BasicAuthProvider(
          creds.username,
          creds.password,
        );
    }
  }

  clearCache() {
    this._clients.clear();
  }
}

module.exports = { SapClientFactory, SAP_SERVICES };
