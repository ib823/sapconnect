const { SapClientFactory, SAP_SERVICES } = require('../../lib/sap-client-factory');

describe('SapClientFactory', () => {
  let factory;

  beforeEach(() => { factory = new SapClientFactory({ logLevel: 'error' }); });

  describe('registerSystem', () => {
    it('registers a system', () => {
      factory.registerSystem('dev', {
        baseUrl: 'https://dev.example.com',
        authType: 'basic',
        credentials: { username: 'user', password: 'pass' },
      });
      expect(factory.systems.has('dev')).toBe(true);
    });
  });

  describe('getClient', () => {
    it('creates client for registered system', () => {
      factory.registerSystem('dev', {
        baseUrl: 'https://dev.example.com',
        authType: 'basic',
        credentials: { username: 'user', password: 'pass' },
      });
      const client = factory.getClient('dev', 'BUSINESS_PARTNER');
      expect(client).toBeDefined();
      expect(client.baseUrl).toBe('https://dev.example.com');
    });

    it('caches clients', () => {
      factory.registerSystem('dev', {
        baseUrl: 'https://dev.example.com',
        credentials: {},
      });
      const client1 = factory.getClient('dev', 'BUSINESS_PARTNER');
      const client2 = factory.getClient('dev', 'BUSINESS_PARTNER');
      expect(client1).toBe(client2);
    });

    it('throws for unknown system', () => {
      expect(() => factory.getClient('unknown', 'BUSINESS_PARTNER')).toThrow(/Unknown SAP system/);
    });
  });

  describe('createClient', () => {
    it('creates standalone client', () => {
      const client = factory.createClient({
        baseUrl: 'https://test.example.com',
        authType: 'basic',
        credentials: { username: 'u', password: 'p' },
      });
      expect(client).toBeDefined();
      expect(client.baseUrl).toBe('https://test.example.com');
    });

    it('supports OAuth2', () => {
      const client = factory.createClient({
        baseUrl: 'https://test.example.com',
        authType: 'oauth2',
        credentials: {
          tokenUrl: 'https://auth.example.com/token',
          clientId: 'id',
          clientSecret: 'secret',
        },
      });
      expect(client).toBeDefined();
    });
  });

  describe('SAP_SERVICES', () => {
    it('has all expected service paths', () => {
      expect(SAP_SERVICES.BUSINESS_PARTNER).toContain('API_BUSINESS_PARTNER');
      expect(SAP_SERVICES.MATERIAL).toContain('API_PRODUCT');
      expect(SAP_SERVICES.PURCHASE_ORDER).toContain('API_PURCHASEORDER');
      expect(SAP_SERVICES.SALES_ORDER).toContain('API_SALES_ORDER');
    });

    it('has ECC extraction services', () => {
      expect(SAP_SERVICES.ECC_GL_BALANCE).toBeDefined();
      expect(SAP_SERVICES.ECC_CUSTOMER).toBeDefined();
      expect(SAP_SERVICES.ECC_VENDOR).toBeDefined();
    });

    it('has Cloud ALM services', () => {
      expect(SAP_SERVICES.CLOUD_ALM_PROJECT).toBeDefined();
      expect(SAP_SERVICES.CLOUD_ALM_TASK).toBeDefined();
    });
  });

  describe('getServiceNames', () => {
    it('returns all service names', () => {
      const names = factory.getServiceNames();
      expect(names.length).toBeGreaterThan(10);
      expect(names).toContain('BUSINESS_PARTNER');
    });
  });

  describe('getServicePath', () => {
    it('returns path for known service', () => {
      expect(factory.getServicePath('BUSINESS_PARTNER')).toContain('API_BUSINESS_PARTNER');
    });

    it('returns null for unknown service', () => {
      expect(factory.getServicePath('NONEXISTENT')).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('clears client cache', () => {
      factory.registerSystem('dev', { baseUrl: 'https://dev.example.com', credentials: {} });
      factory.getClient('dev', 'BUSINESS_PARTNER');
      factory.clearCache();
      // Next call should create a new client
      const newClient = factory.getClient('dev', 'BUSINESS_PARTNER');
      expect(newClient).toBeDefined();
    });
  });
});
